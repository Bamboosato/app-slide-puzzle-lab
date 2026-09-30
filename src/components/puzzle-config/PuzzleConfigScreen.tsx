import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, ZoomIn, ZoomOut, Hash, Trophy, Upload, RotateCcw, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Button } from '../common/Button';
import { Tooltip } from '../common/Tooltip';
import { ProcessedSourceImage, cropImageToSquare, sliceImageToPieces, processImageFile, processImageUrl } from '../../logic/imageProcessor';
import { GridSize, ShuffleLevel, GameSettings, CropArea } from '../../types/puzzle';
import { GRID_OPTIONS, SHUFFLE_OPTIONS } from '../../config/constants';
import { saveSettings } from '../../logic/storage';

interface PuzzleConfigScreenProps {
  sourceImage: ProcessedSourceImage | null;
  initialSettings: GameSettings;
  onStart: (pieces: string[], fullCroppedCanvas: HTMLCanvasElement, settings: GameSettings) => void;
  onViewRecords: (gridSize: GridSize, shuffleLevel: ShuffleLevel) => void;
  onImageChange: (image: ProcessedSourceImage) => void;
}

export const PuzzleConfigScreen: React.FC<PuzzleConfigScreenProps> = ({
  sourceImage,
  initialSettings,
  onStart,
  onViewRecords,
  onImageChange,
}) => {
  const [gridSize, setGridSize] = useState<GridSize>(initialSettings.gridSize);
  const [shuffleLevel, setShuffleLevel] = useState<ShuffleLevel>(initialSettings.shuffleLevel);
  const [showNumbers, setShowNumbers] = useState(initialSettings.showNumbers);

  // ズーム（1.0〜3.0）とパン位置（-0.5〜0.5）
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  // 画像変更・ドラッグ＆ドロップ関連
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // クロップ領域の計算（正方形、余白なし制約）
  const calculateCropArea = useCallback((): CropArea => {
    if (!sourceImage) {
      return { x: 0, y: 0, width: 1, height: 1 };
    }
    const { width: imgW, height: imgH } = sourceImage;
    const baseCropSize = Math.min(imgW, imgH);
    const effectiveCropSize = baseCropSize / zoom;

    // クロップ可能範囲
    const maxOffsetNormX = (imgW - effectiveCropSize) / imgW;
    const maxOffsetNormY = (imgH - effectiveCropSize) / imgH;

    // pan (-0.5〜0.5) をオフセットにマッピング
    const normX = Math.max(0, Math.min(maxOffsetNormX, (imgW - effectiveCropSize) / (2 * imgW) + pan.x));
    const normY = Math.max(0, Math.min(maxOffsetNormY, (imgH - effectiveCropSize) / (2 * imgH) + pan.y));

    return {
      x: normX,
      y: normY,
      width: effectiveCropSize / imgW,
      height: effectiveCropSize / imgH,
    };
  }, [sourceImage, zoom, pan]);

  // プレビュー描画（パズル盤面と同一の角丸・隙間・質感・空白マス・番号表示を再現）
  const drawPreview = useCallback(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 640;
    canvas.width = size;
    canvas.height = size;

    if (!sourceImage) {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, size, size);
      return;
    }

    const crop = calculateCropArea();
    const sx = crop.x * sourceImage.width;
    const sy = crop.y * sourceImage.height;
    const sWidth = crop.width * sourceImage.width;
    const sHeight = crop.height * sourceImage.height;

    // 1. パズル盤面背景色 (パズル画面の bg-slate-800/95: #1e293b)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, size, size);

    // 2. パディングとピース間ギャップの計算（パズル画面の実寸比率を忠実にスケール）
    const padding = gridSize === 3 ? 16 : 12; // 320px換算で 8px / 6px
    const gap = gridSize === 3 ? 8 : gridSize <= 5 ? 6 : 4; // 320px換算で 4px / 3px / 2px
    const boardInner = size - padding * 2;
    const tileSize = (boardInner - gap * (gridSize - 1)) / gridSize;
    const cornerRadius = 6; // 320px換算で 3px (rounded-[3px])

    // 角丸パス描画用ヘルパー
    const addRoundRect = (
      c: CanvasRenderingContext2D,
      x: number,
      y: number,
      w: number,
      h: number,
      r: number
    ) => {
      if (typeof c.roundRect === 'function') {
        c.roundRect(x, y, w, h, r);
      } else {
        c.beginPath();
        c.moveTo(x + r, y);
        c.lineTo(x + w - r, y);
        c.quadraticCurveTo(x + w, y, x + w, y + r);
        c.lineTo(x + w, y + h - r);
        c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        c.lineTo(x + r, y + h);
        c.quadraticCurveTo(x, y + h, x, y + h - r);
        c.lineTo(x, y + r);
        c.quadraticCurveTo(x, y, x + r, y);
        c.closePath();
      }
    };

    // 3. 各ピースを描画
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const dx = padding + col * (tileSize + gap);
        const dy = padding + row * (tileSize + gap);
        const tileIndex = row * gridSize + col;
        const isBlank = row === gridSize - 1 && col === gridSize - 1;

        if (isBlank) {
          // 右下の空白ピース
          ctx.save();
          ctx.beginPath();
          addRoundRect(ctx, dx, dy, tileSize, tileSize, cornerRadius);
          ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
          ctx.fill();

          ctx.setLineDash([8, 6]);
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
          ctx.lineWidth = 2;
          ctx.stroke();

          // 視認性の良い「空白」ラベル
          ctx.fillStyle = 'rgba(148, 163, 184, 0.75)';
          ctx.font = 'bold 18px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('空白', dx + tileSize / 2, dy + tileSize / 2);
          ctx.restore();
          continue;
        }

        // 通常ピースの元画像対応領域
        const srcTileW = sWidth / gridSize;
        const srcTileH = sHeight / gridSize;
        const srcTileX = sx + col * srcTileW;
        const srcTileY = sy + row * srcTileH;

        ctx.save();
        ctx.beginPath();
        addRoundRect(ctx, dx, dy, tileSize, tileSize, cornerRadius);
        ctx.clip();

        // ピース画像を描画
        ctx.drawImage(
          sourceImage.canvas,
          srcTileX,
          srcTileY,
          srcTileW,
          srcTileH,
          dx,
          dy,
          tileSize,
          tileSize
        );

        // ピース上部の微細な立体ハイライトライン
        ctx.beginPath();
        ctx.moveTo(dx + cornerRadius, dy + 1.5);
        ctx.lineTo(dx + tileSize - cornerRadius, dy + 1.5);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // ピース外周の境界シャドウ
        ctx.beginPath();
        addRoundRect(ctx, dx, dy, tileSize, tileSize, cornerRadius);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();

        // ピース番号表示（showNumbers がオンの場合）
        if (showNumbers) {
          ctx.save();
          const numText = (tileIndex + 1).toString();
          ctx.font = 'bold 17px sans-serif';
          const textMetrics = ctx.measureText(numText);
          const badgeW = Math.max(26, textMetrics.width + 12);
          const badgeH = 24;
          const bx = dx + 6;
          const by = dy + 6;

          // 番号バッジの黒半透明背景
          ctx.beginPath();
          addRoundRect(ctx, bx, by, badgeW, badgeH, 4);
          ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
          ctx.fill();

          // 番号テキスト
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(numText, bx + badgeW / 2, by + badgeH / 2 + 1);

          ctx.restore();
        }
      }
    }
  }, [sourceImage, calculateCropArea, gridSize, showNumbers]);

  useEffect(() => {
    drawPreview();
  }, [drawPreview]);

  // マウス/タッチドラッグによるパン操作
  const handlePointerDown = (clientX: number, clientY: number) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: clientX, y: clientY };
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!isDraggingRef.current) return;
    const dx = clientX - lastMousePosRef.current.x;
    const dy = clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: clientX, y: clientY };

    // 移動量を正規化スケールで反映（感度調整）
    const sensitivity = 0.002 / zoom;
    setPan((prev) => ({
      x: prev.x - dx * sensitivity,
      y: prev.y - dy * sensitivity,
    }));
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  // ファイル選択ハンドラ
  const handleFileProcess = async (file: File) => {
    setErrorMessage(null);
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage('JPEG、PNG、または WebP 形式の画像を選択してください。');
      return;
    }

    try {
      setIsProcessing(true);
      const processed = await processImageFile(file);
      onImageChange(processed);
      setPan({ x: 0, y: 0 });
      setZoom(1);
    } catch (err) {
      console.error(err);
      setErrorMessage('画像の読み込みに失敗しました。別の画像をお試しください。');
    } finally {
      setIsProcessing(false);
    }
  };

  // サンプル画像の再読み込み
  const handleLoadSample = async () => {
    setErrorMessage(null);
    try {
      setIsProcessing(true);
      const processed = await processImageUrl('/sample.jpg');
      onImageChange(processed);
      setPan({ x: 0, y: 0 });
      setZoom(1);
    } catch (err) {
      console.error(err);
      setErrorMessage('サンプル画像の読み込みに失敗しました。');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileProcess(e.target.files[0]);
    }
    // 同じファイルを再選択できるようにリセット
    e.target.value = '';
  };

  // プレビュー枠へのドラッグ＆ドロップハンドラ
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleStartGame = () => {
    if (!sourceImage) return;

    // 設定保存
    saveSettings({ gridSize, shuffleLevel, showNumbers });

    // クロップ＆画像スライス
    const crop = calculateCropArea();
    const croppedCanvas = cropImageToSquare(sourceImage.canvas, crop, 1024);
    const pieces = sliceImageToPieces(croppedCanvas, gridSize);

    onStart(pieces, croppedCanvas, { gridSize, shuffleLevel, showNumbers });
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      {/* ホーム画面ヘッダー */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200/90 p-2 flex items-center justify-center shadow-xs flex-shrink-0">
            <img
              src="/favicon.svg"
              alt="Slide Puzzle Lab ロゴ"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 leading-tight">
              Slide Puzzle Lab
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              お気に入りの画像で楽しむスライドパズル
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold border border-emerald-200/60 shadow-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>完全ローカル</span>
        </div>
      </div>

      {/* 隠しファイル入力 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* 正方形クロッププレビュー ＆ 画像選択 */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200/80 mb-6 flex flex-col items-center">
        <div
          ref={containerRef}
          className={`w-full max-w-[320px] aspect-square rounded-2xl shadow-xl overflow-hidden bg-slate-800/95 border-2 relative cursor-grab active:cursor-grabbing touch-none select-none transition-colors ${
            isDragOver ? 'border-blue-500 ring-4 ring-blue-500/20' : 'border-slate-700/80'
          }`}
          onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
          onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={(e) => {
            if (e.touches.length === 1) {
              handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
            }
          }}
          onTouchMove={(e) => {
            if (e.touches.length === 1) {
              handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
            }
          }}
          onTouchEnd={handlePointerUp}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {sourceImage ? (
            <canvas
              ref={previewCanvasRef}
              className="w-full h-full object-cover pointer-events-none"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-3">
              <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-medium">画像を準備中...</span>
            </div>
          )}

          {/* 画像処理中オーバーレイ */}
          {isProcessing && (
            <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-2 z-10">
              <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-semibold">画像を処理中...</span>
            </div>
          )}

          {/* ドラッグオーバー時の案内表示 */}
          {isDragOver && (
            <div className="absolute inset-0 bg-blue-600/80 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-2 z-10 pointer-events-none">
              <Upload className="w-10 h-10 animate-bounce" />
              <span className="text-sm font-bold">ここに画像をドロップ</span>
            </div>
          )}
        </div>

        <p className="text-[11px] text-slate-400 mt-2 text-center">
          ドラッグで表示位置を移動できます（画像ファイルのドロップも可）
        </p>

        {/* 画像変更ボタンエリア */}
        <div className="flex items-center gap-2 mt-3 w-full max-w-[320px]">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="flex-1 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-bold border border-slate-200/80 shadow-xs"
            icon={<Upload className="w-3.5 h-3.5 text-blue-600" />}
          >
            写真を選ぶ
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleLoadSample}
            disabled={isProcessing}
            className="text-slate-600 hover:text-slate-900 border border-slate-200/80 bg-slate-50 hover:bg-slate-100 shadow-xs font-semibold"
            icon={<RotateCcw className="w-3.5 h-3.5 text-amber-600" />}
          >
            サンプル
          </Button>
        </div>

        {/* ズームスライダー */}
        <div className="flex items-center gap-3 w-full max-w-[280px] mt-4 pt-3 border-t border-slate-100">
          <ZoomOut className="w-4 h-4 text-slate-400" />
          <input
            type="range"
            min="1"
            max="2.5"
            step="0.05"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            aria-label="ズーム倍率"
          />
          <ZoomIn className="w-4 h-4 text-slate-400" />
        </div>

        {/* エラーメッセージ */}
        {errorMessage && (
          <div className="mt-3 p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2 w-full max-w-[320px]">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* 設定フォーム */}
      <div className="space-y-5 bg-white p-5 rounded-3xl shadow-sm border border-slate-200/80 mb-6">
        {/* 分割数 */}
        <div>
          <label className="block text-sm font-bold text-slate-800 mb-2">
            ピースの分割数
          </label>
          <div className="grid grid-cols-4 gap-2">
            {GRID_OPTIONS.map((opt) => (
              <button
                key={opt.size}
                type="button"
                onClick={() => setGridSize(opt.size)}
                className={`py-2.5 px-2 rounded-xl text-center font-bold text-sm transition-all ${
                  gridSize === opt.size
                    ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-600 ring-offset-2'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <div>{opt.label}</div>
                <div className="text-[10px] font-normal opacity-80">{opt.tiles}ピース</div>
              </button>
            ))}
          </div>
        </div>

        {/* シャッフルの度合い */}
        <div>
          <label className="block text-sm font-bold text-slate-800 mb-2">
            シャッフルの度合い
          </label>
          <div className="grid grid-cols-3 gap-2">
            {SHUFFLE_OPTIONS.map((opt) => (
              <button
                key={opt.level}
                type="button"
                onClick={() => setShuffleLevel(opt.level)}
                className={`p-2.5 rounded-xl text-left transition-all ${
                  shuffleLevel === opt.level
                    ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-600 ring-offset-2'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <div className="font-bold text-sm">{opt.label}</div>
                <div className="text-[10px] mt-0.5 opacity-80 leading-snug">
                  {opt.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ピース番号表示スイッチ */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Hash className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800">ピース番号を表示</div>
              <div className="text-[11px] text-slate-500">
                絵柄が分かりにくいときの補助用（プレイ中も切替可）
              </div>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={showNumbers}
            onClick={() => setShowNumbers(!showNumbers)}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
              showNumbers ? 'bg-blue-600' : 'bg-slate-300'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                showNumbers ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* 開始ボタン & 記録ボタン */}
      <div className="flex gap-3">
        <Button
          variant="primary"
          size="lg"
          className="flex-1 shadow-md"
          icon={<Play className="w-5 h-5 fill-current" />}
          onClick={handleStartGame}
          disabled={!sourceImage || isProcessing}
        >
          パズルを開始する
        </Button>
        <Tooltip text="過去の記録・ランキングを見る" position="top">
          <Button
            variant="outline"
            size="lg"
            className="shadow-sm"
            icon={<Trophy className="w-5 h-5" />}
            onClick={() => onViewRecords(gridSize, shuffleLevel)}
            aria-label="記録一覧"
          />
        </Tooltip>
      </div>
    </div>
  );
};
