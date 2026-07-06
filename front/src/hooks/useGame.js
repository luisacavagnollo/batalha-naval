import { useRef, useState, useCallback, useEffect } from 'react';
import { Client } from '@stomp/stompjs';

const WS_URL = import.meta.env.VITE_WS_URL;

// Configuração de reconnect com backoff exponencial
const RECONNECT_CONFIG = {
  initialDelay: 1000,    // 1s
  maxDelay: 30000,       // 30s
  multiplier: 2,
  maxAttempts: 10,
};

// Singleton client para manter uma única conexão STOMP
let sharedClient = null;
let sharedConnectedPromise = null;
let lastGameState = null;
let lastRematchGameId = null;
let reconnectAttempts = 0;
let reconnectTimeout = null;
let isReconnecting = false;
let currentToken = null;
const subscribers = new Set();

function notifySubscribers(topic, data) {
  if (topic === 'gameState') lastGameState = data;
  if (topic === 'rematch') lastRematchGameId = data;
  subscribers.forEach(fn => fn(topic, data));
}

function getReconnectDelay() {
  const delay = Math.min(
    RECONNECT_CONFIG.initialDelay * Math.pow(RECONNECT_CONFIG.multiplier, reconnectAttempts),
    RECONNECT_CONFIG.maxDelay
  );
  // Adiciona jitter de ±20% para evitar thundering herd
  const jitter = delay * 0.2 * (Math.random() * 2 - 1);
  return Math.round(delay + jitter);
}

function clearReconnect() {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  reconnectAttempts = 0;
  isReconnecting = false;
}

