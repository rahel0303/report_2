import React from 'react';
import { MonitorPlay, CheckCircle2 } from 'lucide-react';

interface AppHeaderProps {
  currentStep: 'setup' | 'review' | 'edit_cover' | 'edit_generic' | 'design_cover';
}

export const AppHeader: React.FC<AppHeaderProps> = ({ currentStep }) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm h-16">
      <div className="max-w-7xl mx-auto px-6 h-full flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-slate-900 text-white p-1.5 rounded-lg">
            <MonitorPlay size={20} />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            AutoReport <span className="text-slate-400 font-normal">Generator</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {/* Auto-save indicator */}
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
            <CheckCircle2 size={12} />
            <span className="font-medium">Auto-saved</span>
          </div>

          {currentStep === 'setup' && (
            <span className="px-3 py-1 rounded bg-blue-50 text-blue-700 text-xs font-bold">
              Step 1: Setup
            </span>
          )}
          {currentStep === 'review' && (
            <span className="px-3 py-1 rounded bg-blue-50 text-blue-700 text-xs font-bold">
              Step 2: Review
            </span>
          )}
          {currentStep.startsWith('edit') && (
            <span className="px-3 py-1 rounded bg-blue-50 text-blue-700 text-xs font-bold">
              Step 3: Editing
            </span>
          )}
        </div>
      </div>
    </header>
  );
};
