import { RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '../common/Button';
import { Tooltip } from '../common/Tooltip';
import { PuzzleRecord } from '../../types/record';

interface RecordItemProps {
  record: PuzzleRecord;
  rank: number;
  onReplay: (record: PuzzleRecord) => void;
  onDelete?: (id: string) => void;
}

function formatTime(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function formatDate(timestamp: number) {
  const d = new Date(timestamp);
  return `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}`;
}

export function RecordItem({ record, rank, onReplay, onDelete }: RecordItemProps) {
  const getMedal = (r: number) => {
    if (r === 1) return '🥇';
    if (r === 2) return '🥈';
    if (r === 3) return '🥉';
    return <span className="text-slate-500 text-lg font-bold w-6 text-center inline-block">{r}</span>;
  };

  const maxStars = 3;
  const ratingStars = Array.from({ length: maxStars }).map((_, i) => (
    <span key={i} className={i < record.rating ? "text-amber-500" : "text-slate-300"}>
      {i < record.rating ? '★' : '☆'}
    </span>
  ));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="text-2xl w-8 text-center flex-shrink-0">
          {getMedal(rank)}
        </div>
        
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="text-lg tracking-widest leading-none">{ratingStars}</div>
            <span className="text-xs text-slate-500">{formatDate(record.timestamp)}</span>
          </div>
          
          <div className="flex items-baseline gap-3">
            <div className="text-xl font-bold text-slate-800">
              {formatTime(record.elapsedTime)}
            </div>
            <div className="text-sm text-slate-600">
              <span className="font-semibold">{record.moves}</span>手
              <span className="text-xs text-slate-400 ml-1">(最短{record.shortestMoves}手)</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <Tooltip text="この配置（同じパズル）で再挑戦" position="left">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onReplay(record)}
            className="rounded-full w-9 h-9 p-0 flex items-center justify-center border-slate-200 hover:bg-slate-100"
            aria-label="この配置でリプレイ"
          >
            <RotateCcw className="w-4 h-4 text-slate-600" />
          </Button>
        </Tooltip>

        {onDelete && (
          <Tooltip text="この記録を削除" position="left">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(record.id)}
              className="rounded-full w-9 h-9 p-0 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50"
              aria-label="記録を削除"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
