export type GridSize = 3 | 4 | 5 | 6;

export type ShuffleLevel = 'light' | 'standard' | 'hard';

export type ScreenState = 'select' | 'config' | 'play' | 'records';

export interface CropArea {
  x: number; // 0 to 1 relative to source image
  y: number; // 0 to 1
  width: number; // 0 to 1
  height: number; // 0 to 1
}

export interface PuzzleTile {
  id: number; // Correct position (0 to gridSize^2 - 1)
  currentPosition: number; // Current board index (0 to gridSize^2 - 1)
  isBlank: boolean; // True if this is the empty tile (id === gridSize^2 - 1)
  imageDataUrl?: string; // Sliced image data URL for this tile
}

export interface GameSettings {
  gridSize: GridSize;
  shuffleLevel: ShuffleLevel;
  showNumbers: boolean;
}

export interface GameStats {
  moves: number;
  elapsedSeconds: number;
  isCompleted: boolean;
  isPaused: boolean;
}
