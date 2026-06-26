package com.batalha_naval.domain;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ShipTest {

    @Test
    void getOccupiedCells_horizontal() {
        Ship ship = new Ship();
        ship.setType(ShipType.CRUISER);
        ship.setStartRow(2);
        ship.setStartCol(3);
        ship.setOrientation(Orientation.HORIZONTAL);

        List<int[]> cells = ship.getOccupiedCells();
        assertEquals(3, cells.size());
        assertArrayEquals(new int[]{2, 3}, cells.get(0));
        assertArrayEquals(new int[]{2, 4}, cells.get(1));
        assertArrayEquals(new int[]{2, 5}, cells.get(2));
    }

    @Test
    void getOccupiedCells_vertical() {
        Ship ship = new Ship();
        ship.setType(ShipType.CRUISER);
        ship.setStartRow(2);
        ship.setStartCol(3);
        ship.setOrientation(Orientation.VERTICAL);

        List<int[]> cells = ship.getOccupiedCells();
        assertEquals(3, cells.size());
        assertArrayEquals(new int[]{2, 3}, cells.get(0));
        assertArrayEquals(new int[]{3, 3}, cells.get(1));
        assertArrayEquals(new int[]{4, 3}, cells.get(2));
    }

    @Test
    void isSunk_notEnoughHits_returnsFalse() {
        Ship ship = new Ship();
        ship.setType(ShipType.DESTROYER);
        ship.setHits(1);
        assertFalse(ship.isSunk());
    }

    @Test
    void isSunk_allHits_returnsTrue() {
        Ship ship = new Ship();
        ship.setType(ShipType.DESTROYER);
        ship.setHits(2);
        assertTrue(ship.isSunk());
    }
}
