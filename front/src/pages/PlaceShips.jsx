import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../hooks/useGame';

const SHIPS_PADRAO = [
  { type: 'CARRIER', name: 'Porta-aviões', size: 5, img: '/ships/padrao/carrier.png' },
  { type: 'BATTLESHIP', name: 'Navio-tanque', size: 4, img: '/ships/padrao/battleship.png' },
  { type: 'CRUISER', name: 'Contratorpedeiro', size: 3, img: '/ships/padrao/cruiser.png' },
  { type: 'SUBMARINE', name: 'Submarino', size: 3, img: '/ships/padrao/submarine.png' },
  { type: 'DESTROYER', name: 'Destroyer', size: 2, img: '/ships/padrao/destroyer.png' },
];

const SHIPS_PIRATE = [
  { type: 'CARRIER', name: 'Porta-aviões', size: 5, img: '/ships/pirate/carrier_pirate.png' },
  { type: 'BATTLESHIP', name: 'Navio-tanque', size: 4, img: '/ships/pirate/battleship_pirate.png' },
  { type: 'CRUISER', name: 'Contratorpedeiro', size: 3, img: '/ships/pirate/cruiser_pirate.png' },
  { type: 'SUBMARINE', name: 'Submarino', size: 3, img: '/ships/pirate/submarine_pirate.png' },
  { type: 'DESTROYER', name: 'Destroyer', size: 2, img: '/ships/pirate/destroyer_pirate.png' },
];

const CELL_SIZE = 40;
const GAP = 2;

export default function PlaceShips() {
  const { gameId } = useParams();
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');
  const navigate = useNavigate();
  const { connect, connected, subscribeToGame, placeShip, gameState } = useGame(token);

  const [orientation, setOrientation] = useState('HORIZONTAL');
  const [currentShip, setCurrentShip] = useState(0);
  const [placed, setPlaced] = useState([]);
  const [hoverCells, setHoverCells] = useState([]);
  const [ready, setReady] = useState(false);

  const mySkin = gameState?.mySkin || 'padrao';
  const SHIPS = mySkin === 'pirate' ? SHIPS_PIRATE : SHIPS_PADRAO;
  const allPlaced = currentShip >= SHIPS.length;

  useEffect(() => {
    connect().then(() => subscribeToGame(gameId));
  }, [connect, subscribeToGame, gameId]);

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
    setPlaced([...placed, { type: ship.type, cells, orientation, row, col, size: ship.size, img: ship.img }]);
    setCurrentShip(currentShip + 1);
    setHoverCells([]);
  };

  const cellColor = (row, col) => {
    if (hoverCells.some(c => c.row === row && c.col === col)) {
      return 'bg-cyan-500/40';
    }
    return 'bg-slate-700 hover:bg-slate-600';
  };

  const getShipStyle = (ship) => {
    const cellTotal = CELL_SIZE + GAP;
    const top = ship.row * cellTotal;
    const left = ship.col * cellTotal;

    if (ship.orientation === 'HORIZONTAL') {
      return {
        top: `${top}px`,
        left: `${left}px`,
        width: `${ship.size * cellTotal - GAP}px`,
        height: `${CELL_SIZE}px`,
      };
    } else {
      return {
        top: `${top}px`,
        left: `${left}px`,
        width: `${ship.size * cellTotal - GAP}px`,
        height: `${CELL_SIZE}px`,
        transform: 'rotate(90deg) translateY(-100%)',
        transformOrigin: 'top left',
      };
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <header className="w-full px-8 py-4 border-b border-slate-700 flex items-center justify-between">
        <h1 className="text-2xl font-black text-white tracking-wide">BATTLESHIP</h1>
        <span className="text-slate-400 text-sm">{username}</span>
      </header>

      {/* Conteúdo */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 flex flex-col items-center">
          <h2 className="text-white text-xl font-bold mb-2">Posicione seus navios</h2>

          {!allPlaced && (
            <p className="text-cyan-400 text-sm mb-4">
              {SHIPS[currentShip].name} ({SHIPS[currentShip].size} células)
            </p>
          )}

          {/* Controles */}
          <div className="mb-4 flex gap-3">
            <button
              onClick={() => setOrientation(o => o === 'HORIZONTAL' ? 'VERTICAL' : 'HORIZONTAL')}
              className="px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm font-bold tracking-wider hover:bg-slate-600 transition-colors"
            >
              ROTACIONAR ({orientation === 'HORIZONTAL' ? 'H' : 'V'})
            </button>
          </div>

          {/* Grid */}
          <div className="relative mb-6" onMouseLeave={() => setHoverCells([])}>
            <div className="grid grid-cols-10" style={{ gap: `${GAP}px` }}>
              {Array.from({ length: 100 }, (_, i) => {
                const row = Math.floor(i / 10);
                const col = i % 10;
                return (
                  <div
                    key={i}
                    style={{ width: `${CELL_SIZE}px`, height: `${CELL_SIZE}px` }}
                    className={`border border-slate-600 rounded-sm cursor-pointer transition-colors ${cellColor(row, col)}`}
                    onMouseEnter={() => handleHover(row, col)}
                    onClick={() => handleClick(row, col)}
                  />
                );
              })}
            </div>

            {/* Imagens dos navios */}
            {placed.map((ship) => (
              <img
                key={ship.type}
                src={ship.img}
                alt={ship.type}
                className="absolute pointer-events-none object-fill"
                style={getShipStyle(ship)}
              />
            ))}
          </div>

          {/* Ações */}
          {allPlaced && !ready && (
            <button
              onClick={() => setReady(true)}
              className="w-full max-w-xs py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 text-slate-900 font-black text-lg tracking-wide hover:from-cyan-400 hover:to-cyan-300 transition-all shadow-lg shadow-cyan-500/25"
            >
              PRONTO
            </button>
          )}

          {ready && (
            <div className="flex items-center gap-3">
              <div className="animate-spin w-5 h-5 border-3 border-cyan-500 border-t-transparent rounded-full"></div>
              <span className="text-slate-300 text-sm">Aguardando oponente...</span>
            </div>
          )}

          {/* Navios restantes */}
          {!allPlaced && (
            <div className="mt-4 flex flex-wrap gap-3 justify-center">
              {SHIPS.map((s, i) => (
                <div
                  key={s.type}
                  className={`px-3 py-1 rounded-lg text-xs font-bold tracking-wider ${i < currentShip ? 'bg-cyan-600/20 text-cyan-400 line-through opacity-50' : i === currentShip ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-slate-400'}`}
                >
                  {s.name} ({s.size})
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
