import React from 'react';
import { X, Grid2X2, Grid3X3 } from 'lucide-react';

export type GridSize = '2x2' | '3x3';

interface GridSizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (size: GridSize) => void;
}

const GRID_OPTIONS: { value: GridSize; label: string; blocks: number; icon: React.FC<{ size?: number; className?: string }> }[] = [
  { value: '2x2', label: '2 x 2', blocks: 4, icon: Grid2X2 },
  { value: '3x3', label: '3 x 3', blocks: 9, icon: Grid3X3 },
];

export const GridSizeModal: React.FC<GridSizeModalProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
      <div className="w-full max-w-sm p-6 rounded-2xl shadow-2xl bg-white">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h3 className="font-bold text-lg text-slate-900">Grid Size</h3>
            <p className="text-xs text-slate-500">Select the grid layout for this slide</p>
          </div>
          <button onClick={onClose}>
            <X size={20} className="text-slate-400" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {GRID_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onSelect(option.value)}
              className="p-5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 flex flex-col items-center justify-center gap-2 transition-all hover:scale-[1.02] text-slate-700 hover:text-blue-700"
            >
              <option.icon size={28} className="opacity-70" />
              <span className="text-lg font-bold">{option.label}</span>
              <span className="text-[10px] text-slate-400">{option.blocks} blocks</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
