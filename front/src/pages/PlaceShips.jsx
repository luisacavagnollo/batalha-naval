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

const CELL_SIZE_DESKTOP = 40;
const CELL_SIZE_MOBILE = 32;
const GAP = 2;

function useResponsiveCellSize() {
  const [cellSize, setCellSize] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < 768 ? CELL_SIZE_MOBILE : CELL_SIZE_DESKTOP
  );

  useEffect(() => {
    const handleResize = () => {
      setCellSize(window.innerWidth < 768 ? CELL_SIZE_MOBILE : CELL_SIZE_DESKTOP);
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

export default function PlaceShips() {
  const { gameId } = useParams();
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');
  const navigate = useNavigate();
  const { connect, connected, subscribeToGame, placeShip, gameState } = useGame(token);
  const cellSize = useResponsiveCellSize();

  const [orientation, setOrientation] = useState('HORIZONTAL');
  const [selectedShip, setSelectedShip] = useState(null);
  const [placed, setPlaced] = useState([]);
  const [hoverCells, setHoverCells] = useState([]);
  const [hoverPos, setHoverPos] = useState(null);
  const [sending, setSending] = useState(false);

  const mySkin = gameState?.mySkin || 'padrao';
  const SHIPS = mySkin === 'pirate' ? SHIPS_PIRATE : SHIPS_PADRAO;
  const allPlaced = placed.length === SHIPS.length;

  useEffect(() => {
    connect().then(() => subscribeToGame(gameId));
  }, [connect, subscribeToGame, gameId]);

  useEffect(() => {
    if (gameState?.phase === 'IN_PROGRESS') {
      navigate(`/game/${gameId}`);
    }
  }, [gameState, gameId, navigate]);

  // Selecionar primeiro navio automaticamente
  useEffect(() => {
    if (selectedShip === null && SHIPS.length > 0 && placed.length === 0) {
      setSelectedShip(SHIPS[0].type);
    }
  }, [SHIPS]);

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

  const isOccupied = (cells, excludeType) => {
    return cells.some(cell =>
      placed.some(p => p.type !== excludeType && p.cells.some(c => c.row === cell.row && c.col === cell.col))
    );
  };

  const getSelectedShipData = () => SHIPS.find(s => s.type === selectedShip);

  const handleHover = (row, col) => {
    setHoverPos({ row, col });
    if (!selectedShip) { setHoverCells([]); return; }
    const shipData = getSelectedShipData();
    if (!shipData) { setHoverCells([]); return; }
    const cells = getCells(row, col, shipData.size, orientation);
    if (!cells || isOccupied(cells, selectedShip)) { setHoverCells([]); return; }
    setHoverCells(cells);
  };

  // Recalcula hover ao mudar orientação
  useEffect(() => {
    if (!hoverPos || !selectedShip) return;
    const shipData = getSelectedShipData();
    if (!shipData) return;
    const cells = getCells(hoverPos.row, hoverPos.col, shipData.size, orientation);
    if (!cells || isOccupied(cells, selectedShip)) { setHoverCells([]); return; }
    setHoverCells(cells);
  }, [orientation, selectedShip]);

  const handleClick = (row, col) => {
    if (!selectedShip) return;
    const shipData = getSelectedShipData();
    if (!shipData) return;
    const cells = getCells(row, col, shipData.size, orientation);
    if (!cells || isOccupied(cells, selectedShip)) return;

    // Remove posição anterior se já estava colocado
    const newPlaced = placed.filter(p => p.type !== selectedShip);
    newPlaced.push({
      type: shipData.type,
      cells,
      orientation,
      row,
      col,
      size: shipData.size,
      img: shipData.img,
      name: shipData.name,
    });
    setPlaced(newPlaced);

    // Selecionar próximo navio não posicionado automaticamente
    const placedTypes = newPlaced.map(p => p.type);
    const nextShip = SHIPS.find(s => !placedTypes.includes(s.type));
    setSelectedShip(nextShip ? nextShip.type : null);
    setHoverCells([]);
  };

  // Clicar no nome de um navio já posicionado para reposicioná-lo
  const handleSelectShip = (type) => {
    setSelectedShip(type);
    setHoverCells([]);
  };

  // Enviar todos os navios ao backend
  const handleReady = async () => {
    setSending(true);
    for (const ship of placed) {
      placeShip(gameId, ship.type, ship.row, ship.col, ship.orientation);
      // Pequeno delay para garantir ordem
      await new Promise(r => setTimeout(r, 100));
    }
  };

  const cellColor = (row, col) => {
    if (hoverCells.some(c => c.row === row && c.col === col)) {
      return 'bg-cyan-400/30';
    }
    const variant = (row + col) % 3;
    return `bg-gradient-to-br ${OCEAN_COLORS[variant]}`;
  };

  const getShipStyle = (ship) => {
    const cellTotal = cellSize + GAP;
    const top = ship.row * cellTotal;
    const left = ship.col * cellTotal;

    if (ship.orientation === 'HORIZONTAL') {
      return {
        top: `${top}px`,
        left: `${left}px`,
        width: `${ship.size * cellTotal - GAP}px`,
        height: `${cellSize}px`,
      };
    } else {
      return {
        top: `${top}px`,
        left: `${left}px`,
        width: `${ship.size * cellTotal - GAP}px`,
        height: `${cellSize}px`,
        transform: 'rotate(90deg) translateY(-100%)',
        transformOrigin: 'top left',
      };
    }
  };

  const isPlaced = (type) => placed.some(p => p.type === type);

  return (
    <div className="min-h-screen bg-[#0a1a12] flex flex-col">
      {/* Header */}
      <header className="w-full px-4 sm:px-8 py-5 border-b border-emerald-900/40 flex items-center justify-between">
        <h1 className="text-xl font-black text-white tracking-widest uppercase">Battleship</h1>
        <span className="text-slate-500 text-sm">{username}</span>
      </header>

      {/* Conteúdo */}
      <div className="flex-1 flex items-center justify-center px-2 sm:px-4 py-4 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 items-center lg:items-start">

          {/* Painel de navios */}
          <div className="bg-[#0f2518] border border-emerald-900/30 rounded-xl p-4 sm:p-6 flex flex-col gap-3 sm:gap-4 w-full max-w-sm lg:w-64">
            <h3 className="text-slate-500 text-xs font-medium tracking-wider uppercase">Seus navios</h3>
            <div className="flex flex-row flex-wrap lg:flex-col gap-2 sm:gap-3">
              {SHIPS.map((ship) => {
                const placedOnBoard = isPlaced(ship.type);
                const isSelected = selectedShip === ship.type;
                return (
                  <button
                    key={ship.type}
                    onClick={() => handleSelectShip(ship.type)}
                    className={`flex flex-col items-start gap-1 p-2 sm:p-3 rounded-xl border transition-all flex-1 lg:flex-none min-w-[120px]
                      ${isSelected ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-600 hover:border-slate-500 bg-slate-700/50'}
                      ${placedOnBoard && !isSelected ? 'opacity-60' : 'opacity-100'}
                    `}
                  >
                    {!placedOnBoard ? (
                      <img
                        src={ship.img}
                        alt={ship.name}
                        className="object-contain"
                        style={{ width: `${ship.size * 30}px`, height: '28px' }}
                      />
                    ) : (
                      <span className="text-emerald-400 text-sm font-semibold">
                        ✓ No tabuleiro
                      </span>
                    )}
                    <span className="text-slate-300 text-xs font-bold">
                      {ship.name} ({ship.size})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grid + controles */}
          <div className="bg-[#0f2518] border border-emerald-900/30 rounded-xl p-4 sm:p-8 flex flex-col items-center">
            <h2 className="text-white text-base sm:text-lg font-medium tracking-wide mb-2">Posicione seus navios</h2>

            {selectedShip && (
              <p className="text-emerald-400/80 text-sm mb-4">
                {getSelectedShipData()?.name} — {getSelectedShipData()?.size} células
              </p>
            )}

            {!selectedShip && !allPlaced && (
              <p className="text-slate-500 text-sm mb-4">Selecione um navio acima</p>
            )}

            {/* Controles */}
            <div className="mb-4 flex gap-3 flex-wrap justify-center">
              <button
                onClick={() => setOrientation(o => o === 'HORIZONTAL' ? 'VERTICAL' : 'HORIZONTAL')}
                className="px-4 py-2 rounded-lg border border-emerald-900/50 text-slate-300 text-xs font-medium tracking-wider hover:border-emerald-700 hover:text-white transition-colors"
              >
                Rotacionar ({orientation === 'HORIZONTAL' ? 'H' : 'V'})
              </button>
              <span className="text-slate-600 text-xs self-center hidden sm:inline">ou botão direito</span>
            </div>

            {/* Grid */}
            <div
              className="relative mb-6 overflow-hidden rounded-lg"
              onMouseLeave={() => { setHoverCells([]); setHoverPos(null); }}
              onContextMenu={(e) => {
                e.preventDefault();
                if (selectedShip) {
                  setOrientation(o => o === 'HORIZONTAL' ? 'VERTICAL' : 'HORIZONTAL');
                }
              }}
            >
              {/* Sombras de peixes no fundo */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <img src="/fish/left/fish4.png" alt="" className="absolute top-[15%] h-9 opacity-[0.14] animate-[swim-left_16s_linear_infinite]" />
                <img src="/fish/right/fish2.png" alt="" className="absolute top-[38%] h-6 opacity-[0.17] animate-[swim-right_19s_linear_infinite] [animation-delay:4s]" />
                <img src="/fish/left/fish3.png" alt="" className="absolute top-[55%] h-7 opacity-[0.15] animate-[swim-left_14s_linear_infinite] [animation-delay:8s]" />
                <img src="/fish/right/fish1.png" alt="" className="absolute top-[72%] h-10 opacity-[0.12] animate-[swim-right_23s_linear_infinite] [animation-delay:12s]" />
                <img src="/fish/left/fish2.png" alt="" className="absolute top-[90%] h-5 opacity-[0.16] animate-[swim-left_26s_linear_infinite] [animation-delay:17s]" />
              </div>

              <div className="grid grid-cols-10" style={{ rowGap: `${GAP}px`, columnGap: `${GAP}px`, width: `${cellSize * 10 + GAP * 9}px` }}>
                {Array.from({ length: 100 }, (_, i) => {
                  const row = Math.floor(i / 10);
                  const col = i % 10;
                  return (
                    <div
                      key={i}
                      style={{ width: `${cellSize}px`, height: `${cellSize}px` }}
                      className={`rounded-sm cursor-pointer transition-colors ${cellColor(row, col)}`}
                      onMouseEnter={() => handleHover(row, col)}
                      onClick={() => handleClick(row, col)}
                    />
                  );
                })}
              </div>

              {/* Imagens dos navios posicionados */}
              {placed.map((ship) => (
                <img
                  key={ship.type}
                  src={ship.img}
                  alt={ship.type}
                  className={`absolute pointer-events-none object-fill transition-opacity ${selectedShip === ship.type ? 'opacity-40' : 'opacity-90'}`}
                  style={getShipStyle(ship)}
                />
              ))}
            </div>

            {/* Botão PRONTO */}
            {allPlaced && !sending && (
              <button
                onClick={handleReady}
                className="w-full max-w-xs py-3.5 rounded-lg bg-emerald-800 text-white text-sm font-bold tracking-wider uppercase hover:bg-emerald-700 transition-colors"
              >
                Pronto
              </button>
            )}

            {sending && (
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-slate-400 text-sm">Aguardando oponente...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
