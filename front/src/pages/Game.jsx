import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../hooks/useGame';
import ConnectionStatus from '../components/ConnectionStatus';
import TurnIndicator from '../components/TurnIndicator';
import EmotePanel from '../components/EmotePanel';

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
  'from-[#0a1a2e] to-[#0f2640]',
  'from-[#081422] to-[#0c1e35]',
  'from-[#0b1828] to-[#0e2238]',
];

function getOceanClass(row, col, cell, isSunkCell = false) {
  if (cell === 'HIT' && isSunkCell) return 'bg-[#8b1a1a]/50';
  if (cell === 'HIT') return 'bg-[#c45a2a]/35';
  if (cell === 'MISS') return 'bg-[#5a5048]/60';
  const variant = (row + col) % 3;
  return `bg-gradient-to-br ${OCEAN_COLORS[variant]}`;
}

const SKINS = {
  padrao: [
    { type: 'CARRIER', name: 'Porta-aviões', size: 5, img: '/ships/padrao_antigo/carrier_antigo.png' },
    { type: 'BATTLESHIP', name: 'Navio-tanque', size: 4, img: '/ships/padrao_antigo/battleship_antigo.png' },
    { type: 'CRUISER', name: 'Contratorpedeiro', size: 3, img: '/ships/padrao_antigo/cruiser_antigo.png' },
    { type: 'SUBMARINE', name: 'Submarino', size: 3, img: '/ships/padrao_antigo/submarine_antigo.png' },
    { type: 'DESTROYER', name: 'Destroyer', size: 2, img: '/ships/padrao_antigo/destroyer_antigo.png' },
  ],
  pirate: [
    { type: 'CARRIER', name: 'Porta-aviões', size: 5, img: '/ships/pirate/carrier_pirate.png' },
    { type: 'BATTLESHIP', name: 'Navio-tanque', size: 4, img: '/ships/pirate/battleship_pirate.png' },
    { type: 'CRUISER', name: 'Contratorpedeiro', size: 3, img: '/ships/pirate/cruiser_pirate.png' },
    { type: 'SUBMARINE', name: 'Submarino', size: 3, img: '/ships/pirate/submarine_pirate.png' },
    { type: 'DESTROYER', name: 'Destroyer', size: 2, img: '/ships/pirate/destroyer_pirate.png' },
  ],
};

function detectShips(board) {
  if (!board) return [];
  const visited = Array.from({ length: 10 }, () => Array(10).fill(false));
  const ships = [];
  // Tamanhos válidos de navios no jogo
  const validSizes = [5, 4, 3, 3, 2];
  const remainingSizes = [...validSizes];

  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      if (visited[r][c]) continue;
      if (board[r][c] !== 'SHIP' && board[r][c] !== 'HIT') continue;

      // Tentar expandir horizontalmente
      let hLen = 0;
      while (c + hLen < 10 && (board[r][c + hLen] === 'SHIP' || board[r][c + hLen] === 'HIT') && !visited[r][c + hLen]) {
        hLen++;
      }

      // Tentar expandir verticalmente
      let vLen = 0;
      while (r + vLen < 10 && (board[r + vLen][c] === 'SHIP' || board[r + vLen][c] === 'HIT') && !visited[r + vLen][c]) {
        vLen++;
      }

      let chosenLen, orientation;
      if (hLen >= 2 && hLen >= vLen) {
        chosenLen = hLen;
        orientation = 'HORIZONTAL';
      } else if (vLen >= 2) {
        chosenLen = vLen;
        orientation = 'VERTICAL';
      } else {
        visited[r][c] = true;
        ships.push({ row: r, col: c, size: 1, orientation: 'HORIZONTAL' });
        continue;
      }

      // Se o comprimento detectado é maior que o maior tamanho restante,
      // significa que dois navios estão adjacentes. Usar o melhor match.
      let bestSize = chosenLen;
      const sizeIdx = remainingSizes.indexOf(chosenLen);
      if (sizeIdx === -1) {
        // Tamanho exato não disponível — encontrar o maior tamanho restante que cabe
        const sorted = [...remainingSizes].sort((a, b) => b - a);
        bestSize = sorted.find(s => s <= chosenLen) || chosenLen;
      }

      // Marcar células e registrar navio com bestSize
      if (orientation === 'HORIZONTAL') {
        for (let i = 0; i < bestSize; i++) visited[r][c + i] = true;
      } else {
        for (let i = 0; i < bestSize; i++) visited[r + i][c] = true;
      }
      ships.push({ row: r, col: c, size: bestSize, orientation });

      // Remover o tamanho usado da lista
      const removeIdx = remainingSizes.indexOf(bestSize);
      if (removeIdx !== -1) remainingSizes.splice(removeIdx, 1);
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
    .filter(s => s.size >= 2)
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
        <div className="bg-[#2a1f15] border border-[#3d2a1a]/40 rounded-lg p-4 w-full">
          <h3 className="text-[#c4b28a] text-xs font-medium tracking-wider uppercase mb-3 font-[MedievalSharp] text-center">{title}</h3>
          <div className="flex flex-wrap gap-2 justify-center">
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
                {ship.sunk && <span className="text-[#8b1a1a] text-sm font-bold ml-1">✕</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`hidden xl:flex flex-col gap-4 justify-center ${align === 'right' ? 'items-end' : 'items-start'}`} style={{ width: `${maxWidth + 32}px`, alignSelf: 'stretch' }}>
      <div className="bg-[#2a1f15] border border-[#3d2a1a]/40 rounded-lg p-4 flex flex-col gap-4 w-full">
        <h3 className="text-[#c4b28a] text-xs font-medium tracking-wider uppercase font-[MedievalSharp]">{title}</h3>
        <div className="flex flex-col gap-4 items-center">
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
            {ship.sunk && <span className="text-[#8b1a1a] text-sm font-bold ml-2">✕</span>}
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}

