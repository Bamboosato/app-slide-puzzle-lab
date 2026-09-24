import { describe, it, expect, beforeEach } from 'vitest';
import { loadSavedSettings, saveSettings } from './storage';
import { DEFAULT_SETTINGS, STORAGE_KEYS } from '../config/constants';

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns default settings when storage is empty', () => {
    const settings = loadSavedSettings();
    expect(settings).toEqual(DEFAULT_SETTINGS);
  });

  it('saves and loads settings correctly', () => {
    saveSettings({
      gridSize: 5,
      shuffleLevel: 'hard',
      showNumbers: true,
    });

    const loaded = loadSavedSettings();
    expect(loaded.gridSize).toBe(5);
    expect(loaded.shuffleLevel).toBe('hard');
    expect(loaded.showNumbers).toBe(true);
  });

  it('safely falls back to default when stored values are invalid', () => {
    localStorage.setItem(STORAGE_KEYS.GRID_SIZE, 'invalid-number');
    localStorage.setItem(STORAGE_KEYS.SHUFFLE_LEVEL, 'extreme');
    localStorage.setItem(STORAGE_KEYS.SHOW_NUMBERS, 'not-a-boolean');

    const loaded = loadSavedSettings();
    expect(loaded.gridSize).toBe(DEFAULT_SETTINGS.gridSize);
    expect(loaded.shuffleLevel).toBe(DEFAULT_SETTINGS.shuffleLevel);
    expect(loaded.showNumbers).toBe(false);
  });
});
