package com.batalha_naval.dto;

public class EmoteMessage {
    private String gameId;
    private String emote;
    private String fromPlayer;

    public EmoteMessage() {}

    public EmoteMessage(String gameId, String emote, String fromPlayer) {
        this.gameId = gameId;
        this.emote = emote;
        this.fromPlayer = fromPlayer;
    }

    public String getGameId() { return gameId; }
    public void setGameId(String gameId) { this.gameId = gameId; }
    public String getEmote() { return emote; }
    public void setEmote(String emote) { this.emote = emote; }
    public String getFromPlayer() { return fromPlayer; }
    public void setFromPlayer(String fromPlayer) { this.fromPlayer = fromPlayer; }
}
