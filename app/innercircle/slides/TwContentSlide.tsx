'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, Loader2, Sparkles } from 'lucide-react';
import { ReportConfig } from '@/app/types';
import { SlideFooter } from '@/app/components/ui/SlideFooter';
import { ChannelBadge } from '@/app/components/ui';
import { generateLayoutTheme } from '@/app/utils/themeStyles';
import { generateGeminiContent } from '@/app/utils/api';
import {
  TW_CONTENT_ANALYST_SYSTEM_PROMPT,
  buildTwContentPrompt,
  parseTwContentInsight,
} from '@/app/innercircle/prompts/twContentPrompt';

// twitter_page_23.py — Content overview with brand-owned + non-brand (1 best per pillar)

interface TwContentPost {
  content_pillar: string;
  date: string;
  engagement: number;
  impressions: number;
  er: number;
  url: string;
  image_url?: string | null;
}

interface Props {
  config: ReportConfig;
  isThumbnail?: boolean;
  currentPage?: number;
  totalPages?: number;
  savedInsight?: string;
  onInsightChange?: (value: string) => void;
}

function fmtN(v: number): string {
  return v.toLocaleString();
}

function PostCard({
  post,
  isDark,
  theme,
  accentColor,
}: {
  post: TwContentPost;
  isDark: boolean;
  theme: any;
  accentColor: string;
}) {
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
      className="flex flex-col rounded-xl border overflow-hidden shrink-0"
      style={{ width: 150, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff', borderColor: theme.border, boxShadow: theme.cardShadow }}
    >
      <div className="px-2 py-1 shrink-0" style={{ backgroundColor: accentColor }}>
        <span className="text-[8px] font-bold text-white uppercase tracking-wide leading-tight block" style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}>
          {post.content_pillar || 'General'}
        </span>
      </div>
      <div className="relative flex-1 min-h-0" style={{ minHeight: 80 }}>
        {imgLoading ? (
          <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }}>
            <Loader2 size={14} className="animate-spin" style={{ color: accentColor }} />
          </div>
        ) : imageUrl ? (
          <img src={imageUrl} alt="tweet" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }}>
            <span className="text-[7px]" style={{ color: isDark ? '#4b5563' : '#94a3b8' }}>No image</span>
          </div>
        )}
      </div>
      <div
        className="shrink-0 px-2 py-1.5 flex flex-col gap-0.5"
        style={{ borderTop: `1px solid ${theme.border}`, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc' }}
      >
        <div className="grid grid-cols-3 gap-x-1">
          {[
            { label: 'Impress.', value: fmtN(post.impressions) },
            { label: 'Engage.', value: fmtN(post.engagement) },
            { label: 'ER', value: `${post.er?.toFixed(2)}%` },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col min-w-0">
              <span className="text-[6.5px] uppercase tracking-wide font-semibold truncate" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>{label}</span>
              <span className="text-[9px] font-bold truncate" style={{ color: isDark ? '#ffffff' : '#0f172a' }}>{value}</span>
            </div>
          ))}
        </div>
        {post.date && <p className="text-[7px]" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>{String(post.date).slice(0, 10)}</p>}
        {post.url && (
          <a href={post.url} target="_blank" rel="noreferrer" className="flex items-center gap-0.5 text-[7px] font-bold" style={{ color: '#3b82f6' }}>
            <ExternalLink size={7} />View
          </a>
        )}
      </div>
    </div>
  );
}

