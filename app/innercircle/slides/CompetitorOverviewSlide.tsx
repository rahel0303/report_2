'use client';

import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { ReportConfig } from '@/app/types';
import { SlideFooter } from '@/app/components/ui/SlideFooter';
import { ChannelBadge } from '@/app/components/ui';
import { generateLayoutTheme } from '@/app/utils/themeStyles';

// competitor_page_28.py equivalent
// 3 side-by-side tables: Instagram · TikTok · Twitter

interface IgRow {
  competitor: string;
  followers_inc: number | null;
  followers_growth: number | null;
  ig_engagement: number | null;
  ig_engagement_growth: number | null;
  er_folls: number | null;
}

interface TtRow {
  competitor: string;
  followers_growth: number | null;
  followers_growth_inc: number | null;
  engagement: number | null;
  engagement_inc: number | null;
  avg_views: number | null;
  avg_views_inc: number | null;
}

interface TwRow {
  competitor: string;
  followers_growth: number | null;
  followers_growth_inc: number | null;
  engagement: number | null;
  engagement_inc: number | null;
  er_folls: number | null;
}

interface Props {
  config: ReportConfig;
  isThumbnail?: boolean;
  currentPage?: number;
  totalPages?: number;
}

// ── Formatters matching competitor_page_28.py logic ──────────────────────────
function fmtN(v: number | null): string {
  if (v === null || isNaN(v)) return '-';
  if (Math.abs(v) >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
  if (Math.abs(v) >= 1_000) return (v / 1_000).toFixed(1) + 'K';
  return Math.round(v).toLocaleString();
}

/** fmt_pct: fraction (<2) → multiply by 100; else use as-is */
function fmtPct(v: number | null): string {
  if (v === null) return '';
  const pct = Math.abs(v) < 2 ? v * 100 : v;
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
}

/** fmt_er: same fraction heuristic, 2 decimals */
function fmtER(v: number | null): string {
  if (v === null) return '-';
  const pct = Math.abs(v) < 2 ? v * 100 : v;
  return `${pct.toFixed(2)}%`;
}

// ── GrowthCell: value (±growth%) with colored % ──────────────────────────────
const GrowthCell: React.FC<{
  val: number | null;
  growth: number | null;
  isDark: boolean;
  textColor: string;
}> = ({ val, growth, isDark, textColor }) => {
  const valStr = fmtN(val);
  const pctStr = growth !== null ? fmtPct(growth) : null;
  const numeric = growth !== null ? (Math.abs(growth) < 2 ? growth * 100 : growth) : 0;
  const pctColor = numeric >= 0 ? '#16a34a' : '#dc2626';
  return (
    <span
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        lineHeight: 1.2,
      }}
    >
      <span style={{ color: textColor }}>{valStr}</span>
      {pctStr && (
        <span style={{ color: pctColor, fontSize: '0.85em', fontWeight: 600 }}>{pctStr}</span>
      )}
    </span>
  );
};

