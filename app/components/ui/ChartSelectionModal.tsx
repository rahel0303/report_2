import React, { useState } from 'react';
import {
  X,
  ArrowLeft,
  Activity,
  BarChart3,
  TrendingUp,
  Users,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Calendar,
  Clock,
  Layers,
} from 'lucide-react';
import { ChartSelectionModalProps, ChartSettings } from '@/app/types';

type ChartCategory = 'line' | 'bar' | null;
type LineChartDimension = 'months' | 'last3months' | 'days' | 'sentiments';
type BarChartCategory =
  | 'daily_performance'
  | 'last3months_performance'
  | 'content_pillars'
  | 'competitors';
type BarOrientation = 'vertical' | 'horizontal';

interface ChartConfig {
  chartType: string;
  dimension?: LineChartDimension;
  metrics?: string[];
  barCategory?: BarChartCategory;
  barMetrics?: string[];
}

// Line chart dimension options
const LINE_DIMENSIONS = [
  { id: 'months', label: 'Monthly', icon: Calendar, desc: 'Month by month trends' },
  { id: 'last3months', label: 'Last 3 Months', icon: Clock, desc: 'Recent 3-month comparison' },
  { id: 'days', label: 'Daily', icon: Activity, desc: 'Day by day analysis' },
  { id: 'sentiments', label: 'Sentiments', icon: Heart, desc: 'Sentiment over time' },
];

// Line chart metrics
const LINE_METRICS = [
  { id: 'followers', label: 'Followers', icon: Users },
  { id: 'profile_views', label: 'Profile Views', icon: Eye },
  { id: 'profile_reach', label: 'Profile Reach', icon: TrendingUp },
  { id: 'net_followers_growth', label: 'Net Followers Growth', icon: TrendingUp },
  { id: 'engagements', label: 'Engagements', icon: Heart },
  { id: 'likes', label: 'Likes', icon: Heart },
  { id: 'comments', label: 'Comments', icon: MessageCircle },
  { id: 'shares', label: 'Shares', icon: Share2 },
];

// Bar chart categories
const BAR_CATEGORIES = [
  {
    id: 'daily_performance',
    label: 'Daily Performance',
    desc: 'Daily metrics breakdown',
    metrics: [
      { id: 'profile_views', label: 'Profile Views' },
      { id: 'engagement', label: 'Engagement' },
      { id: 'followers', label: 'Followers' },
      { id: 'net_followers_growth', label: 'Net Followers Growth' },
    ],
  },
  {
    id: 'last3months_performance',
    label: 'Last 3 Months Performance',
    desc: 'Quarterly comparison',
    metrics: [
      { id: 'followers', label: 'Followers' },
      { id: 'followers_growth_pct', label: 'Followers Growth (%)' },
      { id: 'er_reach', label: 'ER Reach' },
      { id: 'engagements', label: 'Engagements' },
      { id: 'avg_engagements', label: 'Avg Engagements' },
      { id: 'total_reach', label: 'Total Reach' },
    ],
  },
  {
    id: 'content_pillars',
    label: 'Content Pillars Comparison',
    desc: 'Compare content categories',
    metrics: [
      { id: 'number_of_posts', label: 'Number of Posts' },
      { id: 'avg_er_pct', label: 'Avg ER%' },
      { id: 'avg_reach', label: 'Avg Reach' },
      { id: 'engagement', label: 'Engagement' },
      { id: 'avg_engagements', label: 'Avg Engagements' },
    ],
  },
  {
    id: 'competitors',
    label: 'Competitors Comparison',
    desc: 'Compare with competitors',
    metrics: [
      { id: 'avg_engagements', label: 'Avg Engagements' },
      { id: 'engagements', label: 'Engagements' },
      { id: 'avg_er_reach', label: 'Avg ER Reach' },
      { id: 'avg_reach', label: 'Avg Reach' },
      { id: 'followers_growth', label: 'Followers Growth' },
      { id: 'followers_growth_pct', label: 'Followers Growth (%)' },
    ],
  },
];

