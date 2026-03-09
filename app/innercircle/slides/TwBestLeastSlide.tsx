'use client';

import React, { useEffect, useRef, useState } from 'react';
import { TrendingUp, TrendingDown, Sparkles, Loader2, Send, ExternalLink } from 'lucide-react';
import { ReportConfig } from '@/app/types';
import { SlideFooter } from '@/app/components/ui/SlideFooter';
import { ChannelBadge } from '@/app/components/ui';
import { generateLayoutTheme } from '@/app/utils/themeStyles';
import { generateGeminiContent } from '@/app/utils/api';
import { renderTextWithHighlights } from '@/app/utils/helpers';

// twitter_page_24.py — Top 3 & Bottom 3 posts by impressions

const COLOR_HIGH = '#16a34a';
const COLOR_LOW = '#dc2626';

interface TwPost {
  date: string;
  url: string;
  impressions: number;
  er: number;
  engagement: number;
  image_url?: string | null;
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

function fmtPct(v: number | null | undefined): string {
  if (v === null || v === undefined) return '-';
  return `${Number(v).toFixed(2)}%`;
}

function PostCard({
  post,
  rank,
  variant,
  isDark,
  theme,
}: {
  post: TwPost;
  rank: number;
  variant: 'high' | 'low';
  isDark: boolean;
  theme: any;
}) {
  const accentColor = variant === 'high' ? COLOR_HIGH : COLOR_LOW;
  const [imageUrl, setImageUrl] = useState<string | null>(post.image_url ?? null);
  const [imgLoading, setImgLoading] = useState(!post.image_url && !!post.url);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (post.image_url) return;
    if (!post.url || fetchedRef.current) return;
    fetchedRef.current = true;
    setImgLoading(true);
    fetch(`/api/innercircle/tw-thumbnail?url=${encodeURIComponent(post.url)}`)
      .then((r) => r.json())
      .then((d) => setImageUrl(d.image_url || null))
      .catch(() => setImageUrl(null))
      .finally(() => setImgLoading(false));
  }, [post.url, post.image_url]);

  return (
    <div
      className="flex flex-col rounded-xl border overflow-hidden flex-1 min-w-0"
      style={{
        backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff',
        borderColor: theme.border,
        boxShadow: theme.cardShadow,
      }}
    >
      {/* Image — top, fills remaining height */}
      <div className="relative flex-1 min-h-0">
        {imgLoading ? (
          <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }}>
            <Loader2 size={14} className="animate-spin" style={{ color: accentColor }} />
          </div>
        ) : imageUrl ? (
          <img src={imageUrl} alt={`Post #${rank + 1}`} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }}>
            <span className="text-[7px]" style={{ color: isDark ? '#4b5563' : '#94a3b8' }}>No image</span>
          </div>
        )}
        <span className="absolute top-1 left-1 font-bold text-white rounded px-1.5 py-0.5 text-[9px] leading-tight z-10" style={{ backgroundColor: accentColor }}>
          #{rank + 1}
        </span>
      </div>

      {/* Metrics — bottom, fixed height */}
      <div
        className="shrink-0 p-1.5 flex flex-col gap-0.5"
        style={{ borderTop: `1px solid ${theme.border}`, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc' }}
      >
        <div className="grid grid-cols-3 gap-x-1">
          {[
            { label: 'Impress.', val: fmtN(post.impressions) },
            { label: 'Engage.', val: fmtN(post.engagement) },
            { label: 'ER', val: fmtPct(post.er) },
          ].map(({ label, val }) => (
            <div key={label} className="flex flex-col min-w-0">
              <span className="text-[6.5px] uppercase tracking-wide font-semibold truncate" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>{label}</span>
              <span className="text-[9px] font-bold truncate" style={{ color: isDark ? '#ffffff' : '#0f172a' }}>{val}</span>
            </div>
          ))}
        </div>
        {post.date && <p className="text-[7px] truncate" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>{String(post.date).slice(0, 10)}</p>}
        {post.url && (
          <a href={post.url} target="_blank" rel="noreferrer" className="flex items-center gap-0.5 text-[7px] font-bold" style={{ color: '#3b82f6' }}>
            <ExternalLink size={7} />View
          </a>
        )}
      </div>
    </div>
  );
}