// ── CompTable: generic colored-header table card ──────────────────────────────
const CompTable: React.FC<{
  title: string;
  accentColor: string;
  headers: string[];
  rows: React.ReactNode[][];
  isDark: boolean;
  cardBg: string;
  border: string;
  textColor: string;
  mutedColor: string;
}> = ({ title, accentColor, headers, rows, isDark, cardBg, border, textColor, mutedColor }) => (
  <div
    className="flex flex-col flex-1 rounded-xl border overflow-hidden self-start w-full"
    style={{
      backgroundColor: cardBg,
      borderColor: border,
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    }}
  >
    {/* Table body — no scroll, height follows content */}
    <div>
      <table className="w-full text-[10px] border-collapse">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                className="px-2 py-1.5 text-left font-bold border-b whitespace-nowrap"
                style={{
                  borderColor: border,
                  color: mutedColor,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
                  fontSize: 9,
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={headers.length}
                className="px-3 py-6 text-center text-[10px]"
                style={{ color: mutedColor }}
              >
                No data available for this period
              </td>
            </tr>
          ) : (
            rows.map((row, ri) => (
              <tr
                key={ri}
                style={{
                  backgroundColor:
                    ri % 2 === 0 ? cardBg : isDark ? 'rgba(255,255,255,0.025)' : '#f8fafc',
                }}
              >
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className="px-2 py-2 border-b"
                    style={{
                      borderColor: `${border}60`,
                      color: textColor,
                      whiteSpace: ci === 0 ? 'normal' : 'nowrap',
                      maxWidth: ci === 0 ? 100 : undefined,
                      wordBreak: ci === 0 ? 'break-word' : undefined,
                    }}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
);

// ── Main slide ────────────────────────────────────────────────────────────────
export const CompetitorOverviewSlide: React.FC<Props> = ({
  config,
  isThumbnail = false,
  currentPage,
  totalPages,
}) => {
  const [igTable, setIgTable] = useState<IgRow[]>([]);
  const [ttTable, setTtTable] = useState<TtRow[]>([]);
  const [twTable, setTwTable] = useState<TwRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insight, setInsight] = useState('');
  const [editingInsight, setEditingInsight] = useState(false);

  useEffect(() => {
    if (!config.clientName || isThumbnail) return;
    setLoading(true);
    setError(null);
    fetch(
      `/api/innercircle/competitor-overview?brand=${encodeURIComponent(config.clientName)}&period=${encodeURIComponent(config.period)}`,
    )
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        setIgTable(d.igTable || []);
        setTtTable(d.ttTable || []);
        setTwTable(d.twTable || []);
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
  const textColor = isDark ? '#e2e8f0' : '#1e293b';
  const mutedColor = isDark ? '#94a3b8' : '#64748b';
  const cardBg = isDark ? 'rgba(255,255,255,0.03)' : '#ffffff';

  // Platform accent colors
  const IG_COLOR = '#E1306C';
  const TT_COLOR = '#EE1D52';
  const TW_COLOR = '#1DA1F2';

  if (isThumbnail) {
    return (
      <div
        className="w-full h-full flex items-center justify-center"
        style={{ fontFamily: config.font?.name || 'Inter', background: theme.pageBg }}
      >
        <p
          className={`text-4xl font-bold text-center px-4 leading-snug ${isDark ? 'text-white' : 'text-slate-800'}`}
        >
          {config.clientName || '—'} — Competitor Overview
        </p>
      </div>
    );
  }

  // Build table rows
  const igRows: React.ReactNode[][] = igTable.map((r) => [
    <span key="c" className="font-semibold text-[10px]" style={{ color: textColor }}>
      {r.competitor}
    </span>,
    <GrowthCell
      key="fg"
      val={r.followers_inc}
      growth={r.followers_growth}
      isDark={isDark}
      textColor={textColor}
    />,
    <GrowthCell
      key="eg"
      val={r.ig_engagement}
      growth={r.ig_engagement_growth}
      isDark={isDark}
      textColor={textColor}
    />,
    <span key="er" style={{ color: textColor }}>
      {fmtER(r.er_folls)}
    </span>,
  ]);

  const ttRows: React.ReactNode[][] = ttTable.map((r) => [
    <span
      key="c"
      className={`font-semibold text-[10px]`}
      style={{
        color: r.competitor === 'MAIN BRAND' ? colorPrimary : textColor,
        fontWeight: r.competitor === 'MAIN BRAND' ? 800 : 600,
      }}
    >
      {r.competitor}
    </span>,
    <GrowthCell
      key="fg"
      val={r.followers_growth}
      growth={r.followers_growth_inc}
      isDark={isDark}
      textColor={textColor}
    />,
    <GrowthCell
      key="eg"
      val={r.engagement}
      growth={r.engagement_inc}
      isDark={isDark}
      textColor={textColor}
    />,
    <GrowthCell
      key="av"
      val={r.avg_views}
      growth={r.avg_views_inc}
      isDark={isDark}
      textColor={textColor}
    />,
  ]);

  const twRows: React.ReactNode[][] = twTable.map((r) => [
    <span key="c" className="font-semibold text-[10px]" style={{ color: textColor }}>
      {r.competitor}
    </span>,
    <GrowthCell
      key="fg"
      val={r.followers_growth}
      growth={r.followers_growth_inc}
      isDark={isDark}
      textColor={textColor}
    />,
    <GrowthCell
      key="eg"
      val={r.engagement}
      growth={r.engagement_inc}
      isDark={isDark}
      textColor={textColor}
    />,
    <span key="er" style={{ color: textColor }}>
      {fmtER(r.er_folls)}
    </span>,
  ]);

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
              {config.clientName || '—'} — Competitor Overview
            </h1>
            <p
              className={`text-[10px] font-medium flex items-center gap-1.5 mt-1 uppercase tracking-wide ${isDark ? 'text-slate-300' : 'text-slate-500'}`}
            >
              {config.period} · Competitor Analysis
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

      {/* ── 3 Tables ─────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3 px-5" style={{ flex: '2 1 0' }}>
        <CompTable
          title="Instagram"
          accentColor={IG_COLOR}
          headers={['Competitor', 'Followers Growth', 'Engagement', 'ER Folls']}
          rows={igRows}
          isDark={isDark}
          cardBg={cardBg}
          border={theme.border}
          textColor={textColor}
          mutedColor={mutedColor}
        />
        <CompTable
          title="TikTok"
          accentColor={TT_COLOR}
          headers={['Competitor', 'Followers Growth', 'Engagement', 'Avg Views']}
          rows={ttRows}
          isDark={isDark}
          cardBg={cardBg}
          border={theme.border}
          textColor={textColor}
          mutedColor={mutedColor}
        />
        <CompTable
          title="Twitter / X"
          accentColor={TW_COLOR}
          headers={['Competitor', 'Followers Growth', 'Engagement', 'ER Folls']}
          rows={twRows}
          isDark={isDark}
          cardBg={cardBg}
          border={theme.border}
          textColor={textColor}
          mutedColor={mutedColor}
        />
      </div>

      {/* ── Error ──────────────────────────────────────────────────────────── */}
      {error && (
        <div className="mx-5 mt-2 px-3 py-1.5 rounded-lg text-[9px] bg-red-50 text-red-600 border border-red-200 shrink-0">
          {error}
        </div>
      )}

      {/* ── Insight / Analysis box ──────────────────────────────────────────── */}
      <div
        className="shrink-0 mx-5 mt-2.5 mb-2 rounded-xl overflow-hidden"
        style={{
          backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : `${colorPrimary}08`,
          border: `1px solid ${colorPrimary}30`,
          flex: '1 1 0',
          minHeight: 130,
        }}
      >
        <div
          className="px-3 py-1.5 border-b flex items-center justify-between shrink-0"
          style={{ borderColor: `${colorPrimary}25` }}
        >
          <span
            className="text-[9px] font-bold uppercase tracking-wider"
            style={{ color: colorPrimary }}
          >
            Analysis & Insights
          </span>
          <button
            onClick={() => setEditingInsight(!editingInsight)}
            className="text-[8px] font-medium px-2 py-0.5 rounded"
            style={{
              color: editingInsight ? '#6b7280' : colorPrimary,
              backgroundColor: editingInsight ? '#f3f4f6' : `${colorPrimary}15`,
            }}
          >
            {editingInsight ? 'Done' : 'Edit'}
          </button>
        </div>
        {editingInsight ? (
          <textarea
            autoFocus
            className="w-full h-full bg-transparent resize-none outline-none px-3 py-2 text-[10px] leading-relaxed"
            style={{ color: isDark ? '#d1d5db' : '#374151', minHeight: 70 }}
            value={insight}
            placeholder="Add insights / analysis here…"
            onChange={(e) => setInsight(e.target.value)}
            onBlur={() => setEditingInsight(false)}
          />
        ) : (
          <p
            className="px-3 py-2 text-[10px] leading-relaxed cursor-text"
            style={{
              color: insight ? (isDark ? '#d1d5db' : '#475569') : isDark ? '#4b5563' : '#94a3b8',
            }}
            onClick={() => setEditingInsight(true)}
          >
            {insight || 'Click to add insights / analysis…'}
          </p>
        )}
      </div>

      {/* Hidden export data — read by exportHelpers.ts */}
      <div
        style={{ display: 'none' }}
        data-comp-overview={JSON.stringify({ igTable, ttTable, twTable, insight })}
      />

      <SlideFooter
        clientName={config.clientName}
        period={config.period}
        currentPage={currentPage ?? 1}
        totalPages={totalPages ?? 1}
        logo={config.coverDesign?.logoData}
        brandColor={config.coverDesign?.colors?.primary}
      />
    </div>
  );
};
