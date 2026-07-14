import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../hooks/useGame';
import { useSound } from '../hooks/useSound';
import { useResponsiveCellSize } from '../hooks/useResponsiveCellSize';
import { HiVolumeUp, HiVolumeOff } from 'react-icons/hi';
import ConnectionStatus from '../components/ConnectionStatus';
import TurnIndicator from '../components/TurnIndicator';
import EmotePanel from '../components/EmotePanel';
import PirateBackground from '../components/PirateBackground';
import UIPanel from '../components/UIPanel';
import PirateButton from '../components/PirateButton';

const GAP = 2;

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
  padrao_antigo: [
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
  padrao: [
    { type: 'CARRIER', name: 'Porta-aviões', size: 5, img: '/ships/padrao/carrier.png' },
    { type: 'BATTLESHIP', name: 'Navio-tanque', size: 4, img: '/ships/padrao/battleship.png' },
    { type: 'CRUISER', name: 'Contratorpedeiro', size: 3, img: '/ships/padrao/cruiser.png' },
    { type: 'SUBMARINE', name: 'Submarino', size: 3, img: '/ships/padrao/submarine.png' },
    { type: 'DESTROYER', name: 'Destroyer', size: 2, img: '/ships/padrao/destroyer.png' },
  ],
  pirate_op: [
    { type: 'CARRIER', name: 'Porta-aviões', size: 5, img: '/ships/pirate_op/carrier_pirate_op.png' },
    { type: 'BATTLESHIP', name: 'Navio-tanque', size: 4, img: '/ships/pirate_op/battleship_pirate_op.png' },
    { type: 'CRUISER', name: 'Contratorpedeiro', size: 3, img: '/ships/pirate_op/cruiser_pirate_op.png' },
    { type: 'SUBMARINE', name: 'Submarino', size: 3, img: '/ships/pirate_op/submarine_pirate_op.png' },
    { type: 'DESTROYER', name: 'Destroyer', size: 2, img: '/ships/pirate_op/destroyer_pirate_op.png' },
  ],
  pesca: [
    { type: 'CARRIER', name: 'Porta-aviões', size: 5, img: '/ships/pesca/carrier_f.png' },
    { type: 'BATTLESHIP', name: 'Navio-tanque', size: 4, img: '/ships/pesca/battleship_f.png' },
    { type: 'CRUISER', name: 'Contratorpedeiro', size: 3, img: '/ships/pesca/cruiser_f.png' },
    { type: 'SUBMARINE', name: 'Submarino', size: 3, img: '/ships/pesca/submarine_f.png' },
    { type: 'DESTROYER', name: 'Destroyer', size: 2, img: '/ships/pesca/destroyer_f.png' },
  ],
  kitty: [
    { type: 'CARRIER', name: 'Porta-aviões', size: 5, img: '/ships/kitty/carrier_hk.png' },
    { type: 'BATTLESHIP', name: 'Navio-tanque', size: 4, img: '/ships/kitty/battleship_hk.png' },
    { type: 'CRUISER', name: 'Contratorpedeiro', size: 3, img: '/ships/kitty/cruiser_hk.png' },
    { type: 'SUBMARINE', name: 'Submarino', size: 3, img: '/ships/kitty/submarine_hk.png' },
    { type: 'DESTROYER', name: 'Destroyer', size: 2, img: '/ships/kitty/destroyer_hk.png' },
  ],
};

