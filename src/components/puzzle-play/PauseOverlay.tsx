import React from 'react';
import { Play } from 'lucide-react';
import { Button } from '../common/Button';

interface PauseOverlayProps {
  isOpen: boolean;
  onResume: () => void;
}

export const PauseOverlay: React.FC<PauseOverlayProps> = ({ isOpen, onResume }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="一時停止中"
    >
      <div className="bg-white/10 border border-white/20 p-8 rounded-3xl text-center max-w-xs w-full shadow-2xl backdrop-blur-sm">
        <div className="w-16 h-16 rounded-full bg-blue-500/20 text-blue-400 mx-auto flex items-center justify-center mb-4 ring-1 ring-blue-400/40">
          <Play className="w-8 h-8 fill-current ml-1" />
        </div>
        <h2 className="text-xl font-extrabold text-white mb-2">一時停止中</h2>
        <p className="text-xs text-slate-300 mb-6">
          パズルは中断されています。準備ができたら再開してください。
        </p>
        <Button
          variant="primary"
          size="lg"
          className="w-full shadow-lg"
          onClick={onResume}
          autoFocus
        >
          パズルを再開する
        </Button>
      </div>
    </div>
  );
};
