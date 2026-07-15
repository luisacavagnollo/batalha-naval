package com.batalha_naval.exception;

/**
 * Lançada quando um jogador tenta entrar em uma sala que já está cheia (2 jogadores).
 */
public class GameFullException extends RuntimeException {

    public GameFullException(String gameId) {
        super("Sala já está cheia: " + gameId);
    }
}
