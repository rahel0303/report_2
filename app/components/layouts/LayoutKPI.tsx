import React from 'react';
import { LayoutProps } from '@/app/types';
import { EditableSlideTitle } from '@/app/components/ui';
import { MetricScorecard, SmartChartBlock } from '@/app/components/charts';
import { SmartInsightBlock } from '@/app/components/insights';
import { Sparkles } from 'lucide-react';

export const LayoutKPI: React.FC<LayoutProps> = ({
  config,
  title = 'KPI Overview',
  onTitleChange = () => {},
  data = {},
  onUpdate = () => {},
}) => {
  const isDark = config.theme.type === 'dark';
  const styles = {
    bg: config.theme.colors[0],
    cardBg: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
    border: isDark ? 'border-white/20' : 'border-slate-200',
  };

  return (
    <div
      className="w-full h-full flex flex-col p-6 gap-4"
      style={{ fontFamily: config.font.name, backgroundColor: styles.bg }}
    >
      <div className={`h-[10%] shrink-0 border-b flex items-end pb-4 ${styles.border}`}>
        <EditableSlideTitle title={title} onChange={onTitleChange} isDark={isDark} />
      </div>

      <div className="flex gap-4 h-[22%] min-h-[120px]">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex-1">
            <MetricScorecard
              config={config}
              savedState={data[`metric_${i}`]}
              onSave={(val) => onUpdate(`metric_${i}`, val)}
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
          />
        </div>
      </div>
    </div>
  );
};
