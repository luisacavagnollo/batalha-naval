import { useState, useCallback } from 'react';
import { login as apiLogin, register as apiRegister } from '../services/api';

export function useAuth() {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    return token ? { token, username } : null;
  });

  const login = useCallback(async (username, password) => {
    const data = await apiLogin(username, password);
    localStorage.setItem('token', data.token);
    localStorage.setItem('username', data.username);
    setUser(data);
    return data;
  }, []);

  const register = useCallback(async (username, password) => {
    const data = await apiRegister(username, password);
    localStorage.setItem('token', data.token);
    localStorage.setItem('username', data.username);
    setUser(data);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setUser(null);
  }, []);

  return { user, login, register, logout };
}
