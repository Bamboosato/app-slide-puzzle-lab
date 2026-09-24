import { GridSize, ShuffleLevel } from '../types/puzzle';
import { SHUFFLE_MULTIPLIERS } from '../config/constants';

/**
 * 0 から (gridSize^2 - 1) までの完成盤面配列を生成する。
 * 末尾 (gridSize^2 - 1) が空白マスの正解位置（右下端）。
 */
export function createSolvedBoard(gridSize: GridSize): number[] {
  const totalTiles = gridSize * gridSize;
  return Array.from({ length: totalTiles }, (_, i) => i);
}

/**
 * 盤面内の空白マスのインデックスを取得する。
 */
export function getBlankIndex(board: number[], gridSize: GridSize): number {
  const blankId = gridSize * gridSize - 1;
  return board.indexOf(blankId);
}

/**
 * 空白マスに隣接する移動可能なピースのインデックス一覧を取得する。
 */
export function getValidMoves(blankIndex: number, gridSize: GridSize): number[] {
  const row = Math.floor(blankIndex / gridSize);
  const col = blankIndex % gridSize;
  const moves: number[] = [];

  // 上のピース（下へ動かせる）
  if (row > 0) {
    moves.push(blankIndex - gridSize);
  }
  // 下のピース（上へ動かせる）
  if (row < gridSize - 1) {
    moves.push(blankIndex + gridSize);
  }
  // 左のピース（右へ動かせる）
  if (col > 0) {
    moves.push(blankIndex - 1);
  }
  // 右のピース（左へ動かせる）
  if (col < gridSize - 1) {
    moves.push(blankIndex + 1);
  }

  return moves;
}

/**
 * 指定された位置のピースが空白マスと隣接しているかを判定する。
 */
export function canMove(tileIndex: number, blankIndex: number, gridSize: GridSize): boolean {
  const tileRow = Math.floor(tileIndex / gridSize);
  const tileCol = tileIndex % gridSize;
  const blankRow = Math.floor(blankIndex / gridSize);
  const blankCol = blankIndex % gridSize;

  const rowDiff = Math.abs(tileRow - blankRow);
  const colDiff = Math.abs(tileCol - blankCol);

  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

/**
 * ピースを空白マスへ移動する（有効な場合のみスワップした新配列を返す）。
 */
export function moveTile(
  board: number[],
  tileIndex: number,
  gridSize: GridSize
): { newBoard: number[]; moved: boolean; newBlankIndex: number } {
  const blankIndex = getBlankIndex(board, gridSize);
  if (!canMove(tileIndex, blankIndex, gridSize)) {
    return { newBoard: board, moved: false, newBlankIndex: blankIndex };
  }

  const newBoard = [...board];
  newBoard[blankIndex] = board[tileIndex];
  newBoard[tileIndex] = board[blankIndex];

  return { newBoard, moved: true, newBlankIndex: tileIndex };
}

/**
 * 盤面が完成状態であるかを判定する。
 * 各ピースのIDが自身のインデックスと完全一致しているかを確認。
 */
export function isSolved(board: number[]): boolean {
  for (let i = 0; i < board.length; i++) {
    if (board[i] !== i) {
      return false;
    }
  }
  return true;
}

/**
 * 正解位置に留まっているピース数を数える。
 */
export function countSolvedTiles(board: number[]): number {
  let count = 0;
  for (let i = 0; i < board.length; i++) {
    if (board[i] === i) {
      count++;
    }
  }
  return count;
}

/**
 * 合法手シミュレーションにより、必ず解ける盤面を生成する。
 * - 直前手の逆移動除外
 * - 崩れ度合い検証（完成状態の除外 + 正解位置残存率50%以下）
 */
export function shuffleBoard(gridSize: GridSize, level: ShuffleLevel): number[] {
  const totalTiles = gridSize * gridSize;
  const multiplier = SHUFFLE_MULTIPLIERS[level];
  const steps = totalTiles * multiplier;
  const maxAttempts = 20;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let board = createSolvedBoard(gridSize);
    let blankIndex = totalTiles - 1;
    let prevTileIndex = -1;

    for (let step = 0; step < steps; step++) {
      const validMoves = getValidMoves(blankIndex, gridSize);

      // 直前に動かしたピースをそのまま戻す手を除外（候補が他にある場合）
      let candidates = validMoves;
      if (prevTileIndex !== -1 && validMoves.length > 1) {
        const filtered = validMoves.filter((idx) => idx !== prevTileIndex);
        if (filtered.length > 0) {
          candidates = filtered;
        }
      }

      // ランダムに1手選択
      const chosenTileIndex = candidates[Math.floor(Math.random() * candidates.length)];

      // スワップ
      board[blankIndex] = board[chosenTileIndex];
      board[chosenTileIndex] = totalTiles - 1;

      // 次のステップ用に記録
      prevTileIndex = blankIndex;
      blankIndex = chosenTileIndex;
    }

    // 崩れ度合いの検証
    // 1. 完成状態でないこと
    if (isSolved(board)) {
      continue;
    }

    // 2. 正解位置にとどまっているピース数が全体の過半数（50%）以下であること
    const solvedCount = countSolvedTiles(board);
    if (solvedCount <= totalTiles * 0.5) {
      return board;
    }
  }

  // 万一規定回数内に50%以下を引けなかった場合でも、完成状態以外の直近盤面を返す
  let fallbackBoard = createSolvedBoard(gridSize);
  let blankIndex = totalTiles - 1;
  const moves = getValidMoves(blankIndex, gridSize);
  const chosen = moves[0];
  fallbackBoard[blankIndex] = fallbackBoard[chosen];
  fallbackBoard[chosen] = totalTiles - 1;
  return fallbackBoard;
}

/**
 * 矢印キー入力に対する移動対象ピースのインデックスを取得する。
 * 規則: 「空白の方向へピースを動かす」
 * - ArrowUp: 空白の「下」のピースを上へ
 * - ArrowDown: 空白の「上」のピースを下へ
 * - ArrowLeft: 空白の「右」のピースを左へ
 * - ArrowRight: 空白の「左」のピースを右へ
 */
export function getKeyboardMoveTarget(
  key: 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight',
  blankIndex: number,
  gridSize: GridSize
): number | null {
  const blankRow = Math.floor(blankIndex / gridSize);
  const blankCol = blankIndex % gridSize;

  switch (key) {
    case 'ArrowUp':
      // 空白の下のピース
      return blankRow < gridSize - 1 ? blankIndex + gridSize : null;
    case 'ArrowDown':
      // 空白の上のピース
      return blankRow > 0 ? blankIndex - gridSize : null;
    case 'ArrowLeft':
      // 空白の右のピース
      return blankCol < gridSize - 1 ? blankIndex + 1 : null;
    case 'ArrowRight':
      // 空白の左のピース
      return blankCol > 0 ? blankIndex - 1 : null;
  }
}
