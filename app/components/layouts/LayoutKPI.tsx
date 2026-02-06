import React from 'react';
import { LayoutProps } from '@/app/types';
import { EditableSlideTitle, SlideFooter, ChannelBadge } from '@/app/components/ui';
import { MetricScorecard, SmartChartBlock } from '@/app/components/charts';
import { SmartInsightBlock } from '@/app/components/insights';
import { Sparkles } from 'lucide-react';

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
  // Use logo colors if available, otherwise fallback to theme
  const logoColors = config.coverDesign?.colors;
  const isDark = false; // Always light mode for cleaner look
  const styles = {
    bg: '#ffffff',
    cardBg: '#ffffff',
    border: 'border-slate-200',
    accent: logoColors?.primary || config.theme.brandColor,
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

      <div className="flex gap-4 h-[22%] min-h-[120px]">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex-1">
            <MetricScorecard
              config={config}
              savedState={data[`metric_${i}`]}
              onSave={(val) => onUpdate(`metric_${i}`, val)}
              isExport={isExport}
            />
          </div>
        ))}
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        <div
          className={`flex-[2] rounded-xl border p-2 shadow-sm ${styles.border}`}
          style={{ backgroundColor: styles.cardBg }}
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
          className={`flex-1 rounded-xl border p-2 shadow-sm ${styles.border}`}
          style={{ backgroundColor: styles.cardBg }}
        >
          <SmartInsightBlock
            icon={Sparkles}
            label="Summary & Actions"
            className="bg-blue-50/20 border-blue-200/50"
            config={config}
            savedState={data.summary}
            onSave={(val) => onUpdate('summary', val)}
            contextData={data}
            contextType="kpi_summary"
            isExport={isExport}
          />
        </div>
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
