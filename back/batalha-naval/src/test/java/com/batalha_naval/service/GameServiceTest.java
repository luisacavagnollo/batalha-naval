package com.batalha_naval.service;

import com.batalha_naval.domain.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class GameServiceTest {

    private GameService gameService;

    @BeforeEach
    void setUp() {
        gameService = new GameService();
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
        assertThrows(IllegalStateException.class, () -> gameService.joinGame(game.getId(), "player3"));
    }

    @Test
    void joinGame_samePlayer_throws() {
        Game game = gameService.createGame("player1");
        assertThrows(IllegalStateException.class, () -> gameService.joinGame(game.getId(), "player1"));
    }

    @Test
    void joinGame_invalidCode_throws() {
        assertThrows(IllegalArgumentException.class, () -> gameService.joinGame("ZZZZ", "player1"));
    }

    @Test
    void createGame_generatesUniqueCode() {
        Game g1 = gameService.createGame("player1");
        Game g2 = gameService.createGame("player2");
        assertNotEquals(g1.getId(), g2.getId());
    }

    @Test
    void shoot_incrementsScoreOnWin() {
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

        assertEquals(1, gameService.getPlayerScore("p1"));
        assertEquals(0, gameService.getPlayerScore("p2"));
    }

    private void placeAllShips(String gameId, String playerId) {
        gameService.placeShip(gameId, playerId, ShipType.CARRIER, 0, 0, Orientation.VERTICAL);
        gameService.placeShip(gameId, playerId, ShipType.BATTLESHIP, 0, 1, Orientation.VERTICAL);
        gameService.placeShip(gameId, playerId, ShipType.CRUISER, 0, 2, Orientation.VERTICAL);
        gameService.placeShip(gameId, playerId, ShipType.SUBMARINE, 0, 3, Orientation.VERTICAL);
        gameService.placeShip(gameId, playerId, ShipType.DESTROYER, 0, 4, Orientation.VERTICAL);
    }
}
