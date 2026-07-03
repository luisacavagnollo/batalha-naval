import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../hooks/useGame';

const CELL_SIZE = 36;
const CELL_SIZE_MOBILE = 28;
const GAP = 2;

function useResponsiveCellSize() {
  const [cellSize, setCellSize] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < 768 ? CELL_SIZE_MOBILE : CELL_SIZE
  );

  useEffect(() => {
    const handleResize = () => {
      setCellSize(window.innerWidth < 768 ? CELL_SIZE_MOBILE : CELL_SIZE);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return cellSize;
}

const OCEAN_COLORS = [
  'from-[#0f2744] to-[#133254]',
  'from-[#112d4e] to-[#0d2340]',
  'from-[#0e2a48] to-[#122f50]',
];

function getOceanClass(row, col, cell) {
  if (cell === 'HIT') return 'bg-red-500/80';
  if (cell === 'MISS') return 'bg-slate-600/70';
  const variant = (row + col) % 3;
  return `bg-gradient-to-br ${OCEAN_COLORS[variant]}`;
}

const SKINS = {
  padrao: [
    { type: 'CARRIER', name: 'Porta-aviões', size: 5, img: '/ships/padrao/carrier.png' },
    { type: 'BATTLESHIP', name: 'Navio-tanque', size: 4, img: '/ships/padrao/battleship.png' },
    { type: 'CRUISER', name: 'Contratorpedeiro', size: 3, img: '/ships/padrao/cruiser.png' },
    { type: 'SUBMARINE', name: 'Submarino', size: 3, img: '/ships/padrao/submarine.png' },
    { type: 'DESTROYER', name: 'Destroyer', size: 2, img: '/ships/padrao/destroyer.png' },
  ],
  pirate: [
    { type: 'CARRIER', name: 'Porta-aviões', size: 5, img: '/ships/pirate/carrier_pirate.png' },
    { type: 'BATTLESHIP', name: 'Navio-tanque', size: 4, img: '/ships/pirate/battleship_pirate.png' },
    { type: 'CRUISER', name: 'Contratorpedeiro', size: 3, img: '/ships/pirate/cruiser_pirate.png' },
    { type: 'SUBMARINE', name: 'Submarino', size: 3, img: '/ships/pirate/submarine_pirate.png' },
    { type: 'DESTROYER', name: 'Destroyer', size: 2, img: '/ships/pirate/destroyer_pirate.png' },
  ],
};

const EMOTES = ['👍', '😂', '😱', '😢', '💀', '🫡'];

function detectShips(board) {
  if (!board) return [];
  const visited = Array.from({ length: 10 }, () => Array(10).fill(false));
  const ships = [];

  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      if (visited[r][c]) continue;
      if (board[r][c] !== 'SHIP' && board[r][c] !== 'HIT') continue;

      let hLen = 0;
      while (c + hLen < 10 && (board[r][c + hLen] === 'SHIP' || board[r][c + hLen] === 'HIT') && !visited[r][c + hLen]) {
        hLen++;
      }

      let vLen = 0;
      while (r + vLen < 10 && (board[r + vLen][c] === 'SHIP' || board[r + vLen][c] === 'HIT') && !visited[r + vLen][c]) {
        vLen++;
      }

      if (hLen >= vLen && hLen > 1) {
        for (let i = 0; i < hLen; i++) visited[r][c + i] = true;
        ships.push({ row: r, col: c, size: hLen, orientation: 'HORIZONTAL' });
      } else if (vLen > 1) {
        for (let i = 0; i < vLen; i++) visited[r + i][c] = true;
        ships.push({ row: r, col: c, size: vLen, orientation: 'VERTICAL' });
      } else {
        visited[r][c] = true;
        ships.push({ row: r, col: c, size: 1, orientation: 'HORIZONTAL' });
      }
    }
  }
  return ships;
}

function isShipSunk(board, ship) {
  for (let i = 0; i < ship.size; i++) {
    const r = ship.orientation === 'VERTICAL' ? ship.row + i : ship.row;
    const c = ship.orientation === 'HORIZONTAL' ? ship.col + i : ship.col;
    if (board[r][c] !== 'HIT') return false;
  }
  return true;
}

