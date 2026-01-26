import React, { useMemo } from 'react';
import { Target, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { ReportConfig } from '@/app/types';
import { formatNumber, formatCompact } from '@/app/utils/helpers';

interface ContentPillarSlideProps {
  config: ReportConfig;
  isThumbnail?: boolean;
}

interface PillarMetric {
  pillar: string;
  posts: number;
  reach: number;
  engagement: number;
  er: number;
}

export const ContentPillarSlide: React.FC<ContentPillarSlideProps> = ({
  config,
  isThumbnail = false,
}) => {
  const isDark = config.theme.type === 'dark';

  const styles = {
    bg: config.theme.colors[0],
    textMain: isDark ? 'text-white' : 'text-slate-900',
    textMuted: isDark ? 'text-slate-300' : 'text-slate-500',
    cardBg: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
    border: isDark ? 'border-white/20' : 'border-slate-200',
    tableHeaderBg: isDark ? 'rgba(0,0,0,0.2)' : '#f8fafc',
    tableRowHover: isDark ? 'hover:bg-white/10' : 'hover:bg-slate-50',
  };

  const colorPrimary = config.theme.brandColor;

  // KPI Cards Data
  const kpiData = useMemo(
    () => [
      { label: 'Total Posts', value: 156, trend: 12, isUp: true },
      { label: 'Avg Reach', value: '45.2K', trend: 8.5, isUp: true },
      { label: 'Avg Engagement', value: '3.2K', trend: 3.2, isUp: false },
      { label: 'Avg ER', value: '7.1%', trend: 5.1, isUp: true },
    ],
    [],
  );

  // Content Pillar Table Data
  const pillarData: PillarMetric[] = useMemo(
    () => [
      { pillar: 'Product Launch', posts: 24, reach: 1245680, engagement: 89450, er: 7.18 },
      { pillar: 'Behind The Scenes', posts: 18, reach: 892340, engagement: 67230, er: 7.53 },
      { pillar: 'User Generated Content', posts: 32, reach: 1567890, engagement: 125680, er: 8.01 },
      { pillar: 'Educational', posts: 28, reach: 1123450, engagement: 78900, er: 7.02 },
      { pillar: 'Entertainment', posts: 42, reach: 1678920, engagement: 142350, er: 8.48 },
      { pillar: 'Promotional', posts: 12, reach: 567890, engagement: 34560, er: 6.08 },
    ],
    [],
  );

  const KPICard = ({
    label,
    value,
    trend,
    isUp,
  }: {
    label: string;
    value: string | number;
    trend: number;
    isUp: boolean;
  }) => (
    <div
      className={`rounded-lg border p-3 flex flex-col ${styles.border}`}
      style={{ backgroundColor: styles.cardBg }}
    >
      <span className={`text-[9px] font-bold uppercase tracking-wider ${styles.textMuted} mb-1`}>
        {label}
      </span>
      <div className="flex items-baseline justify-between">
        <span className={`text-2xl font-bold ${styles.textMain}`}>{value}</span>
        <div
          className={`flex items-center text-[9px] font-bold ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}
        >
          {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          <span>{trend.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className="w-full h-full flex flex-col overflow-hidden"
      style={{ fontFamily: config.font.name, backgroundColor: styles.bg }}
    >
      {/* Header */}
      <header
        className={`px-6 py-3 border-b flex items-center gap-3 h-[10%] shrink-0 ${styles.border}`}
      >
        <div className="p-2 rounded-lg" style={{ backgroundColor: `${colorPrimary}20` }}>
          <Target size={20} style={{ color: colorPrimary }} />
        </div>
        <div>
          <h1 className={`text-xl font-bold tracking-tight leading-none ${styles.textMain}`}>
            Content Pillar Analysis
          </h1>
          <p className={`text-[10px] font-medium uppercase tracking-wide ${styles.textMuted}`}>
            Performance by Category
          </p>
        </div>
      </header>

      <div className="flex-1 flex flex-col p-4 gap-3 overflow-hidden">
        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-3 h-[20%]">
          {kpiData.map((kpi, idx) => (
            <KPICard key={idx} {...kpi} />
          ))}
        </div>

        {/* Table */}
        <div
          className={`flex-1 rounded-xl border shadow-sm flex flex-col overflow-hidden ${styles.border}`}
          style={{ backgroundColor: styles.cardBg }}
        >
          <div className="flex-1 overflow-auto">
            <table className="w-full text-right border-collapse">
              <thead
                className={`sticky top-0 z-10`}
                style={{ backgroundColor: styles.tableHeaderBg }}
              >
                <tr>
                  <th
                    className={`px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider border-b ${styles.border} ${styles.textMuted}`}
                  >
                    Content Pillar
                  </th>
                  <th
                    className={`px-4 py-3 text-[10px] font-bold uppercase tracking-wider border-b ${styles.border} ${styles.textMuted}`}
                  >
                    Posts
                  </th>
                  <th
                    className={`px-4 py-3 text-[10px] font-bold uppercase tracking-wider border-b ${styles.border} ${styles.textMuted}`}
                  >
                    Total Reach
                  </th>
                  <th
                    className={`px-4 py-3 text-[10px] font-bold uppercase tracking-wider border-b ${styles.border} ${styles.textMuted}`}
                  >
                    Total Engagement
                  </th>
                  <th
                    className={`px-4 py-3 text-[10px] font-bold uppercase tracking-wider border-b ${styles.border} ${styles.textMuted}`}
                  >
                    Avg ER (%)
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-slate-50'}`}>
                {pillarData.map((row, idx) => (
                  <tr key={idx} className={`transition-colors ${styles.tableRowHover}`}>
                    <td
                      className={`px-4 py-3 text-left text-[10px] font-semibold ${styles.textMain}`}
                    >
                      {row.pillar}
                    </td>
                    <td className={`px-4 py-3 text-[10px] font-mono ${styles.textMuted}`}>
                      {row.posts}
                    </td>
                    <td className={`px-4 py-3 text-[10px] font-mono ${styles.textMuted}`}>
                      {formatNumber(row.reach)}
                    </td>
                    <td className={`px-4 py-3 text-[10px] font-mono ${styles.textMuted}`}>
                      {formatNumber(row.engagement)}
                    </td>
                    <td
                      className={`px-4 py-3 text-[10px] font-bold`}
                      style={{ color: colorPrimary }}
                    >
                      {row.er.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
