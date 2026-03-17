import React from 'react';
import { Layout } from 'lucide-react';
import { ReportConfig, Slide } from '@/app/types';
import { CustomCover } from '@/app/components/covers/CustomCover';
import { ThankYouSlide } from '@/app/components/covers/ThankYouSlide';
import {
  ReportCoverVisual,
  InstagramDashboardSlide,
  SectionHeadingSlide,
} from '@/app/components/slides';
import {
  AllChannelOverviewSlide,
  AllChannelSentimentSlide,
  ChannelSentimentSlide,
  IgGrowthSlide,
  IgBestLeastSlide,
  IgContentPillarSlide,
  IgTaggedPostSlide,
  TtGrowthSlide,
  TtBestLeastSlide,
  TtContentPillarSlide,
  IgCpEngSlide,
  IgCpReachSlide,
  TwGrowthSlide,
  TwBestLeastSlide,
  TwContentSlide,
  FbGrowthSlide,
  CompetitorOverviewSlide,
  CompetitorDetailSlide,
  CompetitorIgFocusSlide,
} from '@/app/innercircle/slides';
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
          title={slide.title}
          onTitleChange={onUpdate ? (t: string) => onUpdate('_title', t) : undefined}
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
          title={slide.title}
          onTitleChange={onUpdate ? (t: string) => onUpdate('_title', t) : undefined}
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
          title={slide.title}
          onTitleChange={onUpdate ? (t: string) => onUpdate('_title', t) : undefined}
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
          title={slide.title}
          onTitleChange={onUpdate ? (t: string) => onUpdate('_title', t) : undefined}
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
          title={slide.title}
          onTitleChange={onUpdate ? (t: string) => onUpdate('_title', t) : undefined}
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
          title={slide.title}
          onTitleChange={onUpdate ? (t: string) => onUpdate('_title', t) : undefined}
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

    case 'ic_all_overview':
      return (
        <AllChannelOverviewSlide
          config={config}
          isThumbnail={mode === 'thumbnail'}
          currentPage={currentPage}
          totalPages={totalPages}
          key={`ic-all-overview-${config.clientName}-${config.period}`}
        />
      );

    case 'ic_all_sentiment':
      return (
        <AllChannelSentimentSlide
          config={config}
          isThumbnail={mode === 'thumbnail'}
          currentPage={currentPage}
          totalPages={totalPages}
          key={`ic-all-sentiment-${config.clientName}-${config.period}`}
        />
      );

    case 'ic_ig_sentiment':
      return (
        <ChannelSentimentSlide
          config={config}
          platform="instagram"
          isThumbnail={mode === 'thumbnail'}
          currentPage={currentPage}
          totalPages={totalPages}
          key={`ic-ig-sentiment-${config.clientName}-${config.period}`}
        />
      );

    case 'ic_tt_sentiment':
      return (
        <ChannelSentimentSlide
          config={config}
          platform="tiktok"
          isThumbnail={mode === 'thumbnail'}
          currentPage={currentPage}
          totalPages={totalPages}
          key={`ic-tt-sentiment-${config.clientName}-${config.period}`}
        />
      );

    case 'ic_fb_sentiment':
      return (
        <ChannelSentimentSlide
          config={config}
          platform="facebook"
          isThumbnail={mode === 'thumbnail'}
          currentPage={currentPage}
          totalPages={totalPages}
          key={`ic-fb-sentiment-${config.clientName}-${config.period}`}
        />
      );

    case 'ic_ig_growth':
      return (
        <IgGrowthSlide
          config={config}
          isThumbnail={mode === 'thumbnail'}
          currentPage={currentPage}
          totalPages={totalPages}
          savedInsight={slide.content?.insight}
          onInsightChange={(val) => onUpdate?.('insight', val)}
          key={`ic-ig-growth-${config.clientName}-${config.period}`}
        />
      );

    case 'ic_ig_best_least':
      return (
        <IgBestLeastSlide
          config={config}
          isThumbnail={mode === 'thumbnail'}
          currentPage={currentPage}
          totalPages={totalPages}
          key={`ic-ig-best-least-${config.clientName}-${config.period}`}
        />
      );

    case 'ic_ig_content_pillar':
      return (
        <IgContentPillarSlide
          config={config}
          isThumbnail={mode === 'thumbnail'}
          currentPage={currentPage}
          totalPages={totalPages}
          pillarOffset={slide.content?.pillarOffset ?? 0}
          onUpdate={onUpdate}
          key={`ic-ig-content-pillar-${config.clientName}-${config.period}-${slide.content?.pillarOffset ?? 0}`}
        />
      );

    case 'ic_ig_tagged_post':
      return (
        <IgTaggedPostSlide
          config={config}
          isThumbnail={mode === 'thumbnail'}
          currentPage={currentPage}
          totalPages={totalPages}
          key={`ic-ig-tagged-post-${config.clientName}-${config.period}`}
        />
      );

    case 'ic_tt_growth':
      return (
        <TtGrowthSlide
          config={config}
          isThumbnail={mode === 'thumbnail'}
          currentPage={currentPage}
          totalPages={totalPages}
          savedInsight={slide.content?.insight}
          onInsightChange={(val) => onUpdate?.('insight', val)}
          key={`ic-tt-growth-${config.clientName}-${config.period}`}
        />
      );

    case 'ic_tt_organic_best_least':
      return (
        <TtBestLeastSlide
          config={config}
          mode="organic"
          isThumbnail={mode === 'thumbnail'}
          currentPage={currentPage}
          totalPages={totalPages}
          key={`ic-tt-organic-best-least-${config.clientName}-${config.period}`}
        />
      );

    case 'ic_tt_paid_best_least':
      return (
        <TtBestLeastSlide
          config={config}
          mode="paid"
          isThumbnail={mode === 'thumbnail'}
          currentPage={currentPage}
          totalPages={totalPages}
          key={`ic-tt-paid-best-least-${config.clientName}-${config.period}`}
        />
      );

    case 'ic_tt_content_pillar':
      return (
        <TtContentPillarSlide
          config={config}
          isThumbnail={mode === 'thumbnail'}
          currentPage={currentPage}
          totalPages={totalPages}
          key={`ic-tt-content-pillar-${config.clientName}-${config.period}`}
        />
      );

    case 'ic_ig_cp_eng_aon':
      return (
        <IgCpEngSlide
          config={config}
          aon={true}
          isThumbnail={mode === 'thumbnail'}
          currentPage={currentPage}
          totalPages={totalPages}
          key={`ic-ig-cp-eng-aon-${config.clientName}-${config.period}`}
        />
      );

    case 'ic_ig_cp_eng_nonaon':
      return (
        <IgCpEngSlide
          config={config}
          aon={false}
          isThumbnail={mode === 'thumbnail'}
          currentPage={currentPage}
          totalPages={totalPages}
          key={`ic-ig-cp-eng-nonaon-${config.clientName}-${config.period}`}
        />
      );

    case 'ic_ig_cp_reach_aon':
      return (
        <IgCpReachSlide
          config={config}
          aon={true}
          isThumbnail={mode === 'thumbnail'}
          currentPage={currentPage}
          totalPages={totalPages}
          key={`ic-ig-cp-reach-aon-${config.clientName}-${config.period}`}
        />
      );

    case 'ic_ig_cp_reach_nonaon':
      return (
        <IgCpReachSlide
          config={config}
          aon={false}
          isThumbnail={mode === 'thumbnail'}
          currentPage={currentPage}
          totalPages={totalPages}
          key={`ic-ig-cp-reach-nonaon-${config.clientName}-${config.period}`}
        />
      );

    case 'ic_tw_growth':
      return (
        <TwGrowthSlide
          config={config}
          isThumbnail={mode === 'thumbnail'}
          currentPage={currentPage}
          totalPages={totalPages}
          savedInsight={slide.content?.insight}
          onInsightChange={(val) => onUpdate?.('insight', val)}
          key={`ic-tw-growth-${config.clientName}-${config.period}`}
        />
      );

    case 'ic_tw_best_least':
      return (
        <TwBestLeastSlide
          config={config}
          isThumbnail={mode === 'thumbnail'}
          currentPage={currentPage}
          totalPages={totalPages}
          key={`ic-tw-best-least-${config.clientName}-${config.period}`}
        />
      );

    case 'ic_tw_content':
      return (
        <TwContentSlide
          config={config}
          isThumbnail={mode === 'thumbnail'}
          currentPage={currentPage}
          totalPages={totalPages}
          key={`ic-tw-content-${config.clientName}-${config.period}`}
        />
      );

    case 'ic_fb_growth':
      return (
        <FbGrowthSlide
          config={config}
          isThumbnail={mode === 'thumbnail'}
          currentPage={currentPage}
          totalPages={totalPages}
          savedInsight={slide.content?.insight}
          onInsightChange={(val) => onUpdate?.('insight', val)}
          key={`ic-fb-growth-${config.clientName}-${config.period}`}
        />
      );

    case 'ic_comp_overview':
      return (
        <CompetitorOverviewSlide
          config={config}
          isThumbnail={mode === 'thumbnail'}
          currentPage={currentPage}
          totalPages={totalPages}
          key={`ic-comp-overview-${config.clientName}-${config.period}`}
        />
      );

    case 'ic_comp_detail':
      return (
        <CompetitorDetailSlide
          config={config}
          competitor={slide.content?.competitor ?? null}
          isThumbnail={mode === 'thumbnail'}
          currentPage={currentPage}
          totalPages={totalPages}
          onUpdate={onUpdate}
          key={`ic-comp-detail-${slide.id}-${config.clientName}-${config.period}`}
        />
      );

    case 'ic_comp_ig_focus':
      return (
        <CompetitorIgFocusSlide
          config={config}
          competitor={slide.content?.competitor ?? null}
          isThumbnail={mode === 'thumbnail'}
          currentPage={currentPage}
          totalPages={totalPages}
          key={`ic-comp-ig-focus-${slide.id}-${config.clientName}-${config.period}`}
        />
      );

    case 'thank_you':
      return config.coverDesign ? (
        <ThankYouSlide config={config} key={`thankyou-${config.clientName}-${config.period}`} />
      ) : (
        <div className="w-full h-full bg-slate-50 flex items-center justify-center flex-col gap-2">
          <span className="text-4xl font-black text-slate-300">Thank You</span>
        </div>
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
