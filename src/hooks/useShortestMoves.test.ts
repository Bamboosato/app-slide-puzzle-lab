import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useShortestMoves } from './useShortestMoves';
import { createSolvedBoard, moveTile } from '../logic/puzzleLogic';

describe('useShortestMoves', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('5x5 の場合は探索を行わず即座に下限（秒数なし）を表示すること', () => {
    const solved5 = createSolvedBoard(5);
    // 1手動かす
    const { newBoard } = moveTile(solved5, 23, 5);

    const { result } = renderHook(() =>
      useShortestMoves({
        initialBoard: newBoard,
        gridSize: 5,
      })
    );

    expect(result.current.status).toBe('lower_bound');
    expect(result.current.moves).toBe(1);
    expect(result.current.elapsedSeconds).toBeNull();
    expect(result.current.displayText).toBe('最短 1手以上');
  });

  it('6x6 の場合は探索を行わず即座に下限（秒数なし）を表示すること', () => {
    const solved6 = createSolvedBoard(6);
    const { newBoard } = moveTile(solved6, 34, 6);

    const { result } = renderHook(() =>
      useShortestMoves({
        initialBoard: newBoard,
        gridSize: 6,
      })
    );

    expect(result.current.status).toBe('lower_bound');
    expect(result.current.moves).toBe(1);
    expect(result.current.displayText).toBe('最短 1手以上');
  });

  it('Worker環境下で確定値レスポンスを受信した際に exact 表示に更新されること', () => {
    // Workerのモック
    let postMessageListener: ((e: MessageEvent) => void) | null = null;
    let workerPostMessageSpy = vi.fn();

    class MockWorker {
      onmessage: ((e: MessageEvent) => void) | null = null;
      onerror: ((e: ErrorEvent) => void) | null = null;
      terminate = vi.fn();
      postMessage = workerPostMessageSpy;

      constructor() {
        postMessageListener = (e: MessageEvent) => {
          this.onmessage?.(e);
        };
      }
    }

    vi.stubGlobal('Worker', MockWorker);

    const board = createSolvedBoard(3);
    const { result } = renderHook(() =>
      useShortestMoves({
        initialBoard: board,
        gridSize: 3,
      })
    );

    // 初期状態は calculating
    expect(result.current.status).toBe('calculating');
    expect(result.current.displayText).toBe('最短 計算中…');

    // Workerから確定メッセージを受信
    const lastRequest = workerPostMessageSpy.mock.calls[0][0];
    act(() => {
      postMessageListener?.({
        data: {
          id: lastRequest.id,
          status: 'exact',
          moves: 0,
          elapsedMs: 50,
        },
      } as MessageEvent);
    });

    expect(result.current.status).toBe('exact');
    expect(result.current.moves).toBe(0);
    expect(result.current.displayText).toMatch(/^最短 0手（\d+\.\d秒）$/);
  });

  it('3000msタイムアウト時に timeout 表示（下限＋実測秒数）に切り替わること', () => {
    class MockWorker {
      onmessage: ((e: MessageEvent) => void) | null = null;
      onerror: ((e: ErrorEvent) => void) | null = null;
      terminate = vi.fn();
      postMessage = vi.fn();
    }

    vi.stubGlobal('Worker', MockWorker);

    const solved = createSolvedBoard(4);
    const { newBoard } = moveTile(solved, 14, 4);

    const { result } = renderHook(() =>
      useShortestMoves({
        initialBoard: newBoard,
        gridSize: 4,
      })
    );

    expect(result.current.status).toBe('calculating');

    // 3000ms 進める
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.status).toBe('timeout');
    expect(result.current.moves).toBe(1); // 初期マンハッタン距離
    expect(result.current.displayText).toMatch(/^最短 1手以上（\d+\.\d秒）$/);
  });

  it('古い盤面のリクエストに対するレスポンスは破棄されること', () => {
    let postMessageListener: ((e: MessageEvent) => void) | null = null;
    class MockWorker {
      onmessage: ((e: MessageEvent) => void) | null = null;
      onerror: ((e: ErrorEvent) => void) | null = null;
      terminate = vi.fn();
      postMessage = vi.fn();

      constructor() {
        postMessageListener = (e: MessageEvent) => {
          this.onmessage?.(e);
        };
      }
    }

    vi.stubGlobal('Worker', MockWorker);

    const board1 = createSolvedBoard(3);
    const { result, rerender } = renderHook(
      ({ initialBoard }) =>
        useShortestMoves({
          initialBoard,
          gridSize: 3,
        }),
      { initialProps: { initialBoard: board1 } }
    );

    // 盤面を更新（再シャッフル）
    const board2 = moveTile(board1, 7, 3).newBoard;
    rerender({ initialBoard: board2 });

    // 古いリクエストIDでレスポンスが届く
    act(() => {
      postMessageListener?.({
        data: {
          id: 'old-stale-id',
          status: 'exact',
          moves: 99,
          elapsedMs: 10,
        },
      } as MessageEvent);
    });

    // 古いレスポンスは無視され、calculatingのまま
    expect(result.current.status).toBe('calculating');
    expect(result.current.moves).toBeNull();
  });
});
