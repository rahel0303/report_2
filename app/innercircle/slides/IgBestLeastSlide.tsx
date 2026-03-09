'use client';

import React, { useEffect, useRef, useState } from 'react';
import { BarChart2, Trophy, TrendingDown, Loader2, ExternalLink } from 'lucide-react';
import { ReportConfig } from '@/app/types';
import { SlideFooter } from '@/app/components/ui/SlideFooter';
import { ChannelBadge } from '@/app/components/ui';
import { generateLayoutTheme } from '@/app/utils/themeStyles';

// instagram_page_9.py — Best 5 & Least 5 posts by engagement

interface PostCard {
  follows: number | null;
  reach: number | null;
  engagement: number | null;
  engagement_rate: number | null;
  url: string | null;
  image_url: string | null;
}

interface Props {
  config: ReportConfig;
  isThumbnail?: boolean;
  currentPage?: number;
  totalPages?: number;
}

function fmtN(v: number | null | undefined): string {
  if (v === null || v === undefined) return '-';
  const n = Number(v);
  if (isNaN(n)) return '-';
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

function fmtER(v: number | null | undefined): string {
  if (v === null || v === undefined) return '-';
  const n = Number(v);
  if (isNaN(n)) return '-';
  const pct = Math.abs(n) <= 1 ? n * 100 : n;
  return `${pct.toFixed(2)}%`;
}

const PostCardItem: React.FC<{
  post: PostCard;
  rank: number;
  isDark: boolean;
  theme: ReturnType<typeof generateLayoutTheme>;
  badgeColor: string;
}> = ({ post, rank, isDark, theme, badgeColor }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(post.image_url);
  const [imgLoading, setImgLoading] = useState(!post.image_url && !!post.url);
  const fetchedRef = useRef(false);

  useEffect(() => {
    // Already have image from DB cache — no need to fetch
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
      className="flex flex-col rounded-xl overflow-hidden border flex-1 min-w-0"
      style={{
        backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#fff',
        border: `1px solid ${theme.border}`,
        boxShadow: theme.cardShadow,
      }}
    >
      {/* Thumbnail — flex-1 so it fills all remaining height, no white gap */}
      <div className="relative flex-1 min-h-0">
        {imgLoading ? (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc' }}
          >
            <Loader2 size={20} className="animate-spin" style={{ color: badgeColor }} />
          </div>
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt={`Post #${rank}`}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ display: 'block' }}
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' }}
          >
            <span className="text-[8px]" style={{ color: isDark ? '#4b5563' : '#94a3b8' }}>
              No image
            </span>
          </div>
        )}
        <span
          className="absolute top-1.5 left-1.5 text-[9px] font-bold px-2 py-0.5 rounded-full text-white shadow z-10"
          style={{ backgroundColor: badgeColor }}
        >
          #{rank}
        </span>
      </div>

      {/* Metrics — fixed height at bottom */}
      <div className="p-2 shrink-0 space-y-1">
        {[
          { label: 'Follow', value: fmtN(post.follows) },
          { label: 'Reach', value: fmtN(post.reach) },
          { label: 'Engagement', value: fmtN(post.engagement) },
          { label: 'ER', value: fmtER(post.engagement_rate) },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between items-center gap-1">
            <span className="text-[9px]" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>
              {label}
            </span>
            <span
              className="text-[10px] font-semibold shrink-0"
              style={{ color: label === 'ER' ? badgeColor : isDark ? '#e2e8f0' : '#1e293b' }}
            >
              {value}
            </span>
          </div>
        ))}
        {/* Link row */}
        <div className="flex justify-between items-center gap-1">
          <span className="text-[9px]" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>
            Link
          </span>
          {post.url ? (
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-0.5 text-[9px] font-semibold text-blue-500 hover:text-blue-600"
            >
              <ExternalLink size={8} />
              View
            </a>
          ) : (
            <span className="text-[9px]" style={{ color: isDark ? '#4b5563' : '#d1d5db' }}>
              —
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export const IgBestLeastSlide: React.FC<Props> = ({
  config,
  isThumbnail = false,
  currentPage,
  totalPages,
}) => {
  const [best, setBest] = useState<PostCard[]>([]);
  const [least, setLeast] = useState<PostCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Analysis box state
  const [bestAnalysis, setBestAnalysis] = useState('');
  const [leastAnalysis, setLeastAnalysis] = useState('');
  const [editingBest, setEditingBest] = useState(false);
  const [editingLeast, setEditingLeast] = useState(false);

  useEffect(() => {
    if (!config.clientName || isThumbnail) return;
    setLoading(true);
    setError(null);
    fetch(
      `/api/innercircle/ig-best-least?brand=${encodeURIComponent(config.clientName)}&period=${encodeURIComponent(config.period)}`,
    )
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        setBest(d.best || []);
        setLeast(d.least || []);
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
        <p
          className={`text-4xl font-bold text-center px-4 leading-snug ${isDark ? 'text-white' : 'text-slate-800'}`}
        >
          {config.clientName || '—'}
          {' — '}Instagram Best &amp; Least
        </p>
      </div>
    );
  }

  const BEST_COLOR = '#16a34a';
  const LEAST_COLOR = '#dc2626';

  /* ── Inline editable analysis box ── */
  const AnalysisBox: React.FC<{
    value: string;
    onChange: (v: string) => void;
    editing: boolean;
    setEditing: (v: boolean) => void;
    color: string;
    label: string;
  }> = ({ value, onChange, editing, setEditing, color, label }) => (
    <div
      className="shrink-0 rounded-xl border mt-2"
      style={{
        backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : `${color}08`,
        border: `1px solid ${color}30`,
        minHeight: 140,
      }}
    >
      <div
        className="px-2 py-1 border-b flex items-center justify-between"
        style={{ borderColor: `${color}25` }}
      >
        <span className="text-[8px] font-bold uppercase tracking-wider" style={{ color }}>
          Insights — {label}
        </span>
        <button
          onClick={() => setEditing(!editing)}
          className="text-[7px] font-medium px-1.5 py-0.5 rounded"
          style={{
            color: editing ? '#6b7280' : colorPrimary,
            backgroundColor: editing ? '#f3f4f6' : `${colorPrimary}15`,
          }}
        >
          {editing ? 'Done' : 'Edit'}
        </button>
      </div>
      {editing ? (
        <textarea
          autoFocus
          className="w-full bg-transparent resize-none outline-none p-2 text-[9px] leading-relaxed"
          style={{ color: isDark ? '#d1d5db' : '#374151', minHeight: 112 }}
          value={value}
          placeholder="Add analysis here..."
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setEditing(false)}
        />
      ) : (
        <p
          className="p-2 text-[9px] leading-relaxed cursor-text"
          style={{
            color: value ? (isDark ? '#d1d5db' : '#475569') : isDark ? '#4b5563' : '#94a3b8',
          }}
          onClick={() => setEditing(true)}
        >
          {value || 'Click to add insights / analysis…'}
        </p>
      )}
    </div>
  );

  const SectionColumn: React.FC<{
    label: string;
    Icon: React.ElementType;
    color: string;
    posts: PostCard[];
    emptyMsg: string;
    analysis: string;
    onAnalysisChange: (v: string) => void;
    editingAnalysis: boolean;
    setEditingAnalysis: (v: boolean) => void;
  }> = ({
    label,
    Icon,
    color,
    posts,
    emptyMsg,
    analysis,
    onAnalysisChange,
    editingAnalysis,
    setEditingAnalysis,
  }) => (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Column header */}
      <div
        className="flex items-center gap-2 rounded-lg px-3 py-2 shrink-0"
        style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}
      >
        <Icon size={14} style={{ color }} />
        <span className="text-[12px] font-bold uppercase tracking-wider" style={{ color }}>
          {label}
        </span>
      </div>

      {/* Cards row — takes remaining space */}
      <div className="flex gap-2 mt-2" style={{ flex: '1 1 0', minHeight: 0 }}>
        {posts.length === 0 ? (
          <div
            className="flex-1 flex items-center justify-center rounded-xl text-[10px]"
            style={{ color: isDark ? '#4b5563' : '#94a3b8', border: `1px dashed ${theme.border}` }}
          >
            {emptyMsg}
          </div>
        ) : (
          posts.map((post, i) => (
            <PostCardItem
              key={i}
              post={post}
              rank={i + 1}
              isDark={isDark}
              theme={theme}
              badgeColor={color}
            />
          ))
        )}
      </div>

      {/* Analysis box */}
      <AnalysisBox
        value={analysis}
        onChange={onAnalysisChange}
        editing={editingAnalysis}
        setEditing={setEditingAnalysis}
        color={color}
        label={label}
      />
    </div>
  );

  return (
    <div
      className="w-full h-full flex flex-col overflow-hidden relative pb-14"
      style={{ fontFamily: config.font?.name || 'Inter', background: theme.pageBg }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-0.75 z-10"
        style={{ background: theme.accentLine }}
      />

      {/* Decorative blur */}
      <div
        className="absolute -top-16 -right-16 w-40 h-40 rounded-full pointer-events-none"
        style={{ background: `${colorPrimary}18`, filter: 'blur(40px)' }}
      />

      {/* Header — matches IgGrowthSlide pattern */}
      <div className="px-5 pt-4 shrink-0">
        <div
          className="rounded-xl p-3.5 flex items-center justify-between relative overflow-hidden"
          style={{
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
            border: `1px solid ${theme.border}`,
            boxShadow: theme.cardShadow,
          }}
        >
          <div
            className="absolute top-0 left-0 w-1 h-full rounded-l-xl"
            style={{ background: theme.accentGradient }}
          />
          <div className="pl-3">
            <h1
              className={`text-base font-bold tracking-tight leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}
            >
              {config.clientName || '—'}
              {' — '}Instagram Best &amp; Least
            </h1>
            <p
              className={`text-[10px] font-medium flex items-center gap-1 mt-1 uppercase tracking-wide ${isDark ? 'text-slate-300' : 'text-slate-500'}`}
            >
              <BarChart2 size={9} style={{ color: colorPrimary }} /> {config.period} Report · Top 5
              Posts by Engagement
            </p>
          </div>
          {loading ? (
            <Loader2 size={14} className="animate-spin text-slate-400" />
          ) : (
            <ChannelBadge channel="instagram" isDark={isDark} size="md" />
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-5 mt-2 text-[9px] text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {/* Main content — two columns */}
      <div className="flex-1 overflow-hidden px-5 pt-3 pb-2 flex gap-4 min-h-0">
        <SectionColumn
          label="Best 5"
          Icon={Trophy}
          color={BEST_COLOR}
          posts={best}
          emptyMsg="No best posts data"
          analysis={bestAnalysis}
          onAnalysisChange={setBestAnalysis}
          editingAnalysis={editingBest}
          setEditingAnalysis={setEditingBest}
        />
        <SectionColumn
          label="Least 5"
          Icon={TrendingDown}
          color={LEAST_COLOR}
          posts={least}
          emptyMsg="No least posts data"
          analysis={leastAnalysis}
          onAnalysisChange={setLeastAnalysis}
          editingAnalysis={editingLeast}
          setEditingAnalysis={setEditingLeast}
        />
      </div>

      {/* Hidden export data — read by pptxExporter */}
      <div
        style={{ display: 'none' }}
        data-ic-best-data={JSON.stringify(best)}
        data-ic-least-data={JSON.stringify(least)}
        data-ic-best-analysis={bestAnalysis}
        data-ic-least-analysis={leastAnalysis}
      />

      <div className="absolute bottom-0 left-0 right-0">
        <SlideFooter
          clientName={config.clientName}
          period={config.period}
          currentPage={currentPage ?? 1}
          totalPages={totalPages ?? 1}
          logo={config.coverDesign?.logoData}
          brandColor={config.coverDesign?.colors?.primary}
        />
      </div>
    </div>
  );
};
