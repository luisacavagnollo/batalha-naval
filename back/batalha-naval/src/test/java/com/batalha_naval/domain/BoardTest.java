package com.batalha_naval.domain;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class BoardTest {

    private Board board;

    @BeforeEach
    void setUp() {
        board = new Board();
    }

    @Test
    void placeShip_validPlacement_returnsTrue() {
        assertTrue(board.placeShip(ShipType.CARRIER, 0, 0, Orientation.HORIZONTAL));
        assertEquals(CellState.SHIP, board.getGrid()[0][0]);
        assertEquals(CellState.SHIP, board.getGrid()[0][4]);
    }

    @Test
    void placeShip_outOfBoundsHorizontal_returnsFalse() {
        assertFalse(board.placeShip(ShipType.CARRIER, 0, 7, Orientation.HORIZONTAL));
    }

    @Test
    void placeShip_outOfBoundsVertical_returnsFalse() {
        assertFalse(board.placeShip(ShipType.CARRIER, 8, 0, Orientation.VERTICAL));
    }

    @Test
    void placeShip_overlapping_returnsFalse() {
        board.placeShip(ShipType.CARRIER, 0, 0, Orientation.HORIZONTAL);
        assertFalse(board.placeShip(ShipType.DESTROYER, 0, 3, Orientation.HORIZONTAL));
    }

    @Test
    void receiveShot_miss_returnsMiss() {
        assertEquals(ShotResult.MISS, board.receiveShot(5, 5).getResult());
        assertEquals(CellState.MISS, board.getGrid()[5][5]);
    }

    @Test
    void receiveShot_hit_returnsHit() {
        board.placeShip(ShipType.DESTROYER, 0, 0, Orientation.HORIZONTAL);
        assertEquals(ShotResult.HIT, board.receiveShot(0, 0).getResult());
        assertEquals(CellState.HIT, board.getGrid()[0][0]);
    }

    @Test
    void receiveShot_sunk_returnsSunkWithShipType() {
        board.placeShip(ShipType.DESTROYER, 0, 0, Orientation.HORIZONTAL);
        board.receiveShot(0, 0);
        ShotOutcome outcome = board.receiveShot(0, 1);
        assertEquals(ShotResult.SUNK, outcome.getResult());
        assertEquals(ShipType.DESTROYER, outcome.getSunkShipType());
    }

    @Test
    void receiveShot_alreadyShot_returnsNull() {
        board.receiveShot(5, 5);
        assertNull(board.receiveShot(5, 5));
    }

    @Test
    void allShipsSunk_allSunk_returnsTrue() {
        board.placeShip(ShipType.DESTROYER, 0, 0, Orientation.HORIZONTAL);
        board.receiveShot(0, 0);
        board.receiveShot(0, 1);
        assertTrue(board.allShipsSunk());
    }

    @Test
    void allShipsSunk_notAllSunk_returnsFalse() {
        board.placeShip(ShipType.DESTROYER, 0, 0, Orientation.HORIZONTAL);
        board.receiveShot(0, 0);
        assertFalse(board.allShipsSunk());
    }

    @Test
    void placeShip_duplicateType_returnsFalse() {
        assertTrue(board.placeShip(ShipType.CARRIER, 0, 0, Orientation.HORIZONTAL));
        assertFalse(board.placeShip(ShipType.CARRIER, 2, 0, Orientation.HORIZONTAL));
        assertEquals(1, board.getShips().size());
    }

    @Test
    void getGridForOpponent_hidesShipPositions() {
        board.placeShip(ShipType.DESTROYER, 0, 0, Orientation.HORIZONTAL);
        board.receiveShot(0, 0); // hit
        board.receiveShot(5, 5); // miss

        CellState[][] view = board.getGridForOpponent();
        assertEquals(CellState.HIT, view[0][0]);
        assertEquals(CellState.EMPTY, view[0][1]); // ship hidden as EMPTY
        assertEquals(CellState.MISS, view[5][5]);
    }
}
