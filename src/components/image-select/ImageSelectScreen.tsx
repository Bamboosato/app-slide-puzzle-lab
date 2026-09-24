import React, { useState, useRef } from 'react';
import { Upload, ShieldCheck, Image as ImageIcon, AlertTriangle, Sparkles, Play } from 'lucide-react';
import { processImageFile, processImageUrl, ProcessedSourceImage } from '../../logic/imageProcessor';

interface ImageSelectScreenProps {
  onImageSelected: (processed: ProcessedSourceImage) => void;
}

export const ImageSelectScreen: React.FC<ImageSelectScreenProps> = ({ onImageSelected }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setErrorMessage(null);

    // 形式チェック
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage(
        '対応していない画像形式です。JPEG、PNG、または WebP 形式の画像を選択してください。'
      );
      return;
    }

    try {
      setIsLoading(true);
      const processed = await processImageFile(file);
      onImageSelected(processed);
    } catch (err) {
      console.error(err);
      setErrorMessage('画像の読み込みに失敗しました。別の画像を選択してください。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSampleImage = async () => {
    setErrorMessage(null);
    try {
      setIsLoading(true);
      const processed = await processImageUrl('/sample.jpg');
      onImageSelected(processed);
    } catch (err) {
      console.error(err);
      setErrorMessage('サンプル画像の読み込みに失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 flex flex-col items-center">
      {/* ヘッダー */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-semibold mb-3">
          <Sparkles className="w-4 h-4" />
          <span>完全ローカル・オフライン対応</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
          Slide Puzzle Lab
        </h1>
        <p className="text-sm text-slate-600 max-w-lg mx-auto">
          <span className="inline-block">お気に入りの写真やイラストで、</span>
          <span className="inline-block">自分だけのオリジナルスライドパズルを楽しもう！</span>
        </p>
      </div>

      {/* ドロップゾーン / ファイル選択エリア（パズル盤面と同じ正方形＆角丸に統一） */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`w-full aspect-square max-w-[320px] sm:max-w-[340px] flex-none rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer flex flex-col items-center justify-center p-6 text-center select-none ${
          isDragging
            ? 'border-blue-500 bg-blue-50/70 scale-[1.02] shadow-md'
            : 'border-slate-300 hover:border-blue-400 bg-white shadow-sm hover:shadow-md'
        }`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        aria-label="画像ファイルを選択する"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={onFileInputChange}
        />

        {isLoading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-medium text-slate-600">画像を最適化中...</p>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
              <Upload className="w-8 h-8" />
            </div>
            <p className="text-base font-bold text-slate-800 mb-1">
              写真・画像をタップして選択
            </p>
            <p className="text-xs text-slate-500 mb-4">
              または、ここにファイルをドラッグ＆ドロップ
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md">
              <ImageIcon className="w-3.5 h-3.5" />
              <span>対応形式: JPEG / PNG / WebP</span>
            </div>
          </>
        )}
      </div>

      {/* サンプル画像で試す */}
      <div className="mt-5 flex flex-col items-center gap-2 w-full max-w-[320px] sm:max-w-[340px]">
        <div className="flex items-center gap-2 w-full">
          <div className="flex-1 h-px bg-slate-200"></div>
          <span className="text-xs text-slate-400 font-medium">または</span>
          <div className="flex-1 h-px bg-slate-200"></div>
        </div>

        <button
          type="button"
          onClick={handleSampleImage}
          disabled={isLoading}
          className="w-full flex items-center justify-between p-2.5 bg-white hover:bg-slate-50 active:bg-slate-100 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-sm transition-all text-left group"
        >
          <div className="flex items-center gap-3">
            <img
              src="/sample.jpg"
              alt="サンプル画像"
              className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-inner group-hover:scale-105 transition-transform"
            />
            <div>
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span>サンプル画像ですぐに試す</span>
                <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-semibold">
                  おすすめ
                </span>
              </div>
              <div className="text-[11px] text-slate-500">
                カラフルな研究所ロボット（位置関係が分かりやすい）
              </div>
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mr-1 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <Play className="w-4 h-4 fill-current ml-0.5" />
          </div>
        </button>
      </div>

      {/* エラーメッセージ */}
      {errorMessage && (
        <div className="mt-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2 max-w-sm w-full">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* プライバシー安心案内 */}
      <div className="mt-8 flex items-center gap-2 text-xs text-slate-500 bg-white/70 backdrop-blur-sm px-4 py-2.5 rounded-full border border-slate-200/80 shadow-sm">
        <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
        <span>画像は端末内でのみ処理され、外部サーバーへ送信されません</span>
      </div>
    </div>
  );
};