function assignShipData(ships, board, skinShips) {
  let threeCount = 0;
  return ships
    .filter(s => s.size > 1)
    .map(ship => {
      let imgData;
      if (ship.size === 5) imgData = skinShips[0];
      else if (ship.size === 4) imgData = skinShips[1];
      else if (ship.size === 3) {
        imgData = threeCount === 0 ? skinShips[2] : skinShips[3];
        threeCount++;
      } else if (ship.size === 2) imgData = skinShips[4];
      return { ...ship, img: imgData?.img, sunk: isShipSunk(board, ship) };
    });
}

function getSunkStatus(board, shipList) {
  if (!board) return shipList.map(s => ({ ...s, sunk: false }));
  const detected = detectShips(board);
  const sunkSizes = [];
  for (const ship of detected) {
    if (ship.size > 1 && isShipSunk(board, ship)) {
      sunkSizes.push(ship.size);
    }
  }
  const usedSizes = [];
  return shipList.map(s => {
    const idx = sunkSizes.findIndex((size, i) => size === s.size && !usedSizes.includes(i));
    if (idx !== -1) {
      usedSizes.push(idx);
      return { ...s, sunk: true };
    }
    return { ...s, sunk: false };
  });
}

const FLEET_CELL = 44;
const FLEET_CELL_MOBILE = 34;
const FLEET_HEIGHT = 40;
const FLEET_HEIGHT_MOBILE = 30;
const MAX_SHIP_SIZE = 5;

