package com.batalha_naval.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlaceShipRequest {
    private String shipType;
    private int row;
    private int col;
    private String orientation;
}
