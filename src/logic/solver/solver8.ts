import { createSolvedBoard } from '../puzzleLogic';

/**
 * 3x3 盤面を BigInt (36ビット) にエンコード
 */
export function encodeBoard3(b: number[]): bigint {
  let code = 0n;
  for (let i = 0; i < 9; i++) {
    code = (code << 4n) | BigInt(b[i]);
  }
  return code;
}

/**
 * 3x3 の双方向幅優先探索 (Bidirectional BFS) による厳密最短手数の算出。
 * 8パズルの全状態空間は 181,440 であり、双方向BFSなら深さ15〜16手で交差するため、
 * 探索ノード数は最悪でも数千ノード程度。数ミリ秒〜数十ミリ秒で100%確実に解ける。
 */
export function solve3x3BidirectionalBFS(
  initialBoard: number[],
  timeoutMs: number = 3000
): { solved: boolean; moves: number; elapsedMs: number; timedOut: boolean } {
  const startTime = Date.now();
  const deadline = startTime + timeoutMs;

  const solvedBoard = createSolvedBoard(3);
  const startCode = encodeBoard3(initialBoard);
  const goalCode = encodeBoard3(solvedBoard);

  if (startCode === goalCode) {
    return { solved: true, moves: 0, elapsedMs: Date.now() - startTime, timedOut: false };
  }

  // 前方向探索用
  const forwardVisited = new Map<bigint, number>();
  const forwardQueue: { board: number[]; code: bigint; blankPos: number; depth: number }[] = [];

  // 後方向探索用
  const backwardVisited = new Map<bigint, number>();
  const backwardQueue: { board: number[]; code: bigint; blankPos: number; depth: number }[] = [];

  forwardVisited.set(startCode, 0);
  forwardQueue.push({
    board: [...initialBoard],
    code: startCode,
    blankPos: initialBoard.indexOf(8),
    depth: 0,
  });

  backwardVisited.set(goalCode, 0);
  backwardQueue.push({
    board: [...solvedBoard],
    code: goalCode,
    blankPos: 8,
    depth: 0,
  });

  let headF = 0;
  let headB = 0;

  // 隣接移動インデックス表 (3x3固定)
  const neighbors = [
    [1, 3],       // 0
    [0, 2, 4],    // 1
    [1, 5],       // 2
    [0, 4, 6],    // 3
    [1, 3, 5, 7], // 4
    [2, 4, 8],    // 5
    [3, 7],       // 6
    [4, 6, 8],    // 7
    [5, 7],       // 8
  ];

  while (headF < forwardQueue.length && headB < backwardQueue.length) {
    if ((headF + headB) % 500 === 0 && Date.now() >= deadline) {
      return { solved: false, moves: -1, elapsedMs: Date.now() - startTime, timedOut: true };
    }

    // キューの残りが少ない側を1ノード展開（バランス維持）
    const expandForward = (forwardQueue.length - headF) <= (backwardQueue.length - headB);

    if (expandForward) {
      const current = forwardQueue[headF++];
      const cDepth = current.depth;
      const bPos = current.blankPos;
      const nextMoves = neighbors[bPos];

      for (let i = 0; i < nextMoves.length; i++) {
        const nextPos = nextMoves[i];
        const nextBoard = [...current.board];
        nextBoard[bPos] = nextBoard[nextPos];
        nextBoard[nextPos] = 8;
        const nextCode = encodeBoard3(nextBoard);

        // ゴール側から到達済みか確認
        const bDist = backwardVisited.get(nextCode);
        if (bDist !== undefined) {
          return {
            solved: true,
            moves: cDepth + 1 + bDist,
            elapsedMs: Date.now() - startTime,
            timedOut: false,
          };
        }

        if (!forwardVisited.has(nextCode)) {
          forwardVisited.set(nextCode, cDepth + 1);
          forwardQueue.push({
            board: nextBoard,
            code: nextCode,
            blankPos: nextPos,
            depth: cDepth + 1,
          });
        }
      }
    } else {
      const current = backwardQueue[headB++];
      const cDepth = current.depth;
      const bPos = current.blankPos;
      const nextMoves = neighbors[bPos];

      for (let i = 0; i < nextMoves.length; i++) {
        const nextPos = nextMoves[i];
        const nextBoard = [...current.board];
        nextBoard[bPos] = nextBoard[nextPos];
        nextBoard[nextPos] = 8;
        const nextCode = encodeBoard3(nextBoard);

        // スタート側から到達済みか確認
        const fDist = forwardVisited.get(nextCode);
        if (fDist !== undefined) {
          return {
            solved: true,
            moves: fDist + cDepth + 1,
            elapsedMs: Date.now() - startTime,
            timedOut: false,
          };
        }

        if (!backwardVisited.has(nextCode)) {
          backwardVisited.set(nextCode, cDepth + 1);
          backwardQueue.push({
            board: nextBoard,
            code: nextCode,
            blankPos: nextPos,
            depth: cDepth + 1,
          });
        }
      }
    }
  }

  return { solved: false, moves: -1, elapsedMs: Date.now() - startTime, timedOut: false };
}
