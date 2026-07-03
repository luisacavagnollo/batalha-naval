import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isRegister && password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    try {
      if (isRegister) {
        await register(username, email, password);
      } else {
        await login(username, password);
      }
      navigate('/lobby');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a1a12] flex flex-col">
      <header className="w-full px-4 sm:px-8 py-5 border-b border-emerald-900/40">
        <h1 className="text-xl font-black text-white tracking-widest uppercase">Battleship</h1>
      </header>

      <div className="flex-1 flex items-center justify-center px-4">
        <form onSubmit={handleSubmit} className="w-full max-w-sm">
          {/* Tabs */}
          <div className="flex mb-8 border-b border-emerald-900/40">
            <button
              type="button"
              onClick={() => setIsRegister(false)}
              className={`flex-1 pb-3 text-sm font-medium tracking-wider transition-colors ${!isRegister ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setIsRegister(true)}
              className={`flex-1 pb-3 text-sm font-medium tracking-wider transition-colors ${isRegister ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Cadastrar
            </button>
          </div>

          {error && <p className="text-red-400/80 text-sm text-center mb-4">{error}</p>}

          {/* Username */}
          <div className="mb-4">
            <label className="block text-slate-500 text-xs font-medium tracking-wider uppercase mb-1.5">Usuário</label>
            <input
              type="text"
              placeholder="seu_usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#0d1f14] rounded-lg px-4 py-3 border border-emerald-900/40 focus:border-emerald-600 focus:outline-none text-white placeholder-slate-600 transition-colors"
              required
            />
          </div>

          {/* Email */}
          {isRegister && (
            <div className="mb-4">
              <label className="block text-slate-500 text-xs font-medium tracking-wider uppercase mb-1.5">E-mail</label>
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0d1f14] rounded-lg px-4 py-3 border border-emerald-900/40 focus:border-emerald-600 focus:outline-none text-white placeholder-slate-600 transition-colors"
                required
              />
            </div>
          )}

          {/* Senha */}
          <div className="mb-4">
            <label className="block text-slate-500 text-xs font-medium tracking-wider uppercase mb-1.5">Senha</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0d1f14] rounded-lg px-4 py-3 border border-emerald-900/40 focus:border-emerald-600 focus:outline-none text-white placeholder-slate-600 transition-colors"
              required
            />
          </div>

          {/* Confirmar Senha */}
          {isRegister && (
            <div className="mb-4">
              <label className="block text-slate-500 text-xs font-medium tracking-wider uppercase mb-1.5">Confirmar senha</label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[#0d1f14] rounded-lg px-4 py-3 border border-emerald-900/40 focus:border-emerald-600 focus:outline-none text-white placeholder-slate-600 transition-colors"
                required
              />
            </div>
          )}

          {/* Botão */}
          <button
            type="submit"
            className="w-full py-3.5 mt-4 rounded-lg bg-emerald-800 text-white text-sm font-bold tracking-wider uppercase hover:bg-emerald-700 transition-colors"
          >
            {isRegister ? 'Cadastrar' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
