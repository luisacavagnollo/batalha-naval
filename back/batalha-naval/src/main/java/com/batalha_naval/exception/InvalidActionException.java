package com.batalha_naval.exception;

/**
 * Lançada quando uma ação de jogo é inválida para o estado atual
 * (ex: atirar fora do turno, desistir após jogo acabar, rematch antes de acabar).
 */
public class InvalidActionException extends RuntimeException {

    public InvalidActionException(String message) {
        super(message);
    }
}
