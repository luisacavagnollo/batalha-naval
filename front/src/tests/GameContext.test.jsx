import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { GameProvider, useGame } from '../context/GameContext';

// Mock do @stomp/stompjs com classe que funciona com `new`
const mockPublish = vi.fn();
const mockSubscribe = vi.fn(() => ({ unsubscribe: vi.fn() }));
const mockDeactivate = vi.fn();

let onConnectCallback = null;

vi.mock('@stomp/stompjs', () => {
  return {
    Client: class MockClient {
      constructor(config) {
        this.config = config;
        this.connected = false;
        this.publish = mockPublish;
        this.subscribe = mockSubscribe;
        this.deactivate = mockDeactivate;
        onConnectCallback = config.onConnect;
      }
      activate() {
        this.connected = true;
        // Simula conexão com sucesso imediatamente
        if (this.config.onConnect) {
          this.config.onConnect();
        }
      }
    },
  };
});

describe('GameContext - Reducer via useGame', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('token', 'test-token');
    onConnectCallback = null;
  });

  const wrapper = ({ children }) => <GameProvider>{children}</GameProvider>;

  it('inicia com estado padrão', () => {
    const { result } = renderHook(() => useGame('test-token'), { wrapper });

    expect(result.current.gameState).toBeNull();
    expect(result.current.roomCode).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.emote).toBeNull();
    expect(result.current.connected).toBe(false);
    expect(result.current.rematchGameId).toBeNull();
    expect(result.current.rematchPending).toBe(false);
    expect(result.current.rematchRequested).toBe(false);
    expect(result.current.connectionStatus).toBe('disconnected');
  });

  it('connect atualiza estado para connected', async () => {
    const { result } = renderHook(() => useGame('test-token'), { wrapper });

    await act(async () => {
      await result.current.connect();
    });

    expect(result.current.connected).toBe(true);
    expect(result.current.connectionStatus).toBe('connected');
  });

  it('disconnect reseta estado de conexão', async () => {
    const { result } = renderHook(() => useGame('test-token'), { wrapper });

    await act(async () => {
      await result.current.connect();
    });

    act(() => {
      result.current.disconnect();
    });

    expect(result.current.connected).toBe(false);
    expect(result.current.connectionStatus).toBe('disconnected');
  });

  it('createRoom publica no destino correto', async () => {
    const { result } = renderHook(() => useGame('test-token'), { wrapper });

    await act(async () => {
      await result.current.connect();
    });

    act(() => {
      result.current.createRoom();
    });

    expect(mockPublish).toHaveBeenCalledWith(
      expect.objectContaining({ destination: '/app/game/create' })
    );
  });

  it('joinRoom publica com gameId em uppercase', async () => {
    const { result } = renderHook(() => useGame('test-token'), { wrapper });

    await act(async () => {
      await result.current.connect();
    });

    act(() => {
      result.current.joinRoom('abcd');
    });

    expect(mockPublish).toHaveBeenCalledWith(
      expect.objectContaining({
        destination: '/app/game/join',
        body: JSON.stringify({ gameId: 'ABCD' }),
      })
    );
  });

  it('shoot publica com gameId, row e col', async () => {
    const { result } = renderHook(() => useGame('test-token'), { wrapper });

    await act(async () => {
      await result.current.connect();
    });

    act(() => {
      result.current.shoot('XYZW', 3, 5);
    });

    expect(mockPublish).toHaveBeenCalledWith(
      expect.objectContaining({
        destination: '/app/game/shoot',
        body: JSON.stringify({ gameId: 'XYZW', row: 3, col: 5 }),
      })
    );
  });

  it('placeShip publica com todos os campos', async () => {
    const { result } = renderHook(() => useGame('test-token'), { wrapper });

    await act(async () => {
      await result.current.connect();
    });

    act(() => {
      result.current.placeShip('ABCD', 'CARRIER', 0, 0, 'HORIZONTAL');
    });

    expect(mockPublish).toHaveBeenCalledWith(
      expect.objectContaining({
        destination: '/app/game/place-ship',
        body: JSON.stringify({
          gameId: 'ABCD',
          shipType: 'CARRIER',
          row: 0,
          col: 0,
          orientation: 'HORIZONTAL',
        }),
      })
    );
  });

  it('surrender publica com gameId', async () => {
    const { result } = renderHook(() => useGame('test-token'), { wrapper });

    await act(async () => {
      await result.current.connect();
    });

    act(() => {
      result.current.surrender('ABCD');
    });

    expect(mockPublish).toHaveBeenCalledWith(
      expect.objectContaining({
        destination: '/app/game/surrender',
        body: JSON.stringify({ gameId: 'ABCD' }),
      })
    );
  });

  it('startSinglePlayer publica no destino correto', async () => {
    const { result } = renderHook(() => useGame('test-token'), { wrapper });

    await act(async () => {
      await result.current.connect();
    });

    act(() => {
      result.current.startSinglePlayer();
    });

    expect(mockPublish).toHaveBeenCalledWith(
      expect.objectContaining({ destination: '/app/game/single-player' })
    );
  });

  it('joinMatchmaking publica no destino correto', async () => {
    const { result } = renderHook(() => useGame('test-token'), { wrapper });

    await act(async () => {
      await result.current.connect();
    });

    act(() => {
      result.current.joinMatchmaking();
    });

    expect(mockPublish).toHaveBeenCalledWith(
      expect.objectContaining({ destination: '/app/game/matchmaking/join' })
    );
  });

  it('leaveMatchmaking publica no destino correto', async () => {
    const { result } = renderHook(() => useGame('test-token'), { wrapper });

    await act(async () => {
      await result.current.connect();
    });

    act(() => {
      result.current.leaveMatchmaking();
    });

    expect(mockPublish).toHaveBeenCalledWith(
      expect.objectContaining({ destination: '/app/game/matchmaking/leave' })
    );
  });

  it('sendEmote publica com gameId e emote', async () => {
    const { result } = renderHook(() => useGame('test-token'), { wrapper });

    await act(async () => {
      await result.current.connect();
    });

    act(() => {
      result.current.sendEmote('ABCD', '🏴‍☠️');
    });

    expect(mockPublish).toHaveBeenCalledWith(
      expect.objectContaining({
        destination: '/app/game/emote',
        body: JSON.stringify({ gameId: 'ABCD', emote: '🏴‍☠️' }),
      })
    );
  });

  it('requestRematch publica com gameId', async () => {
    const { result } = renderHook(() => useGame('test-token'), { wrapper });

    await act(async () => {
      await result.current.connect();
    });

    act(() => {
      result.current.requestRematch('ABCD');
    });

    expect(mockPublish).toHaveBeenCalledWith(
      expect.objectContaining({
        destination: '/app/game/rematch',
        body: JSON.stringify({ gameId: 'ABCD' }),
      })
    );
  });

  it('resetGame limpa gameState, roomCode e error', () => {
    const { result } = renderHook(() => useGame('test-token'), { wrapper });

    act(() => {
      result.current.resetGame();
    });

    expect(result.current.gameState).toBeNull();
    expect(result.current.roomCode).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('useGame sem GameProvider lança erro', () => {
    expect(() => {
      renderHook(() => useGame('token'));
    }).toThrow('useGame must be used within a GameProvider');
  });
});
