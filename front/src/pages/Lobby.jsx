import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../hooks/useGame';
import { useSound } from '../hooks/useSound';
import { HiVolumeUp, HiVolumeOff } from 'react-icons/hi';
import { FiShoppingCart } from 'react-icons/fi';
import ConnectionStatus from '../components/ConnectionStatus';
import WaitingScreen from '../components/WaitingScreen';
import ProfileModal from '../components/ProfileModal';
import ShopModal from '../components/ShopModal';
import { fetchProfile, fetchRanking } from '../services/api';

export default function Lobby() {
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');
  const [code, setCode] = useState('');
  const [ranking, setRanking] = useState([]);
  const [moedas, setMoedas] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const dropdownRef = useRef(null);
  const { connect, connected, createRoom, startSinglePlayer, joinRoom, roomCode, gameState, error, subscribeToGame, resetGame, connectionStatus, reconnectInfo, joinMatchmaking, leaveMatchmaking } = useGame(token);
  const { play, startMusic, stopMusic, toggleMute, muted } = useSound();
  const navigate = useNavigate();
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    resetGame();
    fetchRanking().then(data => { if (data) setRanking(data); });
    fetchProfile(token).then(data => { if (data) setMoedas(data.moedas); });
  }, [resetGame, token]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/');
  };

  useEffect(() => {
    if (gameState?.gameId && gameState.phase !== 'FINISHED') {
      setSearching(false);
      navigate(`/place-ships/${gameState.gameId}`);
    }
  }, [gameState, navigate]);

  useEffect(() => {
    if (roomCode) {
      setSearching(false);
      subscribeToGame(roomCode);
    }
  }, [roomCode, subscribeToGame]);

  const handleCreate = async () => {
    play('click');
    try {
      await connect();
      createRoom();
    } catch (err) {
      console.error('Falha ao conectar:', err.message);
    }
  };

  const handleSinglePlayer = async () => {
    play('click');
    try {
      await connect();
      startSinglePlayer();
    } catch (err) {
      console.error('Falha ao conectar:', err.message);
    }
  };

  const handleJoin = async () => {
    if (!code.trim()) return;
    play('click');
    try {
      await connect();
      joinRoom(code.trim());
    } catch (err) {
      console.error('Falha ao conectar:', err.message);
    }
  };

  const handleMatchmaking = async () => {
    play('click');
    try {
      await connect();
      setSearching(true);
      joinMatchmaking();
    } catch (err) {
      console.error('Falha ao conectar:', err.message);
      setSearching(false);
    }
  };

  const handleCancelMatchmaking = () => {
    leaveMatchmaking();
    setSearching(false);
  };

  return (
    <div className="min-h-screen bg-[#211a14] flex flex-col">
      <ConnectionStatus connectionStatus={connectionStatus} reconnectInfo={reconnectInfo} />
      <header className="w-full px-4 sm:px-8 py-5 border-b border-[#3d2a1a]/30 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#c4983c] tracking-tight uppercase font-['Eagle_Lake']">Batalha Naval</h1>
        <div className="flex items-center gap-4">
          {/* Moedas */}
          <span className="text-[#c4983c] text-sm font-bold">🪙 {moedas}</span>

          {/* Loja */}
          <button
            onClick={() => { play('click'); setShowShop(true); }}
            className="text-[#5a5048] hover:text-[#c4983c] transition-colors text-xl"
            title="Loja"
          >
            <FiShoppingCart />
          </button>

          {/* Mute */}
          <button
            onClick={toggleMute}
            className="text-[#5a5048] hover:text-[#c4983c] transition-colors text-xl"
            title={muted ? 'Ativar som' : 'Silenciar'}
          >
            {muted ? <HiVolumeOff /> : <HiVolumeUp />}
          </button>

          {/* Username dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="text-[#5a5048] text-sm hover:text-[#c4983c] transition-colors flex items-center gap-1"
            >
              {username}
              <span className="text-xs">▼</span>
            </button>
            {showDropdown && (
              <div className="absolute right-0 top-full mt-2 bg-[#2a1f15] border border-[#3d2a1a]/60 rounded-md shadow-xl overflow-hidden min-w-[150px] z-50">
                <button
                  onClick={() => { setShowDropdown(false); setShowProfile(true); }}
                  className="w-full px-4 py-2.5 text-left text-[#e8d5b0] text-sm hover:bg-[#c4983c]/10 hover:text-[#c4983c] transition-colors"
                >
                  Meu Perfil
                </button>
                <div className="h-px bg-[#3d2a1a]/40" />
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2.5 text-left text-[#c45a4a] text-sm hover:bg-[#8b1a1a]/10 transition-colors"
                >
                  Sair da conta
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl flex flex-col lg:flex-row gap-6">

          {/* Ranking */}
          <div className="w-full lg:w-72 flex flex-col gap-4">
            <div className="bg-[#2a1f15] border border-[#3d2a1a]/40 rounded-lg p-5">
              <h3 className="text-[#c4b28a] text-xs font-medium tracking-wider uppercase mb-4 font-[MedievalSharp]">Ranking</h3>
              {ranking.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {ranking.map((player, i) => (
                    <div key={i} className={`flex items-center justify-between py-2 px-3 rounded-md ${player.username === username ? 'bg-[#c4983c]/10 border border-[#c4983c]/30' : 'border-b border-[#3d2a1a]/20 last:border-0'}`}>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold w-5 ${i < 3 ? 'text-[#c4983c]' : 'text-[#5a5048]'}`}>
                          {i + 1}º
                        </span>
                        <span className={`text-sm ${player.username === username ? 'text-[#c4983c] font-bold' : 'text-[#e8d5b0]'}`}>
                          {player.username}
                        </span>
                      </div>
                      <span className="text-[#c4983c] text-sm font-bold">{player.wins}W</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[#5a5048] text-sm">Nenhuma partida multiplayer ainda</p>
              )}
            </div>
          </div>

          {/* Ações */}
          <div className="flex-1 flex items-center">
            <div className="w-full">
              {roomCode && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d0b09]/80 backdrop-blur-sm">
                  <div className="bg-[#2a1f15] border border-[#3d2a1a]/60 rounded-lg p-8 flex flex-col items-center gap-6 max-w-sm mx-4 shadow-2xl">
                    <WaitingScreen
                      title="Código da sala"
                      subtitle={roomCode}
                      description="Compartilhe este código com seu oponente"
                      onCancel={() => resetGame()}
                    />
                  </div>
                </div>
              )}
              {searching && !roomCode && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d0b09]/80 backdrop-blur-sm">
                  <div className="bg-[#2a1f15] border border-[#3d2a1a]/60 rounded-lg p-8 flex flex-col items-center gap-6 max-w-sm mx-4 shadow-2xl">
                    <WaitingScreen
                      title="Partida Aleatória"
                      description="Procurando um oponente digno..."
                      onCancel={handleCancelMatchmaking}
                    />
                  </div>
                </div>
              )}
              {!roomCode && (
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

                  <button
                    onClick={handleMatchmaking}
                    className="w-full py-3.5 rounded-md bg-[#0f2640] border border-[#1a3a5c]/60 text-[#e8d5b0] text-sm font-bold tracking-wider uppercase hover:bg-[#1a3a5c] hover:border-[#c4983c]/40 transition-colors font-[MedievalSharp]"
                  >
                    Partida Aleatória
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

      {/* Modals */}
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
      {showShop && <ShopModal onClose={() => setShowShop(false)} onBalanceChange={(m) => setMoedas(m)} />}
    </div>
  );
}
