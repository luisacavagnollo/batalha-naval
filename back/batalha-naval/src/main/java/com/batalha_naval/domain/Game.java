package com.batalha_naval.domain;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

public class Game {
    private String id;
    private String player1Id;
    private String player2Id;
    private Board board1 = new Board();
    private Board board2 = new Board();
    private String currentTurnPlayerId;
    private GamePhase phase = GamePhase.PLACING_SHIPS;
    private String winnerId;
    private ShotOutcome lastShotOutcome;
    private String player1Skin; // "padrao" ou "pirate"
    private String player2Skin; // skin do player2
    private long lastActivity = System.currentTimeMillis();
    private final Set<String> rematchRequestedBy = ConcurrentHashMap.newKeySet();

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getPlayer1Skin() { return player1Skin; }
    public void setPlayer1Skin(String player1Skin) { this.player1Skin = player1Skin; }
    public String getPlayer2Skin() { return player2Skin; }
    public void setPlayer2Skin(String player2Skin) { this.player2Skin = player2Skin; }
    public String getPlayer1Id() { return player1Id; }
    public void setPlayer1Id(String player1Id) { this.player1Id = player1Id; }
    public String getPlayer2Id() { return player2Id; }
    public void setPlayer2Id(String player2Id) { this.player2Id = player2Id; }
    public Board getBoard1() { return board1; }
    public void setBoard1(Board board1) { this.board1 = board1; }
    public Board getBoard2() { return board2; }
    public void setBoard2(Board board2) { this.board2 = board2; }
    public String getCurrentTurnPlayerId() { return currentTurnPlayerId; }
    public void setCurrentTurnPlayerId(String currentTurnPlayerId) { this.currentTurnPlayerId = currentTurnPlayerId; }
    public GamePhase getPhase() { return phase; }
    public void setPhase(GamePhase phase) { this.phase = phase; }
    public String getWinnerId() { return winnerId; }
    public void setWinnerId(String winnerId) { this.winnerId = winnerId; }
    public ShotOutcome getLastShotOutcome() { return lastShotOutcome; }
    public void setLastShotOutcome(ShotOutcome lastShotOutcome) { this.lastShotOutcome = lastShotOutcome; }
    public long getLastActivity() { return lastActivity; }
    public void touchActivity() { this.lastActivity = System.currentTimeMillis(); }

    public boolean placeShip(String playerId, ShipType type, int row, int col, Orientation orientation) {
        if (phase != GamePhase.PLACING_SHIPS) return false;
        return getBoardForPlayer(playerId).placeShip(type, row, col, orientation);
    }

    public boolean allShipsPlaced(String playerId) {
        return getBoardForPlayer(playerId).getShips().size() == 5;
    }

    public void startGameIfReady() {
        if (allShipsPlaced(player1Id) && allShipsPlaced(player2Id)) {
            phase = GamePhase.IN_PROGRESS;
            currentTurnPlayerId = Math.random() < 0.5 ? player1Id : player2Id;
        }
    }

    public ShotOutcome shoot(String playerId, int row, int col) {
        if (phase != GamePhase.IN_PROGRESS) return null;
        if (!playerId.equals(currentTurnPlayerId)) return null;

        Board opponentBoard = getBoardForPlayer(getOpponentId(playerId));
        ShotOutcome outcome = opponentBoard.receiveShot(row, col);
        lastShotOutcome = outcome;

        if (outcome != null && opponentBoard.allShipsSunk()) {
            phase = GamePhase.FINISHED;
            winnerId = playerId;
        } else if (outcome != null && outcome.getResult() == ShotResult.MISS) {
            currentTurnPlayerId = getOpponentId(playerId);
        }
        return outcome;
    }

    public String getOpponentId(String playerId) {
        return playerId.equals(player1Id) ? player2Id : player1Id;
    }

    public boolean requestRematch(String playerId) {
        rematchRequestedBy.add(playerId);
        return rematchRequestedBy.contains(player1Id) && rematchRequestedBy.contains(player2Id);
    }

    public boolean hasRequestedRematch(String playerId) {
        return rematchRequestedBy.contains(playerId);
    }

    private Board getBoardForPlayer(String playerId) {
        return playerId.equals(player1Id) ? board1 : board2;
    }
}
