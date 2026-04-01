'use client';

import React, { useEffect, useRef, useState } from 'react';
import { TrendingUp, TrendingDown, Sparkles, Loader2, ExternalLink } from 'lucide-react';
import { ReportConfig } from '@/app/types';
import { SlideFooter } from '@/app/components/ui/SlideFooter';
import { ChannelBadge } from '@/app/components/ui';
import { generateLayoutTheme } from '@/app/utils/themeStyles';
import { generateGeminiContent } from '@/app/utils/api';
import {
  TT_BEST_LEAST_ANALYST_SYSTEM_PROMPT,
  buildTtBestLeastPrompt,
  parseTtBestLeastInsight,
  ParsedInsight,
} from '@/app/innercircle/prompts/ttBestLeastPrompt';

// tiktok_page_18.py (organic) + tiktok_page_19.py (paid)
// Layout: Highest 3 (top-left) | Lowest 3 (bottom-left) | Insight (right)

const COLOR_HIGH = '#16a34a';
const COLOR_LOW = '#dc2626';

interface TtPost {
  views: number | null;
  engagement: number | null;
  vr_rate: number | null;
  url: string | null;
  image_url: string | null;
}

interface Props {
  config: ReportConfig;
  mode?: 'organic' | 'paid';
  isThumbnail?: boolean;
  currentPage?: number;
  totalPages?: number;
  savedInsight?: string;
  onInsightChange?: (value: string) => void;
}

function fmtN(v: number | null | undefined): string {
  if (v === null || v === undefined) return '-';
  const n = Number(v);
  if (isNaN(n)) return '-';
  return n.toLocaleString();
}

function fmtVR(v: number | null | undefined): string {
  if (v === null || v === undefined) return '-';
  return `${Number(v).toFixed(2)}%`;
}

// Inline bold renderer — splits on **text** markers
const renderBoldInline = (text: string, color: string) =>
  text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
    part.startsWith('**') ? (
      <span key={i} className="font-bold" style={{ color }}>
        {part.slice(2, -2)}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );

// Parsed insight view component
const InsightView: React.FC<{
  parsed: ParsedInsight;
  isDark: boolean;
  colorPrimary: string;
  onEdit: () => void;
}> = ({ parsed, isDark, colorPrimary, onEdit }) => {
  const bodyColor = isDark ? '#cbd5e1' : '#475569';
  const labelColor = isDark ? '#e2e8f0' : '#374151';
  return (
    <div
      data-ic-insight
      className="flex flex-col gap-1 w-full min-w-0 cursor-pointer"
      onClick={onEdit}
    >
      {parsed.analysis && (
        <div
          className="text-[8px] leading-relaxed break-words"
          style={{ color: bodyColor, overflowWrap: 'break-word' }}
        >
          {renderBoldInline(parsed.analysis, colorPrimary)}
        </div>
      )}
      {parsed.recommendations.length > 0 && (
        <div className="flex flex-col gap-0.5 w-full min-w-0">
          {parsed.recommendations.map((rec) => (
            <div
              key={rec.type}
              className="text-[7.5px] leading-snug break-words"
              style={{ color: bodyColor, overflowWrap: 'break-word' }}
            >
              <span className="font-bold" style={{ color: labelColor }}>
                • {rec.type}:{' '}
              </span>
              {renderBoldInline(rec.text, colorPrimary)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const TtBestLeastSlide: React.FC<Props> = ({
  config,
  mode = 'organic',
  isThumbnail = false,
  currentPage,
  totalPages,
  savedInsight,
  onInsightChange,
}) => {
  const [highest, setHighest] = useState<TtPost[]>([]);
  const [lowest, setLowest] = useState<TtPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [insight, setInsight] = useState<string>(() => savedInsight || '');
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const parsed: ParsedInsight = React.useMemo(
    () => parseTtBestLeastInsight(insight),
    [insight],
  );

  const persistInsight = (val: string) => {
    setInsight(val);
    onInsightChange?.(val);
  };

  useEffect(() => {
    if (!config.clientName || isThumbnail) return;
    setLoading(true);
    setError(null);
    fetch(
      `/api/innercircle/tt-best-least?brand=${encodeURIComponent(config.clientName)}&period=${encodeURIComponent(config.period)}&mode=${mode}`,
    )
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        setHighest(d.highest || []);
        setLowest(d.lowest || []);
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [config.clientName, config.period, mode, isThumbnail]);

  const contentMode = config.coverDesign?.contentMode || 'light';
  const theme = generateLayoutTheme(
    config.coverDesign?.colors,
    config.theme?.brandColor,
    contentMode,
  );
  const isDark = contentMode === 'dark';
  const colorPrimary = theme.colors.primary;
  const modeLabel = mode === 'paid' ? 'Paid' : 'Organic';

  const handleGenerate = async () => {
    if (highest.length === 0 && lowest.length === 0) return;
    setIsGenerating(true);
    try {
      const promptData = {
        highest: highest.map((p, i) => ({
          rank: i + 1,
          views: fmtN(p.views),
          engagement: fmtN(p.engagement),
          vr_rate: fmtVR(p.vr_rate).replace('%', ''),
        })),
        lowest: lowest.map((p, i) => ({
          rank: i + 1,
          views: fmtN(p.views),
          engagement: fmtN(p.engagement),
          vr_rate: fmtVR(p.vr_rate).replace('%', ''),
        })),
      };
      const prompt = buildTtBestLeastPrompt(config.clientName, config.period, promptData);
      const text = await generateGeminiContent(prompt, TT_BEST_LEAST_ANALYST_SYSTEM_PROMPT);
      persistInsight(text);
    } catch {
      persistInsight('Failed to generate insight.');
    } finally {
      setIsGenerating(false);
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
          {config.clientName || '—'} — TikTok {modeLabel} Best/Least
        </p>
      </div>
    );
  }

  // ── Post Card — fixed width, fixed-ratio image ────────────────────────────
  const PostCard: React.FC<{ post: TtPost; rank: number; color: string }> = ({ post, rank, color }) => {
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
        className="flex flex-row rounded-xl overflow-hidden"
        style={{
          flex: '0 0 calc(33.33% - 4px)',
          maxWidth: 'calc(33.33% - 4px)',
          border: `1px solid ${color}30`,
          backgroundColor: isDark ? `${color}0D` : `${color}08`,
          boxShadow: theme.cardShadow,
        }}
      >
        {/* Image — left 55% */}
        <div className="relative" style={{ flex: '0 0 55%' }}>
          {imgLoading ? (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9' }}
            >
              <Loader2 size={14} className="animate-spin" style={{ color }} />
            </div>
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt={`Post #${rank}`}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9' }}
            >
              <span className="text-[7px]" style={{ color: isDark ? '#4b5563' : '#94a3b8' }}>No image</span>
            </div>
          )}
        </div>
        {/* Metrics — right 45% */}
        <div
          className="flex flex-col justify-around p-1.5 overflow-hidden"
          style={{ flex: '1 1 0%', borderLeft: `1px solid ${color}20` }}
        >
          <span
            className="text-[8px] font-bold text-white text-center leading-none self-start mb-1"
            style={{ backgroundColor: color, borderRadius: '4px', padding: '2px 8px', minWidth: '30px', display: 'inline-block' }}
          >
            #{rank}
          </span>
          {[
            { label: 'Views', val: fmtN(post.views) },
            { label: 'Engagement', val: fmtN(post.engagement) },
            { label: 'VR Rate', val: fmtVR(post.vr_rate) },
          ].map(({ label, val }) => (
            <div key={label} className="flex flex-col">
              <span className="text-[7px]" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>{label}</span>
              <span className="text-[8px] font-bold" style={{ color: label === 'VR Rate' ? color : isDark ? '#e2e8f0' : '#0f172a' }}>{val}</span>
            </div>
          ))}
          {post.url ? (
            <a href={post.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-0.5 text-[7px] font-bold mt-auto" style={{ color: '#3b82f6' }}>
              <ExternalLink size={7} />View
            </a>
          ) : (
            <div className="mt-auto h-2" />
          )}
        </div>
      </div>
    );
  };

  // ── Section Header ────────────────────────────────────────────────────────
  const SectionHeader: React.FC<{ label: string; Icon: React.ElementType; color: string }> = ({
    label,
    Icon,
    color,
  }) => (
    <div
      className="flex items-center gap-1.5 rounded-lg px-2 py-1 shrink-0 mb-1"
      style={{ backgroundColor: `${color}15`, border: `1px solid ${color}25` }}
    >
      <Icon size={9} style={{ color }} />
      <span className="text-[8px] font-bold uppercase tracking-wider" style={{ color }}>
        {label}
      </span>
    </div>
  );

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
              {config.clientName || '—'} — TikTok {modeLabel} Best &amp; Least
            </h1>
            <p
              className={`text-[10px] font-medium flex items-center gap-1 mt-1 uppercase tracking-wide ${isDark ? 'text-slate-300' : 'text-slate-500'}`}
            >
              <TrendingUp size={9} style={{ color: colorPrimary }} /> {config.period} · Highest
              &amp; Lowest 3
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

      {/* Body */}
      <div className="flex-1 flex gap-3 px-5 pt-2 pb-1 min-h-0 overflow-hidden">
        {/* Left: Highest + Lowest stacked */}
        <div className="flex flex-col gap-2 min-h-0" style={{ flex: '2 1 0' }}>
          {/* Highest */}
          <div className="flex flex-col min-h-0" style={{ flex: '1 1 0' }}>
            <SectionHeader label="Highest 3" Icon={TrendingUp} color={COLOR_HIGH} />
            <div className="flex gap-1.5 flex-1 min-h-0 overflow-hidden">
              {highest.length === 0 ? (
                <div
                  className="flex-1 flex items-center justify-center rounded-xl border-2 border-dashed text-[9px]"
                  style={{ color: isDark ? '#4b5563' : '#94a3b8', borderColor: theme.border }}
                >
                  No data
                </div>
              ) : (
                highest.map((p, i) => <PostCard key={i} post={p} rank={i + 1} color={COLOR_HIGH} />)
              )}
            </div>
          </div>

          {/* Lowest */}
          <div className="flex flex-col min-h-0" style={{ flex: '1 1 0' }}>
            <SectionHeader label="Lowest 3" Icon={TrendingDown} color={COLOR_LOW} />
            <div className="flex gap-1.5 flex-1 min-h-0 overflow-hidden">
              {lowest.length === 0 ? (
                <div
                  className="flex-1 flex items-center justify-center rounded-xl border-2 border-dashed text-[9px]"
                  style={{ color: isDark ? '#4b5563' : '#94a3b8', borderColor: theme.border }}
                >
                  No data
                </div>
              ) : (
                lowest.map((p, i) => <PostCard key={i} post={p} rank={i + 1} color={COLOR_LOW} />)
              )}
            </div>
          </div>
        </div>

        {/* Right: Analysis panel (full height) */}
        <div className="flex flex-col shrink-0 min-h-0" style={{ width: '28%' }}>
          <div className="flex items-center gap-0.5 shrink-0 mb-1" style={{ height: 20 }}>
            <Sparkles size={7} style={{ color: colorPrimary }} />
            <span
              className="text-[7px] font-bold uppercase tracking-wide"
              style={{ color: isDark ? '#e2e8f0' : '#475569' }}
            >
              Analysis
            </span>
          </div>
          <div
            className="flex-1 rounded-xl border overflow-hidden flex flex-col min-h-0"
            style={{
              backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
              borderColor: theme.border,
            }}
          >
            {/* Header bar */}
            <div
              className="flex items-center justify-between px-1.5 py-0.5 border-b shrink-0"
              style={{ borderColor: theme.border }}
            >
              <span
                className="text-[6px] font-bold uppercase"
                style={{ color: isDark ? '#94a3b8' : '#64748b' }}
              >
                Insight
              </span>
              <div className="flex items-center gap-0.5">
                {insight && !isEditing && (
                  <button
                    onClick={() => {
                      setEditValue(insight);
                      setIsEditing(true);
                    }}
                    className="text-[5.5px] px-1 py-0.5 rounded-full border"
                    style={{
                      color: isDark ? '#94a3b8' : '#64748b',
                      borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
                    }}
                  >
                    Edit
                  </button>
                )}
                {isEditing && (
                  <button
                    onClick={() => {
                      persistInsight(editValue);
                      setIsEditing(false);
                    }}
                    className="text-[5.5px] px-1 py-0.5 rounded-full border"
                    style={{ color: colorPrimary, borderColor: colorPrimary }}
                  >
                    Done
                  </button>
                )}
                {!isEditing && (
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="flex items-center gap-0.5 px-1 py-0.5 rounded-full text-[5.5px] border disabled:opacity-50"
                    style={{
                      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#eef2ff',
                      color: isDark ? '#94a3b8' : '#6366f1',
                      borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#c7d2fe',
                    }}
                  >
                    {isGenerating ? <Loader2 size={5} className="animate-spin" /> : <Sparkles size={5} />}
                    <span>AI</span>
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="px-1.5 py-1 flex-1 overflow-y-auto">
              {isGenerating ? (
                <div className="flex items-center gap-1 opacity-60">
                  <Sparkles size={6} className="text-indigo-500 animate-spin" />
                  <span className="text-[8px] text-indigo-500 animate-pulse">Analyzing…</span>
                </div>
              ) : isEditing ? (
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  autoFocus
                  className="w-full h-full resize-none text-[8px] leading-relaxed focus:outline-none bg-transparent"
                  style={{ color: isDark ? '#cbd5e1' : '#374151' }}
                />
              ) : insight ? (
                <InsightView
                  parsed={parsed}
                  isDark={isDark}
                  colorPrimary={colorPrimary}
                  onEdit={() => {
                    setEditValue(insight);
                    setIsEditing(true);
                  }}
                />
              ) : (
                <span
                  className="text-[8px] cursor-pointer"
                  style={{ color: isDark ? '#4b5563' : '#94a3b8' }}
                  onClick={handleGenerate}
                >
                  Click AI to generate.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hidden export data */}
      <div
        style={{ display: 'none' }}
        data-ic-tt-highest={JSON.stringify(highest)}
        data-ic-tt-lowest={JSON.stringify(lowest)}
        data-ic-tt-insight={insight}
        data-ic-tt-mode={mode}
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