function detectShips(board) {
  if (!board) return [];
  const visited = Array.from({ length: 10 }, () => Array(10).fill(false));
  const ships = [];
  const validSizes = [5, 4, 3, 3, 2];
  const remainingSizes = [...validSizes];

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

      if (hLen <= 1 && vLen <= 1) {
        visited[r][c] = true;
        ships.push({ row: r, col: c, size: 1, orientation: 'HORIZONTAL' });
        continue;
      }

      const hMatch = remainingSizes.includes(hLen);
      const vMatch = remainingSizes.includes(vLen);
      let chosenLen, orientation;

      if (hLen >= 2 && vLen >= 2) {
        if (hMatch && !vMatch) { chosenLen = hLen; orientation = 'HORIZONTAL'; }
        else if (vMatch && !hMatch) { chosenLen = vLen; orientation = 'VERTICAL'; }
        else {
          let isRealVertical = true;
          for (let i = 1; i < vLen; i++) {
            const leftHas = c > 0 && (board[r + i][c - 1] === 'SHIP' || board[r + i][c - 1] === 'HIT') && !visited[r + i][c - 1];
            const rightHas = c < 9 && (board[r + i][c + 1] === 'SHIP' || board[r + i][c + 1] === 'HIT') && !visited[r + i][c + 1];
            if (leftHas || rightHas) { isRealVertical = false; break; }
          }
          if (!isRealVertical || hLen >= vLen) { chosenLen = hLen; orientation = 'HORIZONTAL'; }
          else { chosenLen = vLen; orientation = 'VERTICAL'; }
        }
      } else if (hLen >= 2) { chosenLen = hLen; orientation = 'HORIZONTAL'; }
      else { chosenLen = vLen; orientation = 'VERTICAL'; }

      let bestSize = chosenLen;
      if (!remainingSizes.includes(chosenLen)) {
        const sorted = [...remainingSizes].sort((a, b) => b - a);
        bestSize = sorted.find(s => s <= chosenLen) || chosenLen;
      }

      if (orientation === 'HORIZONTAL') {
        for (let i = 0; i < bestSize; i++) visited[r][c + i] = true;
      } else {
        for (let i = 0; i < bestSize; i++) visited[r + i][c] = true;
      }
      ships.push({ row: r, col: c, size: bestSize, orientation });
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
      else if (ship.size === 3) { imgData = threeCount === 0 ? skinShips[2] : skinShips[3]; threeCount++; }
      else if (ship.size === 2) imgData = skinShips[4];
      return { ...ship, img: imgData?.img, sunk: isShipSunk(board, ship) };
    });
}

