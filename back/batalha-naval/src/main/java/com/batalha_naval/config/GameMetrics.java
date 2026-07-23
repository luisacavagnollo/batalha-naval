package com.batalha_naval.config;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Tags;
import io.micrometer.core.instrument.Timer;
import org.springframework.stereotype.Component;

import java.util.concurrent.atomic.AtomicInteger;

@Component
public class GameMetrics {

    private final MeterRegistry meterRegistry;
    private final Counter gamesCreatedCounter;
    private final Counter matchmakingJoinsCounter;
    private final AtomicInteger activeGamesCount;
    private final Timer matchmakingWaitTimer;

    public GameMetrics(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;

        this.gamesCreatedCounter = Counter.builder("game.created.total")
                .description("Total number of games created")
                .register(meterRegistry);

        this.matchmakingJoinsCounter = Counter.builder("game.matchmaking.joins")
                .description("Total number of matchmaking queue joins")
                .register(meterRegistry);

        this.activeGamesCount = new AtomicInteger(0);
        Gauge.builder("game.active.count", activeGamesCount, AtomicInteger::get)
                .description("Current number of active games")
                .register(meterRegistry);

        this.matchmakingWaitTimer = Timer.builder("game.matchmaking.wait.time")
                .description("Time spent waiting in matchmaking queue")
                .register(meterRegistry);
    }

    public void incrementGamesCreated() {
        gamesCreatedCounter.increment();
    }

    public void recordShot(String result) {
        Counter.builder("game.shots.total")
                .tags(Tags.of("result", result))
                .description("Total number of shots fired")
                .register(meterRegistry)
                .increment();
    }

    public void incrementMatchmakingJoins() {
        matchmakingJoinsCounter.increment();
    }

    public void setActiveGamesCount(int count) {
        activeGamesCount.set(count);
    }

    public Timer getMatchmakingWaitTimer() {
        return matchmakingWaitTimer;
    }
}
