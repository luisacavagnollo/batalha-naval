import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegister) {
        await register(username, password);
      } else {
        await login(username, password);
      }
      navigate('/lobby');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <form onSubmit={handleSubmit} className="bg-slate-800 p-8 rounded-xl w-80 space-y-4">
        <h1 className="text-2xl font-bold text-white text-center">⚓ Batalha Naval</h1>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        <input
          type="text"
          placeholder="Usuário"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-2 rounded bg-slate-700 text-white placeholder-slate-400"
          required
        />
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 rounded bg-slate-700 text-white placeholder-slate-400"
          required
        />

        <button type="submit" className="w-full p-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold">
          {isRegister ? 'Registrar' : 'Entrar'}
        </button>

        <p className="text-slate-400 text-sm text-center cursor-pointer" onClick={() => setIsRegister(!isRegister)}>
          {isRegister ? 'Já tem conta? Entrar' : 'Não tem conta? Registrar'}
        </p>
      </form>
    </div>
  );
}