function getSunkStatus(board, shipList) {
  if (!board) return shipList.map(s => ({ ...s, sunk: false }));
  const detected = detectShips(board);
  const sunkSizes = [];
  for (const ship of detected) {
    if (ship.size > 1 && isShipSunk(board, ship)) sunkSizes.push(ship.size);
  }
  const usedSizes = [];
  return shipList.map(s => {
    const idx = sunkSizes.findIndex((size, i) => size === s.size && !usedSizes.includes(i));
    if (idx !== -1) { usedSizes.push(idx); return { ...s, sunk: true }; }
    return { ...s, sunk: false };
  });
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
      while (c + hLen < 10 && board[r][c + hLen] === 'HIT' && !visited[r][c + hLen]) hLen++;
      let vLen = 0;
      while (r + vLen < 10 && board[r + vLen][c] === 'HIT' && !visited[r + vLen][c]) vLen++;
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

const FLEET_CELL = 44;
const FLEET_CELL_MOBILE = 28;
const FLEET_HEIGHT = 40;
const FLEET_HEIGHT_MOBILE = 24;
const MAX_SHIP_SIZE = 5;



function ShipList({ ships, title, align, mobile }) {
  const fleetCell = mobile ? FLEET_CELL_MOBILE : FLEET_CELL;
  const fleetHeight = mobile ? FLEET_HEIGHT_MOBILE : FLEET_HEIGHT;
  const maxWidth = MAX_SHIP_SIZE * fleetCell;

  if (mobile) {
    return (
      <div className="flex xl:hidden flex-col gap-2 items-center w-full">
        <UIPanel variant="dark" size="sm" className="w-full">
          <h3 className="text-[#D5AE47] text-xs font-bold tracking-[0.15em] uppercase mb-3 font-['Cinzel',_serif] text-center text-shadow-gold">
            {title}
          </h3>
          <div className="flex flex-wrap gap-2 justify-center">
            {ships.map((ship) => (
              <div
                key={ship.type}
                className={`transition-opacity duration-500 ${ship.sunk ? 'opacity-25' : 'opacity-100'}`}
                style={{ display: 'flex', alignItems: 'center' }}
              >
                <img src={ship.img} alt={ship.name}
                  className={`object-contain ${ship.sunk ? 'grayscale' : ''}`}
                  style={{ width: `${ship.size * fleetCell}px`, height: `${fleetHeight}px` }}
                />
                {ship.sunk && <span className="text-[#C84A3A] text-sm font-bold ml-1">✕</span>}
              </div>
            ))}
          </div>
        </UIPanel>
      </div>
    );
  }

  return (
    <div className={`hidden xl:flex flex-col gap-4 justify-center ${align === 'right' ? 'items-end' : 'items-start'}`}
      style={{ width: `${maxWidth + 32}px`, alignSelf: 'stretch' }}>
      <UIPanel variant="dark" size="sm" className="w-full flex flex-col gap-4">
        <h3 className="text-[#D5AE47] text-xs font-bold tracking-[0.15em] uppercase font-['Cinzel',_serif] text-shadow-gold">
          {title}
        </h3>
        <div className="flex flex-col gap-4 items-center">
          {ships.map((ship) => (
            <div key={ship.type}
              className={`transition-opacity duration-500 ${ship.sunk ? 'opacity-25' : 'opacity-100'}`}
              style={{ width: `${maxWidth}px`, display: 'flex', justifyContent: 'center', alignItems: 'center' }}
            >
              <img src={ship.img} alt={ship.name}
                className={`object-contain ${ship.sunk ? 'grayscale' : ''}`}
                style={{ width: `${ship.size * fleetCell}px`, height: `${fleetHeight}px` }}
              />
              {ship.sunk && <span className="text-[#C84A3A] text-sm font-bold ml-2">✕</span>}
            </div>
          ))}
        </div>
      </UIPanel>
    </div>
  );
}



function MyBoard({ board, skinShips, cellSize, serverShips }) {
  if (!board) return null;

  let ships;
  if (serverShips && serverShips.length > 0) {
    const typeToImg = {};
    let threeCount = 0;
    for (const s of skinShips) {
      if (s.size === 3) { typeToImg[s.type + '_' + threeCount] = s.img; threeCount++; }
      else { typeToImg[s.type] = s.img; }
    }
    let serverThreeCount = 0;
    ships = serverShips.map(s => {
      let img;
      if (s.size === 3) { img = typeToImg[s.type + '_' + serverThreeCount] || skinShips.find(sk => sk.type === s.type)?.img; serverThreeCount++; }
      else { img = typeToImg[s.type] || skinShips.find(sk => sk.type === s.type)?.img; }
      return { ...s, img };
    });
  } else {
    const detected = detectShips(board);
    ships = assignShipData(detected, board, skinShips);
  }

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
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <img src="/fish/right/fish1.png" alt="" className="absolute top-[12%] h-6 opacity-[0.18] animate-[swim-right_14s_linear_infinite]" />
        <img src="/fish/left/fish2.png" alt="" className="absolute top-[35%] h-9 opacity-[0.14] animate-[swim-left_20s_linear_infinite] [animation-delay:4s]" />
        <img src="/fish/right/fish3.png" alt="" className="absolute top-[58%] h-7 opacity-[0.16] animate-[swim-right_17s_linear_infinite] [animation-delay:9s]" />
        <img src="/fish/left/fish4.png" alt="" className="absolute top-[78%] h-10 opacity-[0.12] animate-[swim-left_24s_linear_infinite] [animation-delay:13s]" />
      </div>

      <div className="grid grid-cols-10" style={{ rowGap: `${GAP}px`, columnGap: `${GAP}px`, width: `${cellSize * 10 + GAP * 9}px` }}>
        {board.flat().map((cell, i) => {
          const row = Math.floor(i / 10);
          const col = i % 10;
          const isSunk = sunkCells.has(`${row},${col}`);
          const oceanClass = getOceanClass(row, col, cell, isSunk);
          return (
            <div key={i} style={{ width: `${cellSize}px`, height: `${cellSize}px` }}
              className={`rounded-sm ${oceanClass}`} />
          );
        })}
      </div>

      {ships.map((ship, idx) => {
        if (!ship.img) return null;
        const cellTotal = cellSize + GAP;
        const top = ship.row * cellTotal;
        const left = ship.col * cellTotal;
        const length = ship.size * cellTotal - GAP;
        const heightScale = ship.size <= 2 ? 1.8 : ship.size <= 3 ? 1.3 : 1;
        const shipHeight = cellSize * heightScale;

        let style;
        if (ship.orientation === 'HORIZONTAL') {
          const topOffset = top - (shipHeight - cellSize) / 2;
          style = { top: `${topOffset}px`, left: `${left}px`, width: `${length}px`, height: `${shipHeight}px` };
        } else {
          const centerX = left + cellSize / 2;
          const centerY = top + length / 2;
          const rotLeft = centerX - length / 2;
          const rotTop = centerY - shipHeight / 2;
          style = { top: `${rotTop}px`, left: `${rotLeft}px`, width: `${length}px`, height: `${shipHeight}px`, transform: 'rotate(90deg)' };
        }

        return (
          <img key={idx} src={ship.img} alt={`ship-${ship.size}`}
            className={`absolute pointer-events-none object-contain transition-opacity duration-500 ${ship.sunk ? 'opacity-25 grayscale' : 'opacity-90'}`}
            style={style} />
        );
      })}
    </div>
  );
}



