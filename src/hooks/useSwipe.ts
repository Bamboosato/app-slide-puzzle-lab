import { useRef, useCallback } from 'react';
import { SWIPE_THRESHOLD_PX } from '../config/constants';

export type SwipeDirection = 'up' | 'down' | 'left' | 'right';

interface UseSwipeProps {
  onSwipe: (direction: SwipeDirection) => void;
  threshold?: number;
}

export function useSwipe({ onSwipe, threshold = SWIPE_THRESHOLD_PX }: UseSwipeProps) {
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartPos.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartPos.current || e.changedTouches.length === 0) return;

      const deltaX = e.changedTouches[0].clientX - touchStartPos.current.x;
      const deltaY = e.changedTouches[0].clientY - touchStartPos.current.y;
      touchStartPos.current = null;

      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (Math.max(absX, absY) < threshold) {
        return; // タップ相当（閾値未満）
      }

      if (absX > absY) {
        // 水平方向
        if (deltaX > 0) {
          onSwipe('right');
        } else {
          onSwipe('left');
        }
      } else {
        // 垂直方向
        if (deltaY > 0) {
          onSwipe('down');
        } else {
          onSwipe('up');
        }
      }
    },
    [onSwipe, threshold]
  );

  return {
    handleTouchStart,
    handleTouchEnd,
  };
}
