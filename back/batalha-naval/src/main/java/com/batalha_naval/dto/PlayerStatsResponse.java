package com.batalha_naval.dto;

import java.util.List;

public class PlayerStatsResponse {
    private int wins;
    private int losses;
    private double winRate;
    private List<MatchRecord> history;

    public PlayerStatsResponse(int wins, int losses, double winRate, List<MatchRecord> history) {
        this.wins = wins;
        this.losses = losses;
        this.winRate = winRate;
        this.history = history;
    }

    public int getWins() { return wins; }
    public int getLosses() { return losses; }
    public double getWinRate() { return winRate; }
    public List<MatchRecord> getHistory() { return history; }

    public static class MatchRecord {
        private String opponent;
        private boolean won;
        private long timestamp;

        public MatchRecord(String opponent, boolean won, long timestamp) {
            this.opponent = opponent;
            this.won = won;
            this.timestamp = timestamp;
        }

        public String getOpponent() { return opponent; }
        public boolean isWon() { return won; }
        public long getTimestamp() { return timestamp; }
    }
}
