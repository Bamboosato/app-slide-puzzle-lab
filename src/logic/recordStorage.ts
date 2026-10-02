import { GridSize, ShuffleLevel } from '../types/puzzle';
import { PuzzleRecord, RecordCategoryKey } from '../types/record';
import { STORAGE_KEYS, MAX_RECORDS_PER_CATEGORY } from '../config/constants';

import { ShortestMovesStatus } from './solver/types';

type RecordsStore = Record<RecordCategoryKey, PuzzleRecord[]>;

export function getCategoryKey(gridSize: GridSize, shuffleLevel: ShuffleLevel): RecordCategoryKey {
  return `${gridSize}-${shuffleLevel}`;
}

export function calculateRating(moves: number, shortestMoves: number): number {
  if (!Number.isFinite(shortestMoves) || shortestMoves <= 0 || !Number.isFinite(moves) || moves < 0) {
    return 0;
  }
  const ratio = moves / shortestMoves;
  if (ratio <= 1.0) return 3;
  if (ratio <= 1.5) return 2;
  if (ratio <= 2.5) return 1;
  return 0;
}

/** 最短手数の計算ステータスから記録用の根拠種別を解決する */
export function resolveShortestMovesKind(
  status: ShortestMovesStatus
): 'exact' | 'lower_bound' | null {
  if (status === 'exact') return 'exact';
  if (status === 'lower_bound' || status === 'timeout' || status === 'error') {
    return 'lower_bound';
  }
  return null; // 'idle' または 'calculating' のときは確定を待つ
}

/** レコードを正規化（旧記録の未設定フィールドをunknownに設定） */
export function normalizeRecord(record: PuzzleRecord): PuzzleRecord {
  return {
    ...record,
    shortestMovesKind: record.shortestMovesKind ?? 'unknown',
  };
}

/** 記録一覧等の表示用最短手数文字列フォーマット */
export function formatRecordShortestMoves(
  shortestMoves: number,
  kind?: 'exact' | 'lower_bound' | 'unknown'
): string {
  const actualKind = kind ?? 'unknown';
  if (actualKind === 'exact') {
    return `最短${shortestMoves}手`;
  }
  if (actualKind === 'lower_bound') {
    return `最短${shortestMoves}手以上`;
  }
  return `最短${shortestMoves}手（未確認）`;
}

function loadAllRecords(): RecordsStore {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.RECORDS);
    if (!data) return {} as RecordsStore;
    const parsed = JSON.parse(data) as RecordsStore;
    const normalizedStore: RecordsStore = {} as RecordsStore;
    for (const key of Object.keys(parsed) as RecordCategoryKey[]) {
      const list = parsed[key];
      if (Array.isArray(list)) {
        normalizedStore[key] = list.map(normalizeRecord);
      }
    }
    return normalizedStore;
  } catch (error) {
    console.error('Failed to load records from localStorage:', error);
    return {} as RecordsStore;
  }
}

function saveAllRecords(store: RecordsStore): void {
  try {
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(store));
  } catch (error) {
    console.error('Failed to save records to localStorage:', error);
  }
}

function sortRecords(records: PuzzleRecord[]): PuzzleRecord[] {
  return [...records].sort((a, b) => {
    if (a.rating !== b.rating) return b.rating - a.rating;
    if (a.moves !== b.moves) return a.moves - b.moves;
    if (a.elapsedTime !== b.elapsedTime) return a.elapsedTime - b.elapsedTime;
    return b.timestamp - a.timestamp;
  });
}

export function saveRecord(record: PuzzleRecord): { rank: number; isNewRecord: boolean } {
  const store = loadAllRecords();
  const categoryKey = getCategoryKey(record.gridSize, record.shuffleLevel);
  const records = store[categoryKey] || [];
  
  records.push(record);
  const sortedRecords = sortRecords(records);
  const topRecords = sortedRecords.slice(0, MAX_RECORDS_PER_CATEGORY);
  
  store[categoryKey] = topRecords;
  saveAllRecords(store);
  
  const rank = topRecords.findIndex(r => r.id === record.id) + 1;
  const isNewRecord = rank > 0;
  
  return { rank: rank || -1, isNewRecord };
}

export function getRecords(gridSize: GridSize, shuffleLevel: ShuffleLevel): PuzzleRecord[] {
  const store = loadAllRecords();
  const categoryKey = getCategoryKey(gridSize, shuffleLevel);
  return store[categoryKey] || [];
}

export function getRecordById(id: string): PuzzleRecord | undefined {
  const store = loadAllRecords();
  for (const key in store) {
    const categoryRecords = store[key as RecordCategoryKey] || [];
    const record = categoryRecords.find(r => r.id === id);
    if (record) return record;
  }
  return undefined;
}

export function deleteRecord(id: string): void {
  const store = loadAllRecords();
  for (const key in store) {
    const categoryKey = key as RecordCategoryKey;
    const categoryRecords = store[categoryKey] || [];
    const index = categoryRecords.findIndex(r => r.id === id);
    if (index !== -1) {
      categoryRecords.splice(index, 1);
      store[categoryKey] = categoryRecords;
      saveAllRecords(store);
      return;
    }
  }
}

export function clearAllRecords(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.RECORDS);
  } catch (error) {
    console.error('Failed to clear records from localStorage:', error);
  }
}

export function calculateRank(
  gridSize: GridSize,
  shuffleLevel: ShuffleLevel,
  moves: number,
  elapsedTime: number,
  rating: number
): number | null {
  const records = getRecords(gridSize, shuffleLevel);
  
  const dummyRecord: PuzzleRecord = {
    id: 'dummy',
    timestamp: Date.now(),
    gridSize,
    shuffleLevel,
    initialBoard: [],
    moves,
    elapsedTime,
    shortestMoves: 0,
    rating,
    shortestMovesKind: 'unknown',
  };
  
  const combined = [...records, dummyRecord];
  const sorted = sortRecords(combined);
  const topRecords = sorted.slice(0, MAX_RECORDS_PER_CATEGORY);
  
  const rank = topRecords.findIndex(r => r.id === 'dummy') + 1;
  return rank > 0 ? rank : null;
}
