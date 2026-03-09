'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Layers, ArrowRight, Sparkles, Loader2, Send, ExternalLink } from 'lucide-react';
import { ReportConfig } from '@/app/types';
import { SlideFooter } from '@/app/components/ui/SlideFooter';
import { ChannelBadge } from '@/app/components/ui';
import { generateLayoutTheme } from '@/app/utils/themeStyles';
import { generateGeminiContent } from '@/app/utils/api';
import { renderTextWithHighlights } from '@/app/utils/helpers';

// tiktok_page_20.py — Content Pillar analysis
// Layout: 2 pillar rows (Lowest → Highest), 3 posts each, insight box per pillar

interface TtPillarPost {
  post_date: string | null;
  vr_rate: number | null;
  views: number | null;
  engagement: number | null;
  avg_watch_time: number | null;
  url: string | null;
  image_url: string | null;
}

interface TtPillar {
  pillar: string;
  posts: TtPillarPost[];
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

function fmtVR(v: number | null | undefined): string {
  if (v === null || v === undefined) return '-';
  return `${Number(v).toFixed(1)}%`;
}

function fmtWT(v: number | null | undefined): string {
  if (v === null || v === undefined) return '-';
  return `${Number(v).toFixed(1)}s`;
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return '-';
  try {
    return new Date(d).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: '2-digit',
    });
  } catch {
    return d;
  }
}

