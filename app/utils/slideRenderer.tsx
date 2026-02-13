import React from 'react';
import { Layout } from 'lucide-react';
import { ReportConfig, Slide } from '@/app/types';
import { CustomCover } from '@/app/components/covers/CustomCover';
import { ReportCoverVisual, InstagramDashboardSlide, SectionHeadingSlide } from '@/app/components/slides';
import {
  LayoutDashboard,
  LayoutComparison,
  LayoutKPI,
  LayoutContent,
  LayoutOverview,
  LayoutCustom,
} from '@/app/components/layouts';

export const renderSlide = (
  slide: Slide,
  config: ReportConfig,
  mode: 'full' | 'thumbnail' = 'full',
  currentPage?: number,
  totalPages?: number,
  onUpdate?: (key: string, value: any) => void,
  isExport?: boolean,
) => {
  switch (slide.type) {
    case 'cover':
      return config.coverDesign ? (
        <CustomCover config={config} key={`cover-${config.clientName}-${config.period}`} />
      ) : (
        <ReportCoverVisual
          config={config}
          mode={mode}
          key={`cover-${config.clientName}-${config.period}`}
        />
      );

    case 'dashboard':
      return (
        <InstagramDashboardSlide
          config={config}
          isThumbnail={mode === 'thumbnail'}
          currentPage={currentPage}
          totalPages={totalPages}
          isExport={isExport}
          key={`dashboard-${config.clientName}-${config.period}`}
        />
      );

    case 'layout_dashboard':
      return (
        <LayoutDashboard
          config={config}
          data={slide.content}
          onUpdate={onUpdate}
          currentPage={currentPage}
          totalPages={totalPages}
          isExport={isExport}
          key={`layout-dash-${config.clientName}-${config.period}`}
        />
      );

    case 'layout_comparison':
      return (
        <LayoutComparison
          config={config}
          data={slide.content}
          onUpdate={onUpdate}
          currentPage={currentPage}
          totalPages={totalPages}
          isExport={isExport}
          key={`layout-comp-${config.clientName}-${config.period}`}
        />
      );

    case 'layout_kpi':
      return (
        <LayoutKPI
          config={config}
          data={slide.content}
          onUpdate={onUpdate}
          currentPage={currentPage}
          totalPages={totalPages}
          isExport={isExport}
          key={`layout-kpi-${config.clientName}-${config.period}`}
        />
      );

    case 'layout_content':
      return (
        <LayoutContent
          config={config}
          data={slide.content}
          onUpdate={onUpdate}
          currentPage={currentPage}
          totalPages={totalPages}
          isExport={isExport}
          key={`layout-content-${config.clientName}-${config.period}`}
        />
      );

    case 'layout_overview':
      return (
        <LayoutOverview
          config={config}
          data={slide.content}
          onUpdate={onUpdate}
          currentPage={currentPage}
          totalPages={totalPages}
          isExport={isExport}
          key={`layout-overview-${config.clientName}-${config.period}`}
        />
      );

    case 'layout_custom':
      return (
        <LayoutCustom
          config={config}
          data={slide.content}
          onUpdate={onUpdate}
          currentPage={currentPage}
          totalPages={totalPages}
          isExport={isExport}
          key={`layout-custom-${config.clientName}-${config.period}`}
        />
      );

    case 'section_heading':
      return (
        <SectionHeadingSlide
          config={config}
          title={slide.content?.sectionTitle || slide.title || 'Section Title'}
          onTitleChange={
            onUpdate ? (newTitle: string) => onUpdate('sectionTitle', newTitle) : undefined
          }
          isExport={isExport}
          key={`section-heading-${slide.id}-${config.clientName}`}
        />
      );

    case 'placeholder':
    default:
      return (
        <div className="w-full h-full bg-slate-50 flex items-center justify-center flex-col gap-2 p-4">
          <Layout size={24} className="text-slate-300" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {slide.type}
          </span>
        </div>
      );
  }
};
