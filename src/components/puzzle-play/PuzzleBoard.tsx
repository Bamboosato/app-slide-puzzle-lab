import React from 'react';
import { GridSize } from '../../types/puzzle';
import { PuzzlePiece } from './PuzzlePiece';
import { getBlankIndex, canMove } from '../../logic/puzzleLogic';

interface PuzzleBoardProps {
  board: number[];
  gridSize: GridSize;
  pieces: string[];
  showNumbers: boolean;
  onTileClick: (position: number) => void;
  onTileSwipe: (position: number, direction: 'up' | 'down' | 'left' | 'right') => void;
}

export const PuzzleBoard: React.FC<PuzzleBoardProps> = ({
  board,
  gridSize,
  pieces,
  showNumbers,
  onTileClick,
  onTileSwipe,
}) => {
  const blankIndex = getBlankIndex(board, gridSize);
  const totalTiles = gridSize * gridSize;
  const blankId = totalTiles - 1;

  // グリッドギャップ（分割数に応じて調整）
  const gapClass = gridSize >= 5 ? 'gap-1.5 p-2' : 'gap-2 p-2.5';

  return (
    <div className="w-full max-w-md mx-auto aspect-square bg-slate-800 rounded-3xl shadow-xl overflow-hidden border-4 border-slate-700/60 touch-none">
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
          const isAdjacentToBlank = !isBlank && canMove(position, blankIndex, gridSize);

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
