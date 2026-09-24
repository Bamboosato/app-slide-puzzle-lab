import React from 'react';
import { Modal } from '../common/Modal';

interface OriginalImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalImageDataUrl?: string;
}

export const OriginalImageModal: React.FC<OriginalImageModalProps> = ({
  isOpen,
  onClose,
  originalImageDataUrl,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="完成イメージ（元画像）" maxWidth="max-w-md">
      <div className="flex flex-col items-center">
        <div className="w-full aspect-square rounded-2xl overflow-hidden shadow-md bg-slate-100 mb-4 border border-slate-200">
          {originalImageDataUrl ? (
            <img
              src={originalImageDataUrl}
              alt="パズルの完成元画像"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
              画像がありません
            </div>
          )}
        </div>
        <p className="text-xs text-slate-500 text-center">
          確認中はタイマーのカウントが一時停止しています。
        </p>
      </div>
    </Modal>
  );
};
