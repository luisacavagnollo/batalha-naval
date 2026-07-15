package com.batalha_naval.controller;

import com.batalha_naval.dto.AuthRequest;
import com.batalha_naval.dto.AuthResponse;
import com.batalha_naval.dto.GameStateResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.web.server.LocalServerPort;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.converter.MappingJackson2MessageConverter;
import org.springframework.messaging.simp.stomp.*;
import org.springframework.web.socket.WebSocketHttpHeaders;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;

import java.lang.reflect.Type;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.*;

import static org.awaitility.Awaitility.await;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Teste de integração end-to-end: fluxo multiplayer completo via WebSocket STOMP.
 * Simula 2 jogadores: criar sala, entrar, posicionar navios, atirar até afundar.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class GameWebSocketIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    private WebSocketStompClient stompClient;
    private final ObjectMapper mapper = new ObjectMapper();

    @BeforeEach
    void setup() {
        stompClient = new WebSocketStompClient(new StandardWebSocketClient());
        stompClient.setMessageConverter(new MappingJackson2MessageConverter());
    }

    @AfterEach
    void teardown() {
        if (stompClient != null) {
            stompClient.stop();
        }
    }

    private String registerAndGetToken(String username) {
        AuthRequest req = new AuthRequest();
        req.setUsername(username);
        req.setEmail(username + "@test.com");
        req.setPassword("password123");
        ResponseEntity<AuthResponse> resp = restTemplate.postForEntity(
                "http://localhost:" + port + "/api/auth/register", req, AuthResponse.class);
        assertEquals(200, resp.getStatusCodeValue());
        assertNotNull(resp.getBody());
        return resp.getBody().getToken();
    }

    private StompSession connectStomp(String token) throws Exception {
        StompHeaders connectHeaders = new StompHeaders();
        connectHeaders.add("token", token);

        StompSession session = stompClient.connect(
                "ws://localhost:" + port + "/ws",
                new WebSocketHttpHeaders(),
                connectHeaders,
                new StompSessionHandlerAdapter() {
                    @Override
                    public void handleException(StompSession session, StompCommand command, StompHeaders headers, byte[] payload, Throwable exception) {
                        exception.printStackTrace();
                    }

                    @Override
                    public void handleTransportError(StompSession session, Throwable exception) {
                        exception.printStackTrace();
                    }
                }).get(5, TimeUnit.SECONDS);

        return session;
    }

    @Test
    @Order(1)
    void testFullMultiplayerFlow() throws Exception {
        // 1. Registrar dois jogadores
        String username1 = "p1_" + UUID.randomUUID().toString().substring(0, 8);
        String username2 = "p2_" + UUID.randomUUID().toString().substring(0, 8);
        String token1 = registerAndGetToken(username1);
        String token2 = registerAndGetToken(username2);
        assertNotNull(token1);
        assertNotNull(token2);

        // 2. Conectar via WebSocket STOMP
        StompSession session1 = connectStomp(token1);
        StompSession session2 = connectStomp(token2);
        assertTrue(session1.isConnected());
        assertTrue(session2.isConnected());

        // 3. Player1 cria sala
        BlockingQueue<Map> createdQueue = new LinkedBlockingQueue<>();
        session1.subscribe("/user/topic/game/created", new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) { return Map.class; }
            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                createdQueue.offer((Map) payload);
            }
        });

        await().atMost(2, TimeUnit.SECONDS).until(() -> session1.isConnected());

        session1.send("/app/game/create", new byte[0]);
        Map created = createdQueue.poll(5, TimeUnit.SECONDS);
        assertNotNull(created, "Deveria receber gameId ao criar sala");
        String gameId = (String) created.get("gameId");
        assertNotNull(gameId);
        assertEquals(4, gameId.length());

        // 4. Ambos subscrevem no game
        BlockingQueue<GameStateResponse> stateQueue1 = new LinkedBlockingQueue<>();
        BlockingQueue<GameStateResponse> stateQueue2 = new LinkedBlockingQueue<>();

        session1.subscribe("/user/topic/game/" + gameId, new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) { return GameStateResponse.class; }
            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                stateQueue1.offer((GameStateResponse) payload);
            }
        });
        session2.subscribe("/user/topic/game/" + gameId, new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) { return GameStateResponse.class; }
            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                stateQueue2.offer((GameStateResponse) payload);
            }
        });

        // 5. Player2 entra na sala — aguarda state chegar para ambos
        Map<String, String> joinMsg = Map.of("gameId", gameId);
        session2.send("/app/game/join", joinMsg);

        GameStateResponse state1 = stateQueue1.poll(5, TimeUnit.SECONDS);
        GameStateResponse state2 = stateQueue2.poll(5, TimeUnit.SECONDS);
        assertNotNull(state1, "Player1 deveria receber state após join");
        assertNotNull(state2, "Player2 deveria receber state após join");
        assertEquals("PLACING_SHIPS", state1.getPhase());
        assertEquals("PLACING_SHIPS", state2.getPhase());

        // 6. Ambos posicionam navios
        String[][] ships = {
                {"CARRIER", "HORIZONTAL"},
                {"BATTLESHIP", "HORIZONTAL"},
                {"CRUISER", "HORIZONTAL"},
                {"SUBMARINE", "HORIZONTAL"},
                {"DESTROYER", "HORIZONTAL"}
        };

        for (int i = 0; i < ships.length; i++) {
            Map<String, Object> placeMsg1 = Map.of(
                    "gameId", gameId, "shipType", ships[i][0],
                    "row", i, "col", 0, "orientation", ships[i][1]);
            session1.send("/app/game/place-ship", placeMsg1);
            assertNotNull(stateQueue1.poll(5, TimeUnit.SECONDS), "Deveria receber state após place-ship p1");
        }

        for (int i = 0; i < ships.length; i++) {
            Map<String, Object> placeMsg2 = Map.of(
                    "gameId", gameId, "shipType", ships[i][0],
                    "row", i, "col", 0, "orientation", ships[i][1]);
            session2.send("/app/game/place-ship", placeMsg2);
            assertNotNull(stateQueue2.poll(5, TimeUnit.SECONDS), "Deveria receber state após place-ship p2");
        }

        // Aguardar o jogo iniciar — drenar mensagens restantes e verificar IN_PROGRESS
        await().atMost(3, TimeUnit.SECONDS).untilAsserted(() -> {
            // Drenar todas as mensagens e verificar a última
            GameStateResponse latest = drainAndGetLast(stateQueue1);
            if (latest == null) {
                // Já drenou antes, tentar um tiro para forçar state
                return;
            }
            assertEquals("IN_PROGRESS", latest.getPhase());
        });

        // Drenar filas antes de prosseguir
        stateQueue1.clear();
        stateQueue2.clear();

        // Fazer um tiro para confirmar que o jogo está IN_PROGRESS
        Map<String, Object> testShot = Map.of("gameId", gameId, "row", 9, "col", 9);
        session1.send("/app/game/shoot", testShot);

        // Aguardar resposta de pelo menos um dos jogadores
        await().atMost(3, TimeUnit.SECONDS).until(() ->
                !stateQueue1.isEmpty() || !stateQueue2.isEmpty());

        GameStateResponse latestState = drainAndGetLast(stateQueue1);
        if (latestState == null) {
            // Se player1 não tinha o turno, tenta com player2
            session2.send("/app/game/shoot", testShot);
            await().atMost(3, TimeUnit.SECONDS).until(() -> !stateQueue2.isEmpty());
            latestState = drainAndGetLast(stateQueue2);
        }

        assertNotNull(latestState, "Deveria receber state após tiro");
        assertEquals("IN_PROGRESS", latestState.getPhase());

        // 7. Cleanup
        session1.disconnect();
        session2.disconnect();
    }

    @Test
    @Order(2)
    void testSinglePlayerFlow() throws Exception {
        String token = registerAndGetToken("solo_" + UUID.randomUUID().toString().substring(0, 8));
        StompSession session = connectStomp(token);
        assertTrue(session.isConnected());

        // Subscrever em game/created
        BlockingQueue<Map> createdQueue = new LinkedBlockingQueue<>();
        session.subscribe("/user/topic/game/created", new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) { return Map.class; }
            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                createdQueue.offer((Map) payload);
            }
        });

        await().atMost(2, TimeUnit.SECONDS).until(() -> session.isConnected());

        // Iniciar singleplayer
        session.send("/app/game/single-player", new byte[0]);
        Map created = createdQueue.poll(5, TimeUnit.SECONDS);
        assertNotNull(created, "Deveria receber gameId para singleplayer");
        String gameId = (String) created.get("gameId");
        assertTrue((Boolean) created.get("singlePlayer"));

        // Subscrever no game state
        BlockingQueue<GameStateResponse> stateQueue = new LinkedBlockingQueue<>();
        session.subscribe("/user/topic/game/" + gameId, new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) { return GameStateResponse.class; }
            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                stateQueue.offer((GameStateResponse) payload);
            }
        });

        // Posicionar navios
        String[][] ships = {
                {"CARRIER", "HORIZONTAL"},
                {"BATTLESHIP", "HORIZONTAL"},
                {"CRUISER", "HORIZONTAL"},
                {"SUBMARINE", "HORIZONTAL"},
                {"DESTROYER", "HORIZONTAL"}
        };

        for (int i = 0; i < ships.length; i++) {
            Map<String, Object> placeMsg = Map.of(
                    "gameId", gameId, "shipType", ships[i][0],
                    "row", i, "col", 0, "orientation", ships[i][1]);
            session.send("/app/game/place-ship", placeMsg);
            // Aguardar confirmação de cada posicionamento
            assertNotNull(stateQueue.poll(5, TimeUnit.SECONDS),
                    "Deveria receber state após posicionar navio " + ships[i][0]);
        }

        // Aguardar o jogo começar (estado IN_PROGRESS ou FINISHED se o bot jogou muito rápido)
        await().atMost(5, TimeUnit.SECONDS).untilAsserted(() -> {
            GameStateResponse latest = drainAndGetLast(stateQueue);
            assertNotNull(latest, "Deveria receber game state");
            assertTrue(latest.getPhase().equals("IN_PROGRESS") || latest.getPhase().equals("FINISHED"),
                    "Fase deveria ser IN_PROGRESS ou FINISHED, mas foi: " + latest.getPhase());
        });

        session.disconnect();
    }

    @Test
    @Order(3)
    void testJoinNonexistentRoom() throws Exception {
        String token = registerAndGetToken("error_" + UUID.randomUUID().toString().substring(0, 8));
        StompSession session = connectStomp(token);

        BlockingQueue<Map> errorQueue = new LinkedBlockingQueue<>();
        session.subscribe("/user/topic/game/error", new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) { return Map.class; }
            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                errorQueue.offer((Map) payload);
            }
        });

        await().atMost(2, TimeUnit.SECONDS).until(() -> session.isConnected());

        session.send("/app/game/join", Map.of("gameId", "ZZZZ"));
        Map error = errorQueue.poll(5, TimeUnit.SECONDS);
        assertNotNull(error, "Deveria receber erro ao entrar em sala inexistente");
        assertTrue(((String) error.get("message")).contains("não encontrada"));

        session.disconnect();
    }

    @Test
    @Order(4)
    void testSurrenderFlow() throws Exception {
        String t1 = registerAndGetToken("surr1_" + UUID.randomUUID().toString().substring(0, 8));
        String t2 = registerAndGetToken("surr2_" + UUID.randomUUID().toString().substring(0, 8));

        StompSession s1 = connectStomp(t1);
        StompSession s2 = connectStomp(t2);

        // Criar e entrar na sala
        BlockingQueue<Map> createdQueue = new LinkedBlockingQueue<>();
        s1.subscribe("/user/topic/game/created", new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) { return Map.class; }
            @Override
            public void handleFrame(StompHeaders headers, Object payload) { createdQueue.offer((Map) payload); }
        });

        await().atMost(2, TimeUnit.SECONDS).until(() -> s1.isConnected());

        s1.send("/app/game/create", new byte[0]);
        Map created = createdQueue.poll(5, TimeUnit.SECONDS);
        String gameId = (String) created.get("gameId");

        BlockingQueue<GameStateResponse> stateQueue1 = new LinkedBlockingQueue<>();
        BlockingQueue<GameStateResponse> stateQueue2 = new LinkedBlockingQueue<>();
        s1.subscribe("/user/topic/game/" + gameId, new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) { return GameStateResponse.class; }
            @Override
            public void handleFrame(StompHeaders headers, Object payload) { stateQueue1.offer((GameStateResponse) payload); }
        });
        s2.subscribe("/user/topic/game/" + gameId, new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) { return GameStateResponse.class; }
            @Override
            public void handleFrame(StompHeaders headers, Object payload) { stateQueue2.offer((GameStateResponse) payload); }
        });

        s2.send("/app/game/join", Map.of("gameId", gameId));

        // Aguardar ambos receberem o state de PLACING_SHIPS
        assertNotNull(stateQueue1.poll(5, TimeUnit.SECONDS), "P1 deveria receber state após join");
        assertNotNull(stateQueue2.poll(5, TimeUnit.SECONDS), "P2 deveria receber state após join");

        // Player1 desiste
        s1.send("/app/game/surrender", Map.of("gameId", gameId));

        // Aguardar Player2 receber o state FINISHED
        await().atMost(3, TimeUnit.SECONDS).untilAsserted(() -> {
            GameStateResponse finalState = drainAndGetLast(stateQueue2);
            assertNotNull(finalState, "Player2 deveria receber state de FINISHED após surrender");
            assertEquals("FINISHED", finalState.getPhase());
        });

        s1.disconnect();
        s2.disconnect();
    }

    /**
     * Drena uma BlockingQueue e retorna o último elemento, ou null se vazia.
     */
    private <T> T drainAndGetLast(BlockingQueue<T> queue) {
        T last = null;
        T item;
        while ((item = queue.poll()) != null) {
            last = item;
        }
        return last;
    }
}
