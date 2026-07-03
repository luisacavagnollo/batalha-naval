import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../hooks/useGame';

export default function Lobby() {
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');
  const [code, setCode] = useState('');
  const { connect, connected, createRoom, startSinglePlayer, joinRoom, roomCode, gameState, error, subscribeToGame, resetGame } = useGame(token);
  const navigate = useNavigate();

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

  const handleSinglePlayer = async () => {
    await connect();
    startSinglePlayer();
  };

  const handleJoin = async () => {
    if (!code.trim()) return;
    await connect();
    joinRoom(code.trim());
  };

  return (
    <div className="min-h-screen bg-[#0a1a12] flex flex-col">
      <header className="w-full px-4 sm:px-8 py-5 border-b border-emerald-900/40 flex items-center justify-between">
        <h1 className="text-xl font-black text-white tracking-widest uppercase">Battleship</h1>
        <span className="text-slate-500 text-sm">{username}</span>
      </header>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          {roomCode ? (
            <div className="flex flex-col items-center">
              <p className="text-slate-500 text-xs font-bold tracking-wider uppercase mb-4">Código da sala</p>
              <div className="text-4xl font-mono font-black tracking-[0.4em] text-emerald-400 mb-6">
                {roomCode}
              </div>
              <p className="text-slate-500 text-sm mb-6">Compartilhe este código com seu oponente</p>
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-slate-400 text-sm">Aguardando conexão...</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <button
                onClick={handleCreate}
                className="w-full py-3.5 rounded-lg bg-emerald-800 text-white text-sm font-bold tracking-wider uppercase hover:bg-emerald-700 transition-colors"
              >
                Criar sala
              </button>

              <button
                onClick={handleSinglePlayer}
                className="w-full py-3.5 rounded-lg bg-[#2a1f08] border border-amber-900/40 text-amber-200 text-sm font-bold tracking-wider uppercase hover:bg-[#3a2a10] transition-colors"
              >
                Jogar solo
              </button>

              <div className="flex items-center gap-4 my-2">
                <div className="flex-1 h-px bg-emerald-900/40"></div>
                <span className="text-slate-600 text-xs tracking-wider">ou</span>
                <div className="flex-1 h-px bg-emerald-900/40"></div>
              </div>

              <div>
                <label className="block text-slate-500 text-xs font-medium tracking-wider uppercase mb-2">Entrar em sala existente</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase())}
                    placeholder="ABCD"
                    maxLength={4}
                    className="flex-1 bg-[#0d1f14] rounded-lg px-4 py-3 border border-emerald-900/40 focus:border-emerald-600 focus:outline-none text-white text-center font-mono text-lg tracking-widest uppercase placeholder-slate-600 transition-colors"
                  />
                  <button
                    onClick={handleJoin}
                    className="px-5 py-3 rounded-lg border border-emerald-900/50 text-emerald-400 text-sm font-bold tracking-wider uppercase hover:bg-emerald-900/20 transition-colors"
                  >
                    Entrar
                  </button>
                </div>
              </div>

              {error && <p className="text-red-400/80 text-sm mt-2">{error}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
