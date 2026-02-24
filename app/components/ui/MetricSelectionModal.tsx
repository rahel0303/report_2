import React from 'react';
import { X } from 'lucide-react';
import {
  User,
  Eye,
  Activity,
  MousePointerClick,
  BarChart3,
  BookOpen,
  Send,
  MonitorPlay,
  Layout,
} from 'lucide-react';
import { MetricSelectionModalProps, Metric } from '@/app/types';

const metrics: Metric[] = [
  { id: 'reach', label: 'Reach', icon: User },
  { id: 'impressions', label: 'Impressions', icon: Eye },
  { id: 'followers', label: 'Total Followers', icon: User },
  { id: 'growth', label: 'Followers Growth', icon: Activity },
  { id: 'engagement', label: 'Engagement', icon: MousePointerClick },
  { id: 'er', label: 'Engagement Rate', icon: BarChart3 },
  { id: 'saves', label: 'Saves', icon: BookOpen },
  { id: 'shares', label: 'Shares', icon: Send },
  { id: 'views', label: 'Video Views', icon: MonitorPlay },
  { id: 'visits', label: 'Profile Visits', icon: Layout },
  { id: 'clicks', label: 'Website Clicks', icon: MousePointerClick },
  { id: 'watch_time', label: 'Avg. Watch Time', icon: Activity },
];

export const MetricSelectionModal: React.FC<MetricSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  config,
  selectedMetricIds = [],
}) => {
  if (!isOpen) return null;
  const isDark = config.theme.type === 'dark';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-lg p-6 rounded-2xl shadow-2xl ${
          isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white'
        }`}
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Select Metric
            </h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Choose a KPI — already used metrics are disabled.
            </p>
          </div>
          <button onClick={onClose}>
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto p-1">
          {metrics.map((m) => {
            const isUsed = selectedMetricIds.includes(m.id);
            return (
              <button
                key={m.id}
                onClick={() => !isUsed && onSelect(m)}
                disabled={isUsed}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all relative ${
                  isUsed
                    ? isDark
                      ? 'border-slate-700 bg-slate-800/50 text-slate-600 cursor-not-allowed opacity-50'
                      : 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed opacity-50'
                    : isDark
                      ? 'border-slate-700 hover:bg-slate-800 text-slate-300 hover:scale-105'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700 hover:scale-105'
                }`}
              >
                <m.icon size={20} className="opacity-70" />
                <span className="text-xs font-bold text-center">{m.label}</span>
                {isUsed && (
                  <span className="absolute top-1 right-1 text-[9px] font-bold text-slate-400 bg-slate-100 rounded px-1">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
