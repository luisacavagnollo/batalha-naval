import { useRef, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';

const WS_URL = import.meta.env.VITE_WS_URL;

export function useGame(token) {
  const clientRef = useRef(null);
  const [gameState, setGameState] = useState(null);
  const [emote, setEmote] = useState(null);
  const [connected, setConnected] = useState(false);

  const connect = useCallback(() => {
    if (clientRef.current?.connected) return;

    const client = new Client({
      brokerURL: WS_URL,
      connectHeaders: { token },
      onConnect: () => setConnected(true),
      onDisconnect: () => setConnected(false),
    });

    client.activate();
    clientRef.current = client;
  }, [token]);

  const disconnect = useCallback(() => {
    clientRef.current?.deactivate();
    setConnected(false);
  }, []);

  const subscribe = useCallback((gameId) => {
    const client = clientRef.current;
    if (!client) return;

    client.subscribe(`/user/topic/game/${gameId}`, (msg) => {
      setGameState(JSON.parse(msg.body));
    });

    client.subscribe(`/user/topic/game/${gameId}/emote`, (msg) => {
      const data = JSON.parse(msg.body);
      setEmote(data);
      setTimeout(() => setEmote(null), 3000);
    });
  }, []);

  const findGame = useCallback(() => {
    clientRef.current?.publish({ destination: '/app/game/find', body: '{}' });
  }, []);

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
    gameState, emote, connected,
    connect, disconnect, subscribe,
    findGame, placeShip, shoot, sendEmote,
  };
}
