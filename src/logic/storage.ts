import { GameSettings, GridSize, ShuffleLevel } from '../types/puzzle';
import { DEFAULT_SETTINGS, STORAGE_KEYS } from '../config/constants';

/**
 * localStorage から保存された設定を取得する。
 * 不正な値や取得失敗時は安全にデフォルト値を返す。
 */
export function loadSavedSettings(): GameSettings {
  try {
    const rawGridSize = localStorage.getItem(STORAGE_KEYS.GRID_SIZE);
    const rawShuffleLevel = localStorage.getItem(STORAGE_KEYS.SHUFFLE_LEVEL);
    const rawShowNumbers = localStorage.getItem(STORAGE_KEYS.SHOW_NUMBERS);

    let gridSize: GridSize = DEFAULT_SETTINGS.gridSize;
    if (rawGridSize) {
      const parsedSize = parseInt(rawGridSize, 10);
      if ([3, 4, 5, 6].includes(parsedSize)) {
        gridSize = parsedSize as GridSize;
      }
    }

    let shuffleLevel: ShuffleLevel = DEFAULT_SETTINGS.shuffleLevel;
    if (rawShuffleLevel && ['light', 'standard', 'hard'].includes(rawShuffleLevel)) {
      shuffleLevel = rawShuffleLevel as ShuffleLevel;
    }

    let showNumbers = DEFAULT_SETTINGS.showNumbers;
    if (rawShowNumbers !== null) {
      showNumbers = rawShowNumbers === 'true';
    }

    return { gridSize, shuffleLevel, showNumbers };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * ゲーム設定を localStorage に保存する。
 */
export function saveSettings(settings: Partial<GameSettings>): void {
  try {
    if (settings.gridSize !== undefined) {
      localStorage.setItem(STORAGE_KEYS.GRID_SIZE, settings.gridSize.toString());
    }
    if (settings.shuffleLevel !== undefined) {
      localStorage.setItem(STORAGE_KEYS.SHUFFLE_LEVEL, settings.shuffleLevel);
    }
    if (settings.showNumbers !== undefined) {
      localStorage.setItem(STORAGE_KEYS.SHOW_NUMBERS, settings.showNumbers ? 'true' : 'false');
    }
  } catch {
    // クォータ超過やプライベートモードでの保存失敗は無視
  }
}
