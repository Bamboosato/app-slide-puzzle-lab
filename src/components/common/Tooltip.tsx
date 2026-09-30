import React, { useId } from 'react';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  text: string;
  position?: TooltipPosition;
  children: React.ReactNode;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  text,
  position = 'top',
  children,
  className = '',
}) => {
  const tooltipId = useId();

  // 位置ごとの配置スタイルと矢印スタイル
  const positionStyles: Record<TooltipPosition, { container: string; arrow: string }> = {
    top: {
      container: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
      arrow: 'top-full left-1/2 -translate-x-1/2 border-t-slate-800/95 border-x-transparent border-b-transparent border-t-[5px] border-x-[5px] border-b-0',
    },
    bottom: {
      container: 'top-full left-1/2 -translate-x-1/2 mt-2',
      arrow: 'bottom-full left-1/2 -translate-x-1/2 border-b-slate-800/95 border-x-transparent border-t-transparent border-b-[5px] border-x-[5px] border-t-0',
    },
    left: {
      container: 'right-full top-1/2 -translate-y-1/2 mr-2',
      arrow: 'left-full top-1/2 -translate-y-1/2 border-left-slate-800/95 border-y-transparent border-r-transparent border-l-[5px] border-y-[5px] border-r-0',
    },
    right: {
      container: 'left-full top-1/2 -translate-y-1/2 ml-2',
      arrow: 'right-full top-1/2 -translate-y-1/2 border-right-slate-800/95 border-y-transparent border-l-transparent border-r-[5px] border-y-[5px] border-l-0',
    },
  };

  const { container, arrow } = positionStyles[position];

  return (
    <div className={`relative group inline-flex ${className}`}>
      {children}
      <div
        id={tooltipId}
        role="tooltip"
        aria-hidden="true"
        className={`pointer-events-none absolute z-50 px-2.5 py-1 text-[11px] font-medium text-white 
          bg-slate-800/95 backdrop-blur-xs rounded-lg shadow-lg whitespace-nowrap 
          opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 
          transition-opacity duration-150 delay-75 select-none ${container}`}
      >
        {text}
        <span className={`absolute w-0 h-0 border-solid ${arrow}`} />
      </div>
    </div>
  );
};