export const TwContentSlide: React.FC<Props> = ({
  config,
  isThumbnail = false,
  currentPage,
  totalPages,
  savedInsight,
  onInsightChange,
}) => {
  const [brandOwned, setBrandOwned] = useState<TwContentPost[]>([]);
  const [nonBrandOwned, setNonBrandOwned] = useState<TwContentPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [insight, setInsight] = useState<string>(() => savedInsight || '');
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const persistInsight = (text: string) => {
    setInsight(text);
    onInsightChange?.(text);
  };

  useEffect(() => {
    if (!config.clientName || isThumbnail) return;
    setLoading(true);
    setError(null);
    fetch(
      `/api/innercircle/tw-content?brand=${encodeURIComponent(config.clientName)}&period=${encodeURIComponent(config.period)}`,
    )
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        setBrandOwned(d.brandOwned || []);
        setNonBrandOwned(d.nonBrandOwned || []);
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

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const toSummary = (posts: TwContentPost[]) =>
        posts.map((p) => ({
          content_pillar: p.content_pillar || 'General',
          impressions: fmtN(p.impressions),
          engagement: fmtN(p.engagement),
          er: p.er?.toFixed(2) ?? '0',
        }));
      const prompt = buildTwContentPrompt(config.clientName, config.period, {
        brandOwned: toSummary(brandOwned),
        nonBrandOwned: toSummary(nonBrandOwned),
      });
      const text = await generateGeminiContent(prompt, TW_CONTENT_ANALYST_SYSTEM_PROMPT);
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
        <p className={`text-4xl font-bold text-center px-4 leading-snug ${isDark ? 'text-white' : 'text-slate-800'}`}>
          {config.clientName || '—'}{' — '}Twitter Content
        </p>
      </div>
    );
  }

  return (
    <div
      className="w-full h-full flex flex-col overflow-hidden relative pb-14"
      style={{ fontFamily: config.font?.name || 'Inter', background: theme.pageBg }}
    >
      <div className="absolute top-0 left-0 right-0 h-0.75 z-10" style={{ background: theme.accentLine }} />

      {/* Header */}
      <div className="px-5 pt-4 shrink-0">
        <div
          className="rounded-xl p-3.5 flex items-center justify-between relative overflow-hidden"
          style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff', border: `1px solid ${theme.border}`, boxShadow: theme.cardShadow }}
        >
          <div className="absolute top-0 left-0 w-1 h-full rounded-l-xl" style={{ background: theme.accentGradient }} />
          <div className="pl-3">
            <h1 className={`text-base font-bold tracking-tight leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {config.clientName || '—'}{' — '}Twitter Content Overview
            </h1>
            <p className={`text-[10px] font-medium mt-1 uppercase tracking-wide ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
              {config.period} &middot; by Impressions &middot; Brand-owned &amp; Per-pillar
            </p>
          </div>
          <div className="flex items-center gap-2">
            {loading && <Loader2 size={14} className="animate-spin text-slate-400" />}
            <ChannelBadge channel="twitter" isDark={isDark} size="md" />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex p-4 pt-3 gap-2.5 overflow-hidden min-h-0">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">Loading data...</div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center text-red-400 text-xs text-center p-4">{error}</div>
        ) : (
          <>
            {/* Left — stacked card sections */}
            <div className="flex flex-col gap-2 min-h-0" style={{ flex: '0 0 63%' }}>
              {/* Brand-owned */}
              <div
                className="rounded-xl border overflow-hidden flex flex-col"
                style={{ flex: '0 0 35%', minHeight: 0, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff', borderColor: theme.border, boxShadow: theme.cardShadow }}
              >
                <div className="h-0.5 shrink-0" style={{ backgroundColor: colorPrimary }} />
                <div className="px-3 pt-2 pb-1 shrink-0 flex items-center gap-1.5">
                  <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded" style={{ backgroundColor: colorPrimary, color: '#fff' }}>Brand-owned</span>
                  <span className={`text-[9px] ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>Top posts by impressions</span>
                </div>
                <div className="flex-1 flex gap-2 px-2 pb-2 min-h-0 overflow-x-auto">
                  {brandOwned.length > 0 ? (
                    brandOwned.map((p, i) => <PostCard key={i} post={p} isDark={isDark} theme={theme} accentColor={colorPrimary} />)
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">No brand-owned data</div>
                  )}
                </div>
              </div>

              {/* Non-brand */}
              <div
                className="rounded-xl border overflow-hidden flex flex-col"
                style={{ flex: '1 1 0', minHeight: 0, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff', borderColor: theme.border, boxShadow: theme.cardShadow }}
              >
                <div className="h-0.5 shrink-0" style={{ backgroundColor: '#0078D7' }} />
                <div className="px-3 pt-2 pb-1 shrink-0 flex items-center gap-1.5">
                  <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded" style={{ backgroundColor: '#0078D7', color: '#fff' }}>Non Brand-owned</span>
                  <span className={`text-[9px] ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>Best per content pillar</span>
                </div>
                <div className="flex-1 flex gap-2 px-2 pb-2 min-h-0 overflow-x-auto">
                  {nonBrandOwned.length > 0 ? (
                    nonBrandOwned.map((p, i) => <PostCard key={i} post={p} isDark={isDark} theme={theme} accentColor="#0078D7" />)
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">No non-brand data</div>
                  )}
                </div>
              </div>
            </div>

            {/* Right — Analysis panel */}
            <div
              className="flex-1 min-h-0 rounded-xl border flex flex-col overflow-hidden"
              style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff', boxShadow: theme.cardShadow, borderColor: theme.border }}
            >
              <div className="flex items-center justify-between px-3 py-2 border-b shrink-0" style={{ borderColor: theme.border }}>
                <div className="flex items-center gap-1.5">
                  <Sparkles size={11} style={{ color: colorPrimary }} />
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-700'}`}>Analysis</span>
                </div>
                <div className="flex items-center gap-1">
                  {insight && !isEditing && (
                    <button
                      onClick={() => { setEditValue(insight); setIsEditing(true); }}
                      className={`text-[9px] font-medium px-2 py-0.5 rounded-full border transition-all ${isDark ? 'text-slate-400 border-white/10 hover:bg-white/10' : 'text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                    >
                      Edit
                    </button>
                  )}
                  {!isEditing && (
                    <button
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium border transition-all disabled:opacity-50 ${isDark ? 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10' : 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100'}`}
                    >
                      {isGenerating ? <Loader2 size={9} className="animate-spin" /> : <Sparkles size={9} />}
                      <span>AI</span>
                    </button>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-auto p-3 min-h-0">
                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2 opacity-70">
                    <Sparkles size={20} className="text-indigo-500 animate-spin" />
                    <span className="text-[10px] text-indigo-500 font-medium animate-pulse">Analyzing…</span>
                  </div>
                ) : isEditing ? (
                  <div className="h-full flex flex-col gap-2">
                    <textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      maxLength={600}
                      autoFocus
                      className={`flex-1 text-[11px] leading-relaxed p-2 rounded border focus:outline-none resize-none w-full ${isDark ? 'bg-white/10 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                      placeholder="Type your analysis here…"
                    />
                    <div className="flex justify-end gap-2 shrink-0">
                      <button onClick={() => setIsEditing(false)} className={`text-[9px] px-3 py-1 rounded border ${isDark ? 'border-white/20 text-slate-400' : 'border-slate-200 text-slate-500'}`}>Cancel</button>
                      <button onClick={() => { persistInsight(editValue); setIsEditing(false); }} className="text-[9px] px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700">Save</button>
                    </div>
                  </div>
                ) : insight ? (
                  <div
                    data-ic-insight
                    className="flex flex-col gap-1.5 cursor-pointer"
                    onClick={() => { setEditValue(insight); setIsEditing(true); }}
                  >
                    {(() => {
                      const parsed = parseTwContentInsight(insight);
                      const bodyColor = isDark ? '#cbd5e1' : '#475569';
                      const labelColor = isDark ? '#e2e8f0' : '#374151';
                      const renderBold = (text: string) =>
                        text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
                          part.startsWith('**') ? (
                            <span key={i} className="font-bold" style={{ color: colorPrimary }}>{part.slice(2, -2)}</span>
                          ) : (
                            <span key={i}>{part}</span>
                          ),
                        );
                      return (
                        <>
                          {parsed.analysis && (
                            <div className="text-[11px] leading-relaxed font-medium" style={{ color: bodyColor }}>
                              {renderBold(parsed.analysis)}
                            </div>
                          )}
                          {parsed.recommendations.map((rec) => (
                            <div key={rec.type} className="text-[10px] leading-snug" style={{ color: bodyColor }}>
                              <span className="font-bold" style={{ color: labelColor }}>• {rec.type}: </span>
                              {renderBold(rec.text)}
                            </div>
                          ))}
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-3 cursor-pointer group" onClick={() => { setEditValue(''); setIsEditing(true); }}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all group-hover:scale-105 ${isDark ? 'bg-white/10' : 'bg-indigo-50'}`}>
                      <Sparkles size={16} style={{ color: colorPrimary }} />
                    </div>
                    <div className="text-center">
                      <p className={`text-[10px] font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Click AI to generate</p>
                      <p className={`text-[9px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>or click to write manually</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Hidden export data */}
      <div
        style={{ display: 'none' }}
        data-ic-tw-ct-brand={JSON.stringify(brandOwned)}
        data-ic-tw-ct-nonbrand={JSON.stringify(nonBrandOwned)}
        data-ic-tw-ct-insight={insight}
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
