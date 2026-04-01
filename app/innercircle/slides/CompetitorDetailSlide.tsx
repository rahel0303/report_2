'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, Loader2, Sparkles } from 'lucide-react';
import { ReportConfig } from '@/app/types';
import { SlideFooter } from '@/app/components/ui/SlideFooter';
import { ChannelBadge } from '@/app/components/ui';
import { generateLayoutTheme } from '@/app/utils/themeStyles';
import { generateGeminiContent } from '@/app/utils/api';
import {
  COMP_DETAIL_ANALYST_SYSTEM_PROMPT,
  buildCompDetailPrompt,
  parseCompDetailInsight,
} from '@/app/innercircle/prompts/compDetailPrompt';

// competitor_page_detail.py equivalent
// Top 3 posts per channel (IG, TikTok, Twitter / X) for one competitor
// Layout: left panel (3 channel rows) + right panel (narrative)

interface IgPost {
  ig_engagement: number | null;
  permalink: string | null;
  image_url?: string | null;
}
interface TtPost {
  play_count: number | null;
  engagement_b: number | null;
  url: string | null;
  image_url?: string | null;
}
interface TwPost {
  engagement_b: number | null;
  url: string | null;
  image_url?: string | null;
}

interface Props {
  config: ReportConfig;
  competitor: string | null;
  isThumbnail?: boolean;
  currentPage?: number;
  totalPages?: number;
  onUpdate?: (key: string, value: unknown) => void;
  savedInsight?: string;
  onInsightChange?: (value: string) => void;
}

function fmtN(v: number | null): string {
  if (v === null || isNaN(v)) return '-';
  return v.toLocaleString();
}

