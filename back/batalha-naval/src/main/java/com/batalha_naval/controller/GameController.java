package com.batalha_naval.controller;

import com.batalha_naval.domain.*;
import com.batalha_naval.dto.EmoteMessage;
import com.batalha_naval.dto.GameMessage;
import com.batalha_naval.dto.GameStateResponse;
import com.batalha_naval.service.BotService;
import com.batalha_naval.service.GameService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Controller
@EnableScheduling
public class GameController {

    private final GameService gameService;
    private final BotService botService;
    private final SimpMessagingTemplate messaging;
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(2);

    // Guarda quais games são singleplayer
    private final Set<String> singlePlayerGames = ConcurrentHashMap.newKeySet();
    private final com.batalha_naval.service.MatchmakingService matchmakingService;

    public GameController(GameService gameService, BotService botService, SimpMessagingTemplate messaging, com.batalha_naval.service.MatchmakingService matchmakingService) {
        this.gameService = gameService;
        this.botService = botService;
        this.messaging = messaging;
        this.matchmakingService = matchmakingService;
    }

    @MessageMapping("/game/matchmaking/join")
    public void joinMatchmaking(Principal principal) {
        if (principal == null) {
            return; // Conexão não autenticada — ignorar
        }
        String playerId = principal.getName();
        Game game = matchmakingService.joinQueue(playerId);

        if (game != null) {
            // Par encontrado — set player2 skin
            game.setPlayer2Skin(gameService.getPlayerSkin(game.getPlayer2Id()));

            // Notificar ambos os jogadores
            String p1 = game.getPlayer1Id();
            String p2 = game.getPlayer2Id();
            Map<String, Object> payload = Map.of("gameId", game.getId(), "matchmaking", true);
            messaging.convertAndSendToUser(p1, "/topic/game/created", payload);
            messaging.convertAndSendToUser(p2, "/topic/game/created", payload);

            // Enviar gameState após delay para dar tempo do frontend subscrever
            scheduler.schedule(() -> sendGameStateToPlayers(game), 300, TimeUnit.MILLISECONDS);
        }
        // Se retornou null, jogador entrou na fila — aguarda
    }

    @MessageMapping("/game/matchmaking/leave")
    public void leaveMatchmaking(Principal principal) {
        if (principal == null) return;
        String playerId = principal.getName();
        matchmakingService.leaveQueue(playerId);
    }

    @MessageMapping("/game/create")
    public void createRoom(Principal principal) {
        if (principal == null) return;
        String playerId = principal.getName();
        Game game = gameService.createGame(playerId);
        messaging.convertAndSendToUser(playerId, "/topic/game/created",
                Map.of("gameId", game.getId()));
    }

    @MessageMapping("/game/join")
    public void joinRoom(GameMessage msg, Principal principal) {
        if (principal == null) return;
        String playerId = principal.getName();
        try {
            Game game = gameService.joinGame(msg.getGameId(), playerId);
            sendGameStateToPlayers(game);
        } catch (Exception e) {
            messaging.convertAndSendToUser(playerId, "/topic/game/error",
                    Map.of("message", e.getMessage()));
        }
    }

    @MessageMapping("/game/single-player")
    public void startSinglePlayer(Principal principal) {
        if (principal == null) return;
        String playerId = principal.getName();
        Game game = gameService.createGame(playerId);
        game.setPlayer2Id(BotService.BOT_ID);
        game.setPlayer2Skin("pirate");
        singlePlayerGames.add(game.getId());

        // Bot posiciona navios automaticamente
        botService.placeShipsRandomly(game);

        // Envia gameId para o front subscrever e depois o gameState
        messaging.convertAndSendToUser(playerId, "/topic/game/created",
                Map.of("gameId", game.getId(), "singlePlayer", true));

        // Envia gameState logo após (o front já vai ter subscrito no onConnect via /created handler)
        scheduler.schedule(() -> {
            String dest = "/topic/game/" + game.getId();
            messaging.convertAndSendToUser(playerId, dest, buildResponse(game, playerId));
        }, 300, TimeUnit.MILLISECONDS);
    }

