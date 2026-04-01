'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { BarChart2, Sparkles, Loader2 } from 'lucide-react';
import { ReportConfig } from '@/app/types';
import { SlideFooter } from '@/app/components/ui/SlideFooter';
import { ChannelBadge } from '@/app/components/ui';
import { generateLayoutTheme } from '@/app/utils/themeStyles';
import { generateGeminiContent } from '@/app/utils/api';
import {
  IG_GROWTH_ANALYST_SYSTEM_PROMPT,
  buildIgGrowthAnalystPrompt,
  parseIgGrowthInsight,
  type ParsedInsight,
} from '@/app/innercircle/prompts/igGrowthPrompt';

// instagram_page_8.py — Combined chart (Followers Growth + Profile Reach dual-axis) + Analysis + Table

const IG_ORANGE = '#E67E22'; // Followers Growth — orange
const IG_BLUE = '#3B82F6'; // Profile Reach — blue (clearly distinct)


const TABLE_HEADERS = [
  'Month',
  'Profile Reach',
  'Profile Visit',
  'Growth',
  'Reach',
  'Engagement',
  'Likes',
  'Comments',
  'Shares',
  'Saves',
  'ER Reach(%)',
  'ER Folls(%)',
];

interface LinePoint {
  date: string;
  followersGrowth: number;
  profileReach: number;
}

interface TableRow {
  month: string;
  profileReach: string;
  profileVisit: string;
  growth: string;
  reach: string;
  engagement: string;
  likes: string;
  comments: string;
  shares: string;
  saves: string;
  erReach: string;
  erFolls: string;
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
  const date = new Date(d);
  const day = String(date.getUTCDate()).padStart(2, '0');
  const mon = date.toLocaleString('en', { month: 'short', timeZone: 'UTC' });
  return `${day}-${mon}`;
}

function fmtNum(n: number): string {
  return n.toLocaleString();
}

