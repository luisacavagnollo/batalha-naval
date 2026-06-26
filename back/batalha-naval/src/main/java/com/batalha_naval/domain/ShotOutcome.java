package com.batalha_naval.domain;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ShotOutcome {
    private ShotResult result;
    private ShipType sunkShipType; // non-null only when result == SUNK
}
