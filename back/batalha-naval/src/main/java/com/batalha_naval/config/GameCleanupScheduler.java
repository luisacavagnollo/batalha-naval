package com.batalha_naval.config;

import com.batalha_naval.controller.GameController;
import com.batalha_naval.service.BotService;
import com.batalha_naval.service.GameService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class GameCleanupScheduler {

    private static final Logger log = LoggerFactory.getLogger(GameCleanupScheduler.class);
    private final GameService gameService;
    private final BotService botService;
    private final GameController gameController;

    public GameCleanupScheduler(GameService gameService, BotService botService, GameController gameController) {
        this.gameService = gameService;
        this.botService = botService;
        this.gameController = gameController;
    }

    /**
     * Executa a cada 5 minutos. Remove jogos abandonados da memória
     * e limpa estado do BotService e singlePlayerGames associados.
     */
    @Scheduled(fixedRate = 5 * 60_000, initialDelay = 60_000)
    public void cleanup() {
        List<String> removed = gameService.cleanupAbandonedGames();
        if (!removed.isEmpty()) {
            for (String gameId : removed) {
                botService.cleanup(gameId);
            }
            gameController.cleanupOrphanedSinglePlayerGames(removed);
            log.info("Cleanup: {} jogo(s) abandonado(s) removido(s) da memória.", removed.size());
        }
    }
}
