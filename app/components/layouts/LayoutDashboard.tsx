import React from 'react';
import { LayoutProps } from '@/app/types';
import { EditableSlideTitle, SlideFooter } from '@/app/components/ui';
import { SmartChartBlock } from '@/app/components/charts';
import { SmartInsightBlock } from '@/app/components/insights';
import { SmartTableBlock } from '@/app/components/tables';
import { Sparkles } from 'lucide-react';

export const LayoutDashboard: React.FC<LayoutProps> = ({
  config,
  title = 'Dashboard',
  onTitleChange = () => {},
  data = {},
  onUpdate = () => {},
  currentPage = 1,
  totalPages = 1,
  isExport = false,
}) => {
  console.log('📊 LayoutDashboard received config:', {
    clientName: config.clientName,
    period: config.period,
  });
  const isDark = config.theme.type === 'dark';
  const styles = {
    bg: config.theme.colors[0],
    cardBg: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
    border: isDark ? 'border-white/20' : 'border-slate-200',
  };

  return (
    <div
      className="w-full h-full flex flex-col p-6 gap-3 pb-16 relative"
      style={{ fontFamily: config.font.name, backgroundColor: styles.bg }}
    >
      <div
        className={`h-[12%] shrink-0 border rounded-xl p-4 flex items-center justify-between ${styles.border}`}
        style={{ backgroundColor: styles.cardBg }}
      >
        <div className="w-full">
          <EditableSlideTitle title={title} onChange={onTitleChange} isDark={isDark} />
        </div>
        <div className="flex gap-4 opacity-50">
          <div className="h-8 w-8 bg-slate-200 rounded animate-pulse"></div>
          <div className="h-8 w-20 bg-slate-100 rounded animate-pulse"></div>
        </div>
      </div>

      <div className="flex gap-3 h-[50%] min-h-0 w-full">
        <div
          className={`flex-[1.85] rounded-xl border p-2 shadow-sm ${styles.border}`}
          style={{ backgroundColor: styles.cardBg }}
        >
          <SmartChartBlock
            label="Main Chart Area"
            config={config}
            savedState={data.main_chart}
            onSave={(val) => onUpdate('main_chart', val)}
          />
        </div>
        <div
          className={`flex-1 rounded-xl border p-2 shadow-sm ${styles.border}`}
          style={{ backgroundColor: styles.cardBg }}
        >
          <SmartInsightBlock
            icon={Sparkles}
            label="AI Key Insights"
            className="bg-blue-50/20 border-blue-200/50"
            config={config}
            savedState={data.insights}
            onSave={(val) => onUpdate('insights', val)}
            contextData={data}
            contextType="dashboard_summary"
          />
        </div>
      </div>

      <div className={`h-[38%] rounded-xl shadow-sm p-0 overflow-hidden`}>
        <SmartTableBlock
          config={config}
          savedState={data.table_block}
          onSave={(val) => onUpdate('table_block', val)}
          className="w-full h-full"
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
