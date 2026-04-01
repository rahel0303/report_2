import React from 'react';
import { LayoutProps } from '@/app/types';
import { EditableSlideTitle, SlideFooter, ChannelBadge } from '@/app/components/ui';
import { SmartChartBlock } from '@/app/components/charts';
import { SmartInsightBlock } from '@/app/components/insights';
import { Sparkles } from 'lucide-react';
import { generateLayoutTheme, getDecorativeStyles } from '@/app/utils/themeStyles';

export const LayoutComparison: React.FC<LayoutProps> = ({
  config,
  title = 'Comparison',
  onTitleChange = () => {},
  data = {},
  onUpdate = () => {},
  currentPage = 1,
  totalPages = 1,
  isExport = false,
}) => {
  // Generate theme from logo colors with content mode (same as Dashboard)
  const contentMode = config.coverDesign?.contentMode || 'light';
  const theme = generateLayoutTheme(
    config.coverDesign?.colors,
    config.theme.brandColor,
    contentMode
  );
  const decorStyles = getDecorativeStyles(theme);
  const isDark = contentMode === 'dark';

  return (
    <div
      className="w-full h-full flex flex-col p-6 gap-4 pb-16 relative overflow-hidden"
      style={{ fontFamily: config.font.name, background: theme.pageBg }}
    >
      {/* Decorative Elements */}
      <div style={decorStyles.topRightCircle} />
      <div style={decorStyles.bottomLeftCircle} />
      <div style={decorStyles.accentLineTop} />

      {/* Header Section */}
      <div
        data-comparison-header
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

        {/* Small decorative circles */}
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

      {/* Two-column Chart Area */}
      <div className="flex-1 flex gap-4 min-h-0">
        <div
          data-comparison-chart-a
          className="flex-1 flex flex-col gap-2 rounded-xl p-3 relative overflow-hidden"
          style={{
            backgroundColor: theme.cardBg,
            border: `1px solid ${theme.border}`,
            boxShadow: theme.cardShadow,
          }}
        >
          <SmartChartBlock
            label="Period A / Segment A"
            config={config}
            savedState={data.chart_a}
            onSave={(val) => onUpdate('chart_a', val)}
            isExport={isExport}
            allowWordCloud
          />
        </div>
        <div
          data-comparison-chart-b
          className="flex-1 flex flex-col gap-2 rounded-xl p-3 relative overflow-hidden"
          style={{
            backgroundColor: theme.cardBg,
            border: `1px solid ${theme.border}`,
            boxShadow: theme.cardShadow,
          }}
        >
          <SmartChartBlock
            label="Period B / Segment B"
            config={config}
            savedState={data.chart_b}
            onSave={(val) => onUpdate('chart_b', val)}
            isExport={isExport}
            allowWordCloud
          />
        </div>
      </div>

      {/* Comparative Analysis */}
      <div
        data-comparison-insight
        className="h-[20%] shrink-0 rounded-xl p-3 relative overflow-hidden"
        style={{
          backgroundColor: theme.cardBg,
          border: `1px solid ${theme.border}`,
          boxShadow: theme.cardShadow,
        }}
      >
        {/* Decorative element */}
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
          contextType="comparison_analysis"
          isExport={isExport}
        />
      </div>

      <div data-comparison-footer>
        <SlideFooter
          clientName={config.clientName}
          period={config.period}
          currentPage={currentPage}
          totalPages={totalPages}
          logo={config.coverDesign?.logoData}
          brandColor={theme.colors.primary}
          preparedBy={config.preparedBy}
        />
      </div>
    </div>
  );
};
