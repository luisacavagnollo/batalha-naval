package com.batalha_naval.dto;

import com.batalha_naval.domain.CellState;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GameStateResponse {
    private String gameId;
    private String phase;
    private String currentTurn;
    private CellState[][] myBoard;
    private CellState[][] opponentBoard;
    private boolean isMyTurn;
    private String winnerId;
    private String lastShotResult;
    private String sunkShipType;
}
