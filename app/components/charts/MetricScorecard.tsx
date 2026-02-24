import React, { useState, useEffect } from 'react';
import { Activity, ArrowUpRight, ArrowDownRight, Edit3 } from 'lucide-react';
import { MetricScorecardProps, Metric, MetricData } from '@/app/types';
import { MetricSelectionModal } from '@/app/components/ui';

export const MetricScorecard: React.FC<MetricScorecardProps> = ({
  config,
  className,
  savedState,
  onSave,
  isExport = false,
  metricCount = 4,
  selectedMetricIds = [],
}) => {
  const [data, setData] = useState<MetricData | null>(savedState || null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setData(savedState || null);
  }, [savedState]);

  // Use contentMode from coverDesign for theme
  const contentMode = config.coverDesign?.contentMode || 'light';
  const isDark = contentMode === 'dark';
  const styles = {
    cardBg: isDark ? 'rgba(30, 41, 59, 0.8)' : '#ffffff',
    textMain: isDark ? 'text-white' : 'text-slate-900',
    textMuted: isDark ? 'text-slate-400' : 'text-slate-500',
    border: isDark ? 'border-white/20' : 'border-slate-200',
  };

  // Font sizes — scaled by metricCount for both preview and export
  const getSizes = (n: number, forExport: boolean) => {
    if (forExport) {
      if (n <= 4)
        return {
          label: 'text-sm',
          value: 'text-4xl',
          trend: 'text-xs',
          caption: 'text-xs',
          emptyState: 'text-base',
        };
      if (n === 5)
        return {
          label: 'text-xs',
          value: 'text-3xl',
          trend: 'text-xs',
          caption: 'text-xs',
          emptyState: 'text-sm',
        };
      return {
        label: 'text-[10px]',
        value: 'text-2xl',
        trend: 'text-[10px]',
        caption: 'text-[10px]',
        emptyState: 'text-xs',
      };
    } else {
      if (n <= 4)
        return {
          label: 'text-[10px]',
          value: 'text-3xl',
          trend: 'text-[10px]',
          caption: 'text-[9px]',
          emptyState: 'text-[10px]',
        };
      if (n === 5)
        return {
          label: 'text-[10px]',
          value: 'text-2xl',
          trend: 'text-[10px]',
          caption: 'text-[9px]',
          emptyState: 'text-[10px]',
        };
      return {
        label: 'text-[10px]',
        value: 'text-xl',
        trend: 'text-[10px]',
        caption: 'text-[9px]',
        emptyState: 'text-[10px]',
      };
    }
  };
  const fontSize = getSizes(metricCount, isExport);

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
            <span className={`${fontSize.emptyState} font-bold uppercase tracking-wider`}>
              Add Metric
            </span>
          </div>
        </div>
        <MetricSelectionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSelect={handleSelect}
          config={config}
          selectedMetricIds={selectedMetricIds}
        />
      </>
    );
  }

  return (
    <>
      <div
        className={`w-full h-full rounded-xl border shadow-sm flex flex-col justify-between relative group cursor-pointer transition-all hover:shadow-md ${styles.border} ${metricCount >= 6 ? 'p-2' : 'p-4'}`}
        style={{ backgroundColor: styles.cardBg }}
        onClick={() => setIsModalOpen(true)}
      >
        <div className="flex justify-between items-start">
          <span
            className={`${fontSize.label} font-bold uppercase tracking-wider flex items-center gap-1.5 ${styles.textMuted} truncate min-w-0`}
          >
            <Activity size={12} className="shrink-0" />
            <span className="truncate">{data.label}</span>
          </span>
          <button className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-blue-500">
            <Edit3 size={12} />
          </button>
        </div>

        <div className="mt-2">
          <span
            className={`${fontSize.value} font-bold tracking-tight ${styles.textMain}`}
            style={{ fontFamily: config.font.name }}
          >
            {data.value}
          </span>
        </div>

        <div className="mt-2 flex flex-row items-start gap-1.5">
          <div
            className={`flex items-center ${fontSize.trend} font-bold ${metricCount >= 6 ? 'px-1 py-0.5' : 'px-1.5 py-0.5'} rounded-full shrink-0 ${
              data.trend === 'up'
                ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400'
                : 'text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400'
            }`}
          >
            {data.trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            <span>{data.trendValue}</span>
          </div>
          <span
            className={`${fontSize.caption} ${styles.textMuted} leading-tight wrap-break-word min-w-0`}
          >
            vs last period
          </span>
        </div>
      </div>

      <MetricSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleSelect}
        config={config}
        selectedMetricIds={selectedMetricIds}
      />
    </>
  );
};
