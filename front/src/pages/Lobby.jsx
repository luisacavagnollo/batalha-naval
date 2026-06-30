import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../hooks/useGame';

export default function Lobby() {
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');
  const [code, setCode] = useState('');
  const { connect, connected, createRoom, joinRoom, roomCode, gameState, error, subscribeToGame, resetGame } = useGame(token);
  const navigate = useNavigate();

  // Limpar estado da partida anterior ao entrar no lobby
  useEffect(() => {
    resetGame();
  }, [resetGame]);

  useEffect(() => {
    if (gameState?.gameId && gameState.phase !== 'FINISHED') {
      navigate(`/place-ships/${gameState.gameId}`);
    }
  }, [gameState, navigate]);

  useEffect(() => {
    if (roomCode) subscribeToGame(roomCode);
  }, [roomCode, subscribeToGame]);

  const handleCreate = async () => {
    await connect();
    createRoom();
  };

  const handleJoin = async () => {
    if (!code.trim()) return;
    await connect();
    joinRoom(code.trim());
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
      <h1 className="text-3xl font-bold mb-2">⚓ Lobby</h1>
      <p className="text-slate-400 mb-8">Olá, {username}!</p>

      {roomCode ? (
        <div className="flex flex-col items-center gap-4">
          <p className="text-slate-300">Compartilhe o código com seu oponente:</p>
          <div className="text-5xl font-mono font-bold tracking-widest bg-slate-800 px-8 py-4 rounded-xl">
            {roomCode}
          </div>
          <p className="text-slate-400 text-sm">Aguardando oponente entrar...</p>
          <div className="animate-spin w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6">
          <button onClick={handleCreate} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold text-lg w-64">
            Criar Sala
          </button>

          <div className="flex items-center gap-2 text-slate-500">
            <div className="w-16 h-px bg-slate-600"></div>
            <span>ou</span>
            <div className="w-16 h-px bg-slate-600"></div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="Código"
              maxLength={4}
              className="w-32 px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-center font-mono text-xl tracking-widest uppercase focus:outline-none focus:border-blue-500"
            />
            <button onClick={handleJoin} className="px-6 py-3 bg-green-600 hover:bg-green-500 rounded-lg font-semibold">
              Entrar
            </button>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>
      )}
    </div>
  );
}
