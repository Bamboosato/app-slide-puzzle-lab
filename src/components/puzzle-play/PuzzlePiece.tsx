import React, { useRef } from 'react';
import { SWIPE_THRESHOLD_PX } from '../../config/constants';

interface PuzzlePieceProps {
  tileId: number;
  position: number;
  gridSize: number;
  isBlank: boolean;
  imageDataUrl?: string;
  showNumber: boolean;
  canMove: boolean;
  onClick: () => void;
  onSwipe: (direction: 'up' | 'down' | 'left' | 'right') => void;
}

export const PuzzlePiece: React.FC<PuzzlePieceProps> = ({
  tileId,
  isBlank,
  imageDataUrl,
  showNumber,
  canMove,
  onClick,
  onSwipe,
}) => {
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  if (isBlank) {
    return (
      <div
        className="w-full h-full rounded-[3px] bg-slate-900/60 shadow-inner border border-dashed border-slate-600/40 pointer-events-none"
        aria-hidden="true"
      />
    );
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || e.changedTouches.length === 0) return;

    const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
    const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (Math.max(absX, absY) < SWIPE_THRESHOLD_PX) {
      // 閾値未満はタップとして処理
      onClick();
      return;
    }

    if (absX > absY) {
      onSwipe(deltaX > 0 ? 'right' : 'left');
    } else {
      onSwipe(deltaY > 0 ? 'down' : 'up');
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      disabled={!canMove}
      className={`w-full h-full rounded-[3px] overflow-hidden relative shadow-[0_1px_2px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.35),inset_0_0_0_1px_rgba(0,0,0,0.15)] select-none transition-transform duration-100 ease-out active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
        canMove
          ? 'cursor-pointer hover:brightness-105 active:brightness-95'
          : 'cursor-default opacity-95'
      }`}
      style={{
        backgroundImage: imageDataUrl ? `url(${imageDataUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      aria-label={`ピース番号 ${tileId + 1}${canMove ? '、移動可能' : ''}`}
    >
      {/* ピース番号オーバーレイ */}
      {showNumber && (
        <div className="absolute top-1 left-1 bg-black/75 backdrop-blur-[2px] text-white font-extrabold text-[10px] sm:text-xs px-1.5 py-0.5 rounded-[2px] shadow-sm pointer-events-none">
          {tileId + 1}
        </div>
      )}

      {/* 移動可能ピースの微細なハイライトインジケーター */}
      {canMove && (
        <div className="absolute inset-0 ring-1 ring-inset ring-white/50 pointer-events-none rounded-[3px]" />
      )}
    </button>
  );
};
