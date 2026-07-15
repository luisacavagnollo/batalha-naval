package com.batalha_naval.dto;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

public class EmoteMessage {

    @NotBlank(message = "gameId é obrigatório")
    @Size(min = 4, max = 4, message = "gameId deve ter 4 caracteres")
    private String gameId;

    @NotBlank(message = "emote é obrigatório")
    @Size(max = 10, message = "emote deve ter no máximo 10 caracteres")
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
