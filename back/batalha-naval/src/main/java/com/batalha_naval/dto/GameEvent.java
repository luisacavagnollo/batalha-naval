package com.batalha_naval.dto;

import com.batalha_naval.domain.CellState;

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

    public GameEvent() {}

    public GameEvent(String type, String gameId, String playerId, String phase, String currentTurn, String shotResult, Integer row, Integer col, String winnerId, CellState[][] myBoard, CellState[][] opponentBoard, boolean isMyTurn) {
        this.type = type;
        this.gameId = gameId;
        this.playerId = playerId;
        this.phase = phase;
        this.currentTurn = currentTurn;
        this.shotResult = shotResult;
        this.row = row;
        this.col = col;
        this.winnerId = winnerId;
        this.myBoard = myBoard;
        this.opponentBoard = opponentBoard;
        this.isMyTurn = isMyTurn;
    }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getGameId() { return gameId; }
    public void setGameId(String gameId) { this.gameId = gameId; }
    public String getPlayerId() { return playerId; }
    public void setPlayerId(String playerId) { this.playerId = playerId; }
    public String getPhase() { return phase; }
    public void setPhase(String phase) { this.phase = phase; }
    public String getCurrentTurn() { return currentTurn; }
    public void setCurrentTurn(String currentTurn) { this.currentTurn = currentTurn; }
    public String getShotResult() { return shotResult; }
    public void setShotResult(String shotResult) { this.shotResult = shotResult; }
    public Integer getRow() { return row; }
    public void setRow(Integer row) { this.row = row; }
    public Integer getCol() { return col; }
    public void setCol(Integer col) { this.col = col; }
    public String getWinnerId() { return winnerId; }
    public void setWinnerId(String winnerId) { this.winnerId = winnerId; }
    public CellState[][] getMyBoard() { return myBoard; }
    public void setMyBoard(CellState[][] myBoard) { this.myBoard = myBoard; }
    public CellState[][] getOpponentBoard() { return opponentBoard; }
    public void setOpponentBoard(CellState[][] opponentBoard) { this.opponentBoard = opponentBoard; }
    public boolean isMyTurn() { return isMyTurn; }
    public void setMyTurn(boolean myTurn) { this.isMyTurn = myTurn; }
}
