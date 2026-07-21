const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

/**
 * Wrapper de fetch com retry, error handling e abort support.
 * @param {string} path - Path relativo (ex: '/api/auth/login')
 * @param {object} options - { method, body, signal, token, retry }
 * @returns {Promise<any>} Response JSON parsed
 */
export async function apiFetch(path, { method = 'GET', body, signal, token, retry = 2 } = {}) {
  const url = `${API_URL}${path}`;
  const headers = { 'Content-Type': 'application/json' };
  
  // Token from param or localStorage (token: null = skip auth explicitly)
  const authToken = token === null ? null : (token || localStorage.getItem('token'));
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  let lastError;
  for (let attempt = 0; attempt <= retry; attempt++) {
    try {
      const res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal,
      });

      // 401 = token inválido, redirecionar ao login (apenas para endpoints autenticados)
      if (res.status === 401 && token !== null) {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        window.location.href = '/';
        throw new Error('Sessão expirada');
      }

      // Verificar res.ok
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || data.error || `Erro ${res.status}`);
      }

      return await res.json();
    } catch (err) {
      lastError = err;
      // Não fazer retry em abort, 4xx, ou sessão expirada
      if (err.name === 'AbortError') throw err;
      if (err.message === 'Sessão expirada') throw err;
      if (err.message?.startsWith('Erro 4')) throw err;
      
      // Retry apenas em erros de rede ou 5xx
      if (attempt < retry) {
        await new Promise(r => setTimeout(r, 300 * (attempt + 1))); // backoff
        continue;
      }
    }
  }
  throw lastError;
}
