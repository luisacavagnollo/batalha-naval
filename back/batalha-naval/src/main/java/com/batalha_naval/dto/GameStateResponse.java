package com.batalha_naval.dto;

import com.batalha_naval.domain.CellState;
import java.util.List;

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
    private String opponentSkin;
    private List<int[]> sunkShipCells;
    private List<ShipInfo> myShips;

    public GameStateResponse() {}

    public GameStateResponse(String gameId, String phase, String currentTurn, CellState[][] myBoard, CellState[][] opponentBoard, boolean isMyTurn, String winnerId, String lastShotResult, String sunkShipType, String mySkin, String opponentSkin, List<int[]> sunkShipCells, List<ShipInfo> myShips) {
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
        this.opponentSkin = opponentSkin;
        this.sunkShipCells = sunkShipCells;
        this.myShips = myShips;
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
    public String getOpponentSkin() { return opponentSkin; }
    public void setOpponentSkin(String opponentSkin) { this.opponentSkin = opponentSkin; }
    public List<int[]> getSunkShipCells() { return sunkShipCells; }
    public void setSunkShipCells(List<int[]> sunkShipCells) { this.sunkShipCells = sunkShipCells; }
    public List<ShipInfo> getMyShips() { return myShips; }
    public void setMyShips(List<ShipInfo> myShips) { this.myShips = myShips; }

    public static class ShipInfo {
        private String type;
        private int row;
        private int col;
        private int size;
        private String orientation;
        private boolean sunk;

        public ShipInfo() {}

        public ShipInfo(String type, int row, int col, int size, String orientation, boolean sunk) {
            this.type = type;
            this.row = row;
            this.col = col;
            this.size = size;
            this.orientation = orientation;
            this.sunk = sunk;
        }

        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public int getRow() { return row; }
        public void setRow(int row) { this.row = row; }
        public int getCol() { return col; }
        public void setCol(int col) { this.col = col; }
        public int getSize() { return size; }
        public void setSize(int size) { this.size = size; }
        public String getOrientation() { return orientation; }
        public void setOrientation(String orientation) { this.orientation = orientation; }
        public boolean isSunk() { return sunk; }
        public void setSunk(boolean sunk) { this.sunk = sunk; }
    }
}
