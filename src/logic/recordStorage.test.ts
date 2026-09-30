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
    it('returns 3 stars when moves equal shortest moves', () => {
      expect(calculateRating(20, 20)).toBe(3);
    });

    it('returns 2 stars when moves <= 1.5x shortest moves', () => {
      expect(calculateRating(28, 20)).toBe(2);
      expect(calculateRating(30, 20)).toBe(2);
    });

    it('returns 1 star when moves <= 2.5x shortest moves', () => {
      expect(calculateRating(35, 20)).toBe(1);
      expect(calculateRating(50, 20)).toBe(1);
    });

    it('returns 0 stars when moves > 2.5x shortest moves', () => {
      expect(calculateRating(60, 20)).toBe(0);
    });

    it('handles zero or negative shortest moves gracefully', () => {
      expect(calculateRating(20, 0)).toBe(0);
    });
  });

  describe('saveRecord & getRecords', () => {
    const createSampleRecord = (id: string, moves: number, elapsedTime: number, rating: number): PuzzleRecord => ({
      id,
      timestamp: Date.now(),
      gridSize: 3,
      shuffleLevel: 'standard',
      initialBoard: [1, 2, 3, 4, 5, 0, 7, 8, 6],
      moves,
      elapsedTime,
      shortestMoves: 10,
      rating,
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
    it('finds record by id across categories', () => {
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
      };

      saveRecord(record);
      const found = getRecordById('target-rec');
      expect(found).toBeDefined();
      expect(found?.id).toBe('target-rec');
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
      });

      // Worse than rec-1
      expect(calculateRank(3, 'standard', 15, 25, 2)).toBe(2);
      // Better than rec-1 (same rating, fewer moves)
      expect(calculateRank(3, 'standard', 8, 15, 3)).toBe(1);
    });
  });
});
