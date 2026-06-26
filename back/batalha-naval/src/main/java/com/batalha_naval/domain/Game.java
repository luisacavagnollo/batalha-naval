package com.batalha_naval.domain;

import lombok.Data;

@Data
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
            currentTurnPlayerId = player1Id;
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
        } else if (outcome != null) {
            currentTurnPlayerId = getOpponentId(playerId);
        }
        return outcome;
    }

    public String getOpponentId(String playerId) {
        return playerId.equals(player1Id) ? player2Id : player1Id;
    }

    private Board getBoardForPlayer(String playerId) {
        return playerId.equals(player1Id) ? board1 : board2;
    }
}
