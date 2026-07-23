package com.batalha_naval.service;

import com.batalha_naval.config.GameMetrics;
import com.batalha_naval.domain.*;
import com.batalha_naval.dto.PlayerStatsResponse;
import com.batalha_naval.exception.GameFullException;
import com.batalha_naval.exception.GameNotFoundException;
import com.batalha_naval.model.GameRecord;
import com.batalha_naval.model.PlayerStats;
import com.batalha_naval.model.User;
import com.batalha_naval.repository.GameRecordRepository;
import com.batalha_naval.repository.PlayerStatsRepository;
import com.batalha_naval.repository.UserRepository;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class GameServiceTest {

    private GameService gameService;
    private GameRecordRepository gameRecordRepository;
    private PlayerStatsRepository playerStatsRepository;
    private UserRepository userRepository;
    private GameMetrics gameMetrics;

    @BeforeEach
    void setUp() {
        gameRecordRepository = mock(GameRecordRepository.class);
        playerStatsRepository = mock(PlayerStatsRepository.class);
        userRepository = mock(UserRepository.class);
        gameMetrics = new GameMetrics(new SimpleMeterRegistry());
        when(playerStatsRepository.findByUsername(anyString())).thenReturn(Optional.empty());
        when(gameRecordRepository.findTop10ByPlayer1OrPlayer2OrderByTimestampDesc(anyString(), anyString()))
                .thenReturn(Collections.emptyList());
        when(userRepository.findByUsername(anyString())).thenReturn(Optional.empty());
        gameService = new GameService(gameRecordRepository, playerStatsRepository, userRepository, gameMetrics);
    }

    @Test
    void createGame_setsPlayer1() {
        Game game = gameService.createGame("player1");
        assertNotNull(game.getId());
        assertEquals("player1", game.getPlayer1Id());
        assertNull(game.getPlayer2Id());
    }

    @Test
    void joinGame_setsPlayer2() {
        Game game = gameService.createGame("player1");
        Game joined = gameService.joinGame(game.getId(), "player2");
        assertEquals("player2", joined.getPlayer2Id());
    }

    @Test
    void joinGame_alreadyFull_throws() {
        Game game = gameService.createGame("player1");
        gameService.joinGame(game.getId(), "player2");
        assertThrows(GameFullException.class, () -> gameService.joinGame(game.getId(), "player3"));
    }

    @Test
    void joinGame_samePlayer_allowsRejoin() {
        Game game = gameService.createGame("player1");
        Game rejoined = gameService.joinGame(game.getId(), "player1");
        assertEquals(game.getId(), rejoined.getId());
        assertEquals("player1", rejoined.getPlayer1Id());
    }

    @Test
    void joinGame_invalidCode_throws() {
        assertThrows(GameNotFoundException.class, () -> gameService.joinGame("ZZZZ", "player1"));
    }

    @Test
    void createGame_generatesUniqueCode() {
        Game g1 = gameService.createGame("player1");
        Game g2 = gameService.createGame("player2");
        assertNotEquals(g1.getId(), g2.getId());
    }

    @Test
    void shoot_persistsOnWin() {
        Game game = gameService.createGame("p1");
        gameService.joinGame(game.getId(), "p2");
        String gameId = game.getId();

        placeAllShips(gameId, "p1");
        placeAllShips(gameId, "p2");

        // Sink all p2's ships
        int[][] targets = {
            {0,0},{1,0},{2,0},{3,0},{4,0},
            {0,1},{1,1},{2,1},{3,1},
            {0,2},{1,2},{2,2},
            {0,3},{1,3},{2,3},
            {0,4},{1,4}
        };

        int p2Row = 5;
        int p2Col = 0;
        for (int[] t : targets) {
            game = gameService.getGame(gameId);
            if (!game.getCurrentTurnPlayerId().equals("p1")) {
                gameService.shoot(gameId, "p2", p2Row, p2Col++);
                if (p2Col >= 10) { p2Col = 0; p2Row++; }
            }
            gameService.shoot(gameId, "p1", t[0], t[1]);
        }

        // Verifica que persistiu o resultado
        verify(gameRecordRepository).save(any(GameRecord.class));
        verify(playerStatsRepository, atLeast(2)).save(any(PlayerStats.class));
    }

    @Test
    void getPlayerStats_returnsDefaultForNewPlayer() {
        var stats = gameService.getPlayerStats("newPlayer");
        assertEquals(0, stats.getWins());
        assertEquals(0, stats.getLosses());
        assertEquals(0.0, stats.getWinRate());
        assertTrue(stats.getHistory().isEmpty());
    }

    private void placeAllShips(String gameId, String playerId) {
        gameService.placeShip(gameId, playerId, ShipType.CARRIER, 0, 0, Orientation.VERTICAL);
        gameService.placeShip(gameId, playerId, ShipType.BATTLESHIP, 0, 1, Orientation.VERTICAL);
        gameService.placeShip(gameId, playerId, ShipType.CRUISER, 0, 2, Orientation.VERTICAL);
        gameService.placeShip(gameId, playerId, ShipType.SUBMARINE, 0, 3, Orientation.VERTICAL);
        gameService.placeShip(gameId, playerId, ShipType.DESTROYER, 0, 4, Orientation.VERTICAL);
    }
}
