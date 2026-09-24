import { CropArea, GridSize } from '../types/puzzle';
import { MAX_IMAGE_DIMENSION, OUTPUT_CROP_SIZE } from '../config/constants';

export interface ProcessedSourceImage {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

/**
 * 選択された画像ファイルを読み込み、Exif自動補正・透過背景処理・最大解像度（1024px）縮小を行う。
 */
export async function processImageFile(file: File): Promise<ProcessedSourceImage> {
  let imgBitmap: ImageBitmap | HTMLImageElement;

  try {
    // createImageBitmap が利用可能かつ imageOrientation オプションがサポートされている場合
    if ('createImageBitmap' in window) {
      imgBitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    } else {
      imgBitmap = await loadImageElementFallback(file);
    }
  } catch {
    // フォールバック
    imgBitmap = await loadImageElementFallback(file);
  }

  const origWidth = imgBitmap.width;
  const origHeight = imgBitmap.height;

  // 長辺最大 1024px にリサイズ
  let targetWidth = origWidth;
  let targetHeight = origHeight;

  if (origWidth > MAX_IMAGE_DIMENSION || origHeight > MAX_IMAGE_DIMENSION) {
    if (origWidth >= origHeight) {
      targetWidth = MAX_IMAGE_DIMENSION;
      targetHeight = Math.round((origHeight * MAX_IMAGE_DIMENSION) / origWidth);
    } else {
      targetHeight = MAX_IMAGE_DIMENSION;
      targetWidth = Math.round((origWidth * MAX_IMAGE_DIMENSION) / origHeight);
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas context could not be created');
  }

  // 透過画像対策: 白背景で塗りつぶし
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // 画像描画
  ctx.drawImage(imgBitmap as CanvasImageSource, 0, 0, targetWidth, targetHeight);

  return {
    canvas,
    width: targetWidth,
    height: targetHeight,
  };
}

/**
 * URLから画像を読み込み、Canvasを展開する（サンプル画像読み込み用）。
 */
export async function processImageUrl(url: string): Promise<ProcessedSourceImage> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const origWidth = img.naturalWidth || img.width;
      const origHeight = img.naturalHeight || img.height;

      let targetWidth = origWidth;
      let targetHeight = origHeight;

      if (origWidth > MAX_IMAGE_DIMENSION || origHeight > MAX_IMAGE_DIMENSION) {
        if (origWidth >= origHeight) {
          targetWidth = MAX_IMAGE_DIMENSION;
          targetHeight = Math.round((origHeight * MAX_IMAGE_DIMENSION) / origWidth);
        } else {
          targetHeight = MAX_IMAGE_DIMENSION;
          targetWidth = Math.round((origWidth * MAX_IMAGE_DIMENSION) / origHeight);
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context could not be created'));
        return;
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      resolve({
        canvas,
        width: targetWidth,
        height: targetHeight,
      });
    };
    img.onerror = () => reject(new Error('Failed to load sample image'));
    img.src = url;
  });
}

function loadImageElementFallback(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * プレビュー指定されたクロップ領域から、正方形の完成画像（1024×1024px）を生成する。
 */
export function cropImageToSquare(
  sourceCanvas: HTMLCanvasElement,
  crop: CropArea,
  outputSize = OUTPUT_CROP_SIZE
): HTMLCanvasElement {
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = outputSize;
  outputCanvas.height = outputSize;
  const ctx = outputCanvas.getContext('2d');
  if (!ctx) {
    throw new Error('Output canvas context could not be created');
  }

  const sx = crop.x * sourceCanvas.width;
  const sy = crop.y * sourceCanvas.height;
  const sWidth = crop.width * sourceCanvas.width;
  const sHeight = crop.height * sourceCanvas.height;

  // 白背景マット
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, outputSize, outputSize);

  // 切り抜き描画
  ctx.drawImage(sourceCanvas, sx, sy, sWidth, sHeight, 0, 0, outputSize, outputSize);

  return outputCanvas;
}

/**
 * 正方形画像を各ピースに分割し、データURL配列を生成する。
 * 配列長は gridSize^2。最後の要素は右下端ピース（完成時用）。
 */
export function sliceImageToPieces(
  squareCanvas: HTMLCanvasElement,
  gridSize: GridSize
): string[] {
  const tileSize = Math.floor(squareCanvas.width / gridSize);
  const pieces: string[] = [];

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const pieceCanvas = document.createElement('canvas');
      pieceCanvas.width = tileSize;
      pieceCanvas.height = tileSize;
      const ctx = pieceCanvas.getContext('2d');
      if (!ctx) continue;

      const sx = col * tileSize;
      const sy = row * tileSize;

      ctx.drawImage(squareCanvas, sx, sy, tileSize, tileSize, 0, 0, tileSize, tileSize);
      pieces.push(pieceCanvas.toDataURL('image/jpeg', 0.9));
    }
  }

  return pieces;
}

/**
 * 画像の中央に正方形の初期クロップ領域（CropArea）を計算する。
 */
export function getDefaultCropArea(width: number, height: number): CropArea {
  if (width >= height) {
    const squareRatio = height / width;
    return {
      x: (1 - squareRatio) / 2,
      y: 0,
      width: squareRatio,
      height: 1,
    };
  } else {
    const squareRatio = width / height;
    return {
      x: 0,
      y: (1 - squareRatio) / 2,
      width: 1,
      height: squareRatio,
    };
  }
}
