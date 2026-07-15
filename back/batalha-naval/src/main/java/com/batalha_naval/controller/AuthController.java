package com.batalha_naval.controller;

import com.batalha_naval.dto.AuthRequest;
import com.batalha_naval.dto.AuthResponse;
import com.batalha_naval.security.JwtUtil;
import com.batalha_naval.security.RateLimiterService;
import com.batalha_naval.service.UserService;
import com.batalha_naval.model.User;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final JwtUtil jwtUtil;
    private final RateLimiterService rateLimiter;

    public AuthController(UserService userService, JwtUtil jwtUtil, RateLimiterService rateLimiter) {
        this.userService = userService;
        this.jwtUtil = jwtUtil;
        this.rateLimiter = rateLimiter;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody AuthRequest request) {
        try {
            User user = userService.register(request.getUsername(), request.getEmail(), request.getPassword());
            String token = jwtUtil.generateToken(user.getUsername());
            return ResponseEntity.ok(new AuthResponse(token, user.getUsername()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(409)
                    .body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AuthRequest request, HttpServletRequest httpRequest) {
        String clientIp = getClientIp(httpRequest);
        String userKey = "user:" + (request.getUsername() != null ? request.getUsername().toLowerCase() : "");

        // Rate limit por IP
        if (rateLimiter.isBlocked(clientIp)) {
            long retryAfter = rateLimiter.getRetryAfterSeconds(clientIp);
            return ResponseEntity.status(429)
                    .header("Retry-After", String.valueOf(retryAfter))
                    .body(java.util.Map.of("error", "Muitas tentativas. Tente novamente em " + retryAfter + "s."));
        }

        // Rate limit por username (protege contra brute force distribuído)
        if (rateLimiter.isBlocked(userKey)) {
            long retryAfter = rateLimiter.getRetryAfterSeconds(userKey);
            return ResponseEntity.status(429)
                    .header("Retry-After", String.valueOf(retryAfter))
                    .body(java.util.Map.of("error", "Muitas tentativas para este usuário. Tente novamente em " + retryAfter + "s."));
        }

        return userService.authenticate(request.getUsername(), request.getPassword())
                .map(user -> {
                    rateLimiter.resetAttempts(clientIp);
                    rateLimiter.resetAttempts(userKey);
                    String token = jwtUtil.generateToken(user.getUsername());
                    return ResponseEntity.ok((Object) new AuthResponse(token, user.getUsername()));
                })
                .orElseGet(() -> {
                    rateLimiter.recordAttempt(clientIp);
                    rateLimiter.recordAttempt(userKey);
                    return ResponseEntity.status(401).body(java.util.Map.of("error", "Credenciais inválidas."));
                });
    }

    private String getClientIp(HttpServletRequest request) {
        // Em produção atrás de proxy reverso (Render, Railway, Heroku),
        // o proxy define X-Forwarded-For corretamente.
        // Usamos o primeiro IP (client real) + remoteAddr como fallback.
        String remoteAddr = request.getRemoteAddr();
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isEmpty()) {
            String clientIp = forwarded.split(",")[0].trim();
            // Validar que parece um IP (proteção básica contra spoofing com strings longas)
            if (clientIp.length() <= 45 && clientIp.matches("[0-9a-fA-F.:]+")) {
                return clientIp;
            }
        }
        return remoteAddr;
    }
}