// ─── inline bold renderer (no block wrapper) ─────────────────
const renderBoldInline = (text: string, color: string) =>
  text.split(/(\*\*.*?\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <span key={i} className="font-bold" style={{ color }}>{part.slice(2, -2)}</span>
      : <span key={i}>{part}</span>,
  );

// ─── IgInsightView ───────────────────────────────────────────
const IgInsightView: React.FC<{
  raw: string;
  isDark: boolean;
  colorPrimary: string;
  onEdit: () => void;
}> = ({ raw, isDark, colorPrimary, onEdit }) => {
  const parsed: ParsedInsight = React.useMemo(() => parseIgGrowthInsight(raw), [raw]);
  const bodyColor = isDark ? 'text-slate-300' : 'text-slate-600';
  const labelColor = isDark ? 'text-slate-200' : 'text-slate-700';

  return (
    <div
      data-ic-insight
      data-insight-raw={raw}
      className="flex flex-col gap-2 w-full min-w-0 cursor-pointer"
      onClick={onEdit}
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

export const IgGrowthSlide: React.FC<Props> = ({
  config,
  isThumbnail = false,
  currentPage,
  totalPages,
  savedInsight,
  onInsightChange,
}) => {
  const [lineData, setLineData] = useState<LinePoint[]>([]);
  const [tableRows, setTableRows] = useState<TableRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Insight state
  const [insight, setInsight] = useState(savedInsight || '');
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  // AI generate state
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!config.clientName || isThumbnail) return;
    setLoading(true);
    setError(null);
    fetch(
      `/api/innercircle/ig-growth?brand=${encodeURIComponent(config.clientName)}&period=${encodeURIComponent(config.period)}`,
    )
      .then((r) => r.json())
      .then((d) => {
        if (d.error && !d.lineData?.length) setError(d.error);
        setLineData(d.lineData || []);
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

  const mappedLine = useMemo(
    () => lineData.map((r) => ({ ...r, date: shortDate(r.date) })),
    [lineData],
  );

  // Combined chart JSON for PPTX export (primary series = followersGrowth)
  const chartJson = useMemo(
    () =>
      JSON.stringify({
        type: 'line',
        labels: mappedLine.map((r) => r.date),
        series: [
          { name: 'Followers Growth', values: mappedLine.map((r) => r.followersGrowth) },
          { name: 'Profile Reach', values: mappedLine.map((r) => r.profileReach) },
        ],
      }),
    [mappedLine],
  );


  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const prompt = buildIgGrowthAnalystPrompt(config.clientName, config.period, tableRows);
      const text = await generateGeminiContent(prompt, IG_GROWTH_ANALYST_SYSTEM_PROMPT);
      setInsight(text);
      onInsightChange?.(text);
    } catch {
      // silently fail
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveEdit = () => {
    setInsight(editValue);
    onInsightChange?.(editValue);
    setIsEditing(false);
  };

  // Thumbnail
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
          {' — '}Instagram Growth
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
              {config.clientName || '—'}
              {' — '}Instagram Growth
            </h1>
            <p
              className={`text-[10px] font-medium flex items-center gap-1 mt-1 uppercase tracking-wide ${isDark ? 'text-slate-300' : 'text-slate-500'}`}
            >
              <BarChart2 size={9} style={{ color: colorPrimary }} /> {config.period} Report
            </p>
          </div>
          <ChannelBadge channel="instagram" isDark={isDark} size="md" />
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
            {/* ── Top row: Chart (left) + Analysis (right) ── */}
            <div className="flex gap-2.5 min-h-0" style={{ flex: '0 0 63%' }}>
              {/* 2 stacked line charts */}
              <div
                className="rounded-xl border overflow-hidden flex flex-col"
                style={{
                  flex: '0 0 56%',
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
                  boxShadow: theme.cardShadow,
                  borderColor: theme.border,
                }}
              >
                <div className="h-0.5 shrink-0" style={{ background: theme.accentLine }} />
                <div className="flex-1 px-3 pt-1.5 pb-1 min-h-0 flex flex-col gap-1" data-ic-chart>
                  <div data-chart-json={chartJson} style={{ display: 'none' }} />

                  {/* Chart 1: Followers Growth */}
                  <div className="flex flex-col min-h-0" style={{ flex: '1 1 0' }}>
                    <p
                      className={`text-[9px] font-bold shrink-0 mb-0.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}
                    >
                      Followers Growth
                    </p>
                    <div className="flex-1 min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={mappedLine}
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
                            tick={tickStyle}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={fmtNum}
                          />
                          {!isThumbnail && (
                            <Tooltip
                              formatter={(v: number | undefined) => fmtNum(v ?? 0)}
                              contentStyle={{
                                fontSize: 10,
                                borderRadius: 6,
                                border: `1px solid ${theme.border}`,
                                backgroundColor: isDark ? '#1e293b' : '#fff',
                                color: isDark ? '#fff' : '#000',
                              }}
                            />
                          )}
                          <Line
                            type="monotone"
                            dataKey="followersGrowth"
                            name="Followers Growth"
                            stroke={IG_ORANGE}
                            strokeWidth={2}
                            dot={{ r: 2 }}
                            activeDot={{ r: 3 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Chart 2: Profile Reach */}
                  <div className="flex flex-col min-h-0" style={{ flex: '1 1 0' }}>
                    <p
                      className={`text-[9px] font-bold shrink-0 mb-0.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}
                    >
                      Profile Reach
                    </p>
                    <div className="flex-1 min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={mappedLine}
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
                            tick={tickStyle}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={fmtNum}
                          />
                          {!isThumbnail && (
                            <Tooltip
                              formatter={(v: number | undefined) => fmtNum(v ?? 0)}
                              contentStyle={{
                                fontSize: 10,
                                borderRadius: 6,
                                border: `1px solid ${theme.border}`,
                                backgroundColor: isDark ? '#1e293b' : '#fff',
                                color: isDark ? '#fff' : '#000',
                              }}
                            />
                          )}
                          <Line
                            type="monotone"
                            dataKey="profileReach"
                            name="Profile Reach"
                            stroke={IG_BLUE}
                            strokeWidth={2}
                            dot={{ r: 2 }}
                            activeDot={{ r: 3 }}
                          />
                        </LineChart>
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
                {/* Panel header */}
                <div
                  className="flex items-center justify-between px-3 py-2 border-b shrink-0"
                  style={{ borderColor: theme.border }}
                >
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={11} style={{ color: colorPrimary }} />
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-700'}`}>
                      Analysis
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {insight && !isEditing && (
                      <button
                        onClick={() => { setEditValue(insight); setIsEditing(true); }}
                        className={`text-[9px] font-medium px-2 py-0.5 rounded-full border transition-all ${
                          isDark
                            ? 'text-slate-400 border-white/10 hover:bg-white/10'
                            : 'text-slate-500 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        Edit
                      </button>
                    )}
                    {!isEditing && (
                      <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium border transition-all disabled:opacity-50 ${
                          isDark
                            ? 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                            : 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100'
                        }`}
                      >
                        {isGenerating ? <Loader2 size={9} className="animate-spin" /> : <Sparkles size={9} />}
                        <span>AI</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-h-0 min-w-0 p-3 flex flex-col overflow-y-auto overflow-x-hidden">
                  {isGenerating ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2 opacity-70">
                      <Sparkles size={20} className="text-indigo-500 animate-spin" />
                      <span className="text-[10px] text-indigo-500 font-medium animate-pulse">
                        Analyzing…
                      </span>
                    </div>
                  ) : isEditing ? (
                    <div className="h-full flex flex-col gap-2 overflow-hidden">
                      <textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        autoFocus
                        className={`flex-1 text-[11px] leading-snug p-2 rounded border focus:outline-none resize-none w-full ${
                          isDark
                            ? 'bg-white/10 border-white/10 text-white placeholder:text-white/30'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                        placeholder={"Tulis analisis...\n\nFormat bullet: mulai baris dengan '- '\nFormat paragraf: tulis bebas"}
                      />
                      <div className="flex justify-end gap-2 shrink-0">
                        <button
                          onClick={() => setIsEditing(false)}
                          className={`text-[9px] px-3 py-1 rounded border ${isDark ? 'border-white/20 text-slate-400' : 'border-slate-200 text-slate-500'}`}
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
                    <IgInsightView
                      raw={insight}
                      isDark={isDark}
                      colorPrimary={colorPrimary}
                      onEdit={() => { setEditValue(insight); setIsEditing(true); }}
                    />
                  ) : (
                    <div
                      className="flex flex-col items-center justify-center h-full gap-3 cursor-pointer group"
                      onClick={() => {
                        setEditValue('');
                        setIsEditing(true);
                      }}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all group-hover:scale-105 ${
                          isDark ? 'bg-white/10' : 'bg-indigo-50'
                        }`}
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

            {/* ── Full-width Table ── */}
            {(() => {
              const cells = (row: TableRow) => [
                row.month,
                row.profileReach,
                row.profileVisit,
                row.growth,
                row.reach,
                row.engagement,
                row.likes,
                row.comments,
                row.shares,
                row.saves,
                row.erReach,
                row.erFolls,
              ];
              const headerBg = isDark ? '#1e293b' : colorPrimary;
              return (
                <div
                  data-ic-ig-table
                  className="rounded-xl border overflow-hidden flex flex-col"
                  style={{
                    flex: '1 1 0',
                    minHeight: 0,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
                    boxShadow: theme.cardShadow,
                    borderColor: theme.border,
                  }}
                >
                  <div className="h-0.5 shrink-0" style={{ background: theme.accentLine }} />
                  <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden h-full">
                    {tableRows.length > 0 ? (
                      <table className="w-full h-full border-collapse" style={{ tableLayout: 'fixed' }}>
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
                                className="px-2 py-1.5 font-bold text-center whitespace-nowrap"
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
                            const isGap = row.month.toLowerCase().includes('gap');
                            const rowCells = cells(row);
                            return (
                              <tr
                                key={ri}
                                style={{
                                  backgroundColor: isGap
                                    ? isDark
                                      ? 'rgba(255,255,255,0.06)'
                                      : `${colorPrimary}10`
                                    : ri % 2 === 0
                                      ? 'transparent'
                                      : isDark
                                        ? 'rgba(255,255,255,0.03)'
                                        : '#f8fafc',
                                }}
                              >
                                {rowCells.map((cell, ci) => (
                                  <td
                                    key={ci}
                                    className="px-2 py-1 whitespace-nowrap border-b"
                                    style={{
                                      borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
                                      color:
                                        isGap && ci > 0
                                          ? cell.startsWith('-')
                                            ? '#EF4444'
                                            : cell === '0' || cell === '0.00%'
                                              ? '#94a3b8'
                                              : '#10B981'
                                          : isDark
                                            ? '#e2e8f0'
                                            : '#1e293b',
                                      fontWeight: ci === 0 ? 600 : isGap ? 700 : 500,
                                      fontSize: 13,
                                      textAlign: ci === 0 ? 'left' : 'center',
                                    }}
                                  >
                                    {cell}
                                  </td>
                                ))}
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
