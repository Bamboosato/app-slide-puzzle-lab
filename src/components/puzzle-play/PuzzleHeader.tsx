import React from 'react';
import { Pause, Hash, Clock, Footprints } from 'lucide-react';

interface PuzzleHeaderProps {
  moves: number;
  seconds: number;
  showNumbers: boolean;
  onToggleNumbers: () => void;
  onPause: () => void;
  isPaused: boolean;
}

export const PuzzleHeader: React.FC<PuzzleHeaderProps> = ({
  moves,
  seconds,
  showNumbers,
  onToggleNumbers,
  onPause,
  isPaused,
}) => {
  // MM:SS 表記
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl shadow-sm border border-slate-200/80 mb-4 w-full max-w-md mx-auto">
      {/* 手数 */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
          <Footprints className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] uppercase font-bold text-slate-400 leading-none">
            手数
          </div>
          <div className="text-lg font-extrabold text-slate-800 leading-tight">
            {moves}
          </div>
        </div>
      </div>

      {/* 経過時間 */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
          <Clock className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] uppercase font-bold text-slate-400 leading-none">
            時間
          </div>
          <div className="text-lg font-extrabold text-slate-800 font-mono leading-tight">
            {formatTime(seconds)}
          </div>
        </div>
      </div>

      {/* コントロールボタン群 */}
      <div className="flex items-center gap-1.5">
        {/* 番号トグル */}
        <button
          onClick={onToggleNumbers}
          className={`p-2 rounded-xl transition-all ${
            showNumbers
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
          title="ピース番号の表示/非表示"
          aria-label="ピース番号の表示切り替え"
        >
          <Hash className="w-4 h-4" />
        </button>

        {/* 一時停止ボタン */}
        <button
          onClick={onPause}
          disabled={isPaused}
          className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 active:bg-slate-300 transition-colors"
          title="一時停止"
          aria-label="パズルを一時停止"
        >
          <Pause className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
