import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../hooks/useGame';

const CELL_COLORS = {
  EMPTY: 'bg-blue-900',
  SHIP: 'bg-slate-500',
  HIT: 'bg-red-600',
  MISS: 'bg-slate-300',
};

const EMOTES = ['👍', '😂', '😱', '😢', '💀', '🫡'];

function Grid({ board, onClick, showShips, active }) {
  if (!board) return null;
  return (
    <div className={`grid grid-cols-10 gap-0.5 ${active ? 'ring-2 ring-green-500 rounded' : ''}`}>
      {board.flat().map((cell, i) => {
        const row = Math.floor(i / 10);
        const col = i % 10;
        const color = cell === 'SHIP' && !showShips ? CELL_COLORS.EMPTY : CELL_COLORS[cell] || CELL_COLORS.EMPTY;
        const hover = active && cell === 'EMPTY' ? 'hover:bg-red-400' : '';
        return (
          <div
            key={i}
            className={`w-7 h-7 sm:w-9 sm:h-9 border border-slate-600 ${active ? 'cursor-crosshair' : 'cursor-default'} ${color} ${hover}`}
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

      <div className="flex flex-col lg:flex-row gap-8">
        <div>
          <h2 className="text-center text-sm text-slate-300 mb-1">Meu Tabuleiro</h2>
          <Grid board={gameState?.myBoard} showShips />
        </div>
        <div>
          <h2 className="text-center text-sm text-slate-300 mb-1">Oponente</h2>
          <Grid board={gameState?.opponentBoard} onClick={handleShoot} active={gameState?.myTurn} />
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
