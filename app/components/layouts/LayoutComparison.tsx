import React from 'react';
import { LayoutProps } from '@/app/types';
import { EditableSlideTitle } from '@/app/components/ui';
import { SmartChartBlock } from '@/app/components/charts';
import { SmartInsightBlock } from '@/app/components/insights';
import { Sparkles } from 'lucide-react';

export const LayoutComparison: React.FC<LayoutProps> = ({
  config,
  title = 'Comparison',
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

      <div className="flex-1 flex gap-6 min-h-0">
        <div
          className={`flex-1 flex flex-col gap-2 rounded-xl border p-2 shadow-sm ${styles.border}`}
          style={{ backgroundColor: styles.cardBg }}
        >
          <SmartChartBlock
            label="Period A / Segment A"
            config={config}
            savedState={data.chart_a}
            onSave={(val) => onUpdate('chart_a', val)}
          />
        </div>
        <div
          className={`flex-1 flex flex-col gap-2 rounded-xl border p-2 shadow-sm ${styles.border}`}
          style={{ backgroundColor: styles.cardBg }}
        >
          <SmartChartBlock
            label="Period B / Segment B"
            config={config}
            savedState={data.chart_b}
            onSave={(val) => onUpdate('chart_b', val)}
          />
        </div>
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
        />
      </div>
    </div>
  );
};