export function useGame(token) {
  const [gameState, setGameState] = useState(lastGameState);
  const [roomCode, setRoomCode] = useState(null);
  const [error, setError] = useState(null);
  const [emote, setEmote] = useState(null);
  const [connected, setConnected] = useState(false);
  const [rematchGameId, setRematchGameId] = useState(lastRematchGameId);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'connected' | 'disconnected' | 'reconnecting'
  const [reconnectInfo, setReconnectInfo] = useState(null); // { attempt, maxAttempts, nextRetryIn }
  const subscribedGamesRef = useRef(new Set());

  // Manter token atualizado
  useEffect(() => {
    currentToken = token;
  }, [token]);

  // Registrar listener local
  useEffect(() => {
    const handler = (topic, data) => {
      if (topic === 'gameState') setGameState(data);
      if (topic === 'roomCode') setRoomCode(data);
      if (topic === 'error') setError(data);
      if (topic === 'rematch') setRematchGameId(data);
      if (topic === 'connectionStatus') setConnectionStatus(data);
      if (topic === 'reconnectInfo') setReconnectInfo(data);
      if (topic === 'emote') {
        setEmote(data);
        setTimeout(() => setEmote(null), 3000);
      }
    };
    subscribers.add(handler);
    return () => subscribers.delete(handler);
  }, []);

  // Sincronizar status de conexão
  useEffect(() => {
    if (sharedClient?.connected) {
      setConnected(true);
      setConnectionStatus('connected');
    }
  }, []);

  const setupSubscriptions = useCallback((client) => {
    client.subscribe('/user/topic/game/created', (msg) => {
      const data = JSON.parse(msg.body);
      if (data.rematch) {
        subscribeToGame(data.gameId);
        notifySubscribers('rematch', data.gameId);
      } else if (data.singlePlayer) {
        subscribeToGame(data.gameId);
      } else {
        notifySubscribers('roomCode', data.gameId);
      }
    });

    client.subscribe('/user/topic/game/error', (msg) => {
      const data = JSON.parse(msg.body);
      notifySubscribers('error', data.message);
    });

    // Re-subscrever jogos ativos após reconexão
    subscribedGamesRef.current.forEach(gameId => {
      client.subscribe(`/user/topic/game/${gameId}`, (msg) => {
        notifySubscribers('gameState', JSON.parse(msg.body));
      });
      client.subscribe(`/user/topic/game/${gameId}/emote`, (msg) => {
        notifySubscribers('emote', JSON.parse(msg.body));
      });
    });
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (reconnectAttempts >= RECONNECT_CONFIG.maxAttempts) {
      notifySubscribers('connectionStatus', 'disconnected');
      notifySubscribers('reconnectInfo', { attempt: reconnectAttempts, maxAttempts: RECONNECT_CONFIG.maxAttempts, failed: true });
      isReconnecting = false;
      return;
    }

    isReconnecting = true;
    const delay = getReconnectDelay();
    notifySubscribers('connectionStatus', 'reconnecting');
    notifySubscribers('reconnectInfo', {
      attempt: reconnectAttempts + 1,
      maxAttempts: RECONNECT_CONFIG.maxAttempts,
      nextRetryIn: delay,
    });

    reconnectTimeout = setTimeout(() => {
      reconnectAttempts++;
      doConnect(currentToken, true);
    }, delay);
  }, []);

  const doConnect = useCallback((tkn, isRetry = false) => {
    if (sharedClient?.connected) {
      setConnected(true);
      setConnectionStatus('connected');
      clearReconnect();
      return Promise.resolve();
    }

    // Se já está conectando e não é retry, retorna promise existente
    if (sharedConnectedPromise && !isRetry) return sharedConnectedPromise;

    // Limpar cliente anterior se houver
    if (sharedClient) {
      try { sharedClient.deactivate(); } catch (e) { /* ignore */ }
      sharedClient = null;
    }
    sharedConnectedPromise = null;

    sharedConnectedPromise = new Promise((resolve, reject) => {
      const client = new Client({
        brokerURL: WS_URL,
        connectHeaders: { token: tkn },
        reconnectDelay: 0, // Desabilitar reconnect nativo do STOMP, usamos o nosso
        onConnect: () => {
          setConnected(true);
          clearReconnect();
          notifySubscribers('connectionStatus', 'connected');
          notifySubscribers('reconnectInfo', null);
          setupSubscriptions(client);
          resolve();
        },
        onStompError: (frame) => {
          console.error('STOMP error:', frame.headers?.message);
          if (!isRetry) reject(new Error(frame.headers?.message || 'Connection failed'));
        },
        onWebSocketClose: () => {
          setConnected(false);
          sharedClient = null;
          sharedConnectedPromise = null;

          // Só tenta reconectar se não foi desconexão intencional
          if (currentToken && !isReconnecting) {
            scheduleReconnect();
          }
        },
        onDisconnect: () => {
          setConnected(false);
          sharedClient = null;
          sharedConnectedPromise = null;
        },
      });

      client.activate();
      sharedClient = client;
    });

    return sharedConnectedPromise;
  }, [setupSubscriptions, scheduleReconnect]);

  const connect = useCallback(() => {
    return doConnect(token);
  }, [token, doConnect]);

  const disconnect = useCallback(() => {
    clearReconnect();
    currentToken = null; // Impede reconexão automática
    sharedClient?.deactivate();
    sharedClient = null;
    sharedConnectedPromise = null;
    setConnected(false);
    setConnectionStatus('disconnected');
    notifySubscribers('connectionStatus', 'disconnected');
    notifySubscribers('reconnectInfo', null);
  }, []);

  const resetGame = useCallback(() => {
    lastGameState = null;
    lastRematchGameId = null;
    setGameState(null);
    setRoomCode(null);
    setError(null);
    setEmote(null);
    setRematchGameId(null);
    subscribedGamesRef.current = new Set();
  }, []);

  const subscribeToGame = useCallback((gameId) => {
    if (!sharedClient || subscribedGamesRef.current.has(gameId)) return;
    subscribedGamesRef.current.add(gameId);

    sharedClient.subscribe(`/user/topic/game/${gameId}`, (msg) => {
      notifySubscribers('gameState', JSON.parse(msg.body));
    });

    sharedClient.subscribe(`/user/topic/game/${gameId}/emote`, (msg) => {
      notifySubscribers('emote', JSON.parse(msg.body));
    });
  }, []);

  const createRoom = useCallback(() => {
    sharedClient?.publish({ destination: '/app/game/create', body: '{}' });
  }, []);

  const startSinglePlayer = useCallback(() => {
    sharedClient?.publish({ destination: '/app/game/single-player', body: '{}' });
  }, []);

  const joinRoom = useCallback((code) => {
    const id = code.toUpperCase();
    subscribeToGame(id);
    sharedClient?.publish({
      destination: '/app/game/join',
      body: JSON.stringify({ gameId: id }),
    });
  }, [subscribeToGame]);

  const placeShip = useCallback((gameId, shipType, row, col, orientation) => {
    sharedClient?.publish({
      destination: '/app/game/place-ship',
      body: JSON.stringify({ gameId, shipType, row, col, orientation }),
    });
  }, []);

  const shoot = useCallback((gameId, row, col) => {
    sharedClient?.publish({
      destination: '/app/game/shoot',
      body: JSON.stringify({ gameId, row, col }),
    });
  }, []);

  const sendEmote = useCallback((gameId, emoteChar) => {
    sharedClient?.publish({
      destination: '/app/game/emote',
      body: JSON.stringify({ gameId, emote: emoteChar }),
    });
  }, []);

  const requestRematch = useCallback((gameId) => {
    lastRematchGameId = null;
    setRematchGameId(null);
    sharedClient?.publish({
      destination: '/app/game/rematch',
      body: JSON.stringify({ gameId }),
    });
  }, []);

  const surrender = useCallback((gameId) => {
    sharedClient?.publish({
      destination: '/app/game/surrender',
      body: JSON.stringify({ gameId }),
    });
  }, []);

  return {
    gameState, roomCode, error, emote, connected, rematchGameId,
    connectionStatus, reconnectInfo,
    connect, disconnect, resetGame, subscribeToGame,
    createRoom, startSinglePlayer, joinRoom, placeShip, shoot, sendEmote, requestRematch, surrender,
  };
}
