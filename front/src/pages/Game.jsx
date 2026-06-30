import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../hooks/useGame';

const CELL_SIZE = 36;
const GAP = 2;

const CELL_COLORS = {
  EMPTY: 'bg-blue-900',
  SHIP: 'bg-blue-900',
  HIT: 'bg-red-600',
  MISS: 'bg-slate-400',
};

const SHIP_IMAGES = {
  5: '/ships/padrao/carrier.png',
  4: '/ships/padrao/battleship.png',
  '3a': '/ships/padrao/cruiser.png',
  '3b': '/ships/padrao/submarine.png',
  2: '/ships/padrao/destroyer.png',
};

const EMOTES = ['👍', '😂', '😱', '😢', '💀', '🫡'];

// Detecta navios contíguos no board
function detectShips(board) {
  if (!board) return [];
  const visited = Array.from({ length: 10 }, () => Array(10).fill(false));
  const ships = [];

  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      if (visited[r][c]) continue;
      if (board[r][c] !== 'SHIP' && board[r][c] !== 'HIT') continue;

      // Tenta expandir horizontalmente
      let hLen = 0;
      while (c + hLen < 10 && (board[r][c + hLen] === 'SHIP' || board[r][c + hLen] === 'HIT') && !visited[r][c + hLen]) {
        hLen++;
      }

      // Tenta expandir verticalmente
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

// Atribui imagens aos navios detectados por tamanho
function assignImages(ships) {
  let threeCount = 0;
  return ships
    .filter(s => s.size > 1)
    .map(ship => {
      let img;
      if (ship.size === 3) {
        img = threeCount === 0 ? SHIP_IMAGES['3a'] : SHIP_IMAGES['3b'];
        threeCount++;
      } else {
        img = SHIP_IMAGES[ship.size];
      }
      return { ...ship, img };
    });
}

function MyBoard({ board }) {
  if (!board) return null;
  const ships = assignImages(detectShips(board));

  return (
    <div className="relative">
      <div className="grid grid-cols-10" style={{ gap: `${GAP}px` }}>
        {board.flat().map((cell, i) => {
          const color = CELL_COLORS[cell] || CELL_COLORS.EMPTY;
          const hitOverlay = cell === 'HIT' ? 'bg-red-600' : cell === 'MISS' ? 'bg-slate-400' : '';
          return (
            <div
              key={i}
              style={{ width: `${CELL_SIZE}px`, height: `${CELL_SIZE}px` }}
              className={`border border-slate-600 ${color} ${hitOverlay}`}
            />
          );
        })}
      </div>

      {ships.map((ship, idx) => {
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
            className="absolute pointer-events-none object-fill opacity-90"
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
    <div className={`grid grid-cols-10 ${active ? 'ring-2 ring-green-500 rounded' : ''}`} style={{ gap: `${GAP}px` }}>
      {board.flat().map((cell, i) => {
        const row = Math.floor(i / 10);
        const col = i % 10;
        const color = CELL_COLORS[cell] || CELL_COLORS.EMPTY;
        const hover = active && cell === 'EMPTY' ? 'hover:bg-red-400' : '';
        return (
          <div
            key={i}
            style={{ width: `${CELL_SIZE}px`, height: `${CELL_SIZE}px` }}
            className={`border border-slate-600 ${active ? 'cursor-crosshair' : 'cursor-default'} ${color} ${hover}`}
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
  const { connect, subscribeToGame, gameState, shoot, sendEmote, emote } = useGame(token);

  useEffect(() => {
    connect().then(() => subscribeToGame(gameId));
  }, [connect, subscribeToGame, gameId]);

  useEffect(() => {
    if (gameState?.phase === 'FINISHED') {
      navigate(`/game-over?winner=${gameState.winnerId}`);
    }
  }, [gameState, navigate]);

  const handleShoot = (row, col) => {
    if (!gameState?.myTurn) return;
    const cell = gameState.opponentBoard[row][col];
    if (cell === 'HIT' || cell === 'MISS') return;
    shoot(gameId, row, col);
  };

  const turnText = gameState?.myTurn ? '🎯 Sua vez! Clique no tabuleiro do oponente' : '⏳ Aguardando oponente...';

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 flex flex-col items-center">
      <h1 className="text-xl font-bold mb-2">⚓ Batalha Naval</h1>
      <div className={`mb-4 px-6 py-2 rounded-lg text-lg ${gameState?.myTurn ? 'bg-green-600 text-white font-bold animate-pulse' : 'bg-slate-700 text-slate-300'}`}>
        {turnText}
      </div>

      {gameState?.lastShotResult && (
        <p className="mb-2 text-sm text-yellow-300">
          Último tiro: {gameState.lastShotResult}
          {gameState.sunkShipType && ` — ${gameState.sunkShipType} afundado!`}
        </p>
      )}

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div>
          <h2 className="text-center text-sm text-slate-300 mb-2">Meu Tabuleiro</h2>
          <MyBoard board={gameState?.myBoard} />
        </div>
        <div>
          <h2 className="text-center text-sm text-slate-300 mb-2">Oponente</h2>
          <OpponentBoard board={gameState?.opponentBoard} onClick={handleShoot} active={gameState?.myTurn} />
        </div>
      </div>

      {/* Emote recebido */}
      {emote && (
        <div className="fixed top-20 right-8 bg-slate-800 px-4 py-2 rounded-xl text-3xl animate-bounce">
          {emote.emote}
        </div>
      )}

      {/* Barra de emotes */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-slate-800 p-2 rounded-xl">
        {EMOTES.map(e => (
          <button key={e} onClick={() => sendEmote(gameId, e)} className="text-2xl hover:scale-125 transition-transform">
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}
