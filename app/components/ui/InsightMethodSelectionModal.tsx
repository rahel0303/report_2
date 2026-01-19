import React from 'react';
import { PenTool, Sparkles } from 'lucide-react';
import { InsightMethodSelectionModalProps } from '@/app/types';

export const InsightMethodSelectionModal: React.FC<InsightMethodSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectManual,
  onSelectAI,
  config,
}) => {
  if (!isOpen) return null;
  const isDark = config.theme.type === 'dark';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-sm p-6 rounded-2xl shadow-2xl transform transition-all ${
          isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white'
        }`}
      >
        <div className="text-center mb-6">
          <h3 className={`font-bold text-lg mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Add Insight
          </h3>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Choose how you want to add content to this slide.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={onSelectManual}
            className={`p-4 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all hover:scale-[1.02] group ${
              isDark
                ? 'border-slate-700 hover:border-blue-500 hover:bg-slate-800'
                : 'border-slate-200 hover:border-blue-500 hover:bg-blue-50'
            }`}
          >
            <div
              className={`p-3 rounded-full ${
                isDark
                  ? 'bg-slate-800 text-blue-400 group-hover:bg-blue-900/30'
                  : 'bg-slate-100 text-blue-600 group-hover:bg-blue-100'
              }`}
            >
              <PenTool size={24} />
            </div>
            <span className={`text-sm font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Manual Note
            </span>
          </button>

          <button
            onClick={onSelectAI}
            className={`p-4 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all hover:scale-[1.02] group ${
              isDark
                ? 'border-slate-700 hover:border-purple-500 hover:bg-slate-800'
                : 'border-slate-200 hover:border-purple-500 hover:bg-purple-50'
            }`}
          >
            <div
              className={`p-3 rounded-full ${
                isDark
                  ? 'bg-slate-800 text-purple-400 group-hover:bg-purple-900/30'
                  : 'bg-slate-100 text-purple-600 group-hover:bg-purple-100'
              }`}
            >
              <Sparkles size={24} />
            </div>
            <span className={`text-sm font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              AI Generator
            </span>
          </button>
        </div>

        <button
          onClick={onClose}
          className={`mt-6 w-full py-2 text-xs font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
