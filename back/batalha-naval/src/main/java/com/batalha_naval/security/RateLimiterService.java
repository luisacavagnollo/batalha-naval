package com.batalha_naval.security;

import org.springframework.stereotype.Component;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Rate limiter simples por IP para proteção contra brute force.
 * Permite MAX_ATTEMPTS tentativas por janela de WINDOW_MS milissegundos.
 */
@Component
public class RateLimiterService {

    private static final int MAX_ATTEMPTS = 5;
    private static final long WINDOW_MS = 60_000; // 1 minuto

    private final ConcurrentHashMap<String, RateEntry> attempts = new ConcurrentHashMap<>();

    public boolean isBlocked(String key) {
        RateEntry entry = attempts.get(key);
        if (entry == null) return false;

        // Se a janela expirou, reseta
        if (System.currentTimeMillis() - entry.windowStart > WINDOW_MS) {
            attempts.remove(key);
            return false;
        }

        return entry.count.get() >= MAX_ATTEMPTS;
    }

    public void recordAttempt(String key) {
        attempts.compute(key, (k, entry) -> {
            long now = System.currentTimeMillis();
            if (entry == null || now - entry.windowStart > WINDOW_MS) {
                return new RateEntry(now, new AtomicInteger(1));
            }
            entry.count.incrementAndGet();
            return entry;
        });
    }

    public void resetAttempts(String key) {
        attempts.remove(key);
    }

    public long getRetryAfterSeconds(String key) {
        RateEntry entry = attempts.get(key);
        if (entry == null) return 0;
        long elapsed = System.currentTimeMillis() - entry.windowStart;
        long remaining = WINDOW_MS - elapsed;
        return Math.max(0, remaining / 1000);
    }

    private static class RateEntry {
        final long windowStart;
        final AtomicInteger count;

        RateEntry(long windowStart, AtomicInteger count) {
            this.windowStart = windowStart;
            this.count = count;
        }
    }
}