    @MessageMapping("/game/place-ship")
    public void placeShip(GameMessage msg, Principal principal) {
        if (principal == null) return;
        String playerId = principal.getName();
        try {
            if (msg.getShipType() == null || msg.getOrientation() == null || msg.getGameId() == null) {
                messaging.convertAndSendToUser(playerId, "/topic/game/error",
                        Map.of("message", "Dados incompletos para posicionar navio"));
                return;
            }
            gameService.placeShip(
                    msg.getGameId(), playerId,
                    ShipType.valueOf(msg.getShipType()),
                    msg.getRow(), msg.getCol(),
                    Orientation.valueOf(msg.getOrientation()));
            Game game = gameService.getGame(msg.getGameId());
            sendGameStateToPlayers(game);

            // Se é singleplayer e o jogo acabou de iniciar com turno do bot
            if (singlePlayerGames.contains(game.getId()) && isBotTurn(game)) {
                scheduleBotTurn(game);
            }
        } catch (Exception e) {
            messaging.convertAndSendToUser(playerId, "/topic/game/error",
                    Map.of("message", e.getMessage() != null ? e.getMessage() : "Erro ao posicionar navio"));
        }
    }

    @MessageMapping("/game/shoot")
    public void shoot(GameMessage msg, Principal principal) {
        if (principal == null) return;
        String playerId = principal.getName();
        gameService.shoot(msg.getGameId(), playerId, msg.getRow(), msg.getCol());
        Game game = gameService.getGame(msg.getGameId());
        sendGameStateToPlayers(game);

        // Se é singleplayer e agora é o turno do bot, o bot responde
        if (singlePlayerGames.contains(game.getId()) && isBotTurn(game)) {
            scheduleBotTurn(game);
        }
    }

    @MessageMapping("/game/emote")
    public void sendEmote(EmoteMessage msg, Principal principal) {
        if (principal == null) return;
        String playerId = principal.getName();
        Game game = gameService.getGame(msg.getGameId());
        String opponentId = game.getOpponentId(playerId);
        if (opponentId != null && !opponentId.equals(BotService.BOT_ID)) {
            msg.setFromPlayer(playerId);
            messaging.convertAndSendToUser(opponentId,
                    "/topic/game/" + game.getId() + "/emote", msg);
        }
    }

    @MessageMapping("/game/surrender")
    public void surrender(GameMessage msg, Principal principal) {
        if (principal == null) return;
        String playerId = principal.getName();
        try {
            Game game = gameService.surrender(msg.getGameId(), playerId);
            sendGameStateToPlayers(game);

            // Limpa singleplayer se aplicável
            if (singlePlayerGames.contains(game.getId())) {
                botService.cleanup(game.getId());
                singlePlayerGames.remove(game.getId());
            }
        } catch (Exception e) {
            messaging.convertAndSendToUser(playerId, "/topic/game/error",
                    Map.of("message", e.getMessage()));
        }
    }

    @MessageMapping("/game/rematch")
    public void rematch(GameMessage msg, Principal principal) {
        if (principal == null) return;
        String playerId = principal.getName();
        try {
            Game oldGame = gameService.getGame(msg.getGameId());
            // Apenas jogadores da partida podem pedir rematch
            if (!playerId.equals(oldGame.getPlayer1Id()) && !playerId.equals(oldGame.getPlayer2Id())) {
                messaging.convertAndSendToUser(playerId, "/topic/game/error",
                        Map.of("message", "Você não faz parte desta partida"));
                return;
            }

            // Se é singleplayer, cria imediatamente
            if (singlePlayerGames.contains(msg.getGameId())) {
                Game newGame = gameService.rematch(msg.getGameId());
                singlePlayerGames.add(newGame.getId());
                newGame.setPlayer2Id(BotService.BOT_ID);
                newGame.setPlayer2Skin("pirate");
                botService.placeShipsRandomly(newGame);
                Map<String, Object> payload = Map.of("gameId", newGame.getId(), "rematch", true);
                messaging.convertAndSendToUser(playerId, "/topic/game/created", payload);
                return;
            }

            // Registrar pedido de rematch
            boolean bothReady = oldGame.requestRematch(playerId);

            if (bothReady) {
                // Ambos aceitaram — criar nova partida
                Game newGame = gameService.rematch(msg.getGameId());
                String p1 = newGame.getPlayer1Id();
                String p2 = newGame.getPlayer2Id();
                Map<String, Object> payload = Map.of("gameId", newGame.getId(), "rematch", true);
                messaging.convertAndSendToUser(p1, "/topic/game/created", payload);
                if (p2 != null) {
                    messaging.convertAndSendToUser(p2, "/topic/game/created", payload);
                }
            } else {
                // Notificar o oponente que este jogador quer rematch
                String opponentId = oldGame.getOpponentId(playerId);
                if (opponentId != null) {
                    messaging.convertAndSendToUser(opponentId, "/topic/game/" + msg.getGameId() + "/rematch-request",
                            Map.of("from", playerId));
                }
                // Confirmar ao jogador que o pedido foi registrado
                messaging.convertAndSendToUser(playerId, "/topic/game/" + msg.getGameId() + "/rematch-pending",
                        Map.of("waiting", true));
            }
        } catch (Exception e) {
            messaging.convertAndSendToUser(playerId, "/topic/game/error",
                    Map.of("message", e.getMessage()));
        }
    }

