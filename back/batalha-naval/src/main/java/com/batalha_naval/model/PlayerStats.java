package com.batalha_naval.model;

import javax.persistence.*;

@Entity
@Table(name = "player_stats")
public class PlayerStats {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private int wins = 0;

    @Column(nullable = false)
    private int losses = 0;

    public PlayerStats() {
    }

    public PlayerStats(String username) {
        this.username = username;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public int getWins() { return wins; }
    public void setWins(int wins) { this.wins = wins; }
    public int getLosses() { return losses; }
    public void setLosses(int losses) { this.losses = losses; }

    public void incrementWins() { this.wins++; }
    public void incrementLosses() { this.losses++; }
}