function MyBoard({ board, skinShips, cellSize }) {
  if (!board) return null;
  const detected = detectShips(board);
  const ships = assignShipData(detected, board, skinShips);

  // Computar células de navios afundados
  const sunkCells = new Set();
  for (const ship of ships) {
    if (ship.sunk) {
      for (let i = 0; i < ship.size; i++) {
        const r = ship.orientation === 'VERTICAL' ? ship.row + i : ship.row;
        const c = ship.orientation === 'HORIZONTAL' ? ship.col + i : ship.col;
        sunkCells.add(`${r},${c}`);
      }
    }
  }

  return (
    <div className="relative overflow-hidden rounded-md">
      {/* Peixes animados no fundo */}
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
          const isSunk = sunkCells.has(`${row},${col}`);
          const oceanClass = getOceanClass(row, col, cell, isSunk);
          return (
            <div
              key={i}
              style={{ width: `${cellSize}px`, height: `${cellSize}px` }}
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

function detectShipsFromHits(board) {
  if (!board) return [];
  const visited = Array.from({ length: 10 }, () => Array(10).fill(false));
  const ships = [];

  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      if (visited[r][c]) continue;
      if (board[r][c] !== 'HIT') continue;

      let hLen = 0;
      while (c + hLen < 10 && board[r][c + hLen] === 'HIT' && !visited[r][c + hLen]) {
        hLen++;
      }

      let vLen = 0;
      while (r + vLen < 10 && board[r + vLen][c] === 'HIT' && !visited[r + vLen][c]) {
        vLen++;
      }

      if (hLen >= 2 && hLen >= vLen) {
        for (let i = 0; i < hLen; i++) visited[r][c + i] = true;
        ships.push({ row: r, col: c, size: hLen, orientation: 'HORIZONTAL' });
      } else if (vLen >= 2) {
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

function OpponentBoard({ board, onClick, active, cellSize, revealed, skinShips, sunkShipTypes, sunkCellsSet }) {
  if (!board) return null;

  const ships = revealed ? assignShipData(detectShips(board), board, skinShips) : [];

  // Usar coordenadas exatas vindas do backend (acumuladas no state pai)
  const sunkCells = sunkCellsSet || new Set();

  return (
    <div className={`relative overflow-hidden rounded-md ${active ? 'ring-2 ring-[#c4983c]/50' : ''}`}>
      {/* Peixes animados no fundo */}
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
          const isSunk = sunkCells.has(`${row},${col}`);
          const oceanClass = getOceanClass(row, col, cell, isSunk);
          const hover = active && cell === 'EMPTY' ? 'hover:bg-[#8b1a1a]/40' : '';
          return (
            <div
              key={i}
              style={{ width: `${cellSize}px`, height: `${cellSize}px` }}
              className={`rounded-sm ${active ? 'cursor-crosshair' : 'cursor-default'} ${oceanClass} ${hover} transition-colors`}
              onClick={() => onClick?.(row, col)}
            />
          );
        })}
      </div>

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
  const { connect, subscribeToGame, gameState, shoot, sendEmote, emote, resetGame, surrender, connectionStatus, reconnectInfo } = useGame(token);
  const [sunkOpponentShips, setSunkOpponentShips] = useState([]);
  const [sunkOpponentCells, setSunkOpponentCells] = useState(new Set());
  const [gameFinished, setGameFinished] = useState(false);
  const [showSurrenderConfirm, setShowSurrenderConfirm] = useState(false);
  const cellSize = useResponsiveCellSize();

  useEffect(() => {
    connect().then(() => subscribeToGame(gameId));
  }, [connect, subscribeToGame, gameId]);

  useEffect(() => {
    if (gameState?.phase === 'FINISHED' && !gameFinished) {
      setGameFinished(true);
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
      // Acumular coordenadas exatas do navio afundado (vindas do backend)
      if (gameState.sunkShipCells && gameState.sunkShipCells.length > 0) {
        setSunkOpponentCells(prev => {
          const next = new Set(prev);
          for (const cell of gameState.sunkShipCells) {
            next.add(`${cell[0]},${cell[1]}`);
          }
          return next;
        });
      }
    }
  }, [gameState, navigate, gameFinished]);

  const handleShoot = (row, col) => {
    if (!gameState?.myTurn) return;
    const cell = gameState.opponentBoard[row][col];
    if (cell === 'HIT' || cell === 'MISS') return;
    shoot(gameId, row, col);
  };

  const handleSurrender = () => {
    surrender(gameId);
    resetGame();
    navigate('/lobby');
  };

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
    <div className="min-h-screen bg-[#211a14] flex flex-col">
      <ConnectionStatus connectionStatus={connectionStatus} reconnectInfo={reconnectInfo} />
      <header className="w-full px-4 sm:px-8 py-5 border-b border-[#3d2a1a]/30 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {!gameFinished && (
            <div className="relative">
              {!showSurrenderConfirm ? (
                <button
                  onClick={() => setShowSurrenderConfirm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#8b1a1a]/50 text-[#c45a4a] text-xs font-medium tracking-wider hover:bg-[#8b1a1a]/20 hover:border-[#8b1a1a] transition-colors"
                >
                  <span>🏳️</span> Desistir
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-[#c45a4a] text-xs font-medium">Tem certeza?</span>
                  <button
                    onClick={handleSurrender}
                    className="px-3 py-1.5 rounded-md bg-[#8b1a1a] text-[#e8d5b0] text-xs font-bold tracking-wider hover:bg-[#a52020] transition-colors"
                  >
                    Sim
                  </button>
                  <button
                    onClick={() => setShowSurrenderConfirm(false)}
                    className="px-3 py-1.5 rounded-md border border-[#3d2a1a]/60 text-[#c4b28a] text-xs font-medium hover:text-[#e8d5b0] transition-colors"
                  >
                    Não
                  </button>
                </div>
              )}
            </div>
          )}
          <h1 className="text-2xl font-bold text-[#c4983c] tracking-[0.15em] uppercase font-[MedievalSharp]">Batalha Naval</h1>
        </div>
        <span className="text-[#5a5048] text-sm">{username}</span>
      </header>

      <TurnIndicator gameFinished={gameFinished} gameState={gameState} username={username} />

      <div className="flex-1 flex items-center justify-center px-2 sm:px-4 pb-20">
        <div className="flex flex-col xl:flex-row items-center xl:items-stretch gap-6">
          {/* Desktop ship list - left */}
          <ShipList ships={myShipsStatus} title="Minha Frota" align="left" mobile={false} />

          <div className="flex flex-col items-center gap-4">
            {/* Boards */}
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 items-center lg:items-start">
              <div className="relative overflow-visible">
                <div className="bg-[#2a1f15] border border-[#3d2a1a]/40 rounded-lg p-3 sm:p-6 relative z-10">
                  <h2 className="text-center text-[#c4b28a]/50 text-xs font-medium tracking-wider mb-3 uppercase font-[MedievalSharp]">Meu Tabuleiro</h2>
                  <MyBoard board={gameState?.myBoard} skinShips={mySkinShips} cellSize={cellSize} />
                </div>
              </div>
              <div className="relative overflow-visible">
                <div className="bg-[#2a1f15] border border-[#3d2a1a]/40 rounded-lg p-3 sm:p-6 relative z-10">
                  <h2 className="text-center text-[#c4b28a]/50 text-xs font-medium tracking-wider mb-3 uppercase font-[MedievalSharp]">Oponente</h2>
                  <OpponentBoard board={gameState?.opponentBoard} onClick={handleShoot} active={gameState?.myTurn && !gameFinished} cellSize={cellSize} revealed={gameFinished} skinShips={opponentSkinShips} sunkShipTypes={sunkOpponentShips} sunkCellsSet={sunkOpponentCells} />
                </div>
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

      <EmotePanel onSendEmote={(e) => sendEmote(gameId, e)} receivedEmote={emote} />
    </div>
  );
}
