import React, { useState } from 'react';
import { X, TrendingUp, TrendingDown, ArrowUpDown, Grid3x3 } from 'lucide-react';
import { ReportConfig } from '@/app/types';

interface ContentSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (filterType: string, postCount: number) => void;
  config: ReportConfig;
}

export const ContentSelectionModal: React.FC<ContentSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  config,
}) => {
  if (!isOpen) return null;

  const isDark = config.theme.type === 'dark';
  const [filterType, setFilterType] = useState<string>('top');
  const [postCount, setPostCount] = useState<number>(4);

  const handleConfirm = () => {
    onSelect(filterType, postCount);
    onClose();
  };

  const baseButtonClass = `p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all hover:scale-[1.02] ${
    isDark
      ? 'border-slate-700 hover:bg-slate-800 text-slate-300'
      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
  }`;

  const selectedButtonClass = isDark
    ? '!border-blue-500 !bg-blue-500/20 !text-blue-300 shadow-lg shadow-blue-500/20'
    : '!border-blue-500 !bg-blue-500 !text-white shadow-lg shadow-blue-500/30';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
      <div
        className={`w-full max-w-lg p-6 rounded-2xl shadow-2xl ${
          isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white'
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <div>
            <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Configure Visual Content
            </h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Select post filter and count
            </p>
          </div>
          <button onClick={onClose}>
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Filter Type Selection */}
        <div className="mb-6">
          <h4 className={`text-sm font-bold mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            Select Filter Type
          </h4>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setFilterType('top')}
              className={`${baseButtonClass} ${filterType === 'top' ? selectedButtonClass : ''}`}
            >
              <TrendingUp size={28} className="opacity-70" />
              <span className="text-sm font-bold">Top Posts</span>
              <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Best performing
              </span>
            </button>
            <button
              onClick={() => setFilterType('low')}
              className={`${baseButtonClass} ${filterType === 'low' ? selectedButtonClass : ''}`}
            >
              <TrendingDown size={28} className="opacity-70" />
              <span className="text-sm font-bold">Low Posts</span>
              <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Needs improvement
              </span>
            </button>
            <button
              onClick={() => setFilterType('mixed')}
              className={`${baseButtonClass} ${filterType === 'mixed' ? selectedButtonClass : ''}`}
            >
              <ArrowUpDown size={28} className="opacity-70" />
              <span className="text-sm font-bold">Top & Low</span>
              <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Both extremes
              </span>
            </button>
          </div>
        </div>

        {/* Post Count Selection */}
        <div className="mb-6">
          <h4 className={`text-sm font-bold mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            Number of Posts
          </h4>
          <div className="grid grid-cols-3 gap-3">
            {[4, 6, 8].map((count) => (
              <button
                key={count}
                onClick={() => setPostCount(count)}
                className={`${baseButtonClass} ${postCount === count ? selectedButtonClass : ''}`}
              >
                <Grid3x3 size={28} className="opacity-70" />
                <span className="text-lg font-bold">{count}</span>
                <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Posts
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Confirm Button */}
        <button
          onClick={handleConfirm}
          className="w-full py-3 rounded-xl font-bold text-sm transition-all bg-blue-600 text-white hover:bg-blue-700"
        >
          Apply Configuration
        </button>
      </div>
    </div>
  );
};
