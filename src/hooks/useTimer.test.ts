import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTimer } from './useTimer';

describe('useTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('increments seconds continuously after start', () => {
    const { result } = renderHook(() => useTimer());

    expect(result.current.seconds).toBe(0);
    expect(result.current.isRunning).toBe(false);

    act(() => {
      result.current.start();
    });

    expect(result.current.isRunning).toBe(true);

    // 1秒進める
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.seconds).toBe(1);

    // さらに2秒進める
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.seconds).toBe(3);
  });

  it('pauses and resumes correctly', () => {
    const { result } = renderHook(() => useTimer());

    act(() => {
      result.current.start();
    });

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.seconds).toBe(2);

    act(() => {
      result.current.pause();
    });
    expect(result.current.isPaused).toBe(true);

    // ポーズ中は時間が増えない
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.seconds).toBe(2);

    // 再開
    act(() => {
      result.current.resume();
    });
    expect(result.current.isPaused).toBe(false);

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.seconds).toBe(4);
  });

  it('stops and resets correctly', () => {
    const { result } = renderHook(() => useTimer());

    act(() => {
      result.current.start();
    });

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.seconds).toBe(5);

    act(() => {
      result.current.stop();
    });
    expect(result.current.isRunning).toBe(false);

    // 停止後は時間が増えない
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.seconds).toBe(5);

    act(() => {
      result.current.reset();
    });
    expect(result.current.seconds).toBe(0);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.isPaused).toBe(false);
  });

  it('automatically pauses on visibilityState hidden and onAutoPause callback is invoked', () => {
    const onAutoPause = vi.fn();
    const { result } = renderHook(() => useTimer({ onAutoPause }));

    act(() => {
      result.current.start();
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.seconds).toBe(1);

    // タブがバックグラウンドになった場合 (hidden)
    act(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', writable: true, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(result.current.isPaused).toBe(true);
    expect(onAutoPause).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    // ポーズ中なので増えない
    expect(result.current.seconds).toBe(1);

    // 再開 (resume)
    act(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'visible', writable: true, configurable: true });
      result.current.resume();
    });
    expect(result.current.isPaused).toBe(false);

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.seconds).toBe(3);
  });
});
