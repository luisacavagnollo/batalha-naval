import { GAP, getOceanClass, detectShips, assignShipData } from '../../utils/board';

export default function MyBoard({ board, skinShips, cellSize, serverShips }) {
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
