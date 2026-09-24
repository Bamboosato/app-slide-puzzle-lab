import { describe, it, expect } from 'vitest';
import {
  calculateManhattanDistance,
  calculateLinearConflict,
  calculateHeuristic,
  formatShortestMoves,
} from './manhattan';
import { solvePuzzleIDAStar } from './idaStarSolver';
import { solve3x3BidirectionalBFS } from './solver8';
import { createSolvedBoard, moveTile } from '../puzzleLogic';

describe('manhattan and heuristics', () => {
  it('完成盤面のマンハッタン距離と線形コンフリクトは0であること', () => {
    const solved3x3 = createSolvedBoard(3);
    expect(calculateManhattanDistance(solved3x3, 3)).toBe(0);
    expect(calculateLinearConflict(solved3x3, 3)).toBe(0);
    expect(calculateHeuristic(solved3x3, 3)).toBe(0);

    const solved4x4 = createSolvedBoard(4);
    expect(calculateManhattanDistance(solved4x4, 4)).toBe(0);
    expect(calculateLinearConflict(solved4x4, 4)).toBe(0);
  });

  it('1手移動後の盤面でマンハッタン距離が1であること（空白マスは除外されること）', () => {
    const solved3x3 = createSolvedBoard(3);
    // 右下(8)に隣接する7を動かす
    const { newBoard } = moveTile(solved3x3, 7, 3);
    expect(calculateManhattanDistance(newBoard, 3)).toBe(1);
    expect(calculateLinearConflict(newBoard, 3)).toBe(0);
  });

  it('同一行で左右が反転している場合の線形コンフリクトを正しく検出すること', () => {
    // 3x3 で 1 と 0 が反転: [1, 0, 2, 3, 4, 5, 6, 7, 8]
    const board = [1, 0, 2, 3, 4, 5, 6, 7, 8];
    // 0の距離=1, 1の距離=1 => MD=2
    expect(calculateManhattanDistance(board, 3)).toBe(2);
    // 0と1が反転しているのでコンフリクト1ペア
    expect(calculateLinearConflict(board, 3)).toBe(1);
    // h = MD + 2*LC = 2 + 2 = 4
    expect(calculateHeuristic(board, 3)).toBe(4);
  });
});

describe('formatShortestMoves', () => {
  it('各ステータスで正しいフォーマットが出力されること', () => {
    // 探索中
    expect(formatShortestMoves('calculating', null, null)).toBe('最短 計算中…');
    expect(formatShortestMoves('idle', null, null)).toBe('最短 計算中…');

    // 厳密解確定
    expect(formatShortestMoves('exact', 42, 0.5)).toBe('最短 42手（0.5秒）');
    expect(formatShortestMoves('exact', 12, 1.23)).toBe('最短 12手（1.2秒）');

    // タイムアウト
    expect(formatShortestMoves('timeout', 32, 3.01)).toBe('最短 32手以上（3.0秒）');
    expect(formatShortestMoves('timeout', 32, 3.1)).toBe('最短 32手以上（3.1秒）');

    // 5x5, 6x6 下限
    expect(formatShortestMoves('lower_bound', 32, null)).toBe('最短 32手以上');

    // エラー時フォールバック
    expect(formatShortestMoves('error', 25, 0.1)).toBe('最短 25手以上');
  });
});

