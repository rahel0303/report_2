import React from 'react';
import { CheckCircle2, Loader2, Download } from 'lucide-react';

interface ToastsProps {
  showSaveToast: boolean;
  isExporting: boolean;
  showExportToast: boolean;
}

export const Toasts: React.FC<ToastsProps> = ({ showSaveToast, isExporting, showExportToast }) => {
  return (
    <>
      {/* Save Toast */}
      {showSaveToast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-in slide-in-from-right fade-in duration-300">
          <CheckCircle2 size={20} />
          <div>
            <h4 className="font-bold text-sm">Report Saved</h4>
            <p className="text-xs opacity-90">Returning to setup...</p>
          </div>
        </div>
      )}


    </>
  );
};
