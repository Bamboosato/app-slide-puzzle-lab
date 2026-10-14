import React from 'react';
import { GridSize } from '../../types/puzzle';
import { PuzzlePiece } from './PuzzlePiece';
import { getBlankIndex, canMove } from '../../logic/puzzleLogic';

interface PuzzleBoardProps {
  board: number[];
  gridSize: GridSize;
  pieces: string[];
  showNumbers: boolean;
  isCompleted?: boolean;
  isInteractionDisabled?: boolean;
  onTileClick: (position: number) => void;
  onTileSwipe: (position: number, direction: 'up' | 'down' | 'left' | 'right') => void;
}

export const PuzzleBoard: React.FC<PuzzleBoardProps> = ({
  board,
  gridSize,
  pieces,
  showNumbers,
  isCompleted = false,
  isInteractionDisabled = false,
  onTileClick,
  onTileSwipe,
}) => {
  const blankIndex = getBlankIndex(board, gridSize);
  const totalTiles = gridSize * gridSize;
  const blankId = totalTiles - 1;

  // グリッドギャップ（ピース境界の識別性を保ちつつ、スマホでは外枠パディングを最小化してパズル画像を最大化）
  const gapClass =
    gridSize === 3
      ? 'gap-1 p-1 sm:p-2'
      : gridSize <= 5
      ? 'gap-[3px] p-1 sm:p-1.5'
      : 'gap-[2px] p-0.5 sm:p-1.5';

  return (
    <div className="w-full max-w-[480px] sm:max-w-md mx-auto aspect-square bg-slate-800/95 rounded-xl sm:rounded-2xl shadow-xl overflow-hidden border border-slate-700/80 sm:border-2 touch-none">
      <div
        className={`w-full h-full grid ${gapClass}`}
        style={{
          gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`,
        }}
        role="grid"
        aria-label="スライドパズル盤面"
      >
        {board.map((tileId, position) => {
          const isBlank = tileId === blankId;
          const isAdjacentToBlank =
            !isCompleted && !isInteractionDisabled && !isBlank && canMove(position, blankIndex, gridSize);

          return (
            <div key={position} className="w-full h-full relative" role="gridcell">
              <PuzzlePiece
                tileId={tileId}
                position={position}
                gridSize={gridSize}
                isBlank={isBlank}
                imageDataUrl={pieces[tileId]}
                showNumber={showNumbers}
                canMove={isAdjacentToBlank}
                onClick={() => onTileClick(position)}
                onSwipe={(direction) => onTileSwipe(position, direction)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
