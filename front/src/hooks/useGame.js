import { useRef, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';

const WS_URL = import.meta.env.VITE_WS_URL;

export function useGame(token) {
  const clientRef = useRef(null);
  const [gameState, setGameState] = useState(null);
  const [roomCode, setRoomCode] = useState(null);
  const [error, setError] = useState(null);
  const [emote, setEmote] = useState(null);
  const [connected, setConnected] = useState(false);
  const subscribedGameRef = useRef(null);

  const subscribeToGame = useCallback((gameId) => {
    const client = clientRef.current;
    if (!client || subscribedGameRef.current === gameId) return;
    subscribedGameRef.current = gameId;

    client.subscribe(`/user/topic/game/${gameId}`, (msg) => {
      setGameState(JSON.parse(msg.body));
    });

    client.subscribe(`/user/topic/game/${gameId}/emote`, (msg) => {
      const data = JSON.parse(msg.body);
      setEmote(data);
      setTimeout(() => setEmote(null), 3000);
    });
  }, []);

  const connect = useCallback(() => {
    return new Promise((resolve) => {
      if (clientRef.current?.connected) { resolve(); return; }

      const client = new Client({
        brokerURL: WS_URL,
        connectHeaders: { token },
        onConnect: () => {
          setConnected(true);

          client.subscribe('/user/topic/game/created', (msg) => {
            const data = JSON.parse(msg.body);
            setRoomCode(data.gameId);
            subscribeToGame(data.gameId);
          });

          client.subscribe('/user/topic/game/error', (msg) => {
            const data = JSON.parse(msg.body);
            setError(data.message);
          });

          resolve();
        },
        onDisconnect: () => setConnected(false),
      });

      client.activate();
      clientRef.current = client;
    });
  }, [token, subscribeToGame]);

  const disconnect = useCallback(() => {
    clientRef.current?.deactivate();
    subscribedGameRef.current = null;
    setConnected(false);
  }, []);

  const createRoom = useCallback(() => {
    clientRef.current?.publish({ destination: '/app/game/create', body: '{}' });
  }, []);

  const joinRoom = useCallback((code) => {
    subscribeToGame(code.toUpperCase());
    clientRef.current?.publish({
      destination: '/app/game/join',
      body: JSON.stringify({ gameId: code.toUpperCase() }),
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

  return {
    gameState, roomCode, error, emote, connected,
    connect, disconnect, subscribeToGame,
    createRoom, joinRoom, placeShip, shoot, sendEmote,
  };
}
