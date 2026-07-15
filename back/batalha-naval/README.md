# 🚢 Batalha Naval — Multiplayer com Fog of War

Jogo de Batalha Naval online multiplayer com Fog of War. Cada jogador enxerga apenas seu próprio tabuleiro e o resultado dos tiros no adversário. O servidor é **autoritativo** — nunca expõe o estado do tabuleiro do oponente.

## Stack

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| Backend | Java 11 + Spring Boot 2.7.18 | Ecossistema robusto, suporte nativo a WebSocket/STOMP, DI integrada |
| Tempo Real | WebSocket (STOMP) | Comunicação bidirecional para turnos em tempo real sem polling |
| Autenticação | JWT (jjwt 0.12.6) + Spring Security | Stateless, compatível com SPA, token reutilizado no handshake WebSocket |
| Persistência (jogo) | In-memory (ConcurrentHashMap) | Partidas são efêmeras — sem overhead de banco para dados transientes |
| Persistência (usuários) | H2 (dev) / PostgreSQL (prod) + JPA | Cadastro/login com DDL automático; H2 para desenvolvimento, PostgreSQL em produção |
| Frontend | React 19 + Vite 6 + Tailwind CSS 4 | SPA moderna, build rápido, estilização utilitária |
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
│    GameService │ MatchmakingService │ BotService     │
│         UserService │ RateLimiterService             │
├─────────────────────────────────────────────────────┤
│                   Domain Layer                        │
│   Board │ Game │ Ship │ ShipType │ ShotOutcome       │
│   CellState │ GamePhase │ Orientation │ ShotResult   │
├─────────────────────────────────────────────────────┤
│              Persistence                             │
│   ConcurrentHashMap (jogos)  │  H2/PostgreSQL (JPA) │
└─────────────────────────────────────────────────────┘
```

## Decisões de Arquitetura

### Servidor Autoritativo
Toda lógica de jogo vive no servidor. O cliente nunca recebe posições de navios do oponente — apenas `HIT`, `MISS` ou `SUNK` como resultado. A view do oponente (`getGridForOpponent()`) filtra células `SHIP` → `EMPTY`. Ao final da partida, o tabuleiro adversário é revelado para fins de UX.

### WebSocket com STOMP
STOMP sobre WebSocket permite pub/sub por partida (`/topic/game/{id}`). Cada evento é enviado personalizado por jogador via `convertAndSendToUser` — cada um vê apenas sua perspectiva. Mais eficiente que polling REST para turnos em tempo real.

### JWT Stateless
Token JWT gerado no login/registro, validado no filtro HTTP (`JwtAuthFilter`) e no handshake WebSocket (`WebSocketAuthInterceptor`). Sem sessão server-side = fácil escalar horizontalmente. Senhas armazenadas com BCrypt.

### Persistência Híbrida
- **Partidas**: `ConcurrentHashMap` thread-safe em memória. Partidas são transientes por natureza e eliminam latência de I/O.
- **Usuários e stats**: JPA com H2 em desenvolvimento e PostgreSQL em produção. DDL automático via `spring.jpa.hibernate.ddl-auto=update`.
- **Cleanup automático**: `GameCleanupScheduler` remove jogos abandonados a cada 5 minutos (10min para PLACING_SHIPS, 30min para IN_PROGRESS).

### Segurança
- Rate limiter no login (5 tentativas/minuto por IP e por username) para proteção contra brute force.
- Validação de X-Forwarded-For para ambientes atrás de proxy reverso.
- CORS configurável via variável de ambiente.

## Endpoints

### REST (Autenticação e Perfil)
| Método | Path | Descrição |
|--------|------|-----------|
| POST | `/api/auth/register` | Registra novo usuário, retorna JWT |
| POST | `/api/auth/login` | Autentica, retorna JWT |
| GET | `/api/auth/ranking` | Ranking de jogadores |
| GET | `/api/stats/me` | Estatísticas do jogador logado |
| GET | `/api/profile/me` | Perfil do jogador (skins, moedas) |
| POST | `/api/profile/equip` | Equipa uma skin |
| GET | `/api/shop/skins` | Lista skins disponíveis na loja |
| POST | `/api/shop/buy` | Compra uma skin |
| GET | `/api/health` | Health check |

### WebSocket (STOMP)
| Destination | Descrição |
|-------------|-----------|
| `/app/game/create` | Cria sala privada (retorna código de 4 caracteres) |
| `/app/game/join` | Entra em sala por código |
| `/app/game/matchmaking/join` | Entra na fila de matchmaking automático |
| `/app/game/matchmaking/leave` | Sai da fila de matchmaking |
| `/app/game/single-player` | Inicia partida contra IA |
| `/app/game/place-ship` | Posiciona navio no tabuleiro |
| `/app/game/shoot` | Dispara tiro no oponente |
| `/app/game/surrender` | Desiste da partida |
| `/app/game/rematch` | Solicita revanche |
| `/app/game/emote` | Envia emote ao oponente |
| `/app/game/leave` | Abandona a partida |
| `/user/topic/game/{id}` | Recebe estado da partida (personalizado por jogador) |
| `/user/topic/game/created` | Recebe notificação de sala criada/match encontrado |
| `/user/topic/game/error` | Recebe erros |

## Regras do Jogo

- Tabuleiro 10×10
- Frota: Porta-aviões (5), Navio-tanque (4), Contratorpedeiro (3), Submarino (3), Destroyer (2)
- Ambos posicionam todos os navios → jogo inicia (turno inicial aleatório)
- Turnos alternados; acerto mantém o turno do jogador
- Resultado do tiro: `MISS`, `HIT`, `SUNK` (revelando o tipo do navio afundado)
- Vence quem afundar todos os 5 navios do adversário

## Funcionalidades Extras

- **Single Player**: Modo contra IA com estratégia hunt/target
- **Matchmaking automático**: Fila FIFO que pareia jogadores automaticamente
- **Rematch**: Ambos jogadores podem solicitar revanche ao final
- **Surrender**: Desistência registra derrota
- **Emotes**: Comunicação entre jogadores durante a partida
- **Sistema de moedas e skins**: Vencedor ganha 10 moedas; loja com skins de navios
- **Reconexão automática**: Frontend reconecta com backoff exponencial (até 10 tentativas)
- **Cleanup de memória**: Jogos abandonados são removidos automaticamente

## Executar Localmente

### Backend
```bash
cd back/batalha-naval
./mvnw spring-boot:run
```
Backend disponível em `http://localhost:8080` (perfil `dev` com H2 in-memory).

