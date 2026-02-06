import React from 'react';
import { X, Type, Layout } from 'lucide-react';

interface SlideTypeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSectionHeading: () => void;
  onSelectContentTemplate: () => void;
}

export const SlideTypeSelectionModal: React.FC<SlideTypeSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectSectionHeading,
  onSelectContentTemplate,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg border border-slate-200">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Add New Slide</h3>
            <p className="text-sm text-slate-500">Choose what type of slide you want to add</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3">
          {/* Section Heading Option */}
          <button
            onClick={onSelectSectionHeading}
            className="w-full flex items-start gap-4 p-5 rounded-xl border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 hover:shadow-md transition-all text-left group"
          >
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white shadow-md group-hover:scale-105 transition-transform">
              <Type size={28} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-slate-800 text-lg group-hover:text-blue-700 transition-colors">
                Section Heading
              </h4>
              <p className="text-sm text-slate-500 mt-1">
                Add a section divider slide with a large centered title. Perfect for separating different parts of your report.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                  Sub Judul
                </span>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                  Editable Text
                </span>
              </div>
            </div>
          </button>

          {/* Content Template Option */}
          <button
            onClick={onSelectContentTemplate}
            className="w-full flex items-start gap-4 p-5 rounded-xl border-2 border-slate-200 hover:border-purple-500 hover:bg-purple-50/50 hover:shadow-md transition-all text-left group"
          >
            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl text-white shadow-md group-hover:scale-105 transition-transform">
              <Layout size={28} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-slate-800 text-lg group-hover:text-purple-700 transition-colors">
                Content Layout
              </h4>
              <p className="text-sm text-slate-500 mt-1">
                Choose from various content templates including charts, tables, KPIs, and visual analysis layouts.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                  Template
                </span>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                  Dashboard, KPI, Charts
                </span>
              </div>
            </div>
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