export const TwBestLeastSlide: React.FC<Props> = ({
  config,
  isThumbnail = false,
  currentPage,
  totalPages,
}) => {
  const [highest, setHighest] = useState<TwPost[]>([]);
  const [lowest, setLowest] = useState<TwPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [insight, setInsight] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAiInput, setShowAiInput] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');

  useEffect(() => {
    if (!config.clientName || isThumbnail) return;
    setLoading(true);
    setError(null);
    fetch(
      `/api/innercircle/tw-best-least?brand=${encodeURIComponent(config.clientName)}&period=${encodeURIComponent(config.period)}`,
    )
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        setHighest(d.highest || []);
        setLowest(d.lowest || []);
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

  const handleGenerate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setIsGenerating(true);
    setShowAiInput(false);
    try {
      const toStr = (posts: TwPost[], label: string) =>
        `${label}:\n` +
        posts
          .map(
            (p, i) =>
              `  ${i + 1}. Impressions=${fmtN(p.impressions)}, Eng=${fmtN(p.engagement)}, ER=${fmtPct(p.er)}`,
          )
          .join('\n');
      const ctx = [toStr(highest, 'Top 3'), toStr(lowest, 'Bottom 3')].join('\n');
      const text = await generateGeminiContent(
        `Analyze Twitter/X top & bottom posts for ${config.clientName} (${config.period}):\n${ctx}\n${aiPrompt ? `Focus: ${aiPrompt}` : ''}\nWrite 2-3 SHORT bullet points (start each with -). Use **bold** for key numbers.`,
      );
      setInsight(text);
    } catch {
      setInsight('Failed to generate insight.');
    } finally {
      setIsGenerating(false);
      setAiPrompt('');
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
          {config.clientName || '—'} — Twitter Best & Least
        </p>
      </div>
    );
  }

  return (
    <div
      className="w-full h-full flex flex-col overflow-hidden relative pb-14"
      style={{ fontFamily: config.font?.name || 'Inter', background: theme.pageBg }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-0.75 z-10"
        style={{ background: theme.accentLine }}
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
              {config.clientName || '—'} — Twitter Best &amp; Least
            </h1>
            <p
              className={`text-[10px] font-medium flex items-center gap-1 mt-1 uppercase tracking-wide ${isDark ? 'text-slate-300' : 'text-slate-500'}`}
            >
              <TrendingUp size={9} style={{ color: COLOR_HIGH }} className="inline" />
              <span>Top 3</span>
              <span className="opacity-40">·</span>
              <TrendingDown size={9} style={{ color: COLOR_LOW }} className="inline" />
              <span>Bottom 3</span>
              <span className="opacity-40">·</span>
              <span>{config.period} · by Impressions</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            {loading && <Loader2 size={14} className="animate-spin text-slate-400" />}
            <ChannelBadge channel="twitter" isDark={isDark} size="md" />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 p-4 pt-3 gap-2.5 overflow-hidden min-h-0 flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
            Loading data...
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center text-red-400 text-xs text-center p-4">
            {error}
          </div>
        ) : (
          <div className="flex flex-1 gap-2.5 min-h-0">
            {/* Left: cards */}
            <div className="flex flex-col gap-2 min-h-0" style={{ flex: '0 0 68%' }}>
              {/* Highest */}
              <div
                className="rounded-xl border overflow-hidden flex flex-col"
                style={{
                  flex: '1 1 0',
                  backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff',
                  borderColor: theme.border,
                  boxShadow: theme.cardShadow,
                }}
              >
                <div className="h-0.5" style={{ background: COLOR_HIGH }} />
                <div className="px-3 pt-2 pb-1 shrink-0 flex items-center gap-1.5">
                  <TrendingUp size={11} style={{ color: COLOR_HIGH }} />
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: COLOR_HIGH }}
                  >
                    Highest by Impressions
                  </span>
                </div>
                <div className="flex-1 flex gap-2 px-2 pb-2 min-h-0 overflow-hidden">
                  {highest.length > 0 ? (
                    highest.map((p, i) => (
                      <PostCard
                        key={i}
                        post={p}
                        rank={i}
                        variant="high"
                        isDark={isDark}
                        theme={theme}
                      />
                    ))
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
                      No data
                    </div>
                  )}
                </div>
              </div>
              {/* Lowest */}
              <div
                className="rounded-xl border overflow-hidden flex flex-col"
                style={{
                  flex: '1 1 0',
                  backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff',
                  borderColor: theme.border,
                  boxShadow: theme.cardShadow,
                }}
              >
                <div className="h-0.5" style={{ background: COLOR_LOW }} />
                <div className="px-3 pt-2 pb-1 shrink-0 flex items-center gap-1.5">
                  <TrendingDown size={11} style={{ color: COLOR_LOW }} />
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: COLOR_LOW }}
                  >
                    Lowest by Impressions
                  </span>
                </div>
                <div className="flex-1 flex gap-2 px-2 pb-2 min-h-0 overflow-hidden">
                  {lowest.length > 0 ? (
                    lowest.map((p, i) => (
                      <PostCard
                        key={i}
                        post={p}
                        rank={i}
                        variant="low"
                        isDark={isDark}
                        theme={theme}
                      />
                    ))
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
                      No data
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Insight */}
            <div
              className="flex-1 min-h-0 rounded-xl border flex flex-col overflow-hidden"
              style={{
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
                boxShadow: theme.cardShadow,
                borderColor: theme.border,
              }}
            >
              <div
                className="flex items-center justify-between px-3 py-2 border-b shrink-0"
                style={{ borderColor: theme.border }}
              >
                <div className="flex items-center gap-1.5">
                  <Sparkles size={11} style={{ color: colorPrimary }} />
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-700'}`}
                  >
                    Analysis
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {insight && !isEditing && (
                    <button
                      onClick={() => {
                        setEditValue(insight);
                        setIsEditing(true);
                        setShowAiInput(false);
                      }}
                      className={`text-[9px] font-medium px-2 py-0.5 rounded-full border transition-all ${isDark ? 'text-slate-400 border-white/10 hover:bg-white/10' : 'text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                    >
                      Edit
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowAiInput(!showAiInput);
                      setIsEditing(false);
                    }}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium border transition-all ${showAiInput ? (isDark ? 'bg-indigo-500/30 text-indigo-300 border-indigo-500/50' : 'bg-indigo-100 text-indigo-700 border-indigo-200') : isDark ? 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10' : 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100'}`}
                  >
                    <Sparkles size={9} />
                    <span>{showAiInput ? 'Close' : 'AI'}</span>
                  </button>
                </div>
              </div>
              {showAiInput && (
                <div
                  className="px-3 py-2 border-b shrink-0"
                  style={{
                    backgroundColor: isDark ? 'rgba(99,102,241,0.1)' : '#eef2ff',
                    borderColor: isDark ? 'rgba(99,102,241,0.3)' : '#c7d2fe',
                  }}
                >
                  <form onSubmit={handleGenerate} className="flex gap-2">
                    <input
                      type="text"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="Optional focus…"
                      maxLength={150}
                      className={`flex-1 text-[10px] px-2 py-1 rounded border focus:outline-none ${isDark ? 'bg-white/10 border-white/10 text-white' : 'bg-white border-indigo-200 text-slate-700'}`}
                    />
                    <button
                      type="submit"
                      disabled={isGenerating}
                      className="bg-indigo-600 text-white px-2.5 rounded hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center"
                    >
                      {isGenerating ? (
                        <Loader2 size={10} className="animate-spin" />
                      ) : (
                        <Send size={10} />
                      )}
                    </button>
                  </form>
                </div>
              )}
              <div className="flex-1 overflow-auto p-3 min-h-0">
                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2 opacity-70">
                    <Sparkles size={20} className="text-indigo-500 animate-spin" />
                    <span className="text-[10px] text-indigo-500 font-medium animate-pulse">
                      Analyzing…
                    </span>
                  </div>
                ) : isEditing ? (
                  <div className="h-full flex flex-col gap-2">
                    <textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      maxLength={500}
                      autoFocus
                      className={`flex-1 text-[11px] leading-relaxed p-2 rounded border focus:outline-none resize-none w-full ${isDark ? 'bg-white/10 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                      placeholder="Type your analysis here…"
                    />
                    <div className="flex justify-end gap-2 shrink-0">
                      <button
                        onClick={() => setIsEditing(false)}
                        className={`text-[9px] px-3 py-1 rounded border ${isDark ? 'border-white/20 text-slate-400' : 'border-slate-200 text-slate-500'}`}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          setInsight(editValue);
                          setIsEditing(false);
                        }}
                        className="text-[9px] px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : insight ? (
                  <div
                    data-ic-insight
                    className={`text-[11px] leading-relaxed font-medium cursor-pointer ${isDark ? 'text-slate-300' : 'text-slate-600'}`}
                    onClick={() => {
                      setEditValue(insight);
                      setIsEditing(true);
                    }}
                  >
                    {renderTextWithHighlights(insight, isDark, colorPrimary)}
                  </div>
                ) : (
                  <div
                    className="flex flex-col items-center justify-center h-full gap-3 cursor-pointer group"
                    onClick={() => {
                      setEditValue('');
                      setIsEditing(true);
                    }}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all group-hover:scale-105 ${isDark ? 'bg-white/10' : 'bg-indigo-50'}`}
                    >
                      <Sparkles size={16} style={{ color: colorPrimary }} />
                    </div>
                    <div className="text-center">
                      <p
                        className={`text-[10px] font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}
                      >
                        Add Analysis
                      </p>
                      <p className={`text-[9px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        Click to write or use AI
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hidden export data */}
      <div
        style={{ display: 'none' }}
        data-ic-tw-bl-highest={JSON.stringify(highest)}
        data-ic-tw-bl-lowest={JSON.stringify(lowest)}
        data-ic-tw-bl-insight={insight}
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
