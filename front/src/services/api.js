const API_URL = import.meta.env.VITE_API_URL;

export async function login(username, password) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error('Login falhou');
  return res.json();
}

export async function register(username, email, password) {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || 'Registro falhou');
  }
  return res.json();
}


export async function fetchStats(token) {
  const res = await fetch(`${API_URL}/api/stats/me`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function fetchProfile(token) {
  const res = await fetch(`${API_URL}/api/profile/me`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (res.status === 401) {
    return { _unauthorized: true };
  }
  if (!res.ok) return null;
  return res.json();
}

export async function fetchShopSkins(token) {
  const res = await fetch(`${API_URL}/api/shop/skins`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function buySkin(token, skinId) {
  const res = await fetch(`${API_URL}/api/shop/buy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ skinId }),
  });
  return res.json();
}

export async function equipSkin(token, skinId) {
  const res = await fetch(`${API_URL}/api/profile/equip`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ skinId }),
  });
  return res.json();
}

export async function fetchRanking() {
  const res = await fetch(`${API_URL}/api/auth/ranking`);
  if (!res.ok) return [];
  return res.json();
}
