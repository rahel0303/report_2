'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface ExportProgressModalProps {
  isOpen: boolean;
  current: number;
  total: number;
  currentTitle?: string;
  isDone?: boolean;
  onClose?: () => void;
}

export const ExportProgressModal: React.FC<ExportProgressModalProps> = ({
  isOpen,
  current,
  total,
  currentTitle,
  isDone,
  onClose,
}) => {
  if (!isOpen) return null;

  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  if (isDone) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 flex flex-col items-center gap-5">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
            <CheckCircle2 size={36} className="text-emerald-600" />
          </div>
          <div className="text-center">
            <p className="text-xl font-black text-slate-900">Export Complete!</p>
            <p className="text-sm text-slate-500 mt-1">{total} slides exported successfully</p>
          </div>
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 flex flex-col items-center gap-5">
        {/* Circular progress */}
        <div className="relative w-16 h-16">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="28" fill="none" stroke="#e2e8f0" strokeWidth="6" />
            <circle
              cx="32" cy="32" r="28"
              fill="none"
              stroke="#1e293b"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 28}`}
              strokeDashoffset={`${2 * Math.PI * 28 * (1 - percentage / 100)}`}
              style={{ transition: 'stroke-dashoffset 0.3s ease' }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-900">
            {percentage}%
          </span>
        </div>

        {/* Counter */}
        <div className="text-center">
          <p className="text-2xl font-black text-slate-900 tracking-tight">
            {current} <span className="text-slate-400 font-normal text-lg">/</span> {total}
          </p>
          <p className="text-xs text-slate-500 mt-1">slides exported</p>
        </div>

        {currentTitle && (
          <p className="text-xs text-slate-400 text-center max-w-[200px] truncate">{currentTitle}</p>
        )}

        {/* Progress bar */}
        <div className="w-full bg-slate-100 rounded-full h-1.5">
          <div
            className="bg-slate-900 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <p className="text-xs text-slate-400">Please wait, do not close this window...</p>
      </div>
    </div>
  );
};
