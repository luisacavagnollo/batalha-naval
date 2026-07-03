import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGame } from '../hooks/useGame';

export default function GameOver() {
  const [params] = useSearchParams();
  const winner = params.get('winner');
  const gameId = params.get('gameId');
  const username = localStorage.getItem('username');
  const token = localStorage.getItem('token');
  const isVictory = winner === username;
  const navigate = useNavigate();
  const { connect, requestRematch, rematchGameId, resetGame } = useGame(token);

  useEffect(() => {
    connect();
  }, [connect]);

  useEffect(() => {
    if (rematchGameId) {
      navigate(`/place-ships/${rematchGameId}`);
    }
  }, [rematchGameId, navigate]);

  const handleRematch = () => {
    if (gameId) {
      requestRematch(gameId);
    }
  };

  const handleLobby = () => {
    resetGame();
    navigate('/lobby');
  };

  return (
    <div className="min-h-screen bg-[#0a1a12] flex flex-col">
      <header className="w-full px-4 sm:px-8 py-5 border-b border-emerald-900/40">
        <h1 className="text-xl font-black text-white tracking-widest uppercase">Battleship</h1>
      </header>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm flex flex-col items-center">
          {/* Linha decorativa */}
          <div className={`w-16 h-0.5 mb-8 ${isVictory ? 'bg-emerald-500' : 'bg-red-500'}`} />

          {/* Resultado */}
          <h2 className={`text-3xl font-light tracking-[0.2em] uppercase mb-2 ${isVictory ? 'text-emerald-400' : 'text-red-400'}`}>
            {isVictory ? 'Vitória' : 'Derrota'}
          </h2>

          <p className="text-slate-500 text-sm text-center mb-10">
            {isVictory
              ? 'Todos os navios inimigos foram afundados.'
              : `${winner} venceu esta partida.`}
          </p>

          {/* Botões */}
          <div className="w-full flex flex-col gap-3">
            {gameId && (
              <button
                onClick={handleRematch}
                className="w-full py-3.5 rounded-lg bg-emerald-800 text-white text-sm font-bold tracking-wider uppercase hover:bg-emerald-700 transition-colors"
              >
                Jogar novamente
              </button>
            )}
            <button
              onClick={handleLobby}
              className="w-full py-3.5 rounded-lg border border-emerald-900/50 text-slate-400 text-sm font-bold tracking-wider uppercase hover:text-white hover:border-emerald-700 transition-colors"
            >
              Voltar ao início
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
