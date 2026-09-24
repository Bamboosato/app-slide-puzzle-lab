import React, { useState, useEffect, useRef } from 'react';
import { GameSettings } from '../../types/puzzle';
import { usePuzzleGame } from '../../hooks/usePuzzleGame';
import { useTimer } from '../../hooks/useTimer';
import { useShortestMoves } from '../../hooks/useShortestMoves';
import { PuzzleHeader } from './PuzzleHeader';
import { PuzzleBoard } from './PuzzleBoard';
import { PauseOverlay } from './PauseOverlay';
import { OriginalImageModal } from './OriginalImageModal';
import { CompletionDialog } from './CompletionDialog';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Eye, RotateCcw, Shuffle, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Settings } from 'lucide-react';

interface PuzzlePlayScreenProps {
  pieces: string[];
  fullCroppedCanvas: HTMLCanvasElement;
  settings: GameSettings;
  onBackToConfig?: () => void;
}

export const PuzzlePlayScreen: React.FC<PuzzlePlayScreenProps> = ({
  pieces,
  fullCroppedCanvas,
  settings,
  onBackToConfig,
}) => {
  const [showOriginalModal, setShowOriginalModal] = useState(false);
  const [isManualPaused, setIsManualPaused] = useState(false);
  const [isCompletionDialogOpen, setIsCompletionDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'restart' | 'reshuffle' | 'config' | null>(null);
  const completionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fullImageDataUrlRef = useRef<string>('');
  if (!fullImageDataUrlRef.current) {
    fullImageDataUrlRef.current = fullCroppedCanvas.toDataURL('image/jpeg', 0.95);
  }

  // アンマウント時のタイマークリーンアップ
  useEffect(() => {
    return () => {
      if (completionTimeoutRef.current) {
        clearTimeout(completionTimeoutRef.current);
      }
    };
  }, []);

  // タイマーフック
  const {
    seconds,
    isRunning: isTimerRunning,
    start: startTimer,
    pause: pauseTimer,
    resume: resumeTimer,
    stop: stopTimer,
    reset: resetTimer,
  } = useTimer({
    onAutoPause: () => {
      setIsManualPaused(true);
    },
  });

  // 操作禁止状態の一元算出（ポーズ・元画像・確認ダイアログ・完成ダイアログ）
  const isInteractionDisabled =
    isManualPaused ||
    showOriginalModal ||
    confirmAction !== null ||
    isCompletionDialogOpen;

  // パズルゲームフック
  const {
    board,
    initialBoard,
    moves,
    isCompleted,
    showNumbers,
    moveByTileIndex,
    handlePieceSwipe,
    restart: restartGame,
    reshuffle: reshuffleGame,
    toggleShowNumbers,
  } = usePuzzleGame({
    gridSize: settings.gridSize,
    shuffleLevel: settings.shuffleLevel,
    initialShowNumbers: settings.showNumbers,
    isInteractionDisabled,
    onMoveSuccess: () => {
      if (!isTimerRunning) {
        startTimer();
      }
    },
    onCompleted: () => {
      // タイマー即時停止（ピース移動は usePuzzleGame 側で即座にロック）
      stopTimer();

      // 既存タイマーをクリア
      if (completionTimeoutRef.current) {
        clearTimeout(completionTimeoutRef.current);
      }

      // 1秒間完成形を見せた後にダイアログを表示
      completionTimeoutRef.current = setTimeout(() => {
        setIsCompletionDialogOpen(true);
      }, 1000);
    },
  });

  // 最短手数計算フック（初期配置スナップショット基準・Web Worker非同期探索）
  const shortestMoves = useShortestMoves({
    initialBoard,
    gridSize: settings.gridSize,
  });

  // 盤面表示完了後にタイマー開始
  useEffect(() => {
    startTimer();
  }, [startTimer]);

  // 元画像確認モーダルの開閉連動（表示中はタイマー一時停止）
  const handleOpenOriginalModal = () => {
    pauseTimer();
    setShowOriginalModal(true);
  };

  const handleCloseOriginalModal = () => {
    setShowOriginalModal(false);
    if (!isCompleted && !isManualPaused) {
      resumeTimer();
    }
  };

  // 手動ポーズ
  const handlePause = () => {
    pauseTimer();
    setIsManualPaused(true);
  };

  const handleResume = () => {
    setIsManualPaused(false);
    if (!isCompleted) {
      resumeTimer();
    }
  };

  // 確認付きアクションのハンドラ
  const handleRestartClick = () => {
    if (moves > 0 && !isCompleted) {
      pauseTimer();
      setConfirmAction('restart');
    } else {
      executeRestart();
    }
  };

  const handleReshuffleClick = () => {
    if (moves > 0 && !isCompleted) {
      pauseTimer();
      setConfirmAction('reshuffle');
    } else {
      executeReshuffle();
    }
  };

  const handleBackToConfigClick = () => {
    if (moves > 0 && !isCompleted) {
      pauseTimer();
      setConfirmAction('config');
    } else {
      onBackToConfig?.();
    }
  };

  const executeRestart = () => {
    if (completionTimeoutRef.current) {
      clearTimeout(completionTimeoutRef.current);
    }
    restartGame();
    resetTimer();
    startTimer();
    setIsCompletionDialogOpen(false);
    setConfirmAction(null);
  };

  const executeReshuffle = () => {
    if (completionTimeoutRef.current) {
      clearTimeout(completionTimeoutRef.current);
    }
    reshuffleGame();
    resetTimer();
    startTimer();
    setIsCompletionDialogOpen(false);
    setConfirmAction(null);
  };

  const handleConfirm = () => {
    if (confirmAction === 'restart') {
      executeRestart();
    } else if (confirmAction === 'reshuffle') {
      executeReshuffle();
    } else if (confirmAction === 'config') {
      onBackToConfig?.();
    }
  };

  const handleCancelConfirm = () => {
    setConfirmAction(null);
    if (!isCompleted && !isManualPaused && !showOriginalModal) {
      resumeTimer();
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-4 sm:py-6 flex flex-col items-center">
      {/* ヘッダー情報（手数、タイマー、ポーズ、番号トグル、最短手数） */}
      <PuzzleHeader
        moves={moves}
        seconds={seconds}
        showNumbers={showNumbers}
        onToggleNumbers={toggleShowNumbers}
        onPause={handlePause}
        isPaused={isManualPaused || showOriginalModal || isCompleted}
        shortestMovesText={shortestMoves.displayText}
        isCalculatingShortestMoves={shortestMoves.status === 'calculating'}
      />

      {/* パズル盤面 */}
      <div className="w-full flex justify-center mb-5">
        <PuzzleBoard
          board={board}
          gridSize={settings.gridSize}
          pieces={pieces}
          showNumbers={showNumbers}
          isCompleted={isCompleted}
          isInteractionDisabled={isInteractionDisabled}
          onTileClick={moveByTileIndex}
          onTileSwipe={handlePieceSwipe}
        />
      </div>

      {/* 操作バー */}
      <div className="grid grid-cols-4 gap-2 w-full max-w-md mb-6">
        <button
          onClick={handleOpenOriginalModal}
          className="flex flex-col items-center justify-center py-2.5 px-1 bg-white hover:bg-slate-50 text-slate-700 rounded-2xl shadow-sm border border-slate-200/80 transition-all active:scale-95 text-xs font-bold"
        >
          <Eye className="w-4 h-4 mb-1 text-blue-600" />
          <span>元画像</span>
        </button>

        <button
          onClick={handleRestartClick}
          className="flex flex-col items-center justify-center py-2.5 px-1 bg-white hover:bg-slate-50 text-slate-700 rounded-2xl shadow-sm border border-slate-200/80 transition-all active:scale-95 text-xs font-bold"
        >
          <RotateCcw className="w-4 h-4 mb-1 text-amber-600" />
          <span>最初から</span>
        </button>

        <button
          onClick={handleReshuffleClick}
          className="flex flex-col items-center justify-center py-2.5 px-1 bg-white hover:bg-slate-50 text-slate-700 rounded-2xl shadow-sm border border-slate-200/80 transition-all active:scale-95 text-xs font-bold"
        >
          <Shuffle className="w-4 h-4 mb-1 text-purple-600" />
          <span>再シャッフル</span>
        </button>

        <button
          onClick={handleBackToConfigClick}
          className="flex flex-col items-center justify-center py-2.5 px-1 bg-white hover:bg-slate-50 text-slate-700 rounded-2xl shadow-sm border border-slate-200/80 transition-all active:scale-95 text-xs font-bold"
          title="分割数やシャッフルの度合いを変更"
        >
          <Settings className="w-4 h-4 mb-1 text-indigo-600" />
          <span>設定変更</span>
        </button>
      </div>

      {/* キーボード操作ガイド */}
      <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400 bg-white/60 backdrop-blur-sm px-3.5 py-1.5 rounded-full border border-slate-200/60 shadow-xs">
        <div className="flex gap-0.5">
          <kbd className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] font-mono shadow-xs">
            <ArrowUp className="w-3 h-3 inline" />
          </kbd>
          <kbd className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] font-mono shadow-xs">
            <ArrowDown className="w-3 h-3 inline" />
          </kbd>
          <kbd className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] font-mono shadow-xs">
            <ArrowLeft className="w-3 h-3 inline" />
          </kbd>
          <kbd className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] font-mono shadow-xs">
            <ArrowRight className="w-3 h-3 inline" />
          </kbd>
        </div>
        <span>矢印キーで空白方向へピースを移動できます</span>
      </div>

      {/* 元画像確認モーダル */}
      <OriginalImageModal
        isOpen={showOriginalModal}
        onClose={handleCloseOriginalModal}
        originalImageDataUrl={fullImageDataUrlRef.current}
      />

      {/* ポーズオーバーレイ */}
      <PauseOverlay isOpen={isManualPaused} onResume={handleResume} />

      {/* 完成ダイアログ */}
      <CompletionDialog
        isOpen={isCompleted && isCompletionDialogOpen}
        moves={moves}
        seconds={seconds}
        completedImageDataUrl={fullImageDataUrlRef.current}
        shortestMovesText={shortestMoves.displayText}
        onRetry={executeReshuffle}
        onClose={() => setIsCompletionDialogOpen(false)}
      />

      {/* 確認ダイアログ */}
      <ConfirmDialog
        isOpen={confirmAction !== null}
        title={
          confirmAction === 'restart'
            ? '最初からやり直しますか？'
            : confirmAction === 'reshuffle'
            ? '別の盤面で再シャッフルしますか？'
            : 'パズル設定に戻りますか？'
        }
        message="現在のパズルの進行状況（手数・経過時間）はリセットされます。"
        confirmLabel={
          confirmAction === 'config'
            ? '設定に戻る'
            : 'やり直す'
        }
        variant="primary"
        onConfirm={handleConfirm}
        onCancel={handleCancelConfirm}
      />
    </div>
  );
};
