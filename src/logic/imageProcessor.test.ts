import { describe, it, expect } from 'vitest';
import { getTileBounds, getDefaultCropArea } from './imageProcessor';
import { GridSize } from '../types/puzzle';

describe('imageProcessor', () => {
  describe('getTileBounds (Pixel-perfect slicing without gap or loss)', () => {
    const gridSizes: GridSize[] = [3, 4, 5, 6];
    const imageWidth = 1024;
    const imageHeight = 1024;

    gridSizes.forEach((gridSize) => {
      it(`covers full 1024x1024 area seamlessly for ${gridSize}x${gridSize} grid`, () => {
        let totalTiles = 0;
        let lastRowBottom = 0;

        for (let row = 0; row < gridSize; row++) {
          let lastColRight = 0;

          for (let col = 0; col < gridSize; col++) {
            totalTiles++;
            const bounds = getTileBounds(col, row, imageWidth, imageHeight, gridSize);

            // X 座標の連続性チェック（前のタイルの右端と一致する）
            expect(bounds.sx).toBe(lastColRight);
            expect(bounds.sWidth).toBeGreaterThan(0);
            lastColRight = bounds.sx + bounds.sWidth;

            // Y 座標のチェック（行の開始座標が正しい）
            if (col === 0) {
              expect(bounds.sy).toBe(lastRowBottom);
            }
          }

          // 行の右端が画像幅（1024px）に正確に一致する（欠落・超過なし）
          expect(lastColRight).toBe(imageWidth);

          const sampleColBounds = getTileBounds(0, row, imageWidth, imageHeight, gridSize);
          lastRowBottom = sampleColBounds.sy + sampleColBounds.sHeight;
        }

        // 最下行の下端が画像高さ（1024px）に正確に一致する（欠落・超過なし）
        expect(lastRowBottom).toBe(imageHeight);
        expect(totalTiles).toBe(gridSize * gridSize);
      });

      it(`ensures max size difference between tiles is at most 1px for ${gridSize}x${gridSize}`, () => {
        const widths: number[] = [];
        const heights: number[] = [];

        for (let row = 0; row < gridSize; row++) {
          for (let col = 0; col < gridSize; col++) {
            const bounds = getTileBounds(col, row, imageWidth, imageHeight, gridSize);
            widths.push(bounds.sWidth);
            heights.push(bounds.sHeight);
          }
        }

        const minW = Math.min(...widths);
        const maxW = Math.max(...widths);
        const minH = Math.min(...heights);
        const maxH = Math.max(...heights);

        expect(maxW - minW).toBeLessThanOrEqual(1);
        expect(maxH - minH).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('getDefaultCropArea', () => {
    it('centers crop horizontally for wide landscape image', () => {
      // 1920x1080 (16:9)
      const crop = getDefaultCropArea(1920, 1080);
      expect(crop.y).toBe(0);
      expect(crop.height).toBe(1);
      expect(crop.width).toBeCloseTo(1080 / 1920, 5);
      expect(crop.x).toBeCloseTo((1 - (1080 / 1920)) / 2, 5);
    });

    it('centers crop vertically for tall portrait image', () => {
      // 1080x1920 (9:16)
      const crop = getDefaultCropArea(1080, 1920);
      expect(crop.x).toBe(0);
      expect(crop.width).toBe(1);
      expect(crop.height).toBeCloseTo(1080 / 1920, 5);
      expect(crop.y).toBeCloseTo((1 - (1080 / 1920)) / 2, 5);
    });

    it('returns full area for square image', () => {
      const crop = getDefaultCropArea(1000, 1000);
      expect(crop.x).toBe(0);
      expect(crop.y).toBe(0);
      expect(crop.width).toBe(1);
      expect(crop.height).toBe(1);
    });
  });
});
