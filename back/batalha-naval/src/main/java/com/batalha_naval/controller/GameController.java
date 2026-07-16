package com.batalha_naval.controller;

import com.batalha_naval.domain.*;
import com.batalha_naval.dto.EmoteMessage;
import com.batalha_naval.dto.GameMessage;
import com.batalha_naval.dto.GameStateResponse;
import com.batalha_naval.exception.GameFullException;
import com.batalha_naval.exception.GameNotFoundException;
import com.batalha_naval.exception.InvalidActionException;
import com.batalha_naval.service.BotService;
import com.batalha_naval.service.GameService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.stereotype.Controller;

import javax.annotation.PreDestroy;
import javax.validation.ConstraintViolation;
import javax.validation.Validator;
import java.security.Principal;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Controller
@EnableScheduling
public class GameController {

    private final GameService gameService;
    private final BotService botService;
    private final SimpMessagingTemplate messaging;
    private final Validator validator;
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(2);

    // Guarda quais games são singleplayer
    private final Set<String> singlePlayerGames = ConcurrentHashMap.newKeySet();
    // Evita execução simultânea do bot para o mesmo jogo
    private final Set<String> botTurnInProgress = ConcurrentHashMap.newKeySet();
    private final com.batalha_naval.service.MatchmakingService matchmakingService;

    public GameController(GameService gameService, BotService botService, SimpMessagingTemplate messaging, com.batalha_naval.service.MatchmakingService matchmakingService, Validator validator) {
        this.gameService = gameService;
        this.botService = botService;
        this.messaging = messaging;
        this.matchmakingService = matchmakingService;
        this.validator = validator;
    }

    /**
     * Valida um DTO programaticamente (necessário para @MessageMapping, onde @Valid não funciona).
     * Retorna a primeira mensagem de erro, ou null se válido.
     */
    private <T> String validate(T dto) {
        Set<ConstraintViolation<T>> violations = validator.validate(dto);
        if (violations.isEmpty()) return null;
        return violations.stream()
                .map(ConstraintViolation::getMessage)
                .collect(Collectors.joining("; "));
    }

