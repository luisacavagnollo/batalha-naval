package com.batalha_naval.service;

import com.batalha_naval.domain.Game;
import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Serviço de matchmaking com fila FIFO.
 * Jogadores entram na fila e são pareados na ordem de chegada.
 */
@Service
public class MatchmakingService {

    private final ConcurrentLinkedQueue<String> queue = new ConcurrentLinkedQueue<>();
    private final ConcurrentHashMap<String, Boolean> inQueue = new ConcurrentHashMap<>();
    private final GameService gameService;

    public MatchmakingService(GameService gameService) {
        this.gameService = gameService;
    }

    /**
     * Adiciona jogador à fila de matchmaking.
     * Retorna o Game se já havia alguém esperando, ou null se entrou na fila.
     */
    public Game joinQueue(String playerId) {
        // Se já está na fila, não adiciona de novo
        if (inQueue.containsKey(playerId)) {
            return null;
        }

        // Tentar parear com alguém que já está esperando
        String opponent = null;
        while ((opponent = queue.poll()) != null) {
            // Verificar se o oponente ainda está na fila (pode ter cancelado)
            if (inQueue.remove(opponent) != null) {
                // Oponente válido encontrado — criar partida
                break;
            }
            // Se o oponente não está mais na fila, continua procurando
            opponent = null;
        }

        if (opponent != null) {
            // Parear: criar jogo com o oponente (que chegou primeiro) como player1
            Game game = gameService.createGame(opponent);
            game.setPlayer2Id(playerId);
            game.touchActivity();
            return game;
        }

        // Ninguém disponível — entrar na fila
        inQueue.put(playerId, Boolean.TRUE);
        queue.offer(playerId);
        return null;
    }

    /**
     * Remove jogador da fila (cancelou a busca).
     */
    public void leaveQueue(String playerId) {
        inQueue.remove(playerId);
        // O poll no joinQueue vai ignorar esse jogador pois inQueue não o contém mais
    }

    /**
     * Verifica se o jogador está na fila.
     */
    public boolean isInQueue(String playerId) {
        return inQueue.containsKey(playerId);
    }

    /**
     * Retorna o tamanho atual da fila (para debug/stats).
     */
    public int getQueueSize() {
        return inQueue.size();
    }
}
