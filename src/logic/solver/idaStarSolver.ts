import { GridSize } from '../../types/puzzle';
import { calculateManhattanDistance, calculateLinearConflict } from './manhattan';

export interface SolverResult {
  solved: boolean;
  moves: number; // 確定した最短手数、またはマンハッタン距離
  elapsedMs: number;
  timedOut: boolean;
}

/**
 * 3x3 および 4x4 のスライドパズルに対する IDA* (Iterative Deepening A*) 厳密解ソルバー。
 * - ヒューリスティック: マンハッタン距離 + 線形コンフリクト (Linear Conflict)
 * - 制限時間（デフォルト 3,000ms）を超えた場合は探索を安全に中断
 */
export function solvePuzzleIDAStar(
  initialBoard: number[],
  gridSize: GridSize,
  timeoutMs: number = 3000
): SolverResult {
  const startTime = Date.now();
  const deadline = startTime + timeoutMs;
  const totalTiles = gridSize * gridSize;
  const blankId = totalTiles - 1;

  // 初期マンハッタン距離（下限値として保持）
  const initialManhattan = calculateManhattanDistance(initialBoard, gridSize);

  // すでに完成状態の場合
  let isAlreadySolved = true;
  for (let i = 0; i < totalTiles; i++) {
    if (initialBoard[i] !== i) {
      isAlreadySolved = false;
      break;
    }
  }
  if (isAlreadySolved) {
    return {
      solved: true,
      moves: 0,
      elapsedMs: Date.now() - startTime,
      timedOut: false,
    };
  }

  // 空白位置の探索
  const blankIndex = initialBoard.indexOf(blankId);
  const currentBoard = [...initialBoard];

  // 初期しきい値
  const initialHeuristic = initialManhattan + 2 * calculateLinearConflict(currentBoard, gridSize);
  let threshold = initialHeuristic;

  // タイムアウト監視用カウンタ
  let nodeCount = 0;
  let isTimedOut = Date.now() >= deadline;

  if (isTimedOut) {
    return {
      solved: false,
      moves: initialManhattan,
      elapsedMs: Date.now() - startTime,
      timedOut: true,
    };
  }

  // IDA* 再帰関数
  // g: 現在の手数, blankPos: 空白の位置, prevBlankPos: 直前の空白位置（逆戻り枝刈り用）
  function search(g: number, blankPos: number, prevBlankPos: number, currentMd: number): number {
    nodeCount++;
    if ((nodeCount & 511) === 0) {
      if (Date.now() >= deadline) {
        isTimedOut = true;
        return Infinity;
      }
    }

    const lc = calculateLinearConflict(currentBoard, gridSize);
    const h = currentMd + 2 * lc;
    const f = g + h;

    if (f > threshold) {
      return f;
    }

    if (h === 0) {
      // ゴール到達確認
      let matched = true;
      for (let i = 0; i < totalTiles; i++) {
        if (currentBoard[i] !== i) {
          matched = false;
          break;
        }
      }
      if (matched) {
        return -g; // 完成時の手数を負の値で合図
      }
    }

    let minThreshold = Infinity;

    // 空白マスに隣接する合法手の探索
    const blankRow = Math.floor(blankPos / gridSize);
    const blankCol = blankPos % gridSize;

    // 上、下、左、右
    const neighbors: number[] = [];
    if (blankRow > 0) neighbors.push(blankPos - gridSize);
    if (blankRow < gridSize - 1) neighbors.push(blankPos + gridSize);
    if (blankCol > 0) neighbors.push(blankPos - 1);
    if (blankCol < gridSize - 1) neighbors.push(blankPos + 1);

    for (let i = 0; i < neighbors.length; i++) {
      const nextPos = neighbors[i];
      if (nextPos === prevBlankPos) {
        continue; // 直前の一手へ戻る枝を刈る
      }

      const movedTile = currentBoard[nextPos];
      // マンハッタン距離の差分更新
      const goalRow = Math.floor(movedTile / gridSize);
      const goalCol = movedTile % gridSize;

      const oldTileRow = Math.floor(nextPos / gridSize);
      const oldTileCol = nextPos % gridSize;
      const newTileRow = blankRow;
      const newTileCol = blankCol;

      const oldDist = Math.abs(oldTileRow - goalRow) + Math.abs(oldTileCol - goalCol);
      const newDist = Math.abs(newTileRow - goalRow) + Math.abs(newTileCol - goalCol);
      const nextMd = currentMd - oldDist + newDist;

      // 盤面更新
      currentBoard[blankPos] = movedTile;
      currentBoard[nextPos] = blankId;

      const t = search(g + 1, nextPos, blankPos, nextMd);

      // 盤面復帰（バックトラック）
      currentBoard[nextPos] = movedTile;
      currentBoard[blankPos] = blankId;

      if (t < 0) {
        return t; // 解発見
      }
      if (isTimedOut) {
        return Infinity;
      }
      if (t < minThreshold) {
        minThreshold = t;
      }
    }

    return minThreshold;
  }

  // 反復深化ループ
  while (threshold <= 100) {
    const t = search(0, blankIndex, -1, initialManhattan);

    if (t < 0) {
      // 解が見つかった（-g が返る）
      return {
        solved: true,
        moves: -t,
        elapsedMs: Date.now() - startTime,
        timedOut: false,
      };
    }

    if (t === Infinity || isTimedOut || Date.now() >= deadline) {
      break;
    }

    threshold = t;
  }

  // タイムアウトまたは上限到達
  return {
    solved: false,
    moves: initialManhattan, // フォールバックとして初期マンハッタン距離を返す
    elapsedMs: Date.now() - startTime,
    timedOut: true,
  };
}
