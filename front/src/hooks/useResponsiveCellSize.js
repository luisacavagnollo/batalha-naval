import { useState, useEffect, useCallback } from 'react';

const GAP = 2;
const GRID_CELLS = 10;
const GRID_GAPS = GRID_CELLS - 1; // 9 gaps

/**
 * Hook que calcula o tamanho de célula ideal para caber na viewport.
 *
 * @param {object} options
 * @param {number} options.maxCellSize - Tamanho máximo da célula (padrão: 40)
 * @param {number} options.minCellSize - Tamanho mínimo da célula (padrão: 24)
 * @param {number} options.horizontalPadding - Padding horizontal total (panel borders, margins, etc)
 * @param {number} options.boards - Quantos boards lado a lado em desktop (1 ou 2)
 * @returns {number} cellSize calculado
 */
export function useResponsiveCellSize({
  maxCellSize = 40,
  minCellSize = 24,
  horizontalPadding = 80,
  boards = 1,
} = {}) {
  const calculate = useCallback(() => {
    if (typeof window === 'undefined') return maxCellSize;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Espaço horizontal disponível para os boards
    // Em mobile (< 1024px), os boards ficam empilhados verticalmente
    const isStacked = vw < 1024 || boards === 1;
    const boardsInRow = isStacked ? 1 : boards;

    // Padding: margem da página + padding dos painéis + gap entre boards
    const gapBetweenBoards = boardsInRow > 1 ? 48 : 0;
    const totalHPad = horizontalPadding + gapBetweenBoards;

    // Espaço horizontal disponível para um board
    const availableWidth = (vw - totalHPad) / boardsInRow;

    // Espaço vertical: header (~60px) + turn indicator (~40px) + padding + ship lists mobile (~80px)
    const verticalOverhead = isStacked && boards === 2 ? 280 : 160;
    const availableHeight = (vh - verticalOverhead) / (isStacked && boards === 2 ? 2 : 1);

    // Calcular cellSize baseado no espaço horizontal
    const cellFromWidth = Math.floor((availableWidth - GAP * GRID_GAPS) / GRID_CELLS);

    // Calcular cellSize baseado no espaço vertical
    const cellFromHeight = Math.floor((availableHeight - GAP * GRID_GAPS) / GRID_CELLS);

    // Usar o menor dos dois (cabe em ambas dimensões)
    const cell = Math.min(cellFromWidth, cellFromHeight, maxCellSize);

    return Math.max(cell, minCellSize);
  }, [maxCellSize, minCellSize, horizontalPadding, boards]);

  const [cellSize, setCellSize] = useState(calculate);

  useEffect(() => {
    let rafId = null;
    const handleResize = () => {
      if (rafId) return; // Já tem um frame agendado, ignorar
      rafId = requestAnimationFrame(() => {
        setCellSize(calculate());
        rafId = null;
      });
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [calculate]);

  return cellSize;
}
