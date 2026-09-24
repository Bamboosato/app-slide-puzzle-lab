import { useState, useEffect, useRef } from 'react';
import { GridSize } from '../types/puzzle';
import {
  ShortestMovesResult,
  SolverWorkerRequest,
  SolverWorkerResponse,
} from '../logic/solver/types';
import { calculateManhattanDistance, formatShortestMoves } from '../logic/solver/manhattan';
import { SHORTEST_MOVES_TIMEOUT_MS } from '../config/constants';

interface UseShortestMovesProps {
  initialBoard: number[];
  gridSize: GridSize;
}

export function useShortestMoves({
  initialBoard,
  gridSize,
}: UseShortestMovesProps): ShortestMovesResult {
  const [result, setResult] = useState<ShortestMovesResult>(() => {
    const md = calculateManhattanDistance(initialBoard, gridSize);
    if (gridSize >= 5) {
      return {
        status: 'lower_bound',
        moves: md,
        elapsedSeconds: null,
        displayText: formatShortestMoves('lower_bound', md, null),
      };
    }
    return {
      status: 'calculating',
      moves: null,
      elapsedSeconds: null,
      displayText: formatShortestMoves('calculating', null, null),
    };
  });

  const workerRef = useRef<Worker | null>(null);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const currentRequestIdRef = useRef<string>('');

  useEffect(() => {
    // 5x5, 6x6 は探索を行わず、初期マンハッタン距離を即時表示
    const initialMd = calculateManhattanDistance(initialBoard, gridSize);

    if (gridSize >= 5) {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      setResult({
        status: 'lower_bound',
        moves: initialMd,
        elapsedSeconds: null,
        displayText: formatShortestMoves('lower_bound', initialMd, null),
      });
      return;
    }

    // 3x3, 4x4 の探索開始
    // 前回の Worker とタイマーを停止
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }

    const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    currentRequestIdRef.current = requestId;
    const requestStartTime = performance.now();

    setResult({
      status: 'calculating',
      moves: null,
      elapsedSeconds: null,
      displayText: formatShortestMoves('calculating', null, null),
    });

    // Web Worker がサポートされていない環境（一部のSSRやテスト環境等）の安全フォールバック
    if (typeof Worker === 'undefined') {
      const elapsedSeconds = Number(((performance.now() - requestStartTime) / 1000).toFixed(1));
      setResult({
        status: 'lower_bound',
        moves: initialMd,
        elapsedSeconds,
        displayText: formatShortestMoves('lower_bound', initialMd, null),
      });
      return;
    }

    try {
      const worker = new Worker(
        new URL('../logic/solver/solver.worker.ts', import.meta.url),
        { type: 'module' }
      );
      workerRef.current = worker;

      // メインスレッド側での打ち切りタイマー
      timeoutIdRef.current = setTimeout(() => {
        if (currentRequestIdRef.current !== requestId) return;
        const elapsedSeconds = Number(((performance.now() - requestStartTime) / 1000).toFixed(1));

        if (workerRef.current) {
          workerRef.current.terminate();
          workerRef.current = null;
        }

        setResult({
          status: 'timeout',
          moves: initialMd,
          elapsedSeconds,
          displayText: formatShortestMoves('timeout', initialMd, elapsedSeconds),
        });
      }, SHORTEST_MOVES_TIMEOUT_MS);

      // Worker からの結果受信
      worker.onmessage = (event: MessageEvent<SolverWorkerResponse>) => {
        const data = event.data;
        if (data.id !== currentRequestIdRef.current) {
          return; // 古い盤面のリクエスト結果は破棄
        }

        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
          timeoutIdRef.current = null;
        }

        const elapsedSeconds = Number(((performance.now() - requestStartTime) / 1000).toFixed(1));

        if (data.status === 'exact') {
          setResult({
            status: 'exact',
            moves: data.moves,
            elapsedSeconds,
            displayText: formatShortestMoves('exact', data.moves, elapsedSeconds),
          });
        } else if (data.status === 'timeout') {
          setResult({
            status: 'timeout',
            moves: initialMd,
            elapsedSeconds,
            displayText: formatShortestMoves('timeout', initialMd, elapsedSeconds),
          });
        } else {
          // エラー時
          setResult({
            status: 'error',
            moves: initialMd,
            elapsedSeconds,
            displayText: formatShortestMoves('error', initialMd, elapsedSeconds),
          });
        }
      };

      // Worker エラーハンドラ
      worker.onerror = () => {
        if (currentRequestIdRef.current !== requestId) return;

        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
          timeoutIdRef.current = null;
        }

        const elapsedSeconds = Number(((performance.now() - requestStartTime) / 1000).toFixed(1));

        setResult({
          status: 'error',
          moves: initialMd,
          elapsedSeconds,
          displayText: formatShortestMoves('error', initialMd, elapsedSeconds),
        });
      };

      const request: SolverWorkerRequest = {
        id: requestId,
        board: [...initialBoard],
        gridSize,
        timeoutMs: SHORTEST_MOVES_TIMEOUT_MS,
      };

      worker.postMessage(request);
    } catch {
      const elapsedSeconds = Number(((performance.now() - requestStartTime) / 1000).toFixed(1));
      setResult({
        status: 'error',
        moves: initialMd,
        elapsedSeconds,
        displayText: formatShortestMoves('error', initialMd, elapsedSeconds),
      });
    }

    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [initialBoard, gridSize]);

  return result;
}
