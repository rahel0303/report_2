import React from 'react';

interface ExitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAsTemplate: () => void;
  onSaveAsReport: () => void;
  onExitWithoutSaving: () => void;
}

export const ExitModal: React.FC<ExitModalProps> = ({
  isOpen,
  onClose,
  onSaveAsTemplate,
  onSaveAsReport,
  onExitWithoutSaving,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <h3 className="text-xl font-bold mb-4">Save Before Exiting?</h3>
        <p className="text-slate-600 mb-6">Choose how you want to save your work</p>

        <div className="space-y-3">
          <button
            onClick={onSaveAsTemplate}
            className="w-full p-4 border-2 border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
          >
            <div className="font-bold text-slate-900">Save as Template</div>
            <div className="text-sm text-slate-600">Save structure only (reusable)</div>
          </button>

          <button
            onClick={onSaveAsReport}
            className="w-full p-4 border-2 border-slate-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-left"
          >
            <div className="font-bold text-slate-900">Save Report</div>
            <div className="text-sm text-slate-600">Save with all data</div>
          </button>

          <button
            onClick={onExitWithoutSaving}
            className="w-full p-4 border-2 border-slate-200 rounded-lg hover:border-red-500 hover:bg-red-50 transition-all text-left"
          >
            <div className="font-bold text-slate-900">Exit Without Saving</div>
            <div className="text-sm text-slate-600">Discard changes</div>
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
