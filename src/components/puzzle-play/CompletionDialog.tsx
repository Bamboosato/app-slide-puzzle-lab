import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Trophy, RotateCcw, Image as ImageIcon, Footprints, Clock, Settings } from 'lucide-react';

interface CompletionDialogProps {
  isOpen: boolean;
  moves: number;
  seconds: number;
  completedImageDataUrl?: string;
  onRetry: () => void;
  onBackToConfig?: () => void;
  onNewImage: () => void;
}

export const CompletionDialog: React.FC<CompletionDialogProps> = ({
  isOpen,
  moves,
  seconds,
  completedImageDataUrl,
  onRetry,
  onBackToConfig,
  onNewImage,
}) => {
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}分${secs}秒`;
  };

  return (
    <Modal isOpen={isOpen} onClose={() => {}} showCloseButton={false} maxWidth="max-w-sm">
      <div className="flex flex-col items-center text-center">
        {/* トロフィーアイコン */}
        <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-500 flex items-center justify-center mb-3 animate-bounce">
          <Trophy className="w-9 h-9" />
        </div>

        <h2 className="text-2xl font-black text-slate-900 mb-1">完成おめでとう！</h2>
        <p className="text-xs text-slate-500 mb-4">見事にパズルを完成させました！</p>

        {/* 完成した完全な1枚画像 */}
        <div className="w-48 aspect-square rounded-2xl overflow-hidden shadow-lg border-2 border-amber-300 mb-4 bg-slate-100">
          {completedImageDataUrl && (
            <img
              src={completedImageDataUrl}
              alt="完成画像"
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* 成績カード */}
        <div className="grid grid-cols-2 gap-3 w-full bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 mb-6">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase">
              <Footprints className="w-3.5 h-3.5" />
              <span>総手数</span>
            </div>
            <div className="text-xl font-black text-slate-800">{moves} 手</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase">
              <Clock className="w-3.5 h-3.5" />
              <span>クリア時間</span>
            </div>
            <div className="text-xl font-black text-slate-800 font-mono">
              {formatTime(seconds)}
            </div>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex flex-col gap-2 w-full">
          <Button
            variant="primary"
            size="lg"
            className="w-full shadow-md"
            icon={<RotateCcw className="w-4 h-4" />}
            onClick={onRetry}
          >
            同じ設定で再挑戦
          </Button>

          {onBackToConfig && (
            <Button
              variant="secondary"
              size="md"
              className="w-full"
              icon={<Settings className="w-4 h-4 text-slate-600" />}
              onClick={onBackToConfig}
            >
              設定を変更する（分割数など）
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="w-full text-slate-500 hover:text-slate-800"
            icon={<ImageIcon className="w-3.5 h-3.5" />}
            onClick={onNewImage}
          >
            新しい画像を選ぶ
          </Button>
        </div>
      </div>
    </Modal>
  );
};
