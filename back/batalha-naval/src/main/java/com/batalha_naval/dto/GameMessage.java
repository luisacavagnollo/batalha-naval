package com.batalha_naval.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GameMessage {
    private String action;
    private String gameId;
    private String shipType;
    private Integer row;
    private Integer col;
    private String orientation;
}
