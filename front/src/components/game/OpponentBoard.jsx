import { useState } from 'react';
import { GAP, getOceanClass, detectShips, assignShipData } from '../../utils/board';

export default function OpponentBoard({ board, onClick, active, cellSize, revealed, skinShips, sunkShipTypes, sunkCellsSet }) {
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
