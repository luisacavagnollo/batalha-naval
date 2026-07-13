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
import PirateBackground from '../components/PirateBackground';
import UIPanel from '../components/UIPanel';
import PirateButton from '../components/PirateButton';
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
  const { connect, connected, createRoom, startSinglePlayer, joinRoom, roomCode, gameState, error, subscribeToGame, resetGame, leaveGame, connectionStatus, reconnectInfo, joinMatchmaking, leaveMatchmaking } = useGame(token);
  const { play, startMusic, stopMusic, toggleMute, muted } = useSound();
  const navigate = useNavigate();
  const [searching, setSearching] = useState(false);
  const [loadingSolo, setLoadingSolo] = useState(false);

  useEffect(() => {
    resetGame();
    fetchRanking().then(data => { if (data) setRanking(data); });
    fetchProfile(token).then(data => {
      if (data?._unauthorized) {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        navigate('/');
        return;
      }
      if (data) setMoedas(data.moedas);
    });
  }, [resetGame, token]);

  // Música de fundo do lobby
  useEffect(() => {
    startMusic('/sounds/lobby.mp3');
    return () => stopMusic();
  }, [startMusic, stopMusic]);

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
      setLoadingSolo(false);
      navigate(`/place-ships/${gameState.gameId}`);
    }
  }, [gameState, navigate]);

  useEffect(() => {
    if (roomCode) {
      setSearching(false);
      subscribeToGame(roomCode);
    }
  }, [roomCode, subscribeToGame]);

  useEffect(() => {
    if (connectionStatus === 'disconnected' || connectionStatus === 'reconnecting') {
      setSearching(false);
    }
  }, [connectionStatus]);

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
      setLoadingSolo(true);
      startSinglePlayer();
    } catch (err) {
      console.error('Falha ao conectar:', err.message);
      setLoadingSolo(false);
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
    <PirateBackground>
      <div className="min-h-screen flex flex-col">
        <ConnectionStatus connectionStatus={connectionStatus} reconnectInfo={reconnectInfo} />

        {/* Header */}
        <header className="w-full px-4 sm:px-8 py-4 flex items-center justify-between relative z-10">
          <h1 className="text-xl sm:text-2xl font-bold text-[#D5AE47] tracking-wider uppercase font-['Cinzel_Decorative',_'Eagle_Lake',_serif] text-shadow-gold">
            Batalha Naval
          </h1>
          <div className="flex items-center gap-3">
            {/* Moedas */}
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-[#2B1D14]/60 border border-[#7A5A28]/30">
              <span className="text-sm">🪙</span>
              <span className="text-[#D5AE47] text-sm font-bold font-['Cinzel',_serif]">{moedas}</span>
            </div>

            {/* Loja */}
            <button
              onClick={() => { play('click'); setShowShop(true); }}
              className="text-[#8B7355] hover:text-[#D5AE47] transition-colors text-xl p-1"
              title="Loja"
            >
              <FiShoppingCart />
            </button>

            {/* Mute */}
            <button
              onClick={toggleMute}
              className="text-[#8B7355] hover:text-[#D5AE47] transition-colors text-xl p-1"
              title={muted ? 'Ativar som' : 'Silenciar'}
            >
              {muted ? <HiVolumeOff /> : <HiVolumeUp />}
            </button>

            {/* Username dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="text-[#C6AE78] text-sm hover:text-[#D5AE47] transition-colors flex items-center gap-1 font-['Cinzel',_serif]"
              >
                {username}
                <span className="text-xs">▼</span>
              </button>
              {showDropdown && (
                <div className="absolute right-0 top-full mt-2 min-w-[160px] z-50 rounded-md bg-gradient-to-br from-[#4B2F1C] via-[#3A2518] to-[#2B1D14] border-[3px] border-[#2E2E2E] shadow-[0_8px_32px_rgba(0,0,0,0.6),0_4px_12px_rgba(0,0,0,0.4)]">
                  <div className="py-1">
                    <button
                      onClick={() => { setShowDropdown(false); setShowProfile(true); }}
                      className="w-full px-4 py-2.5 text-left text-[#F4E2B6] text-sm hover:bg-[#B98B2F]/10 hover:text-[#D5AE47] transition-colors font-['Cinzel',_serif]"
                    >
                      Meu Perfil
                    </button>
                    <div className="h-px bg-[#2E2E2E] mx-2" />
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2.5 text-left text-[#C84A3A] text-sm hover:bg-[#8B2A1E]/10 transition-colors font-['Cinzel',_serif]"
                    >
                      Sair da conta
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Divisor de header */}
        <div className="divider-ornate mx-8" />

        {/* Conteúdo principal */}
        <div className="flex-1 flex items-center justify-center px-4 py-6">
          <div className="w-full max-w-3xl flex flex-col lg:flex-row gap-6">

            {/* Ranking */}
            <div className="w-full lg:w-72">
              <UIPanel variant="dark" size="md">
                <h3 className="text-[#D5AE47] text-xs font-bold tracking-[0.2em] uppercase mb-4 font-['Cinzel',_serif] text-shadow-gold">
                  Ranking
                </h3>
                {ranking.length > 0 ? (
                  <div className="flex flex-col gap-1.5">
                    {ranking.map((player, i) => (
                      <div
                        key={i}
                        className={`flex items-center justify-between py-2 px-3 rounded ${
                          player.username === username
                            ? 'bg-[#B98B2F]/10 border border-[#B98B2F]/30'
                            : 'border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold w-5 font-['Cinzel',_serif] ${
                            i === 0 ? 'text-[#D5AE47]' :
                            i === 1 ? 'text-[#C0C0C0]' :
                            i === 2 ? 'text-[#CD7F32]' :
                            'text-[#8B7355]'
                          }`}>
                            {i + 1}º
                          </span>
                          <span className={`text-sm ${
                            player.username === username
                              ? 'text-[#D5AE47] font-bold'
                              : 'text-[#F4E2B6]'
                          }`}>
                            {player.username}
                          </span>
                        </div>
                        <span className="text-[#D5AE47] text-sm font-bold font-['Cinzel',_serif]">
                          {player.wins}W
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#8B7355] text-sm">Nenhuma partida multiplayer ainda</p>
                )}
              </UIPanel>
            </div>

            {/* Ações */}
            <div className="flex-1 flex items-center">
              <div className="w-full">
                {/* Modal de espera: Sala criada */}
                {roomCode && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d0b09]/90 backdrop-blur-sm">
                    <UIPanel variant="default" size="lg" className="max-w-sm mx-4">
                      <WaitingScreen
                        title="Código da sala"
                        subtitle={roomCode}
                        description="Compartilhe este código com seu oponente"
                        onCancel={() => { leaveGame(roomCode); resetGame(); }}
                      />
                    </UIPanel>
                  </div>
                )}

                {/* Modal de espera: Matchmaking */}
                {searching && !roomCode && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d0b09]/90 backdrop-blur-sm">
                    <UIPanel variant="default" size="lg" className="max-w-sm mx-4">
                      <WaitingScreen
                        title="Buscar Oponente"
                        description="Procurando um oponente digno..."
                        onCancel={handleCancelMatchmaking}
                      />
                    </UIPanel>
                  </div>
                )}

                {/* Modal de espera: Solo */}
                {loadingSolo && !roomCode && !searching && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d0b09]/90 backdrop-blur-sm">
                    <UIPanel variant="default" size="lg" className="max-w-sm mx-4">
                      <WaitingScreen
                        description="Preparando a batalha..."
                      />
                    </UIPanel>
                  </div>
                )}

                {!roomCode && (
                  <UIPanel variant="default" size="lg">
                    <h2 className="text-[#D5AE47] text-lg font-bold tracking-wider uppercase mb-6 font-['Cinzel',_serif] text-center text-shadow-gold">
                      Zarpar para Batalha
                    </h2>

                    <div className="flex flex-col gap-3">
                      <PirateButton onClick={handleCreate} variant="gold" size="lg" fullWidth>
                        Criar sala
                      </PirateButton>

                      <PirateButton onClick={handleSinglePlayer} variant="wood" size="md" fullWidth>
                        Contra o Capitão (Bot)
                      </PirateButton>

                      <PirateButton onClick={handleMatchmaking} variant="ocean" size="md" fullWidth>
                        Buscar Oponente
                      </PirateButton>

                      {/* Separador */}
                      <div className="flex items-center gap-3 my-2">
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#7A5A28]/50 to-transparent" />
                        <span className="text-[#8B7355] text-xs tracking-widest uppercase font-['Cinzel',_serif]">ou</span>
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#7A5A28]/50 to-transparent" />
                      </div>

                      {/* Entrar em sala */}
                      <div>
                        <label className="block text-[#C6AE78] text-xs font-bold tracking-wider uppercase mb-2 font-['Cinzel',_serif]">
                          Entrar em sala existente
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={code}
                            onChange={e => setCode(e.target.value.toUpperCase())}
                            placeholder="ABCD"
                            maxLength={4}
                            className="input-parchment flex-1 px-4 py-3 text-center font-mono text-lg tracking-widest uppercase"
                          />
                          <PirateButton onClick={handleJoin} variant="gold" size="md">
                            Entrar
                          </PirateButton>
                        </div>
                      </div>

                      {error && (
                        <div className="mt-2 px-3 py-2 rounded bg-[#8B2A1E]/20 border border-[#C84A3A]/40">
                          <p className="text-[#C84A3A] text-sm text-center">{error}</p>
                        </div>
                      )}
                    </div>
                  </UIPanel>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
        {showShop && <ShopModal onClose={() => setShowShop(false)} onBalanceChange={(m) => setMoedas(m)} />}
      </div>
    </PirateBackground>
  );
}
