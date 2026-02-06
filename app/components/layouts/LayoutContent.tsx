import React, { useState, useMemo } from 'react';
import { LayoutProps, Post } from '@/app/types';
import {
  EditableSlideTitle,
  SlideFooter,
  ChannelBadge,
  EmptyStateBox,
  ContentSelectionModal,
} from '@/app/components/ui';
import { SmartInsightBlock } from '@/app/components/insights';
import { Sparkles, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { generateLayoutTheme, getDecorativeStyles } from '@/app/utils/themeStyles';

export const LayoutContent: React.FC<LayoutProps> = ({
  config,
  title = 'Content Analysis',
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
    contentMode,
  );
  const decorStyles = getDecorativeStyles(theme);
  const isDark = contentMode === 'dark';

  const postCount = data.postCount || 4;
  const filterType = data.filterType || 'top';
  const [showModal, setShowModal] = useState(false);

  const setPostCount = (val: number) => onUpdate('postCount', val);
  const setFilterType = (val: string) => onUpdate('filterType', val);

  const handleModalSelect = (selectedFilterType: string, selectedPostCount: number) => {
    setFilterType(selectedFilterType);
    setPostCount(selectedPostCount);
  };

  const posts = useMemo(() => {
    const images = ['/1.png', '/2.png', '/3.png', '/4.png', '/5.png'];
    const dummy: Post[] = Array.from({ length: 24 })
      .map((_, i) => ({
        id: i,
        image: images[i % images.length],
        reach: Math.floor(Math.random() * 50000) + 1000,
        engagement: Math.floor(Math.random() * 5000) + 100,
        get er() {
          return ((this.engagement / this.reach) * 100).toFixed(2);
        },
        link: '#',
      }))
      .sort((a, b) => b.engagement - a.engagement);

    let filtered: Post[] = [];
    if (filterType === 'top') {
      filtered = dummy.slice(0, postCount);
    } else if (filterType === 'low') {
      filtered = [...dummy].reverse().slice(0, postCount);
    } else if (filterType === 'mixed') {
      const half = Math.ceil(postCount / 2);
      filtered = [...dummy.slice(0, half), ...dummy.reverse().slice(0, postCount - half)];
    }
    return filtered;
  }, [postCount, filterType]);

  return (
    <div
      className="w-full h-full flex flex-col p-6 gap-4 pb-16 relative overflow-hidden"
      style={{ fontFamily: config.font.name, background: theme.pageBg }}
    >
      {/* Decorative Elements */}
      <div style={decorStyles.topRightCircle} />
      <div style={decorStyles.bottomLeftCircle} />
      <div style={decorStyles.accentLineTop} />

      <ContentSelectionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSelect={handleModalSelect}
        config={config}
      />

      {/* Header Section */}
      <div
        className="shrink-0 rounded-xl flex items-center justify-between px-5 py-3 relative overflow-hidden"
        style={{
          background: theme.headerBg,
          border: `1px solid ${theme.border}`,
        }}
      >
        {/* Header accent bar */}
        <div
          className="absolute top-0 left-0 w-1 h-full rounded-l-xl"
          style={{ background: theme.accentGradient }}
        />

        <div className="flex items-center gap-3">
          <EditableSlideTitle title={title} onChange={onTitleChange} isDark={isDark} />
        </div>

        <div className="flex gap-2 items-center">
          {data.channel && <ChannelBadge channel={data.channel} isDark={isDark} size="lg" />}
        </div>
      </div>

      {/* Content Grid */}
      <div
        className={`grid gap-4 flex-1 min-h-0 ${
          postCount === 4 ? 'grid-cols-4' : postCount === 6 ? 'grid-cols-3' : 'grid-cols-4'
        }`}
      >
        {data.postCount === undefined && data.filterType === undefined ? (
          <div className="col-span-full flex items-center justify-center">
            <EmptyStateBox
              icon={ImageIcon}
              title="Configure Visual Content"
              description="Select filter type and number of posts to display"
              actionLabel="Configure Content"
              onAction={() => setShowModal(true)}
              isDark={isDark}
            />
          </div>
        ) : (
          posts.map((post, i) => (
            <div
              key={i}
              className="rounded-xl overflow-hidden flex flex-col transition-all duration-300 hover:scale-[1.02] group"
              style={{
                backgroundColor: theme.cardBg,
                border: `1px solid ${theme.border}`,
                boxShadow: theme.cardShadow,
              }}
            >
              {/* Image Section */}
              <div className="relative aspect-square bg-slate-50/50 flex items-center justify-center overflow-hidden">
                {post.image ? (
                  <img
                    src={post.image}
                    alt={`Post ${post.id}`}
                    className="w-full h-full object-fill group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <ImageIcon
                    size={28}
                    className="text-slate-300 group-hover:scale-110 transition-transform"
                  />
                )}

                {/* Filter type badge */}
                {filterType === 'mixed' && (
                  <div
                    className="absolute top-2 left-2 text-[8px] font-bold px-2 py-1 rounded-full text-white shadow-md z-10"
                    style={{
                      background:
                        i < postCount / 2
                          ? `linear-gradient(135deg, #10b981 0%, #059669 100%)`
                          : `linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)`,
                    }}
                  >
                    {i < postCount / 2 ? 'TOP' : 'LOW'}
                  </div>
                )}

                {/* Hover overlay with brand color */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: `linear-gradient(to top, ${theme.colors.primary}20 0%, transparent 50%)`,
                  }}
                />
              </div>

              {/* Stats Section */}
              <div className="p-3 relative" style={{ borderTop: `1px solid ${theme.borderLight}` }}>
                {/* Card accent line */}
                <div
                  className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full opacity-50"
                  style={{ background: theme.accentLine }}
                />

                <div
                  className="flex items-center justify-between mb-2 pb-2"
                  style={{ borderBottom: `1px solid ${theme.borderLight}` }}
                >
                  <span className="text-[10px] font-bold" style={{ color: theme.bodyText }}>
                    Post #{post.id + 204}
                  </span>
                  <ExternalLink
                    size={10}
                    className="cursor-pointer transition-colors"
                    style={{ color: theme.colors.primary }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-y-1.5 text-[9px]">
                  <span className="font-medium" style={{ color: theme.mutedText }}>
                    Reach
                  </span>
                  <span className="font-mono text-right" style={{ color: theme.bodyText }}>
                    {post.reach.toLocaleString()}
                  </span>

                  <span className="font-medium" style={{ color: theme.mutedText }}>
                    Engagement
                  </span>
                  <span className="font-mono text-right" style={{ color: theme.bodyText }}>
                    {post.engagement.toLocaleString()}
                  </span>

                  <span className="font-medium" style={{ color: theme.mutedText }}>
                    Eng. Rate
                  </span>
                  <span
                    className="font-bold text-right"
                    style={{
                      color: parseFloat(post.er) > 2.5 ? '#10b981' : '#f59e0b',
                    }}
                  >
                    {post.er}%
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Insights Panel */}
      <div
        className="h-[18%] shrink-0 rounded-xl p-3 relative overflow-hidden"
        style={{
          backgroundColor: theme.cardBg,
          border: `1px solid ${theme.border}`,
          boxShadow: theme.cardShadow,
        }}
      >
        {/* Bottom accent line */}
        <div
          className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full"
          style={{ background: theme.accentLine }}
        />

        {/* Decorative element */}
        <div
          className="absolute -bottom-6 -right-6 w-20 h-20 rounded-full"
          style={{
            background: `radial-gradient(circle, ${theme.decorCircle1} 0%, transparent 70%)`,
          }}
        />

        <SmartInsightBlock
          icon={Sparkles}
          label="Visual Strategy Notes & Insights"
          className="border-opacity-50"
          config={config}
          savedState={data.insight}
          onSave={(val) => onUpdate('insight', val)}
          contextData={data}
          contextType="content_performance"
          isExport={isExport}
        />
      </div>

      <SlideFooter
        clientName={config.clientName}
        period={config.period}
        currentPage={currentPage}
        totalPages={totalPages}
        logo={config.coverDesign?.logoData}
        brandColor={theme.colors.primary}
      />
    </div>
  );
};
