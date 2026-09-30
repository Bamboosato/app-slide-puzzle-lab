import { GridSize, ShuffleLevel } from './puzzle';

/** 1件のパズル記録 */
export interface PuzzleRecord {
  id: string;                    // crypto.randomUUID()
  timestamp: number;             // Date.now()
  gridSize: GridSize;
  shuffleLevel: ShuffleLevel;
  initialBoard: number[];        // シャッフル後の初期タイル配置（リプレイ用）
  moves: number;                 // 実際の手数
  elapsedTime: number;           // 経過時間（秒）
  shortestMoves: number;         // 最短手数
  rating: number;                // ★評価（0〜3）
}

/** カテゴリキー */
export type RecordCategoryKey = `${GridSize}-${ShuffleLevel}`;
