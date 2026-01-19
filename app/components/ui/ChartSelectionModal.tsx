import React, { useState } from 'react';
import { X, ArrowLeft, Grid, Activity, BarChart3, PieChart } from 'lucide-react';
import { ChartSelectionModalProps } from '@/app/types';

export const ChartSelectionModal: React.FC<ChartSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  config,
}) => {
  if (!isOpen) return null;
  const isDark = config.theme.type === 'dark';
  const [postMode, setPostMode] = useState(false);

  const options = [
    { id: 'line', label: 'Line Chart', icon: Activity },
    { id: 'bar', label: 'Bar Chart', icon: BarChart3 },
    { id: 'column', label: 'Column Chart', icon: BarChart3 },
    { id: 'pie', label: 'Pie Chart', icon: PieChart },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-md p-6 rounded-2xl shadow-2xl transform transition-all ${
          isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white'
        }`}
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Select Visualization
            </h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Choose data representation style.
            </p>
          </div>
          <button onClick={onClose}>
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {!postMode ? (
          <div className="grid grid-cols-3 gap-3">
            {options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => onSelect(opt.id)}
                className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all hover:scale-105 ${
                  isDark
                    ? 'border-slate-700 hover:bg-slate-800 text-slate-300'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <opt.icon size={24} className="opacity-70" />
                <span className="text-xs font-bold">{opt.label}</span>
              </button>
            ))}
            <button
              onClick={() => setPostMode(true)}
              className={`col-span-2 p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all hover:scale-105 bg-blue-50/50 border-blue-200 text-blue-700`}
            >
              <Grid size={24} />
              <span className="text-xs font-bold">Post Visual Analysis</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setPostMode(false)}
              className="text-xs text-slate-500 flex items-center gap-1 mb-2 hover:text-blue-500"
            >
              <ArrowLeft size={12} /> Back to Charts
            </button>
            <div className="grid grid-cols-3 gap-3">
              {[2, 3, 4].map((num) => (
                <button
                  key={num}
                  onClick={() => onSelect('posts', { count: num })}
                  className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all hover:scale-105 ${
                    isDark
                      ? 'border-slate-700 hover:bg-slate-800 text-slate-300'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex gap-0.5">
                    {Array.from({ length: Math.min(num, 3) }).map((_, i) => (
                      <div key={i} className="w-2 h-3 bg-current opacity-50 rounded-[1px]" />
                    ))}
                    {num > 3 && <span className="text-[8px]">+</span>}
                  </div>
                  <span className="text-xs font-bold">{num} Posts</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
