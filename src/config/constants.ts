import { GridSize, ShuffleLevel, GameSettings } from '../types/puzzle';

export const MAX_IMAGE_DIMENSION = 1024;
export const OUTPUT_CROP_SIZE = 1024;

export const SHUFFLE_MULTIPLIERS: Record<ShuffleLevel, number> = {
  light: 3,
  standard: 10,
  hard: 30,
};

export const MAX_SOLVED_TILE_RATIOS: Record<ShuffleLevel, number> = {
  light: 0.8,
  standard: 0.5,
  hard: 0.35,
};

export const SWIPE_THRESHOLD_PX = 25;
export const TILE_ANIMATION_DURATION_MS = 100;

export const STORAGE_KEYS = {
  GRID_SIZE: 'slide_puzzle_grid_size',
  SHUFFLE_LEVEL: 'slide_puzzle_shuffle_level',
  SHOW_NUMBERS: 'slide_puzzle_show_numbers',
} as const;

export const DEFAULT_SETTINGS: GameSettings = {
  gridSize: 4,
  shuffleLevel: 'standard',
  showNumbers: false,
};

export const GRID_OPTIONS: { size: GridSize; label: string; tiles: number }[] = [
  { size: 3, label: '3×3', tiles: 8 },
  { size: 4, label: '4×4', tiles: 15 },
  { size: 5, label: '5×5', tiles: 24 },
  { size: 6, label: '6×6', tiles: 35 },
];

export const SHUFFLE_OPTIONS: {
  level: ShuffleLevel;
  label: string;
  description: string;
}[] = [
  {
    level: 'light',
    label: '軽め',
    description: '完成に近く短時間で解きやすい',
  },
  {
    level: 'standard',
    label: '標準',
    description: '適度に混ざった標準的な配置',
  },
  {
    level: 'hard',
    label: '強め',
    description: '十分に混ざった本格的な配置',
  },
];
