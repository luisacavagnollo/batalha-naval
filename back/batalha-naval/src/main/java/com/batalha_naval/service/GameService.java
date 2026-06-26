package com.batalha_naval.service;

import com.batalha_naval.domain.*;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class GameService {

    private final ConcurrentHashMap<String, Game> games = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Integer> scores = new ConcurrentHashMap<>();

    public Game createGame(String playerId) {
        Game game = new Game();
        game.setId(UUID.randomUUID().toString());
        game.setPlayer1Id(playerId);
        games.put(game.getId(), game);
        return game;
    }

    public Game joinGame(String gameId, String playerId) {
        Game game = getGame(gameId);
        if (game.getPlayer2Id() != null) {
            throw new IllegalStateException("Game is already full");
        }
        game.setPlayer2Id(playerId);
        return game;
    }

    public String findOrCreateGame(String playerId) {
        for (Game game : games.values()) {
            if (game.getPlayer2Id() == null && !playerId.equals(game.getPlayer1Id())) {
                joinGame(game.getId(), playerId);
                return game.getId();
            }
        }
        return createGame(playerId).getId();
    }

    public Game getGame(String gameId) {
        Game game = games.get(gameId);
        if (game == null) {
            throw new IllegalArgumentException("Game not found: " + gameId);
        }
        return game;
    }

    public boolean placeShip(String gameId, String playerId, ShipType type, int row, int col, Orientation orientation) {
        Game game = getGame(gameId);
        boolean result = game.placeShip(playerId, type, row, col, orientation);
        if (result) {
            game.startGameIfReady();
        }
        return result;
    }

    public ShotOutcome shoot(String gameId, String playerId, int row, int col) {
        Game game = getGame(gameId);
        ShotOutcome outcome = game.shoot(playerId, row, col);
        if (outcome != null && game.getPhase() == GamePhase.FINISHED) {
            scores.merge(game.getWinnerId(), 1, Integer::sum);
        }
        return outcome;
    }

    public Map<String, Integer> getScores() {
        return scores;
    }

    public int getPlayerScore(String playerId) {
        return scores.getOrDefault(playerId, 0);
    }
}
