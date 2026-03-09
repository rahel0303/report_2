'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import WordCloud from 'react-d3-cloud';
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
import { MessageCircle } from 'lucide-react';
import { ReportConfig } from '@/app/types';
import { SlideFooter } from '@/app/components/ui/SlideFooter';
import { generateLayoutTheme } from '@/app/utils/themeStyles';

// ---- Python palette: ["#E74C3C", "#95A5A6", "#27AE60"]
const POSITIVE_COLOR = '#27AE60';
const NEUTRAL_COLOR = '#95A5A6';
const NEGATIVE_COLOR = '#E74C3C';
const WC_PALETTE = [NEGATIVE_COLOR, NEUTRAL_COLOR, POSITIVE_COLOR];

function shortDate(d: string): string {
  const date = new Date(d);
  const day = String(date.getUTCDate()).padStart(2, '0');
  const mon = date.toLocaleString('en', { month: 'short', timeZone: 'UTC' });
  return `${day}-${mon}`;
}

function strHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

interface DailySentiment {
  post_date: string;
  neutral: number;
  positive: number;
  negative: number;
}

interface SentimentTotals {
  positive: number;
  neutral: number;
  negative: number;
  positive_pct: number;
  neutral_pct: number;
  negative_pct: number;
}

interface Keyword {
  word: string;
  count: number;
}

interface Props {
  config: ReportConfig;
  isThumbnail?: boolean;
  currentPage?: number;
  totalPages?: number;
}

