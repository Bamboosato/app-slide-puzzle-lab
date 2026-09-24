import { GridSize } from '../../types/puzzle';
import { calculateManhattanDistance } from './manhattan';
import { solve3x3BidirectionalBFS } from './solver8';
import { solvePuzzleIDAStar, SolverResult } from './idaStarSolver';

/**
 * スライドパズルの最短手数計算エントリポイント
 *
 * - 3x3: 双方向BFSにより数ms〜数十msで厳密解を高速算出
 * - 4x4: IDA* (Manhattan Distance + Linear Conflict) により厳密解を試算（上限 timeoutMs）
 * - 5x5, 6x6: 探索対象外。マンハッタン距離による下限値を即時返却
 */
export function solvePuzzle(
  board: number[],
  gridSize: GridSize,
  timeoutMs: number = 3000
): SolverResult {
  const startTime = Date.now();
  const initialMd = calculateManhattanDistance(board, gridSize);

  // 5x5, 6x6 は探索せず即時下限
  if (gridSize >= 5) {
    return {
      solved: false,
      moves: initialMd,
      elapsedMs: Date.now() - startTime,
      timedOut: false,
    };
  }

  // 3x3: 双方向BFS
  if (gridSize === 3) {
    return solve3x3BidirectionalBFS(board, timeoutMs);
  }

  // 4x4: IDA*
  return solvePuzzleIDAStar(board, gridSize, timeoutMs);
}