### Frontend
```bash
cd front
npm install
npm run dev
```
Frontend disponível em `http://localhost:5173`.

### Variáveis de Ambiente (Frontend)
Criar arquivo `.env` na pasta `front/`:
```
VITE_API_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080/ws
```

## Testes

```bash
cd back/batalha-naval
./mvnw test
```

### Cobertura dos testes:
- **Domain**: Board (posicionamento válido/inválido, limites, sobreposição, tiros, fog of war, allShipsSunk), Ship (células ocupadas, afundamento), Game (fases, turnos, vitória, alternância)
- **Service**: GameService (criação, join, código único, persistência de resultado, stats)
- **Integração E2E**: GameWebSocketIntegrationTest — fluxo completo multiplayer (registro → WebSocket → criar sala → join → posicionar → atirar), single player, surrender, sala inexistente

## Deploy

### Backend (Render)
1. Push para GitHub
2. Criar Web Service no Render apontando para o repo
3. Build command: `cd back/batalha-naval && ./mvnw clean package -DskipTests`
4. Start command: `java -jar back/batalha-naval/target/batalha-naval-0.0.1-SNAPSHOT.jar`
5. Variáveis de ambiente obrigatórias:
   - `DATABASE_URL` — URL do PostgreSQL
   - `DATABASE_USERNAME` — usuário do banco
   - `DATABASE_PASSWORD` — senha do banco
   - `DATABASE_DRIVER` — `org.postgresql.Driver`
   - `JPA_DIALECT` — `org.hibernate.dialect.PostgreSQLDialect`
   - `JWT_SECRET` — chave secreta para JWT (mínimo 32 caracteres)
   - `CORS_ALLOWED_ORIGINS` — domínio do frontend
   - `SPRING_PROFILES_ACTIVE` — `prod`

### Frontend (Vercel)
1. Push do projeto React para GitHub
2. Import no Vercel, diretório raiz: `front/`
3. Variáveis de ambiente:
   - `VITE_API_URL` — URL do backend no Render (ex: `https://batalha-naval.onrender.com`)
   - `VITE_WS_URL` — URL WebSocket do backend (ex: `wss://batalha-naval.onrender.com/ws`)
