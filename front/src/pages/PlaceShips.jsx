import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../hooks/useGame';
import { useSound } from '../hooks/useSound';
import ConnectionStatus from '../components/ConnectionStatus';
import ShipSelector from '../components/ShipSelector';
import BoardGrid, { GAP } from '../components/BoardGrid';
import WaitingScreen from '../components/WaitingScreen';

const SHIPS_PADRAO_ANTIGO = [
  { type: 'CARRIER', name: 'Porta-aviões', size: 5, img: '/ships/padrao_antigo/carrier_antigo.png' },
  { type: 'BATTLESHIP', name: 'Navio-tanque', size: 4, img: '/ships/padrao_antigo/battleship_antigo.png' },
  { type: 'CRUISER', name: 'Contratorpedeiro', size: 3, img: '/ships/padrao_antigo/cruiser_antigo.png' },
  { type: 'SUBMARINE', name: 'Submarino', size: 3, img: '/ships/padrao_antigo/submarine_antigo.png' },
  { type: 'DESTROYER', name: 'Destroyer', size: 2, img: '/ships/padrao_antigo/destroyer_antigo.png' },
];

const SHIPS_PIRATE = [
  { type: 'CARRIER', name: 'Porta-aviões', size: 5, img: '/ships/pirate/carrier_pirate.png' },
  { type: 'BATTLESHIP', name: 'Navio-tanque', size: 4, img: '/ships/pirate/battleship_pirate.png' },
  { type: 'CRUISER', name: 'Contratorpedeiro', size: 3, img: '/ships/pirate/cruiser_pirate.png' },
  { type: 'SUBMARINE', name: 'Submarino', size: 3, img: '/ships/pirate/submarine_pirate.png' },
  { type: 'DESTROYER', name: 'Destroyer', size: 2, img: '/ships/pirate/destroyer_pirate.png' },
];

const SHIPS_PADRAO = [
  { type: 'CARRIER', name: 'Porta-aviões', size: 5, img: '/ships/padrao/carrier.png' },
  { type: 'BATTLESHIP', name: 'Navio-tanque', size: 4, img: '/ships/padrao/battleship.png' },
  { type: 'CRUISER', name: 'Contratorpedeiro', size: 3, img: '/ships/padrao/cruiser.png' },
  { type: 'SUBMARINE', name: 'Submarino', size: 3, img: '/ships/padrao/submarine.png' },
  { type: 'DESTROYER', name: 'Destroyer', size: 2, img: '/ships/padrao/destroyer.png' },
];

const SHIPS_PIRATE_OP = [
  { type: 'CARRIER', name: 'Porta-aviões', size: 5, img: '/ships/pirate_op/carrier_pirate_op.png' },
  { type: 'BATTLESHIP', name: 'Navio-tanque', size: 4, img: '/ships/pirate_op/battleship_pirate_op.png' },
  { type: 'CRUISER', name: 'Contratorpedeiro', size: 3, img: '/ships/pirate_op/cruiser_pirate_op.png' },
  { type: 'SUBMARINE', name: 'Submarino', size: 3, img: '/ships/pirate_op/submarine_pirate_op.png' },
  { type: 'DESTROYER', name: 'Destroyer', size: 2, img: '/ships/pirate_op/destroyer_pirate_op.png' },
];

const SKINS_MAP = {
  padrao_antigo: SHIPS_PADRAO_ANTIGO,
  pirate: SHIPS_PIRATE,
  padrao: SHIPS_PADRAO,
  pirate_op: SHIPS_PIRATE_OP,
};

const CELL_SIZE_DESKTOP = 40;
const CELL_SIZE_MOBILE = 32;

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

