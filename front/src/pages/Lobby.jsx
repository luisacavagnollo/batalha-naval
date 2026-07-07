import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../hooks/useGame';
import { useSound } from '../hooks/useSound';
import ConnectionStatus from '../components/ConnectionStatus';
import { fetchStats } from '../services/api';

export default function Lobby() {
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');
  const [code, setCode] = useState('');
  const [stats, setStats] = useState(null);
  const { connect, connected, createRoom, startSinglePlayer, joinRoom, roomCode, gameState, error, subscribeToGame, resetGame, connectionStatus, reconnectInfo } = useGame(token);
  const { play, startMusic, stopMusic, toggleMute, muted } = useSound();
  const navigate = useNavigate();

  useEffect(() => {
    resetGame();
    fetchStats(token).then(data => { if (data) setStats(data); });
  }, [resetGame, token]);

  useEffect(() => {
    if (gameState?.gameId && gameState.phase !== 'FINISHED') {
      navigate(`/place-ships/${gameState.gameId}`);
    }
  }, [gameState, navigate]);

  useEffect(() => {
    if (roomCode) subscribeToGame(roomCode);
  }, [roomCode, subscribeToGame]);

  const handleCreate = async () => {
    play('click');
    await connect();
    createRoom();
  };

  const handleSinglePlayer = async () => {
    play('click');
    await connect();
    startSinglePlayer();
  };

  const handleJoin = async () => {
    if (!code.trim()) return;
    play('click');
    await connect();
    joinRoom(code.trim());
  };

  return (
    <div className="min-h-screen bg-[#211a14] flex flex-col">
      <ConnectionStatus connectionStatus={connectionStatus} reconnectInfo={reconnectInfo} />
      <header className="w-full px-4 sm:px-8 py-5 border-b border-[#3d2a1a]/30 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#c4983c] tracking-[0.15em] uppercase font-[MedievalSharp]">Batalha Naval</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleMute}
            className="text-[#5a5048] hover:text-[#c4983c] transition-colors text-lg"
            title={muted ? 'Ativar som' : 'Silenciar'}
          >
            {muted ? '🔇' : '🔊'}
          </button>
          <span className="text-[#5a5048] text-sm">{username}</span>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl flex flex-col lg:flex-row gap-6">

          {/* Perfil do jogador */}
          <div className="w-full lg:w-72 flex flex-col gap-4">
            {/* Stats */}
            <div className="bg-[#2a1f15] border border-[#3d2a1a]/40 rounded-lg p-5">
              <h3 className="text-[#c4b28a] text-xs font-medium tracking-wider uppercase mb-4 font-[MedievalSharp]">Perfil</h3>
              <p className="text-[#c4983c] text-lg font-bold mb-4">{username}</p>

              {stats ? (
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-[#e8d5b0] text-xl font-bold">{stats.wins}</p>
                    <p className="text-[#5a5048] text-xs">Vitórias</p>
                  </div>
                  <div>
                    <p className="text-[#e8d5b0] text-xl font-bold">{stats.losses}</p>
                    <p className="text-[#5a5048] text-xs">Derrotas</p>
                  </div>
                  <div>
                    <p className="text-[#c4983c] text-xl font-bold">{stats.winRate}%</p>
                    <p className="text-[#5a5048] text-xs">Win Rate</p>
                  </div>
                </div>
              ) : (
                <p className="text-[#5a5048] text-sm">Nenhuma partida ainda</p>
              )}
            </div>

            {/* Histórico */}
            <div className="bg-[#2a1f15] border border-[#3d2a1a]/40 rounded-lg p-5">
              <h3 className="text-[#c4b28a] text-xs font-medium tracking-wider uppercase mb-3 font-[MedievalSharp]">Últimas partidas</h3>
              {stats && stats.history && stats.history.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {stats.history.map((match, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-[#3d2a1a]/20 last:border-0">
                      <span className="text-[#e8d5b0] text-sm">{match.opponent === 'BOT' ? 'Bot' : match.opponent}</span>
                      <span className={`text-xs font-bold tracking-wider ${match.won ? 'text-[#c4983c]' : 'text-[#8b1a1a]'}`}>
                        {match.won ? 'Vitória' : 'Derrota'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[#5a5048] text-sm">Sem histórico</p>
              )}
            </div>
          </div>

          {/* Ações */}
          <div className="flex-1 flex items-center">
            <div className="w-full">
              {roomCode ? (
                <div className="flex flex-col items-center">
                  <p className="text-[#c4b28a] text-xs font-bold tracking-wider uppercase mb-4 font-[MedievalSharp]">Código da sala</p>
                  <div className="text-4xl font-mono font-black tracking-[0.4em] text-[#c4983c] mb-6">
                    {roomCode}
                  </div>
                  <p className="text-[#5a5048] text-sm mb-6">Compartilhe este código com seu oponente</p>
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#c4983c] animate-pulse"></div>
                    <span className="text-[#c4b28a] text-sm">Aguardando conexão...</span>
                  </div>
                  <button
                    onClick={() => resetGame()}
                    className="mt-6 px-5 py-2.5 rounded-md border border-[#8b1a1a]/50 text-[#c45a4a] text-xs font-bold tracking-wider uppercase hover:bg-[#8b1a1a]/20 hover:border-[#8b1a1a] transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <button
                    onClick={handleCreate}
                    className="w-full py-3.5 rounded-md bg-[#8b6914] text-[#211a14] text-sm font-bold tracking-wider uppercase hover:bg-[#c4983c] transition-colors font-[MedievalSharp]"
                  >
                    Criar sala
                  </button>

                  <button
                    onClick={handleSinglePlayer}
                    className="w-full py-3.5 rounded-md border border-[#3d2a1a]/60 text-[#c4b28a] text-sm font-bold tracking-wider uppercase hover:border-[#c4983c]/60 hover:text-[#c4983c] transition-colors font-[MedievalSharp]"
                  >
                    Jogar solo
                  </button>

                  <div className="flex items-center gap-4 my-2">
                    <div className="flex-1 h-px bg-[#3d2a1a]/40"></div>
                    <span className="text-[#5a5048] text-xs tracking-wider">ou</span>
                    <div className="flex-1 h-px bg-[#3d2a1a]/40"></div>
                  </div>

                  <div>
                    <label className="block text-[#c4b28a] text-xs font-medium tracking-wider uppercase mb-2 font-[MedievalSharp]">Entrar em sala existente</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={code}
                        onChange={e => setCode(e.target.value.toUpperCase())}
                        placeholder="ABCD"
                        maxLength={4}
                        className="flex-1 bg-[#211a14] rounded-md px-4 py-3 border border-[#3d2a1a]/60 focus:border-[#c4983c]/70 focus:ring-1 focus:ring-[#c4983c]/30 focus:outline-none text-[#e8d5b0] text-center font-mono text-lg tracking-widest uppercase placeholder-[#5a5048] transition-colors"
                      />
                      <button
                        onClick={handleJoin}
                        className="px-5 py-3 rounded-md bg-[#8b6914] text-[#211a14] text-sm font-bold tracking-wider uppercase hover:bg-[#c4983c] transition-colors"
                      >
                        Entrar
                      </button>
                    </div>
                  </div>

                  {error && <p className="text-[#c45a4a] text-sm mt-2">{error}</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
