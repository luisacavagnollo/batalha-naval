package com.batalha_naval.domain;

import java.util.List;

public class ShotOutcome {
    private ShotResult result;
    private ShipType sunkShipType;
    private List<int[]> sunkShipCells;

    public ShotOutcome(ShotResult result, ShipType sunkShipType) {
        this.result = result;
        this.sunkShipType = sunkShipType;
    }

    public ShotOutcome(ShotResult result, ShipType sunkShipType, List<int[]> sunkShipCells) {
        this.result = result;
        this.sunkShipType = sunkShipType;
        this.sunkShipCells = sunkShipCells;
    }

    public ShotResult getResult() { return result; }
    public void setResult(ShotResult result) { this.result = result; }
    public ShipType getSunkShipType() { return sunkShipType; }
    public void setSunkShipType(ShipType sunkShipType) { this.sunkShipType = sunkShipType; }
    public List<int[]> getSunkShipCells() { return sunkShipCells; }
    public void setSunkShipCells(List<int[]> sunkShipCells) { this.sunkShipCells = sunkShipCells; }
}
