import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGame } from '../hooks/useGame';
import ConnectionStatus from '../components/ConnectionStatus';

export default function GameOver() {
  const [params] = useSearchParams();
  const winner = params.get('winner');
  const gameId = params.get('gameId');
  const username = localStorage.getItem('username');
  const token = localStorage.getItem('token');
  const isVictory = winner === username;
  const navigate = useNavigate();
  const { connect, requestRematch, rematchGameId, resetGame, connectionStatus, reconnectInfo } = useGame(token);

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
    <div className="min-h-screen bg-[#211a14] flex flex-col">
      <ConnectionStatus connectionStatus={connectionStatus} reconnectInfo={reconnectInfo} />
      <header className="w-full px-4 sm:px-8 py-5 border-b border-[#3d2a1a]/30">
        <h1 className="text-2xl font-bold text-[#c4983c] tracking-[0.15em] uppercase font-[MedievalSharp]">Batalha Naval</h1>
      </header>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm flex flex-col items-center">
          {/* Linha decorativa */}
          <div className={`w-16 h-0.5 mb-8 ${isVictory ? 'bg-[#c4983c]' : 'bg-[#8b1a1a]'}`} />

          {/* Resultado */}
          <h2 className={`text-3xl font-light tracking-[0.2em] uppercase mb-2 font-[MedievalSharp] ${isVictory ? 'text-[#c4983c]' : 'text-[#c45a4a]'}`}>
            {isVictory ? 'Vitória' : 'Derrota'}
          </h2>

          <p className="text-[#5a5048] text-sm text-center mb-10">
            {isVictory
              ? 'Todos os navios inimigos foram afundados.'
              : `${winner} venceu esta partida.`}
          </p>

          {/* Botões */}
          <div className="w-full flex flex-col gap-3">
            {gameId && (
              <button
                onClick={handleRematch}
                className="w-full py-3.5 rounded-md bg-[#8b6914] text-[#211a14] text-sm font-bold tracking-wider uppercase hover:bg-[#c4983c] transition-colors font-[MedievalSharp]"
              >
                Jogar novamente
              </button>
            )}
            <button
              onClick={handleLobby}
              className="w-full py-3.5 rounded-md border border-[#3d2a1a]/60 text-[#c4b28a] text-sm font-bold tracking-wider uppercase hover:text-[#c4983c] hover:border-[#c4983c]/60 transition-colors font-[MedievalSharp]"
            >
              Voltar ao início
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
