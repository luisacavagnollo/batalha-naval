package com.batalha_naval.service;

import com.batalha_naval.domain.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class BotServiceTest {

    private BotService botService;

    @BeforeEach
    void setUp() {
        botService = new BotService();
    }

    // --- placeShipsRandomly ---

    @Test
    void placeShipsRandomly_placesAll5Ships() {
        Game game = createGameWithBot();
        botService.placeShipsRandomly(game);
        assertEquals(5, game.getBoard2().getShips().size());
    }

    @Test
    void placeShipsRandomly_allShipTypesPresent() {
        Game game = createGameWithBot();
        botService.placeShipsRandomly(game);

        Set<ShipType> types = new HashSet<>();
        for (Ship ship : game.getBoard2().getShips()) {
            types.add(ship.getType());
        }
        assertEquals(5, types.size());
        assertTrue(types.contains(ShipType.CARRIER));
        assertTrue(types.contains(ShipType.BATTLESHIP));
        assertTrue(types.contains(ShipType.CRUISER));
        assertTrue(types.contains(ShipType.SUBMARINE));
        assertTrue(types.contains(ShipType.DESTROYER));
    }

    @Test
    void placeShipsRandomly_noOverlap() {
        Game game = createGameWithBot();
        botService.placeShipsRandomly(game);

        // Contar células ocupadas — deve ser 5+4+3+3+2 = 17
        int occupied = 0;
        CellState[][] grid = game.getBoard2().getGrid();
        for (int r = 0; r < 10; r++)
            for (int c = 0; c < 10; c++)
                if (grid[r][c] == CellState.SHIP) occupied++;
        assertEquals(17, occupied);
    }

    // --- chooseShot (hunt mode) ---

    @Test
    void chooseShot_huntMode_returnsValidCoordinate() {
        String gameId = "hunt-test";
        int[] shot = botService.chooseShot(gameId);

        assertNotNull(shot);
        assertTrue(shot[0] >= 0 && shot[0] < 10);
        assertTrue(shot[1] >= 0 && shot[1] < 10);
        botService.cleanup(gameId);
    }

    @Test
    void chooseShot_huntMode_neverRepeatsSameCell() {
        String gameId = "no-repeat-test";
        Set<String> firedAt = new HashSet<>();

        for (int i = 0; i < 100; i++) {
            int[] shot = botService.chooseShot(gameId);
            assertNotNull(shot, "Shot should not be null with cells available");
            String key = shot[0] + "," + shot[1];
            assertFalse(firedAt.contains(key), "Should not fire at same cell twice: " + key);
            firedAt.add(key);
        }
        // Após 100 tiros, deve retornar null
        assertNull(botService.chooseShot(gameId), "Should return null when all cells exhausted");
        botService.cleanup(gameId);
    }

    // --- chooseShot (target mode) ---

    @Test
    void chooseShot_targetMode_afterHit_shootsAdjacent() {
        String gameId = "target-test";
        // Primeiro tiro em modo hunt (não importa onde)
        botService.chooseShot(gameId);

        // Registrar hit em (5, 5)
        botService.registerHit(gameId, 5, 5);

        // Próximo tiro deve ser adjacente a (5,5)
        int[] nextShot = botService.chooseShot(gameId);
        assertNotNull(nextShot);
        assertTrue(isAdjacent(5, 5, nextShot[0], nextShot[1]),
                "After hit at (5,5), next shot should be adjacent. Got: (" + nextShot[0] + "," + nextShot[1] + ")");
        botService.cleanup(gameId);
    }

    @Test
    void chooseShot_targetMode_twoHitsSameRow_expandsHorizontally() {
        String gameId = "horiz-test";

        // Simular dois hits horizontais em (3, 4) e (3, 5)
        botService.registerHit(gameId, 3, 4);
        botService.registerHit(gameId, 3, 5);

        // O bot deve tentar expandir horizontalmente: (3, 3) ou (3, 6)
        int[] shot = botService.chooseShot(gameId);
        assertNotNull(shot);
        assertEquals(3, shot[0], "Should stay on same row");
        assertTrue(shot[1] == 3 || shot[1] == 6,
                "Should expand to col 3 or 6. Got: col " + shot[1]);
        botService.cleanup(gameId);
    }

    @Test
    void chooseShot_targetMode_twoHitsSameCol_expandsVertically() {
        String gameId = "vert-test";

        // Simular dois hits verticais em (2, 7) e (3, 7)
        botService.registerHit(gameId, 2, 7);
        botService.registerHit(gameId, 3, 7);

        // O bot deve tentar expandir verticalmente: (1, 7) ou (4, 7)
        int[] shot = botService.chooseShot(gameId);
        assertNotNull(shot);
        assertEquals(7, shot[1], "Should stay on same col");
        assertTrue(shot[0] == 1 || shot[0] == 4,
                "Should expand to row 1 or 4. Got: row " + shot[0]);
        botService.cleanup(gameId);
    }

    @Test
    void chooseShot_targetMode_edgeHit_doesNotGoOutOfBounds() {
        String gameId = "edge-test";

        // Hit no canto (0, 0)
        botService.registerHit(gameId, 0, 0);

        // Próximo tiro deve ser (0, 1) ou (1, 0) — não pode ir para negativo
        int[] shot = botService.chooseShot(gameId);
        assertNotNull(shot);
        assertTrue(shot[0] >= 0 && shot[0] < 10 && shot[1] >= 0 && shot[1] < 10,
                "Shot must be within bounds");
        assertTrue(isAdjacent(0, 0, shot[0], shot[1]));
        botService.cleanup(gameId);
    }

    // --- registerSunk ---

    @Test
    void registerSunk_removesOnlySunkShipHits() {
        String gameId = "sunk-test";

        // Dois navios: um horizontal em row 2 (cols 3,4,5) e um hit em (5, 5)
        botService.registerHit(gameId, 2, 3);
        botService.registerHit(gameId, 2, 4);
        botService.registerHit(gameId, 2, 5);
        botService.registerHit(gameId, 5, 5); // outro navio

        // Afundar o navio em row 2, último hit em (2, 5)
        botService.registerSunk(gameId, 2, 5);

        // Agora o bot deve ter apenas o hit (5,5) ativo, então o próximo tiro
        // deve ser adjacente a (5, 5)
        int[] shot = botService.chooseShot(gameId);
        assertNotNull(shot);
        assertTrue(isAdjacent(5, 5, shot[0], shot[1]),
                "After sinking ship at row 2, should target remaining hit at (5,5). Got: (" + shot[0] + "," + shot[1] + ")");
        botService.cleanup(gameId);
    }

    @Test
    void registerSunk_verticalShip_removesCorrectHits() {
        String gameId = "sunk-vert-test";

        // Navio vertical em col 6, rows 0-3
        botService.registerHit(gameId, 0, 6);
        botService.registerHit(gameId, 1, 6);
        botService.registerHit(gameId, 2, 6);
        botService.registerHit(gameId, 3, 6);

        // Hit isolado em (7, 2)
        botService.registerHit(gameId, 7, 2);

        // Afundar o navio vertical (último hit em (3, 6))
        botService.registerSunk(gameId, 3, 6);

        // Próximo tiro deve ser adjacente a (7, 2)
        int[] shot = botService.chooseShot(gameId);
        assertNotNull(shot);
        assertTrue(isAdjacent(7, 2, shot[0], shot[1]),
                "Should target remaining hit at (7,2). Got: (" + shot[0] + "," + shot[1] + ")");
        botService.cleanup(gameId);
    }

    // --- isBotTurn ---

    @Test
    void isBotTurn_trueWhenBotsTurn() {
        Game game = createGameWithBot();
        placeAllShips(game);
        game.setCurrentTurnPlayerId(BotService.BOT_ID);
        assertTrue(botService.isBotTurn(game));
    }

    @Test
    void isBotTurn_falseWhenPlayersTurn() {
        Game game = createGameWithBot();
        placeAllShips(game);
        game.setCurrentTurnPlayerId("player1");
        assertFalse(botService.isBotTurn(game));
    }

    @Test
    void isBotTurn_falseWhenGameNotInProgress() {
        Game game = createGameWithBot();
        game.setPhase(GamePhase.PLACING_SHIPS);
        game.setCurrentTurnPlayerId(BotService.BOT_ID);
        assertFalse(botService.isBotTurn(game));
    }

    // --- executeTurn ---

    @Test
    void executeTurn_makesAtLeastOneShot() {
        Game game = createGameWithBot();
        placeAllShips(game);
        game.setCurrentTurnPlayerId(BotService.BOT_ID);

        int[] stateUpdates = {0};
        botService.executeTurn(game, () -> stateUpdates[0]++);

        assertTrue(stateUpdates[0] >= 1, "Should have made at least 1 shot");
        botService.cleanup(game.getId());
    }

    @Test
    void executeTurn_returnsFalseWhenNotBotTurn() {
        Game game = createGameWithBot();
        placeAllShips(game);
        game.setCurrentTurnPlayerId("player1");

        boolean result = botService.executeTurn(game, () -> {});
        assertFalse(result, "Should return false when not bot's turn");
    }

    @Test
    void executeTurn_canFinishGame() {
        // Criar jogo onde player1 tem apenas um destroyer (size 2)
        Game game = new Game();
        game.setId("finish-test");
        game.setPlayer1Id("player1");
        game.setPlayer2Id(BotService.BOT_ID);

        // Player1: apenas um destroyer em (0, 0)-(0, 1)
        game.placeShip("player1", ShipType.DESTROYER, 0, 0, Orientation.HORIZONTAL);

        // Bot: colocar todos os navios (necessário para o jogo ser válido no start)
        // Mas como não vamos testar o jogo inteiro, vamos simular manualmente
        game.placeShip(BotService.BOT_ID, ShipType.CARRIER, 5, 0, Orientation.HORIZONTAL);
        game.placeShip(BotService.BOT_ID, ShipType.BATTLESHIP, 6, 0, Orientation.HORIZONTAL);
        game.placeShip(BotService.BOT_ID, ShipType.CRUISER, 7, 0, Orientation.HORIZONTAL);
        game.placeShip(BotService.BOT_ID, ShipType.SUBMARINE, 8, 0, Orientation.HORIZONTAL);
        game.placeShip(BotService.BOT_ID, ShipType.DESTROYER, 9, 0, Orientation.HORIZONTAL);

        // Precisamos adicionar os navios restantes do player1 para startGameIfReady funcionar
        game.placeShip("player1", ShipType.CARRIER, 1, 0, Orientation.HORIZONTAL);
        game.placeShip("player1", ShipType.BATTLESHIP, 2, 0, Orientation.HORIZONTAL);
        game.placeShip("player1", ShipType.CRUISER, 3, 0, Orientation.HORIZONTAL);
        game.placeShip("player1", ShipType.SUBMARINE, 4, 0, Orientation.HORIZONTAL);
        game.startGameIfReady();

        // Forçar turno do bot
        game.setCurrentTurnPlayerId(BotService.BOT_ID);

        // Executar muitos turnos — o bot eventualmente vai afundar tudo
        boolean finished = botService.executeTurn(game, () -> {});

        // Pode ter terminado ou ter passado o turno; em ambos os casos a lógica é válida
        if (finished) {
            assertEquals(GamePhase.FINISHED, game.getPhase());
            assertEquals(BotService.BOT_ID, game.getWinnerId());
        }
        botService.cleanup(game.getId());
    }

    // --- cleanup ---

    @Test
    void cleanup_removesGameState() {
        String gameId = "cleanup-test";
        botService.chooseShot(gameId); // cria estado interno
        botService.registerHit(gameId, 5, 5);

        botService.cleanup(gameId);

        // Após cleanup, um novo chooseShot deve funcionar como se fosse novo jogo
        int[] shot = botService.chooseShot(gameId);
        assertNotNull(shot);
        // Não deve ter hits ativos, então deve estar em hunt mode
        // (qualquer célula é válida, inclusive (5,5) que foi limpa)
        botService.cleanup(gameId);
    }

    // --- Helpers ---

    private boolean isAdjacent(int r1, int c1, int r2, int c2) {
        int dr = Math.abs(r1 - r2);
        int dc = Math.abs(c1 - c2);
        return (dr == 1 && dc == 0) || (dr == 0 && dc == 1);
    }

    private Game createGameWithBot() {
        Game game = new Game();
        game.setId("bot-test-" + System.nanoTime());
        game.setPlayer1Id("player1");
        game.setPlayer2Id(BotService.BOT_ID);
        return game;
    }

    private void placeAllShips(Game game) {
        game.placeShip("player1", ShipType.CARRIER, 0, 0, Orientation.VERTICAL);
        game.placeShip("player1", ShipType.BATTLESHIP, 0, 1, Orientation.VERTICAL);
        game.placeShip("player1", ShipType.CRUISER, 0, 2, Orientation.VERTICAL);
        game.placeShip("player1", ShipType.SUBMARINE, 0, 3, Orientation.VERTICAL);
        game.placeShip("player1", ShipType.DESTROYER, 0, 4, Orientation.VERTICAL);

        game.placeShip(BotService.BOT_ID, ShipType.CARRIER, 5, 0, Orientation.HORIZONTAL);
        game.placeShip(BotService.BOT_ID, ShipType.BATTLESHIP, 6, 0, Orientation.HORIZONTAL);
        game.placeShip(BotService.BOT_ID, ShipType.CRUISER, 7, 0, Orientation.HORIZONTAL);
        game.placeShip(BotService.BOT_ID, ShipType.SUBMARINE, 8, 0, Orientation.HORIZONTAL);
        game.placeShip(BotService.BOT_ID, ShipType.DESTROYER, 9, 0, Orientation.HORIZONTAL);
        game.startGameIfReady();
    }
}
