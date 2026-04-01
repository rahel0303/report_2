import React from 'react';
import { LayoutProps } from '@/app/types';
import { EditableSlideTitle, SlideFooter, ChannelBadge } from '@/app/components/ui';
import { SmartChartBlock } from '@/app/components/charts';
import { SmartInsightBlock } from '@/app/components/insights';
import { SmartTableBlock } from '@/app/components/tables';
import { Sparkles } from 'lucide-react';
import { generateLayoutTheme, getDecorativeStyles } from '@/app/utils/themeStyles';

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
  // Generate theme from logo colors with content mode
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
        data-layout-header
        className="h-[12%] shrink-0 rounded-xl p-4 flex items-center justify-between relative overflow-hidden"
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
          <div className="ml-4" data-channel-badge>
            <ChannelBadge channel={data.channel} isDark={isDark} size="lg" />
          </div>
        )}
      </div>

      {/* Main Content Row */}
      <div className="flex gap-4 h-[50%] min-h-0 w-full">
        {/* Main Chart Area */}
        <div
          data-layout-chart
          className="flex-[1.85] rounded-xl p-3 relative overflow-hidden transition-shadow duration-300"
          style={{
            backgroundColor: theme.cardBg,
            border: `1px solid ${theme.border}`,
            boxShadow: theme.cardShadow,
          }}
        >
          <SmartChartBlock
            label="Main Chart Area"
            config={config}
            savedState={data.main_chart}
            onSave={(val) => onUpdate('main_chart', val)}
            isExport={isExport}
          />
        </div>

        {/* Insights Panel */}
        <div
          data-layout-insight
          className="flex-1 rounded-xl p-3 relative overflow-hidden"
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
            label="AI Key Insights"
            className="border-opacity-50"
            config={config}
            savedState={data.insights}
            onSave={(val) => onUpdate('insights', val)}
            contextData={data}
            contextType="dashboard_summary"
            isExport={isExport}
          />
        </div>
      </div>

      {/* Table Section */}
      <div
        data-layout-table
        className="h-[38%] rounded-xl overflow-hidden relative"
        style={{
          backgroundColor: theme.cardBg,
          border: `1px solid ${theme.border}`,
          boxShadow: theme.cardShadow,
        }}
      >
        <SmartTableBlock
          config={config}
          savedState={data.table_block}
          onSave={(val) => onUpdate('table_block', val)}
          className="w-full h-full"
          isExport={isExport}
        />
      </div>

      <div data-layout-footer>
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
