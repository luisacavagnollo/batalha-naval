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
        expect.stringContaining('/api/auth/login'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'user1', password: 'pass' }),
        })
      );
      expect(result).toEqual({ token: 'jwt', username: 'user1' });
    });

    it('lança erro quando resposta não é ok', async () => {
      global.fetch.mockResolvedValue({ ok: false, status: 401 });

      await expect(login('bad', 'creds')).rejects.toThrow('Login falhou');
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
        expect.stringContaining('/api/auth/register'),
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
        expect.stringContaining('/api/stats/me'),
        expect.objectContaining({
          headers: { Authorization: 'Bearer my-token' },
        })
      );
      expect(result).toEqual({ wins: 5, losses: 3 });
    });

    it('retorna null quando resposta não é ok', async () => {
      global.fetch.mockResolvedValue({ ok: false, status: 500 });

      const result = await fetchStats('token');
      expect(result).toBeNull();
    });
  });
});
