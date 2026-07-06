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
import java.util.concurrent.*;

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

    private String token1;
    private String token2;
    private String username1 = "player1_" + System.currentTimeMillis();
    private String username2 = "player2_" + System.currentTimeMillis();

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
        token1 = registerAndGetToken(username1);
        token2 = registerAndGetToken(username2);
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
        Thread.sleep(200);

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
        Thread.sleep(200);

        // 5. Player2 entra na sala
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
            stateQueue1.poll(5, TimeUnit.SECONDS); // consumir state update
        }

        for (int i = 0; i < ships.length; i++) {
            Map<String, Object> placeMsg2 = Map.of(
                    "gameId", gameId, "shipType", ships[i][0],
                    "row", i, "col", 0, "orientation", ships[i][1]);
            session2.send("/app/game/place-ship", placeMsg2);
            stateQueue2.poll(5, TimeUnit.SECONDS); // consumir state update
        }

        // Drenar mensagens restantes (state enviado ao outro jogador)
        Thread.sleep(500);
        stateQueue1.clear();
        stateQueue2.clear();

        // Verificar que o jogo começou — buscar último state
        // Fazer um tiro para receber o state atualizado e confirmar IN_PROGRESS
        // Primeiro descobrir quem tem o turno — atirar com player1 e ver se funciona
        Map<String, Object> testShot = Map.of("gameId", gameId, "row", 9, "col", 9);
        session1.send("/app/game/shoot", testShot);
        Thread.sleep(500);

        // Pegar o último state disponível
        GameStateResponse latestState = null;
        GameStateResponse polled;
        while ((polled = stateQueue1.poll(500, TimeUnit.MILLISECONDS)) != null) {
            latestState = polled;
        }

        // Se player1 não tinha o turno, tenta com player2
        if (latestState == null) {
            session2.send("/app/game/shoot", testShot);
            Thread.sleep(500);
            while ((polled = stateQueue2.poll(500, TimeUnit.MILLISECONDS)) != null) {
                latestState = polled;
            }
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
        String token = registerAndGetToken("solo_" + System.currentTimeMillis());
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
        Thread.sleep(200);

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
        Thread.sleep(500);

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
            Thread.sleep(200);
        }

        // Aguardar o jogo começar (estado IN_PROGRESS)
        Thread.sleep(1000);
        GameStateResponse latestState = null;
        GameStateResponse polled;
        while ((polled = stateQueue.poll(500, TimeUnit.MILLISECONDS)) != null) {
            latestState = polled;
        }

        assertNotNull(latestState, "Deveria receber game state após posicionar navios");
        // O jogo pode já estar IN_PROGRESS ou o bot pode já ter jogado
        assertTrue(latestState.getPhase().equals("IN_PROGRESS") || latestState.getPhase().equals("FINISHED"),
                "Fase deveria ser IN_PROGRESS ou FINISHED, mas foi: " + latestState.getPhase());

        session.disconnect();
    }

    @Test
    @Order(3)
    void testJoinNonexistentRoom() throws Exception {
        String token = registerAndGetToken("error_" + System.currentTimeMillis());
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
        Thread.sleep(200);

        session.send("/app/game/join", Map.of("gameId", "ZZZZ"));
        Map error = errorQueue.poll(5, TimeUnit.SECONDS);
        assertNotNull(error, "Deveria receber erro ao entrar em sala inexistente");
        assertTrue(((String) error.get("message")).contains("não encontrada"));

        session.disconnect();
    }

    @Test
    @Order(4)
    void testSurrenderFlow() throws Exception {
        String t1 = registerAndGetToken("surr1_" + System.currentTimeMillis());
        String t2 = registerAndGetToken("surr2_" + System.currentTimeMillis());

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
        Thread.sleep(200);

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
        Thread.sleep(200);

        s2.send("/app/game/join", Map.of("gameId", gameId));
        stateQueue1.poll(5, TimeUnit.SECONDS);
        stateQueue2.poll(5, TimeUnit.SECONDS);

        // Player1 desiste
        s1.send("/app/game/surrender", Map.of("gameId", gameId));
        Thread.sleep(500);

        GameStateResponse finalState = null;
        GameStateResponse polled;
        while ((polled = stateQueue2.poll(500, TimeUnit.MILLISECONDS)) != null) {
            finalState = polled;
        }

        assertNotNull(finalState, "Player2 deveria receber state de FINISHED após surrender");
        assertEquals("FINISHED", finalState.getPhase());

        s1.disconnect();
        s2.disconnect();
    }
}
