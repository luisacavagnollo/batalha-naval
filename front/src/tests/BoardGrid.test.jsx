import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BoardGrid, { getOceanClass } from '../components/BoardGrid';

describe('BoardGrid', () => {
  const emptyBoard = Array.from({ length: 10 }, () => Array(10).fill('EMPTY'));

  it('renderiza 100 células (10x10)', () => {
    const { container } = render(
      <BoardGrid cellSize={30} board={emptyBoard} />
    );
    const grid = container.querySelector('.grid');
    expect(grid.children.length).toBe(100);
  });

  it('aplica cursor crosshair quando active=true', () => {
    const { container } = render(
      <BoardGrid cellSize={30} board={emptyBoard} active={true} />
    );
    const firstCell = container.querySelector('.grid').children[0];
    expect(firstCell.className).toContain('cursor-crosshair');
  });

  it('chama onCellClick com row e col corretos ao clicar', () => {
    const onClick = vi.fn();
    const { container } = render(
      <BoardGrid cellSize={30} board={emptyBoard} onCellClick={onClick} />
    );
    const grid = container.querySelector('.grid');
    // Clicar na célula index 15 = row 1, col 5
    fireEvent.click(grid.children[15]);
    expect(onClick).toHaveBeenCalledWith(1, 5);
  });

  it('chama onCellHover ao passar o mouse', () => {
    const onHover = vi.fn();
    const { container } = render(
      <BoardGrid cellSize={30} board={emptyBoard} onCellHover={onHover} />
    );
    const grid = container.querySelector('.grid');
    fireEvent.mouseEnter(grid.children[23]); // row 2, col 3
    expect(onHover).toHaveBeenCalledWith(2, 3);
  });

  it('mostra HIT e MISS com classes corretas', () => {
    const board = emptyBoard.map(row => [...row]);
    board[0][0] = 'HIT';
    board[1][1] = 'MISS';

    const { container } = render(
      <BoardGrid cellSize={30} board={board} />
    );
    const grid = container.querySelector('.grid');
    // cell (0,0) = index 0
    expect(grid.children[0].className).toContain('bg-[#c45a2a]');
    // cell (1,1) = index 11
    expect(grid.children[11].className).toContain('bg-[#5a5048]');
  });

  it('marca célula como sunk quando presente em sunkCells', () => {
    const board = emptyBoard.map(row => [...row]);
    board[0][0] = 'HIT';

    const sunkCells = new Set(['0,0']);
    const { container } = render(
      <BoardGrid cellSize={30} board={board} sunkCells={sunkCells} />
    );
    const grid = container.querySelector('.grid');
    expect(grid.children[0].className).toContain('bg-[#8b1a1a]');
  });
});

describe('getOceanClass', () => {
  it('retorna classe HIT para célula HIT', () => {
    expect(getOceanClass(0, 0, 'HIT')).toContain('#c45a2a');
  });

  it('retorna classe MISS para célula MISS', () => {
    expect(getOceanClass(0, 0, 'MISS')).toContain('#5a5048');
  });

  it('retorna classe sunk para HIT com isSunkCell=true', () => {
    expect(getOceanClass(0, 0, 'HIT', true)).toContain('#8b1a1a');
  });

  it('retorna gradiente ocean para célula EMPTY', () => {
    const result = getOceanClass(0, 0, 'EMPTY');
    expect(result).toContain('bg-gradient-to-br');
  });

  it('varia gradiente baseado em (row+col)%3', () => {
    const class00 = getOceanClass(0, 0, 'EMPTY');
    const class01 = getOceanClass(0, 1, 'EMPTY');
    const class02 = getOceanClass(0, 2, 'EMPTY');
    // 0%3=0, 1%3=1, 2%3=2 — devem ser diferentes
    expect(class00).not.toBe(class01);
    expect(class01).not.toBe(class02);
    // 3%3=0 — deve ser igual ao 0%3
    const class03 = getOceanClass(0, 3, 'EMPTY');
    expect(class03).toBe(class00);
  });
});
