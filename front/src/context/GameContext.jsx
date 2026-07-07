import { createContext, useContext, useReducer, useCallback, useRef, useEffect, useMemo } from 'react';
import { Client } from '@stomp/stompjs';

const WS_URL = import.meta.env.VITE_WS_URL;

// --- Reducer ---

const initialState = {
  gameState: null,
  roomCode: null,
  error: null,
  emote: null,
  connected: false,
  rematchGameId: null,
  connectionStatus: 'disconnected', // 'connected' | 'disconnected' | 'reconnecting'
  reconnectInfo: null,
};

function gameReducer(state, action) {
  switch (action.type) {
    case 'SET_GAME_STATE':
      return { ...state, gameState: action.payload };
    case 'SET_ROOM_CODE':
      return { ...state, roomCode: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_EMOTE':
      return { ...state, emote: action.payload };
    case 'SET_CONNECTED':
      return { ...state, connected: action.payload };
    case 'SET_REMATCH_GAME_ID':
      return { ...state, rematchGameId: action.payload };
    case 'SET_CONNECTION_STATUS':
      return { ...state, connectionStatus: action.payload };
    case 'SET_RECONNECT_INFO':
      return { ...state, reconnectInfo: action.payload };
    case 'RESET_GAME':
      return {
        ...state,
        gameState: null,
        roomCode: null,
        error: null,
        emote: null,
        rematchGameId: null,
      };
    default:
      return state;
  }
}

// --- Reconnect config ---

const RECONNECT_CONFIG = {
  initialDelay: 1000,
  maxDelay: 30000,
  multiplier: 2,
  maxAttempts: 10,
};

function getReconnectDelay(attempts) {
  const delay = Math.min(
    RECONNECT_CONFIG.initialDelay * Math.pow(RECONNECT_CONFIG.multiplier, attempts),
    RECONNECT_CONFIG.maxDelay
  );
  const jitter = delay * 0.2 * (Math.random() * 2 - 1);
  return Math.round(delay + jitter);
}

// --- Context ---

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const clientRef = useRef(null);
  const connectedPromiseRef = useRef(null);
  const subscribedGamesRef = useRef(new Set());
  const tokenRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef(null);
  const isReconnectingRef = useRef(false);
  const intentionalDisconnectRef = useRef(false);
  const emoteTimerRef = useRef(null);

  // Helpers
  const clearReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    reconnectAttemptsRef.current = 0;
    isReconnectingRef.current = false;
  }, []);

  const setupSubscriptions = useCallback((client) => {
    client.subscribe('/user/topic/game/created', (msg) => {
      const data = JSON.parse(msg.body);
      if (data.rematch) {
        subscribeToGame(data.gameId);
        dispatch({ type: 'SET_REMATCH_GAME_ID', payload: data.gameId });
      } else if (data.singlePlayer) {
        subscribeToGame(data.gameId);
      } else {
        dispatch({ type: 'SET_ROOM_CODE', payload: data.gameId });
      }
    });

    client.subscribe('/user/topic/game/error', (msg) => {
      const data = JSON.parse(msg.body);
      dispatch({ type: 'SET_ERROR', payload: data.message });
    });

    // Re-subscrever jogos ativos após reconexão
    subscribedGamesRef.current.forEach(gameId => {
      client.subscribe(`/user/topic/game/${gameId}`, (msg) => {
        dispatch({ type: 'SET_GAME_STATE', payload: JSON.parse(msg.body) });
      });
      client.subscribe(`/user/topic/game/${gameId}/emote`, (msg) => {
        handleEmoteReceived(JSON.parse(msg.body));
      });
    });
  }, []);

  const handleEmoteReceived = useCallback((emoteData) => {
    dispatch({ type: 'SET_EMOTE', payload: emoteData });
    if (emoteTimerRef.current) clearTimeout(emoteTimerRef.current);
    emoteTimerRef.current = setTimeout(() => {
      dispatch({ type: 'SET_EMOTE', payload: null });
    }, 3000);
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= RECONNECT_CONFIG.maxAttempts) {
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'disconnected' });
      dispatch({ type: 'SET_RECONNECT_INFO', payload: { attempt: reconnectAttemptsRef.current, maxAttempts: RECONNECT_CONFIG.maxAttempts, failed: true } });
      isReconnectingRef.current = false;
      return;
    }

    isReconnectingRef.current = true;
    const delay = getReconnectDelay(reconnectAttemptsRef.current);
    dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'reconnecting' });
    dispatch({ type: 'SET_RECONNECT_INFO', payload: {
      attempt: reconnectAttemptsRef.current + 1,
      maxAttempts: RECONNECT_CONFIG.maxAttempts,
      nextRetryIn: delay,
    }});

    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectAttemptsRef.current++;
      doConnect(tokenRef.current, true);
    }, delay);
  }, []);

  const doConnect = useCallback((tkn, isRetry = false) => {
    if (clientRef.current?.connected) {
      dispatch({ type: 'SET_CONNECTED', payload: true });
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connected' });
      clearReconnect();
      return Promise.resolve();
    }

    if (connectedPromiseRef.current && !isRetry) return connectedPromiseRef.current;

    // Cleanup anterior
    if (clientRef.current) {
      try { clientRef.current.deactivate(); } catch (e) { /* ignore */ }
      clientRef.current = null;
    }
    connectedPromiseRef.current = null;

    connectedPromiseRef.current = new Promise((resolve, reject) => {
      const client = new Client({
        brokerURL: WS_URL,
        connectHeaders: { token: tkn },
        reconnectDelay: 0,
        onConnect: () => {
          dispatch({ type: 'SET_CONNECTED', payload: true });
          dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connected' });
          dispatch({ type: 'SET_RECONNECT_INFO', payload: null });
          clearReconnect();
          setupSubscriptions(client);
          resolve();
        },
        onStompError: (frame) => {
          console.error('STOMP error:', frame.headers?.message);
          if (!isRetry) reject(new Error(frame.headers?.message || 'Connection failed'));
        },
        onWebSocketClose: () => {
          dispatch({ type: 'SET_CONNECTED', payload: false });
          clientRef.current = null;
          connectedPromiseRef.current = null;

          if (tokenRef.current && !intentionalDisconnectRef.current && !isReconnectingRef.current) {
            scheduleReconnect();
          }
        },
        onDisconnect: () => {
          dispatch({ type: 'SET_CONNECTED', payload: false });
          clientRef.current = null;
          connectedPromiseRef.current = null;
        },
      });

      client.activate();
      clientRef.current = client;
    });

    return connectedPromiseRef.current;
  }, [setupSubscriptions, scheduleReconnect, clearReconnect]);

  // --- Actions ---

  const connect = useCallback((token) => {
    intentionalDisconnectRef.current = false;
    tokenRef.current = token;
    return doConnect(token);
  }, [doConnect]);

  const disconnect = useCallback(() => {
    clearReconnect();
    intentionalDisconnectRef.current = true;
    tokenRef.current = null;
    clientRef.current?.deactivate();
    clientRef.current = null;
    connectedPromiseRef.current = null;
    dispatch({ type: 'SET_CONNECTED', payload: false });
    dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'disconnected' });
    dispatch({ type: 'SET_RECONNECT_INFO', payload: null });
  }, [clearReconnect]);

  const resetGame = useCallback(() => {
    dispatch({ type: 'RESET_GAME' });
    subscribedGamesRef.current = new Set();
  }, []);

  const subscribeToGame = useCallback((gameId) => {
    if (!clientRef.current || subscribedGamesRef.current.has(gameId)) return;
    subscribedGamesRef.current.add(gameId);

    clientRef.current.subscribe(`/user/topic/game/${gameId}`, (msg) => {
      dispatch({ type: 'SET_GAME_STATE', payload: JSON.parse(msg.body) });
    });

    clientRef.current.subscribe(`/user/topic/game/${gameId}/emote`, (msg) => {
      handleEmoteReceived(JSON.parse(msg.body));
    });
  }, [handleEmoteReceived]);

  const createRoom = useCallback(() => {
    clientRef.current?.publish({ destination: '/app/game/create', body: '{}' });
  }, []);

  const startSinglePlayer = useCallback(() => {
    clientRef.current?.publish({ destination: '/app/game/single-player', body: '{}' });
  }, []);

  const joinRoom = useCallback((code) => {
    const id = code.toUpperCase();
    subscribeToGame(id);
    clientRef.current?.publish({
      destination: '/app/game/join',
      body: JSON.stringify({ gameId: id }),
    });
  }, [subscribeToGame]);

  const placeShip = useCallback((gameId, shipType, row, col, orientation) => {
    clientRef.current?.publish({
      destination: '/app/game/place-ship',
      body: JSON.stringify({ gameId, shipType, row, col, orientation }),
    });
  }, []);

  const shoot = useCallback((gameId, row, col) => {
    clientRef.current?.publish({
      destination: '/app/game/shoot',
      body: JSON.stringify({ gameId, row, col }),
    });
  }, []);

  const sendEmote = useCallback((gameId, emoteChar) => {
    clientRef.current?.publish({
      destination: '/app/game/emote',
      body: JSON.stringify({ gameId, emote: emoteChar }),
    });
  }, []);

  const requestRematch = useCallback((gameId) => {
    dispatch({ type: 'SET_REMATCH_GAME_ID', payload: null });
    clientRef.current?.publish({
      destination: '/app/game/rematch',
      body: JSON.stringify({ gameId }),
    });
  }, []);

  const surrender = useCallback((gameId) => {
    clientRef.current?.publish({
      destination: '/app/game/surrender',
      body: JSON.stringify({ gameId }),
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (emoteTimerRef.current) clearTimeout(emoteTimerRef.current);
    };
  }, []);

  const actions = useMemo(() => ({
    connect, disconnect, resetGame, subscribeToGame,
    createRoom, startSinglePlayer, joinRoom, placeShip,
    shoot, sendEmote, requestRematch, surrender,
  }), [connect, disconnect, resetGame, subscribeToGame,
    createRoom, startSinglePlayer, joinRoom, placeShip,
    shoot, sendEmote, requestRematch, surrender]);

  const contextValue = useMemo(() => ({ state, actions }), [state, actions]);

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
}

/**
 * Hook para consumir o GameContext.
 * Retorna a mesma interface que o useGame antigo para compatibilidade.
 */
export function useGame(token) {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }

  const { state, actions } = context;

  // Wrapper do connect que injeta o token
  const connect = useCallback(() => {
    return actions.connect(token);
  }, [token, actions]);

  return {
    // State
    gameState: state.gameState,
    roomCode: state.roomCode,
    error: state.error,
    emote: state.emote,
    connected: state.connected,
    rematchGameId: state.rematchGameId,
    connectionStatus: state.connectionStatus,
    reconnectInfo: state.reconnectInfo,
    // Actions
    connect,
    disconnect: actions.disconnect,
    resetGame: actions.resetGame,
    subscribeToGame: actions.subscribeToGame,
    createRoom: actions.createRoom,
    startSinglePlayer: actions.startSinglePlayer,
    joinRoom: actions.joinRoom,
    placeShip: actions.placeShip,
    shoot: actions.shoot,
    sendEmote: actions.sendEmote,
    requestRematch: actions.requestRematch,
    surrender: actions.surrender,
  };
}

export default GameContext;
