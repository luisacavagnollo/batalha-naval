import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { login, register, fetchStats } from '../services/api';

describe('API service', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.stubEnv('VITE_API_URL', 'http://localhost:8080');
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.unstubAllEnvs();
  });

  describe('login', () => {
    it('envia POST com username e password', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ token: 'jwt', username: 'user1' }),
      });

      const result = await login('user1', 'pass');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'user1', password: 'pass' }),
        })
      );
      expect(result).toEqual({ token: 'jwt', username: 'user1' });
    });

    it('lança erro quando resposta não é ok', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: 'Credenciais inválidas' }),
      });

      await expect(login('bad', 'creds')).rejects.toThrow('Credenciais inválidas');
    });
  });

  describe('register', () => {
    it('envia POST com username, email e password', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ token: 'jwt', username: 'new' }),
      });

      const result = await register('new', 'new@test.com', 'pass');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/auth/register',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ username: 'new', email: 'new@test.com', password: 'pass' }),
        })
      );
      expect(result).toEqual({ token: 'jwt', username: 'new' });
    });

    it('lança erro com mensagem do servidor quando registro falha', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 409,
        json: () => Promise.resolve({ error: 'Username já existe' }),
      });

      await expect(register('dup', 'dup@t.com', 'p')).rejects.toThrow('Username já existe');
    });
  });

  describe('fetchStats', () => {
    it('envia GET com Authorization header', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ wins: 5, losses: 3 }),
      });

      const result = await fetchStats('my-token');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/stats/me',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer my-token',
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(result).toEqual({ wins: 5, losses: 3 });
    });

    it('lança erro quando resposta não é ok', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Internal Server Error' }),
      });

      await expect(fetchStats('token')).rejects.toThrow('Internal Server Error');
    });
  });
});
