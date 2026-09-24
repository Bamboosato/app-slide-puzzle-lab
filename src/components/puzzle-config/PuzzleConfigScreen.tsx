import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Play, ZoomIn, ZoomOut, Hash } from 'lucide-react';
import { Button } from '../common/Button';
import { ProcessedSourceImage, cropImageToSquare, sliceImageToPieces } from '../../logic/imageProcessor';
import { GridSize, ShuffleLevel, GameSettings, CropArea } from '../../types/puzzle';
import { GRID_OPTIONS, SHUFFLE_OPTIONS } from '../../config/constants';
import { saveSettings } from '../../logic/storage';

interface PuzzleConfigScreenProps {
  sourceImage: ProcessedSourceImage;
  initialSettings: GameSettings;
  onBack: () => void;
  onStart: (pieces: string[], fullCroppedCanvas: HTMLCanvasElement, settings: GameSettings) => void;
}

export const PuzzleConfigScreen: React.FC<PuzzleConfigScreenProps> = ({
  sourceImage,
  initialSettings,
  onBack,
  onStart,
}) => {
  const [gridSize, setGridSize] = useState<GridSize>(initialSettings.gridSize);
  const [shuffleLevel, setShuffleLevel] = useState<ShuffleLevel>(initialSettings.shuffleLevel);
  const [showNumbers, setShowNumbers] = useState(initialSettings.showNumbers);

  // ズーム（1.0〜3.0）とパン位置（-0.5〜0.5）
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // クロップ領域の計算（正方形、余白なし制約）
  const calculateCropArea = useCallback((): CropArea => {
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

    const crop = calculateCropArea();
    const sx = crop.x * sourceImage.width;
    const sy = crop.y * sourceImage.height;
    const sWidth = crop.width * sourceImage.width;
    const sHeight = crop.height * sourceImage.height;

    // Retina・高解像度表示対応 (640x640)
    const size = 640;
    canvas.width = size;
    canvas.height = size;

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
          // 右下の空白ピース（パズル画面の bg-slate-900/60 + border-dashed border-slate-600/40 を忠実に再現）
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

        // ピース上部の微細な立体ハイライトライン (inset_0_1px_0_rgba(255,255,255,0.35))
        ctx.beginPath();
        ctx.moveTo(dx + cornerRadius, dy + 1.5);
        ctx.lineTo(dx + tileSize - cornerRadius, dy + 1.5);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // ピース外周の境界シャドウ (inset_0_0_0_1px_rgba(0,0,0,0.15))
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

  const handleStartGame = () => {
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
      {/* ナビゲーションバー */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 px-2 py-1 rounded-lg hover:bg-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>別の画像を選ぶ</span>
        </button>
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          設定
        </span>
      </div>

      {/* 正方形クロッププレビュー */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200/80 mb-6 flex flex-col items-center">
        <div
          ref={containerRef}
          className="w-full max-w-[320px] aspect-square rounded-2xl shadow-xl overflow-hidden bg-slate-800/95 border-2 border-slate-700/80 relative cursor-grab active:cursor-grabbing touch-none select-none"
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
        >
          <canvas
            ref={previewCanvasRef}
            className="w-full h-full object-cover pointer-events-none"
          />
        </div>

        <p className="text-[11px] text-slate-400 mt-2 text-center">
          ドラッグして表示位置を調整できます
        </p>

        {/* ズームスライダー */}
        <div className="flex items-center gap-3 w-full max-w-[280px] mt-3">
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

      {/* 開始ボタン */}
      <Button
        variant="primary"
        size="lg"
        className="w-full shadow-md"
        icon={<Play className="w-5 h-5 fill-current" />}
        onClick={handleStartGame}
      >
        パズルを開始する
      </Button>
    </div>
  );
};
