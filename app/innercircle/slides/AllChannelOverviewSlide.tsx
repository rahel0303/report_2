'use client';

import React, { useEffect, useState } from 'react';
import { Calendar, Users, Sparkles, Loader2 } from 'lucide-react';
import { ReportConfig } from '@/app/types';
import { SlideFooter } from '@/app/components/ui/SlideFooter';
import { generateLayoutTheme } from '@/app/utils/themeStyles';
import { generateGeminiContent } from '@/app/utils/api';
import {
  ANALYST_AGENT_SYSTEM_PROMPT,
  buildAllChannelOverviewPrompt,
  parseInsightOutput,
  type ParsedInsight,
} from '@/app/innercircle/prompts/allChannelOverviewPrompt';

interface ChannelRow {
  channel: string;
  followers: number | null;
  ytd_growth: number | null;
  monthly_growth: number | null;
  monthly_growth_pct: number | null;
  channel_reach: number | null;
  channel_reach_pct: number | null;
  profile_visit: number | null;
  profile_visit_pct: number | null;
  engagement: number | null;
  engagement_pct: number | null;
}

interface Props {
  config: ReportConfig;
  isThumbnail?: boolean;
  currentPage?: number;
  totalPages?: number;
  savedInsight?: string;
  onInsightChange?: (value: string) => void;
}

const CHANNEL_COLOR: Record<string, string> = {
  Instagram: '#E1306C',
  TikTok: '#010101',
  Facebook: '#1877F2',
  Twitter: '#1DA1F2',
};

const CHANNEL_ORDER = ['Instagram', 'TikTok', 'Facebook', 'Twitter'];


function fmt(val: number | null): string {
  if (val === null || val === undefined) return '-';
  const num = Number(val);
  if (isNaN(num)) return '-';
  return num.toLocaleString();
}

function fmtPct(raw: number | null): { text: string; positive: boolean | null } {
  if (raw === null || raw === undefined) return { text: '-', positive: null };
  const num = Number(raw);
  if (isNaN(num)) return { text: '-', positive: null };
  const val = Math.abs(num) < 2 ? num * 100 : num;
  const sign = val > 0 ? '+' : '';
  return { text: `${sign}${val.toFixed(1)}%`, positive: val > 0 };
}

const MetricCell: React.FC<{ base: number | null; pct: number | null }> = ({ base, pct }) => {
  const { text, positive } = fmtPct(pct);
  const pillBg = positive === true ? '#dcfce7' : positive === false ? '#fee2e2' : '#f1f5f9';
  const pillColor = positive === true ? '#15803d' : positive === false ? '#b91c1c' : '#94a3b8';
  return (
    <td className="py-1.5 px-2 text-center align-middle">
      <div className="font-semibold text-[11px] text-slate-800 leading-none">{fmt(base)}</div>
      {text !== '-' && (
        <div className="flex justify-center mt-1">
          <span
            className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-bold tracking-wide leading-none"
            style={{ backgroundColor: pillBg, color: pillColor }}
          >
            {text}
          </span>
        </div>
      )}
    </td>
  );
};

