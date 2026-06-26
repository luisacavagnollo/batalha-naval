package com.batalha_naval.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmoteMessage {
    private String gameId;
    private String emote;
    private String fromPlayer;
}
