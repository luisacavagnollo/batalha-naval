import { useRef, useState, useCallback, useEffect } from 'react';
import { Client } from '@stomp/stompjs';

const WS_URL = import.meta.env.VITE_WS_URL;

// Singleton client para manter uma única conexão STOMP
let sharedClient = null;
let sharedConnectedPromise = null;
let lastGameState = null;
const subscribers = new Set();

function notifySubscribers(topic, data) {
  if (topic === 'gameState') lastGameState = data;
  subscribers.forEach(fn => fn(topic, data));
}

export function useGame(token) {
  const [gameState, setGameState] = useState(lastGameState);
  const [roomCode, setRoomCode] = useState(null);
  const [error, setError] = useState(null);
  const [emote, setEmote] = useState(null);
  const [connected, setConnected] = useState(false);
  const subscribedGamesRef = useRef(new Set());

  // Registrar listener local
  useEffect(() => {
    const handler = (topic, data) => {
      if (topic === 'gameState') setGameState(data);
      if (topic === 'roomCode') setRoomCode(data);
      if (topic === 'error') setError(data);
      if (topic === 'emote') {
        setEmote(data);
        setTimeout(() => setEmote(null), 3000);
      }
    };
    subscribers.add(handler);
    return () => subscribers.delete(handler);
  }, []);

  const connect = useCallback(() => {
    if (sharedClient?.connected) {
      setConnected(true);
      return Promise.resolve();
    }
    if (sharedConnectedPromise) return sharedConnectedPromise;

    sharedConnectedPromise = new Promise((resolve) => {
      const client = new Client({
        brokerURL: WS_URL,
        connectHeaders: { token },
        onConnect: () => {
          setConnected(true);

          client.subscribe('/user/topic/game/created', (msg) => {
            const data = JSON.parse(msg.body);
            if (data.singlePlayer) {
              // Singleplayer: subscreve direto sem mostrar código
              subscribeToGame(data.gameId);
            } else {
              notifySubscribers('roomCode', data.gameId);
            }
          });

          client.subscribe('/user/topic/game/error', (msg) => {
            const data = JSON.parse(msg.body);
            notifySubscribers('error', data.message);
          });

          resolve();
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
  }, [token]);

  const disconnect = useCallback(() => {
    sharedClient?.deactivate();
    sharedClient = null;
    sharedConnectedPromise = null;
    setConnected(false);
  }, []);

  const resetGame = useCallback(() => {
    lastGameState = null;
    setGameState(null);
    setRoomCode(null);
    setError(null);
    setEmote(null);
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

  return {
    gameState, roomCode, error, emote, connected,
    connect, disconnect, resetGame, subscribeToGame,
    createRoom, startSinglePlayer, joinRoom, placeShip, shoot, sendEmote,
  };
}
