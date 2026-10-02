import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RecordItem } from './RecordItem';
import { PuzzleRecord } from '../../types/record';

describe('RecordItem UI', () => {
  const baseRecord: PuzzleRecord = {
    id: 'test-rec',
    timestamp: Date.now(),
    gridSize: 3,
    shuffleLevel: 'standard',
    initialBoard: [1, 2, 3, 4, 5, 0, 7, 8, 6],
    moves: 18,
    elapsedTime: 45,
    shortestMoves: 15,
    rating: 2,
  };

  it('renders exact shortest moves without "参考" label', () => {
    const record: PuzzleRecord = {
      ...baseRecord,
      shortestMovesKind: 'exact',
    };

    render(<RecordItem record={record} rank={1} onReplay={vi.fn()} />);

    expect(screen.getByText('(最短15手)')).toBeDefined();
    expect(screen.queryByText('（参考）')).toBeNull();
  });

  it('renders lower_bound shortest moves with "最短N手以上" and "参考"', () => {
    const record: PuzzleRecord = {
      ...baseRecord,
      shortestMovesKind: 'lower_bound',
    };

    render(<RecordItem record={record} rank={1} onReplay={vi.fn()} />);

    expect(screen.getByText('(最短15手以上)')).toBeDefined();
    expect(screen.getByText('（参考）')).toBeDefined();
  });

  it('renders unknown shortest moves with "未確認" and "参考"', () => {
    const record: PuzzleRecord = {
      ...baseRecord,
      shortestMovesKind: 'unknown',
    };

    render(<RecordItem record={record} rank={1} onReplay={vi.fn()} />);

    expect(screen.getByText('(最短15手（未確認）)')).toBeDefined();
    expect(screen.getByText('（参考）')).toBeDefined();
  });

  it('falls back to unknown and renders "未確認" and "参考" when shortestMovesKind is undefined', () => {
    const record: PuzzleRecord = {
      ...baseRecord,
      shortestMovesKind: undefined,
    };

    render(<RecordItem record={record} rank={1} onReplay={vi.fn()} />);

    expect(screen.getByText('(最短15手（未確認）)')).toBeDefined();
    expect(screen.getByText('（参考）')).toBeDefined();
  });
});
