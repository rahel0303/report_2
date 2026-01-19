import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Key,
  List,
  AlignLeft,
  Sparkles,
  Send,
  Loader2,
} from 'lucide-react';
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
import {
  InstagramDashboardSlideProps,
  DashboardChartDataPoint,
  SummaryData,
  TableColumnDef,
} from '@/app/types';
import {
  formatNumber,
  formatCompact,
  calculateGap,
  renderTextWithHighlights,
} from '@/app/utils/helpers';
import { generateGeminiContent } from '@/app/utils/api';

export const InstagramDashboardSlide: React.FC<InstagramDashboardSlideProps> = ({
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
    tableRowHover: isDark ? 'hover:bg-white/10' : 'hover:bg-slate-50/80',
    aiInputBg: isDark
      ? 'bg-white/10 border-white/10 text-white'
      : 'bg-white border-indigo-200 text-slate-700',
    aiButtonActive: isDark
      ? 'bg-indigo-500/30 text-indigo-300 border-indigo-500/50'
      : 'bg-indigo-100 text-indigo-700 border-indigo-200',
    aiButtonInactive: isDark
      ? 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
      : 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100',
  };

  const colorPrimary = config.theme.brandColor;
  const colorSecondary = config.theme.colors[4];

  const chartData: DashboardChartDataPoint[] = useMemo(() => {
    const data: DashboardChartDataPoint[] = [];
    for (let i = 1; i <= 31; i++) {
      let reachBase = 1200000;
      let followerBase = 2500;

      if (i === 5 || i === 12 || i === 20 || i === 28) {
        reachBase += 2000000 + Math.random() * 500000;
      } else {
        reachBase += Math.random() * 400000 - 200000;
      }

      if (i === 7 || i === 15 || i === 23 || i === 30) {
        followerBase += 4000 + Math.random() * 1000;
      } else {
        followerBase += Math.random() * 300 - 150;
      }

      const day = i.toString().padStart(2, '0');
      data.push({
        date: `Aug ${i}`,
        formattedDate: `${day}/08/25`,
        reach: Math.floor(reachBase > 0 ? reachBase : 0),
        followers: Math.floor(followerBase > 0 ? followerBase : 0),
      });
    }
    return data;
  }, []);

  const top3Followers = useMemo(
    () =>
      [...chartData]
        .sort((a, b) => b.followers - a.followers)
        .slice(0, 3)
        .map((d) => d.date),
    [chartData]
  );

  const top3Reach = useMemo(
    () =>
      [...chartData]
        .sort((a, b) => b.reach - a.reach)
        .slice(0, 3)
        .map((d) => d.date),
    [chartData]
  );

  const CustomizedDot = (props: any) => {
    const { cx, cy, payload, stroke, topList } = props;
    if (topList.includes(payload.date)) {
      return (
        <svg x={cx - 3} y={cy - 3} width={6} height={6} fill="white" viewBox="0 0 6 6">
          <circle
            cx="3"
            cy="3"
            r="3"
            stroke={stroke}
            strokeWidth="1.5"
            fill={isDark ? '#1e293b' : 'white'}
          />
        </svg>
      );
    }
    return null;
  };

  const CustomizedLabel = (props: any) => {
    const { x, y, value, index, data, topList, color, dy } = props;
    const item = data[index];
    if (topList.includes(item.date)) {
      const formattedValue =
        value >= 1000000 ? (value / 1000000).toFixed(1) + 'M' : (value / 1000).toFixed(1) + 'k';
      return (
        <g>
          <text
            x={x}
            y={y}
            dy={dy || -12}
            fill={color}
            fontSize={8}
            textAnchor="middle"
            fontWeight="bold"
            style={{ fontFamily: config.font.name }}
          >
            {item.formattedDate}
          </text>
          <text
            x={x}
            y={y}
            dy={(dy || -12) + 8}
            fill={color}
            fontSize={8}
            textAnchor="middle"
            style={{ fontFamily: config.font.name }}
          >
            {formattedValue}
          </text>
        </g>
      );
    }
    return null;
  };

  const summaryData: SummaryData = {
    previous: {
      label: 'Previous',
      profileReach: 50937555,
      profileVisit: 480363,
      growth: 28084,
      reach: 14109803,
      engagement: 118003,
      likes: 82416,
      comments: 10835,
      shares: 22267,
      saves: 2485,
      erReach: 2.07,
      erFollowers: 0.08,
    },
    current: {
      label: 'Current',
      profileReach: 39011421,
      profileVisit: 287334,
      growth: 82207,
      reach: 9934685,
      engagement: 71666,
      likes: 51579,
      comments: 5502,
      shares: 12909,
      saves: 1676,
      erReach: 2.32,
      erFollowers: 0.03,
    },
  };

  const columns: TableColumnDef[] = [
    { key: 'profileReach', label: 'Profile Reach' },
    { key: 'profileVisit', label: 'Profile Visit' },
    { key: 'growth', label: 'Growth' },
    { key: 'reach', label: 'Reach' },
    { key: 'engagement', label: 'Engagement' },
    { key: 'likes', label: 'Likes' },
    { key: 'comments', label: 'Comments' },
    { key: 'shares', label: 'Shares' },
    { key: 'saves', label: 'Saves' },
    { key: 'erReach', label: 'ER Reach (%)', isPercent: true },
    { key: 'erFollowers', label: 'ER Follow (%)', isPercent: true },
  ];

  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isParagraphMode, setIsParagraphMode] = useState(false);

  const [takeaways, setTakeaways] = useState([
    'Profile Reach dropped by *23.41%*, but Growth skyrocketed *+192%* indicating viral content outside follower base.',
    'Engagement Rate (Reach) improved to *2.32%*, showing higher quality interactions per view.',
    'Shares remain high at *12.9k*, suggesting content resonance is still strong despite lower reach.',
  ]);

  const handleAiRefine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setIsTyping(true);

    const contextData = JSON.stringify(summaryData);
    const topReachDates = JSON.stringify(top3Reach);
    const fullPrompt = `
      Context Data (Social Media Performance):
      ${contextData}
      
      Top Reach Dates: ${topReachDates}

      User Request: ${aiPrompt}

      Task: Provide a refined, professional set of 3 key takeaways (bullet points) based on the data above. Focus on growth, reach, and engagement changes. Use *bold* for key numbers.
    `;

    try {
      const result = await generateGeminiContent(fullPrompt);
      const lines = result
        .split('\n')
        .filter((line) => line.trim().startsWith('-') || line.trim().startsWith('*'));

      if (lines.length > 0) {
        setIsParagraphMode(false);
        setTakeaways(lines.map((l) => l.replace(/^[-*]\s*/, '')));
      } else {
        setIsParagraphMode(true);
        setTakeaways([result]);
      }
      setAiPrompt('');
    } catch (error) {
      console.error('AI Error', error);
    } finally {
      setIsTyping(false);
    }
  };

  const MetricCard = ({
    label,
    value,
    trend,
    trendValue,
  }: {
    label: string;
    value: string;
    trend: 'up' | 'down';
    trendValue: string;
  }) => (
    <div className="flex flex-col justify-center">
      <span
        className={`text-[10px] font-bold uppercase tracking-wider ${styles.textMuted}`}
        style={{ fontFamily: config.font.name }}
      >
        {label}
      </span>
      <div className="flex items-baseline gap-2 mt-1">
        <span
          className={`text-xl font-bold leading-none ${styles.textMain}`}
          style={{ fontFamily: config.font.name }}
        >
          {value}
        </span>
        <div
          className={`flex items-center text-[10px] font-bold ${
            trend === 'up' ? 'text-emerald-500' : 'text-rose-500'
          }`}
        >
          {trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          <span>{trendValue}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className="w-full h-full flex flex-col overflow-hidden transition-colors duration-300"
      style={{ fontFamily: config.font.name, backgroundColor: styles.bg }}
    >
      <header
        className={`px-6 py-3 border-b flex justify-between items-center h-[12%] shrink-0 ${styles.border}`}
        style={{ backgroundColor: styles.bg }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: `${colorPrimary}20` }}>
            <Activity size={20} style={{ color: colorPrimary }} />
          </div>
          <div>
            <h1 className={`text-xl font-bold tracking-tight leading-none ${styles.textMain}`}>
              Instagram Performance
            </h1>
            <p
              className={`text-[10px] font-medium flex items-center gap-1 mt-1 uppercase tracking-wide ${styles.textMuted}`}
            >
              <Calendar size={10} /> {config.period} Report
            </p>
          </div>
        </div>
        <div className="flex gap-8">
          <MetricCard
            label="Profile Reach"
            value={formatCompact(summaryData.current.profileReach)}
            trend="down"
            trendValue="23%"
          />
          <MetricCard
            label="Total Growth"
            value={formatCompact(summaryData.current.growth)}
            trend="up"
            trendValue="192%"
          />
          <MetricCard
            label="ER Reach"
            value={summaryData.current.erReach + '%'}
            trend="up"
            trendValue="11%"
          />
        </div>
      </header>

      <div className="flex-1 flex flex-col p-4 gap-3 overflow-hidden min-h-0">
        <div className="flex gap-3 h-[55%] min-h-0 w-full">
          <div
            className={`flex-[1.85] rounded-xl border p-3 shadow-sm flex flex-col min-w-0 ${styles.border}`}
            style={{ backgroundColor: styles.cardBg }}
          >
            <div className="flex justify-between items-center mb-1">
              <h3 className={`text-xs font-bold flex items-center gap-2 ${styles.textMain}`}>
                Daily Trends (Reach vs Growth)
              </h3>
              <div className={`flex gap-3 text-[10px] font-medium ${styles.textMuted}`}>
                <span className="flex items-center gap-1">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: colorSecondary }}
                  ></div>{' '}
                  Growth
                </span>
                <span className="flex items-center gap-1">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: colorPrimary }}
                  ></div>{' '}
                  Reach
                </span>
              </div>
            </div>
            <div className="flex-1 min-h-0 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={styles.gridColor} vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 9, fill: styles.axisColor }}
                    axisLine={{ stroke: styles.gridColor }}
                    tickLine={false}
                    interval={6}
                    dy={5}
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 9, fill: styles.axisColor }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 9, fill: styles.axisColor }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`}
                  />
                  {!isThumbnail && (
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#1e293b' : '#fff',
                        borderRadius: '6px',
                        border: `1px solid ${styles.border}`,
                        fontSize: '10px',
                        padding: '4px',
                        color: isDark ? '#fff' : '#000',
                      }}
                    />
                  )}

                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="followers"
                    stroke={colorSecondary}
                    strokeWidth={2}
                    dot={<CustomizedDot topList={top3Followers} stroke={colorSecondary} />}
                    activeDot={{ r: 4 }}
                  >
                    <LabelList
                      content={
                        <CustomizedLabel
                          data={chartData}
                          topList={top3Followers}
                          color={colorSecondary}
                          dy={-12}
                        />
                      }
                    />
                  </Line>
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="reach"
                    stroke={colorPrimary}
                    strokeWidth={2}
                    dot={<CustomizedDot topList={top3Reach} stroke={colorPrimary} />}
                    activeDot={{ r: 4 }}
                  >
                    <LabelList
                      content={
                        <CustomizedLabel
                          data={chartData}
                          topList={top3Reach}
                          color={colorPrimary}
                          dy={12}
                        />
                      }
                    />
                  </Line>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div
            className={`flex-1 rounded-md border p-3 shadow-sm flex flex-col overflow-hidden relative ${styles.border}`}
            style={{ backgroundColor: styles.cardBg }}
          >
            <div
              className={`flex items-center justify-between mb-2 border-b pb-2 shrink-0 ${
                isDark ? 'border-white/10' : 'border-slate-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <Key size={16} className={styles.textMuted} />
                <h3 className={`text-[12px] font-bold uppercase tracking-wide ${styles.textMain}`}>
                  Key Takeaways
                </h3>
              </div>

              {!isThumbnail && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsParagraphMode(!isParagraphMode)}
                    className={`p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 ${styles.textMuted}`}
                    title="Toggle View"
                  >
                    {isParagraphMode ? <List size={12} /> : <AlignLeft size={12} />}
                  </button>

                  <button
                    onClick={() => setIsAiOpen(!isAiOpen)}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-all border ${
                      isAiOpen ? styles.aiButtonActive : styles.aiButtonInactive
                    }`}
                  >
                    <Sparkles size={10} />
                    <span>{isAiOpen ? 'Close AI' : 'Refine'}</span>
                  </button>
                </div>
              )}
            </div>

            {isAiOpen && !isThumbnail && (
              <div
                className={`mb-2 p-2 rounded border ${
                  isDark
                    ? 'bg-indigo-900/20 border-indigo-500/30'
                    : 'bg-indigo-50/50 border-indigo-100'
                }`}
              >
                <form onSubmit={handleAiRefine} className="flex gap-2">
                  <input
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Try: 'Focus on growth'..."
                    className={`flex-1 text-[10px] px-2 py-1 rounded border focus:outline-none focus:border-indigo-400 placeholder:opacity-50 ${styles.aiInputBg}`}
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={!aiPrompt.trim() || isTyping}
                    className="bg-indigo-600 text-white px-2 rounded hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center"
                  >
                    {isTyping ? <Loader2 size={10} className="animate-spin" /> : <Send size={10} />}
                  </button>
                </form>
              </div>
            )}

            <div className="flex-1 flex flex-col justify-center overflow-hidden">
              {isTyping ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 opacity-70">
                  <Sparkles size={20} className="text-indigo-500 animate-spin" />
                  <span className="text-[10px] text-indigo-500 font-medium animate-pulse">
                    Analyzing Data...
                  </span>
                </div>
              ) : (
                <>
                  {isParagraphMode ? (
                    <div
                      className={`text-[10px] leading-relaxed font-medium text-justify ${styles.textMuted}`}
                    >
                      {renderTextWithHighlights(takeaways[0], isDark, colorPrimary)}
                    </div>
                  ) : (
                    <ul
                      className={`space-y-2 text-[10px] leading-tight font-medium ${styles.textMuted}`}
                    >
                      {takeaways.map((item, idx) => (
                        <li key={idx} className="flex gap-2 items-start">
                          <span
                            className="text-[10px] mt-[2px]"
                            style={{ color: config.theme.colors[4] }}
                          >
                            •
                          </span>
                          <span>{renderTextWithHighlights(item, isDark, colorPrimary)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div
          className={`h-[45%] rounded-xl border shadow-sm flex flex-col min-h-0 overflow-hidden ${styles.border}`}
          style={{ backgroundColor: styles.cardBg }}
        >
          <div className={`flex-1 overflow-hidden flex flex-col`}>
            <table className="w-full text-right border-collapse h-full table-fixed">
              <thead
                className={`sticky top-0 z-10`}
                style={{ backgroundColor: styles.tableHeaderBg }}
              >
                <tr>
                  <th
                    className={`px-1 py-2 text-left text-[9px] font-bold uppercase tracking-wider border-b border-r w-16 ${styles.border} ${styles.textMuted}`}
                  >
                    Month
                  </th>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={`px-1 py-2 text-[8px] font-bold uppercase tracking-tighter border-b border-r last:border-r-0 leading-tight break-words w-[7%] ${styles.border} ${styles.textMuted}`}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-slate-50'}`}>
                <tr className={`transition-colors ${styles.tableRowHover}`}>
                  <td
                    className={`px-1 py-1.5 text-left text-[9px] font-bold border-r ${styles.border} ${styles.textMuted}`}
                  >
                    {summaryData.previous.label}
                  </td>
                  {columns.map((col) => (
                    <td
                      key={`prev-${col.key}`}
                      className={`px-1 py-1.5 text-[9px] border-r font-mono truncate ${styles.border} ${styles.textMuted}`}
                    >
                      {formatNumber((summaryData.previous as any)[col.key], col.isPercent)}
                    </td>
                  ))}
                </tr>
                <tr className={`transition-colors ${styles.tableRowHover}`}>
                  <td
                    className={`px-1 py-1.5 text-left text-[9px] font-bold border-r ${styles.border} ${styles.textMain}`}
                  >
                    {summaryData.current.label}
                  </td>
                  {columns.map((col) => (
                    <td
                      key={`curr-${col.key}`}
                      className={`px-1 py-1.5 text-[9px] font-bold border-r font-mono truncate ${styles.border} ${styles.textMain}`}
                    >
                      {formatNumber((summaryData.current as any)[col.key], col.isPercent)}
                    </td>
                  ))}
                </tr>
                <tr
                  className={`transition-colors border-t ${styles.border}`}
                  style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f0f9ff' }}
                >
                  <td
                    className="px-1 py-1.5 text-left text-[9px] font-bold border-r"
                    style={{
                      color: colorPrimary,
                      borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
                    }}
                  >
                    Gap
                  </td>
                  {columns.map((col) => {
                    const rawGap = calculateGap(
                      (summaryData.current as any)[col.key],
                      (summaryData.previous as any)[col.key]
                    );
                    const isPositive = !rawGap.startsWith('-');
                    return (
                      <td
                        key={`gap-${col.key}`}
                        className={`px-1 py-1.5 text-[9px] font-bold border-r font-mono truncate ${
                          isPositive ? 'text-emerald-500' : 'text-rose-500'
                        }`}
                        style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0' }}
                      >
                        {rawGap}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
