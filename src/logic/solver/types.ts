import { GridSize } from '../../types/puzzle';

export type ShortestMovesStatus =
  | 'idle'
  | 'calculating' // 3x3, 4x4 探索中
  | 'exact' // 厳密解確定
  | 'timeout' // 3秒タイムアウトで下限確定
  | 'lower_bound' // 5x5, 6x6 即時下限
  | 'error'; // Workerエラー等で下限フォールバック

export interface ShortestMovesResult {
  status: ShortestMovesStatus;
  moves: number | null; // 最短手数または下限手数
  elapsedSeconds: number | null; // 実測経過時間（秒、小数第1位）
  displayText: string; // 表示用フォーマット済み文字列
}

export interface SolverWorkerRequest {
  id: string; // 盤面リクエストID
  board: number[];
  gridSize: GridSize;
  timeoutMs: number;
}

export interface SolverWorkerResponse {
  id: string;
  status: 'exact' | 'timeout' | 'error';
  moves: number; // 確定した最短手数、またはマンハッタン距離
  elapsedMs: number; // 実測経過ミリ秒
  error?: string;
}