    private boolean isBotTurn(Game game) {
        return game.getPhase() == GamePhase.IN_PROGRESS
                && BotService.BOT_ID.equals(game.getCurrentTurnPlayerId());
    }

    private void scheduleBotTurn(Game game) {
        scheduler.schedule(() -> executeBotTurn(game), 1, TimeUnit.SECONDS);
    }

    private void executeBotTurn(Game game) {
        if (game.getPhase() != GamePhase.IN_PROGRESS) return;
        if (!BotService.BOT_ID.equals(game.getCurrentTurnPlayerId())) return;

        int[] shot = botService.chooseShot(game.getId());
        if (shot == null) return;

        ShotOutcome outcome = game.shoot(BotService.BOT_ID, shot[0], shot[1]);
        if (outcome == null) {
            // Tiro inválido (célula já atacada), tenta outro
            executeBotTurn(game);
            return;
        }

        // Se acertou, registra para Hunt/Target
        if (outcome.getResult() == ShotResult.HIT || outcome.getResult() == ShotResult.SUNK) {
            botService.registerHit(game.getId(), shot[0], shot[1]);
        }
        if (outcome.getResult() == ShotResult.SUNK) {
            botService.registerSunk(game.getId(), shot[0], shot[1]);
        }

        sendGameStateToPlayers(game);

        // Se o bot ainda tem turno (acertou) e o jogo não acabou, joga novamente
        if (isBotTurn(game)) {
            scheduleBotTurn(game);
        }

        // Limpa estado do bot se o jogo acabou
        if (game.getPhase() == GamePhase.FINISHED) {
            botService.cleanup(game.getId());
            singlePlayerGames.remove(game.getId());
        }
    }

    private void sendGameStateToPlayers(Game game) {
        String dest = "/topic/game/" + game.getId();
        String p1 = game.getPlayer1Id();
        String p2 = game.getPlayer2Id();

        messaging.convertAndSendToUser(p1, dest, buildResponse(game, p1));
        if (p2 != null && !p2.equals(BotService.BOT_ID)) {
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
        java.util.List<int[]> sunkCells = outcome != null ? outcome.getSunkShipCells() : null;

        // Each player uses their own equipped skin
        String p1Skin = game.getPlayer1Skin() != null ? game.getPlayer1Skin() : "padrao_antigo";
        String p2Skin = game.getPlayer2Skin() != null ? game.getPlayer2Skin() : "padrao_antigo";
        String mySkin = playerId.equals(game.getPlayer1Id()) ? p1Skin : p2Skin;
        String opponentSkin = playerId.equals(game.getPlayer1Id()) ? p2Skin : p1Skin;

        // Construir lista de navios do jogador com posições reais
        java.util.List<GameStateResponse.ShipInfo> myShips = myBoard.getShips().stream()
                .map(ship -> new GameStateResponse.ShipInfo(
                        ship.getType().name(),
                        ship.getStartRow(),
                        ship.getStartCol(),
                        ship.getSize(),
                        ship.getOrientation().name(),
                        ship.isSunk()
                ))
                .collect(java.util.stream.Collectors.toList());

        // Revela tabuleiro do oponente quando o jogo termina
        CellState[][] opponentView = game.getPhase() == GamePhase.FINISHED
                ? opponentBoard.getGridForOwner()
                : opponentBoard.getGridForOpponent();

        return new GameStateResponse(
                game.getId(),
                game.getPhase().name(),
                game.getCurrentTurnPlayerId(),
                myBoard.getGridForOwner(),
                opponentView,
                playerId.equals(game.getCurrentTurnPlayerId()),
                game.getWinnerId(),
                lastResult,
                sunkType,
                mySkin,
                opponentSkin,
                sunkCells,
                myShips);
    }
}
