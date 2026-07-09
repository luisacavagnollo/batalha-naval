package com.batalha_naval.controller;

import com.batalha_naval.dto.PlayerStatsResponse;
import com.batalha_naval.repository.GameRecordRepository;
import com.batalha_naval.service.GameService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/stats")
public class StatsController {

    private final GameService gameService;
    private final GameRecordRepository gameRecordRepository;

    public StatsController(GameService gameService, GameRecordRepository gameRecordRepository) {
        this.gameService = gameService;
        this.gameRecordRepository = gameRecordRepository;
    }

    @GetMapping("/me")
    public ResponseEntity<PlayerStatsResponse> getMyStats(Principal principal) {
        PlayerStatsResponse stats = gameService.getPlayerStats(principal.getName());
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/ranking")
    public ResponseEntity<List<Map<String, Object>>> getRanking() {
        List<Object[]> results = gameRecordRepository.findMultiplayerRanking();
        List<Map<String, Object>> ranking = results.stream()
                .limit(10)
                .map(row -> {
                    Map<String, Object> entry = new LinkedHashMap<>();
                    entry.put("username", row[0]);
                    entry.put("wins", ((Number) row[1]).intValue());
                    return entry;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(ranking);
    }
}
