package com.batalha_naval.exception;

/**
 * Lançada quando uma sala/jogo não é encontrada pelo código fornecido.
 */
public class GameNotFoundException extends RuntimeException {

    public GameNotFoundException(String gameId) {
        super("Sala não encontrada: " + gameId);
    }
}
