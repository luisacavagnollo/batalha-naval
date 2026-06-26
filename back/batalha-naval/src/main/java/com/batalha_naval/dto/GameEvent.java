package com.batalha_naval.dto;

import com.batalha_naval.domain.CellState;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GameEvent {
    private String type;
    private String gameId;
    private String playerId;
    private String phase;
    private String currentTurn;
    private String shotResult;
    private Integer row;
    private Integer col;
    private String winnerId;
    private CellState[][] myBoard;
    private CellState[][] opponentBoard;
    private boolean isMyTurn;
}
