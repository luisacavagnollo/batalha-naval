import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import PirateBackground from '../components/PirateBackground';
import UIPanel from '../components/UIPanel';
import PirateButton from '../components/PirateButton';

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
    <PirateBackground>
      <div className="min-h-screen flex flex-col">
        {/* Header com título */}
        <header className="w-full px-4 sm:px-8 py-6 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-[#D5AE47] tracking-wider uppercase font-['Cinzel_Decorative',_'Eagle_Lake',_serif] text-shadow-gold">
              Batalha Naval
            </h1>
            <p className="text-[#C6AE78] text-xs tracking-[0.3em] uppercase mt-1 font-['Cinzel',_serif]">
              Domínio dos Mares
            </p>
          </div>
        </header>

        {/* Formulário central */}
        <div className="flex-1 flex items-center justify-center px-4 pb-8">
          <UIPanel variant="default" size="lg" className="w-full max-w-sm">
            {/* Tabs Entrar/Cadastrar */}
            <div className="flex mb-6 border-b-[3px] border-[#2E2E2E] relative">
              {/* Indicador ativo com textura de bronze */}
              <div
                className="absolute bottom-0 h-[3px] bg-gradient-to-r from-[#7A5A28] via-[#D5AE47] to-[#7A5A28] transition-all duration-300"
                style={{
                  left: isRegister ? '50%' : '0%',
                  width: '50%',
                }}
              />
              <button
                type="button"
                onClick={() => setIsRegister(false)}
                className={`flex-1 pb-3 text-sm font-bold tracking-wider uppercase transition-colors font-['Cinzel',_serif] ${
                  !isRegister
                    ? 'text-[#D5AE47] text-shadow-gold'
                    : 'text-[#8B7355] hover:text-[#C6AE78]'
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => setIsRegister(true)}
                className={`flex-1 pb-3 text-sm font-bold tracking-wider uppercase transition-colors font-['Cinzel',_serif] ${
                  isRegister
                    ? 'text-[#D5AE47] text-shadow-gold'
                    : 'text-[#8B7355] hover:text-[#C6AE78]'
                }`}
              >
                Cadastrar
              </button>
            </div>

            {/* Erro */}
            {error && (
              <div className="mb-4 px-3 py-2 rounded bg-[#8B2A1E]/20 border border-[#C84A3A]/40">
                <p className="text-[#C84A3A] text-sm text-center">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Username */}
              <div>
                <label className="block text-[#C6AE78] text-xs font-bold tracking-wider uppercase mb-1.5 font-['Cinzel',_serif]">
                  Usuário
                </label>
                <input
                  type="text"
                  placeholder="seu_usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-parchment w-full px-4 py-3 text-sm"
                  required
                />
              </div>

              {/* Email */}
              {isRegister && (
                <div>
                  <label className="block text-[#C6AE78] text-xs font-bold tracking-wider uppercase mb-1.5 font-['Cinzel',_serif]">
                    E-mail
                  </label>
                  <input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-parchment w-full px-4 py-3 text-sm"
                    required
                  />
                </div>
              )}

              {/* Senha */}
              <div>
                <label className="block text-[#C6AE78] text-xs font-bold tracking-wider uppercase mb-1.5 font-['Cinzel',_serif]">
                  Senha
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-parchment w-full px-4 py-3 text-sm"
                  required
                />
              </div>

              {/* Confirmar Senha */}
              {isRegister && (
                <div>
                  <label className="block text-[#C6AE78] text-xs font-bold tracking-wider uppercase mb-1.5 font-['Cinzel',_serif]">
                    Confirmar senha
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-parchment w-full px-4 py-3 text-sm"
                    required
                  />
                </div>
              )}

              {/* Separador ornamentado */}
              <div className="divider-ornate my-2" />

              {/* Botão */}
              <PirateButton type="submit" variant="gold" size="lg" fullWidth>
                {isRegister ? 'Cadastrar' : 'Entrar'}
              </PirateButton>
            </form>


          </UIPanel>
        </div>
      </div>
    </PirateBackground>
  );
}
