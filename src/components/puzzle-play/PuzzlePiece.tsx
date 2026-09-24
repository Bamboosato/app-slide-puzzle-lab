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
  const pointerStartRef = useRef<{ x: number; y: number; id: number } | null>(null);
  const isSwipedRef = useRef<boolean>(false);

  if (isBlank) {
    return (
      <div
        className="w-full h-full rounded-[3px] bg-slate-900/60 shadow-inner border border-dashed border-slate-600/40 pointer-events-none"
        aria-hidden="true"
      />
    );
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!canMove || !e.isPrimary) return;
    pointerStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      id: e.pointerId,
    };
    isSwipedRef.current = false;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!pointerStartRef.current || pointerStartRef.current.id !== e.pointerId) return;

    const deltaX = e.clientX - pointerStartRef.current.x;
    const deltaY = e.clientY - pointerStartRef.current.y;
    pointerStartRef.current = null;

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (Math.max(absX, absY) >= SWIPE_THRESHOLD_PX) {
      // 閾値以上の移動はスワイプとして処理し、後続のクリックを抑止
      isSwipedRef.current = true;
      if (absX > absY) {
        onSwipe(deltaX > 0 ? 'right' : 'left');
      } else {
        onSwipe(deltaY > 0 ? 'down' : 'up');
      }
    }
  };

  const handlePointerCancel = () => {
    pointerStartRef.current = null;
    isSwipedRef.current = false;
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isSwipedRef.current) {
      // スワイプ直後の合成クリックを抑止
      e.preventDefault();
      e.stopPropagation();
      isSwipedRef.current = false;
      return;
    }
    if (canMove) {
      onClick();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      disabled={!canMove}
      className={`w-full h-full rounded-[3px] overflow-hidden relative shadow-[0_1px_2px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.35),inset_0_0_0_1px_rgba(0,0,0,0.15)] select-none touch-none transition-transform duration-100 ease-out active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
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
