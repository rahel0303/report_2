import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateBoxProps {
  icon?: LucideIcon;
  label?: string;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  isDark?: boolean;
  className?: string;
}

export const EmptyStateBox: React.FC<EmptyStateBoxProps> = ({
  icon: Icon,
  label,
  title,
  description,
  actionLabel,
  onAction,
  isDark = false,
  className = '',
}) => {
  // If using new props format (title, description, actionLabel)
  if (title || description || actionLabel) {
    return (
      <div
        onClick={onAction}
        className={`flex flex-col items-center justify-center gap-4 py-12 cursor-pointer transition-all hover:scale-[1.02] ${className}`}
      >
        {Icon && (
          <div
            className={`p-4 rounded-full transition-colors ${isDark ? 'bg-slate-800 group-hover:bg-slate-700' : 'bg-slate-100 hover:bg-blue-50'}`}
          >
            <Icon
              size={32}
              className={`transition-colors ${isDark ? 'text-slate-400 hover:text-blue-400' : 'text-slate-500 hover:text-blue-500'}`}
            />
          </div>
        )}
        {title && (
          <h4 className={`text-lg font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            {title}
          </h4>
        )}
        {description && (
          <p
            className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'} max-w-md text-center`}
          >
            {description}
          </p>
        )}
      </div>
    );
  }

  // Legacy format (just icon and label)
  return (
    <div
      className={`w-full h-full border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center bg-slate-50/50 text-slate-400 transition-all hover:bg-blue-50/50 hover:border-blue-300 hover:text-blue-500 cursor-pointer group ${className}`}
    >
      {Icon && (
        <Icon size={24} className="mb-2 opacity-50 group-hover:scale-110 transition-transform" />
      )}
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </div>
  );
};
