package com.batalha_naval.controller;

import com.batalha_naval.repository.GameRecordRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.*;
import java.util.stream.Collectors;

@RestController
public class HealthController {

    private final GameRecordRepository gameRecordRepository;

    public HealthController(GameRecordRepository gameRecordRepository) {
        this.gameRecordRepository = gameRecordRepository;
    }

    @GetMapping("/api/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "ok"));
    }

    @GetMapping("/api/auth/ranking")
    public ResponseEntity<List<Map<String, Object>>> publicRanking() {
        List<Object[]> results;
        try {
            results = gameRecordRepository.findMultiplayerRankingNative();
        } catch (Exception e) {
            try {
                results = gameRecordRepository.findMultiplayerRanking();
            } catch (Exception e2) {
                return ResponseEntity.ok(List.of());
            }
        }
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
