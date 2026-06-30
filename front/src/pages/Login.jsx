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
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <header className="w-full px-8 py-4 border-b border-slate-700">
        <h1 className="text-2xl font-black text-white tracking-wide">BATTLESHIP</h1>
      </header>

      {/* Conteúdo */}
      <div className="flex-1 flex items-center justify-center px-4">
        <form onSubmit={handleSubmit} className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-8">
          {/* Tabs */}
          <div className="flex mb-8 bg-slate-700 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setIsRegister(false)}
              className={`flex-1 py-3 text-sm font-bold tracking-wider transition-colors ${!isRegister ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:text-white'}`}
            >
              ENTRAR
            </button>
            <button
              type="button"
              onClick={() => setIsRegister(true)}
              className={`flex-1 py-3 text-sm font-bold tracking-wider transition-colors ${isRegister ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:text-white'}`}
            >
              CADASTRAR
            </button>
          </div>

          {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}

          {/* Username */}
          <div className="mb-5">
            <label className="block text-slate-400 text-xs font-bold tracking-wider mb-2">USUÁRIO</label>
            <div className="flex items-center bg-slate-700 rounded-lg px-4 py-3 border border-slate-600 focus-within:border-cyan-500 transition-colors">
              <svg className="w-5 h-5 text-slate-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <input
                type="text"
                placeholder="seu_usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-transparent text-white placeholder-slate-500 outline-none flex-1"
                required
              />
            </div>
          </div>

          {/* Email - só no cadastro */}
          {isRegister && (
            <div className="mb-5">
              <label className="block text-slate-400 text-xs font-bold tracking-wider mb-2">E-MAIL</label>
              <div className="flex items-center bg-slate-700 rounded-lg px-4 py-3 border border-slate-600 focus-within:border-cyan-500 transition-colors">
                <svg className="w-5 h-5 text-slate-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-transparent text-white placeholder-slate-500 outline-none flex-1"
                  required
                />
              </div>
            </div>
          )}

          {/* Senha */}
          <div className="mb-5">
            <label className="block text-slate-400 text-xs font-bold tracking-wider mb-2">SENHA</label>
            <div className="flex items-center bg-slate-700 rounded-lg px-4 py-3 border border-slate-600 focus-within:border-cyan-500 transition-colors">
              <svg className="w-5 h-5 text-slate-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-transparent text-white placeholder-slate-500 outline-none flex-1"
                required
              />
            </div>
          </div>

          {/* Confirmar Senha - só no cadastro */}
          {isRegister && (
            <div className="mb-5">
              <label className="block text-slate-400 text-xs font-bold tracking-wider mb-2">CONFIRMAR SENHA</label>
              <div className="flex items-center bg-slate-700 rounded-lg px-4 py-3 border border-slate-600 focus-within:border-cyan-500 transition-colors">
                <svg className="w-5 h-5 text-slate-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-transparent text-white placeholder-slate-500 outline-none flex-1"
                  required
                />
              </div>
            </div>
          )}

          {/* Botão */}
          <button
            type="submit"
            className="w-full py-4 mt-4 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 text-slate-900 font-black text-lg tracking-wide hover:from-cyan-400 hover:to-cyan-300 transition-all shadow-lg shadow-cyan-500/25"
          >
            {isRegister ? 'CADASTRAR' : 'INICIAR COMBATE'}
          </button>
        </form>
      </div>
    </div>
  );
}
