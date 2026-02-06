import React, { useState, useEffect, useMemo } from 'react';
import { Edit3, ImageIcon as ImageIconLucide } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { SmartChartBlockProps, ChartType, PieChartDataPoint, PostData } from '@/app/types';
import { ChartSelectionModal } from '@/app/components/ui';

// Metric labels for display
const METRIC_LABELS: Record<string, string> = {
  followers: 'Followers',
  profile_views: 'Profile Views',
  profile_reach: 'Profile Reach',
  net_followers_growth: 'Net Growth',
  engagements: 'Engagements',
  likes: 'Likes',
  comments: 'Comments',
  shares: 'Shares',
  engagement: 'Engagement',
  followers_growth_pct: 'Growth %',
  er_reach: 'ER Reach',
  avg_engagements: 'Avg Eng.',
  total_reach: 'Total Reach',
  number_of_posts: 'Posts',
  avg_er_pct: 'Avg ER%',
  avg_reach: 'Avg Reach',
  avg_er_reach: 'Avg ER Reach',
  followers_growth: 'Followers Growth',
};

// Generate dummy data based on dimension
const generateLineChartData = (dimension: string, metrics: string[]) => {
  const getLabels = () => {
    switch (dimension) {
      case 'days':
        return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      case 'last3months':
        const now = new Date();
        return [
          new Date(now.setMonth(now.getMonth() - 2)).toLocaleString('en', { month: 'short' }),
          new Date(now.setMonth(now.getMonth() + 1)).toLocaleString('en', { month: 'short' }),
          new Date(now.setMonth(now.getMonth() + 1)).toLocaleString('en', { month: 'short' }),
        ];
      case 'sentiments':
        return ['Very Negative', 'Negative', 'Neutral', 'Positive', 'Very Positive'];
      case 'months':
      default:
        return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    }
  };

  const labels = getLabels();
  return labels.map((label, idx) => {
    const dataPoint: Record<string, any> = { name: label };
    metrics.forEach((metric, mIdx) => {
      // Generate realistic-looking random data
      const baseValue = 1000 + mIdx * 500;
      const variation = Math.floor(Math.random() * 2000) - 500;
      const trend = idx * 100; // Slight upward trend
      dataPoint[metric] = Math.max(0, baseValue + variation + trend);
    });
    return dataPoint;
  });
};

// Generate dummy data for bar chart
const generateBarChartData = (barCategory: string, metrics: string[]) => {
  const getLabels = () => {
    switch (barCategory) {
      case 'daily_performance':
        return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      case 'last3months_performance':
        const now = new Date();
        return [
          new Date(now.setMonth(now.getMonth() - 2)).toLocaleString('en', { month: 'short' }),
          new Date(now.setMonth(now.getMonth() + 1)).toLocaleString('en', { month: 'short' }),
          new Date(now.setMonth(now.getMonth() + 1)).toLocaleString('en', { month: 'short' }),
        ];
      case 'content_pillars':
        return ['Educational', 'Promotional', 'Entertainment', 'User Generated'];
      case 'competitors':
        return ['Brand', 'Competitor A', 'Competitor B', 'Competitor C'];
      default:
        return ['A', 'B', 'C', 'D'];
    }
  };

  const labels = getLabels();
  return labels.map((label, idx) => {
    const dataPoint: Record<string, any> = { name: label };
    metrics.forEach((metric, mIdx) => {
      const baseValue = 500 + mIdx * 300;
      const variation = Math.floor(Math.random() * 1000);
      dataPoint[metric] = Math.max(0, baseValue + variation);
    });
    return dataPoint;
  });
};