    @PreDestroy
    public void shutdown() {
        scheduler.shutdownNow();
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

    /**
     * Re-envia o estado atual do jogo para o jogador que solicitou.
     * Usado após reconexão (page reload, perda de conexão) para sincronizar o frontend.
     */
    @MessageMapping("/game/state")
    public void requestGameState(GameMessage msg, Principal principal) {
        if (principal == null) return;
        String playerId = principal.getName();
        if (msg.getGameId() == null) return;
        try {
            Game game = gameService.getGame(msg.getGameId());
            // Verificar se o jogador faz parte da partida
            if (!playerId.equals(game.getPlayer1Id()) && !playerId.equals(game.getPlayer2Id())) {
                return;
            }
            String dest = "/topic/game/" + game.getId();
            messaging.convertAndSendToUser(playerId, dest, buildResponse(game, playerId));

            // Se é singleplayer e é turno do bot, reativar o bot (pode ter parado após reconexão)
            if (singlePlayerGames.contains(game.getId()) && botService.isBotTurn(game)) {
                scheduleBotTurn(game);
            }
        } catch (GameNotFoundException e) {
            messaging.convertAndSendToUser(playerId, "/topic/game/error",
                    Map.of("message", "Partida não encontrada ou já encerrada"));
        }
    }

    @MessageMapping("/game/join")
    public void joinRoom(GameMessage msg, Principal principal) {
        if (principal == null) return;
        String playerId = principal.getName();
        if (msg.getGameId() == null || msg.getGameId().isBlank()) {
            messaging.convertAndSendToUser(playerId, "/topic/game/error",
                    Map.of("message", "Código da sala é obrigatório"));
            return;
        }
        try {
            Game game = gameService.joinGame(msg.getGameId(), playerId);
            sendGameStateToPlayers(game);
        } catch (GameNotFoundException e) {
            messaging.convertAndSendToUser(playerId, "/topic/game/error",
                    Map.of("message", "Sala não encontrada"));
        } catch (GameFullException e) {
            messaging.convertAndSendToUser(playerId, "/topic/game/error",
                    Map.of("message", "Sala já está cheia"));
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
        // Validar campos obrigatórios para place-ship
        if (msg.getGameId() == null || msg.getShipType() == null || msg.getOrientation() == null
                || msg.getRow() == null || msg.getCol() == null) {
            messaging.convertAndSendToUser(playerId, "/topic/game/error",
                    Map.of("message", "Dados incompletos para posicionar navio"));
            return;
        }
        // Validar constraints do DTO (bounds 0-9, tamanho do gameId)
        String validationError = validate(msg);
        if (validationError != null) {
            messaging.convertAndSendToUser(playerId, "/topic/game/error",
                    Map.of("message", validationError));
            return;
        }
        try {
            gameService.placeShip(
                    msg.getGameId(), playerId,
                    ShipType.valueOf(msg.getShipType()),
                    msg.getRow(), msg.getCol(),
                    Orientation.valueOf(msg.getOrientation()));
            Game game = gameService.getGame(msg.getGameId());
            sendGameStateToPlayers(game);

            // Se é singleplayer e o jogo acabou de iniciar com turno do bot
            if (singlePlayerGames.contains(game.getId()) && botService.isBotTurn(game)) {
                scheduleBotTurn(game);
            }
        } catch (GameNotFoundException e) {
            messaging.convertAndSendToUser(playerId, "/topic/game/error",
                    Map.of("message", "Sala não encontrada"));
        } catch (IllegalArgumentException e) {
            messaging.convertAndSendToUser(playerId, "/topic/game/error",
                    Map.of("message", e.getMessage() != null ? e.getMessage() : "Dados inválidos"));
        }
    }

    @MessageMapping("/game/shoot")
    public void shoot(GameMessage msg, Principal principal) {
        if (principal == null) return;
        String playerId = principal.getName();
        if (msg.getGameId() == null || msg.getRow() == null || msg.getCol() == null) {
            messaging.convertAndSendToUser(playerId, "/topic/game/error",
                    Map.of("message", "Dados incompletos para disparo"));
            return;
        }
        // Validar constraints do DTO (bounds 0-9, tamanho do gameId)
        String validationError = validate(msg);
        if (validationError != null) {
            messaging.convertAndSendToUser(playerId, "/topic/game/error",
                    Map.of("message", validationError));
            return;
        }
        try {
            gameService.shoot(msg.getGameId(), playerId, msg.getRow(), msg.getCol());
            Game game = gameService.getGame(msg.getGameId());
            sendGameStateToPlayers(game);

            // Se é singleplayer e agora é o turno do bot, o bot responde
            if (singlePlayerGames.contains(game.getId()) && botService.isBotTurn(game)) {
                scheduleBotTurn(game);
            }
        } catch (GameNotFoundException e) {
            messaging.convertAndSendToUser(playerId, "/topic/game/error",
                    Map.of("message", "Sala não encontrada"));
        } catch (InvalidActionException e) {
            messaging.convertAndSendToUser(playerId, "/topic/game/error",
                    Map.of("message", e.getMessage()));
        }
    }

    @MessageMapping("/game/leave")
    public void leaveGame(GameMessage msg, Principal principal) {
        if (principal == null) return;
        String playerId = principal.getName();
        if (msg.getGameId() == null) return;
        try {
            // Limpar estado do bot se for singleplayer
            if (singlePlayerGames.contains(msg.getGameId())) {
                botService.cleanup(msg.getGameId());
                singlePlayerGames.remove(msg.getGameId());
            }
            gameService.abandonGame(msg.getGameId(), playerId);
        } catch (GameNotFoundException e) {
            // Jogo já foi removido — ignorar silenciosamente
        }
    }

    @MessageMapping("/game/emote")
    public void sendEmote(EmoteMessage msg, Principal principal) {
        if (principal == null) return;
        String playerId = principal.getName();
        String validationError = validate(msg);
        if (validationError != null) return; // Emotes inválidos são silenciosamente ignorados
        try {
            Game game = gameService.getGame(msg.getGameId());
            String opponentId = game.getOpponentId(playerId);
            if (opponentId != null && !opponentId.equals(BotService.BOT_ID)) {
                msg.setFromPlayer(playerId);
                messaging.convertAndSendToUser(opponentId,
                        "/topic/game/" + game.getId() + "/emote", msg);
            }
        } catch (GameNotFoundException e) {
            // Jogo não encontrado — emote descartado silenciosamente
        }
    }

    @MessageMapping("/game/surrender")
    public void surrender(GameMessage msg, Principal principal) {
        if (principal == null) return;
        String playerId = principal.getName();
        if (msg.getGameId() == null) {
            messaging.convertAndSendToUser(playerId, "/topic/game/error",
                    Map.of("message", "gameId é obrigatório"));
            return;
        }
        try {
            Game game = gameService.surrender(msg.getGameId(), playerId);
            sendGameStateToPlayers(game);

            // Limpa singleplayer se aplicável
            if (singlePlayerGames.contains(game.getId())) {
                botService.cleanup(game.getId());
                singlePlayerGames.remove(game.getId());
            }
        } catch (GameNotFoundException e) {
            messaging.convertAndSendToUser(playerId, "/topic/game/error",
                    Map.of("message", "Sala não encontrada"));
        } catch (InvalidActionException e) {
            messaging.convertAndSendToUser(playerId, "/topic/game/error",
                    Map.of("message", e.getMessage()));
        }
    }

    @MessageMapping("/game/rematch")
    public void rematch(GameMessage msg, Principal principal) {
        if (principal == null) return;
        String playerId = principal.getName();
        if (msg.getGameId() == null) {
            messaging.convertAndSendToUser(playerId, "/topic/game/error",
                    Map.of("message", "gameId é obrigatório"));
            return;
        }
        try {
            Game oldGame = gameService.getGame(msg.getGameId());
            // Apenas jogadores da partida podem pedir rematch
            if (!playerId.equals(oldGame.getPlayer1Id()) && !playerId.equals(oldGame.getPlayer2Id())) {
                messaging.convertAndSendToUser(playerId, "/topic/game/error",
                        Map.of("message", "Você não faz parte desta partida"));
                return;
            }

            // Se é singleplayer, cria imediatamente
            if (BotService.BOT_ID.equals(oldGame.getPlayer2Id())) {
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
        } catch (GameNotFoundException e) {
            messaging.convertAndSendToUser(playerId, "/topic/game/error",
                    Map.of("message", "Sala não encontrada"));
        } catch (InvalidActionException e) {
            messaging.convertAndSendToUser(playerId, "/topic/game/error",
                    Map.of("message", e.getMessage()));
        }
    }

    /**
     * Chamado pelo scheduler para limpar IDs órfãos de jogos já removidos.
     */
    public void cleanupOrphanedSinglePlayerGames(java.util.List<String> removedGameIds) {
        for (String id : removedGameIds) {
            singlePlayerGames.remove(id);
            botTurnInProgress.remove(id);
        }
    }

    private void scheduleBotTurn(Game game) {
        scheduler.schedule(() -> executeBotTurn(game), 1, TimeUnit.SECONDS);
    }

    private void executeBotTurn(Game game) {
        if (!botTurnInProgress.add(game.getId())) {
            return;
        }

        try {
            boolean finished = botService.executeTurn(game, () -> sendGameStateToPlayers(game));
            if (finished) {
                singlePlayerGames.remove(game.getId());
            }
        } finally {
            botTurnInProgress.remove(game.getId());
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

        // Nome do oponente
        String opponentId = game.getOpponentId(playerId);
        String opponentName = opponentId != null
                ? (BotService.BOT_ID.equals(opponentId) ? "Capitão Bot" : opponentId)
                : null;

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
                opponentName,
                sunkCells,
                myShips);
    }
}
