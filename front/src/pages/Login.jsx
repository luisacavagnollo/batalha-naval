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
    <div className="min-h-screen bg-[#211a14] flex flex-col">
      <header className="w-full px-4 sm:px-8 py-5 border-b border-[#3d2a1a]/30">
        <h1 className="text-2xl font-bold text-[#c4983c] tracking-tight uppercase font-['Eagle_Lake']">Batalha Naval</h1>
      </header>

      <div className="flex-1 flex items-center justify-center px-4">
        <form onSubmit={handleSubmit} className="w-full max-w-sm">
          {/* Tabs */}
          <div className="flex mb-8 border-b border-[#3d2a1a]/40">
            <button
              type="button"
              onClick={() => setIsRegister(false)}
              className={`flex-1 pb-3 text-sm font-medium tracking-wider transition-colors font-[MedievalSharp] ${!isRegister ? 'text-[#c4983c] border-b-2 border-[#c4983c]' : 'text-[#5a5048] hover:text-[#c4b28a]'}`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setIsRegister(true)}
              className={`flex-1 pb-3 text-sm font-medium tracking-wider transition-colors font-[MedievalSharp] ${isRegister ? 'text-[#c4983c] border-b-2 border-[#c4983c]' : 'text-[#5a5048] hover:text-[#c4b28a]'}`}
            >
              Cadastrar
            </button>
          </div>

          {error && <p className="text-[#c45a4a] text-sm text-center mb-4">{error}</p>}

          {/* Username */}
          <div className="mb-4">
            <label className="block text-[#c4b28a] text-xs font-medium tracking-wider uppercase mb-1.5 font-[MedievalSharp]">Usuário</label>
            <input
              type="text"
              placeholder="seu_usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#211a14] rounded-md px-4 py-3 border border-[#3d2a1a]/60 focus:border-[#c4983c]/70 focus:ring-1 focus:ring-[#c4983c]/30 focus:outline-none text-[#e8d5b0] placeholder-[#5a5048] transition-colors"
              required
            />
          </div>

          {/* Email */}
          {isRegister && (
            <div className="mb-4">
              <label className="block text-[#c4b28a] text-xs font-medium tracking-wider uppercase mb-1.5 font-[MedievalSharp]">E-mail</label>
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#211a14] rounded-md px-4 py-3 border border-[#3d2a1a]/60 focus:border-[#c4983c]/70 focus:ring-1 focus:ring-[#c4983c]/30 focus:outline-none text-[#e8d5b0] placeholder-[#5a5048] transition-colors"
                required
              />
            </div>
          )}

          {/* Senha */}
          <div className="mb-4">
            <label className="block text-[#c4b28a] text-xs font-medium tracking-wider uppercase mb-1.5 font-[MedievalSharp]">Senha</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#211a14] rounded-md px-4 py-3 border border-[#3d2a1a]/60 focus:border-[#c4983c]/70 focus:ring-1 focus:ring-[#c4983c]/30 focus:outline-none text-[#e8d5b0] placeholder-[#5a5048] transition-colors"
              required
            />
          </div>

          {/* Confirmar Senha */}
          {isRegister && (
            <div className="mb-4">
              <label className="block text-[#c4b28a] text-xs font-medium tracking-wider uppercase mb-1.5 font-[MedievalSharp]">Confirmar senha</label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[#211a14] rounded-md px-4 py-3 border border-[#3d2a1a]/60 focus:border-[#c4983c]/70 focus:ring-1 focus:ring-[#c4983c]/30 focus:outline-none text-[#e8d5b0] placeholder-[#5a5048] transition-colors"
                required
              />
            </div>
          )}

          {/* Botão */}
          <button
            type="submit"
            className="w-full py-3.5 mt-4 rounded-md bg-[#8b6914] text-[#211a14] text-sm font-bold tracking-wider uppercase hover:bg-[#c4983c] transition-colors font-[MedievalSharp]"
          >
            {isRegister ? 'Cadastrar' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
