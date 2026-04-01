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
import { Sparkles, ExternalLink, Image as ImageIcon, Edit3 } from 'lucide-react';
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
        data-content-header
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
        {/* Small decorative circle */}
        <div
          className="absolute -top-4 -right-4 w-20 h-20 rounded-full"
          style={{ background: theme.decorCircle1 }}
        />
        <div className="flex-1 pl-3">
          <EditableSlideTitle title={title} onChange={onTitleChange} isDark={isDark} />
        </div>
        <div className="flex gap-2 items-center">
          {data.channel && <ChannelBadge channel={data.channel} isDark={isDark} size="lg" />}
        </div>
      </div>

      {/* Edit Button - top right corner */}
      {data.postCount !== undefined && data.filterType !== undefined && !isExport && (
        <button
          onClick={() => setShowModal(true)}
          className={`absolute top-2 right-2 z-50 p-1.5 rounded transition-colors ${
            isDark
              ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-700/50'
              : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100/50'
          }`}
          title="Edit content settings"
        >
          <Edit3 size={14} />
        </button>
      )}

      {/* Content Grid */}
      <div
        data-content-grid
        className={`grid flex-1 min-h-0 auto-rows-fr ${
          postCount === 4
            ? 'grid-cols-4 gap-3'
            : postCount === 6
              ? 'grid-cols-6 gap-2'
              : 'grid-cols-8 gap-1.5'
        }`}
      >
        {data.postCount === undefined && data.filterType === undefined ? (
          <div
            className={`col-span-full w-full h-full border-2 border-dashed rounded-xl flex items-center justify-center transition-all cursor-pointer group ${
              isDark
                ? 'border-slate-600 bg-slate-800/30 hover:bg-slate-700/40 hover:border-slate-500'
                : 'border-slate-300 bg-slate-50/50 hover:bg-blue-50/50 hover:border-blue-300'
            }`}
            onClick={() => setShowModal(true)}
          >
            <EmptyStateBox
              icon={ImageIcon}
              title="Configure Visual Content"
              description="Select filter type and number of posts to display"
              isDark={isDark}
            />
          </div>
        ) : (
          posts.map((post, i) => (
            <div
              key={i}
              data-content-post={i}
              className={`${postCount >= 6 ? 'rounded-lg' : 'rounded-xl'} overflow-hidden flex flex-col transition-all duration-300 hover:scale-[1.02] group h-full`}
              style={{
                backgroundColor: theme.cardBg,
                border: `1px solid ${theme.border}`,
                boxShadow: theme.cardShadow,
              }}
            >
              {/* Image Section */}
              <div className="relative bg-slate-50/50 flex items-center justify-center overflow-hidden flex-1 min-h-0">
                {post.image ? (
                  <img
                    src={post.image}
                    alt={`Post ${post.id}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                    className={`absolute whitespace-nowrap ${postCount >= 6 ? 'top-1 left-1 text-[6px] px-1.5 py-0.5' : 'top-2 left-2 text-[8px] px-2 py-1'} font-bold rounded-full text-white shadow-md z-10`}
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
              <div
                className={`${postCount === 4 ? 'p-3' : postCount === 6 ? 'p-2' : 'p-1.5'} relative shrink-0`}
                style={{ borderTop: `1px solid ${theme.borderLight}` }}
              >
                <div
                  className={`flex items-center justify-between ${postCount === 4 ? 'mb-2 pb-2' : 'mb-1 pb-1'}`}
                  style={{ borderBottom: `1px solid ${theme.borderLight}` }}
                >
                  <span
                    data-post-id
                    className={`${postCount === 4 ? 'text-xs' : postCount === 6 ? 'text-[10px]' : 'text-[8px]'} font-bold truncate`}
                    style={{ color: theme.bodyText }}
                  >
                    #{post.id + 204}
                  </span>
                  <ExternalLink
                    size={postCount === 4 ? 12 : postCount === 6 ? 10 : 8}
                    className="cursor-pointer transition-colors shrink-0"
                    style={{ color: theme.colors.primary }}
                  />
                </div>

                <div
                  className={`grid grid-cols-2 ${postCount === 4 ? 'gap-y-1.5 text-[11px]' : postCount === 6 ? 'gap-y-1 text-[9px]' : 'gap-y-0.5 text-[7px]'}`}
                >
                  <span className="font-medium truncate" style={{ color: theme.mutedText }}>
                    {postCount === 4 ? 'Reach' : 'Rch'}
                  </span>
                  <span
                    data-post-reach
                    className="font-mono text-right"
                    style={{ color: theme.bodyText }}
                  >
                    {postCount === 4
                      ? post.reach.toLocaleString()
                      : (post.reach / 1000).toFixed(0) + 'K'}
                  </span>

                  <span className="font-medium truncate" style={{ color: theme.mutedText }}>
                    {postCount === 4 ? 'Engagement' : 'Eng'}
                  </span>
                  <span
                    data-post-engagement
                    className="font-mono text-right"
                    style={{ color: theme.bodyText }}
                  >
                    {postCount === 4
                      ? post.engagement.toLocaleString()
                      : (post.engagement / 1000).toFixed(1) + 'K'}
                  </span>

                  <span className="font-medium truncate" style={{ color: theme.mutedText }}>
                    {postCount === 4 ? 'Eng. Rate' : 'ER'}
                  </span>
                  <span
                    data-post-er
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
        data-content-insight
        className="h-[18%] shrink-0 rounded-xl p-3 relative overflow-hidden"
        style={{
          backgroundColor: theme.cardBg,
          border: `1px solid ${theme.border}`,
          boxShadow: theme.cardShadow,
        }}
      >
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

      <div data-content-footer>
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
