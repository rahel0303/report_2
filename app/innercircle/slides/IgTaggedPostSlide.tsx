'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Tag, Users, ExternalLink, Loader2, MessageSquare } from 'lucide-react';
import { ReportConfig } from '@/app/types';
import { SlideFooter } from '@/app/components/ui/SlideFooter';
import { ChannelBadge } from '@/app/components/ui';
import { generateLayoutTheme } from '@/app/utils/themeStyles';

// instagram_page_15.py — Tagged Post page
// Data: ig_tagged_post (top 3) + ig_tagged_post_monthly (KPIs) + ig_sentiment_daily (comments)

interface TaggedPost {
  post_date: string | null;
  engagement: number | null;
  url: string | null;
  image_url: string | null;
}

interface Summary {
  total_tagged_post: number | null;
  total_tagged_post_inc: number | null;
  total_user_count: number | null;
  total_user_count_inc: number | null;
}

interface Sentiments {
  Negative: string[];
  Positive: string[];
  Neutral: string[];
}

interface Props {
  config: ReportConfig;
  isThumbnail?: boolean;
  currentPage?: number;
  totalPages?: number;
}

const SENTIMENT_CONFIG = {
  Negative: { color: '#dc2626', bg: '#fef2f2', label: 'Negative' },
  Positive: { color: '#16a34a', bg: '#f0fdf4', label: 'Positive' },
  Neutral:  { color: '#6366f1', bg: '#eef2ff', label: 'Neutral'  },
} as const;

function fmtN(v: number | null | undefined): string {
  if (v === null || v === undefined) return '-';
  const n = Number(v);
  if (isNaN(n)) return '-';
  return n.toLocaleString();
}

function fmtPct(v: number | null | undefined): string {
  if (v === null || v === undefined) return '';
  const n = Number(v);
  if (isNaN(n)) return '';
  const sign = n >= 0 ? '+' : '';
  return `${sign}${n.toFixed(1)}%`;
}

function fmtDate(d: string | null): string {
  if (!d) return '-';
  try {
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return d;
  }
}

