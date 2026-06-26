package com.batalha_naval.domain;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class Ship {
    private ShipType type;
    private int startRow;
    private int startCol;
    private Orientation orientation;
    private int hits;

    public int getSize() {
        return type.getSize();
    }

    public boolean isSunk() {
        return hits >= getSize();
    }

    public List<int[]> getOccupiedCells() {
        List<int[]> cells = new ArrayList<>();
        for (int i = 0; i < getSize(); i++) {
            int r = orientation == Orientation.VERTICAL ? startRow + i : startRow;
            int c = orientation == Orientation.HORIZONTAL ? startCol + i : startCol;
            cells.add(new int[]{r, c});
        }
        return cells;
    }
}