export const ChartSelectionModal: React.FC<ChartSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  config,
}) => {
  if (!isOpen) return null;

  const isDark = config.theme.type === 'dark';
  const [step, setStep] = useState<number>(1);
  const [chartCategory, setChartCategory] = useState<ChartCategory>(null);
  const [lineDimension, setLineDimension] = useState<LineChartDimension | null>(null);
  const [selectedLineMetrics, setSelectedLineMetrics] = useState<string[]>([]);
  const [barOrientation, setBarOrientation] = useState<BarOrientation>('vertical');
  const [barCategory, setBarCategory] = useState<BarChartCategory | null>(null);
  const [selectedBarMetrics, setSelectedBarMetrics] = useState<string[]>([]);

  const resetState = () => {
    setStep(1);
    setChartCategory(null);
    setLineDimension(null);
    setSelectedLineMetrics([]);
    setBarOrientation('vertical');
    setBarCategory(null);
    setSelectedBarMetrics([]);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleBack = () => {
    if (step === 4) {
      setStep(3);
      setSelectedBarMetrics([]);
    } else if (step === 3) {
      if (chartCategory === 'bar') {
        setStep(2);
        setBarCategory(null);
      } else {
        setStep(2);
        setSelectedLineMetrics([]);
      }
    } else if (step === 2) {
      setStep(1);
      setLineDimension(null);
      setBarOrientation('vertical');
    }
  };

  const MAX_LINE_METRICS = 2;

  const toggleMetric = (metricId: string, isLine: boolean) => {
    if (isLine) {
      setSelectedLineMetrics((prev) => {
        if (prev.includes(metricId)) {
          return prev.filter((m) => m !== metricId);
        }
        // Prevent adding more than MAX_LINE_METRICS
        if (prev.length >= MAX_LINE_METRICS) {
          return prev;
        }
        return [...prev, metricId];
      });
    } else {
      setSelectedBarMetrics((prev) =>
        prev.includes(metricId) ? prev.filter((m) => m !== metricId) : [...prev, metricId],
      );
    }
  };

  const handleConfirm = () => {
    const chartConfig: any = {
      type: chartCategory,
    };

    if (chartCategory === 'line') {
      chartConfig.dimension = lineDimension;
      chartConfig.metrics = selectedLineMetrics;
    } else if (chartCategory === 'bar') {
      chartConfig.barOrientation = barOrientation;
      chartConfig.barCategory = barCategory;
      chartConfig.barMetrics = selectedBarMetrics;
    }

    onSelect(chartCategory as string, chartConfig);
    handleClose();
  };

  const baseButtonClass = `p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all hover:scale-[1.02] ${
    isDark
      ? 'border-slate-700 hover:bg-slate-800 text-slate-300'
      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
  }`;

  const selectedButtonClass = isDark
    ? 'border-blue-500 bg-blue-500/20 text-blue-300'
    : 'border-blue-500 bg-blue-50 text-blue-700';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
      <div
        className={`w-full max-w-lg p-6 rounded-2xl shadow-2xl ${
          isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white'
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button
                onClick={handleBack}
                className={`p-1.5 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                }`}
              >
                <ArrowLeft size={18} className="text-slate-400" />
              </button>
            )}
            <div>
              <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {step === 1 && 'Select Chart Type'}
                {step === 2 && chartCategory === 'line' && 'Select Dimension'}
                {step === 2 && chartCategory === 'bar' && 'Select Orientation'}
                {step === 3 && chartCategory === 'line' && 'Select Metrics'}
                {step === 3 && chartCategory === 'bar' && 'Select Category'}
                {step === 4 && 'Select Metrics'}
              </h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Step {step} of {chartCategory === 'bar' ? 4 : 3}
              </p>
            </div>
          </div>
          <button onClick={handleClose}>
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Step 1: Select Chart Type */}
        {step === 1 && (
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => {
                setChartCategory('line');
                setStep(2);
              }}
              className={baseButtonClass}
            >
              <Activity size={32} className="opacity-70" />
              <span className="text-sm font-bold">Line Chart</span>
              <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Trends over time
              </span>
            </button>
            <button
              onClick={() => {
                setChartCategory('bar');
                setStep(2);
              }}
              className={baseButtonClass}
            >
              <BarChart3 size={32} className="opacity-70" />
              <span className="text-sm font-bold">Bar Chart</span>
              <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Compare values
              </span>
            </button>
          </div>
        )}

        {/* Step 2: Bar Chart - Select Orientation */}
        {step === 2 && chartCategory === 'bar' && (
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => {
                setBarOrientation('vertical');
                setStep(3);
              }}
              className={baseButtonClass}
            >
              <BarChart3 size={32} className="opacity-70" />
              <span className="text-sm font-bold">Vertical</span>
              <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Standard bar chart
              </span>
            </button>
            <button
              onClick={() => {
                setBarOrientation('horizontal');
                setStep(3);
              }}
              className={baseButtonClass}
            >
              <BarChart3 size={32} className="opacity-70 rotate-90" />
              <span className="text-sm font-bold">Horizontal</span>
              <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Horizontal bar chart
              </span>
            </button>
          </div>
        )}

        {/* Step 2: Line Chart - Select Dimension */}
        {step === 2 && chartCategory === 'line' && (
          <div className="grid grid-cols-2 gap-3">
            {LINE_DIMENSIONS.map((dim) => {
              const IconComp = dim.icon;
              return (
                <button
                  key={dim.id}
                  onClick={() => {
                    setLineDimension(dim.id as LineChartDimension);
                    setStep(3);
                  }}
                  className={`${baseButtonClass} items-start text-left`}
                >
                  <div className="flex items-center gap-2 w-full">
                    <IconComp size={18} className="opacity-60" />
                    <span className="text-sm font-bold">{dim.label}</span>
                  </div>
                  <span
                    className={`text-[10px] w-full ${isDark ? 'text-slate-500' : 'text-slate-400'}`}
                  >
                    {dim.desc}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Step 3: Bar Chart - Select Category */}
        {step === 3 && chartCategory === 'bar' && (
          <div className="grid grid-cols-2 gap-3">
            {BAR_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setBarCategory(cat.id as BarChartCategory);
                  setStep(4);
                }}
                className={`${baseButtonClass} items-start text-left`}
              >
                <div className="flex items-center gap-2 w-full">
                  <Layers size={18} className="opacity-60" />
                  <span className="text-sm font-bold">{cat.label}</span>
                </div>
                <span
                  className={`text-[10px] w-full ${isDark ? 'text-slate-500' : 'text-slate-400'}`}
                >
                  {cat.desc}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Step 3: Line Chart - Select Metrics */}
        {step === 3 && chartCategory === 'line' && (
          <div className="space-y-4">
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Select up to {MAX_LINE_METRICS} metrics
            </p>
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {LINE_METRICS.map((metric) => {
                const IconComp = metric.icon;
                const isSelected = selectedLineMetrics.includes(metric.id);
                const isDisabled = !isSelected && selectedLineMetrics.length >= MAX_LINE_METRICS;
                return (
                  <button
                    key={metric.id}
                    onClick={() => !isDisabled && toggleMetric(metric.id, true)}
                    disabled={isDisabled}
                    className={`p-3 rounded-lg border flex items-center gap-2 transition-all text-left ${
                      isSelected
                        ? selectedButtonClass
                        : isDisabled
                          ? isDark
                            ? 'border-slate-800 bg-slate-800/50 text-slate-600 cursor-not-allowed opacity-50'
                            : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed opacity-50'
                          : isDark
                            ? 'border-slate-700 hover:bg-slate-800 text-slate-400'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded border flex items-center justify-center text-xs ${
                        isSelected
                          ? 'bg-blue-500 border-blue-500 text-white'
                          : isDisabled
                            ? isDark
                              ? 'border-slate-700 bg-slate-700'
                              : 'border-slate-300 bg-slate-200'
                            : isDark
                              ? 'border-slate-600'
                              : 'border-slate-300'
                      }`}
                    >
                      {isSelected && '✓'}
                    </div>
                    <IconComp size={14} className={isDisabled ? 'opacity-30' : 'opacity-60'} />
                    <span className="text-xs font-medium">{metric.label}</span>
                  </button>
                );
              })}
            </div>
            <button
              onClick={handleConfirm}
              disabled={selectedLineMetrics.length === 0}
              className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                selectedLineMetrics.length > 0
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              Apply ({selectedLineMetrics.length} selected)
            </button>
          </div>
        )}

        {/* Step 4: Bar Chart - Select Metrics */}
        {step === 4 && chartCategory === 'bar' && barCategory && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {BAR_CATEGORIES.find((c) => c.id === barCategory)?.metrics.map((metric) => {
                const isSelected = selectedBarMetrics.includes(metric.id);
                return (
                  <button
                    key={metric.id}
                    onClick={() => toggleMetric(metric.id, false)}
                    className={`p-3 rounded-lg border flex items-center gap-2 transition-all text-left ${
                      isSelected
                        ? selectedButtonClass
                        : isDark
                          ? 'border-slate-700 hover:bg-slate-800 text-slate-400'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded border flex items-center justify-center text-xs ${
                        isSelected
                          ? 'bg-blue-500 border-blue-500 text-white'
                          : isDark
                            ? 'border-slate-600'
                            : 'border-slate-300'
                      }`}
                    >
                      {isSelected && '✓'}
                    </div>
                    <span className="text-xs font-medium">{metric.label}</span>
                  </button>
                );
              })}
            </div>
            <button
              onClick={handleConfirm}
              disabled={selectedBarMetrics.length === 0}
              className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                selectedBarMetrics.length > 0
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              Apply ({selectedBarMetrics.length} selected)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
