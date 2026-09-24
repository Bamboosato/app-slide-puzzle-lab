import React from 'react';
import { RefreshCw, X } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export const PwaUpdateToast: React.FC = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ', r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    setNeedRefresh(false);
  };

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm bg-slate-900 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between gap-3 border border-slate-700 animate-slide-up">
      <div className="flex items-center gap-2.5">
        <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
        <span className="text-sm font-medium">新しいバージョンがあります</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => updateServiceWorker(true)}
          className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors"
        >
          更新
        </button>
        <button
          onClick={close}
          className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          aria-label="通知を閉じる"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
