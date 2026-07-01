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
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <header className="w-full px-8 py-4 border-b border-slate-700 flex items-center justify-between">
        <h1 className="text-2xl font-black text-white tracking-wide">BATTLESHIP</h1>
        <span className="text-slate-400 text-sm">Olá, <span className="text-cyan-400 font-semibold">{username}</span></span>
      </header>

      {/* Conteúdo */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-8">
          {roomCode ? (
            <div className="flex flex-col items-center gap-6">
              <h2 className="text-slate-400 text-xs font-bold tracking-wider uppercase">Código da Sala</h2>
              <div className="text-5xl font-mono font-black tracking-[0.3em] text-cyan-400 bg-slate-700 px-8 py-5 rounded-xl border border-slate-600">
                {roomCode}
              </div>
              <p className="text-slate-400 text-sm">Compartilhe com seu oponente</p>
              <div className="flex items-center gap-3">
                <div className="animate-spin w-5 h-5 border-3 border-cyan-500 border-t-transparent rounded-full"></div>
                <span className="text-slate-300 text-sm">Aguardando oponente...</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6">
              <h2 className="text-white text-xl font-bold mb-2">Iniciar Partida</h2>

              <button
                onClick={handleCreate}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 text-slate-900 font-black text-lg tracking-wide hover:from-cyan-400 hover:to-cyan-300 transition-all shadow-lg shadow-cyan-500/25"
              >
                CRIAR SALA
              </button>

              <button
                onClick={handleSinglePlayer}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-slate-900 font-black text-lg tracking-wide hover:from-orange-400 hover:to-amber-300 transition-all shadow-lg shadow-orange-500/25"
              >
                JOGAR SOLO
              </button>

              <div className="flex items-center gap-4 w-full">
                <div className="flex-1 h-px bg-slate-600"></div>
                <span className="text-slate-500 text-xs font-bold tracking-wider">OU</span>
                <div className="flex-1 h-px bg-slate-600"></div>
              </div>

              <div className="w-full">
                <label className="block text-slate-400 text-xs font-bold tracking-wider mb-2">CÓDIGO DA SALA</label>
                <div className="flex gap-3">
                  <div className="flex-1 flex items-center bg-slate-700 rounded-lg px-4 py-3 border border-slate-600 focus-within:border-cyan-500 transition-colors">
                    <input
                      type="text"
                      value={code}
                      onChange={e => setCode(e.target.value.toUpperCase())}
                      placeholder="ABCD"
                      maxLength={4}
                      className="bg-transparent text-white placeholder-slate-500 outline-none flex-1 text-center font-mono text-xl tracking-widest uppercase"
                    />
                  </div>
                  <button
                    onClick={handleJoin}
                    className="px-6 py-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold tracking-wider transition-colors"
                  >
                    ENTRAR
                  </button>
                </div>
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
