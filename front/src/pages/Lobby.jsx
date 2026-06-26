import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../hooks/useGame';

export default function Lobby() {
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');
  const [searching, setSearching] = useState(false);
  const { connect, connected, findGame, gameState } = useGame(token);
  const navigate = useNavigate();

  const handleFind = () => {
    connect();
    setSearching(true);
  };

  // Once connected, send findGame
  useEffect(() => {
    if (connected && searching) {
      findGame();
    }
  }, [connected, searching, findGame]);

  // When gameState arrives, navigate
  useEffect(() => {
    if (gameState?.gameId) {
      navigate(`/place-ships/${gameState.gameId}`);
    }
  }, [gameState, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
      <h1 className="text-3xl font-bold mb-2">⚓ Lobby</h1>
      <p className="text-slate-400 mb-8">Olá, {username}!</p>

      {searching ? (
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          <p className="text-slate-300">Buscando oponente...</p>
        </div>
      ) : (
        <button onClick={handleFind} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold text-lg">
          Buscar Partida
        </button>
      )}
    </div>
  );
}
