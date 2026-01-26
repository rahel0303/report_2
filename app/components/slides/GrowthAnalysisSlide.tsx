import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';
import { ReportConfig } from '@/app/types';
import { formatNumber, formatCompact } from '@/app/utils/helpers';

interface GrowthAnalysisSlideProps {
  config: ReportConfig;
  isThumbnail?: boolean;
}

interface ChartDataPoint {
  date: string;
  followers: number;
  reach: number;
}

interface MonthlyMetric {
  month: string;
  followers_growth: number;
  profile_reach: number;
  profile_visit: number;
  engagement: number;
}

export const GrowthAnalysisSlide: React.FC<GrowthAnalysisSlideProps> = ({
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
    gridColor: isDark ? 'rgba(255,255,255,0.1)' : '#f1f5f9',
    axisColor: isDark ? '#cbd5e1' : '#64748b',
    tableHeaderBg: isDark ? 'rgba(0,0,0,0.2)' : '#f8fafc',
    tableRowHover: isDark ? 'hover:bg-white/10' : 'hover:bg-slate-50',
  };

  const colorPrimary = config.theme.brandColor;
  const colorSecondary = config.theme.colors[4];

  // Generate dummy chart data
  const chartData: ChartDataPoint[] = useMemo(() => {
    const data: ChartDataPoint[] = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
    let followerBase = 45000;
    let reachBase = 850000;

    months.forEach((month) => {
      followerBase += Math.random() * 5000 + 2000;
      reachBase += Math.random() * 150000 + 50000;
      data.push({
        date: month,
        followers: Math.floor(followerBase),
        reach: Math.floor(reachBase),
      });
    });
    return data;
  }, []);

  // Generate dummy table data
  const tableData: MonthlyMetric[] = useMemo(
    () => [
      {
        month: 'January',
        followers_growth: 3245,
        profile_reach: 892450,
        profile_visit: 45230,
        engagement: 125680,
      },
      {
        month: 'February',
        followers_growth: 4120,
        profile_reach: 915620,
        profile_visit: 48950,
        engagement: 132450,
      },
      {
        month: 'March',
        followers_growth: 3890,
        profile_reach: 945780,
        profile_visit: 52100,
        engagement: 145230,
      },
      {
        month: 'April',
        followers_growth: 4560,
        profile_reach: 1023450,
        profile_visit: 55670,
        engagement: 156890,
      },
      {
        month: 'May',
        followers_growth: 5230,
        profile_reach: 1145620,
        profile_visit: 61340,
        engagement: 178450,
      },
      {
        month: 'June',
        followers_growth: 4890,
        profile_reach: 1089340,
        profile_visit: 58920,
        engagement: 165780,
      },
      {
        month: 'July',
        followers_growth: 5780,
        profile_reach: 1256890,
        profile_visit: 67450,
        engagement: 192340,
      },
      {
        month: 'August',
        followers_growth: 6120,
        profile_reach: 1378560,
        profile_visit: 72890,
        engagement: 215670,
      },
    ],
    [],
  );

  return (
    <div
      className="w-full h-full flex flex-col overflow-hidden"
      style={{ fontFamily: config.font.name, backgroundColor: styles.bg }}
    >
      {/* Header */}
      <header
        className={`px-6 py-3 border-b flex justify-between items-center h-[10%] shrink-0 ${styles.border}`}
        style={{ backgroundColor: styles.bg }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: `${colorPrimary}20` }}>
            <TrendingUp size={20} style={{ color: colorPrimary }} />
          </div>
          <div>
            <h1 className={`text-xl font-bold tracking-tight leading-none ${styles.textMain}`}>
              Growth Analysis
            </h1>
            <p
              className={`text-[10px] font-medium flex items-center gap-1 mt-1 uppercase tracking-wide ${styles.textMuted}`}
            >
              <Calendar size={10} /> {config.period}
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col p-4 gap-3 overflow-hidden min-h-0">
        {/* Charts Section */}
        <div className="flex gap-3 h-[55%] min-h-0">
          {/* Followers Growth Chart */}
          <div
            className={`flex-1 rounded-xl border p-3 shadow-sm flex flex-col min-w-0 ${styles.border}`}
            style={{ backgroundColor: styles.cardBg }}
          >
            <h3 className={`text-xs font-bold mb-2 ${styles.textMain}`}>Followers Growth</h3>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={styles.gridColor} vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 9, fill: styles.axisColor }}
                    axisLine={{ stroke: styles.gridColor }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: styles.axisColor }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => formatCompact(val)}
                  />
                  {!isThumbnail && (
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#1e293b' : '#fff',
                        borderRadius: '6px',
                        fontSize: '10px',
                      }}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="followers"
                    stroke={colorPrimary}
                    strokeWidth={3}
                    dot={{ r: 4, fill: colorPrimary }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Profile Reach Chart */}
          <div
            className={`flex-1 rounded-xl border p-3 shadow-sm flex flex-col min-w-0 ${styles.border}`}
            style={{ backgroundColor: styles.cardBg }}
          >
            <h3 className={`text-xs font-bold mb-2 ${styles.textMain}`}>Profile Reach</h3>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={styles.gridColor} vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 9, fill: styles.axisColor }}
                    axisLine={{ stroke: styles.gridColor }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: styles.axisColor }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => formatCompact(val)}
                  />
                  {!isThumbnail && (
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#1e293b' : '#fff',
                        borderRadius: '6px',
                        fontSize: '10px',
                      }}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="reach"
                    stroke={colorSecondary}
                    strokeWidth={3}
                    dot={{ r: 4, fill: colorSecondary }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div
          className={`h-[45%] rounded-xl border shadow-sm flex flex-col min-h-0 overflow-hidden ${styles.border}`}
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
                    className={`px-3 py-2 text-left text-[9px] font-bold uppercase tracking-wider border-b ${styles.border} ${styles.textMuted}`}
                  >
                    Month
                  </th>
                  <th
                    className={`px-3 py-2 text-[9px] font-bold uppercase tracking-wider border-b ${styles.border} ${styles.textMuted}`}
                  >
                    Followers Growth
                  </th>
                  <th
                    className={`px-3 py-2 text-[9px] font-bold uppercase tracking-wider border-b ${styles.border} ${styles.textMuted}`}
                  >
                    Profile Reach
                  </th>
                  <th
                    className={`px-3 py-2 text-[9px] font-bold uppercase tracking-wider border-b ${styles.border} ${styles.textMuted}`}
                  >
                    Profile Visit
                  </th>
                  <th
                    className={`px-3 py-2 text-[9px] font-bold uppercase tracking-wider border-b ${styles.border} ${styles.textMuted}`}
                  >
                    Engagement
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-slate-50'}`}>
                {tableData.map((row, idx) => (
                  <tr key={idx} className={`transition-colors ${styles.tableRowHover}`}>
                    <td
                      className={`px-3 py-2 text-left text-[9px] font-semibold ${styles.textMain}`}
                    >
                      {row.month}
                    </td>
                    <td className={`px-3 py-2 text-[9px] font-mono ${styles.textMuted}`}>
                      {formatNumber(row.followers_growth)}
                    </td>
                    <td className={`px-3 py-2 text-[9px] font-mono ${styles.textMuted}`}>
                      {formatNumber(row.profile_reach)}
                    </td>
                    <td className={`px-3 py-2 text-[9px] font-mono ${styles.textMuted}`}>
                      {formatNumber(row.profile_visit)}
                    </td>
                    <td className={`px-3 py-2 text-[9px] font-mono ${styles.textMuted}`}>
                      {formatNumber(row.engagement)}
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
