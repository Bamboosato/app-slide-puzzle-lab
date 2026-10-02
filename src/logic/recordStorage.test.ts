import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveRecord,
  getRecords,
  getRecordById,
  deleteRecord,
  clearAllRecords,
  calculateRating,
  calculateRank,
  getCategoryKey,
  resolveShortestMovesKind,
  formatRecordShortestMoves,
} from './recordStorage';
import { PuzzleRecord } from '../types/record';
import { MAX_RECORDS_PER_CATEGORY } from '../config/constants';

describe('recordStorage', () => {
  beforeEach(() => {
    clearAllRecords();
  });

  it('generates correct category key', () => {
    expect(getCategoryKey(3, 'light')).toBe('3-light');
    expect(getCategoryKey(4, 'standard')).toBe('4-standard');
    expect(getCategoryKey(6, 'hard')).toBe('6-hard');
  });

  describe('calculateRating', () => {
    it('handles boundaries: 1.0, 1.5, 2.5 and just above them', () => {
      // 1.0 boundary and just above
      expect(calculateRating(20, 20)).toBe(3); // ratio = 1.0
      expect(calculateRating(21, 20)).toBe(2); // ratio = 1.05

      // 1.5 boundary and just above
      expect(calculateRating(30, 20)).toBe(2); // ratio = 1.5
      expect(calculateRating(31, 20)).toBe(1); // ratio = 1.55

      // 2.5 boundary and just above
      expect(calculateRating(50, 20)).toBe(1); // ratio = 2.5
      expect(calculateRating(51, 20)).toBe(0); // ratio = 2.55
    });

    it('rates 40 moves as 1 star with lower_bound 20, and 2 stars with exact 30', () => {
      // 40 / 20 = 2.0 (<= 2.5 -> 1 star)
      expect(calculateRating(40, 20)).toBe(1);
      // 40 / 30 = 1.333 (<= 1.5 -> 2 stars)
      expect(calculateRating(40, 30)).toBe(2);
    });

    it('returns 0 on denominator <= 0, NaN, or Infinity', () => {
      expect(calculateRating(20, 0)).toBe(0);
      expect(calculateRating(20, -5)).toBe(0);
      expect(calculateRating(20, NaN)).toBe(0);
      expect(calculateRating(20, Infinity)).toBe(0);
      expect(calculateRating(20, -Infinity)).toBe(0);
    });

    it('returns 0 on invalid moves', () => {
      expect(calculateRating(-1, 20)).toBe(0);
      expect(calculateRating(NaN, 20)).toBe(0);
    });
  });

  describe('resolveShortestMovesKind', () => {
    it('classifies exact as exact', () => {
      expect(resolveShortestMovesKind('exact')).toBe('exact');
    });

    it('classifies lower_bound, timeout, and error as lower_bound', () => {
      expect(resolveShortestMovesKind('lower_bound')).toBe('lower_bound');
      expect(resolveShortestMovesKind('timeout')).toBe('lower_bound');
      expect(resolveShortestMovesKind('error')).toBe('lower_bound');
    });

    it('returns null for idle and calculating to wait for completion', () => {
      expect(resolveShortestMovesKind('idle')).toBeNull();
      expect(resolveShortestMovesKind('calculating')).toBeNull();
    });
  });

  describe('formatRecordShortestMoves', () => {
    it('formats exact moves as 最短N手', () => {
      expect(formatRecordShortestMoves(15, 'exact')).toBe('最短15手');
    });

    it('formats lower_bound moves as 最短N手以上', () => {
      expect(formatRecordShortestMoves(20, 'lower_bound')).toBe('最短20手以上');
    });

    it('formats unknown moves as 最短N手（未確認）', () => {
      expect(formatRecordShortestMoves(25, 'unknown')).toBe('最短25手（未確認）');
      expect(formatRecordShortestMoves(25, undefined)).toBe('最短25手（未確認）');
    });
  });

  describe('backward compatibility with legacy records', () => {
    it('loads legacy records without shortestMovesKind as unknown without modifying localStorage on read', () => {
      const legacyRawJson = JSON.stringify({
        '3-standard': [
          {
            id: 'legacy-1',
            timestamp: 1600000000000,
            gridSize: 3,
            shuffleLevel: 'standard',
            initialBoard: [1, 2, 3, 4, 5, 0, 7, 8, 6],
            moves: 12,
            elapsedTime: 25,
            shortestMoves: 10,
            rating: 3,
          },
          {
            id: 'legacy-2',
            timestamp: 1599999999000,
            gridSize: 3,
            shuffleLevel: 'standard',
            initialBoard: [8, 7, 6, 5, 4, 3, 2, 1, 0],
            moves: 30,
            elapsedTime: 60,
            shortestMoves: 15,
            rating: 2,
          },
        ],
      });

      localStorage.setItem('slide_puzzle_records', legacyRawJson);

      // Read records
      const loaded = getRecords(3, 'standard');
      expect(loaded).toHaveLength(2);

      // Normalized to unknown
      expect(loaded[0].shortestMovesKind).toBe('unknown');
      expect(loaded[1].shortestMovesKind).toBe('unknown');

      // Preserves existing fields and order
      expect(loaded[0].id).toBe('legacy-1');
      expect(loaded[0].rating).toBe(3);
      expect(loaded[0].moves).toBe(12);
      expect(loaded[0].elapsedTime).toBe(25);
      expect(loaded[0].initialBoard).toEqual([1, 2, 3, 4, 5, 0, 7, 8, 6]);
      expect(loaded[1].id).toBe('legacy-2');

      // localStorage should NOT be modified just by reading
      expect(localStorage.getItem('slide_puzzle_records')).toBe(legacyRawJson);

      // getRecordById also normalizes
      const single = getRecordById('legacy-1');
      expect(single?.shortestMovesKind).toBe('unknown');
    });

    it('writes back normalized data along with new records upon save', () => {
      const legacyRawJson = JSON.stringify({
        '3-standard': [
          {
            id: 'legacy-1',
            timestamp: 1600000000000,
            gridSize: 3,
            shuffleLevel: 'standard',
            initialBoard: [1, 2, 3, 4, 5, 0, 7, 8, 6],
            moves: 25,
            elapsedTime: 50,
            shortestMoves: 10,
            rating: 2,
          },
        ],
      });

      localStorage.setItem('slide_puzzle_records', legacyRawJson);

      const newRecord: PuzzleRecord = {
        id: 'new-rec',
        timestamp: Date.now(),
        gridSize: 3,
        shuffleLevel: 'standard',
        initialBoard: [1, 2, 3, 4, 5, 6, 7, 8, 0],
        moves: 10,
        elapsedTime: 20,
        shortestMoves: 10,
        rating: 3,
        shortestMovesKind: 'exact',
      };

      saveRecord(newRecord);

      // Raw localStorage should now contain both with normalized kinds
      const stored = JSON.parse(localStorage.getItem('slide_puzzle_records') || '{}');
      expect(stored['3-standard']).toHaveLength(2);
      expect(stored['3-standard'][0].id).toBe('new-rec');
      expect(stored['3-standard'][0].shortestMovesKind).toBe('exact');
      expect(stored['3-standard'][1].id).toBe('legacy-1');
      expect(stored['3-standard'][1].shortestMovesKind).toBe('unknown');
    });
  });

  describe('saveRecord & getRecords', () => {
    const createSampleRecord = (
      id: string,
      moves: number,
      elapsedTime: number,
      rating: number,
      shortestMovesKind: 'exact' | 'lower_bound' | 'unknown' = 'exact'
    ): PuzzleRecord => ({
      id,
      timestamp: Date.now(),
      gridSize: 3,
      shuffleLevel: 'standard',
      initialBoard: [1, 2, 3, 4, 5, 0, 7, 8, 6],
      moves,
      elapsedTime,
      shortestMoves: 10,
      rating,
      shortestMovesKind,
    });

    it('saves and retrieves records preserving shortestMovesKind', () => {
      saveRecord(createSampleRecord('rec-exact', 10, 20, 3, 'exact'));
      saveRecord(createSampleRecord('rec-lb', 20, 30, 2, 'lower_bound'));

      const records = getRecords(3, 'standard');
      expect(records).toHaveLength(2);
      expect(records[0].shortestMovesKind).toBe('exact');
      expect(records[1].shortestMovesKind).toBe('lower_bound');
    });

    it('saves and retrieves records sorted by rating (desc), moves (asc), time (asc)', () => {
      saveRecord(createSampleRecord('rec-1', 25, 40, 2)); // 2 stars, 25 moves
      saveRecord(createSampleRecord('rec-2', 10, 20, 3)); // 3 stars, 10 moves (best)
      saveRecord(createSampleRecord('rec-3', 15, 30, 2)); // 2 stars, 15 moves (better than rec-1)

      const records = getRecords(3, 'standard');
      expect(records).toHaveLength(3);
      expect(records[0].id).toBe('rec-2');
      expect(records[1].id).toBe('rec-3');
      expect(records[2].id).toBe('rec-1');
    });

    it('limits records per category to MAX_RECORDS_PER_CATEGORY', () => {
      for (let i = 1; i <= MAX_RECORDS_PER_CATEGORY + 5; i++) {
        saveRecord(createSampleRecord(`rec-${i}`, i * 10, i * 5, 1));
      }

      const records = getRecords(3, 'standard');
      expect(records).toHaveLength(MAX_RECORDS_PER_CATEGORY);
    });

    it('correctly reports rank and isNewRecord', () => {
      const result1 = saveRecord(createSampleRecord('rec-1', 10, 10, 3));
      expect(result1.rank).toBe(1);
      expect(result1.isNewRecord).toBe(true);

      const result2 = saveRecord(createSampleRecord('rec-2', 20, 20, 2));
      expect(result2.rank).toBe(2);
      expect(result2.isNewRecord).toBe(true);
    });
  });

  describe('getRecordById & deleteRecord', () => {
    it('finds record by id across categories and maintains kind', () => {
      const record: PuzzleRecord = {
        id: 'target-rec',
        timestamp: Date.now(),
        gridSize: 4,
        shuffleLevel: 'hard',
        initialBoard: [0, 1, 2, 3],
        moves: 30,
        elapsedTime: 60,
        shortestMoves: 25,
        rating: 2,
        shortestMovesKind: 'lower_bound',
      };

      saveRecord(record);
      const found = getRecordById('target-rec');
      expect(found).toBeDefined();
      expect(found?.id).toBe('target-rec');
      expect(found?.shortestMovesKind).toBe('lower_bound');
    });

    it('deletes record by id', () => {
      const record: PuzzleRecord = {
        id: 'delete-me',
        timestamp: Date.now(),
        gridSize: 3,
        shuffleLevel: 'light',
        initialBoard: [0, 1, 2],
        moves: 5,
        elapsedTime: 10,
        shortestMoves: 5,
        rating: 3,
        shortestMovesKind: 'exact',
      };

      saveRecord(record);
      expect(getRecords(3, 'light')).toHaveLength(1);

      deleteRecord('delete-me');
      expect(getRecords(3, 'light')).toHaveLength(0);
    });
  });

  describe('calculateRank', () => {
    it('estimates rank for a given score', () => {
      saveRecord({
        id: 'rec-1',
        timestamp: Date.now(),
        gridSize: 3,
        shuffleLevel: 'standard',
        initialBoard: [],
        moves: 10,
        elapsedTime: 20,
        shortestMoves: 10,
        rating: 3,
        shortestMovesKind: 'exact',
      });

      // Worse than rec-1
      expect(calculateRank(3, 'standard', 15, 25, 2)).toBe(2);
      // Better than rec-1 (same rating, fewer moves)
      expect(calculateRank(3, 'standard', 8, 15, 3)).toBe(1);
    });
  });
});
