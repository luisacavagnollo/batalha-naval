import { apiFetch } from './apiFetch';

export function login(username, password) {
  return apiFetch('/api/auth/login', { method: 'POST', body: { username, password }, token: null, retry: 0 });
}

export function register(username, email, password) {
  return apiFetch('/api/auth/register', { method: 'POST', body: { username, email, password }, token: null, retry: 0 });
}

export function fetchStats(token) {
  return apiFetch('/api/stats/me', { token });
}

export function fetchProfile(token) {
  return apiFetch('/api/profile/me', { token });
}

export function fetchShopSkins(token) {
  return apiFetch('/api/shop/skins', { token });
}

export function buySkin(token, skinId) {
  return apiFetch('/api/shop/buy', { method: 'POST', body: { skinId }, token });
}

export function equipSkin(token, skinId) {
  return apiFetch('/api/profile/equip', { method: 'POST', body: { skinId }, token });
}

export function fetchRanking() {
  return apiFetch('/api/auth/ranking', { token: null });
}
