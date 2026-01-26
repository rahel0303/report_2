import React, { useMemo } from 'react';
import { Award, TrendingDown, Image as ImageIcon } from 'lucide-react';
import { ReportConfig } from '@/app/types';
import { formatNumber, formatCompact } from '@/app/utils/helpers';

interface BestLeastPostsSlideProps {
  config: ReportConfig;
  isThumbnail?: boolean;
}

interface PostCard {
  id: number;
  follows: number;
  reach: number;
  engagement: number;
  er: number;
  image: string;
}

export const BestLeastPostsSlide: React.FC<BestLeastPostsSlideProps> = ({
  config,
  isThumbnail = false,
}) => {
  const isDark = config.theme.type === 'dark';

  const styles = {
    bg: config.theme.colors[0],
    textMain: isDark ? 'text-white' : 'text-slate-900',
    textMuted: isDark ? 'text-slate-300' : 'text-slate-500',
    cardBg: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
    border: isDark ? 'border-white/20' : 'border-slate-200',
    imageBg: isDark ? 'bg-slate-700' : 'bg-slate-200',
  };

  const colorPrimary = config.theme.brandColor;

  // Generate dummy data
  const bestPosts: PostCard[] = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        follows: 1200 + Math.floor(Math.random() * 500),
        reach: 45000 + Math.floor(Math.random() * 15000),
        engagement: 3500 + Math.floor(Math.random() * 1000),
        er: 7.5 + Math.random() * 2,
        image: '',
      })).sort((a, b) => b.engagement - a.engagement),
    [],
  );

  const leastPosts: PostCard[] = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => ({
        id: i + 6,
        follows: 200 + Math.floor(Math.random() * 300),
        reach: 8000 + Math.floor(Math.random() * 5000),
        engagement: 450 + Math.floor(Math.random() * 300),
        er: 2.1 + Math.random() * 1.5,
        image: '',
      })).sort((a, b) => a.engagement - b.engagement),
    [],
  );

  const PostCard = ({ post, rank }: { post: PostCard; rank: number }) => (
    <div
      className={`rounded-lg border overflow-hidden ${styles.border}`}
      style={{ backgroundColor: styles.cardBg }}
    >
      {/* Image Placeholder */}
      <div className={`aspect-square ${styles.imageBg} flex items-center justify-center relative`}>
        <ImageIcon size={32} className="text-slate-400 opacity-50" />
        <div className="absolute top-2 left-2 bg-black/60 text-white px-2 py-0.5 rounded-full text-[8px] font-bold">
          #{rank}
        </div>
      </div>

      {/* Metrics */}
      <div className="p-2 space-y-1">
        <div className="flex justify-between items-center">
          <span className={`text-[8px] font-medium ${styles.textMuted}`}>Follows</span>
          <span className={`text-[9px] font-bold ${styles.textMain}`}>
            {formatCompact(post.follows)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className={`text-[8px] font-medium ${styles.textMuted}`}>Reach</span>
          <span className={`text-[9px] font-bold ${styles.textMain}`}>
            {formatCompact(post.reach)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className={`text-[8px] font-medium ${styles.textMuted}`}>Engagement</span>
          <span className={`text-[9px] font-bold ${styles.textMain}`}>
            {formatCompact(post.engagement)}
          </span>
        </div>
        <div className={`flex justify-between items-center pt-1 border-t ${styles.border}`}>
          <span className={`text-[8px] font-medium ${styles.textMuted}`}>ER</span>
          <span className={`text-[9px] font-bold`} style={{ color: colorPrimary }}>
            {post.er.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className="w-full h-full flex flex-col overflow-hidden"
      style={{ fontFamily: config.font.name, backgroundColor: styles.bg }}
    >
      {/* Header */}
      <header
        className={`px-6 py-3 border-b flex justify-between items-center h-[10%] shrink-0 ${styles.border}`}
      >
        <div>
          <h1 className={`text-xl font-bold tracking-tight leading-none ${styles.textMain}`}>
            Content Performance
          </h1>
          <p className={`text-[10px] font-medium uppercase tracking-wide ${styles.textMuted}`}>
            Best & Least Engaging Posts
          </p>
        </div>
      </header>

      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Best Posts */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <Award size={16} className="text-emerald-500" />
            <h2 className={`text-sm font-bold ${styles.textMain}`}>Top 5 Best Performing</h2>
          </div>
          <div className="grid grid-cols-5 gap-2 flex-1 overflow-auto">
            {bestPosts.map((post, idx) => (
              <PostCard key={post.id} post={post} rank={idx + 1} />
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className={`w-px ${styles.border}`}></div>

        {/* Least Posts */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown size={16} className="text-rose-500" />
            <h2 className={`text-sm font-bold ${styles.textMain}`}>Top 5 Least Performing</h2>
          </div>
          <div className="grid grid-cols-5 gap-2 flex-1 overflow-auto">
            {leastPosts.map((post, idx) => (
              <PostCard key={post.id} post={post} rank={idx + 1} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
