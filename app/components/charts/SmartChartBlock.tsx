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
import {
  SmartChartBlockProps,
  ChartType,
  LineChartDataPoint,
  PieChartDataPoint,
  PostData,
} from '@/app/types';
import { ChartSelectionModal } from '@/app/components/ui';

export const SmartChartBlock: React.FC<SmartChartBlockProps> = ({
  label,
  className,
  config,
  savedState,
  onSave,
}) => {
  const [chartType, setChartType] = useState<ChartType | null>(savedState?.type || null);
  const [settings, setSettings] = useState(savedState?.settings || {});
  const [blockTitle, setBlockTitle] = useState(savedState?.title || label);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  useEffect(() => {
    if (savedState) {
      setChartType(savedState.type);
      setSettings(savedState.settings);
      if (savedState.title) setBlockTitle(savedState.title);
    }
  }, [savedState]);

  const isDark = config.theme.type === 'dark';
  const colorPrimary = config.theme.brandColor;
  const chartColors = config.theme.colors.slice(1);

  const handleSelect = (type: ChartType | string, extraSettings = {}) => {
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

  const data: LineChartDataPoint[] = useMemo(
    () => [
      { name: 'Jan', val: 4000, val2: 2400 },
      { name: 'Feb', val: 3000, val2: 1398 },
      { name: 'Mar', val: 2000, val2: 9800 },
      { name: 'Apr', val: 2780, val2: 3908 },
      { name: 'May', val: 1890, val2: 4800 },
      { name: 'Jun', val: 2390, val2: 3800 },
    ],
    []
  );

  const pieData: PieChartDataPoint[] = useMemo(
    () => [
      { name: 'Organic', value: 400 },
      { name: 'Paid', value: 300 },
      { name: 'Viral', value: 300 },
      { name: 'Direct', value: 200 },
    ],
    []
  );

  const postsData: PostData[] = useMemo(
    () =>
      Array.from({ length: settings.count || 3 }).map((_, i) => ({
        id: i,
        reach: 12000 + i * 1500,
        eng: 450 + i * 50,
      })),
    [settings.count]
  );

  const renderContent = () => {
    if (!chartType) {
      return (
        <div className="w-full h-full border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center bg-slate-50/50 text-slate-400 transition-all hover:bg-blue-50/50 hover:border-blue-300 hover:text-blue-500 cursor-pointer group">
          <span className="text-[10px] font-bold uppercase tracking-wider">{blockTitle}</span>
        </div>
      );
    }

    const ChartWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <div className="w-full h-full flex flex-col bg-white dark:bg-slate-800 rounded-lg overflow-hidden relative group">
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
              settings.count === 2
                ? 'grid-cols-2'
                : settings.count === 3
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
                <div className="flex-1 bg-slate-100/50 flex items-center justify-center">
                  <ImageIconLucide className="text-slate-300" size={20} />
                </div>
                <div className="p-2 border-t border-slate-100 dark:border-slate-700">
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

    return (
      <ChartWrapper>
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' ? (
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isDark ? '#334155' : '#e2e8f0'}
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  fontSize: '10px',
                  borderRadius: '8px',
                  border: 'none',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              <Line
                type="monotone"
                dataKey="val"
                stroke={colorPrimary}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="val2"
                stroke={chartColors[1]}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          ) : chartType === 'column' ? (
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isDark ? '#334155' : '#e2e8f0'}
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  fontSize: '10px',
                  borderRadius: '8px',
                  border: 'none',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              <Bar dataKey="val" fill={colorPrimary} radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : chartType === 'bar' ? (
            <BarChart
              layout="vertical"
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isDark ? '#334155' : '#e2e8f0'}
                horizontal={false}
              />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b' }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  fontSize: '10px',
                  borderRadius: '8px',
                  border: 'none',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              <Bar dataKey="val" fill={colorPrimary} radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          ) : (
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
                    style={{ fontSize: '10px', fontWeight: 'bold' }}
                  >
                    {`${name} ${(percent * 100).toFixed(0)}%`}
                  </text>
                )}
                labelLine={false}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '8px', border: 'none' }} />
              <Legend
                verticalAlign="bottom"
                height={24}
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '10px' }}
              />
            </PieChart>
          )}
        </ResponsiveContainer>
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
