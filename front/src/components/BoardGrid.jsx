import { memo, useCallback } from 'react';

const OCEAN_COLORS = [
  'from-[#0a1a2e] to-[#0f2640]',
  'from-[#081422] to-[#0c1e35]',
  'from-[#0b1828] to-[#0e2238]',
];

const LETRAS = 'ABCDEFGHIJ';

function getOceanClass(row, col, cell, isSunkCell = false) {
  if (cell === 'HIT' && isSunkCell) return 'bg-[#8b1a1a]/50';
  if (cell === 'HIT') return 'bg-[#c45a2a]/35';
  if (cell === 'MISS') return 'bg-[#5a5048]/60';
  const variant = (row + col) % 3;
  return `bg-gradient-to-br ${OCEAN_COLORS[variant]}`;
}

function getCellState(cell, isSunk) {
  if (cell === 'HIT' && isSunk) return 'navio afundado';
  if (cell === 'HIT') return 'acerto';
  if (cell === 'MISS') return 'erro';
  if (cell === 'SHIP') return 'navio';
  return 'vazio';
}

const GAP = 2;

const BoardGrid = memo(function BoardGrid({
  cellSize,
  board,
  sunkCells,
  onCellClick,
  onCellHover,
  onMouseLeave,
  getCellClass,
  active = false,
  className = '',
  backgroundChildren,
  children,
}) {
  const gridWidth = cellSize * 10 + GAP * 9;

  const handleKeyDown = useCallback((e, row, col) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onCellClick?.(row, col);
    }
  }, [onCellClick]);

  return (
    <div
      className={`relative overflow-hidden rounded-md ${className}`}
      onMouseLeave={onMouseLeave}
    >
      {backgroundChildren}

      <div
        role="grid"
        aria-label="Tabuleiro 10 por 10"
        className="relative z-[1] grid grid-cols-10"
        style={{ rowGap: `${GAP}px`, columnGap: `${GAP}px`, width: `${gridWidth}px` }}
      >
        {Array.from({ length: 100 }, (_, i) => {
          const row = Math.floor(i / 10);
          const col = i % 10;
          const cell = board ? board[row][col] : 'EMPTY';
          const isSunk = sunkCells ? sunkCells.has(`${row},${col}`) : false;
          const extraClass = getCellClass ? getCellClass(row, col) : '';
          const oceanClass = extraClass ? '' : getOceanClass(row, col, cell, isSunk);
          const hoverClass = active && cell === 'EMPTY' ? 'hover:bg-[#8b1a1a]/40' : '';
          const cursor = active ? 'cursor-crosshair' : onCellClick ? 'cursor-pointer' : 'cursor-default';
          const isInteractive = (active && cell === 'EMPTY') || !!onCellClick;
          const state = getCellState(cell, isSunk);

          return (
            <div
              key={i}
              role="gridcell"
              aria-rowindex={row + 1}
              aria-colindex={col + 1}
              aria-label={`Linha ${row + 1}, Coluna ${LETRAS[col]}, ${state}`}
              tabIndex={isInteractive ? 0 : undefined}
              style={{ width: `${cellSize}px`, height: `${cellSize}px` }}
              className={`rounded-sm ${cursor} ${oceanClass} ${hoverClass} ${extraClass} transition-colors`}
              onClick={() => onCellClick?.(row, col)}
              onMouseEnter={() => onCellHover?.(row, col)}
              onKeyDown={isInteractive ? (e) => handleKeyDown(e, row, col) : undefined}
            />
          );
        })}
      </div>

      {children}
    </div>
  );
});

export default BoardGrid;
export { GAP, OCEAN_COLORS, getOceanClass };
