package com.batalha_naval.domain;

public class ShotOutcome {
    private ShotResult result;
    private ShipType sunkShipType;

    public ShotOutcome(ShotResult result, ShipType sunkShipType) {
        this.result = result;
        this.sunkShipType = sunkShipType;
    }

    public ShotResult getResult() { return result; }
    public void setResult(ShotResult result) { this.result = result; }
    public ShipType getSunkShipType() { return sunkShipType; }
    public void setSunkShipType(ShipType sunkShipType) { this.sunkShipType = sunkShipType; }
}
