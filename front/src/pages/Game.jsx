import { useParams } from 'react-router-dom';

const CELL_COLORS = {
  EMPTY: 'bg-blue-900',
  SHIP: 'bg-slate-500',
  HIT: 'bg-red-600',
  MISS: 'bg-slate-300',
};

const EMOTES = ['👍', '😂', '😱', '😢', '💀', '🫡'];

function Grid({ board, onClick, showShips }) {
  return (
    <div className="grid grid-cols-10 gap-0.5">
      {board.flat().map((cell, i) => {
        const row = Math.floor(i / 10);
        const col = i % 10;
        const color = cell === 'SHIP' && !showShips ? CELL_COLORS.EMPTY : CELL_COLORS[cell] || CELL_COLORS.EMPTY;
        return (
          <div
            key={i}
            className={`w-7 h-7 sm:w-9 sm:h-9 border border-slate-600 cursor-pointer ${color}`}
            onClick={() => onClick?.(row, col)}
          />
        );
      })}
    </div>
  );
}

export default function Game() {
  const { gameId } = useParams();

  // Placeholder boards para renderização — serão substituídos pelo gameState real
  const emptyBoard = Array(10).fill(Array(10).fill('EMPTY'));

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 flex flex-col items-center">
      <h1 className="text-xl font-bold mb-2">⚓ Batalha Naval</h1>
      <p className="text-slate-400 mb-4">Aguardando turno...</p>

      <div className="flex flex-col lg:flex-row gap-8">
        <div>
          <h2 className="text-center text-sm text-slate-300 mb-1">Meu Tabuleiro</h2>
          <Grid board={emptyBoard} showShips />
        </div>
        <div>
          <h2 className="text-center text-sm text-slate-300 mb-1">Oponente</h2>
          <Grid board={emptyBoard} onClick={(r, c) => { /* shoot */ }} />
        </div>
      </div>

      {/* Emotes */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-slate-800 p-2 rounded-xl">
        {EMOTES.map(e => (
          <button key={e} className="text-2xl hover:scale-125 transition-transform">
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}
