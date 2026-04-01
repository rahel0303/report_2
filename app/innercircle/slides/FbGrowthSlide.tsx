'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
} from 'recharts';
import { BarChart2, Sparkles, Loader2 } from 'lucide-react';
import { ReportConfig } from '@/app/types';
import { SlideFooter } from '@/app/components/ui/SlideFooter';
import { ChannelBadge } from '@/app/components/ui';
import { generateLayoutTheme } from '@/app/utils/themeStyles';
import { generateGeminiContent } from '@/app/utils/api';
import {
  FB_GROWTH_ANALYST_SYSTEM_PROMPT,
  buildFbGrowthPrompt,
  parseFbGrowthInsight,
} from '@/app/innercircle/prompts/fbGrowthPrompt';

// facebook_page_26.py — Follows (left, blue) + Likes (right, orange) dual-axis + Engagement bar + overview table

const FB_BLUE = '#2980B9'; // Follows — left axis
const FB_ORANGE = '#E67E22'; // Likes   — right axis
const FB_BAR = '#3498DB'; // Engagement bar

const TABLE_HEADERS = ['Month', 'Post Count', 'Fans Growth', 'Post Reach', 'Engagement'];

interface DailyPoint {
  date: string;
  follows: number;
  likes: number;
  engagement: number;
}

interface TableRow {
  month: string;
  post_count: string;
  fans_growth: string;
  post_reach: string;
  engagement: string;
}

interface Props {
  config: ReportConfig;
  isThumbnail?: boolean;
  currentPage?: number;
  totalPages?: number;
  savedInsight?: string;
  onInsightChange?: (value: string) => void;
}

function shortDate(d: string): string {
  try {
    const dt = new Date(d);
    return `${String(dt.getUTCDate()).padStart(2, '0')} ${dt.toLocaleString('en', { month: 'short', timeZone: 'UTC' })}`;
  } catch {
    return d;
  }
}

function fmtK(n: number): string {
  return n.toLocaleString();
}

