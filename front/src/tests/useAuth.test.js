import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../hooks/useAuth';

// Mock do módulo api
vi.mock('../services/api', () => ({
  login: vi.fn(),
  register: vi.fn(),
}));

import { login as apiLogin, register as apiRegister } from '../services/api';

describe('useAuth', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('inicia com user null quando não há token no localStorage', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.user).toBeNull();
  });

  it('inicia com user quando há token no localStorage', () => {
    localStorage.setItem('token', 'my-token');
    localStorage.setItem('username', 'testuser');
    const { result } = renderHook(() => useAuth());
    expect(result.current.user).toEqual({ token: 'my-token', username: 'testuser' });
  });

  it('login salva token e username no localStorage', async () => {
    apiLogin.mockResolvedValue({ token: 'new-token', username: 'player1' });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login('player1', 'password');
    });

    expect(localStorage.getItem('token')).toBe('new-token');
    expect(localStorage.getItem('username')).toBe('player1');
    expect(result.current.user).toEqual({ token: 'new-token', username: 'player1' });
  });

  it('register salva token e username no localStorage', async () => {
    apiRegister.mockResolvedValue({ token: 'reg-token', username: 'newuser' });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.register('newuser', 'email@test.com', 'pass123');
    });

    expect(localStorage.getItem('token')).toBe('reg-token');
    expect(localStorage.getItem('username')).toBe('newuser');
    expect(result.current.user).toEqual({ token: 'reg-token', username: 'newuser' });
  });

  it('logout limpa localStorage e retorna user null', async () => {
    localStorage.setItem('token', 'my-token');
    localStorage.setItem('username', 'testuser');

    const { result } = renderHook(() => useAuth());
    expect(result.current.user).not.toBeNull();

    act(() => {
      result.current.logout();
    });

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('username')).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it('login propaga erro da API', async () => {
    apiLogin.mockRejectedValue(new Error('Login falhou'));

    const { result } = renderHook(() => useAuth());

    await expect(
      act(async () => {
        await result.current.login('bad', 'creds');
      })
    ).rejects.toThrow('Login falhou');

    expect(result.current.user).toBeNull();
  });
});
