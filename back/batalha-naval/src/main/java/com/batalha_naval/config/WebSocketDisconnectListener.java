package com.batalha_naval.config;

import com.batalha_naval.domain.Game;
import com.batalha_naval.domain.GamePhase;
import com.batalha_naval.service.GameService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;
import java.util.Map;

/**
 * Detecta desconexões WebSocket e notifica o oponente quando um jogador sai temporariamente.
 */
@Component
public class WebSocketDisconnectListener {

    private static final Logger log = LoggerFactory.getLogger(WebSocketDisconnectListener.class);

    private final GameService gameService;
    private final SimpMessagingTemplate messaging;

    public WebSocketDisconnectListener(GameService gameService, SimpMessagingTemplate messaging) {
        this.gameService = gameService;
        this.messaging = messaging;
    }

    @EventListener
    public void handleDisconnect(SessionDisconnectEvent event) {
        Principal principal = event.getUser();
        if (principal == null) return;

        String playerId = principal.getName();
        log.info("Jogador desconectou: {}", playerId);

        // Buscar partida ativa do jogador
        Game game = gameService.findActiveGame(playerId);
        if (game == null) return;

        // Não notificar em partidas contra bot
        if ("BOT".equals(game.getPlayer2Id())) return;

        // Notificar o oponente que o jogador se desconectou
        String opponentId = game.getOpponentId(playerId);
        if (opponentId != null) {
            messaging.convertAndSendToUser(opponentId,
                    "/topic/game/" + game.getId() + "/opponent-status",
                    Map.of("status", "disconnected", "player", playerId));
            log.info("Notificando {} que {} desconectou da partida {}", opponentId, playerId, game.getId());
        }
    }
}
