package com.batalha_naval.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ShotRequest {
    private String gameId;
    private int row;
    private int col;
}