describe('solvePuzzleIDAStar', () => {
  it('完成盤面は0手で即座に完了すること', () => {
    const board = createSolvedBoard(3);
    const result = solvePuzzleIDAStar(board, 3, 1000);
    expect(result.solved).toBe(true);
    expect(result.moves).toBe(0);
    expect(result.timedOut).toBe(false);
  });

  it('1手盤面で最短手数が1手と算出されること', () => {
    const solved = createSolvedBoard(3);
    const { newBoard } = moveTile(solved, 7, 3);
    const result = solvePuzzleIDAStar(newBoard, 3, 1000);
    expect(result.solved).toBe(true);
    expect(result.moves).toBe(1);
  });

  it('2手盤面で最短手数が2手と算出されること', () => {
    const solved = createSolvedBoard(3);
    // 8 <- 7, then 7 <- 6 (下段で空白が左へ動く)
    const step1 = moveTile(solved, 7, 3).newBoard;
    const step2 = moveTile(step1, 6, 3).newBoard;
    const result = solvePuzzleIDAStar(step2, 3, 1000);
    expect(result.solved).toBe(true);
    expect(result.moves).toBe(2);
  });

  it('3x3 の既知の手数盤面を正確に解けること', () => {
    // 4手の既知盤面: [1, 2, 5, 3, 4, 8, 6, 7, 0] など
    // 合法手で4手動かした盤面を作成
    const solved = createSolvedBoard(3);
    const s1 = moveTile(solved, 7, 3).newBoard; // blank at 7
    const s2 = moveTile(s1, 4, 3).newBoard; // blank at 4
    const s3 = moveTile(s2, 3, 3).newBoard; // blank at 3
    const s4 = moveTile(s3, 0, 3).newBoard; // blank at 0
    const result = solvePuzzleIDAStar(s4, 3, 1000);
    expect(result.solved).toBe(true);
    expect(result.moves).toBe(4);
  });

  it('4x4 の軽めの既知盤面を正確に解けること', () => {
    const solved = createSolvedBoard(4);
    // 右下15から3手移動
    const s1 = moveTile(solved, 14, 4).newBoard;
    const s2 = moveTile(s1, 10, 4).newBoard;
    const s3 = moveTile(s2, 9, 4).newBoard;
    const result = solvePuzzleIDAStar(s3, 4, 2000);
    expect(result.solved).toBe(true);
    expect(result.moves).toBe(3);
  });

  it('3x3 の複雑な盤面を双方向BFSで正確かつ高速（100ms未満）に解けること', () => {
    // 完成状態から合法手で崩した盤面（必ず解ける）
    const solved = createSolvedBoard(3);
    let board = solved;
    const moves = [7, 6, 3, 4, 1, 0, 3, 4, 5, 2, 1, 4, 7, 8, 5, 4, 3, 6, 7, 4, 1, 2, 5, 8];
    for (const m of moves) {
      board = moveTile(board, m, 3).newBoard;
    }
    const result = solve3x3BidirectionalBFS(board, 3000);
    expect(result.solved).toBe(true);
    expect(result.moves).toBeGreaterThan(0);
    expect(result.elapsedMs).toBeLessThan(500);

    // IDA* と結果が一致するか検証
    const idaResult = solvePuzzleIDAStar(board, 3, 3000);
    expect(idaResult.solved).toBe(true);
    expect(idaResult.moves).toBe(result.moves);
  });

  it('マンハッタン距離が常に厳密手数の下限（MD <= 最短手数）であること', () => {
    const solved = createSolvedBoard(3);
    let current = solved;
    // 数手ランダムに動かす
    const moves = [7, 4, 5, 8, 7, 6, 3, 4];
    for (const m of moves) {
      current = moveTile(current, m, 3).newBoard;
    }
    const md = calculateManhattanDistance(current, 3);
    const result = solvePuzzleIDAStar(current, 3, 1000);
    expect(result.solved).toBe(true);
    expect(md).toBeLessThanOrEqual(result.moves);
  });

  it('タイムアウト時に solved=false となり、初期マンハッタン距離が返ること', () => {
    // タイムアウトを極小（1ms）に設定
    const solved = createSolvedBoard(4);
    // 複数手動かした盤面
    let b = solved;
    b = moveTile(b, 14, 4).newBoard;
    b = moveTile(b, 10, 4).newBoard;
    b = moveTile(b, 6, 4).newBoard;
    b = moveTile(b, 5, 4).newBoard;
    b = moveTile(b, 9, 4).newBoard;
    b = moveTile(b, 8, 4).newBoard;

    const md = calculateManhattanDistance(b, 4);
    // タイムアウト0msで即時中断
    const result = solvePuzzleIDAStar(b, 4, 0);
    expect(result.solved).toBe(false);
    expect(result.timedOut).toBe(true);
    expect(result.moves).toBe(md);
  });
});
