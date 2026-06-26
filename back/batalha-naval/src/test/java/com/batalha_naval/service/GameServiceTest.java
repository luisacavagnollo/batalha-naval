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
    void findOrCreateGame_noWaitingGame_createsNew() {
        String gameId = gameService.findOrCreateGame("player1");
        assertNotNull(gameId);
        assertEquals("player1", gameService.getGame(gameId).getPlayer1Id());
    }

    @Test
    void findOrCreateGame_waitingGameExists_joinsIt() {
        String gameId1 = gameService.findOrCreateGame("player1");
        String gameId2 = gameService.findOrCreateGame("player2");
        assertEquals(gameId1, gameId2);
        assertEquals("player2", gameService.getGame(gameId1).getPlayer2Id());
    }

    @Test
    void findOrCreateGame_doesNotJoinOwnGame() {
        String gameId1 = gameService.findOrCreateGame("player1");
        String gameId2 = gameService.findOrCreateGame("player1");
        assertNotEquals(gameId1, gameId2);
    }

    @Test
    void shoot_incrementsScoreOnWin() {
        String gameId = gameService.findOrCreateGame("p1");
        gameService.findOrCreateGame("p2");
        Game game = gameService.getGame(gameId);

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
