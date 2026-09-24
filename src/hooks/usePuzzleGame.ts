import { useState, useCallback, useRef, useEffect } from 'react';
import { GridSize, ShuffleLevel } from '../types/puzzle';
import {
  shuffleBoard,
  moveTile,
  isSolved,
  getBlankIndex,
  getKeyboardMoveTarget,
  canMove,
} from '../logic/puzzleLogic';
import { saveSettings } from '../logic/storage';

interface UsePuzzleGameProps {
  gridSize: GridSize;
  shuffleLevel: ShuffleLevel;
  initialShowNumbers?: boolean;
  isInteractionDisabled?: boolean;
  onMoveSuccess?: () => void;
  onCompleted?: () => void;
}

export function usePuzzleGame({
  gridSize,
  shuffleLevel,
  initialShowNumbers = false,
  isInteractionDisabled = false,
  onMoveSuccess,
  onCompleted,
}: UsePuzzleGameProps) {
  const [board, setBoard] = useState<number[]>(() => shuffleBoard(gridSize, shuffleLevel));
  const [initialBoard, setInitialBoard] = useState<number[]>(board);
  const [moves, setMoves] = useState(0);
  const [isGameCompleted, setIsGameCompleted] = useState(false);
  const [showNumbers, setShowNumbers] = useState(initialShowNumbers);

  // コールバックや最新状態の参照
  const boardRef = useRef(board);
  boardRef.current = board;

  const isCompletedRef = useRef(isGameCompleted);
  isCompletedRef.current = isGameCompleted;

  const isInteractionDisabledRef = useRef(isInteractionDisabled);
  isInteractionDisabledRef.current = isInteractionDisabled;

  // 盤面初期化 / 再シャッフル
  const initializeNewGame = useCallback(
    (newSize: GridSize = gridSize, newLevel: ShuffleLevel = shuffleLevel) => {
      const newBoard = shuffleBoard(newSize, newLevel);
      setBoard(newBoard);
      setInitialBoard(newBoard);
      setMoves(0);
      setIsGameCompleted(false);
    },
    [gridSize, shuffleLevel]
  );

  // ピース移動処理（タップ・クリック・キーボード・スワイプ共通）
  const moveByTileIndex = useCallback(
    (tileIndex: number): boolean => {
      if (isCompletedRef.current || isInteractionDisabledRef.current) return false;

      const currentBoard = boardRef.current;
      const { newBoard, moved } = moveTile(currentBoard, tileIndex, gridSize);

      if (moved) {
        setBoard(newBoard);
        setMoves((prev) => prev + 1);
        onMoveSuccess?.();

        // 移動直後に完成判定
        if (isSolved(newBoard)) {
          setIsGameCompleted(true);
          onCompleted?.();
        }
        return true;
      }
      return false;
    },
    [gridSize, onMoveSuccess, onCompleted]
  );

  // 「最初から」やり直す
  const restart = useCallback(() => {
    setBoard([...initialBoard]);
    setMoves(0);
    setIsGameCompleted(false);
  }, [initialBoard]);

  // 「再シャッフル」
  const reshuffle = useCallback(() => {
    initializeNewGame(gridSize, shuffleLevel);
  }, [initializeNewGame, gridSize, shuffleLevel]);

  // ピース番号表示切り替え
  const toggleShowNumbers = useCallback(() => {
    setShowNumbers((prev) => {
      const next = !prev;
      saveSettings({ showNumbers: next });
      return next;
    });
  }, []);

  // キーボードイベントハンドラ
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (isCompletedRef.current || isInteractionDisabledRef.current) return;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const currentBoard = boardRef.current;
        const blankIndex = getBlankIndex(currentBoard, gridSize);
        const targetTileIndex = getKeyboardMoveTarget(
          e.key as 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight',
          blankIndex,
          gridSize
        );

        if (targetTileIndex !== null) {
          moveByTileIndex(targetTileIndex);
        }
      }
    },
    [gridSize, moveByTileIndex]
  );

  // グローバルキーボードリスナー登録
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // 個別ピース上でのスワイプ判定ハンドラ
  const handlePieceSwipe = useCallback(
    (tileIndex: number, direction: 'up' | 'down' | 'left' | 'right') => {
      if (isCompletedRef.current || isInteractionDisabledRef.current) return;
      const currentBoard = boardRef.current;
      const blankIndex = getBlankIndex(currentBoard, gridSize);

      if (!canMove(tileIndex, blankIndex, gridSize)) return;

      const tileRow = Math.floor(tileIndex / gridSize);
      const tileCol = tileIndex % gridSize;
      const blankRow = Math.floor(blankIndex / gridSize);
      const blankCol = blankIndex % gridSize;

      // ピースから空白への方向と、スワイプ方向が一致しているかを検証
      let isValidDirection = false;
      if (direction === 'up' && blankRow === tileRow - 1 && blankCol === tileCol) {
        isValidDirection = true;
      } else if (direction === 'down' && blankRow === tileRow + 1 && blankCol === tileCol) {
        isValidDirection = true;
      } else if (direction === 'left' && blankCol === tileCol - 1 && blankRow === tileRow) {
        isValidDirection = true;
      } else if (direction === 'right' && blankCol === tileCol + 1 && blankRow === tileRow) {
        isValidDirection = true;
      }

      if (isValidDirection) {
        moveByTileIndex(tileIndex);
      }
    },
    [gridSize, moveByTileIndex]
  );

  return {
    board,
    moves,
    isCompleted: isGameCompleted,
    showNumbers,
    moveByTileIndex,
    handlePieceSwipe,
    restart,
    reshuffle,
    toggleShowNumbers,
    initializeNewGame,
  };
}
