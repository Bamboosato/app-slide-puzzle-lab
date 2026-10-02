import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { PuzzlePlayScreen } from './PuzzlePlayScreen';
import * as recordStorage from '../../logic/recordStorage';

// フックのモック化
vi.mock('../../hooks/usePuzzleGame', () => ({
  usePuzzleGame: vi.fn(),
}));

vi.mock('../../hooks/useShortestMoves', () => ({
  useShortestMoves: vi.fn(),
}));

vi.mock('../../hooks/useTimer', () => ({
  useTimer: vi.fn(),
}));

import { usePuzzleGame } from '../../hooks/usePuzzleGame';
import { useShortestMoves } from '../../hooks/useShortestMoves';
import { useTimer } from '../../hooks/useTimer';
import { PuzzleRecord } from '../../types/record';

describe('PuzzlePlayScreen completion save logic', () => {
  let saveRecordSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    HTMLCanvasElement.prototype.toDataURL = vi.fn().mockReturnValue('data:image/jpeg;base64,mock');
    saveRecordSpy = vi.spyOn(recordStorage, 'saveRecord').mockReturnValue({
      rank: 1,
      isNewRecord: true,
    });

    (useTimer as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      seconds: 25,
      isRunning: false,
      start: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      stop: vi.fn(),
      reset: vi.fn(),
    });
  });

  it('waits to save if puzzle completed while shortest moves calculation is ongoing, and saves once when completed with correct kind and completion time', () => {
    let shortestMovesState: any = {
      status: 'calculating',
      moves: null,
      elapsedSeconds: null,
      displayText: '最短 計算中…',
    };

    (useShortestMoves as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => shortestMovesState);

    let onCompletedCallback: () => void = () => {};
    let gameState: any = {
      board: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      initialBoard: [1, 2, 3, 4, 5, 0, 7, 8, 6],
      moves: 20,
      isCompleted: false,
      showNumbers: true,
      moveByTileIndex: vi.fn(),
      handlePieceSwipe: vi.fn(),
      restart: vi.fn(),
      reshuffle: vi.fn(),
      toggleShowNumbers: vi.fn(),
    };

    (usePuzzleGame as unknown as ReturnType<typeof vi.fn>).mockImplementation((options: any) => {
      onCompletedCallback = options.onCompleted;
      return gameState;
    });

    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;

    const { rerender } = render(
      <PuzzlePlayScreen
        pieces={[]}
        fullCroppedCanvas={canvas}
        settings={{ gridSize: 3, shuffleLevel: 'standard', showNumbers: true }}
      />
    );

    // 完成前: 未保存
    expect(saveRecordSpy).not.toHaveBeenCalled();

    // パズルが完成するが、計算はまだ calculating (moves: null)
    act(() => {
      gameState = { ...gameState, isCompleted: true };
      onCompletedCallback(); // finalTimeRef.current = 25 が確定
    });

    rerender(
      <PuzzlePlayScreen
        pieces={[]}
        fullCroppedCanvas={canvas}
        settings={{ gridSize: 3, shuffleLevel: 'standard', showNumbers: true }}
      />
    );

    // まだ計算中なので保存されない
    expect(saveRecordSpy).not.toHaveBeenCalled();

    // タイマーが進んでも (seconds が 30 になったとしても)、完成時の 25 秒が保存されるべき
    (useTimer as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      seconds: 30,
      isRunning: false,
      start: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      stop: vi.fn(),
      reset: vi.fn(),
    });

    // 計算が exact で確定
    act(() => {
      shortestMovesState = {
        status: 'exact',
        moves: 15,
        elapsedSeconds: 0.8,
        displayText: '最短 15手（0.8秒）',
      };
    });

    rerender(
      <PuzzlePlayScreen
        pieces={[]}
        fullCroppedCanvas={canvas}
        settings={{ gridSize: 3, shuffleLevel: 'standard', showNumbers: true }}
      />
    );

    // 確定後に1回だけ保存される
    expect(saveRecordSpy).toHaveBeenCalledTimes(1);
    const savedRecord = saveRecordSpy.mock.calls[0][0] as PuzzleRecord;
    expect(savedRecord.shortestMovesKind).toBe('exact');
    expect(savedRecord.shortestMoves).toBe(15);
    expect(savedRecord.elapsedTime).toBe(25); // 完成時の時間が保存されている
    expect(savedRecord.moves).toBe(20);

    // さらにコンポーネントが再レンダリングされても2回目の保存は行われない
    rerender(
      <PuzzlePlayScreen
        pieces={[]}
        fullCroppedCanvas={canvas}
        settings={{ gridSize: 3, shuffleLevel: 'standard', showNumbers: true }}
      />
    );
    expect(saveRecordSpy).toHaveBeenCalledTimes(1);
  });

  it('saves lower_bound kind when solver finishes with timeout', () => {
    (useShortestMoves as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      status: 'timeout',
      moves: 22,
      elapsedSeconds: 3.0,
      displayText: '最短 22手以上（3.0秒）',
    });

    (usePuzzleGame as unknown as ReturnType<typeof vi.fn>).mockImplementation((_options: unknown) => {
      return {
        board: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        initialBoard: [1, 2, 3, 4, 5, 0, 7, 8, 6],
        moves: 30,
        isCompleted: true,
        showNumbers: true,
        moveByTileIndex: vi.fn(),
        handlePieceSwipe: vi.fn(),
        restart: vi.fn(),
        reshuffle: vi.fn(),
        toggleShowNumbers: vi.fn(),
      };
    });

    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;

    render(
      <PuzzlePlayScreen
        pieces={[]}
        fullCroppedCanvas={canvas}
        settings={{ gridSize: 3, shuffleLevel: 'standard', showNumbers: true }}
      />
    );

    expect(saveRecordSpy).toHaveBeenCalledTimes(1);
    const savedRecord = saveRecordSpy.mock.calls[0][0] as PuzzleRecord;
    expect(savedRecord.shortestMovesKind).toBe('lower_bound');
    expect(savedRecord.shortestMoves).toBe(22);
  });
});