export const IgTaggedPostSlide: React.FC<Props> = ({
  config,
  isThumbnail = false,
  currentPage,
  totalPages,
}) => {
  const [posts, setPosts] = useState<TaggedPost[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [sentiments, setSentiments] = useState<Sentiments>({ Negative: [], Positive: [], Neutral: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!config.clientName || isThumbnail) return;
    setLoading(true);
    setError(null);
    fetch(
      `/api/innercircle/ig-tagged-post?brand=${encodeURIComponent(config.clientName)}&period=${encodeURIComponent(config.period)}`,
    )
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        setPosts(d.posts || []);
        setSummary(d.summary || null);
        setSentiments(d.sentiments || { Negative: [], Positive: [], Neutral: [] });
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [config.clientName, config.period, isThumbnail]);

  const contentMode = config.coverDesign?.contentMode || 'light';
  const theme = generateLayoutTheme(
    config.coverDesign?.colors,
    config.theme?.brandColor,
    contentMode,
  );
  const isDark = contentMode === 'dark';
  const colorPrimary = theme.colors.primary;

  if (isThumbnail) {
    return (
      <div
        className="w-full h-full flex items-center justify-center"
        style={{ fontFamily: config.font?.name || 'Inter', background: theme.pageBg }}
      >
        <p className={`text-4xl font-bold text-center px-4 leading-snug ${isDark ? 'text-white' : 'text-slate-800'}`}>
          {config.clientName || '—'} — Tagged Post
        </p>
      </div>
    );
  }

  // ── KPI Card ──────────────────────────────────────────────────────────────
  const KpiCard: React.FC<{
    icon: React.ElementType;
    label: string;
    value: number | null;
    change: number | null;
  }> = ({ icon: Icon, label, value, change }) => {
    const pct = fmtPct(change);
    const isPos = (change ?? 0) >= 0;
    return (
      <div
        className="flex-1 rounded-xl p-3 flex flex-col gap-1"
        style={{
          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
          border: `1px solid ${theme.border}`,
          boxShadow: theme.cardShadow,
        }}
      >
        <div className="flex items-center gap-1.5">
          <div
            className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${colorPrimary}18` }}
          >
            <Icon size={10} style={{ color: colorPrimary }} />
          </div>
          <span className="text-[8px] font-semibold uppercase tracking-wide" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>
            {label}
          </span>
        </div>
        <div className="flex items-end gap-2 mt-0.5">
          <span className="text-[18px] font-bold leading-none" style={{ color: isDark ? '#f1f5f9' : '#0f172a' }}>
            {fmtN(value)}
          </span>
          {pct && (
            <span
              className="text-[9px] font-semibold mb-0.5"
              style={{ color: isPos ? '#16a34a' : '#dc2626' }}
            >
              {pct}
            </span>
          )}
        </div>
      </div>
    );
  };

  // ── Tagged Post Card ──────────────────────────────────────────────────────
  const PostCard: React.FC<{ post: TaggedPost; rank: number }> = ({ post, rank }) => {
    const [imageUrl, setImageUrl] = useState<string | null>(post.image_url);
    const [imgLoading, setImgLoading] = useState(!post.image_url && !!post.url);
    const fetchedRef = useRef(false);

    useEffect(() => {
      if (post.image_url) return;
      if (!post.url || fetchedRef.current) return;
      fetchedRef.current = true;
      setImgLoading(true);
      fetch(`/api/innercircle/ig-thumbnail?url=${encodeURIComponent(post.url)}&channel=instagram`)
        .then((r) => r.json())
        .then((d) => setImageUrl(d.image_url || null))
        .catch(() => setImageUrl(null))
        .finally(() => setImgLoading(false));
    }, [post.url, post.image_url]);

    return (
      <div
        className="flex-1 flex flex-col rounded-xl overflow-hidden min-w-0"
        style={{
          border: `1px solid ${theme.border}`,
          boxShadow: theme.cardShadow,
          backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff',
        }}
      >
        {/* Info bar */}
        <div
          className="shrink-0 px-2 py-1.5 border-b"
          style={{ borderColor: theme.border, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc' }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span
              className="text-[7px] font-bold px-1.5 py-0.5 rounded-full text-white leading-none"
              style={{ backgroundColor: colorPrimary }}
            >
              #{rank}
            </span>
            <span className="text-[9px] font-bold" style={{ color: isDark ? '#f1f5f9' : '#0f172a' }}>
              {fmtN(post.engagement)}
            </span>
            <span className="text-[7px]" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>
              engagement
            </span>
          </div>
          <p className="text-[7px]" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>
            {fmtDate(post.post_date)}
          </p>
          {post.url ? (
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-0.5 text-[7px] font-semibold mt-0.5"
              style={{ color: '#3b82f6' }}
            >
              <ExternalLink size={7} />
              View Post
            </a>
          ) : (
            <span className="text-[7px]" style={{ color: isDark ? '#334155' : '#cbd5e1' }}>
              No link
            </span>
          )}
        </div>

        {/* Thumbnail */}
        <div className="flex-1 relative min-h-0">
          {imgLoading ? (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9' }}
            >
              <Loader2 size={16} className="animate-spin" style={{ color: colorPrimary }} />
            </div>
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt={`Tagged post #${rank}`}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9' }}
            >
              <span className="text-[8px]" style={{ color: isDark ? '#4b5563' : '#94a3b8' }}>
                No image
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Sentiment Column ──────────────────────────────────────────────────────
  const SentimentCol: React.FC<{ category: keyof typeof SENTIMENT_CONFIG; comments: string[] }> = ({
    category,
    comments,
  }) => {
    const cfg = SENTIMENT_CONFIG[category];
    const colBg = isDark ? `${cfg.color}12` : cfg.bg;
    return (
      <div
        className="flex-1 rounded-xl overflow-hidden min-w-0"
        style={{ border: `1px solid ${cfg.color}30`, backgroundColor: colBg }}
      >
        {/* Header */}
        <div
          className="px-2.5 py-1.5 border-b flex items-center gap-1.5"
          style={{ borderColor: `${cfg.color}25`, backgroundColor: `${cfg.color}18` }}
        >
          <MessageSquare size={8} style={{ color: cfg.color }} />
          <span className="text-[8px] font-bold uppercase tracking-wider" style={{ color: cfg.color }}>
            {cfg.label}
          </span>
          <span
            className="ml-auto text-[7px] font-semibold px-1 py-0.5 rounded-full"
            style={{ backgroundColor: `${cfg.color}20`, color: cfg.color }}
          >
            {comments.length}
          </span>
        </div>

        {/* Comments */}
        <div className="p-2 flex flex-col gap-1">
          {comments.length === 0 ? (
            <p className="text-[7px] italic" style={{ color: isDark ? '#475569' : '#94a3b8' }}>
              No comments available
            </p>
          ) : (
            comments.map((c, i) => (
              <div key={i} className="flex gap-1 items-start">
                <span className="text-[7px] mt-0.5 shrink-0" style={{ color: cfg.color }}>•</span>
                <p
                  className="text-[7px] leading-relaxed"
                  style={{ color: isDark ? '#cbd5e1' : '#374151' }}
                >
                  {c.length > 100 ? c.substring(0, 100) + '…' : c}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      className="w-full h-full flex flex-col overflow-hidden relative pb-14"
      style={{ fontFamily: config.font?.name || 'Inter', background: theme.pageBg }}
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-0.75 z-10" style={{ background: theme.accentLine }} />

      {/* Decorative blur */}
      <div
        className="absolute -top-16 -right-16 w-40 h-40 rounded-full pointer-events-none"
        style={{ background: `${colorPrimary}18`, filter: 'blur(40px)' }}
      />

      {/* Header */}
      <div className="px-5 pt-4 shrink-0">
        <div
          className="rounded-xl p-3.5 flex items-center justify-between relative overflow-hidden"
          style={{
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
            border: `1px solid ${theme.border}`,
            boxShadow: theme.cardShadow,
          }}
        >
          <div className="absolute top-0 left-0 w-1 h-full rounded-l-xl" style={{ background: theme.accentGradient }} />
          <div className="pl-3">
            <h1 className={`text-base font-bold tracking-tight leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {config.clientName || '—'} — Instagram Tagged Post
            </h1>
            <p className={`text-[10px] font-medium flex items-center gap-1 mt-1 uppercase tracking-wide ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
              <Tag size={9} style={{ color: colorPrimary }} /> {config.period} · Top 3 Tagged Posts · Sentiment Comments
            </p>
          </div>
          <div className="flex items-center gap-2">
            {loading && <Loader2 size={14} className="animate-spin text-slate-400" />}
            <ChannelBadge channel="instagram" isDark={isDark} size="md" />
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-5 mt-2 text-[9px] text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2 shrink-0">
          {error}
        </div>
      )}

      {/* Body */}
      <div className="flex-1 flex flex-col px-5 pt-3 pb-1 gap-2.5 min-h-0 overflow-hidden">

        {/* Row 1: Post cards (left) + KPI cards (right) */}
        <div className="flex gap-3 min-h-0" style={{ flex: '3 1 0' }}>

          {/* Tagged post cards */}
          <div className="flex gap-2.5 min-w-0" style={{ flex: '2 1 0' }}>
            {loading && posts.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 size={20} className="animate-spin text-slate-400" />
              </div>
            ) : posts.length === 0 && !loading ? (
              <div
                className="flex-1 flex items-center justify-center rounded-xl border-2 border-dashed text-[10px]"
                style={{ color: isDark ? '#4b5563' : '#94a3b8', borderColor: theme.border }}
              >
                No tagged post data for this period
              </div>
            ) : (
              posts.map((post, i) => <PostCard key={i} post={post} rank={i + 1} />)
            )}
          </div>

          {/* KPI cards */}
          <div className="flex flex-col gap-2.5 shrink-0" style={{ width: '28%' }}>
            <KpiCard
              icon={Tag}
              label="Total Tagged Posts"
              value={summary?.total_tagged_post ?? null}
              change={summary?.total_tagged_post_inc ?? null}
            />
            <KpiCard
              icon={Users}
              label="Tagged User Count"
              value={summary?.total_user_count ?? null}
              change={summary?.total_user_count_inc ?? null}
            />
          </div>
        </div>

        {/* Row 2: Sentiment columns */}
        <div className="flex gap-2.5 shrink-0" style={{ flex: '2 1 0', minHeight: 0 }}>
          {(['Negative', 'Positive', 'Neutral'] as const).map((cat) => (
            <SentimentCol key={cat} category={cat} comments={sentiments[cat]} />
          ))}
        </div>

      </div>

      {/* Hidden export data — read by pptxExporter */}
      <div
        style={{ display: 'none' }}
        data-ic-tagged-posts={JSON.stringify(posts)}
        data-ic-tagged-summary={JSON.stringify(summary)}
        data-ic-tagged-sentiments={JSON.stringify(sentiments)}
      />

      <div className="absolute bottom-0 left-0 right-0">
        <SlideFooter
          clientName={config.clientName}
          period={config.period}
          currentPage={currentPage ?? 1}
          totalPages={totalPages ?? 1}
          logo={config.coverDesign?.logoData}
          brandColor={config.coverDesign?.colors?.primary}
          preparedBy={config.preparedBy}
        />
      </div>
    </div>
  );
};