function ShipList({ ships, title, align, mobile }) {
  const fleetCell = mobile ? FLEET_CELL_MOBILE : FLEET_CELL;
  const fleetHeight = mobile ? FLEET_HEIGHT_MOBILE : FLEET_HEIGHT;
  const maxWidth = MAX_SHIP_SIZE * fleetCell;

  if (mobile) {
    return (
      <div className="flex xl:hidden flex-col gap-2 items-center w-full">
        <h3 className="text-slate-500 text-xs font-medium tracking-wider uppercase mb-1">{title}</h3>
        <div
          className="flex flex-wrap gap-2 justify-center rounded-xl p-4 bg-no-repeat bg-contain bg-center"
          style={{ backgroundImage: `url('/textures/deck.png')`, minHeight: '120px', alignItems: 'center' }}
        >
          {ships.map((ship) => (
            <div
              key={ship.type}
              className={`transition-opacity duration-500 ${ship.sunk ? 'opacity-25' : 'opacity-100'}`}
              style={{ display: 'flex', alignItems: 'center' }}
            >
              <img
                src={ship.img}
                alt={ship.name}
                className={`object-fill ${ship.sunk ? 'grayscale' : ''}`}
                style={{ width: `${ship.size * fleetCell}px`, height: `${fleetHeight}px` }}
              />
              {ship.sunk && <span className="text-red-400 text-sm font-bold ml-1">✕</span>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`hidden xl:flex flex-col gap-4 ${align === 'right' ? 'items-end' : 'items-start'}`} style={{ width: `${maxWidth + 32}px` }}>
      <h3 className="text-slate-500 text-xs font-medium tracking-wider uppercase">{title}</h3>
      <div
        className="rounded-xl p-6 flex flex-col gap-4 bg-no-repeat bg-contain bg-center items-center"
        style={{ backgroundImage: `url('/textures/deck.png')`, minHeight: '320px', display: 'flex', justifyContent: 'center' }}
      >
        {ships.map((ship) => (
          <div
            key={ship.type}
            className={`transition-opacity duration-500 ${ship.sunk ? 'opacity-25' : 'opacity-100'}`}
            style={{ width: `${maxWidth}px`, display: 'flex', justifyContent: 'center', alignItems: 'center' }}
          >
            <img
              src={ship.img}
              alt={ship.name}
              className={`object-fill ${ship.sunk ? 'grayscale' : ''}`}
              style={{ width: `${ship.size * fleetCell}px`, height: `${fleetHeight}px` }}
            />
            {ship.sunk && <span className="text-red-400 text-sm font-bold ml-2">✕</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function MyBoard({ board, skinShips, cellSize }) {
  if (!board) return null;
  const detected = detectShips(board);
  const ships = assignShipData(detected, board, skinShips);

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Sombras de peixes no fundo */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <img src="/fish/right/fish1.png" alt="" className="absolute top-[12%] h-6 opacity-[0.18] animate-[swim-right_14s_linear_infinite]" />
        <img src="/fish/left/fish2.png" alt="" className="absolute top-[35%] h-9 opacity-[0.14] animate-[swim-left_20s_linear_infinite] [animation-delay:4s]" />
        <img src="/fish/right/fish3.png" alt="" className="absolute top-[58%] h-7 opacity-[0.16] animate-[swim-right_17s_linear_infinite] [animation-delay:9s]" />
        <img src="/fish/left/fish4.png" alt="" className="absolute top-[78%] h-10 opacity-[0.12] animate-[swim-left_24s_linear_infinite] [animation-delay:13s]" />
        <img src="/fish/right/fish4.png" alt="" className="absolute top-[92%] h-5 opacity-[0.15] animate-[swim-right_28s_linear_infinite] [animation-delay:18s]" />
      </div>

      <div className="grid grid-cols-10" style={{ rowGap: `${GAP}px`, columnGap: `${GAP}px`, width: `${cellSize * 10 + GAP * 9}px` }}>
        {board.flat().map((cell, i) => {
          const row = Math.floor(i / 10);
          const col = i % 10;
          const oceanClass = getOceanClass(row, col, cell);
          return (
            <div
              key={i}
              style={{
                width: `${cellSize}px`,
                height: `${cellSize}px`,
              }}
              className={`rounded-sm ${oceanClass}`}
            />
          );
        })}
      </div>

      {ships.map((ship, idx) => {
        if (!ship.img) return null;
        const cellTotal = cellSize + GAP;
        const top = ship.row * cellTotal;
        const left = ship.col * cellTotal;
        const length = ship.size * cellTotal - GAP;

        const style = ship.orientation === 'HORIZONTAL'
          ? { top: `${top}px`, left: `${left}px`, width: `${length}px`, height: `${cellSize}px` }
          : {
              top: `${top}px`, left: `${left + cellSize}px`,
              width: `${length}px`, height: `${cellSize}px`,
              transform: 'rotate(90deg)',
              transformOrigin: 'top left',
            };

        return (
          <img
            key={idx}
            src={ship.img}
            alt={`ship-${ship.size}`}
            className={`absolute pointer-events-none object-fill transition-opacity duration-500 ${ship.sunk ? 'opacity-25 grayscale' : 'opacity-90'}`}
            style={style}
          />
        );
      })}
    </div>
  );
}

function OpponentBoard({ board, onClick, active, cellSize, revealed, skinShips }) {
  if (!board) return null;

  // Detectar e renderizar navios quando revelado
  const ships = revealed ? assignShipData(detectShips(board), board, skinShips) : [];

  return (
    <div className={`relative overflow-hidden rounded-lg ${active ? 'ring-2 ring-cyan-500' : ''}`}>
      {/* Sombras de peixes no fundo */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <img src="/fish/right/fish2.png" alt="" className="absolute top-[18%] h-8 opacity-[0.15] animate-[swim-right_16s_linear_infinite] [animation-delay:2s]" />
        <img src="/fish/left/fish1.png" alt="" className="absolute top-[42%] h-6 opacity-[0.17] animate-[swim-left_13s_linear_infinite] [animation-delay:6s]" />
        <img src="/fish/left/fish3.png" alt="" className="absolute top-[65%] h-11 opacity-[0.12] animate-[swim-left_22s_linear_infinite] [animation-delay:10s]" />
        <img src="/fish/right/fish1.png" alt="" className="absolute top-[85%] h-5 opacity-[0.16] animate-[swim-right_18s_linear_infinite] [animation-delay:15s]" />
      </div>

      <div className="grid grid-cols-10" style={{ rowGap: `${GAP}px`, columnGap: `${GAP}px`, width: `${cellSize * 10 + GAP * 9}px` }}>
        {board.flat().map((cell, i) => {
          const row = Math.floor(i / 10);
          const col = i % 10;
          const oceanClass = getOceanClass(row, col, cell);
          const hover = active && cell === 'EMPTY' ? 'hover:bg-red-400/60' : '';
          return (
            <div
              key={i}
              style={{
                width: `${cellSize}px`,
                height: `${cellSize}px`,
              }}
              className={`rounded-sm ${active ? 'cursor-crosshair' : 'cursor-default'} ${oceanClass} ${hover} transition-colors`}
              onClick={() => onClick?.(row, col)}
            />
          );
        })}
      </div>

      {/* Navios revelados ao final da partida */}
      {revealed && ships.map((ship, idx) => {
        if (!ship.img) return null;
        const cellTotal = cellSize + GAP;
        const top = ship.row * cellTotal;
        const left = ship.col * cellTotal;
        const length = ship.size * cellTotal - GAP;

        const style = ship.orientation === 'HORIZONTAL'
          ? { top: `${top}px`, left: `${left}px`, width: `${length}px`, height: `${cellSize}px` }
          : {
              top: `${top}px`, left: `${left + cellSize}px`,
              width: `${length}px`, height: `${cellSize}px`,
              transform: 'rotate(90deg)',
              transformOrigin: 'top left',
            };

        return (
          <img
            key={idx}
            src={ship.img}
            alt={`ship-${ship.size}`}
            className={`absolute pointer-events-none object-fill transition-opacity duration-500 ${ship.sunk ? 'opacity-25 grayscale' : 'opacity-90'}`}
            style={style}
          />
        );
      })}
    </div>
  );
}

export default function Game() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');
  const { connect, subscribeToGame, gameState, shoot, sendEmote, emote } = useGame(token);
  const [sunkOpponentShips, setSunkOpponentShips] = useState([]);
  const [gameFinished, setGameFinished] = useState(false);
  const cellSize = useResponsiveCellSize();

  useEffect(() => {
    connect().then(() => subscribeToGame(gameId));
  }, [connect, subscribeToGame, gameId]);

  useEffect(() => {
    if (gameState?.phase === 'FINISHED' && !gameFinished) {
      setGameFinished(true);
      // Mostra os tabuleiros revelados por 5 segundos antes de ir para GameOver
      setTimeout(() => {
        navigate(`/game-over?winner=${gameState.winnerId}&gameId=${gameId}`);
      }, 5000);
    }
    if (gameState?.sunkShipType && gameState?.lastShotResult === 'SUNK' && gameState?.myTurn) {
      setSunkOpponentShips(prev => {
        if (!prev.includes(gameState.sunkShipType)) {
          return [...prev, gameState.sunkShipType];
        }
        return prev;
      });
    }
  }, [gameState, navigate, gameFinished]);

  const handleShoot = (row, col) => {
    if (!gameState?.myTurn) return;
    const cell = gameState.opponentBoard[row][col];
    if (cell === 'HIT' || cell === 'MISS') return;
    shoot(gameId, row, col);
  };

  // Determinar skins baseado no mySkin do backend
  const mySkin = gameState?.mySkin || 'padrao';
  const opponentSkin = mySkin === 'padrao' ? 'pirate' : 'padrao';
  const mySkinShips = SKINS[mySkin];
  const opponentSkinShips = SKINS[opponentSkin];

  const myShipsStatus = getSunkStatus(gameState?.myBoard, mySkinShips);
  const opponentShipsStatus = opponentSkinShips.map(s => ({
    ...s,
    sunk: sunkOpponentShips.includes(s.type),
  }));

  return (
    <div className="min-h-screen bg-[#0a1a12] flex flex-col">
      <header className="w-full px-4 sm:px-8 py-5 border-b border-emerald-900/40 flex items-center justify-between">
        <h1 className="text-xl font-black text-white tracking-widest uppercase">Battleship</h1>
        <span className="text-slate-500 text-sm">{username}</span>
      </header>

      <div className="w-full flex justify-center py-3 sm:py-4">
        <div className={`px-4 sm:px-8 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-bold tracking-wider uppercase ${
          gameFinished
            ? (gameState?.winnerId === username
              ? 'bg-emerald-800/80 text-emerald-300'
              : 'bg-red-900/60 text-red-300')
            : gameState?.myTurn
              ? 'bg-emerald-800/80 text-emerald-300 animate-pulse'
              : 'bg-[#0f2518] text-slate-500 border border-emerald-900/40'
        }`}>
          {gameFinished
            ? (gameState?.winnerId === username ? 'Vitória' : 'Derrota')
            : gameState?.myTurn ? 'Sua vez — Ataque' : 'Aguardando oponente...'}
        </div>
      </div>

      {gameState?.lastShotResult && (
        <div className="w-full flex justify-center pb-2">
          <span className="text-yellow-400 text-sm font-semibold">
            Último tiro: {gameState.lastShotResult}
            {gameState.sunkShipType && ` — ${gameState.sunkShipType} AFUNDADO!`}
          </span>
        </div>
      )}

      <div className="flex-1 flex items-center justify-center px-2 sm:px-4 pb-20">
        <div className="flex flex-col xl:flex-row items-center xl:items-start gap-6">
          {/* Desktop ship list - left */}
          <ShipList ships={myShipsStatus} title="Minha Frota" align="left" mobile={false} />

          <div className="flex flex-col items-center gap-4">
            {/* Boards */}
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 items-center lg:items-start">
              <div className="relative overflow-visible">
                <div className="bg-[#060d18] rounded-lg p-3 sm:p-6">
                  <h2 className="text-center text-blue-300/50 text-xs font-medium tracking-wider mb-3 uppercase">Meu Tabuleiro</h2>
                  <MyBoard board={gameState?.myBoard} skinShips={mySkinShips} cellSize={cellSize} />
                </div>
                <img src="/textures/Superior_esquerdo.png" alt="" className="absolute pointer-events-none" style={{ top: '-10px', left: '-10px', width: '100px', height: '100px' }} />
                <img src="/textures/Superior_direito.png" alt="" className="absolute pointer-events-none" style={{ top: '-10px', right: '-10px', width: '100px', height: '100px' }} />
                <img src="/textures/Inferior_esquerdo.png" alt="" className="absolute pointer-events-none" style={{ bottom: '-10px', left: '-10px', width: '100px', height: '100px' }} />
                <img src="/textures/Inferior_direito.png" alt="" className="absolute pointer-events-none" style={{ bottom: '-10px', right: '-10px', width: '100px', height: '100px' }} />
              </div>
              <div className="relative overflow-visible">
                <div className="bg-[#060d18] rounded-lg p-3 sm:p-6">
                  <h2 className="text-center text-blue-300/50 text-xs font-medium tracking-wider mb-3 uppercase">Oponente</h2>
                  <OpponentBoard board={gameState?.opponentBoard} onClick={handleShoot} active={gameState?.myTurn && !gameFinished} cellSize={cellSize} revealed={gameFinished} skinShips={opponentSkinShips} />
                </div>
                <img src="/textures/Superior_esquerdo.png" alt="" className="absolute pointer-events-none" style={{ top: '-10px', left: '-10px', width: '100px', height: '100px' }} />
                <img src="/textures/Superior_direito.png" alt="" className="absolute pointer-events-none" style={{ top: '-10px', right: '-10px', width: '100px', height: '100px' }} />
                <img src="/textures/Inferior_esquerdo.png" alt="" className="absolute pointer-events-none" style={{ bottom: '-10px', left: '-10px', width: '100px', height: '100px' }} />
                <img src="/textures/Inferior_direito.png" alt="" className="absolute pointer-events-none" style={{ bottom: '-10px', right: '-10px', width: '100px', height: '100px' }} />
              </div>
            </div>

            {/* Mobile ship lists - below boards */}
            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <ShipList ships={myShipsStatus} title="Minha Frota" align="left" mobile={true} />
              <ShipList ships={opponentShipsStatus} title="Frota Inimiga" align="right" mobile={true} />
            </div>
          </div>

          {/* Desktop ship list - right */}
          <ShipList ships={opponentShipsStatus} title="Frota Inimiga" align="right" mobile={false} />
        </div>
      </div>

      {emote && (
        <div className="fixed top-24 right-8 bg-[#0f2518] border border-emerald-900/40 px-5 py-3 rounded-2xl text-4xl animate-bounce shadow-xl">
          {emote.emote}
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 flex justify-center py-4 bg-[#0a1a12]/80 backdrop-blur-sm border-t border-emerald-900/40">
        <div className="flex gap-3 bg-[#0f2518] px-6 py-3 rounded-xl border border-emerald-900/40">
          {EMOTES.map(e => (
            <button key={e} onClick={() => sendEmote(gameId, e)} className="text-2xl hover:scale-125 transition-transform active:scale-90">
              {e}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