function OpponentBoard({ board, onClick, active, cellSize, revealed, skinShips, sunkShipTypes, sunkCellsSet }) {
  if (!board) return null;
  const ships = revealed ? assignShipData(detectShips(board), board, skinShips) : [];
  const [hoverCell, setHoverCell] = useState(null);
  const sunkCells = sunkCellsSet || new Set();

  return (
    <div className={`relative overflow-hidden rounded-md ${active ? 'ring-2 ring-[#B98B2F]/50' : ''}`}
      onMouseLeave={() => setHoverCell(null)}>
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
          const isHovered = hoverCell && hoverCell.row === row && hoverCell.col === col;
          const isInCrosshair = active && hoverCell && (hoverCell.row === row || hoverCell.col === col) && !isHovered;
          const canTarget = active && cell === 'EMPTY';

          let cellClass = oceanClass;
          if (isHovered && canTarget) {
            cellClass = 'bg-[#C84A3A]/60 ring-1 ring-[#C84A3A] ring-inset';
          } else if (isInCrosshair && cell === 'EMPTY') {
            cellClass = `${oceanClass} brightness-125 border border-[#C84A3A]/20`;
          }

          return (
            <div key={i} style={{ width: `${cellSize}px`, height: `${cellSize}px` }}
              className={`rounded-sm ${active ? 'cursor-crosshair' : 'cursor-default'} ${cellClass} transition-all duration-75`}
              onClick={() => onClick?.(row, col)}
              onMouseEnter={() => active && setHoverCell({ row, col })} />
          );
        })}
      </div>

      {revealed && ships.map((ship, idx) => {
        if (!ship.img) return null;
        const cellTotal = cellSize + GAP;
        const top = ship.row * cellTotal;
        const left = ship.col * cellTotal;
        const length = ship.size * cellTotal - GAP;
        const heightScale = ship.size <= 2 ? 1.8 : ship.size <= 3 ? 1.3 : 1;
        const shipHeight = cellSize * heightScale;

        let style;
        if (ship.orientation === 'HORIZONTAL') {
          const topOffset = top - (shipHeight - cellSize) / 2;
          style = { top: `${topOffset}px`, left: `${left}px`, width: `${length}px`, height: `${shipHeight}px` };
        } else {
          const centerX = left + cellSize / 2;
          const centerY = top + length / 2;
          const rotLeft = centerX - length / 2;
          const rotTop = centerY - shipHeight / 2;
          style = { top: `${rotTop}px`, left: `${rotLeft}px`, width: `${length}px`, height: `${shipHeight}px`, transform: 'rotate(90deg)' };
        }

        return (
          <img key={idx} src={ship.img} alt={`ship-${ship.size}`}
            className={`absolute pointer-events-none object-contain transition-opacity duration-500 ${ship.sunk ? 'opacity-25 grayscale' : 'opacity-90'}`}
            style={style} />
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
  const { play, startMusic, stopMusic, toggleMute, muted } = useSound();
  const [sunkOpponentShips, setSunkOpponentShips] = useState([]);
  const [sunkOpponentCells, setSunkOpponentCells] = useState(new Set());
  const [gameFinished, setGameFinished] = useState(false);
  const [showSurrenderConfirm, setShowSurrenderConfirm] = useState(false);
  const cellSize = useResponsiveCellSize({ maxCellSize: 36, boards: 2, horizontalPadding: 120 });
  const prevGameStateRef = useRef(null);
  const gameOverTimerRef = useRef(null);

  // Resetar estado local quando o gameId muda (rematch sem desmontar)
  useEffect(() => {
    setSunkOpponentShips([]);
    setSunkOpponentCells(new Set());
    setGameFinished(false);
    setShowSurrenderConfirm(false);
    prevGameStateRef.current = null;
    if (gameOverTimerRef.current) {
      clearTimeout(gameOverTimerRef.current);
      gameOverTimerRef.current = null;
    }
  }, [gameId]);

  useEffect(() => {
    connect().then(() => subscribeToGame(gameId));
    startMusic('/sounds/battle.mp3', 0.55);
    return () => { stopMusic(); if (gameOverTimerRef.current) clearTimeout(gameOverTimerRef.current); };
  }, [connect, subscribeToGame, gameId, startMusic, stopMusic]);

  useEffect(() => {
    if (!gameState || !prevGameStateRef.current) { prevGameStateRef.current = gameState; return; }
    const prev = prevGameStateRef.current;
    if (gameState.lastShotResult && gameState.lastShotResult !== prev.lastShotResult ||
        gameState.opponentBoard !== prev.opponentBoard || gameState.myBoard !== prev.myBoard) {
      if (gameState.lastShotResult === 'MISS') play('splash');
      else if (gameState.lastShotResult === 'HIT') play('explosion');
      else if (gameState.lastShotResult === 'SUNK') play('sunk');
    }
    if (gameState.phase === 'FINISHED' && prev.phase !== 'FINISHED') {
      setTimeout(() => { if (gameState.winnerId === username) play('victory'); else play('defeat'); }, 500);
    }
    prevGameStateRef.current = gameState;
  }, [gameState, play, username]);

  useEffect(() => {
    if (gameState?.phase === 'FINISHED' && !gameFinished) {
      setGameFinished(true);
      gameOverTimerRef.current = setTimeout(() => {
        navigate(`/game-over?winner=${gameState.winnerId}&gameId=${gameId}`);
      }, 5000);
    }
    if (gameState?.sunkShipType && gameState?.lastShotResult === 'SUNK' && gameState?.myTurn) {
      setSunkOpponentShips(prev => {
        if (!prev.includes(gameState.sunkShipType)) return [...prev, gameState.sunkShipType];
        return prev;
      });
      if (gameState.sunkShipCells && gameState.sunkShipCells.length > 0) {
        setSunkOpponentCells(prev => {
          const next = new Set(prev);
          for (const cell of gameState.sunkShipCells) next.add(`${cell[0]},${cell[1]}`);
          return next;
        });
      }
    }
  }, [gameState, navigate, gameFinished]);

  const handleShoot = (row, col) => {
    if (!gameState?.myTurn) return;
    const cell = gameState.opponentBoard[row][col];
    if (cell === 'HIT' || cell === 'MISS') return;
    play('click');
    shoot(gameId, row, col);
  };

  const handleSurrender = () => { surrender(gameId); resetGame(); navigate('/lobby'); };

  const mySkin = gameState?.mySkin || 'padrao_antigo';
  const opponentSkin = gameState?.opponentSkin || 'pirate';
  const mySkinShips = SKINS[mySkin] || SKINS['padrao_antigo'];
  const opponentSkinShips = SKINS[opponentSkin] || SKINS['padrao_antigo'];

  const myShipsStatus = gameState?.myShips
    ? mySkinShips.map(s => {
        const serverShip = gameState.myShips.find(ss => ss.type === s.type);
        return { ...s, sunk: serverShip ? serverShip.sunk : false };
      })
    : getSunkStatus(gameState?.myBoard, mySkinShips);
  const opponentShipsStatus = opponentSkinShips.map(s => ({ ...s, sunk: sunkOpponentShips.includes(s.type) }));



  return (
    <PirateBackground variant="battle">
      <div className="min-h-screen flex flex-col">
        <ConnectionStatus connectionStatus={connectionStatus} reconnectInfo={reconnectInfo} />

        {/* Header */}
        <header className="w-full px-4 sm:px-8 py-4 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            {!gameFinished && (
              <div className="relative">
                {!showSurrenderConfirm ? (
                  <PirateButton onClick={() => setShowSurrenderConfirm(true)} variant="danger" size="sm">
                    🏳️ Desistir
                  </PirateButton>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-[#C84A3A] text-xs font-bold font-['Cinzel',_serif]">Tem certeza?</span>
                    <PirateButton onClick={handleSurrender} variant="danger" size="sm">Sim</PirateButton>
                    <PirateButton onClick={() => setShowSurrenderConfirm(false)} variant="wood" size="sm">Não</PirateButton>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleMute}
              className="text-[#8B7355] hover:text-[#D5AE47] transition-colors text-xl p-1"
              title={muted ? 'Ativar som' : 'Silenciar'}>
              {muted ? <HiVolumeOff /> : <HiVolumeUp />}
            </button>
            <span className="text-[#C6AE78] text-sm font-['Cinzel',_serif]">{username}</span>
          </div>
        </header>

        <TurnIndicator gameFinished={gameFinished} gameState={gameState} username={username} />

        {/* Boards */}
        <div className="flex-1 flex items-center justify-center px-2 sm:px-4 pb-4 sm:pb-8 overflow-hidden">
          <div className="flex flex-col xl:flex-row items-center xl:items-stretch gap-6">
            {/* Desktop ship list - left */}
            <ShipList ships={myShipsStatus} title="Minha Frota" align="left" mobile={false} />

            <div className="flex flex-col items-center gap-4">
              <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-center lg:items-start">
                {/* Meu tabuleiro */}
                <UIPanel variant="default" size="sm" className="relative overflow-visible">
                  <h2 className="text-center text-[#C6AE78] text-xs font-bold tracking-[0.15em] mb-3 uppercase font-['Cinzel',_serif]">
                    Meu Tabuleiro
                  </h2>
                  <MyBoard board={gameState?.myBoard} skinShips={mySkinShips} cellSize={cellSize} serverShips={gameState?.myShips} />
                </UIPanel>

                {/* Tabuleiro oponente */}
                <UIPanel variant="default" size="sm" className={`relative overflow-visible ${gameState?.myTurn && !gameFinished ? 'animate-[pulse-glow_2s_ease-in-out_infinite]' : ''}`}>
                  <h2 className="text-center text-[#C6AE78] text-xs font-bold tracking-[0.15em] mb-3 uppercase font-['Cinzel',_serif]">
                    {gameState?.opponentName || 'Oponente'}
                  </h2>
                  <OpponentBoard board={gameState?.opponentBoard} onClick={handleShoot}
                    active={gameState?.myTurn && !gameFinished} cellSize={cellSize}
                    revealed={gameFinished} skinShips={opponentSkinShips}
                    sunkShipTypes={sunkOpponentShips} sunkCellsSet={sunkOpponentCells} />
                </UIPanel>
              </div>

              {/* Mobile ship lists */}
              <div className="flex flex-col sm:flex-row gap-4 w-full">
                <ShipList ships={myShipsStatus} title="Minha Frota" align="left" mobile={true} />
                <ShipList ships={opponentShipsStatus} title={gameState?.opponentName ? `Frota de ${gameState.opponentName}` : 'Frota Inimiga'} align="right" mobile={true} />
              </div>
            </div>

            {/* Desktop ship list - right */}
            <ShipList ships={opponentShipsStatus} title={gameState?.opponentName ? `Frota de ${gameState.opponentName}` : 'Frota Inimiga'} align="right" mobile={false} />
          </div>
        </div>

        {gameState?.opponentName !== 'Capitão Bot' && (
          <EmotePanel onSendEmote={(e) => sendEmote(gameId, e)} receivedEmote={emote} />
        )}
      </div>
    </PirateBackground>
  );
}
