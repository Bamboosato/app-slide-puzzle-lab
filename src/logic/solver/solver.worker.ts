import { SolverWorkerRequest, SolverWorkerResponse } from './types';
import { solvePuzzle } from './solver';
import { calculateManhattanDistance } from './manhattan';

self.onmessage = (event: MessageEvent<SolverWorkerRequest>) => {
  const { id, board, gridSize, timeoutMs } = event.data;
  const startTime = Date.now();

  try {
    const result = solvePuzzle(board, gridSize, timeoutMs);
    const elapsedMs = Date.now() - startTime;

    const response: SolverWorkerResponse = {
      id,
      status: result.solved ? 'exact' : 'timeout',
      moves: result.moves,
      elapsedMs,
    };

    self.postMessage(response);
  } catch (error) {
    const elapsedMs = Date.now() - startTime;
    const fallbackMd = calculateManhattanDistance(board, gridSize);
    const response: SolverWorkerResponse = {
      id,
      status: 'error',
      moves: fallbackMd,
      elapsedMs,
      error: error instanceof Error ? error.message : String(error),
    };
    self.postMessage(response);
  }
};
