import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../hooks/useGame';
import { useSound } from '../hooks/useSound';
import { HiVolumeUp, HiVolumeOff } from 'react-icons/hi';
import ConnectionStatus from '../components/ConnectionStatus';
import ShipSelector from '../components/ShipSelector';
import BoardGrid, { GAP } from '../components/BoardGrid';
import WaitingScreen from '../components/WaitingScreen';
import PirateBackground from '../components/PirateBackground';
import UIPanel from '../components/UIPanel';
import PirateButton from '../components/PirateButton';

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

const SHIPS_PESCA = [
  { type: 'CARRIER', name: 'Porta-aviões', size: 5, img: '/ships/pesca/carrier_f.png' },
  { type: 'BATTLESHIP', name: 'Navio-tanque', size: 4, img: '/ships/pesca/battleship_f.png' },
  { type: 'CRUISER', name: 'Contratorpedeiro', size: 3, img: '/ships/pesca/cruiser_f.png' },
  { type: 'SUBMARINE', name: 'Submarino', size: 3, img: '/ships/pesca/submarine_f.png' },
  { type: 'DESTROYER', name: 'Destroyer', size: 2, img: '/ships/pesca/destroyer_f.png' },
];

const SHIPS_KITTY = [
  { type: 'CARRIER', name: 'Porta-aviões', size: 5, img: '/ships/kitty/carrier_hk.png' },
  { type: 'BATTLESHIP', name: 'Navio-tanque', size: 4, img: '/ships/kitty/battleship_hk.png' },
  { type: 'CRUISER', name: 'Contratorpedeiro', size: 3, img: '/ships/kitty/cruiser_hk.png' },
  { type: 'SUBMARINE', name: 'Submarino', size: 3, img: '/ships/kitty/submarine_hk.png' },
  { type: 'DESTROYER', name: 'Destroyer', size: 2, img: '/ships/kitty/destroyer_hk.png' },
];

const SKINS_MAP = {
  padrao_antigo: SHIPS_PADRAO_ANTIGO,
  pirate: SHIPS_PIRATE,
  padrao: SHIPS_PADRAO,
  pirate_op: SHIPS_PIRATE_OP,
  pesca: SHIPS_PESCA,
  kitty: SHIPS_KITTY,
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
  const { connect, connected, subscribeToGame, placeShip, gameState, resetGame, surrender, leaveGame, connectionStatus, reconnectInfo } = useGame(token);
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
    const heightScale = ship.size <= 2 ? 1.8 : ship.size <= 3 ? 1.3 : 1;
    const shipHeight = cellSize * heightScale;
    const topOffset = top - (shipHeight - cellSize) / 2;
    const shipLength = ship.size * cellTotal - GAP;

    if (ship.orientation === 'HORIZONTAL') {
      return {
        top: `${topOffset}px`,
        left: `${left}px`,
        width: `${shipLength}px`,
        height: `${shipHeight}px`,
      };
    } else {
      // Rotacionar 90° ao redor do centro do navio para manter alinhado às células
      const centerX = left + cellSize / 2;
      const centerY = top + shipLength / 2;
      const rotLeft = centerX - shipLength / 2;
      const rotTop = centerY - shipHeight / 2;
      return {
        top: `${rotTop}px`,
        left: `${rotLeft}px`,
        width: `${shipLength}px`,
        height: `${shipHeight}px`,
        transform: 'rotate(90deg)',
      };
    }
  };

  return (
    <PirateBackground>
      <div className="min-h-screen flex flex-col">
        <ConnectionStatus connectionStatus={connectionStatus} reconnectInfo={reconnectInfo} />

        {/* Header */}
        <header className="w-full px-4 sm:px-8 py-4 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <PirateButton
              onClick={() => { setLeaving(true); leaveGame(gameId); resetGame(); navigate('/lobby'); }}
              variant="wood"
              size="sm"
            >
              ← Lobby
            </PirateButton>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleMute}
              className="text-[#8B7355] hover:text-[#D5AE47] transition-colors text-xl p-1"
              title={muted ? 'Ativar som' : 'Silenciar'}
            >
              {muted ? <HiVolumeOff /> : <HiVolumeUp />}
            </button>
            <span className="text-[#C6AE78] text-sm font-['Cinzel',_serif]">{username}</span>
          </div>
        </header>

        {/* Conteúdo */}
        <div className="flex-1 flex items-center justify-center px-2 sm:px-4 py-4 sm:py-6">
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-center lg:items-start">

            {/* Painel de navios */}
            <ShipSelector
              ships={SHIPS}
              selectedShip={selectedShip}
              placedTypes={placed.map(p => p.type)}
              onSelectShip={handleSelectShip}
            />

            {/* Grid + controles */}
            <UIPanel variant="default" size="md" className="flex flex-col items-center">
              <h2 className="text-[#F4E2B6] text-base sm:text-lg font-bold tracking-wider mb-2 font-['Cinzel',_serif] text-shadow-warm">
                Posicione seus navios
              </h2>

              {selectedShip && (
                <p className="text-[#D5AE47] text-sm mb-4 font-['Cinzel',_serif]">
                  {getSelectedShipData()?.name} — {getSelectedShipData()?.size} células
                </p>
              )}

              {!selectedShip && !allPlaced && (
                <p className="text-[#8B7355] text-sm mb-4">Selecione um navio</p>
              )}

              {/* Controles */}
              <div className="mb-4 flex gap-3 flex-wrap justify-center">
                <PirateButton
                  onClick={() => setOrientation(o => o === 'HORIZONTAL' ? 'VERTICAL' : 'HORIZONTAL')}
                  variant="wood"
                  size="sm"
                >
                  Rotacionar
                </PirateButton>
                <span className="text-[#8B7355] text-xs self-center hidden sm:inline">ou botão direito</span>
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
                    hoverCells.some(c => c.row === row && c.col === col) ? 'bg-[#B98B2F]/30' : ''
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
                  {placed.map((ship) => (
                    <img
                      key={ship.type}
                      src={ship.img}
                      alt={ship.type}
                      className={`absolute pointer-events-none object-contain transition-opacity z-[2] ${selectedShip === ship.type ? 'opacity-40' : 'opacity-90'}`}
                      style={getShipStyle(ship)}
                    />
                  ))}
                </BoardGrid>
              </div>

              {/* Botão PRONTO */}
              {allPlaced && !sending && (
                <PirateButton onClick={handleReady} variant="gold" size="lg" fullWidth>
                  Pronto para Batalha
                </PirateButton>
              )}

              {sending && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d0b09]/85 backdrop-blur-sm">
                  <UIPanel variant="default" size="lg" className="max-w-sm mx-4 flex flex-col items-center gap-4">
                    <WaitingScreen description="Seus navios estão posicionados" />
                    <PirateButton
                      onClick={() => setSending(false)}
                      variant="wood"
                      size="sm"
                    >
                      ← Reposicionar navios
                    </PirateButton>
                  </UIPanel>
                </div>
              )}
            </UIPanel>
          </div>
        </div>
      </div>
    </PirateBackground>
  );
}
