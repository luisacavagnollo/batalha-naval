import { useNavigate, useSearchParams } from 'react-router-dom';

export default function GameOver() {
  const [params] = useSearchParams();
  const winner = params.get('winner');
  const username = localStorage.getItem('username');
  const isVictory = winner === username;
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <header className="w-full px-8 py-4 border-b border-slate-700">
        <h1 className="text-2xl font-black text-white tracking-wide">BATTLESHIP</h1>
      </header>

      {/* Conteúdo */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-10 flex flex-col items-center">
          {/* Ícone */}
          <div className={`text-7xl mb-6 ${isVictory ? 'animate-bounce' : ''}`}>
            {isVictory ? ':)' : ':('}
          </div>

          {/* Título */}
          <h2 className={`text-4xl font-black tracking-wider mb-3 ${isVictory ? 'text-cyan-400' : 'text-red-400'}`}>
            {isVictory ? 'VITÓRIA' : 'DERROTA'}
          </h2>

          {/* Descrição */}
          <p className="text-slate-400 text-center mb-8">
            {isVictory
              ? 'Você afundou todos os navios inimigos!'
              : `${winner} venceu a partida.`}
          </p>

          {/* Botão */}
          <button
            onClick={() => navigate('/lobby')}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 text-slate-900 font-black text-lg tracking-wide hover:from-cyan-400 hover:to-cyan-300 transition-all shadow-lg shadow-cyan-500/25"
          >
            JOGAR NOVAMENTE
          </button>
        </div>
      </div>
    </div>
  );
}
