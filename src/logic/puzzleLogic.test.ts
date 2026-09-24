import { describe, it, expect } from 'vitest';
import {
  createSolvedBoard,
  getBlankIndex,
  getValidMoves,
  canMove,
  moveTile,
  isSolved,
  countSolvedTiles,
  shuffleBoard,
  getKeyboardMoveTarget,
} from './puzzleLogic';
import { GridSize } from '../types/puzzle';

describe('puzzleLogic', () => {
  describe('createSolvedBoard', () => {
    it('creates board with length gridSize^2 and sequential numbers', () => {
      const board3 = createSolvedBoard(3);
      expect(board3).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
      expect(getBlankIndex(board3, 3)).toBe(8);

      const board4 = createSolvedBoard(4);
      expect(board4.length).toBe(16);
      expect(board4[15]).toBe(15);
      expect(getBlankIndex(board4, 4)).toBe(15);
    });
  });

  describe('getValidMoves', () => {
    it('returns correct moves for corner, edge, and center on 3x3', () => {
      // Top-left corner (index 0)
      expect(getValidMoves(0, 3).sort()).toEqual([1, 3]);

      // Bottom-right corner (index 8)
      expect(getValidMoves(8, 3).sort()).toEqual([5, 7]);

      // Top edge (index 1)
      expect(getValidMoves(1, 3).sort()).toEqual([0, 2, 4]);

      // Center (index 4)
      expect(getValidMoves(4, 3).sort()).toEqual([1, 3, 5, 7]);
    });
  });

  describe('canMove', () => {
    it('returns true only for directly adjacent horizontal or vertical tiles', () => {
      // blank is at 4 on 3x3
      expect(canMove(1, 4, 3)).toBe(true);
      expect(canMove(3, 4, 3)).toBe(true);
      expect(canMove(5, 4, 3)).toBe(true);
      expect(canMove(7, 4, 3)).toBe(true);

      // diagonals or distant tiles
      expect(canMove(0, 4, 3)).toBe(false);
      expect(canMove(2, 4, 3)).toBe(false);
      expect(canMove(6, 4, 3)).toBe(false);
      expect(canMove(8, 4, 3)).toBe(false);
    });
  });

  describe('moveTile', () => {
    it('swaps tile and blank when valid', () => {
      const board = createSolvedBoard(3); // blank at 8
      const { newBoard, moved, newBlankIndex } = moveTile(board, 7, 3);
      expect(moved).toBe(true);
      expect(newBlankIndex).toBe(7);
      expect(newBoard[7]).toBe(8);
      expect(newBoard[8]).toBe(7);
    });

    it('does not change board when invalid', () => {
      const board = createSolvedBoard(3); // blank at 8
      const { newBoard, moved, newBlankIndex } = moveTile(board, 0, 3);
      expect(moved).toBe(false);
      expect(newBlankIndex).toBe(8);
      expect(newBoard).toEqual(board);
    });
  });

  describe('isSolved', () => {
    it('returns true for solved board and false otherwise', () => {
      const solved = createSolvedBoard(3);
      expect(isSolved(solved)).toBe(true);

      const unsolved = [...solved];
      unsolved[0] = 1;
      unsolved[1] = 0;
      expect(isSolved(unsolved)).toBe(false);
    });
  });

  describe('shuffleBoard', () => {
    const gridSizes: GridSize[] = [3, 4, 5, 6];

    gridSizes.forEach((size) => {
      it(`shuffles ${size}x${size} board into solvable, unsolved state with <= 50% matched tiles`, () => {
        const shuffled = shuffleBoard(size, 'standard');
        const total = size * size;

        expect(shuffled.length).toBe(total);
        expect(isSolved(shuffled)).toBe(false);

        // Every number 0..total-1 exists exactly once
        const sorted = [...shuffled].sort((a, b) => a - b);
        expect(sorted).toEqual(createSolvedBoard(size));

        // Solved count should be <= 50%
        const matched = countSolvedTiles(shuffled);
        expect(matched).toBeLessThanOrEqual(total * 0.5);
      });
    });
  });

  describe('getKeyboardMoveTarget', () => {
    it('identifies tile that moves in the direction of the arrow', () => {
      // 3x3 board, blank is in center (4)
      // ArrowUp: tile below blank (7) moves up into blank
      expect(getKeyboardMoveTarget('ArrowUp', 4, 3)).toBe(7);

      // ArrowDown: tile above blank (1) moves down into blank
      expect(getKeyboardMoveTarget('ArrowDown', 4, 3)).toBe(1);

      // ArrowLeft: tile right of blank (5) moves left into blank
      expect(getKeyboardMoveTarget('ArrowLeft', 4, 3)).toBe(5);

      // ArrowRight: tile left of blank (3) moves right into blank
      expect(getKeyboardMoveTarget('ArrowRight', 4, 3)).toBe(3);
    });

    it('returns null when movement would exceed grid boundary', () => {
      // blank is at top-left (0)
      // ArrowDown (tile above blank) cannot exist
      expect(getKeyboardMoveTarget('ArrowDown', 0, 3)).toBe(null);
      // ArrowRight (tile left of blank) cannot exist
      expect(getKeyboardMoveTarget('ArrowRight', 0, 3)).toBe(null);
    });
  });
});
