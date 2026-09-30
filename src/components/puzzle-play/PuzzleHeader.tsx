import { Pause, Hash, Clock, Footprints, Route } from 'lucide-react';
import { Tooltip } from '../common/Tooltip';

interface PuzzleHeaderProps {
  moves: number;
  seconds: number;
  showNumbers: boolean;
  onToggleNumbers: () => void;
  onPause: () => void;
  isPaused: boolean;
  shortestMovesText?: string;
  isCalculatingShortestMoves?: boolean;
}

export const PuzzleHeader: React.FC<PuzzleHeaderProps> = ({
  moves,
  seconds,
  showNumbers,
  onToggleNumbers,
  onPause,
  isPaused,
  shortestMovesText,
  isCalculatingShortestMoves = false,
}) => {
  // MM:SS 表記
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white px-4 py-3 rounded-2xl shadow-sm border border-slate-200/80 mb-4 w-full max-w-md mx-auto flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
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
          <Tooltip text="ピース番号の表示 / 非表示" position="bottom">
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
          </Tooltip>

          {/* 一時停止ボタン */}
          <Tooltip text="パズルを一時停止する" position="bottom">
            <button
              onClick={onPause}
              disabled={isPaused}
              className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 active:bg-slate-300 transition-colors"
              title="一時停止"
              aria-label="パズルを一時停止"
            >
              <Pause className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* 最短手数（初期配置基準） */}
      {shortestMovesText && (
        <div className="flex items-center justify-center pt-2 border-t border-slate-100 text-xs">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200/60 font-medium text-slate-600">
            <Route className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span
              className={isCalculatingShortestMoves ? 'animate-pulse text-indigo-600 font-medium' : 'font-semibold text-slate-700'}
              data-testid="shortest-moves-badge"
            >
              {shortestMovesText}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
