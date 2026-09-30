import React, { useId } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Trophy, RotateCcw, Footprints, Clock, X, Route, Award } from 'lucide-react';

interface CompletionDialogProps {
  isOpen: boolean;
  moves: number;
  seconds: number;
  completedImageDataUrl?: string;
  shortestMovesText?: string;
  rating: number;           // ★評価（0〜3）
  rank: number | null;      // ランキング順位（null = ランク外）
  isNewRecord: boolean;     // 新記録かどうか
  onRetry: () => void;
  onViewRecords: () => void;
  onClose: () => void;
}

/** ★評価を表示用文字列に変換 */
function renderStars(rating: number): React.ReactNode {
  const stars = [];
  for (let i = 0; i < 3; i++) {
    if (i < rating) {
      stars.push(
        <span key={i} className="text-amber-500">★</span>
      );
    } else {
      stars.push(
        <span key={i} className="text-slate-300">☆</span>
      );
    }
  }
  return <span className="text-lg">{stars}</span>;
}

/** ★評価のラベル */
function ratingLabel(rating: number): string {
  switch (rating) {
    case 3: return 'パーフェクト！';
    case 2: return '優秀！';
    case 1: return '良い！';
    default: return '完成！';
  }
}

export const CompletionDialog: React.FC<CompletionDialogProps> = ({
  isOpen,
  moves,
  seconds,
  completedImageDataUrl,
  shortestMovesText,
  rating,
  rank,
  isNewRecord,
  onRetry,
  onViewRecords,
  onClose,
}) => {
  const titleId = useId();

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}分${secs}秒`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton={true}
      maxWidth="max-w-xs sm:max-w-sm"
      ariaLabelledBy={`completion-title-${titleId}`}
      ariaLabel="完成おめでとう！"
    >
      <div className="flex flex-col items-center text-center">
        {/* トロフィーアイコン */}
        <div className="w-11 h-11 rounded-full bg-amber-100 text-amber-500 flex items-center justify-center mb-1.5 animate-bounce">
          <Trophy className="w-6 h-6" />
        </div>

        <h2 id={`completion-title-${titleId}`} className="text-xl font-black text-slate-900 mb-0.5">
          完成おめでとう！
        </h2>
        <p className="text-[11px] text-slate-500 mb-2.5">見事にパズルを完成させました！</p>

        {/* 完成した完全な1枚画像 */}
        <div className="w-32 sm:w-36 aspect-square rounded-xl overflow-hidden shadow-md border-2 border-amber-300 mb-2.5 bg-slate-100 flex-shrink-0">
          {completedImageDataUrl && (
            <img
              src={completedImageDataUrl}
              alt="完成画像"
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* ★評価 */}
        <div className="mb-2">
          <div className="text-base">{renderStars(rating)}</div>
          <div className="text-xs font-bold text-slate-700 mt-0.5">{ratingLabel(rating)}</div>
        </div>

        {/* 成績カード */}
        <div className="flex flex-col w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 mb-2.5 gap-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
                <Footprints className="w-3 h-3" />
                <span>総手数</span>
              </div>
              <div className="text-lg font-black text-slate-800">{moves} 手</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
                <Clock className="w-3 h-3" />
                <span>クリア時間</span>
              </div>
              <div className="text-lg font-black text-slate-800 font-mono">
                {formatTime(seconds)}
              </div>
            </div>
          </div>

          {/* 最短手数（初期盤面） */}
          {shortestMovesText && (
            <div className="pt-1.5 border-t border-slate-200/60 flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-700">
              <Route className="w-3 h-3 text-indigo-500 shrink-0" />
              <span data-testid="completion-shortest-moves">{shortestMovesText}</span>
            </div>
          )}
        </div>

        {/* ランキング表示 */}
        {rank !== null && (
          <div className="w-full bg-amber-50 p-2 rounded-xl border border-amber-200/80 mb-3">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-800">
              <Award className="w-3.5 h-3.5 text-amber-600" />
              <span>ランキング: {rank}位</span>
            </div>
            {isNewRecord && (
              <div className="text-[10px] font-semibold text-amber-600 mt-0.5">
                🎉 新記録達成！
              </div>
            )}
          </div>
        )}

        {/* アクションボタン */}
        <div className="flex flex-col gap-1.5 w-full">
          <Button
            variant="primary"
            size="md"
            className="w-full shadow-md font-bold"
            icon={<RotateCcw className="w-4 h-4" />}
            onClick={onRetry}
          >
            同じ設定で再挑戦
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs font-semibold"
            icon={<Trophy className="w-3.5 h-3.5" />}
            onClick={onViewRecords}
          >
            記録を見る
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-slate-500 hover:text-slate-800 py-1"
            icon={<X className="w-3 h-3" />}
            onClick={onClose}
          >
            閉じる（パズル画面に戻る）
          </Button>
        </div>
      </div>
    </Modal>
  );
};
