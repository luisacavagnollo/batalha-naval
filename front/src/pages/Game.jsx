import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../hooks/useGame';
import { useSound } from '../hooks/useSound';
import { useResponsiveCellSize } from '../hooks/useResponsiveCellSize';
import { HiVolumeUp, HiVolumeOff } from 'react-icons/hi';
import TurnIndicator from '../components/TurnIndicator';
import EmotePanel from '../components/EmotePanel';
import PirateBackground from '../components/PirateBackground';
import UIPanel from '../components/UIPanel';
import PirateButton from '../components/PirateButton';
import { SKINS_MAP } from '../constants/ships';
import { getSunkStatus } from '../utils/board';
import ShipList from '../components/game/ShipList';
import MyBoard from '../components/game/MyBoard';
import OpponentBoard from '../components/game/OpponentBoard';

export default function Game() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');
  const { connect, subscribeToGame, gameState, shoot, sendEmote, emote, resetGame, surrender, requestGameState, error, opponentStatus, connectionStatus, reconnectInfo } = useGame(token);
  const { play, startMusic, stopMusic, toggleMute, muted } = useSound();
  const [sunkOpponentShips, setSunkOpponentShips] = useState([]);
  const [sunkOpponentCells, setSunkOpponentCells] = useState(new Set());
  const [gameFinished, setGameFinished] = useState(false);
  const [showSurrenderConfirm, setShowSurrenderConfirm] = useState(false);
  const cellSize = useResponsiveCellSize({ maxCellSize: 36, boards: 2, horizontalPadding: 120 });
  const prevGameStateRef = useRef(null);
  const gameOverTimerRef = useRef(null);

  // Resetar estado local quando o gameId muda (rematch sem desmontar)
  useEffect(() => {
    setSunkOpponentShips([]);
    setSunkOpponentCells(new Set());
    setGameFinished(false);
    setShowSurrenderConfirm(false);
    prevGameStateRef.current = null;
    if (gameOverTimerRef.current) {
      clearTimeout(gameOverTimerRef.current);
      gameOverTimerRef.current = null;
    }
  }, [gameId]);

  // Redirecionar ao lobby se o jogo não existir mais (erro do servidor ou timeout)
  useEffect(() => {
    if (error && error.includes('não encontrada')) {
      resetGame();
      navigate('/lobby');
    }
  }, [error, resetGame, navigate]);

  // Timeout: se gameState não chegar em 15s após mount, redirecionar ao lobby
  useEffect(() => {
    if (gameState) return;
    const timeout = setTimeout(() => {
      if (!gameState) {
        resetGame();
        navigate('/lobby');
      }
    }, 15000);
    return () => clearTimeout(timeout);
  }, [gameState, resetGame, navigate]);

  useEffect(() => {
    let cancelled = false;
    connect().then(() => {
      if (cancelled) return;
      subscribeToGame(gameId);
      setTimeout(() => {
        if (!cancelled) requestGameState(gameId);
      }, 300);
    });
    startMusic('/sounds/battle.mp3', 0.55);
    return () => { cancelled = true; stopMusic(); if (gameOverTimerRef.current) clearTimeout(gameOverTimerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  useEffect(() => {
    if (!gameState || !prevGameStateRef.current) { prevGameStateRef.current = gameState; return; }
    const prev = prevGameStateRef.current;
    if (gameState.lastShotResult && gameState.lastShotResult !== prev.lastShotResult ||
        gameState.opponentBoard !== prev.opponentBoard || gameState.myBoard !== prev.myBoard) {
      if (gameState.lastShotResult === 'MISS') play('splash');
      else if (gameState.lastShotResult === 'HIT') play('explosion');
      else if (gameState.lastShotResult === 'SUNK') play('sunk');
    }
    if (gameState.phase === 'FINISHED' && prev.phase !== 'FINISHED') {
      setTimeout(() => { if (gameState.winnerId === username) play('victory'); else play('defeat'); }, 500);
    }
    prevGameStateRef.current = gameState;
  }, [gameState, play, username]);

  useEffect(() => {
    if (gameState?.phase === 'FINISHED' && !gameFinished) {
      setGameFinished(true);
      gameOverTimerRef.current = setTimeout(() => {
        navigate(`/game-over?winner=${gameState.winnerId}&gameId=${gameId}`);
      }, 5000);
    }
    if (gameState?.sunkShipType && gameState?.lastShotResult === 'SUNK' && gameState?.myTurn) {
      setSunkOpponentShips(prev => {
        if (!prev.includes(gameState.sunkShipType)) return [...prev, gameState.sunkShipType];
        return prev;
      });
      if (gameState.sunkShipCells && gameState.sunkShipCells.length > 0) {
        setSunkOpponentCells(prev => {
          const next = new Set(prev);
          for (const cell of gameState.sunkShipCells) next.add(`${cell[0]},${cell[1]}`);
          return next;
        });
      }
    }
  }, [gameState, navigate, gameFinished]);

  const handleShoot = (row, col) => {
    if (!gameState?.myTurn) return;
    const cell = gameState.opponentBoard[row][col];
    if (cell === 'HIT' || cell === 'MISS') return;
    play('click');
    shoot(gameId, row, col);
  };

  const handleSurrender = () => { surrender(gameId); resetGame(); navigate('/lobby'); };

  const mySkin = gameState?.mySkin || 'padrao_antigo';
  const opponentSkin = gameState?.opponentSkin || 'pirate';
  const mySkinShips = SKINS_MAP[mySkin] || SKINS_MAP['padrao_antigo'];
  const opponentSkinShips = SKINS_MAP[opponentSkin] || SKINS_MAP['padrao_antigo'];

  if (!gameState) {
    return (
      <PirateBackground variant="battle">
        <div className="min-h-screen flex items-center justify-center">
          <UIPanel variant="default" size="sm">
            <p className="text-[#C6AE78] text-center font-['Cinzel',_serif] animate-pulse">
              Reconectando à partida...
            </p>
          </UIPanel>
        </div>
      </PirateBackground>
    );
  }

  const myShipsStatus = gameState?.myShips
    ? mySkinShips.map(s => {
        const serverShip = gameState.myShips.find(ss => ss.type === s.type);
        return { ...s, sunk: serverShip ? serverShip.sunk : false };
      })
    : getSunkStatus(gameState?.myBoard, mySkinShips);
  const opponentShipsStatus = opponentSkinShips.map(s => ({ ...s, sunk: sunkOpponentShips.includes(s.type) }));

  return (
    <PirateBackground variant="battle">
      <div className="min-h-screen flex flex-col">
        
        {/* Header */}
        <header className="w-full px-4 sm:px-8 py-4 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            {!gameFinished && (
              <div className="relative">
                {!showSurrenderConfirm ? (
                  <PirateButton onClick={() => setShowSurrenderConfirm(true)} variant="danger" size="sm">
                    🏳️ Desistir
                  </PirateButton>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-[#C84A3A] text-xs font-bold font-['Cinzel',_serif]">Tem certeza?</span>
                    <PirateButton onClick={handleSurrender} variant="danger" size="sm">Sim</PirateButton>
                    <PirateButton onClick={() => setShowSurrenderConfirm(false)} variant="wood" size="sm">Não</PirateButton>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleMute}
              className="text-[#8B7355] hover:text-[#D5AE47] transition-colors text-xl p-1"
              title={muted ? 'Ativar som' : 'Silenciar'}>
              {muted ? <HiVolumeOff /> : <HiVolumeUp />}
            </button>
            <span className="text-[#C6AE78] text-sm font-['Cinzel',_serif]">{username}</span>
          </div>
        </header>

        <TurnIndicator gameFinished={gameFinished} gameState={gameState} username={username} />

        {/* Notificação de oponente desconectado */}
        {opponentStatus === 'disconnected' && !gameFinished && (
          <div className="w-full flex justify-center mb-2">
            <div className="px-4 py-2 rounded bg-[#8B2A1E]/20 border border-[#C84A3A]/40 animate-pulse">
              <p className="text-[#C84A3A] text-xs font-bold text-center font-['Cinzel',_serif]">
                ⚠️ Oponente desconectou — aguardando reconexão...
              </p>
            </div>
          </div>
        )}

        {/* Boards */}
        <div className="flex-1 flex items-center justify-center px-2 sm:px-4 pb-4 sm:pb-8 overflow-hidden">
          <div className="flex flex-col xl:flex-row items-center xl:items-stretch gap-6">
            <ShipList ships={myShipsStatus} title="Minha Frota" playerName={username} align="left" mobile={false} />

            <div className="flex flex-col items-center gap-4">
              <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-center lg:items-start">
                <UIPanel variant="default" size="sm" className="relative overflow-visible">
                  <h2 className="text-center text-[#C6AE78] text-xs font-bold tracking-[0.15em] mb-3 uppercase font-['Cinzel',_serif]">
                    Meu Tabuleiro
                  </h2>
                  <MyBoard board={gameState?.myBoard} skinShips={mySkinShips} cellSize={cellSize} serverShips={gameState?.myShips} />
                </UIPanel>

                <UIPanel variant="default" size="sm" className={`relative overflow-visible ${gameState?.myTurn && !gameFinished ? 'animate-[pulse-glow_2s_ease-in-out_infinite]' : ''}`}>
                  <h2 className="text-center text-[#C6AE78] text-xs font-bold tracking-[0.15em] mb-3 uppercase font-['Cinzel',_serif]">
                    {gameState?.opponentName || 'Oponente'}
                  </h2>
                  <OpponentBoard board={gameState?.opponentBoard} onClick={handleShoot}
                    active={gameState?.myTurn && !gameFinished} cellSize={cellSize}
                    revealed={gameFinished} skinShips={opponentSkinShips}
                    sunkShipTypes={sunkOpponentShips} sunkCellsSet={sunkOpponentCells} />
                </UIPanel>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full">
                <ShipList ships={myShipsStatus} title="Minha Frota" playerName={username} align="left" mobile={true} />
                <ShipList ships={opponentShipsStatus} title="Frota Inimiga" playerName={gameState?.opponentName} align="right" mobile={true} />
              </div>
            </div>

            <ShipList ships={opponentShipsStatus} title="Frota Inimiga" playerName={gameState?.opponentName} align="right" mobile={false} />
          </div>
        </div>

        {gameState?.opponentName !== 'Capitão Bot' && (
          <EmotePanel onSendEmote={(e) => sendEmote(gameId, e)} receivedEmote={emote} />
        )}
      </div>
    </PirateBackground>
  );
}
