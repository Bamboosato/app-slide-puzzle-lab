import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../common/Button';
import { Tooltip } from '../common/Tooltip';
import { RecordItem } from './RecordItem';
import { getRecords, deleteRecord } from '../../logic/recordStorage';
import { PuzzleRecord } from '../../types/record';
import { GridSize, ShuffleLevel } from '../../types/puzzle';
import { GRID_OPTIONS, SHUFFLE_OPTIONS } from '../../config/constants';

interface RecordsScreenProps {
  initialGridSize: GridSize;
  initialShuffleLevel: ShuffleLevel;
  onBack: () => void;
  onReplay: (record: PuzzleRecord) => void;
}

export function RecordsScreen({
  initialGridSize,
  initialShuffleLevel,
  onBack,
  onReplay,
}: RecordsScreenProps) {
  const [gridSize, setGridSize] = useState<GridSize>(initialGridSize);
  const [shuffleLevel, setShuffleLevel] = useState<ShuffleLevel>(initialShuffleLevel);
  const [records, setRecords] = useState<PuzzleRecord[]>([]);

  useEffect(() => {
    setRecords(getRecords(gridSize, shuffleLevel));
  }, [gridSize, shuffleLevel]);

  const handleDeleteRecord = (id: string) => {
    deleteRecord(id);
    setRecords(getRecords(gridSize, shuffleLevel));
  };

  const currentGridLabel = GRID_OPTIONS.find(o => o.size === gridSize)?.label || '';
  const currentShuffleLabel = SHUFFLE_OPTIONS.find(o => o.level === shuffleLevel)?.label || '';

  return (
    <div className="max-w-xl mx-auto px-4 py-6 container flex flex-col h-full min-h-screen">
      <div className="flex items-center mb-6">
        <Tooltip text="設定画面に戻る" position="right" className="mr-2">
          <Button variant="ghost" size="sm" onClick={onBack} aria-label="設定画面に戻る">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Tooltip>
        <h1 className="text-2xl font-bold text-slate-800">🏆 記録一覧</h1>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-5 mb-6">
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              サイズ
            </label>
            <select
              value={gridSize}
              onChange={(e) => setGridSize(Number(e.target.value) as GridSize)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
            >
              {GRID_OPTIONS.map((opt) => (
                <option key={opt.size} value={opt.size}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              シャッフル
            </label>
            <select
              value={shuffleLevel}
              onChange={(e) => setShuffleLevel(e.target.value as ShuffleLevel)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
            >
              {SHUFFLE_OPTIONS.map((opt) => (
                <option key={opt.level} value={opt.level}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <h2 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-2 mb-4">
          {currentGridLabel} ・ {currentShuffleLabel} の記録
        </h2>

        <div className="flex flex-col gap-3">
          {records.length > 0 ? (
            records.map((record, index) => (
              <RecordItem
                key={record.id}
                record={record}
                rank={index + 1}
                onReplay={onReplay}
                onDelete={handleDeleteRecord}
              />
            ))
          ) : (
            <div className="text-center py-8 text-slate-500">
              まだ記録がありません。パズルに挑戦してみましょう！
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
