import React from 'react';
import { Plus } from 'lucide-react';
import { PlaceholderSlideProps } from '@/app/types';

export const PlaceholderSlide: React.FC<PlaceholderSlideProps> = ({ onOpenSelector }) => {
  return (
    <div className="w-full h-full p-12 flex items-center justify-center bg-white">
      <div
        onClick={onOpenSelector}
        className="w-full h-full border-4 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center bg-slate-50/50 group hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer"
      >
        <div className="p-6 bg-white rounded-2xl shadow-sm mb-4 border border-slate-100 group-hover:scale-110 group-hover:shadow-md transition-all duration-300">
          <Plus size={48} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
        </div>
        <p className="text-slate-400 font-semibold text-lg group-hover:text-blue-600 transition-colors">
          Add Content Layout
        </p>
        <span className="text-slate-300 text-sm mt-1 group-hover:text-blue-400">
          Click to choose a template
        </span>
      </div>
    </div>
  );
};
