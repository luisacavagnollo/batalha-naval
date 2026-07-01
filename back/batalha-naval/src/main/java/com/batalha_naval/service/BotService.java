package com.batalha_naval.service;

import com.batalha_naval.domain.*;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class BotService {

    public static final String BOT_ID = "BOT";

    private final Random random = new Random();

    // Estado por gameId
    private final ConcurrentHashMap<String, boolean[][]> shotHistory = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, List<int[]>> activeHits = new ConcurrentHashMap<>();

    /**
     * Posiciona todos os navios do bot aleatoriamente no board.
     */
    public void placeShipsRandomly(Game game) {
        for (ShipType type : ShipType.values()) {
            boolean placed = false;
            while (!placed) {
                int row = random.nextInt(10);
                int col = random.nextInt(10);
                Orientation ori = random.nextBoolean() ? Orientation.HORIZONTAL : Orientation.VERTICAL;
                placed = game.placeShip(BOT_ID, type, row, col, ori);
            }
        }
    }

    /**
     * Escolhe o próximo tiro com lógica Hunt/Target + detecção de orientação.
     */
    public int[] chooseShot(String gameId) {
        shotHistory.putIfAbsent(gameId, new boolean[10][10]);
        activeHits.putIfAbsent(gameId, new ArrayList<>());

        boolean[][] shots = shotHistory.get(gameId);
        List<int[]> hits = activeHits.get(gameId);

        int[] shot = null;

        if (!hits.isEmpty()) {
            shot = chooseTargetShot(hits, shots);
        }

        if (shot == null) {
            shot = chooseHuntShot(shots);
        }

        if (shot != null) {
            shots[shot[0]][shot[1]] = true;
        }

        return shot;
    }

    /**
     * Quando acerta, adiciona à lista de hits ativos.
     */
    public void registerHit(String gameId, int row, int col) {
        activeHits.putIfAbsent(gameId, new ArrayList<>());
        activeHits.get(gameId).add(new int[]{row, col});
    }

    /**
     * Quando afunda um navio, remove os hits desse navio da lista ativa.
     */
    public void registerSunk(String gameId, int row, int col) {
        List<int[]> hits = activeHits.get(gameId);
        if (hits == null) return;

        // Encontra todos os hits conectados ao ponto afundado e remove
        Set<String> sunkCells = findConnectedHits(hits, row, col);
        hits.removeIf(h -> sunkCells.contains(h[0] + "," + h[1]));
    }

    public void cleanup(String gameId) {
        shotHistory.remove(gameId);
        activeHits.remove(gameId);
    }

    /**
     * Target mode: com base nos hits ativos, deduz a orientação e atira nas pontas.
     */
    private int[] chooseTargetShot(List<int[]> hits, boolean[][] shots) {
        if (hits.size() == 1) {
            // Apenas 1 hit: tenta as 4 direções adjacentes
            return chooseAdjacentShot(hits.get(0), shots);
        }

        // 2+ hits: detectar orientação
        // Ordenar hits para encontrar a linha do navio
        int[] first = hits.get(0);
        boolean horizontal = false;
        boolean vertical = false;

        for (int i = 1; i < hits.size(); i++) {
            if (hits.get(i)[0] == first[0]) horizontal = true;
            if (hits.get(i)[1] == first[1]) vertical = true;
        }

        if (horizontal) {
            // Navio horizontal: encontrar min/max col na mesma row
            int row = first[0];
            int minCol = Integer.MAX_VALUE, maxCol = Integer.MIN_VALUE;
            for (int[] h : hits) {
                if (h[0] == row) {
                    minCol = Math.min(minCol, h[1]);
                    maxCol = Math.max(maxCol, h[1]);
                }
            }
            // Tentar expandir para a direita
            if (maxCol + 1 < 10 && !shots[row][maxCol + 1]) {
                return new int[]{row, maxCol + 1};
            }
            // Tentar expandir para a esquerda
            if (minCol - 1 >= 0 && !shots[row][minCol - 1]) {
                return new int[]{row, minCol - 1};
            }
        }

        if (vertical) {
            // Navio vertical: encontrar min/max row na mesma col
            int col = first[1];
            int minRow = Integer.MAX_VALUE, maxRow = Integer.MIN_VALUE;
            for (int[] h : hits) {
                if (h[1] == col) {
                    minRow = Math.min(minRow, h[0]);
                    maxRow = Math.max(maxRow, h[0]);
                }
            }
            // Tentar expandir para baixo
            if (maxRow + 1 < 10 && !shots[maxRow + 1][col]) {
                return new int[]{maxRow + 1, col};
            }
            // Tentar expandir para cima
            if (minRow - 1 >= 0 && !shots[minRow - 1][col]) {
                return new int[]{minRow - 1, col};
            }
        }

        // Fallback: tenta adjacentes do primeiro hit
        return chooseAdjacentShot(first, shots);
    }

    /**
     * Tenta atirar em uma das 4 células adjacentes a um hit.
     */
    private int[] chooseAdjacentShot(int[] hit, boolean[][] shots) {
        int[][] directions = {{0, 1}, {0, -1}, {1, 0}, {-1, 0}};
        List<int[]> options = new ArrayList<>();

        for (int[] dir : directions) {
            int r = hit[0] + dir[0];
            int c = hit[1] + dir[1];
            if (r >= 0 && r < 10 && c >= 0 && c < 10 && !shots[r][c]) {
                options.add(new int[]{r, c});
            }
        }

        if (options.isEmpty()) return null;
        return options.get(random.nextInt(options.size()));
    }

    /**
     * Hunt mode: escolhe posição aleatória não atacada.
     */
    private int[] chooseHuntShot(boolean[][] shots) {
        List<int[]> available = new ArrayList<>();
        for (int r = 0; r < 10; r++) {
            for (int c = 0; c < 10; c++) {
                if (!shots[r][c]) {
                    available.add(new int[]{r, c});
                }
            }
        }
        if (available.isEmpty()) return null;
        return available.get(random.nextInt(available.size()));
    }

    /**
     * Encontra todos os hits conectados (mesmo navio) a partir de um ponto.
     */
    private Set<String> findConnectedHits(List<int[]> hits, int row, int col) {
        Set<String> hitSet = new HashSet<>();
        for (int[] h : hits) hitSet.add(h[0] + "," + h[1]);

        Set<String> connected = new HashSet<>();
        Queue<String> queue = new LinkedList<>();
        String start = row + "," + col;
        queue.add(start);
        connected.add(start);

        while (!queue.isEmpty()) {
            String cell = queue.poll();
            String[] parts = cell.split(",");
            int r = Integer.parseInt(parts[0]);
            int c = Integer.parseInt(parts[1]);

            int[][] dirs = {{0, 1}, {0, -1}, {1, 0}, {-1, 0}};
            for (int[] dir : dirs) {
                String neighbor = (r + dir[0]) + "," + (c + dir[1]);
                if (hitSet.contains(neighbor) && !connected.contains(neighbor)) {
                    connected.add(neighbor);
                    queue.add(neighbor);
                }
            }
        }

        return connected;
    }
}