// ─── inline bold renderer (no block wrapper) ─────────────────
const renderBoldInline = (text: string, color: string) =>
  text.split(/(\*\*.*?\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <span key={i} className="font-bold" style={{ color }}>{part.slice(2, -2)}</span>
      : <span key={i}>{part}</span>,
  );

// ─── InsightView ─────────────────────────────────────────────
const InsightView: React.FC<{
  raw: string;
  isDark: boolean;
  colorPrimary: string;
  isThumbnail: boolean;
  onEdit: () => void;
}> = ({ raw, isDark, colorPrimary, isThumbnail, onEdit }) => {
  const parsed: ParsedInsight = React.useMemo(() => parseInsightOutput(raw), [raw]);
  const bodyColor = isDark ? 'text-slate-300' : 'text-slate-600';
  const labelColor = isDark ? 'text-slate-200' : 'text-slate-700';

  return (
    <div
      data-ic-insight
      data-insight-raw={raw}
      className="flex flex-col gap-2 w-full min-w-0 overflow-hidden"
      style={{ cursor: isThumbnail ? 'default' : 'pointer' }}
      onClick={() => { if (!isThumbnail) onEdit(); }}
    >
      {parsed.analysis && (
        <div
          className={`text-[11px] leading-relaxed font-medium break-words ${bodyColor}`}
          style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}
        >
          {renderBoldInline(parsed.analysis, colorPrimary)}
        </div>
      )}

      {parsed.recommendations.length > 0 && (
        <div className="flex flex-col gap-1 w-full min-w-0">
          {parsed.recommendations.map((rec) => (
            <div
              key={rec.type}
              className={`text-[10px] leading-snug break-words ${bodyColor}`}
              style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}
            >
              <span className={`font-bold ${labelColor}`}>• {rec.type}: </span>
              {renderBoldInline(rec.text, colorPrimary)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────

export const AllChannelOverviewSlide: React.FC<Props> = ({
  config,
  isThumbnail = false,
  currentPage,
  totalPages,
  savedInsight,
  onInsightChange,
}) => {
  const [rows, setRows] = useState<ChannelRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Insight state
  const [insight, setInsight] = useState(savedInsight || '');
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!config.clientName || isThumbnail) return;
    setLoading(true);
    setError(null);
    fetch(
      `/api/innercircle/all-channel-overview?brand=${encodeURIComponent(config.clientName)}&period=${encodeURIComponent(config.period)}`,
    )
      .then((r) => r.json())
      .then((d) => {
        if (d.error && !d.data?.length) setError(d.error);
        const sorted = (d.data || []).sort(
          (a: ChannelRow, b: ChannelRow) =>
            CHANNEL_ORDER.indexOf(a.channel) - CHANNEL_ORDER.indexOf(b.channel),
        );
        setRows(sorted);
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [config.clientName, config.period]);

  const contentMode = config.coverDesign?.contentMode || 'light';
  const theme = generateLayoutTheme(
    config.coverDesign?.colors,
    config.theme?.brandColor,
    contentMode,
  );
  const isDark = contentMode === 'dark';
  const colorPrimary = theme.colors.primary;

  const COLS = [
    { label: 'Channel', w: '14%', align: 'left' as const },
    { label: 'Followers', w: '12%', align: 'center' as const },
    { label: 'YTD Growth', w: '11%', align: 'center' as const },
    { label: 'Monthly Growth', w: '14%', align: 'center' as const },
    { label: 'Channel Reach', w: '14%', align: 'center' as const },
    { label: 'Profile Visit', w: '14%', align: 'center' as const },
    { label: 'Total Engagement', w: '21%', align: 'center' as const },
  ];

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    try {
      const channelData = rows.map((r) => ({
        channel: r.channel,
        followers: fmt(r.followers),
        ytd_growth: fmt(r.ytd_growth),
        monthly_growth: fmt(r.monthly_growth),
        monthly_growth_pct: fmtPct(r.monthly_growth_pct).text,
        channel_reach: fmt(r.channel_reach),
        channel_reach_pct: fmtPct(r.channel_reach_pct).text,
        profile_visit: fmt(r.profile_visit),
        profile_visit_pct: fmtPct(r.profile_visit_pct).text,
        engagement: fmt(r.engagement),
        engagement_pct: fmtPct(r.engagement_pct).text,
      }));
      const prompt = buildAllChannelOverviewPrompt(config.clientName, config.period, channelData);
      const result = await generateGeminiContent(prompt, ANALYST_AGENT_SYSTEM_PROMPT);
      setInsight(result);
      onInsightChange?.(result);
    } catch (err) {
      console.error('AI generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveEdit = () => {
    setInsight(editValue);
    onInsightChange?.(editValue);
    setIsEditing(false);
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
          {config.clientName || '—'}
          {' — '}All Channel Overview
        </p>
      </div>
    );
  }

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

      {/* Header card — LayoutOverview style with left accent bar */}
      <div className="px-5 pt-4 shrink-0">
        <div
          className="rounded-xl p-4 flex items-center justify-between relative overflow-hidden"
          style={{
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
            border: `1px solid ${theme.border}`,
            boxShadow: theme.cardShadow,
          }}
        >
          {/* Left accent bar */}
          <div
            className="absolute top-0 left-0 w-1 h-full rounded-l-xl"
            style={{ background: theme.accentGradient }}
          />
          <div className="pl-3">
            <h1
              className={`text-base font-bold tracking-tight leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}
            >
              {config.clientName || '…'} — All Channel Overview
            </h1>
            <p
              className={`text-[10px] font-medium flex items-center gap-1 mt-1 uppercase tracking-wide ${isDark ? 'text-slate-300' : 'text-slate-500'}`}
            >
              <Calendar size={9} /> {config.period} Report
            </p>
          </div>
          <div className="flex items-center gap-5">
            {config.coverDesign?.logoData && (
              <img
                src={config.coverDesign.logoData}
                alt="logo"
                className="shrink-0 h-9 w-auto object-contain"
              />
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col p-4 pt-3 gap-3 overflow-hidden min-h-0">
        {/* Table card — fixed height, analysis panel gets the rest */}
        <div
          className="shrink-0 rounded-xl border overflow-hidden"
          style={{ maxHeight: '42%' }}
          style={{
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
            boxShadow: theme.cardShadow,
            borderColor: theme.border,
          }}
        >
          <div className="h-0.5" style={{ background: theme.accentLine }} />
          <div
            className="flex items-center gap-2 px-4 py-2 border-b"
            style={{ borderColor: theme.border }}
          >
            <Users size={11} style={{ color: colorPrimary }} />
            <span
              className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-700'}`}
            >
              Performance Overview
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8 text-slate-400 text-sm">
              Loading data…
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8 text-red-400 text-xs p-4 text-center">
              {error}
            </div>
          ) : rows.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-slate-400 text-sm">
              No data available for {config.clientName} · {config.period}
            </div>
          ) : (
            <table data-ic-table className="w-full border-collapse text-[11px]">
              <thead>
                <tr style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : '#f8fafc' }}>
                  {COLS.map((c) => (
                    <th
                      key={c.label}
                      className={`py-1.5 px-2 font-bold uppercase tracking-wide border-b text-[9px] ${isDark ? 'text-slate-300 border-white/10' : 'text-slate-500 border-slate-200'}`}
                      style={{ width: c.w, textAlign: c.align }}
                    >
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const color = CHANNEL_COLOR[row.channel] || '#64748b';
                  return (
                    <tr
                      key={row.channel}
                      className={
                        isDark
                          ? i % 2 === 0
                            ? 'bg-white/5'
                            : 'bg-transparent'
                          : i % 2 === 0
                            ? 'bg-white'
                            : 'bg-slate-50/70'
                      }
                    >
                      <td className="py-1.5 px-2 align-middle">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span
                            className={`font-semibold text-[11px] ${isDark ? 'text-white' : 'text-slate-800'}`}
                          >
                            {row.channel}
                          </span>
                        </div>
                      </td>
                      <td
                        className={`py-1.5 px-2 text-center align-middle font-semibold text-[11px] ${isDark ? 'text-slate-200' : 'text-slate-800'}`}
                      >
                        {fmt(row.followers)}
                      </td>
                      <td
                        className={`py-1.5 px-2 text-center align-middle text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-600'}`}
                      >
                        {fmt(row.ytd_growth)}
                      </td>
                      <MetricCell base={row.monthly_growth} pct={row.monthly_growth_pct} />
                      <MetricCell base={row.channel_reach} pct={row.channel_reach_pct} />
                      <MetricCell base={row.profile_visit} pct={row.profile_visit_pct} />
                      <MetricCell base={row.engagement} pct={row.engagement_pct} />
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Analysis / Insight panel — flex-1 fills remaining space (larger box) */}
        <div
          className="flex-1 min-h-0 rounded-xl border flex flex-col overflow-hidden"
          style={{
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
            boxShadow: theme.cardShadow,
            borderColor: theme.border,
          }}
        >
          {/* Panel header */}
          <div
            className="flex items-center justify-between px-4 py-2 border-b shrink-0"
            style={{ borderColor: theme.border }}
          >
            <div className="flex items-center gap-2">
              <Sparkles size={11} style={{ color: colorPrimary }} />
              <span
                className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-700'}`}
              >
                Analysis
              </span>
            </div>
            {!isThumbnail && (
              <div className="flex items-center gap-1">
                {insight && !isEditing && (
                  <button
                    onClick={() => {
                      setEditValue(insight);
                      setIsEditing(true);
                    }}
                    className={`text-[9px] font-medium px-2 py-0.5 rounded-full border transition-all ${
                      isDark
                        ? 'text-slate-400 border-white/10 hover:bg-white/10'
                        : 'text-slate-500 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Edit
                  </button>
                )}
                <button
                  onClick={handleGenerateAI}
                  disabled={isGenerating || rows.length === 0}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                    isDark
                      ? 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                      : 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100'
                  }`}
                >
                  {isGenerating ? (
                    <Loader2 size={9} className="animate-spin" />
                  ) : (
                    <Sparkles size={9} />
                  )}
                  <span>{isGenerating ? 'Generating…' : 'AI Generate'}</span>
                </button>
              </div>
            )}
          </div>


          {/* Content area */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 min-h-0 min-w-0">
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 opacity-70">
                <Sparkles size={20} className="text-indigo-500 animate-spin" />
                <span className="text-[10px] text-indigo-500 font-medium animate-pulse">
                  Analyzing data…
                </span>
              </div>
            ) : isEditing && !isThumbnail ? (
              <div className="h-full flex flex-col gap-2">
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  maxLength={500}
                  autoFocus
                  className={`flex-1 text-[11px] leading-relaxed p-2 rounded border focus:outline-none resize-none w-full ${
                    isDark
                      ? 'bg-white/10 border-white/10 text-white placeholder:text-slate-500'
                      : 'bg-slate-50 border-slate-200 text-slate-700 placeholder:text-slate-400'
                  }`}
                  placeholder="Type your analysis here…"
                />
                <div className="flex justify-end gap-2 shrink-0">
                  <button
                    onClick={() => setIsEditing(false)}
                    className={`text-[9px] px-3 py-1 rounded border ${
                      isDark ? 'border-white/20 text-slate-400' : 'border-slate-200 text-slate-500'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="text-[9px] px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : insight ? (
              <InsightView
                raw={insight}
                isDark={isDark}
                colorPrimary={colorPrimary}
                isThumbnail={isThumbnail}
                onEdit={() => {
                  setEditValue(insight);
                  setIsEditing(true);
                }}
              />
            ) : !isThumbnail ? (
              <div
                className="flex items-center justify-center h-full cursor-pointer group"
                onClick={() => { setEditValue(''); setIsEditing(true); }}
              >
                <Sparkles size={16} className={`group-hover:scale-110 transition-transform ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
              </div>
            ) : (
              <div className={`text-[10px] italic ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                No analysis added
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
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
