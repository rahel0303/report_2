import React, { useState } from 'react';
import { LayoutProps } from '@/app/types';
import { EditableSlideTitle, SlideFooter, ChannelBadge } from '@/app/components/ui';
import { MetricScorecard, SmartChartBlock } from '@/app/components/charts';
import { SmartInsightBlock } from '@/app/components/insights';
import { Sparkles, Edit3, X, LayoutGrid } from 'lucide-react';
import { generateLayoutTheme, getDecorativeStyles } from '@/app/utils/themeStyles';

const METRIC_COUNT_OPTIONS = [3, 4, 5, 6];

export const LayoutKPI: React.FC<LayoutProps> = ({
  config,
  title = 'KPI Overview',
  onTitleChange = () => {},
  data = {},
  onUpdate = () => {},
  currentPage = 1,
  totalPages = 1,
  isExport = false,
}) => {
  const [isMetricModalOpen, setIsMetricModalOpen] = useState(false);

  const contentMode = config.coverDesign?.contentMode || 'light';
  const theme = generateLayoutTheme(
    config.coverDesign?.colors,
    config.theme.brandColor,
    contentMode,
  );
  const decorStyles = getDecorativeStyles(theme);
  const isDark = contentMode === 'dark';

  const metricCount: number = data.metricCount || 4;

  return (
    <div
      className="w-full h-full flex flex-col p-6 gap-4 pb-16 relative overflow-hidden"
      style={{ fontFamily: config.font.name, background: theme.pageBg }}
    >
      {/* Decorative Elements */}
      <div style={decorStyles.topRightCircle} />
      <div style={decorStyles.bottomLeftCircle} />
      <div style={decorStyles.accentLineTop} />

      {/* Header */}
      <div
        data-kpi-header
        className="h-[10%] shrink-0 rounded-xl p-4 flex items-center justify-between relative overflow-hidden"
        style={{
          backgroundColor: theme.cardBg,
          border: `1px solid ${theme.border}`,
          boxShadow: theme.cardShadow,
        }}
      >
        <div
          className="absolute top-0 left-0 w-1 h-full rounded-l-xl"
          style={{ background: theme.accentGradient }}
        />
        <div
          className="absolute -top-4 -right-4 w-20 h-20 rounded-full"
          style={{ background: theme.decorCircle1 }}
        />
        <div className="flex-1 pl-3">
          <EditableSlideTitle title={title} onChange={onTitleChange} isDark={isDark} />
        </div>
        <div className="flex items-center gap-3">
          {data.channel && <ChannelBadge channel={data.channel} isDark={isDark} size="lg" />}
        </div>
      </div>

      {/* Metric Scorecards */}
      <div data-kpi-metrics className="relative">
        {!isExport && (
          <button
            onClick={() => setIsMetricModalOpen(true)}
            className="absolute -top-1 -right-1 z-10 p-1 rounded-md bg-white border border-slate-200 text-slate-400 hover:text-blue-500 hover:border-blue-300 shadow-sm transition-colors"
            title="Change number of metrics"
          >
            <Edit3 size={12} />
          </button>
        )}
        <div className={`flex h-30 ${metricCount >= 6 ? 'gap-1.5' : 'gap-4'}`}>
          {Array.from({ length: metricCount }, (_, i) => i + 1).map((i) => {
            // Collect metric IDs used by all OTHER scorecards for duplicate prevention
            const siblingIds = Array.from({ length: metricCount }, (__, j) => j + 1)
              .filter((j) => j !== i)
              .map((j) => data[`metric_${j}`]?.id)
              .filter(Boolean) as string[];
            return (
              <div key={i} className="flex-1 min-w-0">
                <MetricScorecard
                  config={config}
                  savedState={data[`metric_${i}`]}
                  onSave={(val) => onUpdate(`metric_${i}`, val)}
                  isExport={isExport}
                  metricCount={metricCount}
                  selectedMetricIds={siblingIds}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Metric Count Modal */}
      {isMetricModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 rounded-2xl shadow-2xl bg-white">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="font-bold text-lg text-slate-900">Number of Metrics</h3>
                <p className="text-xs text-slate-500">Select how many metric blocks to show</p>
              </div>
              <button onClick={() => setIsMetricModalOpen(false)}>
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {METRIC_COUNT_OPTIONS.map((n) => (
                <button
                  key={n}
                  onClick={() => {
                    onUpdate('metricCount', n);
                    setIsMetricModalOpen(false);
                  }}
                  className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all hover:scale-[1.02] ${
                    metricCount === n
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <LayoutGrid size={24} className="opacity-70" />
                  <span className="text-lg font-bold">{n}</span>
                  <span className="text-[10px] text-slate-400">blocks</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Chart + Insight Row */}
      <div className="flex-1 flex gap-4 min-h-0">
        <div
          data-kpi-chart
          className="flex-[2] rounded-xl p-3 relative overflow-hidden"
          style={{
            backgroundColor: theme.cardBg,
            border: `1px solid ${theme.border}`,
            boxShadow: theme.cardShadow,
          }}
        >
          <SmartChartBlock
            label="Deep Dive Analysis"
            config={config}
            savedState={data.main_chart}
            onSave={(val) => onUpdate('main_chart', val)}
            isExport={isExport}
          />
        </div>
        <div
          data-kpi-insight
          className="flex-1 rounded-xl p-3 relative overflow-hidden"
          style={{
            backgroundColor: theme.cardBg,
            border: `1px solid ${theme.border}`,
            boxShadow: theme.cardShadow,
          }}
        >
          <div
            className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full"
            style={{
              background: `radial-gradient(circle, ${theme.decorCircle2} 0%, transparent 70%)`,
            }}
          />
          <SmartInsightBlock
            icon={Sparkles}
            label="Summary & Actions"
            className="border-opacity-50"
            config={config}
            savedState={data.summary}
            onSave={(val) => onUpdate('summary', val)}
            contextData={data}
            contextType="kpi_summary"
            isExport={isExport}
          />
        </div>
      </div>

      <div data-kpi-footer>
        <SlideFooter
          clientName={config.clientName}
          period={config.period}
          currentPage={currentPage}
          totalPages={totalPages}
          logo={config.coverDesign?.logoData}
          brandColor={theme.colors.primary}
        />
      </div>
    </div>
  );
};
