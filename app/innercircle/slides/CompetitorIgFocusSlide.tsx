'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ExternalLink, Loader2, Sparkles } from 'lucide-react';
import { ReportConfig } from '@/app/types';
import { SlideFooter } from '@/app/components/ui/SlideFooter';
import { ChannelBadge } from '@/app/components/ui';
import { generateLayoutTheme } from '@/app/utils/themeStyles';
import { generateGeminiContent } from '@/app/utils/api';
import {
  COMP_IG_FOCUS_ANALYST_SYSTEM_PROMPT,
  buildCompIgFocusPrompt,
  parseCompIgFocusInsight,
} from '@/app/innercircle/prompts/compIgFocusPrompt';

// competitor_instagram_focus.py equivalent
// Chapter 7: Competitor Instagram Focus
// Layout: Header | [Left: top-3 posts + growth chart + metrics table] [Right: narrative]

const IG_COLOR = '#E1306C';

// ── Interfaces ───────────────────────────────────────────────────────────────
interface IgPost {
  ig_engagement: number | null;
  likes: number | null;
  comments: number | null;
  er_folls: number | null;
  permalink: string | null;
  image_url?: string | null;
}

interface GrowthPoint {
  date: string;
  daily_foll_growth: number | null;
}

interface MainBrandRow {
  brand: string;
  followers_growth: number | null;
  followers_growth_gap: number | null;
  post_count: number | null;
  post_count_growth: number | null;
  total_engagement: number | null;
  total_engagement_gap: number | null;
  avg_er_folls_b: number | null;
}

interface CompRow {
  brand: string;
  ig_followers_increase: number | null;
  ig_followers_growth: number | null;
  post_count: number | null;
  post_count_growth: number | null;
  ig_engagement_b: number | null;
  ig_engagement_b_growth: number | null;
  er_folls: number | null;
}

interface Props {
  config: ReportConfig;
  competitor: string | null;
  isThumbnail?: boolean;
  currentPage?: number;
  totalPages?: number;
  savedInsight?: string;
  onInsightChange?: (value: string) => void;
}

// ── Formatters ───────────────────────────────────────────────────────────────
function fmtN(v: number | null): string {
  if (v === null || v === undefined || isNaN(v)) return '-';
  return v.toLocaleString();
}

function fmtPct(v: number | null): string {
  if (v === null || v === undefined) return '';
  const pct = Math.abs(v) < 2 ? v * 100 : v;
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
}

function fmtER(v: number | null): string {
  if (v === null || v === undefined) return '-';
  const pct = Math.abs(v) < 2 ? v * 100 : v;
  return `${pct.toFixed(2)}%`;
}

