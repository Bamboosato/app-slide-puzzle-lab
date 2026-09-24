import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePuzzleGame } from './usePuzzleGame';
import * as puzzleLogic from '../logic/puzzleLogic';

describe('usePuzzleGame', () => {
  it('allows moving tiles during normal play via tap, swipe, and keyboard', () => {
    // 3x3 盤面で空白を右下 (index 8) とする
    // [0, 1, 2, 3, 4, 5, 6, 7, 8]
    // 7 をタップすると 8 と入れ替わる
    const onMoveSuccess = vi.fn();
    const { result } = renderHook(() =>
      usePuzzleGame({
        gridSize: 3,
        shuffleLevel: 'standard',
        isInteractionDisabled: false,
        onMoveSuccess,
      })
    );

    // 空白の位置を探す
    const blankIdx = puzzleLogic.getBlankIndex(result.current.board, 3);
    const validMoves = puzzleLogic.getValidMoves(blankIdx, 3);
    const targetTileIndex = validMoves[0];

    act(() => {
      const moved = result.current.moveByTileIndex(targetTileIndex);
      expect(moved).toBe(true);
    });

    expect(result.current.moves).toBe(1);
    expect(onMoveSuccess).toHaveBeenCalledTimes(1);

    // キーボード操作のテスト
    const currentBlankIdx = puzzleLogic.getBlankIndex(result.current.board, 3);
    // 空白マスの周りで ArrowUp 等が有効か探す
    const arrows: Array<'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight'> = [
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
    ];
    let validArrow: 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight' | null = null;
    for (const arrow of arrows) {
      if (puzzleLogic.getKeyboardMoveTarget(arrow, currentBlankIdx, 3) !== null) {
        validArrow = arrow;
        break;
      }
    }

    if (validArrow) {
      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: validArrow! }));
      });
      expect(result.current.moves).toBe(2);
    }
  });

  it('completely ignores tap, swipe, and keyboard when isInteractionDisabled is true', () => {
    const onMoveSuccess = vi.fn();
    let isInteractionDisabled = true;

    const { result, rerender } = renderHook(() =>
      usePuzzleGame({
        gridSize: 3,
        shuffleLevel: 'standard',
        isInteractionDisabled,
        onMoveSuccess,
      })
    );

    const initialBoard = [...result.current.board];
    const blankIdx = puzzleLogic.getBlankIndex(initialBoard, 3);
    const validMoves = puzzleLogic.getValidMoves(blankIdx, 3);
    const targetTileIndex = validMoves[0];

    // 1. タップ/クリックを試みる
    act(() => {
      const moved = result.current.moveByTileIndex(targetTileIndex);
      expect(moved).toBe(false);
    });
    expect(result.current.moves).toBe(0);
    expect(result.current.board).toEqual(initialBoard);
    expect(onMoveSuccess).not.toHaveBeenCalled();

    // 2. スワイプを試みる
    act(() => {
      result.current.handlePieceSwipe(targetTileIndex, 'up');
      result.current.handlePieceSwipe(targetTileIndex, 'down');
      result.current.handlePieceSwipe(targetTileIndex, 'left');
      result.current.handlePieceSwipe(targetTileIndex, 'right');
    });
    expect(result.current.moves).toBe(0);
    expect(result.current.board).toEqual(initialBoard);

    // 3. キーボードを試みる
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    });
    expect(result.current.moves).toBe(0);
    expect(result.current.board).toEqual(initialBoard);

    // モーダルやポーズが解除された場合 (isInteractionDisabled = false)
    isInteractionDisabled = false;
    rerender();

    // 再開後は操作できる
    act(() => {
      const moved = result.current.moveByTileIndex(targetTileIndex);
      expect(moved).toBe(true);
    });
    expect(result.current.moves).toBe(1);
    expect(result.current.board).not.toEqual(initialBoard);
  });

  it('disables all interactions once the puzzle is completed', () => {
    const onCompleted = vi.fn();
    // 完成直前（1手前）の盤面を初期盤面としてモック
    // [0, 1, 2, 3, 4, 5, 6, 8, 7] -> 7 (index 8) をタップすると完成 [0, 1, 2, 3, 4, 5, 6, 7, 8]
    const almostSolved = [0, 1, 2, 3, 4, 5, 6, 8, 7];
    const shuffleSpy = vi.spyOn(puzzleLogic, 'shuffleBoard').mockReturnValueOnce(almostSolved);

    const { result } = renderHook(() =>
      usePuzzleGame({
        gridSize: 3,
        shuffleLevel: 'light',
        isInteractionDisabled: false,
        onCompleted,
      })
    );

    // 7 (index 8) を動かして完成させる
    act(() => {
      const moved = result.current.moveByTileIndex(8);
      expect(moved).toBe(true);
    });

    expect(result.current.isCompleted).toBe(true);
    expect(onCompleted).toHaveBeenCalledTimes(1);

    // 完成後は追加の操作（クリックやキーボード）が拒否される
    act(() => {
      const movedAgain = result.current.moveByTileIndex(7);
      expect(movedAgain).toBe(false);
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    });

    expect(result.current.moves).toBe(1); // 1回の移動のみ
    shuffleSpy.mockRestore();
  });
});
