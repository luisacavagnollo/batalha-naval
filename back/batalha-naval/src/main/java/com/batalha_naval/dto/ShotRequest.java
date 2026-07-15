package com.batalha_naval.dto;

import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;

public class ShotRequest {

    @NotBlank(message = "gameId é obrigatório")
    @Size(min = 4, max = 4, message = "gameId deve ter 4 caracteres")
    private String gameId;

    @NotNull(message = "row é obrigatório")
    @Min(value = 0, message = "row deve ser entre 0 e 9")
    @Max(value = 9, message = "row deve ser entre 0 e 9")
    private Integer row;

    @NotNull(message = "col é obrigatório")
    @Min(value = 0, message = "col deve ser entre 0 e 9")
    @Max(value = 9, message = "col deve ser entre 0 e 9")
    private Integer col;

    public ShotRequest() {}

    public ShotRequest(String gameId, int row, int col) {
        this.gameId = gameId;
        this.row = row;
        this.col = col;
    }

    public String getGameId() { return gameId; }
    public void setGameId(String gameId) { this.gameId = gameId; }
    public Integer getRow() { return row; }
    public void setRow(Integer row) { this.row = row; }
    public Integer getCol() { return col; }
    public void setCol(Integer col) { this.col = col; }
}
