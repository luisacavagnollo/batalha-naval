package com.batalha_naval.service;

import com.batalha_naval.domain.*;
import com.batalha_naval.dto.PlayerStatsResponse;
import com.batalha_naval.model.GameRecord;
import com.batalha_naval.model.PlayerStats;
import com.batalha_naval.model.User;
import com.batalha_naval.repository.GameRecordRepository;
import com.batalha_naval.repository.PlayerStatsRepository;
import com.batalha_naval.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class GameService {

    private static final Logger log = LoggerFactory.getLogger(GameService.class);

    private final ConcurrentHashMap<String, Game> games = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, String> codeToGameId = new ConcurrentHashMap<>();
    private final Random random = new Random();

    private final GameRecordRepository gameRecordRepository;
    private final PlayerStatsRepository playerStatsRepository;
    private final UserRepository userRepository;

    public GameService(GameRecordRepository gameRecordRepository, PlayerStatsRepository playerStatsRepository, UserRepository userRepository) {
        this.gameRecordRepository = gameRecordRepository;
        this.playerStatsRepository = playerStatsRepository;
        this.userRepository = userRepository;
    }

    public Game createGame(String playerId) {
        Game game = new Game();
        String code = generateCode();
        game.setId(code);
        game.setPlayer1Id(playerId);
        game.setPlayer1Skin(getPlayerSkin(playerId));
        games.put(code, game);
        codeToGameId.put(code, code);
        return game;
    }

    public Game joinGame(String code, String playerId) {
        Game game = games.get(code.toUpperCase());
        if (game == null) {
            throw new IllegalArgumentException("Sala não encontrada");
        }
        // Partida solo não aceita outros jogadores
        if ("BOT".equals(game.getPlayer2Id())) {
            throw new IllegalArgumentException("Sala não encontrada");
        }
        if (game.getPlayer2Id() != null) {
            throw new IllegalStateException("Sala já está cheia");
        }
        // Se o criador tenta entrar na própria sala, significa que ele cancelou
        // mas o leave ainda não foi processado. Remover a sala e informar que não existe.
        if (playerId.equals(game.getPlayer1Id())) {
            games.remove(code.toUpperCase());
            codeToGameId.remove(code.toUpperCase());
            throw new IllegalArgumentException("Sala não encontrada");
        }
        game.setPlayer2Id(playerId);
        game.setPlayer2Skin(getPlayerSkin(playerId));
        game.touchActivity();
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
            game.touchActivity();
            game.startGameIfReady();
        }
        return result;
    }

    public ShotOutcome shoot(String gameId, String playerId, int row, int col) {
        Game game = getGame(gameId);
        game.touchActivity();
        ShotOutcome outcome = game.shoot(playerId, row, col);
        if (outcome != null && game.getPhase() == GamePhase.FINISHED) {
            persistGameResult(game);
        }
        return outcome;
    }

    private void persistGameResult(Game game) {
        String winner = game.getWinnerId();
        String p1 = game.getPlayer1Id();
        String p2 = game.getPlayer2Id();
        long now = System.currentTimeMillis();
        boolean isSinglePlayer = "BOT".equals(p2);

        log.info("Persistindo resultado: p1={}, p2={}, winner={}, singlePlayer={}", p1, p2, winner, isSinglePlayer);

        // Salvar registro da partida
        try {
            GameRecord record = new GameRecord(p1, p2 != null ? p2 : "BOT", winner, now, isSinglePlayer);
            gameRecordRepository.save(record);
            gameRecordRepository.flush();
            log.info("GameRecord salvo com sucesso: winner={}, singlePlayer={}", winner, isSinglePlayer);
        } catch (Exception e) {
            log.error("Erro ao salvar GameRecord: {}", e.getMessage(), e);
        }

        // Atualizar stats dos jogadores (não salva stats para BOT)
        try {
            if (p1 != null && !p1.equals("BOT")) {
                PlayerStats stats1 = playerStatsRepository.findByUsername(p1)
                        .orElse(new PlayerStats(p1));
                if (p1.equals(winner)) {
                    stats1.incrementWins();
                } else {
                    stats1.incrementLosses();
                }
                playerStatsRepository.save(stats1);
            }

            if (p2 != null && !p2.equals("BOT")) {
                PlayerStats stats2 = playerStatsRepository.findByUsername(p2)
                        .orElse(new PlayerStats(p2));
                if (p2.equals(winner)) {
                    stats2.incrementWins();
                } else {
                    stats2.incrementLosses();
                }
                playerStatsRepository.save(stats2);
            }
        } catch (Exception e) {
            log.error("Erro ao atualizar PlayerStats: {}", e.getMessage(), e);
        }

        // Adicionar 10 moedas ao vencedor
        try {
            if (winner != null && !winner.equals("BOT")) {
                userRepository.findByUsername(winner).ifPresent(user -> {
                    user.setMoedas(user.getMoedas() + 10);
                    userRepository.save(user);
                });
            }
        } catch (Exception e) {
            log.error("Erro ao creditar moedas: {}", e.getMessage(), e);
        }
    }

    public PlayerStatsResponse getPlayerStats(String playerId) {
        // Buscar stats agregadas do banco
        PlayerStats stats = playerStatsRepository.findByUsername(playerId)
                .orElse(new PlayerStats(playerId));
        int wins = stats.getWins();
        int losses = stats.getLosses();
        int total = wins + losses;
        double winRate = total == 0 ? 0 : (double) wins / total * 100;

        // Buscar últimas 10 partidas do banco
        List<GameRecord> recentGames = gameRecordRepository
                .findTop10ByPlayer1OrPlayer2OrderByTimestampDesc(playerId, playerId);

        List<PlayerStatsResponse.MatchRecord> history = recentGames.stream()
                .map(record -> {
                    String opponent = record.getPlayer1().equals(playerId) ? record.getPlayer2() : record.getPlayer1();
                    boolean won = playerId.equals(record.getWinner());
                    return new PlayerStatsResponse.MatchRecord(opponent, won, record.getTimestamp());
                })
                .collect(Collectors.toList());

        return new PlayerStatsResponse(wins, losses, Math.round(winRate * 10.0) / 10.0, history);
    }

    public int getPlayerScore(String playerId) {
        return playerStatsRepository.findByUsername(playerId)
                .map(PlayerStats::getWins)
                .orElse(0);
    }

    public Game surrender(String gameId, String playerId) {
        Game game = getGame(gameId);
        if (game.getPhase() == GamePhase.FINISHED) {
            throw new IllegalStateException("O jogo já terminou");
        }
        String opponentId = game.getOpponentId(playerId);
        game.setPhase(GamePhase.FINISHED);
        game.setWinnerId(opponentId);
        persistGameResult(game);
        return game;
    }

    /**
     * Abandona um jogo sem registrar resultado (para saída durante PLACING_SHIPS ou partidas solo).
     * Remove o jogo da memória imediatamente.
     */
    public void abandonGame(String gameId, String playerId) {
        Game game = games.get(gameId);
        if (game == null) return;
        // Verificar se o jogador faz parte desta partida
        if (!playerId.equals(game.getPlayer1Id()) && !playerId.equals(game.getPlayer2Id())) {
            return;
        }
        // Se já terminou, apenas remove da memória
        if (game.getPhase() == GamePhase.FINISHED) {
            games.remove(gameId);
            codeToGameId.remove(gameId);
            return;
        }
        // Se está em PLACING_SHIPS (ninguém jogou ainda), remove sem registrar
        if (game.getPhase() == GamePhase.PLACING_SHIPS) {
            games.remove(gameId);
            codeToGameId.remove(gameId);
            return;
        }
        // Se está IN_PROGRESS, tratar como surrender (registra derrota)
        String opponentId = game.getOpponentId(playerId);
        game.setPhase(GamePhase.FINISHED);
        game.setWinnerId(opponentId);
        persistGameResult(game);
        games.remove(gameId);
        codeToGameId.remove(gameId);
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
        newGame.setPlayer1Skin(getPlayerSkin(oldGame.getPlayer1Id()));
        newGame.setPlayer2Skin(getPlayerSkin(oldGame.getPlayer2Id()));
        games.put(code, newGame);
        codeToGameId.put(code, code);
        return newGame;
    }

    public String getPlayerSkin(String username) {
        if (username == null || "BOT".equals(username)) {
            return "pirate";
        }
        return userRepository.findByUsername(username)
                .map(User::getSkinEquipada)
                .orElse("padrao_antigo");
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

    /**
     * Remove jogos abandonados:
     * - PLACING_SHIPS sem atividade há mais de 10 minutos
     * - IN_PROGRESS sem atividade há mais de 30 minutos
     * - FINISHED há mais de 5 minutos (cleanup de memória)
     * 
     * @return lista de gameIds removidos
     */
    public List<String> cleanupAbandonedGames() {
        long now = System.currentTimeMillis();
        List<String> toRemove = new ArrayList<>();

        for (Map.Entry<String, Game> entry : games.entrySet()) {
            Game game = entry.getValue();
            long inactiveMs = now - game.getLastActivity();

            if (game.getPhase() == GamePhase.PLACING_SHIPS && inactiveMs > 10 * 60_000) {
                toRemove.add(entry.getKey());
            } else if (game.getPhase() == GamePhase.IN_PROGRESS && inactiveMs > 30 * 60_000) {
                toRemove.add(entry.getKey());
            } else if (game.getPhase() == GamePhase.FINISHED && inactiveMs > 5 * 60_000) {
                toRemove.add(entry.getKey());
            }
        }

        for (String id : toRemove) {
            games.remove(id);
            codeToGameId.remove(id);
        }

        return toRemove;
    }
}
