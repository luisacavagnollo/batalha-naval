export const GAP = 2;

export const OCEAN_COLORS = [
  'from-[#0a1a2e] to-[#0f2640]',
  'from-[#081422] to-[#0c1e35]',
  'from-[#0b1828] to-[#0e2238]',
];

export function getOceanClass(row, col, cell, isSunkCell = false) {
  if (cell === 'HIT' && isSunkCell) return 'bg-[#8b1a1a]/50';
  if (cell === 'HIT') return 'bg-[#c45a2a]/35';
  if (cell === 'MISS') return 'bg-[#5a5048]/60';
  const variant = (row + col) % 3;
  return `bg-gradient-to-br ${OCEAN_COLORS[variant]}`;
}

export function detectShips(board) {
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

export function isShipSunk(board, ship) {
  for (let i = 0; i < ship.size; i++) {
    const r = ship.orientation === 'VERTICAL' ? ship.row + i : ship.row;
    const c = ship.orientation === 'HORIZONTAL' ? ship.col + i : ship.col;
    if (board[r][c] !== 'HIT') return false;
  }
  return true;
}

export function assignShipData(ships, board, skinShips) {
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

export function getSunkStatus(board, shipList) {
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

export function detectShipsFromHits(board) {
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