export default function PlaceShips() {
  const { gameId } = useParams();
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');
  const navigate = useNavigate();
  const { connect, connected, subscribeToGame, placeShip, gameState, resetGame, surrender, connectionStatus, reconnectInfo } = useGame(token);
  const { play, toggleMute, muted } = useSound();
  const cellSize = useResponsiveCellSize();

  const [orientation, setOrientation] = useState('HORIZONTAL');
  const [selectedShip, setSelectedShip] = useState(null);
  const [placed, setPlaced] = useState([]);
  const [hoverCells, setHoverCells] = useState([]);
  const [hoverPos, setHoverPos] = useState(null);
  const [sending, setSending] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const mySkin = gameState?.mySkin || 'padrao_antigo';
  const SHIPS = SKINS_MAP[mySkin] || SHIPS_PADRAO_ANTIGO;
  const allPlaced = placed.length === SHIPS.length;

  useEffect(() => {
    connect().then(() => subscribeToGame(gameId));
  }, [connect, subscribeToGame, gameId]);

  useEffect(() => {
    if (leaving) return;
    if (gameState?.phase === 'IN_PROGRESS') {
      navigate(`/game/${gameId}`);
    }
  }, [gameState, gameId, navigate, leaving]);

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
    play('click');

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

  const handleSelectShip = (type) => {
    setSelectedShip(type);
    setHoverCells([]);
  };

  const handleReady = async () => {
    play('click');
    setSending(true);
    for (const ship of placed) {
      placeShip(gameId, ship.type, ship.row, ship.col, ship.orientation);
      await new Promise(r => setTimeout(r, 100));
    }
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

  return (
    <div className="min-h-screen bg-[#211a14] flex flex-col">
      <ConnectionStatus connectionStatus={connectionStatus} reconnectInfo={reconnectInfo} />
      {/* Header */}
      <header className="w-full px-4 sm:px-8 py-5 border-b border-[#3d2a1a]/30 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => { setLeaving(true); resetGame(); navigate('/lobby'); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#3d2a1a]/60 text-[#c4b28a] text-xs font-medium tracking-wider hover:border-[#c4983c]/60 hover:text-[#c4983c] transition-colors"
          >
            <span>←</span> Lobby
          </button>
          <h1 className="text-2xl font-bold text-[#c4983c] tracking-[0.15em] uppercase font-[MedievalSharp]">Batalha Naval</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleMute}
            className="text-[#5a5048] hover:text-[#c4983c] transition-colors text-lg"
            title={muted ? 'Ativar som' : 'Silenciar'}
          >
            {muted ? '🔇' : '🔊'}
          </button>
          <span className="text-[#5a5048] text-sm">{username}</span>
        </div>
      </header>

      {/* Conteúdo */}
      <div className="flex-1 flex items-center justify-center px-2 sm:px-4 py-4 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 items-center lg:items-start">

          {/* Painel de navios */}
          <ShipSelector
            ships={SHIPS}
            selectedShip={selectedShip}
            placedTypes={placed.map(p => p.type)}
            onSelectShip={handleSelectShip}
          />

          {/* Grid + controles */}
          <div className="bg-[#2a1f15] border border-[#3d2a1a]/40 rounded-lg p-4 sm:p-8 flex flex-col items-center">
            <h2 className="text-[#e8d5b0] text-base sm:text-lg font-medium tracking-wide mb-2 font-[MedievalSharp]">Posicione seus navios</h2>

            {selectedShip && (
              <p className="text-[#c4983c]/80 text-sm mb-4">
                {getSelectedShipData()?.name} — {getSelectedShipData()?.size} células
              </p>
            )}

            {!selectedShip && !allPlaced && (
              <p className="text-[#5a5048] text-sm mb-4">Selecione um navio acima</p>
            )}

            {/* Controles */}
            <div className="mb-4 flex gap-3 flex-wrap justify-center">
              <button
                onClick={() => setOrientation(o => o === 'HORIZONTAL' ? 'VERTICAL' : 'HORIZONTAL')}
                className="px-4 py-2 rounded-md border border-[#3d2a1a]/60 text-[#c4b28a] text-xs font-medium tracking-wider hover:border-[#c4983c]/60 hover:text-[#c4983c] transition-colors"
              >
                Rotacionar ({orientation === 'HORIZONTAL' ? 'H' : 'V'})
              </button>
              <span className="text-[#5a5048] text-xs self-center hidden sm:inline">ou botão direito</span>
            </div>

            {/* Grid */}
            <div
              className="mb-6"
              onContextMenu={(e) => {
                e.preventDefault();
                if (selectedShip) {
                  setOrientation(o => o === 'HORIZONTAL' ? 'VERTICAL' : 'HORIZONTAL');
                }
              }}
            >
              <BoardGrid
                cellSize={cellSize}
                onCellClick={handleClick}
                onCellHover={handleHover}
                onMouseLeave={() => { setHoverCells([]); setHoverPos(null); }}
                getCellClass={(row, col) =>
                  hoverCells.some(c => c.row === row && c.col === col) ? 'bg-[#c4983c]/25' : ''
                }
                backgroundChildren={
                  <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                    <img src="/fish/left/fish4.png" alt="" className="absolute top-[15%] h-9 opacity-[0.14] animate-[swim-left_16s_linear_infinite]" />
                    <img src="/fish/right/fish2.png" alt="" className="absolute top-[38%] h-6 opacity-[0.17] animate-[swim-right_19s_linear_infinite] [animation-delay:4s]" />
                    <img src="/fish/left/fish3.png" alt="" className="absolute top-[55%] h-7 opacity-[0.15] animate-[swim-left_14s_linear_infinite] [animation-delay:8s]" />
                    <img src="/fish/right/fish1.png" alt="" className="absolute top-[72%] h-10 opacity-[0.12] animate-[swim-right_23s_linear_infinite] [animation-delay:12s]" />
                    <img src="/fish/left/fish2.png" alt="" className="absolute top-[90%] h-5 opacity-[0.16] animate-[swim-left_26s_linear_infinite] [animation-delay:17s]" />
                  </div>
                }
              >
                {/* Imagens dos navios posicionados */}
                {placed.map((ship) => (
                  <img
                    key={ship.type}
                    src={ship.img}
                    alt={ship.type}
                    className={`absolute pointer-events-none object-fill transition-opacity z-[2] ${selectedShip === ship.type ? 'opacity-40' : 'opacity-90'}`}
                    style={getShipStyle(ship)}
                  />
                ))}
              </BoardGrid>
            </div>

            {/* Botão PRONTO */}
            {allPlaced && !sending && (
              <button
                onClick={handleReady}
                className="w-full max-w-xs py-3.5 rounded-md bg-[#8b6914] text-[#211a14] text-sm font-bold tracking-wider uppercase hover:bg-[#c4983c] transition-colors font-[MedievalSharp]"
              >
                Pronto
              </button>
            )}

            {sending && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d0b09]/80 backdrop-blur-sm">
                <div className="bg-[#2a1f15] border border-[#3d2a1a]/60 rounded-lg p-8 flex flex-col items-center gap-6 max-w-sm mx-4 shadow-2xl">
                  <WaitingScreen
                    description="Seus navios estão posicionados"
                  />
                  <button
                    onClick={() => setSending(false)}
                    className="px-6 py-2.5 rounded-md border border-[#3d2a1a]/60 text-[#c4b28a] text-xs font-bold tracking-wider uppercase hover:border-[#c4983c]/60 hover:text-[#c4983c] transition-colors font-[MedievalSharp]"
                  >
                    ← Reposicionar navios
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
