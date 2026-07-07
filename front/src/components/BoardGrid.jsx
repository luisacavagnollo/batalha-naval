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

const GAP = 2;

/**
 * Renderiza um grid 10x10 genérico.
 * 
 * Props:
 * - cellSize: tamanho de cada célula em px
 * - board: array 10x10 de CellState (ou null para grid vazio)
 * - sunkCells: Set de "row,col" para marcar como afundado
 * - onCellClick: (row, col) => void
 * - onCellHover: (row, col) => void
 * - onMouseLeave: () => void
 * - getCellClass: (row, col) => classe extra para a célula (hover, highlight, etc.)
 * - active: se true, mostra cursor-crosshair e hover nos EMPTYs
 * - backgroundChildren: conteúdo absoluto atrás do grid (peixes, etc.)
 * - children: conteúdo absoluto sobre o grid (navios, etc.)
 */
export default function BoardGrid({
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

  return (
    <div
      className={`relative overflow-hidden rounded-md ${className}`}
      onMouseLeave={onMouseLeave}
    >
      {backgroundChildren}

      <div
        className="relative z-[1] grid grid-cols-10"
        style={{ rowGap: `${GAP}px`, columnGap: `${GAP}px`, width: `${gridWidth}px` }}
      >
        {Array.from({ length: 100 }, (_, i) => {
          const row = Math.floor(i / 10);
          const col = i % 10;
          const cell = board ? board[row][col] : 'EMPTY';
          const isSunk = sunkCells ? sunkCells.has(`${row},${col}`) : false;
          const extraClass = getCellClass ? getCellClass(row, col) : '';
          // Se getCellClass retorna algo, usa ele como fundo ao invés do ocean
          const oceanClass = extraClass ? '' : getOceanClass(row, col, cell, isSunk);
          const hoverClass = active && cell === 'EMPTY' ? 'hover:bg-[#8b1a1a]/40' : '';
          const cursor = active ? 'cursor-crosshair' : onCellClick ? 'cursor-pointer' : 'cursor-default';

          return (
            <div
              key={i}
              style={{ width: `${cellSize}px`, height: `${cellSize}px` }}
              className={`rounded-sm ${cursor} ${oceanClass} ${hoverClass} ${extraClass} transition-colors`}
              onClick={() => onCellClick?.(row, col)}
              onMouseEnter={() => onCellHover?.(row, col)}
            />
          );
        })}
      </div>

      {children}
    </div>
  );
}

export { GAP, OCEAN_COLORS, getOceanClass };
