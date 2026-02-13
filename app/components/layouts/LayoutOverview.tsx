import React from 'react';
import { LayoutProps } from '@/app/types';
import { EditableSlideTitle, SlideFooter, ChannelBadge } from '@/app/components/ui';
import { SmartChartBlock } from '@/app/components/charts';
import { SmartTableBlock } from '@/app/components/tables';
import { SmartInsightBlock } from '@/app/components/insights';
import { Sparkles, BarChart3, Table as TableIcon, ArrowLeftRight } from 'lucide-react';

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
  const logoColors = config.coverDesign?.colors;
  const isDark = false;
  const styles = {
    bg: '#ffffff',
    cardBg: '#ffffff',
    border: 'border-slate-200',
    accent: logoColors?.primary || config.theme.brandColor,
  };

  const visualMode: VisualMode = data.visualMode || null;

  const renderVisualArea = () => {
    // If mode is selected, show the corresponding component
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

    // No mode selected - show picker
    return (
      <div className="w-full h-full flex items-center justify-center gap-6">
        <button
          onClick={() => onUpdate('visualMode', 'chart')}
          className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/50 text-slate-400 hover:text-blue-500 transition-all group"
        >
          <BarChart3 size={32} className="opacity-50 group-hover:opacity-80 group-hover:scale-110 transition-all" />
          <span className="text-xs font-bold uppercase tracking-wider">Chart</span>
        </button>
        <button
          onClick={() => onUpdate('visualMode', 'table')}
          className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/50 text-slate-400 hover:text-blue-500 transition-all group"
        >
          <TableIcon size={32} className="opacity-50 group-hover:opacity-80 group-hover:scale-110 transition-all" />
          <span className="text-xs font-bold uppercase tracking-wider">Table</span>
        </button>
      </div>
    );
  };

  return (
    <div
      className="w-full h-full flex flex-col p-6 gap-4 pb-16 relative"
      style={{ fontFamily: config.font.name, backgroundColor: styles.bg }}
    >
      <div
        className={`h-[10%] shrink-0 border-b flex items-center justify-between pb-4 ${styles.border}`}
      >
        <EditableSlideTitle title={title} onChange={onTitleChange} isDark={isDark} />
        {data.channel && (
          <div className="ml-4">
            <ChannelBadge channel={data.channel} isDark={isDark} size="lg" />
          </div>
        )}
      </div>

      <div
        className={`flex-1 min-h-0 rounded-xl border p-2 shadow-sm ${styles.border}`}
        style={{ backgroundColor: styles.cardBg }}
      >
        {renderVisualArea()}
      </div>

      <div
        className={`h-[20%] shrink-0 rounded-xl border p-2 shadow-sm ${styles.border}`}
        style={{ backgroundColor: styles.cardBg }}
      >
        <SmartInsightBlock
          icon={Sparkles}
          label="Comparative Analysis & Notes"
          className="bg-blue-50/20 border-blue-200/50"
          config={config}
          savedState={data.summary}
          onSave={(val) => onUpdate('summary', val)}
          contextData={data}
          contextType="overview_analysis"
          isExport={isExport}
        />
      </div>

      <SlideFooter
        clientName={config.clientName}
        period={config.period}
        currentPage={currentPage}
        totalPages={totalPages}
        logo={config.coverDesign?.logoData}
        brandColor={config.theme.brandColor}
      />
    </div>
  );
};
