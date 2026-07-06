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
    public ResponseEntity<AuthResponse> register(@RequestBody AuthRequest request) {
        User user = userService.register(request.getUsername(), request.getEmail(), request.getPassword());
        String token = jwtUtil.generateToken(user.getUsername());
        return ResponseEntity.ok(new AuthResponse(token, user.getUsername()));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request, HttpServletRequest httpRequest) {
        String clientIp = getClientIp(httpRequest);

        if (rateLimiter.isBlocked(clientIp)) {
            long retryAfter = rateLimiter.getRetryAfterSeconds(clientIp);
            return ResponseEntity.status(429)
                    .header("Retry-After", String.valueOf(retryAfter))
                    .body(java.util.Map.of("error", "Muitas tentativas. Tente novamente em " + retryAfter + "s."));
        }

        return userService.authenticate(request.getUsername(), request.getPassword())
                .map(user -> {
                    rateLimiter.resetAttempts(clientIp);
                    String token = jwtUtil.generateToken(user.getUsername());
                    return ResponseEntity.ok((Object) new AuthResponse(token, user.getUsername()));
                })
                .orElseGet(() -> {
                    rateLimiter.recordAttempt(clientIp);
                    return ResponseEntity.status(401).body(java.util.Map.of("error", "Credenciais inválidas."));
                });
    }

    private String getClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isEmpty()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
