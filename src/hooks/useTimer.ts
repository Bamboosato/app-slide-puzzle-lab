import { useState, useEffect, useRef, useCallback } from 'react';

interface UseTimerProps {
  onAutoPause?: () => void;
}

export function useTimer({ onAutoPause }: UseTimerProps = {}) {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // 累積ミリ秒と現在の区間の開始時刻
  const accumulatedMsRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);

  // コールバックの最新参照
  const onAutoPauseRef = useRef(onAutoPause);
  onAutoPauseRef.current = onAutoPause;

  // タイマーのインターバル管理エフェクト
  useEffect(() => {
    if (!isRunning || isPaused) {
      return;
    }

    if (startTimeRef.current === null) {
      startTimeRef.current = Date.now();
    }

    const intervalId = window.setInterval(() => {
      if (startTimeRef.current !== null) {
        const currentMs = accumulatedMsRef.current + (Date.now() - startTimeRef.current);
        setSeconds(Math.floor(currentMs / 1000));
      }
    }, 200);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isRunning, isPaused]);

  // バックグラウンド移行時の自動ポーズ処理
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setIsRunning((prevRunning) => {
          if (!prevRunning) return false;
          setIsPaused((prevPaused) => {
            if (!prevPaused) {
              if (startTimeRef.current !== null) {
                accumulatedMsRef.current += Date.now() - startTimeRef.current;
                startTimeRef.current = null;
                setSeconds(Math.floor(accumulatedMsRef.current / 1000));
              }
              onAutoPauseRef.current?.();
              return true;
            }
            return prevPaused;
          });
          return true;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const start = useCallback(() => {
    accumulatedMsRef.current = 0;
    startTimeRef.current = Date.now();
    setSeconds(0);
    setIsPaused(false);
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    if (startTimeRef.current !== null) {
      accumulatedMsRef.current += Date.now() - startTimeRef.current;
      startTimeRef.current = null;
    }
    setSeconds(Math.floor(accumulatedMsRef.current / 1000));
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    startTimeRef.current = Date.now();
    setIsPaused(false);
  }, []);

  const stop = useCallback(() => {
    if (startTimeRef.current !== null) {
      accumulatedMsRef.current += Date.now() - startTimeRef.current;
      startTimeRef.current = null;
    }
    setSeconds(Math.floor(accumulatedMsRef.current / 1000));
    setIsRunning(false);
    setIsPaused(false);
  }, []);

  const reset = useCallback(() => {
    accumulatedMsRef.current = 0;
    startTimeRef.current = null;
    setSeconds(0);
    setIsRunning(false);
    setIsPaused(false);
  }, []);

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
