import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CompletionDialog } from './CompletionDialog';

describe('CompletionDialog UI', () => {
  const defaultProps = {
    isOpen: true,
    moves: 20,
    seconds: 45,
    rating: 3,
    rank: 1,
    isNewRecord: true,
    onRetry: vi.fn(),
    onViewRecords: vi.fn(),
    onClose: vi.fn(),
  };

  it('renders standard rating label for exact shortest moves', () => {
    render(
      <CompletionDialog
        {...defaultProps}
        shortestMovesText="最短 20手（0.5秒）"
        shortestMovesKind="exact"
      />
    );

    const label = screen.getByTestId('completion-rating-label');
    expect(label.textContent).toBe('パーフェクト！');
    expect(screen.getByTestId('completion-shortest-moves').textContent).toBe('最短 20手（0.5秒）');
  });

  it('appends "（参考）" to rating label for lower_bound while preserving shortestMovesText', () => {
    render(
      <CompletionDialog
        {...defaultProps}
        rating={2}
        shortestMovesText="最短 20手以上（3.0秒）"
        shortestMovesKind="lower_bound"
      />
    );

    const label = screen.getByTestId('completion-rating-label');
    expect(label.textContent).toBe('優秀！（参考）');
    expect(screen.getByTestId('completion-shortest-moves').textContent).toBe('最短 20手以上（3.0秒）');
  });

  it('appends "（参考）" to rating label for unknown kind', () => {
    render(
      <CompletionDialog
        {...defaultProps}
        rating={1}
        shortestMovesText="最短 20手"
        shortestMovesKind="unknown"
      />
    );

    const label = screen.getByTestId('completion-rating-label');
    expect(label.textContent).toBe('良い！（参考）');
    expect(screen.getByTestId('completion-shortest-moves').textContent).toBe('最短 20手');
  });
});