function shortDate(d: string): string {
  const dt = new Date(d);
  return dt.toLocaleDateString('en', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

// ── Mini post card ─ horizontal layout (image left | metrics right) ─────────
const MiniPostCard: React.FC<{
  rank: number;
  post: IgPost;
  isDark: boolean;
  border: string;
  cardBg: string;
  mutedColor: string;
  textColor: string;
}> = ({ rank, post, isDark, border, cardBg, mutedColor, textColor }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(post.image_url ?? null);
  const [imgLoading, setImgLoading] = useState(!post.image_url && !!post.permalink);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (post.image_url) return;
    if (!post.permalink || fetchedRef.current) return;
    fetchedRef.current = true;
    fetch(
      `/api/innercircle/ig-thumbnail?url=${encodeURIComponent(post.permalink)}&channel=instagram`,
    )
      .then((r) => r.json())
      .then((d) => {
        if (d.image_url) setImageUrl(d.image_url);
      })
      .catch(() => {})
      .finally(() => setImgLoading(false));
  }, [post.permalink, post.image_url]);

  return (
    <div
      className="flex-1 flex rounded-lg border overflow-hidden"
      style={{
        backgroundColor: cardBg,
        borderColor: border,
        boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
        height: '100%',
      }}
    >
      {/* Left: image — 44% width */}
      <div className="relative shrink-0" style={{ width: '44%' }}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`Post #${rank}`}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }}
          >
            {imgLoading && (
              <Loader2 size={14} className="animate-spin" style={{ color: IG_COLOR }} />
            )}
          </div>
        )}
        {/* Rank badge */}
        <span
          className="absolute top-1.5 left-1.5 text-[9px] font-extrabold text-white shadow"
          style={{
            backgroundColor: IG_COLOR,
            padding: '2px 7px',
            borderRadius: 4,
            minWidth: '2rem',
            textAlign: 'center',
            letterSpacing: '0.02em',
          }}
        >
          #{rank}
        </span>
      </div>

      {/* Right: metrics + link */}
      <div className="flex-1 flex flex-col justify-between p-1.5 min-w-0">
        <div className="flex flex-col gap-1">
          {[
            { label: 'Engagement', value: fmtN(post.ig_engagement) },
            { label: 'Likes', value: fmtN(post.likes) },
            { label: 'Comments', value: fmtN(post.comments) },
            { label: 'ER Folls', value: fmtER(post.er_folls) },
          ].map((m) => (
            <div key={m.label} className="flex flex-col">
              <span className="text-[6.5px]" style={{ color: mutedColor }}>
                {m.label}
              </span>
              <span className="text-[8.5px] font-bold" style={{ color: textColor }}>
                {m.value}
              </span>
            </div>
          ))}
        </div>

        {/* Link */}
        <div
          className="flex items-center justify-between pt-1 border-t mt-1"
          style={{ borderColor: `${border}60` }}
        >
          <span className="text-[7px]" style={{ color: mutedColor }}>
            Link
          </span>
          {post.permalink ? (
            <a
              href={post.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-0.5 text-[7px] font-semibold text-blue-500 hover:text-blue-600"
            >
              <ExternalLink size={7} />
              View Post
            </a>
          ) : (
            <span className="text-[7px]" style={{ color: mutedColor }}>
              —
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Metrics table row ─────────────────────────────────────────────────────────
const TableRow: React.FC<{
  values: string[];
  isHeader?: boolean;
  isDark: boolean;
  border: string;
  cardBg: string;
  textColor: string;
  mutedColor: string;
  isAlt?: boolean;
}> = ({ values, isHeader, isDark, border, cardBg, textColor, mutedColor, isAlt }) => {
  const bg = isHeader
    ? isDark
      ? '#1E293B'
      : '#F1F5F9'
    : isAlt
      ? isDark
        ? 'rgba(255,255,255,0.025)'
        : '#F8FAFC'
      : cardBg;

  return (
    <div className="flex" style={{ backgroundColor: bg, borderBottom: `1px solid ${border}50` }}>
      {values.map((v, i) => {
        // detect % growth pattern "123 (+4.5%)" and color the pct part
        const match = v.match(/^(.+?)\s*(\([+-]?\d+\.?\d*%\))$/);
        return (
          <div
            key={i}
            style={{
              flex: i === 0 ? '1.4 1 0' : '1 1 0',
              fontWeight: isHeader ? 700 : i === 0 ? 600 : 400,
              color: isHeader ? mutedColor : textColor,
              textAlign: i === 0 ? 'left' : 'right',
              fontSize: isHeader ? 10 : 11,
              padding: '10px 10px',
              borderRight: i < values.length - 1 ? `1px solid ${border}40` : undefined,
            }}
          >
            {!isHeader && match ? (
              <>
                <span>{match[1]} </span>
                <span
                  style={{
                    color: match[2].includes('-') ? '#dc2626' : '#16a34a',
                    fontSize: '0.85em',
                    fontWeight: 600,
                  }}
                >
                  {match[2]}
                </span>
              </>
            ) : (
              v
            )}
          </div>
        );
      })}
    </div>
  );
};

// ── Main slide ────────────────────────────────────────────────────────────────
export const CompetitorIgFocusSlide: React.FC<Props> = ({
  config,
  competitor,
  isThumbnail = false,
  currentPage,
  totalPages,
  savedInsight,
  onInsightChange,
}) => {
  const [top3, setTop3] = useState<IgPost[]>([]);
  const [growthSeries, setGrowthSeries] = useState<GrowthPoint[]>([]);
  const [mainBrandRow, setMainBrandRow] = useState<MainBrandRow | null>(null);
  const [compRow, setCompRow] = useState<CompRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [narrative, setNarrative] = useState<string>(() => savedInsight || '');
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!config.clientName || !competitor || isThumbnail) return;
    setLoading(true);
    setError(null);
    fetch(
      `/api/innercircle/competitor-ig-focus?brand=${encodeURIComponent(config.clientName)}&period=${encodeURIComponent(config.period)}&competitor=${encodeURIComponent(competitor)}`,
    )
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        setTop3(d.top3 || []);
        setGrowthSeries(d.growthSeries || []);
        setMainBrandRow(d.mainBrandRow ?? null);
        setCompRow(d.compRow ?? null);
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [config.clientName, config.period, competitor, isThumbnail]);

  const contentMode = config.coverDesign?.contentMode || 'light';
  const theme = generateLayoutTheme(
    config.coverDesign?.colors,
    config.theme?.brandColor,
    contentMode,
  );
  const isDark = contentMode === 'dark';
  const colorPrimary = theme.colors.primary;
  const textColor = isDark ? '#e2e8f0' : '#1e293b';
  const mutedColor = isDark ? '#94a3b8' : '#64748b';
  const cardBg = isDark ? 'rgba(255,255,255,0.03)' : '#ffffff';

  const persistNarrative = (text: string) => {
    setNarrative(text);
    onInsightChange?.(text);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const mainData = mainBrandRow
        ? {
            brand: mainBrandRow.brand,
            followers_growth: fmtN(mainBrandRow.followers_growth),
            followers_growth_gap: fmtPct(mainBrandRow.followers_growth_gap),
            post_count: fmtN(mainBrandRow.post_count),
            post_count_growth: fmtPct(mainBrandRow.post_count_growth),
            total_engagement: fmtN(mainBrandRow.total_engagement),
            total_engagement_gap: fmtPct(mainBrandRow.total_engagement_gap),
            avg_er_folls: fmtER(mainBrandRow.avg_er_folls_b),
          }
        : null;
      const compData = compRow
        ? {
            brand: compRow.brand,
            ig_followers_increase: fmtN(compRow.ig_followers_increase),
            ig_followers_growth: fmtPct(compRow.ig_followers_growth),
            post_count: fmtN(compRow.post_count),
            post_count_growth: fmtPct(compRow.post_count_growth),
            ig_engagement: fmtN(compRow.ig_engagement_b),
            ig_engagement_growth: fmtPct(compRow.ig_engagement_b_growth),
            er_folls: fmtER(compRow.er_folls),
          }
        : null;
      const top3Data = top3.slice(0, 3).map((p, i) => ({
        rank: i + 1,
        ig_engagement: fmtN(p.ig_engagement),
        likes: fmtN(p.likes),
        comments: fmtN(p.comments),
        er_folls: fmtER(p.er_folls),
      }));
      const prompt = buildCompIgFocusPrompt(
        config.clientName,
        config.period,
        mainData,
        compData,
        top3Data,
      );
      const text = await generateGeminiContent(prompt, COMP_IG_FOCUS_ANALYST_SYSTEM_PROMPT);
      persistNarrative(text);
    } catch {
      persistNarrative('Failed to generate insight.');
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
          {competitor || config.clientName || '—'} — IG Focus
        </p>
      </div>
    );
  }

  // Build chart data
  const chartData = growthSeries.map((g) => ({
    date: shortDate(g.date),
    value: g.daily_foll_growth ?? 0,
  }));

  // Build table rows
  const tableHeaders = ['Brand', 'Flw. Growth', 'Post Count', 'Engagement', 'ER Folls'];

  const buildRow = (row: MainBrandRow | CompRow | null, isMain: boolean): string[] => {
    if (!row) return [isMain ? config.clientName || '—' : competitor || '—', '-', '-', '-', '-'];
    if (isMain) {
      const r = row as MainBrandRow;
      return [
        r.brand || config.clientName || '—',
        `${fmtN(r.followers_growth)} (${fmtPct(r.followers_growth_gap)})`,
        `${fmtN(r.post_count)} (${fmtPct(r.post_count_growth)})`,
        `${fmtN(r.total_engagement)} (${fmtPct(r.total_engagement_gap)})`,
        fmtER(r.avg_er_folls_b),
      ];
    } else {
      const r = row as CompRow;
      return [
        r.brand || competitor || '—',
        `${fmtN(r.ig_followers_increase)} (${fmtPct(r.ig_followers_growth)})`,
        `${fmtN(r.post_count)} (${fmtPct(r.post_count_growth)})`,
        `${fmtN(r.ig_engagement_b)} (${fmtPct(r.ig_engagement_b_growth)})`,
        fmtER(r.er_folls),
      ];
    }
  };

  const mainRow = buildRow(mainBrandRow, true);
  const compRowData = buildRow(compRow, false);

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

      {/* ── Header ──────────────────────────────────────────────────────────── */}
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
              {competitor || 'Competitor'} — Instagram Focus
            </h1>
            <p
              className={`text-[10px] font-medium flex items-center gap-1.5 mt-1 uppercase tracking-wide ${isDark ? 'text-slate-300' : 'text-slate-500'}`}
            >
              {config.period} · Top Posts · Followers Growth · Performance
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <ChannelBadge channel="instagram" isDark={isDark} size="md" />
            {loading && (
              <Loader2 size={14} className="animate-spin ml-1" style={{ color: colorPrimary }} />
            )}
          </div>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex gap-3 px-5 pb-2 overflow-hidden min-h-0">
        {/* Left: posts + chart + table */}
        <div className="flex-1 flex flex-col gap-2 min-w-0 overflow-hidden min-h-0">
          {/* Top 3 posts row */}
          <div
            className="shrink-0 rounded-xl border overflow-hidden"
            style={{ backgroundColor: cardBg, borderColor: theme.border }}
          >
            {/* Platform label band */}
            <div
              className="px-3 py-1 text-white text-[8px] font-extrabold tracking-wide text-center"
              style={{ backgroundColor: IG_COLOR }}
            >
              Instagram · Top 3 Posts
            </div>
            <div className="flex gap-2 p-2" style={{ height: 155 }}>
              {[0, 1, 2].map((i) =>
                top3[i] ? (
                  <MiniPostCard
                    key={i}
                    rank={i + 1}
                    post={top3[i]}
                    isDark={isDark}
                    border={theme.border}
                    cardBg={isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC'}
                    mutedColor={mutedColor}
                    textColor={textColor}
                  />
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

          {/* Followers growth chart */}
          <div
            className="flex-1 rounded-xl border overflow-hidden flex flex-col min-h-0"
            style={{ backgroundColor: cardBg, borderColor: theme.border, minHeight: 100 }}
          >
            <div
              className="px-3 py-1 shrink-0 border-b text-[8px] font-bold uppercase tracking-wider"
              style={{
                borderColor: theme.border,
                backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
                color: mutedColor,
              }}
            >
              Daily Followers Growth
            </div>
            <div className="flex-1 min-h-0 px-2 py-1">
              {chartData.length === 0 ? (
                <div
                  className="w-full h-full flex items-center justify-center text-[9px]"
                  style={{ color: mutedColor }}
                >
                  No growth data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={isDark ? '#334155' : '#e2e8f0'}
                      strokeWidth={0.5}
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 7, fill: mutedColor }}
                      tickLine={false}
                      axisLine={{ stroke: theme.border }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 7, fill: mutedColor }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: number) => fmtN(v)}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#1e293b' : '#fff',
                        border: `1px solid ${theme.border}`,
                        borderRadius: 6,
                        fontSize: 9,
                        color: textColor,
                      }}
                      formatter={(v: number | undefined) => [fmtN(v ?? null), 'Growth']}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={IG_COLOR}
                      strokeWidth={1.5}
                      dot={chartData.length <= 15 ? { r: 2, fill: IG_COLOR } : false}
                      activeDot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Metrics comparison table */}
          <div
            className="shrink-0 rounded-xl border overflow-hidden"
            style={{ backgroundColor: cardBg, borderColor: theme.border }}
          >
            <TableRow
              values={tableHeaders}
              isHeader
              isDark={isDark}
              border={theme.border}
              cardBg={cardBg}
              textColor={textColor}
              mutedColor={mutedColor}
            />
            <TableRow
              values={mainRow}
              isDark={isDark}
              border={theme.border}
              cardBg={cardBg}
              textColor={textColor}
              mutedColor={mutedColor}
            />
            <TableRow
              values={compRowData}
              isAlt
              isDark={isDark}
              border={theme.border}
              cardBg={cardBg}
              textColor={textColor}
              mutedColor={mutedColor}
            />
          </div>
        </div>

        {/* Right: AI Analysis panel */}
        <div
          className="w-52 shrink-0 flex flex-col rounded-xl border overflow-hidden"
          style={{ backgroundColor: cardBg, borderColor: theme.border }}
        >
          {/* Panel header */}
          <div
            className="px-2 py-1.5 flex items-center justify-between shrink-0 border-b"
            style={{
              borderColor: theme.border,
              backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
            }}
          >
            <div className="flex items-center gap-1">
              <Sparkles size={9} style={{ color: colorPrimary }} />
              <span
                className="text-[8px] font-bold uppercase tracking-wider"
                style={{ color: colorPrimary }}
              >
                {competitor ? `${competitor} Insight` : 'Insight'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {narrative && !isEditing && (
                <button
                  onClick={() => {
                    setEditValue(narrative);
                    setIsEditing(true);
                  }}
                  className={`text-[7px] font-medium px-1.5 py-0.5 rounded border ${isDark ? 'text-slate-400 border-white/10 hover:bg-white/10' : 'text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                >
                  Edit
                </button>
              )}
              {!isEditing && (
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[7px] font-medium border disabled:opacity-50 ${isDark ? 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10' : 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100'}`}
                >
                  {isGenerating ? (
                    <Loader2 size={7} className="animate-spin" />
                  ) : (
                    <Sparkles size={7} />
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
                  maxLength={600}
                  autoFocus
                  className={`flex-1 text-[9px] leading-relaxed p-1.5 rounded border focus:outline-none resize-none w-full ${isDark ? 'bg-white/10 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                  placeholder="Type your analysis here…"
                />
                <div className="flex justify-end gap-1 shrink-0">
                  <button
                    onClick={() => setIsEditing(false)}
                    className={`text-[7px] px-2 py-0.5 rounded border ${isDark ? 'border-white/20 text-slate-400' : 'border-slate-200 text-slate-500'}`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      persistNarrative(editValue);
                      setIsEditing(false);
                    }}
                    className="text-[7px] px-2 py-0.5 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : narrative ? (
              <div
                data-ic-insight
                className="flex flex-col gap-1.5 cursor-pointer"
                onClick={() => {
                  setEditValue(narrative);
                  setIsEditing(true);
                }}
              >
                {(() => {
                  const parsed = parseCompIgFocusInsight(narrative);
                  const bodyColor = isDark ? '#cbd5e1' : '#475569';
                  const labelColor = isDark ? '#e2e8f0' : '#374151';
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
                  return (
                    <>
                      {parsed.analysis && (
                        <div
                          className="text-[9px] leading-relaxed font-medium"
                          style={{ color: bodyColor }}
                        >
                          {renderBold(parsed.analysis)}
                        </div>
                      )}
                      {parsed.recommendations.map((rec) => (
                        <div
                          key={rec.type}
                          className="text-[8.5px] leading-snug"
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
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all group-hover:scale-105 ${isDark ? 'bg-white/10' : 'bg-indigo-50'}`}
                >
                  <Sparkles size={13} style={{ color: colorPrimary }} />
                </div>
                <div className="text-center">
                  <p
                    className={`text-[8px] font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}
                  >
                    Click AI to generate
                  </p>
                  <p className={`text-[7px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    or click to write manually
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-5 mb-1 px-3 py-1.5 rounded-lg text-[8px] bg-red-50 text-red-600 border border-red-200 shrink-0">
          {error}
        </div>
      )}

      {/* Hidden export data */}
      <div
        style={{ display: 'none' }}
        data-comp-ig-focus={JSON.stringify({
          competitor,
          top3,
          growthSeries,
          mainBrandRow,
          compRow,
          insight: narrative,
        })}
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
