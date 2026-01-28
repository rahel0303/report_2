import React, { useState, useMemo } from 'react';
import { LayoutProps, Post } from '@/app/types';
import { EditableSlideTitle, SlideFooter } from '@/app/components/ui';
import { SmartInsightBlock } from '@/app/components/insights';
import { Sparkles, ExternalLink, Image as ImageIcon } from 'lucide-react';

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
  const isDark = config.theme.type === 'dark';
  const styles = {
    bg: config.theme.colors[0],
    cardBg: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
    border: isDark ? 'border-white/20' : 'border-slate-200',
    textMain: isDark ? 'text-white' : 'text-slate-900',
    textMuted: isDark ? 'text-slate-300' : 'text-slate-500',
    divider: isDark ? 'border-white/10' : 'border-slate-100',
  };

  const postCount = data.postCount || 4;
  const filterType = data.filterType || 'top';

  const setPostCount = (val: number) => onUpdate('postCount', val);
  const setFilterType = (val: string) => onUpdate('filterType', val);

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
      className="w-full h-full flex flex-col p-6 gap-4 pb-16 relative"
      style={{ fontFamily: config.font.name, backgroundColor: styles.bg }}
    >
      <div className={`shrink-0 border-b flex items-center justify-between pb-2 ${styles.border}`}>
        <EditableSlideTitle title={title} onChange={onTitleChange} isDark={isDark} />

        <div className="flex gap-2">
          <div className="flex bg-slate-100 rounded-md p-0.5 border border-slate-200">
            {[4, 6, 8].map((count) => (
              <button
                key={count}
                onClick={() => setPostCount(count)}
                className={`px-3 py-1 text-xs font-bold rounded transition-all ${
                  postCount === count
                    ? 'bg-white shadow-sm text-blue-600'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {count} Posts
              </button>
            ))}
          </div>
          <div className="flex bg-slate-100 rounded-md p-0.5 border border-slate-200">
            {['top', 'mixed', 'low'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1 text-xs font-bold rounded capitalize transition-all ${
                  filterType === type
                    ? 'bg-white shadow-sm text-blue-600'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {type === 'mixed' ? 'Top & Low' : type}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        className={`grid gap-4 flex-1 min-h-0 ${
          postCount === 4 ? 'grid-cols-4' : postCount === 6 ? 'grid-cols-3' : 'grid-cols-4'
        }`}
      >
        {posts.map((post, i) => (
          <div
            key={i}
            className={`rounded-xl border overflow-hidden flex flex-col shadow-sm ${styles.border}`}
            style={{ backgroundColor: styles.cardBg }}
          >
            <div className="relative aspect-square bg-slate-50/50 flex items-center justify-center overflow-hidden group">
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

              {filterType === 'mixed' && (
                <div
                  className={`absolute top-2 left-2 text-[8px] font-bold px-1.5 py-0.5 rounded text-white shadow-sm z-10 ${
                    i < postCount / 2 ? 'bg-emerald-500/90' : 'bg-rose-500/90'
                  }`}
                >
                  {i < postCount / 2 ? 'TOP' : 'LOW'}
                </div>
              )}
            </div>

            <div className={`p-3 border-t ${styles.divider}`}>
              <div
                className={`flex items-center justify-between mb-2 pb-2 border-b ${styles.divider}`}
              >
                <span className={`text-[10px] font-bold ${styles.textMain}`}>
                  Post #{post.id + 204}
                </span>
                <ExternalLink
                  size={10}
                  className="text-blue-500 cursor-pointer hover:text-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-y-1.5 text-[9px]">
                <span className={`${styles.textMuted} font-medium`}>Reach</span>
                <span className={`font-mono text-right ${styles.textMain}`}>
                  {post.reach.toLocaleString()}
                </span>

                <span className={`${styles.textMuted} font-medium`}>Engagement</span>
                <span className={`font-mono text-right ${styles.textMain}`}>
                  {post.engagement.toLocaleString()}
                </span>

                <span className={`${styles.textMuted} font-medium`}>Eng. Rate</span>
                <span
                  className={`font-bold text-right ${
                    parseFloat(post.er) > 2.5 ? 'text-emerald-500' : 'text-amber-500'
                  }`}
                >
                  {post.er}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        className={`h-[18%] shrink-0 rounded-xl border p-2 shadow-sm ${styles.border}`}
        style={{ backgroundColor: styles.cardBg }}
      >
        <SmartInsightBlock
          icon={Sparkles}
          label="Visual Strategy Notes & Insights"
          className="bg-blue-50/20 border-blue-200/50"
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
        brandColor={config.theme.brandColor}
      />
    </div>
  );
};
