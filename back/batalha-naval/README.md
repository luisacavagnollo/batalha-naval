# 🚢 Batalha Naval — Multiplayer com Fog of War

Jogo de Batalha Naval online multiplayer com Fog of War. Cada jogador enxerga apenas seu próprio tabuleiro e o resultado dos tiros no adversário. O servidor é **autoritativo** — nunca expõe o estado do tabuleiro do oponente.

## Stack

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| Backend | Java 17 + Spring Boot 4 | Ecossistema robusto, suporte nativo a WebSocket/STOMP, DI integrada |
| Tempo Real | WebSocket (STOMP) | Comunicação bidirecional para turnos em tempo real sem polling |
| Autenticação | JWT + Spring Security | Stateless, compatível com SPA, token reutilizado no handshake WebSocket |
| Persistência (jogo) | In-memory (ConcurrentHashMap) | Partidas são efêmeras — sem overhead de banco para dados transientes |
| Persistência (usuários) | H2 (in-memory) + JPA | Cadastro/login leve, sem setup externo, DDL automático |
| Frontend | React + Vite (separado) | SPA moderna, build rápido, excelente DX |
| Deploy | Render (backend) + Vercel (frontend) | Free tier com suporte a WebSocket |

## Arquitetura

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (React)                   │
│         Vercel — SPA com STOMP client                │
└─────────────────┬───────────────────────────────────┘
                  │ WebSocket (STOMP)    REST (auth)
                  ▼
┌─────────────────────────────────────────────────────┐
│                Backend (Spring Boot)                  │
│                     Render                            │
├──────────────┬──────────────┬───────────────────────┤
│  Controller  │   Security   │     WebSocket          │
│  (REST)      │   (JWT)      │   (STOMP broker)       │
├──────────────┴──────────────┴───────────────────────┤
│                   Service Layer                       │
│         GameService (matchmaking, turnos)             │
│         UserService (registro, auth)                  │
├─────────────────────────────────────────────────────┤
│                   Domain Layer                        │
│     Board │ Game │ Ship │ Enums (puro, sem deps)     │
├─────────────────────────────────────────────────────┤
│              Persistence                             │
│   ConcurrentHashMap (jogos)  │  H2/JPA (usuários)   │
└─────────────────────────────────────────────────────┘
```

## Decisões de Arquitetura

### Servidor Autoritativo
Toda lógica de jogo vive no servidor. O cliente nunca recebe posições de navios do oponente — apenas `HIT`, `MISS` ou `SUNK` como resultado. A view do oponente (`getGridForOpponent()`) filtra células `SHIP` → `EMPTY`.

### WebSocket com STOMP
STOMP sobre WebSocket permite pub/sub por partida (`/topic/game/{id}`). Cada evento é enviado personalizado por jogador — cada um vê apenas sua perspectiva. Mais eficiente que polling REST para turnos em tempo real.

### JWT Stateless
Token JWT gerado no login/registro, validado no filtro HTTP e no handshake WebSocket. Sem sessão server-side = fácil escalar horizontalmente.

### Persistência In-Memory
Partidas são transientes por natureza. `ConcurrentHashMap` é thread-safe e elimina latência de I/O. Placar e usuários persistem enquanto o servidor estiver ativo (requisito do projeto).

## Endpoints

### REST (Autenticação)
| Método | Path | Descrição |
|--------|------|-----------|
| POST | `/api/auth/register` | Registra novo usuário, retorna JWT |
| POST | `/api/auth/login` | Autentica, retorna JWT |

### WebSocket (STOMP)
| Destination | Descrição |
|-------------|-----------|
| `/app/game/find` | Busca ou cria partida (matchmaking) |
| `/app/game/place-ship` | Posiciona navio no tabuleiro |
| `/app/game/shoot` | Dispara tiro no oponente |
| `/topic/game/{id}` | Recebe eventos da partida |

## Regras do Jogo

- Tabuleiro 10×10
- Frota: Porta-aviões (5), Navio-tanque (4), Contratorpedeiro (3), Submarino (3), Destroyer (2)
- Ambos posicionam todos os navios → jogo inicia
- Turnos alternados, começando pelo player 1
- Resultado do tiro: `MISS`, `HIT`, `SUNK`
- Vence quem afundar todos os 5 navios do adversário

## Executar Localmente

```bash
cd batalha-naval
./mvnw spring-boot:run
```

Backend disponível em `http://localhost:8080`.

## Testes

```bash
./mvnw test
```

Cobertura: Board (posicionamento, tiros, fog of war), Ship (células, afundamento), Game (turnos, fases, vitória), GameService (matchmaking, score).

## Deploy

### Backend (Render)
1. Push para GitHub
2. Criar Web Service no Render apontando para o repo
3. Build command: `cd batalha-naval && ./mvnw clean package -DskipTests`
4. Start command: `java -jar batalha-naval/target/batalha-naval-0.0.1-SNAPSHOT.jar`

### Frontend (Vercel)
1. Push do projeto React para GitHub
2. Import no Vercel, apontar variável `VITE_WS_URL` para a URL do Render
