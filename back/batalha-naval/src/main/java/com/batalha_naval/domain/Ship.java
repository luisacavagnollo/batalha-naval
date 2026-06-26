package com.batalha_naval.domain;

import java.util.ArrayList;
import java.util.List;

public class Ship {
    private ShipType type;
    private int startRow;
    private int startCol;
    private Orientation orientation;
    private int hits;

    public ShipType getType() { return type; }
    public void setType(ShipType type) { this.type = type; }
    public int getStartRow() { return startRow; }
    public void setStartRow(int startRow) { this.startRow = startRow; }
    public int getStartCol() { return startCol; }
    public void setStartCol(int startCol) { this.startCol = startCol; }
    public Orientation getOrientation() { return orientation; }
    public void setOrientation(Orientation orientation) { this.orientation = orientation; }
    public int getHits() { return hits; }
    public void setHits(int hits) { this.hits = hits; }

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
