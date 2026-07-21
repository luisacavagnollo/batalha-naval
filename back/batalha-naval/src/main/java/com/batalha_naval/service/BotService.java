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
     * Quando afunda um navio, remove APENAS os hits desse navio da lista ativa.
     * Usa as coordenadas reais do navio afundado (fornecidas pelo ShotOutcome).
     */
    public void registerSunk(String gameId, int row, int col) {
        List<int[]> hits = activeHits.get(gameId);
        if (hits == null) return;

        // Encontrar o cluster linear (horizontal ou vertical) que contém (row, col)
        // Um navio é sempre uma linha reta, então filtramos apenas hits na mesma
        // linha ou coluna que formam uma sequência contígua com (row, col).
        Set<String> sunkCells = findLinearCluster(hits, row, col);
        hits.removeIf(h -> sunkCells.contains(h[0] + "," + h[1]));
    }

    private static final int MAX_BOT_RETRIES = 100;

    /**
     * Resultado de um único tiro do bot.
     */
    public enum TurnResult {
        /** Bot errou — turno passou para o jogador. */
        MISS,
        /** Bot acertou — mantém o turno, deve ser re-agendado com delay. */
        HIT,
        /** Bot afundou todos os navios — jogo terminou. */
        GAME_OVER,
        /** Nenhum tiro válido encontrado. */
        NO_SHOT
    }

    /**
     * Executa UM ÚNICO tiro do bot e atualiza o estado interno de hunt/target.
     * NÃO bloqueia a thread — o caller é responsável por re-agendar se o resultado for HIT.
     *
     * @param game o jogo atual
     * @return resultado do tiro indicando se o bot mantém o turno
     */
    public TurnResult executeSingleShot(Game game) {
        if (!isBotTurn(game)) {
            return TurnResult.NO_SHOT;
        }

        ShotOutcome outcome = null;
        int attempts = 0;

        while (outcome == null && attempts < MAX_BOT_RETRIES) {
            int[] shot = chooseShot(game.getId());
            if (shot == null) return TurnResult.NO_SHOT;

            outcome = game.shoot(BOT_ID, shot[0], shot[1]);
            if (outcome != null) {
                if (outcome.getResult() == ShotResult.HIT || outcome.getResult() == ShotResult.SUNK) {
                    registerHit(game.getId(), shot[0], shot[1]);
                }
                if (outcome.getResult() == ShotResult.SUNK) {
                    registerSunk(game.getId(), shot[0], shot[1]);
                }
            }
            attempts++;
        }

        if (outcome == null) {
            return TurnResult.NO_SHOT;
        }

        if (game.getPhase() == GamePhase.FINISHED) {
            cleanup(game.getId());
            return TurnResult.GAME_OVER;
        }

        if (isBotTurn(game)) {
            return TurnResult.HIT;
        }

        return TurnResult.MISS;
    }

    /**
     * Verifica se é o turno do bot no jogo.
     */
    public boolean isBotTurn(Game game) {
        return game.getPhase() == GamePhase.IN_PROGRESS
                && BOT_ID.equals(game.getCurrentTurnPlayerId());
    }

    public void cleanup(String gameId) {
        shotHistory.remove(gameId);
        activeHits.remove(gameId);
    }

    /**
     * Target mode: trata cada cluster de hits separadamente.
     * Prioriza clusters maiores (mais perto de afundar).
     */
    private int[] chooseTargetShot(List<int[]> hits, boolean[][] shots) {
        // Agrupar hits em clusters lineares (por linha ou coluna)
        List<List<int[]>> clusters = findClusters(hits);

        // Ordenar: clusters maiores primeiro (prioridade para quase-afundados)
        clusters.sort((a, b) -> b.size() - a.size());

        for (List<int[]> cluster : clusters) {
            int[] shot = chooseTargetForCluster(cluster, shots);
            if (shot != null) return shot;
        }

        // Fallback: tentar adjacentes de qualquer hit individual
        List<int[]> shuffled = new ArrayList<>(hits);
        Collections.shuffle(shuffled, random);
        for (int[] hit : shuffled) {
            int[] shot = chooseAdjacentShot(hit, shots);
            if (shot != null) return shot;
        }

        return null;
    }

    /**
     * Para um cluster específico, decide onde atirar.
     */
    private int[] chooseTargetForCluster(List<int[]> cluster, boolean[][] shots) {
        if (cluster.size() == 1) {
            return chooseAdjacentShot(cluster.get(0), shots);
        }

        // Detectar orientação do cluster
        boolean sameRow = true;
        boolean sameCol = true;
        int refRow = cluster.get(0)[0];
        int refCol = cluster.get(0)[1];

        for (int[] h : cluster) {
            if (h[0] != refRow) sameRow = false;
            if (h[1] != refCol) sameCol = false;
        }

        if (sameRow) {
            // Horizontal: expandir nas pontas
            int row = refRow;
            int minCol = Integer.MAX_VALUE, maxCol = Integer.MIN_VALUE;
            for (int[] h : cluster) {
                minCol = Math.min(minCol, h[1]);
                maxCol = Math.max(maxCol, h[1]);
            }

            // Shufflar direção para não ser previsível
            if (random.nextBoolean()) {
                if (maxCol + 1 < 10 && !shots[row][maxCol + 1]) return new int[]{row, maxCol + 1};
                if (minCol - 1 >= 0 && !shots[row][minCol - 1]) return new int[]{row, minCol - 1};
            } else {
                if (minCol - 1 >= 0 && !shots[row][minCol - 1]) return new int[]{row, minCol - 1};
                if (maxCol + 1 < 10 && !shots[row][maxCol + 1]) return new int[]{row, maxCol + 1};
            }
        }

        if (sameCol) {
            // Vertical: expandir nas pontas
            int col = refCol;
            int minRow = Integer.MAX_VALUE, maxRow = Integer.MIN_VALUE;
            for (int[] h : cluster) {
                minRow = Math.min(minRow, h[0]);
                maxRow = Math.max(maxRow, h[0]);
            }

            if (random.nextBoolean()) {
                if (maxRow + 1 < 10 && !shots[maxRow + 1][col]) return new int[]{maxRow + 1, col};
                if (minRow - 1 >= 0 && !shots[minRow - 1][col]) return new int[]{minRow - 1, col};
            } else {
                if (minRow - 1 >= 0 && !shots[minRow - 1][col]) return new int[]{minRow - 1, col};
                if (maxRow + 1 < 10 && !shots[maxRow + 1][col]) return new int[]{maxRow + 1, col};
            }
        }

        // Cluster não é linear (L-shape possível com navios adjacentes) — tratar como hits individuais
        for (int[] h : cluster) {
            int[] shot = chooseAdjacentShot(h, shots);
            if (shot != null) return shot;
        }

        return null;
    }

    /**
     * Agrupa hits em clusters de adjacência, mas apenas lineares (mesma row OU mesma col).
     * Hits que não estão na mesma linha/coluna com vizinhos formam clusters de 1.
     */
    private List<List<int[]>> findClusters(List<int[]> hits) {
        if (hits.isEmpty()) return new ArrayList<>();

        Set<String> remaining = new HashSet<>();
        Map<String, int[]> lookup = new HashMap<>();
        for (int[] h : hits) {
            String key = h[0] + "," + h[1];
            remaining.add(key);
            lookup.put(key, h);
        }

        List<List<int[]>> clusters = new ArrayList<>();

        while (!remaining.isEmpty()) {
            String start = remaining.iterator().next();
            int[] startCell = lookup.get(start);

            // BFS para encontrar grupo conectado
            Set<String> visited = new HashSet<>();
            Queue<String> queue = new LinkedList<>();
            queue.add(start);
            visited.add(start);

            while (!queue.isEmpty()) {
                String cell = queue.poll();
                int[] coords = lookup.get(cell);
                int[][] dirs = {{0, 1}, {0, -1}, {1, 0}, {-1, 0}};
                for (int[] dir : dirs) {
                    String neighbor = (coords[0] + dir[0]) + "," + (coords[1] + dir[1]);
                    if (remaining.contains(neighbor) && !visited.contains(neighbor)) {
                        visited.add(neighbor);
                        queue.add(neighbor);
                    }
                }
            }

            // Agora, dentro desse grupo conectado, separar em sub-clusters lineares
            List<int[]> group = new ArrayList<>();
            for (String key : visited) {
                group.add(lookup.get(key));
                remaining.remove(key);
            }

            // Se todos estão na mesma row ou col, é um cluster linear
            if (isLinear(group)) {
                clusters.add(group);
            } else {
                // Separar: tentar extrair linhas horizontais e verticais
                List<List<int[]>> subClusters = splitIntoLinearClusters(group);
                clusters.addAll(subClusters);
            }
        }

        return clusters;
    }

    private boolean isLinear(List<int[]> group) {
        if (group.size() <= 1) return true;
        boolean sameRow = true, sameCol = true;
        int r0 = group.get(0)[0], c0 = group.get(0)[1];
        for (int[] h : group) {
            if (h[0] != r0) sameRow = false;
            if (h[1] != c0) sameCol = false;
        }
        return sameRow || sameCol;
    }

    /**
     * Quando um grupo de hits forma um L ou T (navios adjacentes),
     * separa em segmentos lineares independentes.
     */
    private List<List<int[]>> splitIntoLinearClusters(List<int[]> group) {
        List<List<int[]>> result = new ArrayList<>();

        // Agrupar por row
        Map<Integer, List<int[]>> byRow = new HashMap<>();
        Map<Integer, List<int[]>> byCol = new HashMap<>();
        for (int[] h : group) {
            byRow.computeIfAbsent(h[0], k -> new ArrayList<>()).add(h);
            byCol.computeIfAbsent(h[1], k -> new ArrayList<>()).add(h);
        }

        Set<String> assigned = new HashSet<>();

        // Extrair segmentos horizontais contíguos (≥2 cells)
        for (Map.Entry<Integer, List<int[]>> entry : byRow.entrySet()) {
            List<int[]> rowHits = entry.getValue();
            if (rowHits.size() < 2) continue;
            rowHits.sort(Comparator.comparingInt(h -> h[1]));

            List<int[]> segment = new ArrayList<>();
            segment.add(rowHits.get(0));
            for (int i = 1; i < rowHits.size(); i++) {
                if (rowHits.get(i)[1] == rowHits.get(i - 1)[1] + 1) {
                    segment.add(rowHits.get(i));
                } else {
                    if (segment.size() >= 2) {
                        result.add(new ArrayList<>(segment));
                        for (int[] h : segment) assigned.add(h[0] + "," + h[1]);
                    }
                    segment = new ArrayList<>();
                    segment.add(rowHits.get(i));
                }
            }
            if (segment.size() >= 2) {
                result.add(new ArrayList<>(segment));
                for (int[] h : segment) assigned.add(h[0] + "," + h[1]);
            }
        }

        // Extrair segmentos verticais contíguos (≥2 cells, não já atribuídos)
        for (Map.Entry<Integer, List<int[]>> entry : byCol.entrySet()) {
            List<int[]> colHits = entry.getValue();
            if (colHits.size() < 2) continue;
            colHits.sort(Comparator.comparingInt(h -> h[0]));

            List<int[]> segment = new ArrayList<>();
            segment.add(colHits.get(0));
            for (int i = 1; i < colHits.size(); i++) {
                if (colHits.get(i)[0] == colHits.get(i - 1)[0] + 1) {
                    segment.add(colHits.get(i));
                } else {
                    List<int[]> unassigned = new ArrayList<>();
                    for (int[] h : segment) {
                        if (!assigned.contains(h[0] + "," + h[1])) unassigned.add(h);
                    }
                    if (unassigned.size() >= 2) {
                        result.add(unassigned);
                        for (int[] h : unassigned) assigned.add(h[0] + "," + h[1]);
                    }
                    segment = new ArrayList<>();
                    segment.add(colHits.get(i));
                }
            }
            List<int[]> unassigned = new ArrayList<>();
            for (int[] h : segment) {
                if (!assigned.contains(h[0] + "," + h[1])) unassigned.add(h);
            }
            if (unassigned.size() >= 2) {
                result.add(unassigned);
                for (int[] h : unassigned) assigned.add(h[0] + "," + h[1]);
            }
        }

        // Hits restantes que não pertencem a nenhum segmento linear → clusters de 1
        for (int[] h : group) {
            if (!assigned.contains(h[0] + "," + h[1])) {
                List<int[]> single = new ArrayList<>();
                single.add(h);
                result.add(single);
            }
        }

        return result;
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
     * Encontra o cluster linear (segmento reto) que contém (row, col).
     * Usado no registerSunk para remover apenas o navio afundado, sem afetar adjacentes.
     */
    private Set<String> findLinearCluster(List<int[]> hits, int row, int col) {
        Set<String> hitSet = new HashSet<>();
        for (int[] h : hits) hitSet.add(h[0] + "," + h[1]);

        String target = row + "," + col;
        if (!hitSet.contains(target)) {
            // O ponto do último tiro pode não estar em activeHits se foi adicionado
            // depois. Adicionar temporariamente para a busca.
            hitSet.add(target);
        }

        // Tentar expansão horizontal
        Set<String> horizontal = new HashSet<>();
        horizontal.add(target);
        // Expandir para a direita
        int c = col + 1;
        while (c < 10 && hitSet.contains(row + "," + c)) {
            horizontal.add(row + "," + c);
            c++;
        }
        // Expandir para a esquerda
        c = col - 1;
        while (c >= 0 && hitSet.contains(row + "," + c)) {
            horizontal.add(row + "," + c);
            c--;
        }

        // Tentar expansão vertical
        Set<String> vertical = new HashSet<>();
        vertical.add(target);
        int r = row + 1;
        while (r < 10 && hitSet.contains(r + "," + col)) {
            vertical.add(r + "," + col);
            r++;
        }
        r = row - 1;
        while (r >= 0 && hitSet.contains(r + "," + col)) {
            vertical.add(r + "," + col);
            r--;
        }

        // Retornar o maior cluster (mais provável de ser o navio real)
        return horizontal.size() >= vertical.size() ? horizontal : vertical;
    }
}
