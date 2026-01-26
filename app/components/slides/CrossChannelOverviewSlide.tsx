import React, { useMemo } from 'react';
import { Globe, TrendingUp, TrendingDown } from 'lucide-react';
import { ReportConfig } from '@/app/types';
import { formatNumber, formatCompact } from '@/app/utils/helpers';

interface CrossChannelOverviewSlideProps {
  config: ReportConfig;
  isThumbnail?: boolean;
}

interface ChannelMetric {
  channel: string;
  logo: string;
  color: string;
  followers: number;
  ytd_growth: number;
  monthly_growth: number;
  monthly_growth_pct: number;
  reach: number;
  reach_pct: number;
  profile_visit: number;
  profile_visit_pct: number;
  engagement: number;
  engagement_pct: number;
}

export const CrossChannelOverviewSlide: React.FC<CrossChannelOverviewSlideProps> = ({
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
    tableHeaderBg: isDark ? 'rgba(0,0,0,0.3)' : '#2c3e50',
    tableRowEven: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
    tableRowOdd: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
  };

  const colorPrimary = config.theme.brandColor;

  // Channel colors (platform brand colors)
  const channelColors: Record<string, string> = {
    Instagram: '#E1306C',
    TikTok: '#000000',
    Facebook: '#1877F2',
    Twitter: '#1DA1F2',
  };

  // Generate dummy data for all channels
  const channelData: ChannelMetric[] = useMemo(
    () => [
      {
        channel: 'Instagram',
        logo: 'IG',
        color: channelColors.Instagram,
        followers: 125680,
        ytd_growth: 15234,
        monthly_growth: 3456,
        monthly_growth_pct: 2.83,
        reach: 2456890,
        reach_pct: 12.5,
        profile_visit: 89340,
        profile_visit_pct: 8.2,
        engagement: 187650,
        engagement_pct: 15.3,
      },
      {
        channel: 'TikTok',
        logo: 'TT',
        color: channelColors.TikTok,
        followers: 89450,
        ytd_growth: 12890,
        monthly_growth: 2890,
        monthly_growth_pct: 3.34,
        reach: 3567890,
        reach_pct: 18.7,
        profile_visit: 124560,
        profile_visit_pct: 11.4,
        engagement: 245780,
        engagement_pct: 22.1,
      },
      {
        channel: 'Facebook',
        logo: 'FB',
        color: channelColors.Facebook,
        followers: 67890,
        ytd_growth: 8450,
        monthly_growth: 1567,
        monthly_growth_pct: 2.36,
        reach: 1234560,
        reach_pct: -5.8,
        profile_visit: 45670,
        profile_visit_pct: -3.2,
        engagement: 98450,
        engagement_pct: -7.5,
      },
      {
        channel: 'Twitter',
        logo: 'TW',
        color: channelColors.Twitter,
        followers: 45670,
        ytd_growth: 5890,
        monthly_growth: 890,
        monthly_growth_pct: 1.99,
        reach: 567890,
        reach_pct: 4.5,
        profile_visit: 23450,
        profile_visit_pct: 2.8,
        engagement: 45670,
        engagement_pct: 6.7,
      },
    ],
    [],
  );

  const renderPercentage = (value: number) => {
    const isPositive = value >= 0;
    const color = isPositive ? '#27ae60' : '#c0392b';
    const Icon = isPositive ? TrendingUp : TrendingDown;

    return (
      <div className="flex items-center justify-end gap-1">
        <Icon size={10} style={{ color }} />
        <span style={{ color }} className="font-bold">
          {isPositive ? '+' : ''}
          {value.toFixed(2)}%
        </span>
      </div>
    );
  };

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
          <Globe size={20} style={{ color: colorPrimary }} />
        </div>
        <div>
          <h1 className={`text-xl font-bold tracking-tight leading-none ${styles.textMain}`}>
            Cross-Channel Overview
          </h1>
          <p className={`text-[10px] font-medium uppercase tracking-wide ${styles.textMuted}`}>
            Performance Across All Platforms - {config.period}
          </p>
        </div>
      </header>

      {/* Content Area */}
      <div className="flex-1 flex flex-col p-4 gap-3 overflow-hidden">
        {/* Table - 75% height */}
        <div className="h-[75%] overflow-auto">
          <div className={`rounded-xl border shadow-lg overflow-hidden ${styles.border}`}>
            <table className="w-full border-collapse">
              {/* Header */}
              <thead>
                <tr style={{ backgroundColor: styles.tableHeaderBg }}>
                  <th className="px-4 py-3 text-left text-white text-[10px] font-bold uppercase tracking-wider border-r border-white/10">
                    Channel
                  </th>
                  <th className="px-4 py-3 text-right text-white text-[10px] font-bold uppercase tracking-wider border-r border-white/10">
                    Followers
                  </th>
                  <th className="px-4 py-3 text-right text-white text-[10px] font-bold uppercase tracking-wider border-r border-white/10">
                    YTD Growth
                  </th>
                  <th className="px-4 py-3 text-right text-white text-[10px] font-bold uppercase tracking-wider border-r border-white/10">
                    Monthly Growth
                  </th>
                  <th className="px-4 py-3 text-right text-white text-[10px] font-bold uppercase tracking-wider border-r border-white/10">
                    Growth %
                  </th>
                  <th className="px-4 py-3 text-right text-white text-[10px] font-bold uppercase tracking-wider border-r border-white/10">
                    Reach
                  </th>
                  <th className="px-4 py-3 text-right text-white text-[10px] font-bold uppercase tracking-wider border-r border-white/10">
                    Reach %
                  </th>
                  <th className="px-4 py-3 text-right text-white text-[10px] font-bold uppercase tracking-wider border-r border-white/10">
                    Profile Visit
                  </th>
                  <th className="px-4 py-3 text-right text-white text-[10px] font-bold uppercase tracking-wider border-r border-white/10">
                    Visit %
                  </th>
                  <th className="px-4 py-3 text-right text-white text-[10px] font-bold uppercase tracking-wider border-r border-white/10">
                    Engagement
                  </th>
                  <th className="px-4 py-3 text-right text-white text-[10px] font-bold uppercase tracking-wider">
                    Eng %
                  </th>
                </tr>
              </thead>

              {/* Body */}
              <tbody>
                {channelData.map((row, idx) => (
                  <tr
                    key={row.channel}
                    style={{
                      backgroundColor: idx % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd,
                    }}
                    className="hover:bg-opacity-80 transition-colors"
                  >
                    {/* Channel Name with Logo */}
                    <td className={`px-4 py-3 border-r ${styles.border}`}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded flex items-center justify-center text-white text-[8px] font-bold"
                          style={{ backgroundColor: row.color }}
                        >
                          {row.logo}
                        </div>
                        <span className={`text-[10px] font-bold ${styles.textMain}`}>
                          {row.channel}
                        </span>
                      </div>
                    </td>

                    {/* Followers */}
                    <td
                      className={`px-4 py-3 text-right text-[9px] font-mono border-r ${styles.textMuted} ${styles.border}`}
                    >
                      {formatNumber(row.followers)}
                    </td>

                    {/* YTD Growth */}
                    <td
                      className={`px-4 py-3 text-right text-[9px] font-mono border-r ${styles.textMuted} ${styles.border}`}
                    >
                      {formatNumber(row.ytd_growth)}
                    </td>

                    {/* Monthly Growth */}
                    <td
                      className={`px-4 py-3 text-right text-[9px] font-mono border-r ${styles.textMuted} ${styles.border}`}
                    >
                      {formatNumber(row.monthly_growth)}
                    </td>

                    {/* Growth % */}
                    <td className={`px-4 py-3 text-right text-[9px] border-r ${styles.border}`}>
                      {renderPercentage(row.monthly_growth_pct)}
                    </td>

                    {/* Reach */}
                    <td
                      className={`px-4 py-3 text-right text-[9px] font-mono border-r ${styles.textMuted} ${styles.border}`}
                    >
                      {formatCompact(row.reach)}
                    </td>

                    {/* Reach % */}
                    <td className={`px-4 py-3 text-right text-[9px] border-r ${styles.border}`}>
                      {renderPercentage(row.reach_pct)}
                    </td>

                    {/* Profile Visit */}
                    <td
                      className={`px-4 py-3 text-right text-[9px] font-mono border-r ${styles.textMuted} ${styles.border}`}
                    >
                      {formatNumber(row.profile_visit)}
                    </td>

                    {/* Visit % */}
                    <td className={`px-4 py-3 text-right text-[9px] border-r ${styles.border}`}>
                      {renderPercentage(row.profile_visit_pct)}
                    </td>

                    {/* Engagement */}
                    <td
                      className={`px-4 py-3 text-right text-[9px] font-mono border-r ${styles.textMuted} ${styles.border}`}
                    >
                      {formatCompact(row.engagement)}
                    </td>

                    {/* Engagement % */}
                    <td className={`px-4 py-3 text-right text-[9px]`}>
                      {renderPercentage(row.engagement_pct)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Insights Box - 25% height */}
        <div
          className={`flex-1 rounded-xl border p-4 shadow-sm ${styles.border}`}
          style={{ backgroundColor: styles.cardBg }}
        >
          <div className="h-full flex items-center justify-center">
            <p className={`text-sm text-center italic ${styles.textMuted}`}>
              Add your summary insights or key takeaways here...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
