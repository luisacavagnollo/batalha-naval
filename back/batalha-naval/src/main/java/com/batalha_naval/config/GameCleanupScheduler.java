package com.batalha_naval.config;

import com.batalha_naval.service.GameService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class GameCleanupScheduler {

    private static final Logger log = LoggerFactory.getLogger(GameCleanupScheduler.class);
    private final GameService gameService;

    public GameCleanupScheduler(GameService gameService) {
        this.gameService = gameService;
    }

    /**
     * Executa a cada 5 minutos. Remove jogos abandonados da memória.
     */
    @Scheduled(fixedRate = 5 * 60_000, initialDelay = 60_000)
    public void cleanup() {
        int removed = gameService.cleanupAbandonedGames();
        if (removed > 0) {
            log.info("Cleanup: {} jogo(s) abandonado(s) removido(s) da memória.", removed);
        }
    }
}
