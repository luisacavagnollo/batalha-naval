package com.batalha_naval.model;

import javax.persistence.*;

@Entity
@Table(name = "game_records")
public class GameRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String player1;

    @Column(nullable = false, length = 50)
    private String player2;

    @Column(nullable = false, length = 50)
    private String winner;

    @Column(nullable = false)
    private long timestamp;

    @Column(name = "single_player", nullable = false)
    private boolean singlePlayer;

    public GameRecord() {
    }

    public GameRecord(String player1, String player2, String winner, long timestamp, boolean singlePlayer) {
        this.player1 = player1;
        this.player2 = player2;
        this.winner = winner;
        this.timestamp = timestamp;
        this.singlePlayer = singlePlayer;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getPlayer1() { return player1; }
    public void setPlayer1(String player1) { this.player1 = player1; }
    public String getPlayer2() { return player2; }
    public void setPlayer2(String player2) { this.player2 = player2; }
    public String getWinner() { return winner; }
    public void setWinner(String winner) { this.winner = winner; }
    public long getTimestamp() { return timestamp; }
    public void setTimestamp(long timestamp) { this.timestamp = timestamp; }
    public boolean isSinglePlayer() { return singlePlayer; }
    public void setSinglePlayer(boolean singlePlayer) { this.singlePlayer = singlePlayer; }
}
