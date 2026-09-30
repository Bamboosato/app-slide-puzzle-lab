import { useState, useEffect } from 'react';
import { ScreenState, GameSettings, GridSize, ShuffleLevel } from './types/puzzle';
import { PuzzleRecord } from './types/record';
import { ProcessedSourceImage, processImageUrl } from './logic/imageProcessor';
import { loadSavedSettings } from './logic/storage';
import { PuzzleConfigScreen } from './components/puzzle-config/PuzzleConfigScreen';
import { PuzzlePlayScreen } from './components/puzzle-play/PuzzlePlayScreen';
import { RecordsScreen } from './components/records/RecordsScreen';
import { PwaUpdateToast } from './components/common/PwaUpdateToast';

export function App() {
  // 設定画面をホーム画面として初期表示
  const [screen, setScreen] = useState<ScreenState>('config');
  const [sourceImage, setSourceImage] = useState<ProcessedSourceImage | null>(null);
  const [puzzlePieces, setPuzzlePieces] = useState<string[]>([]);
  const [fullCroppedCanvas, setFullCroppedCanvas] = useState<HTMLCanvasElement | null>(null);
  const [gameSettings, setGameSettings] = useState<GameSettings>(() => loadSavedSettings());

  // 記録画面用の状態
  const [recordsGridSize, setRecordsGridSize] = useState<GridSize>(4);
  const [recordsShuffleLevel, setRecordsShuffleLevel] = useState<ShuffleLevel>('standard');

  // リプレイ用の初期配置
  const [replayInitialBoard, setReplayInitialBoard] = useState<number[] | undefined>(undefined);

  // 起動時に初期画像としてサンプル画像を自動ロード
  useEffect(() => {
    let isMounted = true;
    async function loadDefaultImage() {
      try {
        const processed = await processImageUrl('/sample.jpg');
        if (isMounted) {
          setSourceImage(processed);
        }
      } catch (err) {
        console.error('Failed to load initial sample image:', err);
      }
    }
    loadDefaultImage();
    return () => {
      isMounted = false;
    };
  }, []);

  // 画像変更ハンドラ
  const handleImageChange = (processed: ProcessedSourceImage) => {
    setSourceImage(processed);
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
    setReplayInitialBoard(undefined); // 通常プレイ
    setScreen('play');
  };

  // パズル設定（ホーム）に戻る
  const handleBackToConfig = () => {
    setReplayInitialBoard(undefined);
    setScreen('config');
  };

  // 記録一覧を表示
  const handleViewRecords = (gridSize: GridSize, shuffleLevel: ShuffleLevel) => {
    setRecordsGridSize(gridSize);
    setRecordsShuffleLevel(shuffleLevel);
    setScreen('records');
  };

  // 記録からリプレイ
  const handleReplay = (record: PuzzleRecord) => {
    // リプレイ用の設定を適用
    const replaySettings: GameSettings = {
      gridSize: record.gridSize,
      shuffleLevel: record.shuffleLevel,
      showNumbers: gameSettings.showNumbers, // 番号表示は現在の設定を維持
    };
    setGameSettings(replaySettings);
    setReplayInitialBoard(record.initialBoard);
    setScreen('play');
  };

  // プレイ画面から記録一覧へ
  const handleViewRecordsFromPlay = () => {
    setRecordsGridSize(gameSettings.gridSize);
    setRecordsShuffleLevel(gameSettings.shuffleLevel);
    setScreen('records');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between overflow-x-hidden">
      <main className="flex-1 flex flex-col justify-start sm:justify-center py-2 sm:py-4">
        {screen === 'config' && (
          <PuzzleConfigScreen
            sourceImage={sourceImage}
            initialSettings={gameSettings}
            onStart={handleStartPuzzle}
            onViewRecords={handleViewRecords}
            onImageChange={handleImageChange}
          />
        )}

        {screen === 'play' && fullCroppedCanvas && (
          <PuzzlePlayScreen
            pieces={puzzlePieces}
            fullCroppedCanvas={fullCroppedCanvas}
            settings={gameSettings}
            replayInitialBoard={replayInitialBoard}
            onBackToConfig={handleBackToConfig}
            onViewRecords={handleViewRecordsFromPlay}
          />
        )}

        {screen === 'records' && (
          <RecordsScreen
            initialGridSize={recordsGridSize}
            initialShuffleLevel={recordsShuffleLevel}
            onBack={handleBackToConfig}
            onReplay={handleReplay}
          />
        )}
      </main>

      {/* PWA更新通知トースト */}
      <PwaUpdateToast />
    </div>
  );
}

export default App;
