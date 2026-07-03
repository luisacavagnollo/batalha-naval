package com.batalha_naval.service;

import com.batalha_naval.domain.*;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class GameService {

    private final ConcurrentHashMap<String, Game> games = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, String> codeToGameId = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Integer> scores = new ConcurrentHashMap<>();
    private final Random random = new Random();

    public Game createGame(String playerId) {
        Game game = new Game();
        String code = generateCode();
        game.setId(code);
        game.setPlayer1Id(playerId);
        game.setPlayer1Skin(random.nextBoolean() ? "padrao" : "pirate");
        games.put(code, game);
        codeToGameId.put(code, code);
        return game;
    }

    public Game joinGame(String code, String playerId) {
        Game game = games.get(code.toUpperCase());
        if (game == null) {
            throw new IllegalArgumentException("Sala não encontrada: " + code);
        }
        if (game.getPlayer2Id() != null) {
            throw new IllegalStateException("Sala já está cheia");
        }
        if (playerId.equals(game.getPlayer1Id())) {
            throw new IllegalStateException("Você já está nesta sala");
        }
        game.setPlayer2Id(playerId);
        return game;
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

    public Game rematch(String oldGameId) {
        Game oldGame = getGame(oldGameId);
        if (oldGame.getPhase() != GamePhase.FINISHED) {
            throw new IllegalStateException("O jogo ainda não terminou");
        }
        Game newGame = new Game();
        String code = generateCode();
        newGame.setId(code);
        newGame.setPlayer1Id(oldGame.getPlayer1Id());
        newGame.setPlayer2Id(oldGame.getPlayer2Id());
        newGame.setPlayer1Skin(random.nextBoolean() ? "padrao" : "pirate");
        games.put(code, newGame);
        codeToGameId.put(code, code);
        return newGame;
    }

    private String generateCode() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        String code;
        do {
            StringBuilder sb = new StringBuilder(4);
            for (int i = 0; i < 4; i++) {
                sb.append(chars.charAt(random.nextInt(chars.length())));
            }
            code = sb.toString();
        } while (games.containsKey(code));
        return code;
    }
}