export const SmartChartBlock: React.FC<SmartChartBlockProps> = ({
  label,
  className,
  config,
  savedState,
  onSave,
  isExport = false,
}) => {
  const [chartType, setChartType] = useState<ChartType | null>(savedState?.type || null);
  const [settings, setSettings] = useState<any>(savedState?.settings || {});
  const [blockTitle, setBlockTitle] = useState(savedState?.title || label);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  useEffect(() => {
    if (savedState) {
      setChartType(savedState.type);
      setSettings(savedState.settings || {});
      if (savedState.title) setBlockTitle(savedState.title);
    }
  }, [savedState]);

  // Use contentMode from coverDesign for theme
  const contentMode = config.coverDesign?.contentMode || 'light';
  const isDark = contentMode === 'dark';
  const colorPrimary = config.coverDesign?.colors?.primary || config.theme.brandColor;

  // Define better color palette for metrics
  const metricColors = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#f97316', // orange
  ];

  // Font sizes for export
  const fontSize = {
    title: isExport ? 'text-xl' : 'text-xs',
    axisLabel: isExport ? 14 : 11,
    legendText: isExport ? 16 : 12,
  };

  const handleSelect = (type: ChartType | string, extraSettings: any = {}) => {
    const newData = { type: type as ChartType, settings: extraSettings, title: blockTitle };
    setChartType(type as ChartType);
    setSettings(extraSettings);
    if (onSave) onSave(newData);
    setIsModalOpen(false);
  };

  const handleTitleSave = () => {
    setIsEditingTitle(false);
    if (onSave) onSave({ type: chartType!, settings, title: blockTitle });
  };

  // Generate data based on chart configuration
  const lineData = useMemo(() => {
    const dimension = settings?.dimension || 'months';
    const metrics = settings?.metrics || ['followers', 'engagements'];
    return generateLineChartData(dimension, metrics);
  }, [settings?.dimension, settings?.metrics]);

  const barData = useMemo(() => {
    const barCategory = settings?.barCategory || 'daily_performance';
    const barMetrics = settings?.barMetrics || ['engagement', 'followers'];
    return generateBarChartData(barCategory, barMetrics);
  }, [settings?.barCategory, settings?.barMetrics]);

  const pieData: PieChartDataPoint[] = useMemo(
    () => [
      { name: 'Organic', value: 400 },
      { name: 'Paid', value: 300 },
      { name: 'Viral', value: 300 },
      { name: 'Direct', value: 200 },
    ],
    [],
  );

  const postsData: PostData[] = useMemo(() => {
    const images = ['/1.png', '/2.png', '/3.png', '/4.png', '/5.png'];
    return Array.from({ length: settings?.count || 3 }).map((_, i) => ({
      id: i,
      reach: 12000 + i * 1500,
      eng: 450 + i * 50,
      image: images[i % images.length],
    }));
  }, [settings?.count]);

  const renderContent = () => {
    if (!chartType) {
      return (
        <div className="w-full h-full border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center bg-slate-50/50 text-slate-400 transition-all hover:bg-blue-50/50 hover:border-blue-300 hover:text-blue-500 cursor-pointer group">
          <span className="text-[10px] font-bold uppercase tracking-wider">{blockTitle}</span>
        </div>
      );
    }

    const ChartWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <div
        className={`w-full h-full flex flex-col rounded-lg overflow-hidden relative group ${
          isDark ? 'bg-slate-800' : 'bg-white'
        }`}
      >
        <div
          className={`shrink-0 px-3 py-2 border-b flex justify-between items-center ${
            isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-100 bg-slate-50/50'
          }`}
        >
          {isEditingTitle ? (
            <input
              autoFocus
              className={`text-[10px] font-bold uppercase tracking-wider px-1 py-0.5 w-full mr-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                isDark
                  ? 'bg-slate-700 border-slate-600 text-white'
                  : 'bg-white border-blue-200 text-slate-800'
              }`}
              value={blockTitle}
              onChange={(e) => setBlockTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingTitle(true);
              }}
              className={`text-[10px] font-bold uppercase tracking-wider cursor-text truncate border border-transparent hover:border-slate-200 px-1 py-0.5 rounded ${
                isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-500 hover:text-blue-600'
              }`}
              title="Click to edit title"
            >
              {blockTitle}
            </span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsModalOpen(true);
            }}
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 transition-colors"
          >
            <Edit3 size={12} />
          </button>
        </div>
        <div className="flex-1 min-h-0 relative p-2">{children}</div>
      </div>
    );

    if (chartType === 'posts') {
      return (
        <ChartWrapper>
          <div
            className={`w-full h-full grid gap-2 ${
              settings?.count === 2
                ? 'grid-cols-2'
                : settings?.count === 3
                  ? 'grid-cols-3'
                  : 'grid-cols-2 grid-rows-2'
            }`}
          >
            {postsData.map((post, i) => (
              <div
                key={i}
                className={`rounded-lg border overflow-hidden flex flex-col ${
                  isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                }`}
              >
                <div
                  className={`aspect-[4/3] flex items-center justify-center overflow-hidden group ${
                    isDark ? 'bg-slate-700/50' : 'bg-slate-100/50'
                  }`}
                >
                  {post.image ? (
                    <img
                      src={post.image}
                      alt={`Post ${i + 1}`}
                      className="w-full h-full object-fill group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <ImageIconLucide className="text-slate-300" size={20} />
                  )}
                </div>
                <div className={`p-2 border-t ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
                  <div className="flex justify-between text-[8px] mb-1">
                    <span className="text-slate-400">Reach</span>
                    <span className={`font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {post.reach.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-[8px]">
                    <span className="text-slate-400">Eng.</span>
                    <span className={`font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {post.eng}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ChartWrapper>
      );
    }

    // Get metrics for rendering
    const lineMetrics = settings?.metrics || ['followers', 'engagements'];
    const barMetrics = settings?.barMetrics || ['engagement', 'followers'];

    return (
      <ChartWrapper>
        <div className={`w-full h-full ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <LineChart data={lineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDark ? '#334155' : '#e2e8f0'}
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: fontSize.axisLabel, fill: isDark ? '#94a3b8' : '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: fontSize.axisLabel, fill: isDark ? '#94a3b8' : '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: '10px',
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    color: isDark ? '#e2e8f0' : '#1f2937',
                  }}
                  formatter={(value, name) => [
                    typeof value === 'number' ? value.toLocaleString() : String(value),
                    METRIC_LABELS[name as string] || name,
                  ]}
                />
                <Legend
                  verticalAlign="top"
                  height={24}
                  iconType="line"
                  iconSize={12}
                  wrapperStyle={{ fontSize: '10px' }}
                  formatter={(value) => METRIC_LABELS[value] || value}
                />
                {lineMetrics.map((metric: string, idx: number) => (
                  <Line
                    key={metric}
                    type="monotone"
                    dataKey={metric}
                    stroke={metricColors[idx % metricColors.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name={metric}
                  />
                ))}
              </LineChart>
            ) : chartType === 'bar' && settings?.barOrientation === 'vertical' ? (
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDark ? '#334155' : '#e2e8f0'}
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: fontSize.axisLabel, fill: isDark ? '#94a3b8' : '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: fontSize.axisLabel, fill: isDark ? '#94a3b8' : '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: '10px',
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    color: isDark ? '#e2e8f0' : '#1f2937',
                  }}
                  formatter={(value, name) => [
                    typeof value === 'number' ? value.toLocaleString() : String(value),
                    METRIC_LABELS[name as string] || name,
                  ]}
                />
                <Legend
                  verticalAlign="top"
                  height={24}
                  iconType="square"
                  iconSize={10}
                  wrapperStyle={{ fontSize: '10px' }}
                  formatter={(value) => METRIC_LABELS[value] || value}
                />
                {barMetrics.map((metric: string, idx: number) => (
                  <Bar
                    key={metric}
                    dataKey={metric}
                    fill={metricColors[idx % metricColors.length]}
                    name={metric}
                  />
                ))}
              </BarChart>
            ) : chartType === 'bar' ? (
              <BarChart
                layout="vertical"
                data={barData}
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDark ? '#334155' : '#e2e8f0'}
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: fontSize.axisLabel, fill: isDark ? '#94a3b8' : '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: fontSize.axisLabel, fill: isDark ? '#94a3b8' : '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  width={70}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: '10px',
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    color: isDark ? '#e2e8f0' : '#1f2937',
                  }}
                  formatter={(value, name) => [
                    typeof value === 'number' ? value.toLocaleString() : String(value),
                    METRIC_LABELS[name as string] || name,
                  ]}
                />
                <Legend
                  verticalAlign="top"
                  height={24}
                  iconType="square"
                  iconSize={10}
                  wrapperStyle={{ fontSize: '10px' }}
                  formatter={(value) => METRIC_LABELS[value] || value}
                />
                {barMetrics.map((metric: string, idx: number) => (
                  <Bar
                    key={metric}
                    dataKey={metric}
                    fill={metricColors[idx % metricColors.length]}
                    name={metric}
                    barSize={16}
                  />
                ))}
              </BarChart>
            ) : chartType === 'pie' ? (
              <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={60}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ x, y, name, percent }: any) => (
                    <text
                      x={x}
                      y={y}
                      fill={isDark ? '#e2e8f0' : '#475569'}
                      textAnchor="middle"
                      dominantBaseline="central"
                      style={{ fontSize: `${fontSize.legendText}px`, fontWeight: 'bold' }}
                    >
                      {`${name} ${(percent * 100).toFixed(0)}%`}
                    </text>
                  )}
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={metricColors[index % metricColors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    fontSize: '10px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    color: isDark ? '#e2e8f0' : '#1f2937',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={24}
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '10px' }}
                />
              </PieChart>
            ) : null}
          </ResponsiveContainer>
        </div>
      </ChartWrapper>
    );
  };

  return (
    <>
      <div
        onClick={() => !chartType && setIsModalOpen(true)}
        className="w-full h-full cursor-pointer"
      >
        {renderContent()}
      </div>
      <ChartSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleSelect}
        config={config}
      />
    </>
  );
};
