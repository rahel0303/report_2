'use client';

import React, { useEffect, useState } from 'react';
import { Calendar, Users, Sparkles, Loader2, Send } from 'lucide-react';
import { ReportConfig } from '@/app/types';
import { SlideFooter } from '@/app/components/ui/SlideFooter';
import { generateLayoutTheme } from '@/app/utils/themeStyles';
import { generateGeminiContent } from '@/app/utils/api';
import { renderTextWithHighlights } from '@/app/utils/helpers';

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
  if (Math.abs(num) >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (Math.abs(num) >= 1_000) return (num / 1_000).toFixed(1) + 'K';
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
    <td className="py-2.5 px-2 text-center align-middle">
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

export const AllChannelOverviewSlide: React.FC<Props> = ({
  config,
  isThumbnail = false,
  currentPage,
  totalPages,
}) => {
  const [rows, setRows] = useState<ChannelRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Insight state
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

  const handleGenerateAI = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setIsGenerating(true);
    setShowAiInput(false);
    try {
      const contextData = rows.map((r) => ({
        channel: r.channel,
        followers: fmt(r.followers),
        monthlyGrowth: fmt(r.monthly_growth),
        monthlyGrowthPct: fmtPct(r.monthly_growth_pct).text,
        channelReach: fmt(r.channel_reach),
        engagement: fmt(r.engagement),
      }));
      const focusNote = aiPrompt ? `\n\nFocus: ${aiPrompt}` : '';
      const prompt = `Analyze all-channel social media performance for ${config.clientName} in ${config.period}:\n${JSON.stringify(contextData, null, 2)}${focusNote}\n\nGenerate 3 SHORT bullet points (start each with -). Each point MUST be under 150 characters. Use **bold** for key numbers/percentages. Focus on cross-channel comparison and notable trends. Write in English.`;
      const result = await generateGeminiContent(prompt);
      setInsight(result);
      setAiPrompt('');
    } catch (err) {
      console.error('AI generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveEdit = () => {
    setInsight(editValue);
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
        {/* Table card — shrink-0: fits content, no empty space below */}
        <div
          className="shrink-0 rounded-xl border overflow-hidden"
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
                      className={`py-2 px-2 font-bold uppercase tracking-wide border-b text-[9px] ${isDark ? 'text-slate-300 border-white/10' : 'text-slate-500 border-slate-200'}`}
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
                      <td className="py-2.5 px-2 align-middle">
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
                        className={`py-2.5 px-2 text-center align-middle font-semibold text-[11px] ${isDark ? 'text-slate-200' : 'text-slate-800'}`}
                      >
                        {fmt(row.followers)}
                      </td>
                      <td
                        className={`py-2.5 px-2 text-center align-middle text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-600'}`}
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
                      setShowAiInput(false);
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
                  onClick={() => {
                    setShowAiInput(!showAiInput);
                    setIsEditing(false);
                  }}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium border transition-all ${
                    showAiInput
                      ? isDark
                        ? 'bg-indigo-500/30 text-indigo-300 border-indigo-500/50'
                        : 'bg-indigo-100 text-indigo-700 border-indigo-200'
                      : isDark
                        ? 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                        : 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100'
                  }`}
                >
                  <Sparkles size={9} />
                  <span>{showAiInput ? 'Close AI' : 'AI Generate'}</span>
                </button>
              </div>
            )}
          </div>

          {/* AI prompt input row */}
          {showAiInput && !isThumbnail && (
            <div
              className="px-4 py-2 border-b shrink-0"
              style={{
                backgroundColor: isDark ? 'rgba(99,102,241,0.1)' : '#eef2ff',
                borderColor: isDark ? 'rgba(99,102,241,0.3)' : '#c7d2fe',
              }}
            >
              <form onSubmit={handleGenerateAI} className="flex gap-2">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Optional: describe what to focus on — e.g. 'highlight channel with highest growth' (max 150 chars)"
                  maxLength={150}
                  className={`flex-1 text-[10px] px-2 py-1.5 rounded border focus:outline-none focus:border-indigo-400 placeholder:opacity-50 ${
                    isDark
                      ? 'bg-white/10 border-white/10 text-white'
                      : 'bg-white border-indigo-200 text-slate-700'
                  }`}
                />
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="bg-indigo-600 text-white px-3 rounded hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center"
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

          {/* Content area */}
          <div className="flex-1 overflow-auto p-4 min-h-0">
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
              <div
                data-ic-insight
                data-insight-raw={insight}
                className={`text-[11px] leading-relaxed font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}
                style={{ cursor: isThumbnail ? 'default' : 'pointer' }}
                onClick={() => {
                  if (!isThumbnail) {
                    setEditValue(insight);
                    setIsEditing(true);
                  }
                }}
              >
                {renderTextWithHighlights(insight, isDark, colorPrimary)}
              </div>
            ) : !isThumbnail ? (
              <div
                className="flex flex-col items-center justify-center h-full gap-3 cursor-pointer group"
                onClick={() => {
                  setEditValue('');
                  setIsEditing(true);
                }}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform ${
                    isDark ? 'bg-white/10' : 'bg-slate-100'
                  }`}
                >
                  <Sparkles size={18} className={isDark ? 'text-slate-400' : 'text-slate-400'} />
                </div>
                <p
                  className={`text-[10px] font-medium text-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}
                >
                  Click to type manually
                  <br />
                  or use <span className="text-indigo-500 font-semibold">AI Generate</span> above
                </p>
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
        />
      </div>
    </div>
  );
};