/* ---- Wordcloud container — react-d3-cloud, design matches Python overview_page_3 ---- */
const WCContainer: React.FC<{
  keywords: Keyword[];
  border: string;
  cardShadow: string;
}> = ({ keywords, border, cardShadow }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 400, h: 180 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 20 && height > 20) setSize({ w: Math.floor(width), h: Math.floor(height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const maxVal = useMemo(() => keywords[0]?.count || 1, [keywords]);
  const wcWords = useMemo(
    () => keywords.slice(0, 150).map((kw) => ({ text: kw.word, value: kw.count })),
    [keywords],
  );

  return (
    <div
      data-ic-wc
      className="rounded-xl border flex flex-col overflow-hidden"
      style={{
        flex: '0 0 44%',
        // always white background — matches Python background_color="white"
        backgroundColor: '#ffffff',
        boxShadow: cardShadow,
        borderColor: border,
      }}
    >
      {/* Title — matches Python ax_wc.set_title("Wordcloud Keywords All Sentiment") */}
      <div className="shrink-0 px-3 py-1.5 border-b" style={{ borderColor: border }}>
        <p className="text-[9px] font-bold text-center uppercase tracking-wide text-slate-600">
          Wordcloud Keywords All Sentiment
        </p>
      </div>

      {/* Wordcloud body */}
      <div ref={containerRef} className="flex-1 min-h-0 overflow-hidden">
        {wcWords.length > 0 && size.w > 20 ? (
          <WordCloud
            data={wcWords}
            width={size.w}
            height={size.h}
            font="Arial"
            // Python bold_color_func: palette[hash(word) % 3] — red / gray / green
            fill={(d: { text: string; value: number }) => WC_PALETTE[strHash(d.text) % 3]}
            fontSize={(d: { text: string; value: number }) => {
              const ratio = d.value / maxVal;
              return Math.max(10, Math.round(10 + ratio * size.h * 0.32));
            }}
            fontWeight={(d: { text: string; value: number }) => {
              const ratio = d.value / maxVal;
              return ratio > 0.4 ? 'bold' : '400';
            }}
            // Python prefer_horizontal=0.9 → ~10% rotated 90°
            rotate={(d: { text: string; value: number }) => (strHash(d.text) % 10 === 0 ? 90 : 0)}
            padding={3}
            random={() => 0.5}
            spiral="archimedean"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-[10px] text-slate-400">
            No data
          </div>
        )}
      </div>
    </div>
  );
};

export const AllChannelSentimentSlide: React.FC<Props> = ({
  config,
  isThumbnail = false,
  currentPage,
  totalPages,
}) => {
  const [chartData, setChartData] = useState<DailySentiment[]>([]);
  const [totals, setTotals] = useState<SentimentTotals | null>(null);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!config.clientName || isThumbnail) return;
    setLoading(true);
    setError(null);
    fetch(
      `/api/innercircle/all-channel-sentiment?brand=${encodeURIComponent(config.clientName)}&period=${encodeURIComponent(config.period)}`,
    )
      .then((r) => r.json())
      .then((d) => {
        if (d.error && !d.data?.length) setError(d.error);
        setChartData(d.data || []);
        setTotals(d.totals || null);
        setKeywords(d.keywords || []);
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

  const mappedChart = useMemo(
    () => chartData.map((r) => ({ ...r, date: shortDate(r.post_date) })),
    [chartData],
  );

  // Serialized chart data for native PPTX export extraction
  const chartJson = useMemo(
    () =>
      JSON.stringify({
        type: 'line',
        labels: mappedChart.map((r) => r.date),
        series: [
          { name: 'Positive', values: mappedChart.map((r) => r.positive) },
          { name: 'Neutral', values: mappedChart.map((r) => r.neutral) },
          { name: 'Negative', values: mappedChart.map((r) => r.negative) },
        ],
      }),
    [mappedChart],
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
          {config.clientName || '—'}
          {' — '}All Channel Sentiment
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

      {/* Header card */}
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
              {config.clientName || '...'}
              {' — '}All Channel Sentiment
            </h1>
            <p
              className={`text-[10px] font-medium flex items-center gap-1 mt-1 uppercase tracking-wide ${isDark ? 'text-slate-300' : 'text-slate-500'}`}
            >
              <MessageCircle size={9} style={{ color: colorPrimary }} /> {config.period} Report
            </p>
          </div>
          {config.coverDesign?.logoData && (
            <img
              src={config.coverDesign.logoData}
              alt="logo"
              className="shrink-0 h-9 w-auto object-contain"
            />
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col p-4 pt-3 gap-3 overflow-hidden min-h-0">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
            Loading data...
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center text-red-400 text-xs text-center p-4">
            {error}
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
            No sentiment data for {config.clientName} · {config.period}
          </div>
        ) : (
          <>
            {/* Line Chart card (full width, ~48%) */}
            <div
              className="rounded-xl border overflow-hidden flex flex-col"
              style={{
                flex: '0 0 48%',
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
                boxShadow: theme.cardShadow,
                borderColor: theme.border,
              }}
            >
              <div className="h-0.5 shrink-0" style={{ background: theme.accentLine }} />
              <div className="flex-1 px-4 pt-2 pb-1.5 min-h-0 flex flex-col">
                <p
                  className={`text-[11px] font-bold text-center shrink-0 mb-0.5 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}
                >
                  Daily Mentions by Sentiment (All Channels)
                </p>
                <div className="flex-1 min-h-0" data-ic-chart>
                  {/* Hidden element carries chart data for native PPTX export */}
                  <div data-chart-json={chartJson} style={{ display: 'none' }} />
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={mappedChart}
                      margin={{ top: 8, right: 10, left: -16, bottom: 2 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={isDark ? 'rgba(255,255,255,0.08)' : '#e8edf3'}
                      />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 7, fill: '#94a3b8' }}
                        interval="preserveStartEnd"
                        tickLine={false}
                        axisLine={{ stroke: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0' }}
                      />
                      <YAxis
                        tick={{ fontSize: 8, fill: '#94a3b8' }}
                        tickLine={false}
                        axisLine={false}
                        label={{
                          value: 'Mentions',
                          angle: -90,
                          position: 'insideLeft',
                          fontSize: 8,
                          fill: '#94a3b8',
                          dy: 30,
                        }}
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
                        />
                      )}
                      <Legend
                        wrapperStyle={{ fontSize: 9 }}
                        iconType="circle"
                        iconSize={7}
                        verticalAlign="top"
                        align="center"
                      />
                      <Line
                        type="monotone"
                        dataKey="positive"
                        name="Positive"
                        stroke={POSITIVE_COLOR}
                        strokeWidth={2}
                        dot={{ r: 2.5 }}
                        activeDot={{ r: 3.5 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="neutral"
                        name="Neutral"
                        stroke={NEUTRAL_COLOR}
                        strokeWidth={2}
                        dot={{ r: 2.5 }}
                        activeDot={{ r: 3.5 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="negative"
                        name="Negative"
                        stroke={NEGATIVE_COLOR}
                        strokeWidth={2}
                        dot={{ r: 2.5 }}
                        activeDot={{ r: 3.5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Bottom row: Word Cloud + 3 Sentiment Boxes */}
            <div className="flex gap-3 min-h-0" style={{ flex: '1 1 0' }}>
              {/* Hidden: totals for native PPTX export */}
              {totals && (
                <div
                  data-ic-totals={JSON.stringify({
                    positive_pct: totals.positive_pct,
                    neutral_pct: totals.neutral_pct,
                    negative_pct: totals.negative_pct,
                  })}
                  style={{ display: 'none' }}
                />
              )}
              <WCContainer
                keywords={keywords}
                border={theme.border}
                cardShadow={theme.cardShadow}
              />

              {/* 3 solid-color sentiment boxes — matches Python add_sentiment_box() */}
              {totals && (
                <div className="flex-1 flex gap-2 items-stretch min-h-0">
                  {[
                    {
                      label: 'POSITIVE',
                      pct: totals.positive_pct,
                      color: POSITIVE_COLOR,
                      desc: 'Strong interest & appreciation',
                    },
                    {
                      label: 'NEUTRAL',
                      pct: totals.neutral_pct,
                      color: NEUTRAL_COLOR,
                      desc: 'Questions or general discussion',
                    },
                    {
                      label: 'NEGATIVE',
                      pct: totals.negative_pct,
                      color: NEGATIVE_COLOR,
                      desc: 'Concerns or dissatisfaction',
                    },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="flex-1 rounded-xl overflow-hidden flex flex-col"
                      style={{ boxShadow: theme.cardShadow }}
                    >
                      <div
                        className="shrink-0 px-2 py-2 text-center"
                        style={{ backgroundColor: s.color }}
                      >
                        <span className="text-white text-[11px] font-bold uppercase tracking-widest">
                          {s.label}
                        </span>
                      </div>
                      <div
                        className="flex-1 flex flex-col items-center justify-center px-2 py-3"
                        style={{ backgroundColor: s.color }}
                      >
                        <span className="text-white text-3xl font-extrabold leading-none">
                          {Number(s.pct).toFixed(1)}%
                        </span>
                        <span className="text-white/80 text-[9px] text-center mt-2 leading-tight">
                          {s.desc}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
        />
      </div>
    </div>
  );
};
