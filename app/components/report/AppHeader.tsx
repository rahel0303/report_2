'use client';

import React from 'react';
import { MonitorPlay, LogOut, ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AppHeaderProps {
  currentStep: 'setup' | 'review' | 'edit_cover' | 'edit_generic' | 'design_cover';
}

export const AppHeader: React.FC<AppHeaderProps> = ({ currentStep }) => {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm h-16">
      <div className="max-w-7xl mx-auto px-6 h-full flex justify-between items-center">
        <div className="flex items-center gap-3">
          {currentStep === 'setup' && (
            <button
              onClick={() => router.push('/home')}
              className="flex items-center gap-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-3 py-2 rounded-lg transition-colors font-bold text-sm"
            >
              <ChevronLeft size={22} />
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="bg-slate-900 text-white p-1.5 rounded-lg">
              <MonitorPlay size={20} />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              AutoMetric
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
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

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-slate-200 hover:border-red-200"
          >
            <LogOut size={13} />
            Logout
          </button>

        </div>
      </div>
    </header>
  );
};
