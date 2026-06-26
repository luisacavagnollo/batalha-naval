package com.batalha_naval.controller;

import com.batalha_naval.domain.*;
import com.batalha_naval.dto.EmoteMessage;
import com.batalha_naval.dto.GameMessage;
import com.batalha_naval.dto.GameStateResponse;
import com.batalha_naval.service.GameService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.Map;

@Controller
public class GameController {

    private final GameService gameService;
    private final SimpMessagingTemplate messaging;

    public GameController(GameService gameService, SimpMessagingTemplate messaging) {
        this.gameService = gameService;
        this.messaging = messaging;
    }

    @MessageMapping("/game/create")
    public void createRoom(Principal principal) {
        String playerId = principal.getName();
        Game game = gameService.createGame(playerId);
        messaging.convertAndSendToUser(playerId, "/topic/game/created",
                Map.of("gameId", game.getId()));
    }

    @MessageMapping("/game/join")
    public void joinRoom(GameMessage msg, Principal principal) {
        String playerId = principal.getName();
        try {
            Game game = gameService.joinGame(msg.getGameId(), playerId);
            sendGameStateToPlayers(game);
        } catch (Exception e) {
            messaging.convertAndSendToUser(playerId, "/topic/game/error",
                    Map.of("message", e.getMessage()));
        }
    }

    @MessageMapping("/game/place-ship")
    public void placeShip(GameMessage msg, Principal principal) {
        String playerId = principal.getName();
        gameService.placeShip(
                msg.getGameId(), playerId,
                ShipType.valueOf(msg.getShipType()),
                msg.getRow(), msg.getCol(),
                Orientation.valueOf(msg.getOrientation()));
        Game game = gameService.getGame(msg.getGameId());
        sendGameStateToPlayers(game);
    }

    @MessageMapping("/game/shoot")
    public void shoot(GameMessage msg, Principal principal) {
        String playerId = principal.getName();
        gameService.shoot(msg.getGameId(), playerId, msg.getRow(), msg.getCol());
        Game game = gameService.getGame(msg.getGameId());
        sendGameStateToPlayers(game);
    }

    @MessageMapping("/game/emote")
    public void sendEmote(EmoteMessage msg, Principal principal) {
        String playerId = principal.getName();
        Game game = gameService.getGame(msg.getGameId());
        String opponentId = game.getOpponentId(playerId);
        if (opponentId != null) {
            msg.setFromPlayer(playerId);
            messaging.convertAndSendToUser(opponentId,
                    "/topic/game/" + game.getId() + "/emote", msg);
        }
    }

    private void sendGameStateToPlayers(Game game) {
        String dest = "/topic/game/" + game.getId();
        String p1 = game.getPlayer1Id();
        String p2 = game.getPlayer2Id();

        messaging.convertAndSendToUser(p1, dest, buildResponse(game, p1));
        if (p2 != null) {
            messaging.convertAndSendToUser(p2, dest, buildResponse(game, p2));
        }
    }

    private GameStateResponse buildResponse(Game game, String playerId) {
        Board myBoard = playerId.equals(game.getPlayer1Id()) ? game.getBoard1() : game.getBoard2();
        Board opponentBoard = playerId.equals(game.getPlayer1Id()) ? game.getBoard2() : game.getBoard1();
        ShotOutcome outcome = game.getLastShotOutcome();
        String lastResult = outcome != null ? outcome.getResult().name() : null;
        String sunkType = outcome != null && outcome.getSunkShipType() != null
                ? outcome.getSunkShipType().name() : null;
        return new GameStateResponse(
                game.getId(),
                game.getPhase().name(),
                game.getCurrentTurnPlayerId(),
                myBoard.getGridForOwner(),
                opponentBoard.getGridForOpponent(),
                playerId.equals(game.getCurrentTurnPlayerId()),
                game.getWinnerId(),
                lastResult,
                sunkType);
    }
}
