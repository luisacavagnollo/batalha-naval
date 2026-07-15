import { describe, it, expect } from 'vitest';

// Extraímos a lógica pura para testar sem importar o componente
function isTokenValid(token) {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

function createFakeToken(expInSeconds) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ sub: 'user', exp: expInSeconds }));
  const signature = 'fake-signature';
  return `${header}.${payload}.${signature}`;
}

describe('isTokenValid', () => {
  it('retorna false para token null', () => {
    expect(isTokenValid(null)).toBe(false);
  });

  it('retorna false para token vazio', () => {
    expect(isTokenValid('')).toBe(false);
  });

  it('retorna false para token malformado', () => {
    expect(isTokenValid('abc.def.ghi')).toBe(false);
  });

  it('retorna false para token expirado', () => {
    const expiredExp = Math.floor(Date.now() / 1000) - 3600; // 1h atrás
    const token = createFakeToken(expiredExp);
    expect(isTokenValid(token)).toBe(false);
  });

  it('retorna true para token válido (não expirado)', () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1h no futuro
    const token = createFakeToken(futureExp);
    expect(isTokenValid(token)).toBe(true);
  });

  it('retorna false para token sem campo exp', () => {
    const header = btoa(JSON.stringify({ alg: 'HS256' }));
    const payload = btoa(JSON.stringify({ sub: 'user' }));
    const token = `${header}.${payload}.sig`;
    expect(isTokenValid(token)).toBe(false);
  });
});
