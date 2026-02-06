import React from 'react';
import { Plus, FileText } from 'lucide-react';

interface TemplateSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartFresh: () => void;
  onLoadTemplate: () => void;
}

export const TemplateSelectionModal: React.FC<TemplateSelectionModalProps> = ({
  isOpen,
  onClose,
  onStartFresh,
  onLoadTemplate,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6">
        <h3 className="text-2xl font-bold mb-4">Start Your Report</h3>
        <p className="text-slate-600 mb-6">Choose how you want to begin</p>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={onStartFresh}
            className="p-6 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50/50 transition-all group"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-200 transition-colors">
              <Plus size={24} className="text-blue-600" />
            </div>
            <h4 className="font-bold text-slate-900 mb-2">Start Fresh</h4>
            <p className="text-sm text-slate-600">Begin with an empty report</p>
          </button>

          <button
            onClick={onLoadTemplate}
            className="p-6 border-2 border-slate-200 rounded-xl hover:border-purple-500 hover:bg-purple-50/50 transition-all group"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-purple-200 transition-colors">
              <FileText size={24} className="text-purple-600" />
            </div>
            <h4 className="font-bold text-slate-900 mb-2">Load Template</h4>
            <p className="text-sm text-slate-600">Use a saved template</p>
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
