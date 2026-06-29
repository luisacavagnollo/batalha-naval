import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../hooks/useGame';

const SHIPS = [
  { type: 'CARRIER', name: 'Porta-aviões', size: 5 },
  { type: 'BATTLESHIP', name: 'Navio-tanque', size: 4 },
  { type: 'CRUISER', name: 'Contratorpedeiro', size: 3 },
  { type: 'SUBMARINE', name: 'Submarino', size: 3 },
  { type: 'DESTROYER', name: 'Destroyer', size: 2 },
];

export default function PlaceShips() {
  const { gameId } = useParams();
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  const { connect, connected, subscribeToGame, placeShip, gameState } = useGame(token);

  const [orientation, setOrientation] = useState('HORIZONTAL');
  const [currentShip, setCurrentShip] = useState(0);
  const [placed, setPlaced] = useState([]);
  const [hoverCells, setHoverCells] = useState([]);
  const [ready, setReady] = useState(false);

  const allPlaced = currentShip >= SHIPS.length;

  // Connect and subscribe on mount
  useEffect(() => {
    connect().then(() => subscribeToGame(gameId));
  }, [connect, subscribeToGame, gameId]);

  // Navigate to game when phase changes to IN_PROGRESS
  useEffect(() => {
    if (gameState?.phase === 'IN_PROGRESS') {
      navigate(`/game/${gameId}`);
    }
  }, [gameState, gameId, navigate]);

  const getCells = (row, col, size, ori) => {
    const cells = [];
    for (let i = 0; i < size; i++) {
      const r = ori === 'VERTICAL' ? row + i : row;
      const c = ori === 'HORIZONTAL' ? col + i : col;
      if (r >= 10 || c >= 10) return null;
      cells.push({ row: r, col: c });
    }
    return cells;
  };

  const isOccupied = (cells) => {
    return cells.some(cell =>
      placed.some(p => p.cells.some(c => c.row === cell.row && c.col === cell.col))
    );
  };

  const handleHover = (row, col) => {
    if (allPlaced) { setHoverCells([]); return; }
    const cells = getCells(row, col, SHIPS[currentShip].size, orientation);
    if (!cells || isOccupied(cells)) { setHoverCells([]); return; }
    setHoverCells(cells);
  };

  const handleClick = (row, col) => {
    if (allPlaced) return;
    const ship = SHIPS[currentShip];
    const cells = getCells(row, col, ship.size, orientation);
    if (!cells || isOccupied(cells)) return;

    placeShip(gameId, ship.type, row, col, orientation);
    setPlaced([...placed, { type: ship.type, cells }]);
    setCurrentShip(currentShip + 1);
    setHoverCells([]);
  };

  const cellColor = (row, col) => {
    if (placed.some(p => p.cells.some(c => c.row === row && c.col === col))) {
      return 'bg-emerald-500';
    }
    if (hoverCells.some(c => c.row === row && c.col === col)) {
      return 'bg-emerald-300/50';
    }
    return 'bg-blue-900 hover:bg-blue-700';
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4">Posicione seus navios</h1>

      <div className="mb-4 flex gap-4 items-center">
        <button
          onClick={() => setOrientation(o => o === 'HORIZONTAL' ? 'VERTICAL' : 'HORIZONTAL')}
          className="px-4 py-2 bg-slate-700 rounded hover:bg-slate-600"
        >
          Rotacionar ({orientation === 'HORIZONTAL' ? 'H' : 'V'})
        </button>
        {!allPlaced && (
          <span className="text-slate-300">
            Posicionar: {SHIPS[currentShip].name} ({SHIPS[currentShip].size})
          </span>
        )}
      </div>

      <div
        className="grid grid-cols-10 gap-0.5 mb-4"
        onMouseLeave={() => setHoverCells([])}
      >
        {Array.from({ length: 100 }, (_, i) => {
          const row = Math.floor(i / 10);
          const col = i % 10;
          return (
            <div
              key={i}
              className={`w-8 h-8 sm:w-10 sm:h-10 border border-slate-600 cursor-pointer ${cellColor(row, col)}`}
              onMouseEnter={() => handleHover(row, col)}
              onClick={() => handleClick(row, col)}
            />
          );
        })}
      </div>

      {allPlaced && !ready && (
        <button
          onClick={() => setReady(true)}
          className="px-6 py-3 bg-green-600 hover:bg-green-500 rounded-lg font-semibold text-lg"
        >
          Pronto!
        </button>
      )}

      {ready && (
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin w-6 h-6 border-4 border-green-500 border-t-transparent rounded-full"></div>
          <p className="text-slate-300">Aguardando oponente...</p>
        </div>
      )}

      {!allPlaced && (
        <div className="mt-4 text-slate-400 text-sm">
          <p>Navios restantes:</p>
          {SHIPS.filter((_, i) => i >= currentShip).map(s => (
            <span key={s.type} className="mr-3">{s.name} ({s.size})</span>
          ))}
        </div>
      )}
    </div>
  );
}
