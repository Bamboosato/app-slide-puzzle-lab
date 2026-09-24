import { useState } from 'react';
import { ScreenState, GameSettings } from './types/puzzle';
import { ProcessedSourceImage } from './logic/imageProcessor';
import { loadSavedSettings } from './logic/storage';
import { ImageSelectScreen } from './components/image-select/ImageSelectScreen';
import { PuzzleConfigScreen } from './components/puzzle-config/PuzzleConfigScreen';
import { PuzzlePlayScreen } from './components/puzzle-play/PuzzlePlayScreen';
import { PwaUpdateToast } from './components/common/PwaUpdateToast';

export function App() {
  const [screen, setScreen] = useState<ScreenState>('select');
  const [sourceImage, setSourceImage] = useState<ProcessedSourceImage | null>(null);
  const [puzzlePieces, setPuzzlePieces] = useState<string[]>([]);
  const [fullCroppedCanvas, setFullCroppedCanvas] = useState<HTMLCanvasElement | null>(null);
  const [gameSettings, setGameSettings] = useState<GameSettings>(() => loadSavedSettings());

  // 画像選択完了
  const handleImageSelected = (processed: ProcessedSourceImage) => {
    setSourceImage(processed);
    setScreen('config');
  };

  // パズル開始
  const handleStartPuzzle = (
    pieces: string[],
    croppedCanvas: HTMLCanvasElement,
    settings: GameSettings
  ) => {
    setPuzzlePieces(pieces);
    setFullCroppedCanvas(croppedCanvas);
    setGameSettings(settings);
    setScreen('play');
  };

  // 画像選択に戻る
  const handleBackToSelect = () => {
    setScreen('select');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between">
      <main className="flex-1 flex flex-col justify-center">
        {screen === 'select' && (
          <ImageSelectScreen onImageSelected={handleImageSelected} />
        )}

        {screen === 'config' && sourceImage && (
          <PuzzleConfigScreen
            sourceImage={sourceImage}
            initialSettings={gameSettings}
            onBack={handleBackToSelect}
            onStart={handleStartPuzzle}
          />
        )}

        {screen === 'play' && fullCroppedCanvas && (
          <PuzzlePlayScreen
            pieces={puzzlePieces}
            fullCroppedCanvas={fullCroppedCanvas}
            settings={gameSettings}
            onNewImageSelected={handleBackToSelect}
          />
        )}
      </main>

      {/* PWA更新通知トースト */}
      <PwaUpdateToast />
    </div>
  );
}

export default App;
