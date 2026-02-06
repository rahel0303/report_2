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

      {/* Exporting Toast */}
      {isExporting && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-6 py-4 rounded-lg shadow-xl flex items-center gap-4">
          <Loader2 size={24} className="animate-spin text-blue-400" />
          <div>
            <h4 className="font-bold text-sm">Generating File...</h4>
            <p className="text-xs text-slate-400">Capturing slides & compiling assets</p>
          </div>
        </div>
      )}

      {/* Export Complete Toast */}
      {showExportToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white px-6 py-4 rounded-lg shadow-xl flex items-center gap-3">
          <Download size={24} />
          <div>
            <h4 className="font-bold text-sm">Download Complete</h4>
            <p className="text-xs opacity-90">Your file has been generated successfully.</p>
          </div>
        </div>
      )}
    </>
  );
};
