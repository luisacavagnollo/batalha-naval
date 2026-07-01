import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../hooks/useGame';

const CELL_SIZE = 36;
const GAP = 2;

const CELL_COLORS = {
  EMPTY: 'bg-slate-700',
  SHIP: 'bg-slate-700',
  HIT: 'bg-red-500',
  MISS: 'bg-slate-500',
};

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

function ShipList({ ships, title, align }) {
  return (
    <div className={`hidden xl:flex flex-col gap-3 w-44 ${align === 'right' ? 'items-end' : 'items-start'}`}>
      <h3 className="text-slate-500 text-xs font-bold tracking-wider uppercase mb-2">{title}</h3>
      {ships.map((ship) => (
        <div key={ship.type} className={`flex items-center gap-2 transition-opacity duration-500 ${ship.sunk ? 'opacity-25' : 'opacity-100'}`}>
          <img
            src={ship.img}
            alt={ship.name}
            className={`h-8 object-contain ${ship.sunk ? 'grayscale' : ''}`}
            style={{ width: `${ship.size * 24}px` }}
          />
          {ship.sunk && <span className="text-red-400 text-xs font-bold">✕</span>}
        </div>
      ))}
    </div>
  );
}

function MyBoard({ board, skinShips }) {
  if (!board) return null;
  const detected = detectShips(board);
  const ships = assignShipData(detected, board, skinShips);

  return (
    <div className="relative">
      <div className="grid grid-cols-10" style={{ gap: `${GAP}px` }}>
        {board.flat().map((cell, i) => {
          const color = cell === 'HIT' ? 'bg-red-500' : cell === 'MISS' ? 'bg-slate-500' : 'bg-slate-700';
          return (
            <div
              key={i}
              style={{ width: `${CELL_SIZE}px`, height: `${CELL_SIZE}px` }}
              className={`border border-slate-600 rounded-sm ${color}`}
            />
          );
        })}
      </div>

      {ships.map((ship, idx) => {
        if (!ship.img) return null;
        const cellTotal = CELL_SIZE + GAP;
        const top = ship.row * cellTotal;
        const left = ship.col * cellTotal;
        const length = ship.size * cellTotal - GAP;

        const style = ship.orientation === 'HORIZONTAL'
          ? { top: `${top}px`, left: `${left}px`, width: `${length}px`, height: `${CELL_SIZE}px` }
          : {
              top: `${top}px`, left: `${left}px`,
              width: `${length}px`, height: `${CELL_SIZE}px`,
              transform: 'rotate(90deg) translateY(-100%)',
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

function OpponentBoard({ board, onClick, active }) {
  if (!board) return null;
  return (
    <div className={`grid grid-cols-10 rounded-lg ${active ? 'ring-2 ring-cyan-500' : ''}`} style={{ gap: `${GAP}px` }}>
      {board.flat().map((cell, i) => {
        const row = Math.floor(i / 10);
        const col = i % 10;
        const color = CELL_COLORS[cell] || CELL_COLORS.EMPTY;
        const hover = active && cell === 'EMPTY' ? 'hover:bg-red-400/60' : '';
        return (
          <div
            key={i}
            style={{ width: `${CELL_SIZE}px`, height: `${CELL_SIZE}px` }}
            className={`border border-slate-600 rounded-sm ${active ? 'cursor-crosshair' : 'cursor-default'} ${color} ${hover} transition-colors`}
            onClick={() => onClick?.(row, col)}
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

  useEffect(() => {
    connect().then(() => subscribeToGame(gameId));
  }, [connect, subscribeToGame, gameId]);

  useEffect(() => {
    if (gameState?.phase === 'FINISHED') {
      navigate(`/game-over?winner=${gameState.winnerId}`);
    }
    if (gameState?.sunkShipType && gameState?.lastShotResult === 'SUNK') {
      setSunkOpponentShips(prev => {
        if (!prev.includes(gameState.sunkShipType)) {
          return [...prev, gameState.sunkShipType];
        }
        return prev;
      });
    }
  }, [gameState, navigate]);

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
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <header className="w-full px-8 py-4 border-b border-slate-700 flex items-center justify-between">
        <h1 className="text-2xl font-black text-white tracking-wide">BATTLESHIP</h1>
        <span className="text-slate-400 text-sm">{username}</span>
      </header>

      <div className="w-full flex justify-center py-4">
        <div className={`px-8 py-3 rounded-xl text-lg font-bold tracking-wider ${gameState?.myTurn ? 'bg-gradient-to-r from-cyan-500 to-cyan-400 text-slate-900 animate-pulse' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
          {gameState?.myTurn ? 'SUA VEZ — ATAQUE!' : 'AGUARDANDO OPONENTE...'}
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

      <div className="flex-1 flex items-center justify-center px-4 pb-20">
        <div className="flex items-start gap-6">
          <ShipList ships={myShipsStatus} title="Minha Frota" align="left" />

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="bg-slate-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-center text-slate-400 text-xs font-bold tracking-wider mb-3 uppercase">Meu Tabuleiro</h2>
              <MyBoard board={gameState?.myBoard} skinShips={mySkinShips} />
            </div>
            <div className="bg-slate-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-center text-slate-400 text-xs font-bold tracking-wider mb-3 uppercase">Oponente</h2>
              <OpponentBoard board={gameState?.opponentBoard} onClick={handleShoot} active={gameState?.myTurn} />
            </div>
          </div>

          <ShipList ships={opponentShipsStatus} title="Frota Inimiga" align="right" />
        </div>
      </div>

      {emote && (
        <div className="fixed top-24 right-8 bg-slate-800 border border-slate-700 px-5 py-3 rounded-2xl text-4xl animate-bounce shadow-xl">
          {emote.emote}
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 flex justify-center py-4 bg-slate-900/80 backdrop-blur-sm border-t border-slate-700">
        <div className="flex gap-3 bg-slate-800 px-6 py-3 rounded-xl border border-slate-700">
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
