package com.batalha_naval.dto;

import com.batalha_naval.domain.CellState;

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
    private String mySkin;

    public GameStateResponse() {}

    public GameStateResponse(String gameId, String phase, String currentTurn, CellState[][] myBoard, CellState[][] opponentBoard, boolean isMyTurn, String winnerId, String lastShotResult, String sunkShipType, String mySkin) {
        this.gameId = gameId;
        this.phase = phase;
        this.currentTurn = currentTurn;
        this.myBoard = myBoard;
        this.opponentBoard = opponentBoard;
        this.isMyTurn = isMyTurn;
        this.winnerId = winnerId;
        this.lastShotResult = lastShotResult;
        this.sunkShipType = sunkShipType;
        this.mySkin = mySkin;
    }

    public String getGameId() { return gameId; }
    public void setGameId(String gameId) { this.gameId = gameId; }
    public String getPhase() { return phase; }
    public void setPhase(String phase) { this.phase = phase; }
    public String getCurrentTurn() { return currentTurn; }
    public void setCurrentTurn(String currentTurn) { this.currentTurn = currentTurn; }
    public CellState[][] getMyBoard() { return myBoard; }
    public void setMyBoard(CellState[][] myBoard) { this.myBoard = myBoard; }
    public CellState[][] getOpponentBoard() { return opponentBoard; }
    public void setOpponentBoard(CellState[][] opponentBoard) { this.opponentBoard = opponentBoard; }
    public boolean isMyTurn() { return isMyTurn; }
    public void setMyTurn(boolean myTurn) { this.isMyTurn = myTurn; }
    public String getWinnerId() { return winnerId; }
    public void setWinnerId(String winnerId) { this.winnerId = winnerId; }
    public String getLastShotResult() { return lastShotResult; }
    public void setLastShotResult(String lastShotResult) { this.lastShotResult = lastShotResult; }
    public String getSunkShipType() { return sunkShipType; }
    public void setSunkShipType(String sunkShipType) { this.sunkShipType = sunkShipType; }
    public String getMySkin() { return mySkin; }
    public void setMySkin(String mySkin) { this.mySkin = mySkin; }
}
