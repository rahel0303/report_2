import React from 'react';
import { LayoutProps } from '@/app/types';
import { EditableSlideTitle, SlideFooter, ChannelBadge } from '@/app/components/ui';
import { SmartChartBlock } from '@/app/components/charts';
import { SmartTableBlock } from '@/app/components/tables';
import { SmartInsightBlock } from '@/app/components/insights';
import { Sparkles, BarChart3, Table as TableIcon, ArrowLeftRight } from 'lucide-react';
import { generateLayoutTheme, getDecorativeStyles } from '@/app/utils/themeStyles';

type VisualMode = 'chart' | 'table' | null;

export const LayoutOverview: React.FC<LayoutProps> = ({
  config,
  title = 'Overview Slide',
  onTitleChange = () => {},
  data = {},
  onUpdate = () => {},
  currentPage = 1,
  totalPages = 1,
  isExport = false,
}) => {
  const contentMode = config.coverDesign?.contentMode || 'light';
  const theme = generateLayoutTheme(
    config.coverDesign?.colors,
    config.theme.brandColor,
    contentMode,
  );
  const decorStyles = getDecorativeStyles(theme);
  const isDark = contentMode === 'dark';

  const visualMode: VisualMode = data.visualMode || null;

  const renderVisualArea = () => {
    if (visualMode === 'chart') {
      return (
        <div className="w-full h-full relative">
          {!isExport && (
            <button
              onClick={() => {
                onUpdate('visualMode', null);
                onUpdate('main_visual', null);
              }}
              className="absolute top-1 right-1 z-10 p-1 rounded-md bg-white border border-slate-200 text-slate-400 hover:text-blue-500 hover:border-blue-300 shadow-sm transition-colors"
              title="Switch visualization type"
            >
              <ArrowLeftRight size={12} />
            </button>
          )}
          <SmartChartBlock
            label="Select Visualization"
            config={config}
            savedState={data.main_visual}
            onSave={(val) => onUpdate('main_visual', val)}
            isExport={isExport}
          />
        </div>
      );
    }

    if (visualMode === 'table') {
      return (
        <div className="w-full h-full relative">
          {!isExport && (
            <button
              onClick={() => {
                onUpdate('visualMode', null);
                onUpdate('main_table', null);
              }}
              className="absolute top-1 right-1 z-10 p-1 rounded-md bg-white border border-slate-200 text-slate-400 hover:text-blue-500 hover:border-blue-300 shadow-sm transition-colors"
              title="Switch visualization type"
            >
              <ArrowLeftRight size={12} />
            </button>
          )}
          <SmartTableBlock
            config={config}
            savedState={data.main_table}
            onSave={(val) => onUpdate('main_table', val)}
            isExport={isExport}
          />
        </div>
      );
    }

    return (
      <div className="w-full h-full flex items-center justify-center gap-6">
        <button
          onClick={() => onUpdate('visualMode', 'chart')}
          className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/50 text-slate-400 hover:text-blue-500 transition-all group"
        >
          <BarChart3
            size={32}
            className="opacity-50 group-hover:opacity-80 group-hover:scale-110 transition-all"
          />
          <span className="text-xs font-bold uppercase tracking-wider">Chart</span>
        </button>
        <button
          onClick={() => onUpdate('visualMode', 'table')}
          className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/50 text-slate-400 hover:text-blue-500 transition-all group"
        >
          <TableIcon
            size={32}
            className="opacity-50 group-hover:opacity-80 group-hover:scale-110 transition-all"
          />
          <span className="text-xs font-bold uppercase tracking-wider">Table</span>
        </button>
      </div>
    );
  };

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
        data-overview-header
        className="h-[10%] shrink-0 rounded-xl p-4 flex items-center justify-between relative overflow-hidden"
        style={{
          backgroundColor: theme.cardBg,
          border: `1px solid ${theme.border}`,
          boxShadow: theme.cardShadow,
        }}
      >
        {/* Header left accent bar */}
        <div
          className="absolute top-0 left-0 w-1 h-full rounded-l-xl"
          style={{ background: theme.accentGradient }}
        />
        {/* Small decorative circle */}
        <div
          className="absolute -top-4 -right-4 w-20 h-20 rounded-full"
          style={{ background: theme.decorCircle1 }}
        />
        <div className="flex-1 pl-3">
          <EditableSlideTitle title={title} onChange={onTitleChange} isDark={isDark} />
        </div>
        {data.channel && (
          <div className="ml-4">
            <ChannelBadge channel={data.channel} isDark={isDark} size="lg" />
          </div>
        )}
      </div>

      {/* Visual Area */}
      <div
        data-overview-visual
        className="flex-1 min-h-0 rounded-xl p-3 relative overflow-hidden"
        style={{
          backgroundColor: theme.cardBg,
          border: `1px solid ${theme.border}`,
          boxShadow: theme.cardShadow,
        }}
      >
        {renderVisualArea()}
      </div>

      {/* Insight */}
      <div
        data-overview-insight
        className="h-[20%] shrink-0 rounded-xl p-3 relative overflow-hidden"
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
          label="Comparative Analysis & Notes"
          className="border-opacity-50"
          config={config}
          savedState={data.summary}
          onSave={(val) => onUpdate('summary', val)}
          contextData={data}
          contextType="overview_analysis"
          isExport={isExport}
        />
      </div>

      <div data-overview-footer>
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
