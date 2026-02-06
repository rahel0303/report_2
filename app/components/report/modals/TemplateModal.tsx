import React from 'react';
import { Minus, Layout } from 'lucide-react';
import { Template } from '@/app/types';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (templateType: string) => void;
  templates: Template[];
}

export const TemplateModal: React.FC<TemplateModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  templates,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl border border-slate-200">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Choose Layout</h3>
            <p className="text-sm text-slate-500">Select a starting point for your analysis.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
            <Minus size={20} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {templates.map((tmpl) => (
            <button
              key={tmpl.id}
              onClick={() => onSelect(tmpl.id)}
              className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 hover:shadow-md transition-all text-left group"
            >
              <div className="p-3 bg-blue-100 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <tmpl.icon size={24} />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 group-hover:text-blue-700">{tmpl.name}</h4>
                <p className="text-xs text-slate-500 mt-1">{tmpl.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
