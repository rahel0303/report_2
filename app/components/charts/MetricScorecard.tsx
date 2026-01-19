import React, { useState, useEffect } from 'react';
import { Activity, ArrowUpRight, ArrowDownRight, Edit3 } from 'lucide-react';
import { MetricScorecardProps, Metric, MetricData } from '@/app/types';
import { MetricSelectionModal } from '@/app/components/ui';

export const MetricScorecard: React.FC<MetricScorecardProps> = ({
  config,
  className,
  savedState,
  onSave,
}) => {
  const [data, setData] = useState<MetricData | null>(savedState || null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setData(savedState || null);
  }, [savedState]);

  const isDark = config.theme.type === 'dark';
  const styles = {
    cardBg: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
    textMain: isDark ? 'text-white' : 'text-slate-900',
    textMuted: isDark ? 'text-slate-400' : 'text-slate-500',
  };

  const handleSelect = (metric: Metric) => {
    let val: string, trend: 'up' | 'down', trendVal: string;

    const randomTrend = () => (Math.random() > 0.4 ? ('up' as const) : ('down' as const));
    const randomPct = () => (Math.random() * 20 + 1).toFixed(1) + '%';

    switch (metric.id) {
      case 'er':
      case 'growth':
        val = (Math.random() * 5 + 1).toFixed(2) + '%';
        break;
      case 'reach':
      case 'impressions':
      case 'views':
        val = Math.floor(Math.random() * 500) + 100 + 'k';
        break;
      default:
        val = (Math.floor(Math.random() * 5000) + 500).toLocaleString();
    }

    const newData: MetricData = {
      id: metric.id,
      label: metric.label,
      value: val,
      trend: randomTrend(),
      trendValue: randomPct(),
      iconId: metric.id,
    };

    setData(newData);
    if (onSave) onSave(newData);
    setIsModalOpen(false);
  };

  if (!data) {
    return (
      <>
        <div onClick={() => setIsModalOpen(true)} className={`w-full h-full ${className}`}>
          <div className="w-full h-full border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center bg-slate-50/50 text-slate-400 transition-all hover:bg-blue-50/50 hover:border-blue-300 hover:text-blue-500 cursor-pointer group">
            <Activity
              size={24}
              className="mb-2 opacity-50 group-hover:scale-110 transition-transform"
            />
            <span className="text-[10px] font-bold uppercase tracking-wider">Add Metric</span>
          </div>
        </div>
        <MetricSelectionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSelect={handleSelect}
          config={config}
        />
      </>
    );
  }

  return (
    <>
      <div
        className={`w-full h-full rounded-xl border p-4 shadow-sm flex flex-col justify-between relative group cursor-pointer transition-all hover:shadow-md ${
          isDark ? 'border-white/10' : 'border-slate-200'
        }`}
        style={{ backgroundColor: styles.cardBg }}
        onClick={() => setIsModalOpen(true)}
      >
        <div className="flex justify-between items-start">
          <span
            className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${styles.textMuted}`}
          >
            <Activity size={12} />
            {data.label}
          </span>
          <button className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-blue-500">
            <Edit3 size={12} />
          </button>
        </div>

        <div className="mt-2">
          <span
            className={`text-3xl font-bold tracking-tight ${styles.textMain}`}
            style={{ fontFamily: config.font.name }}
          >
            {data.value}
          </span>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <div
            className={`flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              data.trend === 'up'
                ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400'
                : 'text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400'
            }`}
          >
            {data.trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            <span>{data.trendValue}</span>
          </div>
          <span className={`text-[9px] ${styles.textMuted}`}>vs last period</span>
        </div>
      </div>

      <MetricSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleSelect}
        config={config}
      />
    </>
  );
};
