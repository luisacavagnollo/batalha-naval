package com.batalha_naval.domain;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class GameTest {

    private Game game;

    @BeforeEach
    void setUp() {
        game = new Game();
        game.setId("test-game");
        game.setPlayer1Id("p1");
        game.setPlayer2Id("p2");
    }

    @Test
    void placeShip_duringPlacingPhase_succeeds() {
        assertTrue(game.placeShip("p1", ShipType.CARRIER, 0, 0, Orientation.HORIZONTAL));
    }

    @Test
    void placeShip_afterGameStarted_fails() {
        placeAllShips("p1", game);
        placeAllShips("p2", game);
        assertFalse(game.placeShip("p1", ShipType.DESTROYER, 9, 0, Orientation.HORIZONTAL));
    }

    @Test
    void startGameIfReady_bothPlayersReady_startsGame() {
        placeAllShips("p1", game);
        placeAllShips("p2", game);
        assertEquals(GamePhase.IN_PROGRESS, game.getPhase());
        assertEquals("p1", game.getCurrentTurnPlayerId());
    }

    @Test
    void startGameIfReady_onlyOnePlayerReady_doesNotStart() {
        placeAllShips("p1", game);
        assertEquals(GamePhase.PLACING_SHIPS, game.getPhase());
    }

    @Test
    void shoot_correctTurn_returnsResult() {
        placeAllShips("p1", game);
        placeAllShips("p2", game);
        ShotOutcome outcome = game.shoot("p1", 0, 0);
        assertNotNull(outcome);
        assertEquals(ShotResult.HIT, outcome.getResult());
    }

    @Test
    void shoot_wrongTurn_returnsNull() {
        placeAllShips("p1", game);
        placeAllShips("p2", game);
        assertNull(game.shoot("p2", 0, 0));
    }

    @Test
    void shoot_alternatesTurns() {
        placeAllShips("p1", game);
        placeAllShips("p2", game);
        game.shoot("p1", 9, 9); // p1 shoots (miss likely)
        assertEquals("p2", game.getCurrentTurnPlayerId());
    }

    @Test
    void shoot_sinkAllShips_gameFinishes() {
        Game g = new Game();
        g.setId("win-test");
        g.setPlayer1Id("p1");
        g.setPlayer2Id("p2");
        placeAllShips("p1", g);
        placeAllShips("p2", g);

        // Sink all p2's ships (placed at rows 0-4, col 0-4, vertical)
        int[][] targets = {
            {0,0},{1,0},{2,0},{3,0},{4,0}, // carrier (5)
            {0,1},{1,1},{2,1},{3,1},       // battleship (4)
            {0,2},{1,2},{2,2},             // cruiser (3)
            {0,3},{1,3},{2,3},             // submarine (3)
            {0,4},{1,4}                    // destroyer (2)
        };

        int p2Row = 5;
        int p2Col = 0;
        for (int[] t : targets) {
            if (!g.getCurrentTurnPlayerId().equals("p1")) {
                g.shoot("p2", p2Row, p2Col++);
                if (p2Col >= 10) { p2Col = 0; p2Row++; }
            }
            g.shoot("p1", t[0], t[1]);
        }

        assertEquals(GamePhase.FINISHED, g.getPhase());
        assertEquals("p1", g.getWinnerId());
    }

    @Test
    void getOpponentId_returnsCorrectOpponent() {
        assertEquals("p2", game.getOpponentId("p1"));
        assertEquals("p1", game.getOpponentId("p2"));
    }

    private void placeAllShips(String playerId, Game g) {
        g.placeShip(playerId, ShipType.CARRIER, 0, 0, Orientation.VERTICAL);
        g.placeShip(playerId, ShipType.BATTLESHIP, 0, 1, Orientation.VERTICAL);
        g.placeShip(playerId, ShipType.CRUISER, 0, 2, Orientation.VERTICAL);
        g.placeShip(playerId, ShipType.SUBMARINE, 0, 3, Orientation.VERTICAL);
        g.placeShip(playerId, ShipType.DESTROYER, 0, 4, Orientation.VERTICAL);
        g.startGameIfReady();
    }
}
