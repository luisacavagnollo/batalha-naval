package com.batalha_naval.domain;

import lombok.Getter;

import java.util.ArrayList;
import java.util.List;

@Getter
public class Board {
    private final CellState[][] grid = new CellState[10][10];
    private final List<Ship> ships = new ArrayList<>();

    public Board() {
        for (int r = 0; r < 10; r++)
            for (int c = 0; c < 10; c++)
                grid[r][c] = CellState.EMPTY;
    }

    public boolean placeShip(ShipType type, int row, int col, Orientation orientation) {
        Ship ship = new Ship();
        ship.setType(type);
        ship.setStartRow(row);
        ship.setStartCol(col);
        ship.setOrientation(orientation);

        for (int[] cell : ship.getOccupiedCells()) {
            if (cell[0] < 0 || cell[0] >= 10 || cell[1] < 0 || cell[1] >= 10)
                return false;
            if (grid[cell[0]][cell[1]] != CellState.EMPTY)
                return false;
        }

        for (int[] cell : ship.getOccupiedCells())
            grid[cell[0]][cell[1]] = CellState.SHIP;

        ships.add(ship);
        return true;
    }

    public ShotOutcome receiveShot(int row, int col) {
        if (grid[row][col] == CellState.MISS || grid[row][col] == CellState.HIT)
            return null;

        if (grid[row][col] == CellState.EMPTY) {
            grid[row][col] = CellState.MISS;
            return new ShotOutcome(ShotResult.MISS, null);
        }

        grid[row][col] = CellState.HIT;
        Ship hitShip = ships.stream()
                .filter(s -> s.getOccupiedCells().stream()
                        .anyMatch(c -> c[0] == row && c[1] == col))
                .findFirst().orElse(null);

        if (hitShip != null) {
            hitShip.setHits(hitShip.getHits() + 1);
            if (hitShip.isSunk()) {
                return new ShotOutcome(ShotResult.SUNK, hitShip.getType());
            }
            return new ShotOutcome(ShotResult.HIT, null);
        }
        return new ShotOutcome(ShotResult.HIT, null);
    }

    public boolean allShipsSunk() {
        return !ships.isEmpty() && ships.stream().allMatch(Ship::isSunk);
    }

    public CellState[][] getGridForOwner() {
        return grid;
    }

    public CellState[][] getGridForOpponent() {
        CellState[][] view = new CellState[10][10];
        for (int r = 0; r < 10; r++)
            for (int c = 0; c < 10; c++)
                view[r][c] = (grid[r][c] == CellState.SHIP) ? CellState.EMPTY : grid[r][c];
        return view;
    }
}
