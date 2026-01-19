import React from 'react';
import { LucideIcon } from 'lucide-react';
import { EmptyStateBoxProps } from '@/app/types';

export const EmptyStateBox: React.FC<EmptyStateBoxProps> = ({
  icon: Icon,
  label,
  className = '',
}) => (
  <div
    className={`w-full h-full border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center bg-slate-50/50 text-slate-400 transition-all hover:bg-blue-50/50 hover:border-blue-300 hover:text-blue-500 cursor-pointer group ${className}`}
  >
    {Icon && (
      <Icon size={24} className="mb-2 opacity-50 group-hover:scale-110 transition-transform" />
    )}
    <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
  </div>
);