// ── Single post card ────────────────────────────────────────────────────────
const PostCard: React.FC<{
  rank: number;
  badgeColor: string;
  metrics: { label: string; value: string }[];
  url: string | null;
  imageUrl?: string | null;
  channel: 'instagram' | 'tiktok' | 'twitter';
  isDark: boolean;
  border: string;
  cardBg: string;
}> = ({
  rank,
  badgeColor,
  metrics,
  url,
  imageUrl: initialImageUrl,
  channel,
  isDark,
  border,
  cardBg,
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(initialImageUrl ?? null);
  const [imgLoading, setImgLoading] = useState(!initialImageUrl && !!url);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (initialImageUrl) return;
    if (!url || fetchedRef.current) return;
    fetchedRef.current = true;
    const endpoint =
      channel === 'tiktok'
        ? `/api/innercircle/tt-thumbnail?url=${encodeURIComponent(url)}`
        : channel === 'twitter'
          ? `/api/innercircle/tw-thumbnail?url=${encodeURIComponent(url)}`
          : `/api/innercircle/ig-thumbnail?url=${encodeURIComponent(url)}&channel=instagram`;
    fetch(endpoint)
      .then((r) => r.json())
      .then((d) => {
        if (d.image_url) setImageUrl(d.image_url);
      })
      .catch(() => {})
      .finally(() => setImgLoading(false));
  }, [url, initialImageUrl, channel]);

  return (
    <div
      className="flex rounded-lg overflow-hidden border"
      style={{
        backgroundColor: cardBg,
        borderColor: border,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        width: '100%',
        height: '100%',
      }}
    >
      {/* Left: thumbnail — 38% width */}
      <div className="relative shrink-0" style={{ width: '38%' }}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`#${rank}`}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ display: 'block' }}
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }}
          >
            {imgLoading && (
              <Loader2 size={12} className="animate-spin" style={{ color: badgeColor }} />
            )}
          </div>
        )}
        <span
          className="absolute top-1 left-1 text-[8px] font-bold px-2 py-0.5 rounded text-white shadow whitespace-nowrap"
          style={{ backgroundColor: badgeColor, minWidth: '1.6rem', textAlign: 'center' }}
        >
          #{rank}
        </span>
      </div>

      {/* Right: metrics + link */}
      <div className="flex-1 flex flex-col justify-between p-1.5 min-w-0 overflow-hidden">
        <div className="space-y-0.5">
          {metrics.map((m) => (
            <div key={m.label} className="flex justify-between items-center gap-1">
              <span
                className="text-[7px] shrink-0"
                style={{ color: isDark ? '#94a3b8' : '#64748b' }}
              >
                {m.label}
              </span>
              <span
                className="text-[8px] font-semibold truncate"
                style={{ color: isDark ? '#e2e8f0' : '#1e293b' }}
              >
                {m.value}
              </span>
            </div>
          ))}
        </div>

        {/* Link */}
        <div
          className="flex justify-between items-center gap-1 pt-0.5 border-t mt-0.5"
          style={{ borderColor: `${border}50` }}
        >
          <span className="text-[7px]" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>
            Link
          </span>
          {url ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-0.5 text-[7px] font-semibold text-blue-500 hover:text-blue-600"
            >
              <ExternalLink size={7} />
              View
            </a>
          ) : (
            <span className="text-[7px]" style={{ color: isDark ? '#4b5563' : '#d1d5db' }}>
              —
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Channel row (header + 3 fixed-size slots) ───────────────────────────────
const ChannelRow: React.FC<{
  label: string;
  color: string;
  cards: React.ReactNode[];
  isDark: boolean;
  mutedColor: string;
  border: string;
}> = ({ label, color, cards, isDark, mutedColor, border }) => (
  <div className="flex flex-col gap-1 flex-1 min-h-0">
    {/* Channel header bar */}
    <div
      className="px-2 py-0.5 rounded-md text-white text-[8px] font-extrabold text-center tracking-wide shrink-0"
      style={{ backgroundColor: color }}
    >
      {label}
    </div>
    {/* Always 3 fixed-width slots */}
    <div className="flex gap-1.5 flex-1 min-h-0">
      {[0, 1, 2].map((i) =>
        cards[i] ? (
          <div key={i} className="flex-1 min-w-0 min-h-0">
            {cards[i]}
          </div>
        ) : (
          <div
            key={i}
            className="flex-1 rounded-lg border"
            style={{
              borderColor: isDark ? '#334155' : '#e2e8f0',
              backgroundColor: isDark ? 'rgba(255,255,255,0.01)' : '#fafafa',
              borderStyle: 'dashed',
            }}
          />
        ),
      )}
    </div>
  </div>
);

// ── Main slide ────────────────────────────────────────────────────────────────
export const CompetitorDetailSlide: React.FC<Props> = ({
  config,
  competitor,
  isThumbnail = false,
  currentPage,
  totalPages,
  savedInsight,
  onInsightChange,
}) => {
  const [igPosts, setIgPosts] = useState<IgPost[]>([]);
  const [ttPosts, setTtPosts] = useState<TtPost[]>([]);
  const [twPosts, setTwPosts] = useState<TwPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [insight, setInsight] = useState<string>(() => savedInsight || '');
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!config.clientName || !competitor || isThumbnail) return;
    setLoading(true);
    setError(null);
    fetch(
      `/api/innercircle/competitor-detail?brand=${encodeURIComponent(config.clientName)}&period=${encodeURIComponent(config.period)}&competitor=${encodeURIComponent(competitor)}`,
    )
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        setIgPosts(d.igPosts || []);
        setTtPosts(d.ttPosts || []);
        setTwPosts(d.twPosts || []);
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [config.clientName, config.period, competitor, isThumbnail]);

  const persistInsight = (text: string) => {
    setInsight(text);
    onInsightChange?.(text);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const prompt = buildCompDetailPrompt(
        competitor || 'Competitor',
        config.period,
        igPosts,
        ttPosts,
        twPosts,
      );
      const text = await generateGeminiContent(prompt, COMP_DETAIL_ANALYST_SYSTEM_PROMPT);
      persistInsight(text);
    } catch {
      persistInsight('Failed to generate insight.');
    } finally {
      setIsGenerating(false);
    }
  };

  const contentMode = config.coverDesign?.contentMode || 'light';
  const theme = generateLayoutTheme(
    config.coverDesign?.colors,
    config.theme?.brandColor,
    contentMode,
  );
  const isDark = contentMode === 'dark';
  const colorPrimary = theme.colors.primary;
  const mutedColor = isDark ? '#94a3b8' : '#64748b';
  const cardBg = isDark ? 'rgba(255,255,255,0.03)' : '#ffffff';

  const IG_COLOR = '#E1306C';
  const TT_COLOR = '#EE1D52';
  const TW_COLOR = '#1DA1F2';

  const renderBold = (text: string) =>
    text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
      part.startsWith('**') ? (
        <span key={i} className="font-bold" style={{ color: colorPrimary }}>
          {part.slice(2, -2)}
        </span>
      ) : (
        <span key={i}>{part}</span>
      ),
    );

  if (isThumbnail) {
    return (
      <div
        className="w-full h-full flex items-center justify-center"
        style={{ fontFamily: config.font?.name || 'Inter', background: theme.pageBg }}
      >
        <p
          className={`text-4xl font-bold text-center px-4 leading-snug ${isDark ? 'text-white' : 'text-slate-800'}`}
        >
          {competitor || config.clientName || '—'} — Detail
        </p>
      </div>
    );
  }

  // Build post card arrays
  const igCards = igPosts.map((pt, i) => (
    <PostCard
      key={i}
      rank={i + 1}
      badgeColor={IG_COLOR}
      metrics={[{ label: 'Engagement', value: fmtN(pt.ig_engagement) }]}
      url={pt.permalink}
      imageUrl={pt.image_url}
      channel="instagram"
      isDark={isDark}
      border={theme.border}
      cardBg={cardBg}
    />
  ));

  const ttCards = ttPosts.map((pt, i) => (
    <PostCard
      key={i}
      rank={i + 1}
      badgeColor={TT_COLOR}
      metrics={[
        { label: 'Views', value: fmtN(pt.play_count) },
        { label: 'Engagement', value: fmtN(pt.engagement_b) },
      ]}
      url={pt.url}
      imageUrl={pt.image_url}
      channel="tiktok"
      isDark={isDark}
      border={theme.border}
      cardBg={cardBg}
    />
  ));

  const twCards = twPosts.map((pt, i) => (
    <PostCard
      key={i}
      rank={i + 1}
      badgeColor={TW_COLOR}
      metrics={[{ label: 'Engagement', value: fmtN(pt.engagement_b) }]}
      url={pt.url}
      imageUrl={pt.image_url}
      channel="twitter"
      isDark={isDark}
      border={theme.border}
      cardBg={cardBg}
    />
  ));

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

      {/* Decorative blurs */}
      <div
        className="absolute -top-16 -right-16 w-40 h-40 rounded-full pointer-events-none"
        style={{ background: `${colorPrimary}18`, filter: 'blur(40px)' }}
      />
      <div
        className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full pointer-events-none"
        style={{ background: `${colorPrimary}12`, filter: 'blur(40px)' }}
      />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="px-5 pt-4 pb-2 shrink-0">
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
              {competitor || 'Competitor Detail'}
            </h1>
            <p
              className={`text-[10px] font-medium flex items-center gap-1.5 mt-1 uppercase tracking-wide ${isDark ? 'text-slate-300' : 'text-slate-500'}`}
            >
              {config.period} · Top 3 Posts per Channel
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <ChannelBadge channel="instagram" isDark={isDark} size="md" />
            <ChannelBadge channel="tiktok" isDark={isDark} size="md" />
            <ChannelBadge channel="twitter" isDark={isDark} size="md" />
            {loading && (
              <Loader2 size={14} className="animate-spin ml-1" style={{ color: colorPrimary }} />
            )}
          </div>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div className="flex-1 flex gap-3 px-5 py-2 overflow-hidden min-h-0">
        {/* Left: 3 channel rows */}
        <div className="flex-1 flex flex-col gap-1.5 min-w-0 overflow-hidden">
          <ChannelRow
            label="Instagram"
            color={IG_COLOR}
            cards={igCards}
            isDark={isDark}
            mutedColor={mutedColor}
            border={theme.border}
          />
          <ChannelRow
            label="TikTok"
            color={TT_COLOR}
            cards={ttCards}
            isDark={isDark}
            mutedColor={mutedColor}
            border={theme.border}
          />
          <ChannelRow
            label="Twitter / X"
            color={TW_COLOR}
            cards={twCards}
            isDark={isDark}
            mutedColor={mutedColor}
            border={theme.border}
          />
        </div>

        {/* Right: Narrative panel */}
        <div
          className="w-60 shrink-0 flex flex-col rounded-xl border overflow-hidden"
          style={{
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
            borderColor: theme.border,
            boxShadow: theme.cardShadow,
          }}
        >
          {/* Panel header */}
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
                  }}
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
                  {isGenerating ? (
                    <Loader2 size={9} className="animate-spin" />
                  ) : (
                    <Sparkles size={9} />
                  )}
                  <span>AI</span>
                </button>
              )}
            </div>
          </div>

          {/* Panel body */}
          <div className="flex-1 overflow-auto p-2 min-h-0">
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 opacity-70">
                <Sparkles size={16} className="text-indigo-500 animate-spin" />
                <span className="text-[9px] text-indigo-500 font-medium animate-pulse">
                  Analyzing…
                </span>
              </div>
            ) : isEditing ? (
              <div className="h-full flex flex-col gap-2">
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  maxLength={800}
                  autoFocus
                  className={`flex-1 text-[10px] leading-relaxed p-2 rounded border focus:outline-none resize-none w-full ${isDark ? 'bg-white/10 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                  placeholder="Type your analysis here…"
                />
                <div className="flex justify-end gap-2 shrink-0">
                  <button
                    onClick={() => setIsEditing(false)}
                    className={`text-[9px] px-2 py-1 rounded border ${isDark ? 'border-white/20 text-slate-400' : 'border-slate-200 text-slate-500'}`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      persistInsight(editValue);
                      setIsEditing(false);
                    }}
                    className="text-[9px] px-2 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : insight ? (
              <div
                data-ic-insight
                className="flex flex-col gap-1.5 cursor-pointer"
                onClick={() => {
                  setEditValue(insight);
                  setIsEditing(true);
                }}
              >
                {(() => {
                  const parsed = parseCompDetailInsight(insight);
                  const bodyColor = isDark ? '#cbd5e1' : '#475569';
                  const labelColor = isDark ? '#e2e8f0' : '#374151';
                  return (
                    <>
                      {parsed.analysis && (
                        <div
                          className="text-[10px] leading-relaxed font-medium"
                          style={{ color: bodyColor }}
                        >
                          {renderBold(parsed.analysis)}
                        </div>
                      )}
                      {parsed.recommendations.map((rec) => (
                        <div
                          key={rec.type}
                          className="text-[9px] leading-snug"
                          style={{ color: bodyColor }}
                        >
                          <span className="font-bold" style={{ color: labelColor }}>
                            • {rec.type}:{' '}
                          </span>
                          {renderBold(rec.text)}
                        </div>
                      ))}
                    </>
                  );
                })()}
              </div>
            ) : (
              <div
                className="flex flex-col items-center justify-center h-full gap-2 cursor-pointer group"
                onClick={() => {
                  setEditValue('');
                  setIsEditing(true);
                }}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all group-hover:scale-105 ${isDark ? 'bg-white/10' : 'bg-indigo-50'}`}
                >
                  <Sparkles size={14} style={{ color: colorPrimary }} />
                </div>
                <div className="text-center">
                  <p
                    className={`text-[9px] font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}
                  >
                    Click AI to generate
                  </p>
                  <p className={`text-[8px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    or click to write manually
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Error ──────────────────────────────────────────────────────────── */}
      {error && (
        <div className="mx-5 mb-1 px-3 py-1.5 rounded-lg text-[8px] bg-red-50 text-red-600 border border-red-200 shrink-0">
          {error}
        </div>
      )}

      {/* Hidden export data — read by exportHelpers.ts */}
      <div
        style={{ display: 'none' }}
        data-comp-detail={JSON.stringify({ competitor, igPosts, ttPosts, twPosts, insight })}
      />

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
  );
};
