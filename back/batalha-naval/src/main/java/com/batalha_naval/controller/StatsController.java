package com.batalha_naval.controller;

import com.batalha_naval.dto.PlayerStatsResponse;
import com.batalha_naval.service.GameService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/stats")
public class StatsController {

    private final GameService gameService;

    public StatsController(GameService gameService) {
        this.gameService = gameService;
    }

    @GetMapping("/me")
    public ResponseEntity<PlayerStatsResponse> getMyStats(Principal principal) {
        PlayerStatsResponse stats = gameService.getPlayerStats(principal.getName());
        return ResponseEntity.ok(stats);
    }
}