export const FbGrowthSlide: React.FC<Props> = ({
  config,
  isThumbnail = false,
  currentPage,
  totalPages,
  savedInsight,
  onInsightChange,
}) => {
  const [chartData, setChartData] = useState<DailyPoint[]>([]);
  const [tableRows, setTableRows] = useState<TableRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [insight, setInsight] = useState<string>(() => savedInsight || '');
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!config.clientName || isThumbnail) return;
    setLoading(true);
    setError(null);
    fetch(
      `/api/innercircle/fb-growth?brand=${encodeURIComponent(config.clientName)}&period=${encodeURIComponent(config.period)}`,
    )
      .then((r) => r.json())
      .then((d) => {
        if (d.error && !d.chartData?.length) setError(d.error);
        setChartData(d.chartData || []);
        setTableRows(d.tableRows || []);
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

  const mapped = useMemo(
    () => chartData.map((r) => ({ ...r, date: shortDate(r.date) })),
    [chartData],
  );

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const promptRows = tableRows.map((r) => ({
        month: r.month,
        post_count: r.post_count,
        fans_growth: r.fans_growth,
        post_reach: r.post_reach,
        engagement: r.engagement,
      }));
      const prompt = buildFbGrowthPrompt(config.clientName, config.period, promptRows);
      const text = await generateGeminiContent(prompt, FB_GROWTH_ANALYST_SYSTEM_PROMPT);
      setInsight(text);
      onInsightChange?.(text);
    } catch {
      setInsight('Failed to generate insight.');
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
          {config.clientName || '—'} — Facebook Growth
        </p>
      </div>
    );
  }

  const tickStyle = { fontSize: 7, fill: '#94a3b8' };
  const axisLine = { stroke: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0' };
  const gridLine = isDark ? 'rgba(255,255,255,0.08)' : '#e8edf3';

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
              {config.clientName || '—'} — Facebook Growth
            </h1>
            <p
              className={`text-[10px] font-medium flex items-center gap-1 mt-1 uppercase tracking-wide ${isDark ? 'text-slate-300' : 'text-slate-500'}`}
            >
              <BarChart2 size={9} style={{ color: colorPrimary }} /> {config.period} · Follows ·
              Likes · Engagement
            </p>
          </div>
          <div className="flex items-center gap-2">
            {loading && <Loader2 size={14} className="animate-spin text-slate-400" />}
            <ChannelBadge channel="facebook" isDark={isDark} size="md" />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col p-4 pt-3 gap-2.5 overflow-hidden min-h-0">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
            Loading data...
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center text-red-400 text-xs text-center p-4">
            {error}
          </div>
        ) : (
          <>
            {/* ── Top row: Charts + Insight ── */}
            <div className="flex gap-2.5 min-h-0" style={{ flex: '1 1 0' }}>
              {/* Charts card */}
              <div
                className="rounded-xl border overflow-hidden flex flex-col"
                style={{
                  flex: '0 0 63%',
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
                  boxShadow: theme.cardShadow,
                  borderColor: theme.border,
                }}
              >
                <div className="h-0.5 shrink-0" style={{ background: theme.accentLine }} />
                <div className="flex-1 px-3 pt-1.5 pb-1 min-h-0 flex flex-col gap-1">
                  {/* Chart 1: Follows (left, blue) + Likes (right, orange) dual-axis */}
                  <div className="flex flex-col min-h-0" style={{ flex: '1 1 0' }}>
                    <p
                      className={`text-[9px] font-bold shrink-0 mb-0.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}
                    >
                      Follows &amp; Likes
                    </p>
                    <div className="flex-1 min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                          data={mapped}
                          margin={{ top: 4, right: 8, left: -14, bottom: 2 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke={gridLine} />
                          <XAxis
                            dataKey="date"
                            tick={{ ...tickStyle, fontSize: 6 }}
                            interval="preserveStartEnd"
                            tickLine={false}
                            axisLine={axisLine}
                          />
                          <YAxis
                            yAxisId="left"
                            tick={tickStyle}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v) => fmtK(v)}
                          />
                          <YAxis
                            yAxisId="right"
                            orientation="right"
                            tick={tickStyle}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v) => fmtK(v)}
                          />
                          {!isThumbnail && (
                            <Tooltip
                              contentStyle={{
                                fontSize: 10,
                                borderRadius: 6,
                                border: `1px solid ${theme.border}`,
                                backgroundColor: isDark ? '#1e293b' : '#fff',
                                color: isDark ? '#fff' : '#000',
                              }}
                              formatter={(v: any, name?: string) => [fmtK(Number(v)), name ?? '']}
                            />
                          )}
                          <Legend wrapperStyle={{ fontSize: 8 }} />
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="follows"
                            name="Follows"
                            stroke={FB_BLUE}
                            strokeWidth={2}
                            dot={{ r: 2 }}
                            activeDot={{ r: 3 }}
                          />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="likes"
                            name="Likes"
                            stroke={FB_ORANGE}
                            strokeWidth={2}
                            dot={{ r: 2 }}
                            activeDot={{ r: 3 }}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  {/* Chart 2: Engagement bar */}
                  <div className="flex flex-col min-h-0" style={{ flex: '1 1 0' }}>
                    <p
                      className={`text-[9px] font-bold shrink-0 mb-0.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}
                    >
                      Engagement
                    </p>
                    <div className="flex-1 min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={mapped} margin={{ top: 4, right: 8, left: -14, bottom: 2 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={gridLine} />
                          <XAxis
                            dataKey="date"
                            tick={{ ...tickStyle, fontSize: 6 }}
                            interval="preserveStartEnd"
                            tickLine={false}
                            axisLine={axisLine}
                          />
                          <YAxis
                            tick={tickStyle}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v) => fmtK(v)}
                          />
                          {!isThumbnail && (
                            <Tooltip
                              contentStyle={{
                                fontSize: 10,
                                borderRadius: 6,
                                border: `1px solid ${theme.border}`,
                                backgroundColor: isDark ? '#1e293b' : '#fff',
                                color: isDark ? '#fff' : '#000',
                              }}
                              formatter={(v: any) => [fmtK(Number(v)), 'Engagement']}
                            />
                          )}
                          <Bar
                            dataKey="engagement"
                            name="Engagement"
                            fill={FB_BAR}
                            radius={[2, 2, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>

              {/* Analysis panel */}
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
                        <button onClick={() => { setInsight(editValue); onInsightChange?.(editValue); setIsEditing(false); }} className="text-[9px] px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700">Save</button>
                      </div>
                    </div>
                  ) : insight ? (
                    <div
                      data-ic-insight
                      className="flex flex-col gap-1.5 cursor-pointer"
                      onClick={() => { setEditValue(insight); setIsEditing(true); }}
                    >
                      {(() => {
                        const parsed = parseFbGrowthInsight(insight);
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
            </div>

            {/* ── Full-width Table ── */}
            {(() => {
              const headerBg = isDark ? '#1e293b' : colorPrimary;
              return (
                <div
                  className="rounded-xl border overflow-hidden flex flex-col"
                  style={{
                    flex: '0 0 auto',
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
                    boxShadow: theme.cardShadow,
                    borderColor: theme.border,
                  }}
                >
                  <div className="h-0.5 shrink-0" style={{ background: theme.accentLine }} />
                  <div className="overflow-visible">
                    {tableRows.length > 0 ? (
                      <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                        <thead>
                          <tr
                            style={{
                              position: 'sticky',
                              top: 0,
                              zIndex: 1,
                              backgroundColor: headerBg,
                            }}
                          >
                            {TABLE_HEADERS.map((h, ci) => (
                              <th
                                key={h}
                                className="px-2 py-2.5 font-bold whitespace-nowrap"
                                style={{
                                  color: '#ffffff',
                                  fontSize: 12,
                                  letterSpacing: '0.03em',
                                  textAlign: ci === 0 ? 'left' : 'center',
                                }}
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {tableRows.map((row, ri) => {
                            const isGap = row.month === 'Gap';
                            return (
                              <tr
                                key={ri}
                                style={{
                                  backgroundColor:
                                    ri % 2 === 0
                                      ? 'transparent'
                                      : isDark
                                        ? 'rgba(255,255,255,0.03)'
                                        : '#f8fafc',
                                }}
                              >
                                {[
                                  row.month,
                                  row.post_count,
                                  row.fans_growth,
                                  row.post_reach,
                                  row.engagement,
                                ].map((cell, ci) => {
                                  let color = isDark ? '#e2e8f0' : '#1e293b';
                                  if (isGap && ci > 0) {
                                    const raw = String(cell ?? '');
                                    if (raw.startsWith('-')) color = '#ef4444';
                                    else if (raw === '0.00%' || raw === '0%') color = '#94a3b8';
                                    else color = '#10b981';
                                  }
                                  return (
                                    <td
                                      key={ci}
                                      className="px-2 py-2.5 whitespace-nowrap border-b"
                                      style={{
                                        borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
                                        color,
                                        fontWeight: ci === 0 || isGap ? 600 : 500,
                                        fontSize: 13,
                                        textAlign: ci === 0 ? 'left' : 'center',
                                      }}
                                    >
                                      {cell}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                        No data for {config.clientName} · {config.period}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </>
        )}
      </div>

      {/* Hidden export data */}
      <div
        style={{ display: 'none' }}
        data-ic-fb-chart={JSON.stringify(mapped)}
        data-ic-fb-table={JSON.stringify(tableRows)}
        data-ic-fb-insight={insight}
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
