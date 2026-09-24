import { GridSize } from '../../types/puzzle';
import { ShortestMovesStatus } from './types';

/**
 * 空白マスを除く全ピースのマンハッタン距離の合計を計算する。
 * 正解配置における各ピースの位置 (goalRow, goalCol) と現在位置 (currRow, currCol) の差の絶対値の総和。
 */
export function calculateManhattanDistance(board: number[], gridSize: GridSize): number {
  const totalTiles = gridSize * gridSize;
  const blankId = totalTiles - 1;
  let distance = 0;

  for (let i = 0; i < totalTiles; i++) {
    const tile = board[i];
    if (tile === blankId) {
      continue; // 空白マスは除外
    }

    const currRow = Math.floor(i / gridSize);
    const currCol = i % gridSize;
    const goalRow = Math.floor(tile / gridSize);
    const goalCol = tile % gridSize;

    distance += Math.abs(currRow - goalRow) + Math.abs(currCol - goalCol);
  }

  return distance;
}

/**
 * 線形コンフリクト（Linear Conflict）の追加コストを計算する。
 * 同一行・同一列にある2つのピースが、共にその行・列を目標としており、かつ位置関係が反転している場合、
 * 一方が他行・他列に退避して戻る必要があるため、1ペアにつき +2 手が最低限必要となる。
 * この値は admissible（過大評価しない）であり、マンハッタン距離と合算可能。
 */
export function calculateLinearConflict(board: number[], gridSize: GridSize): number {
  const blankId = gridSize * gridSize - 1;
  let conflicts = 0;

  // 1. 行方向のコンフリクト検査
  for (let row = 0; row < gridSize; row++) {
    const rowOffset = row * gridSize;
    for (let i = 0; i < gridSize; i++) {
      const tileA = board[rowOffset + i];
      if (tileA === blankId) continue;
      // tileA の目標行が現在の row と一致するか
      if (Math.floor(tileA / gridSize) !== row) continue;

      for (let j = i + 1; j < gridSize; j++) {
        const tileB = board[rowOffset + j];
        if (tileB === blankId) continue;
        // tileB の目標行も現在の row と一致するか
        if (Math.floor(tileB / gridSize) !== row) continue;

        // i < j なのに tileA の目標列 > tileB の目標列 であれば反転（コンフリクト）
        const goalColA = tileA % gridSize;
        const goalColB = tileB % gridSize;
        if (goalColA > goalColB) {
          conflicts++;
        }
      }
    }
  }

  // 2. 列方向のコンフリクト検査
  for (let col = 0; col < gridSize; col++) {
    for (let i = 0; i < gridSize; i++) {
      const tileA = board[i * gridSize + col];
      if (tileA === blankId) continue;
      // tileA の目標列が現在の col と一致するか
      if (tileA % gridSize !== col) continue;

      for (let j = i + 1; j < gridSize; j++) {
        const tileB = board[j * gridSize + col];
        if (tileB === blankId) continue;
        // tileB の目標列も現在の col と一致するか
        if (tileB % gridSize !== col) continue;

        // i < j なのに tileA の目標行 > tileB の目標行 であれば反転（コンフリクト）
        const goalRowA = Math.floor(tileA / gridSize);
        const goalRowB = Math.floor(tileB / gridSize);
        if (goalRowA > goalRowB) {
          conflicts++;
        }
      }
    }
  }

  return conflicts;
}

/**
 * マンハッタン距離 + 線形コンフリクト (h = MD + 2 * LC) を計算する。
 */
export function calculateHeuristic(board: number[], gridSize: GridSize): number {
  const md = calculateManhattanDistance(board, gridSize);
  const lc = calculateLinearConflict(board, gridSize);
  return md + 2 * lc;
}

/**
 * 状態と数値に応じた表示用文字列を生成する。
 *
 * 表示例:
 * - 探索中: `最短 計算中…`
 * - 確定: `最短 42手（0.5秒）`
 * - タイムアウト: `最短 32手以上（3.0秒）`
 * - 下限のみ (5x5, 6x6): `最短 32手以上`
 * - エラー時: `最短 32手以上`
 */
export function formatShortestMoves(
  status: ShortestMovesStatus,
  moves: number | null,
  elapsedSeconds: number | null
): string {
  switch (status) {
    case 'calculating':
    case 'idle':
      return '最短 計算中…';

    case 'exact':
      if (moves === null) return '最短 計算中…';
      if (elapsedSeconds !== null) {
        return `最短 ${moves}手（${elapsedSeconds.toFixed(1)}秒）`;
      }
      return `最短 ${moves}手`;

    case 'timeout':
      if (moves === null) return '最短 計算中…';
      if (elapsedSeconds !== null) {
        return `最短 ${moves}手以上（${elapsedSeconds.toFixed(1)}秒）`;
      }
      return `最短 ${moves}手以上`;

    case 'lower_bound':
    case 'error':
      if (moves === null) return '最短 計算中…';
      return `最短 ${moves}手以上`;

    default:
      return '最短 計算中…';
  }
}
