package com.batalha_naval.dto;

public class GameMessage {
    private String action;
    private String gameId;
    private String shipType;
    private Integer row;
    private Integer col;
    private String orientation;

    public GameMessage() {}

    public GameMessage(String action, String gameId, String shipType, Integer row, Integer col, String orientation) {
        this.action = action;
        this.gameId = gameId;
        this.shipType = shipType;
        this.row = row;
        this.col = col;
        this.orientation = orientation;
    }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public String getGameId() { return gameId; }
    public void setGameId(String gameId) { this.gameId = gameId; }
    public String getShipType() { return shipType; }
    public void setShipType(String shipType) { this.shipType = shipType; }
    public Integer getRow() { return row; }
    public void setRow(Integer row) { this.row = row; }
    public Integer getCol() { return col; }
    public void setCol(Integer col) { this.col = col; }
    public String getOrientation() { return orientation; }
    public void setOrientation(String orientation) { this.orientation = orientation; }
}