export const TtContentPillarSlide: React.FC<Props> = ({
  config,
  isThumbnail = false,
  currentPage,
  totalPages,
}) => {
  const [pillars, setPillars] = useState<TtPillar[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<Record<string, string | null>>({});
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState<Record<string, boolean>>({});
  const [showAiInput, setShowAiInput] = useState<Record<string, boolean>>({});
  const [aiPrompts, setAiPrompts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!config.clientName || isThumbnail) return;
    setLoading(true);
    setError(null);
    fetch(
      `/api/innercircle/tt-content-pillar?brand=${encodeURIComponent(config.clientName)}&period=${encodeURIComponent(config.period)}`,
    )
      .then((r) => r.json())
      .then((d) => {
        if (d.error && !d.pillars?.length) setError(d.error);
        setPillars(d.pillars || []);
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

  const handleGenerate = async (pillar: string, e?: React.FormEvent) => {
    e?.preventDefault();
    setGenerating((p) => ({ ...p, [pillar]: true }));
    setShowAiInput((p) => ({ ...p, [pillar]: false }));
    try {
      const pillarData = pillars.find((p) => p.pillar === pillar);
      const ctx =
        pillarData?.posts
          .map(
            (p, i) =>
              `Post ${i + 1}: Views=${fmtN(p.views)}, Engagement=${fmtN(p.engagement)}, VR=${fmtVR(p.vr_rate)}, AvgWatch=${fmtWT(p.avg_watch_time)}`,
          )
          .join('\n') || '';
      const text = await generateGeminiContent(
        `Analyze TikTok content pillar "${pillar}" for ${config.clientName} (${config.period}). Posts sorted Lowest→Highest by views:\n${ctx}\n${aiPrompts[pillar] ? `Focus: ${aiPrompts[pillar]}` : ''}\nWrite 2-3 SHORT bullet points (start each with -). Use **bold** for key numbers.`,
      );
      setInsights((p) => ({ ...p, [pillar]: text }));
    } catch {
      setInsights((p) => ({ ...p, [pillar]: 'Failed to generate insight.' }));
    } finally {
      setGenerating((p) => ({ ...p, [pillar]: false }));
      setAiPrompts((prev) => ({ ...prev, [pillar]: '' }));
    }
  };

  if (isThumbnail) {
    return (
      <div
        className="w-full h-full flex items-center justify-center"
        style={{ fontFamily: config.font?.name || 'Inter', background: theme.pageBg }}
      >
        <p
          className={`text-4xl font-bold text-center px-4 leading-snug ${isDark ? 'text-white' : 'text-slate-800'}`}
        >
          {config.clientName || '—'} — TikTok Content Pillar
        </p>
      </div>
    );
  }

  // ── Post Card ────────────────────────────────────────────────────────────
  const PostCard: React.FC<{ post: TtPillarPost; rank: number }> = ({ post, rank }) => {
    const [imageUrl, setImageUrl] = useState<string | null>(post.image_url);
    const [imgLoading, setImgLoading] = useState(!post.image_url && !!post.url);
    const fetchedRef = useRef(false);

    useEffect(() => {
      if (post.image_url) return;
      if (!post.url || fetchedRef.current) return;
      fetchedRef.current = true;
      setImgLoading(true);
      fetch(`/api/innercircle/tt-thumbnail?url=${encodeURIComponent(post.url)}`)
        .then((r) => r.json())
        .then((d) => setImageUrl(d.image_url || null))
        .catch(() => setImageUrl(null))
        .finally(() => setImgLoading(false));
    }, [post.url, post.image_url]);

    return (
      <div
        className="flex flex-row rounded-xl overflow-hidden min-w-0"
        style={{
          flex: '0 0 calc(33.33% - 4px)',
          maxWidth: 'calc(33.33% - 4px)',
          border: `1px solid ${theme.border}`,
          backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff',
          boxShadow: theme.cardShadow,
        }}
      >
        {/* Image — left 52% */}
        <div className="relative" style={{ flex: '0 0 52%' }}>
          {imgLoading ? (
            <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9' }}>
              <Loader2 size={12} className="animate-spin" style={{ color: colorPrimary }} />
            </div>
          ) : imageUrl ? (
            <img src={imageUrl} alt={`Post #${rank}`} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9' }}>
              <span className="text-[6px]" style={{ color: isDark ? '#4b5563' : '#94a3b8' }}>No image</span>
            </div>
          )}
        </div>
        {/* Metrics — right 48% */}
        <div
          className="flex flex-col justify-around px-1.5 py-1 overflow-hidden min-w-0"
          style={{ flex: '1 1 0%', borderLeft: `1px solid ${theme.border}` }}
        >
          <span
            className="text-[7px] font-bold text-white text-center leading-none self-start mb-1"
            style={{ backgroundColor: colorPrimary, borderRadius: '4px', padding: '2px 6px', minWidth: '28px', display: 'inline-block' }}
          >
            #{rank}
          </span>
          {[
            { label: 'Date', val: fmtDate(post.post_date) },
            { label: 'VR Rate', val: fmtVR(post.vr_rate) },
            { label: 'Views', val: fmtN(post.views) },
            { label: 'Engagement', val: fmtN(post.engagement) },
            { label: 'Avg Watch', val: fmtWT(post.avg_watch_time) },
          ].map(({ label, val }) => (
            <div key={label} className="flex flex-col min-w-0">
              <span className="text-[6px] shrink-0" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>{label}</span>
              <span className="text-[7px] font-bold truncate" style={{ color: isDark ? '#e2e8f0' : '#0f172a' }}>{val}</span>
            </div>
          ))}
          {post.url ? (
            <a href={post.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-0.5 text-[6px] font-bold mt-auto" style={{ color: '#3b82f6' }}>
              <ExternalLink size={6} />Link
            </a>
          ) : (
            <div className="mt-auto h-2" />
          )}
        </div>
      </div>
    );
  };

  // ── Insight Box ──────────────────────────────────────────────────────────
  const InsightBox: React.FC<{ pillar: string }> = ({ pillar }) => {
    const insight = insights[pillar] || '';
    const isEdit = editing[pillar] === 'editing';
    const isGen = generating[pillar] || false;
    const showAi = showAiInput[pillar] || false;
    return (
      <div
        className="flex flex-col rounded-xl border overflow-hidden min-h-0 h-full"
        style={{
          backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
          borderColor: theme.border,
        }}
      >
        <div
          className="flex items-center justify-between px-1.5 py-0.5 border-b shrink-0"
          style={{ borderColor: theme.border }}
        >
          <div className="flex items-center gap-0.5">
            <Sparkles size={6} style={{ color: colorPrimary }} />
            <span
              className="text-[5.5px] font-bold uppercase tracking-wide"
              style={{ color: isDark ? '#e2e8f0' : '#475569' }}
            >
              Insight
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            {insight && !isEdit && (
              <button
                onClick={() => {
                  setEditValues((p) => ({ ...p, [pillar]: insight }));
                  setEditing((p) => ({ ...p, [pillar]: 'editing' }));
                }}
                className="text-[5px] px-1 py-0.5 rounded-full border"
                style={{
                  color: isDark ? '#94a3b8' : '#64748b',
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
                }}
              >
                Edit
              </button>
            )}
            {isEdit && (
              <button
                onClick={() => {
                  setInsights((p) => ({ ...p, [pillar]: editValues[pillar] || '' }));
                  setEditing((p) => ({ ...p, [pillar]: null }));
                }}
                className="text-[5px] px-1 py-0.5 rounded-full border"
                style={{ color: colorPrimary, borderColor: colorPrimary }}
              >
                Done
              </button>
            )}
            <button
              onClick={() => {
                setShowAiInput((p) => ({ ...p, [pillar]: !showAi }));
                setEditing((p) => ({ ...p, [pillar]: null }));
              }}
              className="flex items-center gap-0.5 px-1 py-0.5 rounded-full text-[5px] border"
              style={{
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#eef2ff',
                color: isDark ? '#94a3b8' : '#6366f1',
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#c7d2fe',
              }}
            >
              <Sparkles size={5} />
              AI
            </button>
          </div>
        </div>
        {showAi && (
          <form
            onSubmit={(e) => handleGenerate(pillar, e)}
            className="flex gap-0.5 px-1 py-0.5 border-b shrink-0"
            style={{
              backgroundColor: isDark ? 'rgba(99,102,241,0.08)' : '#eef2ff',
              borderColor: isDark ? 'rgba(99,102,241,0.2)' : '#c7d2fe',
            }}
          >
            <input
              type="text"
              value={aiPrompts[pillar] || ''}
              onChange={(e) => setAiPrompts((p) => ({ ...p, [pillar]: e.target.value }))}
              placeholder="Optional focus…"
              className="flex-1 text-[5.5px] px-1 py-0.5 rounded border focus:outline-none"
              style={{
                background: isDark ? 'rgba(255,255,255,0.08)' : '#fff',
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#c7d2fe',
                color: isDark ? '#fff' : '#374151',
              }}
            />
            <button
              type="submit"
              disabled={isGen}
              className="bg-indigo-600 text-white px-1 rounded disabled:opacity-50 flex items-center"
            >
              {isGen ? <Loader2 size={6} className="animate-spin" /> : <Send size={6} />}
            </button>
          </form>
        )}
        <div className="px-1.5 py-1 flex-1 overflow-y-auto">
          {isGen ? (
            <div className="flex items-center gap-1 opacity-60">
              <Sparkles size={6} className="text-indigo-500 animate-spin" />
              <span className="text-[5.5px] text-indigo-500 animate-pulse">Analyzing…</span>
            </div>
          ) : isEdit ? (
            <textarea
              value={editValues[pillar] || ''}
              onChange={(e) => setEditValues((p) => ({ ...p, [pillar]: e.target.value }))}
              autoFocus
              className="w-full h-full resize-none text-[5.5px] leading-relaxed focus:outline-none bg-transparent"
              style={{ color: isDark ? '#cbd5e1' : '#374151' }}
            />
          ) : insight ? (
            <div
              className="text-[5.5px] leading-relaxed"
              style={{ color: isDark ? '#cbd5e1' : '#475569' }}
            >
              {renderTextWithHighlights(insight, isDark, colorPrimary)}
            </div>
          ) : (
            <span className="text-[5.5px]" style={{ color: isDark ? '#4b5563' : '#94a3b8' }}>
              Click AI to generate, or Edit to type.
            </span>
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
      <div
        className="absolute top-0 left-0 right-0 h-0.75 z-10"
        style={{ background: theme.accentLine }}
      />
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
          <div
            className="absolute top-0 left-0 w-1 h-full rounded-l-xl"
            style={{ background: theme.accentGradient }}
          />
          <div className="pl-3">
            <h1
              className={`text-base font-bold tracking-tight leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}
            >
              {config.clientName || '—'} — TikTok Content Pillar
            </h1>
            <p
              className={`text-[10px] font-medium flex items-center gap-1 mt-1 uppercase tracking-wide ${isDark ? 'text-slate-300' : 'text-slate-500'}`}
            >
              <Layers size={9} style={{ color: colorPrimary }} /> {config.period} · Top 2 Pillars ·
              Lowest → Highest
            </p>
          </div>
          <div className="flex items-center gap-2">
            {loading && <Loader2 size={14} className="animate-spin text-slate-400" />}
            <ChannelBadge channel="tiktok" isDark={isDark} size="md" />
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-5 mt-2 text-[9px] text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2 shrink-0">
          {error}
        </div>
      )}

      {/* Direction label */}
      <div className="flex items-center justify-between px-5 pt-1.5 shrink-0">
        <span
          className="text-[8px] font-bold uppercase tracking-wider"
          style={{ color: isDark ? '#64748b' : '#94a3b8' }}
        >
          Lowest
        </span>
        <div
          className="flex-1 mx-2 border-t border-dashed"
          style={{ borderColor: isDark ? '#334155' : '#e2e8f0' }}
        />
        <ArrowRight size={10} style={{ color: isDark ? '#64748b' : '#94a3b8' }} />
        <div
          className="flex-1 mx-2 border-t border-dashed"
          style={{ borderColor: isDark ? '#334155' : '#e2e8f0' }}
        />
        <span
          className="text-[8px] font-bold uppercase tracking-wider"
          style={{ color: isDark ? '#64748b' : '#94a3b8' }}
        >
          Highest
        </span>
      </div>

      {/* Body: 2 pillar rows */}
      <div className="flex-1 flex flex-col gap-2 px-5 pt-1 pb-1 min-h-0 overflow-hidden">
        {pillars.length === 0 && !loading ? (
          <div
            className="flex-1 flex items-center justify-center rounded-xl border-2 border-dashed text-[9px]"
            style={{ color: isDark ? '#4b5563' : '#94a3b8', borderColor: theme.border }}
          >
            No data
          </div>
        ) : (
          // Always render exactly 2 rows so each row is always half-height
          Array.from({ length: 2 }).map((_, rowIdx) => {
            const pillar = pillars[rowIdx];
            return (
              <div key={rowIdx} className="flex flex-col min-h-0" style={{ flex: '1 1 0' }}>
                {pillar ? (
                  <>
                    {/* Pillar label */}
                    <div className="flex items-center gap-1.5 mb-1 shrink-0">
                      <div
                        className="w-1 h-4 rounded-full"
                        style={{ background: theme.accentGradient }}
                      />
                      <span
                        className="text-[8px] font-bold uppercase tracking-wider truncate"
                        style={{ color: isDark ? '#e2e8f0' : '#475569' }}
                      >
                        {pillar.pillar}
                      </span>
                    </div>
                    {/* Posts + Insight row */}
                    <div className="flex gap-2 flex-1 min-h-0">
                      {/* Posts: always 3 fixed-width slots */}
                      <div className="flex gap-1.5 min-h-0" style={{ flex: '3 1 0' }}>
                        {pillar.posts.length === 0 ? (
                          <div
                            className="flex-1 flex items-center justify-center rounded-xl border-2 border-dashed text-[9px]"
                            style={{
                              color: isDark ? '#4b5563' : '#94a3b8',
                              borderColor: theme.border,
                            }}
                          >
                            No posts
                          </div>
                        ) : (
                          pillar.posts.map((post, i) => (
                            <PostCard key={i} post={post} rank={i + 1} />
                          ))
                        )}
                      </div>
                      {/* Insight */}
                      <div className="shrink-0 min-h-0" style={{ width: '28%' }}>
                        <InsightBox pillar={pillar.pillar} />
                      </div>
                    </div>
                  </>
                ) : (
                  /* Empty placeholder row to keep layout stable */
                  <div
                    className="flex-1 rounded-xl border-2 border-dashed"
                    style={{ borderColor: theme.border }}
                  />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Hidden export data */}
      <div
        style={{ display: 'none' }}
        data-ic-tt-cp-pillars={JSON.stringify(
          pillars
            .slice(0, 2)
            .map((p) => ({ pillar: p.pillar, posts: p.posts, insight: insights[p.pillar] || '' })),
        )}
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
