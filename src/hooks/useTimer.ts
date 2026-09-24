import { useState, useEffect, useRef, useCallback } from 'react';

interface UseTimerProps {
  onAutoPause?: () => void;
}

export function useTimer({ onAutoPause }: UseTimerProps = {}) {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // 累積秒数とタイマー開始時刻（ミリ秒）
  const accumulatedMsRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);
  const intervalIdRef = useRef<number | null>(null);

  const clearTimerInterval = useCallback(() => {
    if (intervalIdRef.current !== null) {
      window.clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
  }, []);

  const updateSeconds = useCallback(() => {
    if (startTimeRef.current !== null) {
      const currentMs = accumulatedMsRef.current + (Date.now() - startTimeRef.current);
      setSeconds(Math.floor(currentMs / 1000));
    }
  }, []);

  const start = useCallback(() => {
    clearTimerInterval();
    accumulatedMsRef.current = 0;
    startTimeRef.current = Date.now();
    setSeconds(0);
    setIsRunning(true);
    setIsPaused(false);

    intervalIdRef.current = window.setInterval(updateSeconds, 200);
  }, [clearTimerInterval, updateSeconds]);

  const pause = useCallback(() => {
    if (!isRunning || isPaused) return;

    if (startTimeRef.current !== null) {
      accumulatedMsRef.current += Date.now() - startTimeRef.current;
      startTimeRef.current = null;
    }
    clearTimerInterval();
    setIsPaused(true);
    setSeconds(Math.floor(accumulatedMsRef.current / 1000));
  }, [isRunning, isPaused, clearTimerInterval]);

  const resume = useCallback(() => {
    if (!isRunning || !isPaused) return;

    clearTimerInterval();
    startTimeRef.current = Date.now();
    setIsPaused(false);
    intervalIdRef.current = window.setInterval(updateSeconds, 200);
  }, [isRunning, isPaused, clearTimerInterval, updateSeconds]);

  const stop = useCallback(() => {
    if (startTimeRef.current !== null) {
      accumulatedMsRef.current += Date.now() - startTimeRef.current;
      startTimeRef.current = null;
    }
    clearTimerInterval();
    setIsRunning(false);
    setIsPaused(false);
    setSeconds(Math.floor(accumulatedMsRef.current / 1000));
  }, [clearTimerInterval]);

  const reset = useCallback(() => {
    clearTimerInterval();
    accumulatedMsRef.current = 0;
    startTimeRef.current = null;
    setSeconds(0);
    setIsRunning(false);
    setIsPaused(false);
  }, [clearTimerInterval]);

  // ブラウザタブのバックグラウンド移行時の自動ポーズ処理
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (isRunning && !isPaused) {
          pause();
          onAutoPause?.();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearTimerInterval();
    };
  }, [isRunning, isPaused, pause, onAutoPause, clearTimerInterval]);

  return {
    seconds,
    isRunning,
    isPaused,
    start,
    pause,
    resume,
    stop,
    reset,
  };
}
