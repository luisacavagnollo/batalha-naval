package com.batalha_naval.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class RateLimiterServiceTest {

    private RateLimiterService rateLimiter;

    @BeforeEach
    void setUp() {
        rateLimiter = new RateLimiterService();
    }

    @Test
    void isBlocked_newKey_returnsFalse() {
        assertFalse(rateLimiter.isBlocked("192.168.1.1"));
    }

    @Test
    void isBlocked_underLimit_returnsFalse() {
        String key = "192.168.1.1";
        rateLimiter.recordAttempt(key);
        rateLimiter.recordAttempt(key);
        rateLimiter.recordAttempt(key);
        rateLimiter.recordAttempt(key);
        // 4 tentativas — ainda não bloqueado (limite é 5)
        assertFalse(rateLimiter.isBlocked(key));
    }

    @Test
    void isBlocked_atLimit_returnsTrue() {
        String key = "192.168.1.1";
        for (int i = 0; i < 5; i++) {
            rateLimiter.recordAttempt(key);
        }
        assertTrue(rateLimiter.isBlocked(key));
    }

    @Test
    void isBlocked_overLimit_returnsTrue() {
        String key = "brute-force";
        for (int i = 0; i < 10; i++) {
            rateLimiter.recordAttempt(key);
        }
        assertTrue(rateLimiter.isBlocked(key));
    }

    @Test
    void isBlocked_differentKeys_independent() {
        String ip1 = "10.0.0.1";
        String ip2 = "10.0.0.2";

        for (int i = 0; i < 5; i++) {
            rateLimiter.recordAttempt(ip1);
        }

        assertTrue(rateLimiter.isBlocked(ip1));
        assertFalse(rateLimiter.isBlocked(ip2));
    }

    @Test
    void resetAttempts_unblocksKey() {
        String key = "user:admin";
        for (int i = 0; i < 5; i++) {
            rateLimiter.recordAttempt(key);
        }
        assertTrue(rateLimiter.isBlocked(key));

        rateLimiter.resetAttempts(key);
        assertFalse(rateLimiter.isBlocked(key));
    }

    @Test
    void resetAttempts_nonExistentKey_doesNotThrow() {
        assertDoesNotThrow(() -> rateLimiter.resetAttempts("nonexistent"));
    }

    @Test
    void getRetryAfterSeconds_newKey_returnsZero() {
        assertEquals(0, rateLimiter.getRetryAfterSeconds("unknown"));
    }

    @Test
    void getRetryAfterSeconds_blockedKey_returnsPositiveValue() {
        String key = "blocked-ip";
        for (int i = 0; i < 5; i++) {
            rateLimiter.recordAttempt(key);
        }

        long retryAfter = rateLimiter.getRetryAfterSeconds(key);
        assertTrue(retryAfter > 0, "Retry-after should be positive for a just-blocked key");
        assertTrue(retryAfter <= 60, "Retry-after should not exceed window of 60 seconds");
    }

    @Test
    void recordAttempt_incrementsCount() {
        String key = "counter-test";
        assertFalse(rateLimiter.isBlocked(key));

        rateLimiter.recordAttempt(key);
        assertFalse(rateLimiter.isBlocked(key)); // 1

        rateLimiter.recordAttempt(key);
        assertFalse(rateLimiter.isBlocked(key)); // 2

        rateLimiter.recordAttempt(key);
        assertFalse(rateLimiter.isBlocked(key)); // 3

        rateLimiter.recordAttempt(key);
        assertFalse(rateLimiter.isBlocked(key)); // 4

        rateLimiter.recordAttempt(key);
        assertTrue(rateLimiter.isBlocked(key));  // 5 — bloqueado
    }

    @Test
    void recordAttempt_afterReset_startsNewWindow() {
        String key = "reset-window";
        for (int i = 0; i < 5; i++) {
            rateLimiter.recordAttempt(key);
        }
        assertTrue(rateLimiter.isBlocked(key));

        rateLimiter.resetAttempts(key);

        // Novo ciclo — 1 tentativa, não bloqueado
        rateLimiter.recordAttempt(key);
        assertFalse(rateLimiter.isBlocked(key));
    }

    @Test
    void isBlocked_worksWithUsernameKeys() {
        // O AuthController usa "user:username" como chave
        String key = "user:admin";
        for (int i = 0; i < 5; i++) {
            rateLimiter.recordAttempt(key);
        }
        assertTrue(rateLimiter.isBlocked(key));
        assertFalse(rateLimiter.isBlocked("user:other"));
    }

    @Test
    void concurrentAccess_threadSafe() throws InterruptedException {
        String key = "concurrent-key";

        // Disparar 10 threads, cada uma registrando 1 tentativa
        Thread[] threads = new Thread[10];
        for (int i = 0; i < 10; i++) {
            threads[i] = new Thread(() -> rateLimiter.recordAttempt(key));
            threads[i].start();
        }
        for (Thread t : threads) {
            t.join();
        }

        // Após 10 tentativas concorrentes, deve estar bloqueado
        assertTrue(rateLimiter.isBlocked(key));
    }
}
