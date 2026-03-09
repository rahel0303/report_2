'use client';

// Slides 11 & 12 from instagram_visualization
// Content Pillar: Average Engagement + Total Post (current vs previous month)
// aon=true  → Slide 11 (AON / brand-owned content)
// aon=false → Slide 12 (Non-AON / client content)

import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { BarChart2, Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ReportConfig } from '@/app/types';
import { SlideFooter } from '@/app/components/ui/SlideFooter';
import { ChannelBadge } from '@/app/components/ui';
import { generateLayoutTheme } from '@/app/utils/themeStyles';

interface PillarRow {
  content_pillar: string;
  value: number;
}

interface DeltaRow {
  content_pillar: string;
  inc: number | null;
}

interface ApiData {
  currMonth: string;
  prevMonth: string;
  engCurr: PillarRow[];
  engPrev: PillarRow[];
  postCurr: PillarRow[];
  postPrev: PillarRow[];
  deltaEng: DeltaRow[];
  deltaPost: DeltaRow[];
}

interface Props {
  config: ReportConfig;
  aon: boolean;
  isThumbnail?: boolean;
  currentPage?: number;
  totalPages?: number;
}

const MONTH_ID: Record<string, string> = {
  '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
  '05': 'Mei', '06': 'Jun', '07': 'Jul', '08': 'Agu',
  '09': 'Sep', '10': 'Okt', '11': 'Nov', '12': 'Des',
};

function monthLabel(mmYyyy: string) {
  const [mm, yyyy] = mmYyyy.split('-');
  return `${MONTH_ID[mm] ?? mm} ${yyyy}`;
}

function fmtNum(v: number): string {
  if (Math.abs(v) >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
  if (Math.abs(v) >= 1_000) return (v / 1_000).toFixed(1) + 'K';
  return v.toLocaleString('id-ID', { maximumFractionDigits: 0 });
}

function fmtDelta(v: number | null): string {
  if (v === null || isNaN(v)) return '-';
  return `${v >= 0 ? '+' : ''}${v.toFixed(0)}%`;
}

// Merge current + previous month data aligned by content_pillar
function buildChartData(
  curr: PillarRow[],
  prev: PillarRow[],
): { name: string; curr: number; prev: number }[] {
  const allPillars = Array.from(
    new Set([...curr.map((r) => r.content_pillar), ...prev.map((r) => r.content_pillar)]),
  ).sort();
  const currMap = Object.fromEntries(curr.map((r) => [r.content_pillar, r.value]));
  const prevMap = Object.fromEntries(prev.map((r) => [r.content_pillar, r.value]));
  return allPillars.map((p) => ({
    name: p,
    curr: currMap[p] ?? 0,
    prev: prevMap[p] ?? 0,
  }));
}

// Horizontal bar chart for a single month
const PillarBarChart: React.FC<{
  data: { name: string; value: number }[];
  color: string;
  isDark: boolean;
  isER?: boolean;
}> = ({ data, color, isDark, isER }) => {
  const textColor = isDark ? '#94a3b8' : '#64748b';
  const gridColor = isDark ? '#334155' : '#e2e8f0';

  const CustomLabel = (props: any) => {
    const { x, y, width, height, value } = props;
    if (!value || value === 0) return null;
    const label = isER ? `${Number(value).toFixed(2)}%` : fmtNum(Number(value));
    return (
      <text
        x={x + width + 3}
        y={y + height / 2}
        fill={isDark ? '#cbd5e1' : '#374151'}
        fontSize={7}
        dominantBaseline="middle"
      >
        {label}
      </text>
    );
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 2, right: 36, left: 0, bottom: 2 }}
      >
        <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke={gridColor} />
        <XAxis
          type="number"
          tick={{ fontSize: 6, fill: textColor }}
          tickLine={false}
          axisLine={{ stroke: gridColor }}
          tickFormatter={(v) => v === 0 ? '' : (isER ? `${v.toFixed(1)}%` : fmtNum(v))}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 6.5, fill: textColor, textAnchor: 'end', dx: -2 }}
          tickLine={false}
          axisLine={false}
          width={58}
          tickFormatter={(v: string) =>
            v.length > 14 ? v.substring(0, 13) + '…' : v
          }
        />
        <Tooltip
          formatter={(v: number | undefined) => {
            if (v === undefined) return ['-', ''];
            return isER
              ? [`${v.toFixed(2)}%`, '']
              : [v.toLocaleString('id-ID', { maximumFractionDigits: 0 }), ''];
          }}
          contentStyle={{
            fontSize: 9,
            background: isDark ? '#1e293b' : '#fff',
            border: `1px solid ${gridColor}`,
            borderRadius: 4,
          }}
        />
        <Bar dataKey="value" radius={[0, 2, 2, 0]} barSize={15} label={<CustomLabel />}>
          {data.map((_, i) => (
            <Cell key={i} fill={color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

// Delta list panel
const DeltaPanel: React.FC<{
  title: string;
  deltas: DeltaRow[];
  pillars: string[];
  isDark: boolean;
  colorPrimary: string;
}> = ({ title, deltas, pillars, isDark, colorPrimary }) => {
  const deltaMap = Object.fromEntries(deltas.map((d) => [d.content_pillar, d.inc]));
  return (
    <div className="flex flex-col gap-0.5">
      <p
        className="text-[7px] font-bold uppercase tracking-wide mb-0.5"
        style={{ color: colorPrimary }}
      >
        {title}
      </p>
      {pillars.map((p) => {
        const inc = deltaMap[p] ?? null;
        const label = fmtDelta(inc);
        const positive = inc !== null && inc >= 0;
        const negative = inc !== null && inc < 0;
        return (
          <div key={p} className="flex items-center justify-between gap-1">
            <span
              className="text-[6.5px] truncate"
              style={{ color: isDark ? '#94a3b8' : '#64748b', maxWidth: 70 }}
              title={p}
            >
              {p}
            </span>
            <div className="flex items-center gap-0.5 shrink-0">
              {positive ? (
                <TrendingUp size={7} color="#16a34a" />
              ) : negative ? (
                <TrendingDown size={7} color="#dc2626" />
              ) : (
                <Minus size={7} color={isDark ? '#475569' : '#94a3b8'} />
              )}
              <span
                className="text-[6.5px] font-bold"
                style={{
                  color: positive ? '#16a34a' : negative ? '#dc2626' : isDark ? '#475569' : '#94a3b8',
                }}
              >
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const IgCpEngSlide: React.FC<Props> = ({
  config,
  aon,
  isThumbnail = false,
  currentPage,
  totalPages,
}) => {
  const [data, setData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!config.clientName || isThumbnail) return;
    setLoading(true);
    setError(null);
    fetch(
      `/api/innercircle/ig-cp-engagement?brand=${encodeURIComponent(config.clientName)}&period=${encodeURIComponent(config.period)}&aon=${aon}`,
    )
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [config.clientName, config.period, aon, isThumbnail]);

  const contentMode = config.coverDesign?.contentMode || 'light';
  const theme = generateLayoutTheme(
    config.coverDesign?.colors,
    config.theme?.brandColor,
    contentMode,
  );
  const isDark = contentMode === 'dark';
  const colorPrimary = theme.colors.primary;
  const BAR_COLOR = '#4FC1E9';

  const aonLabel = aon ? 'AON (Brand-Owned)' : 'Non-AON (Client)';
  const slideTitle = `Content Pillar — ${aonLabel}`;

  if (isThumbnail) {
    return (
      <div
        className="w-full h-full flex items-center justify-center"
        style={{ fontFamily: config.font?.name || 'Inter', background: theme.pageBg }}
      >
        <p className={`text-3xl font-bold text-center px-4 ${isDark ? 'text-white' : 'text-slate-800'}`}>
          {config.clientName || '—'}<br />
          <span className="text-xl font-medium" style={{ color: colorPrimary }}>
            {slideTitle}
          </span>
        </p>
      </div>
    );
  }

  // Build chart data
  const engData = data
    ? buildChartData(data.engCurr, data.engPrev)
    : [];
  const postData = data
    ? buildChartData(data.postCurr, data.postPrev)
    : [];

  const allPillars = data
    ? Array.from(
        new Set([
          ...data.engCurr.map((r) => r.content_pillar),
          ...data.engPrev.map((r) => r.content_pillar),
        ]),
      ).sort()
    : [];

  const currLabel = data ? monthLabel(data.currMonth) : '';
  const prevLabel = data ? monthLabel(data.prevMonth) : '';

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
      {/* Decorative blur */}
      <div
        className="absolute -top-16 -right-16 w-40 h-40 rounded-full pointer-events-none"
        style={{ background: `${colorPrimary}18`, filter: 'blur(40px)' }}
      />

      {/* Header */}
      <div className="px-5 pt-4 shrink-0">
        <div
          className="rounded-xl p-3 flex items-center justify-between relative overflow-hidden"
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
              {config.clientName || '—'} — {slideTitle}
            </h1>
            <p
              className={`text-[10px] font-medium flex items-center gap-1 mt-1 uppercase tracking-wide ${isDark ? 'text-slate-300' : 'text-slate-500'}`}
            >
              <BarChart2 size={9} style={{ color: colorPrimary }} />
              {config.period} · Avg Engagement &amp; Total Post per Pillar
            </p>
          </div>
          <div className="flex items-center gap-2">
            {loading && <Loader2 size={14} className="animate-spin text-slate-400" />}
            <ChannelBadge channel="instagram" isDark={isDark} size="md" />
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-5 mt-2 text-[9px] text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2 shrink-0">
          {error}
        </div>
      )}

      {/* Body */}
      <div className="flex-1 flex flex-row px-5 pt-3 pb-1 gap-3 min-h-0 overflow-hidden">
        {loading && !data && (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-slate-400" />
          </div>
        )}

        {!loading && !data && !error && (
          <div
            className="flex-1 flex items-center justify-center text-[11px] rounded-xl border-2 border-dashed"
            style={{ color: isDark ? '#4b5563' : '#94a3b8', borderColor: theme.border }}
          >
            No data available for this period.
          </div>
        )}

        {data && (
          <>
            {/* LEFT: 2×2 charts (prev | curr) × (engagement | post) */}
            <div className="flex-1 flex flex-col gap-2 min-h-0 overflow-hidden">
              {/* Row 1: Average Engagement */}
              <div
                className="flex-1 rounded-xl overflow-hidden"
                style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
                  border: `1px solid ${theme.border}`,
                  boxShadow: theme.cardShadow,
                }}
              >
                <div className="px-3 pt-2 pb-0.5 shrink-0 flex items-center justify-between">
                  <span
                    className="text-[8px] font-bold uppercase tracking-wide"
                    style={{ color: isDark ? '#e2e8f0' : '#475569' }}
                  >
                    Average Engagement
                  </span>
                </div>
                <div className="flex h-[calc(100%-24px)] px-1 gap-1">
                  {/* Prev month */}
                  <div className="flex-1 flex flex-col min-h-0">
                    <span
                      className="text-[6.5px] font-semibold text-center pb-0.5 shrink-0"
                      style={{ color: isDark ? '#64748b' : '#94a3b8' }}
                    >
                      {prevLabel}
                    </span>
                    <div className="flex-1 min-h-0">
                      <PillarBarChart
                        data={engData.map((d) => ({ name: d.name, value: d.prev }))}
                        color={BAR_COLOR}
                        isDark={isDark}
                      />
                    </div>
                  </div>
                  {/* Divider */}
                  <div
                    className="w-px self-stretch my-2"
                    style={{ background: theme.border }}
                  />
                  {/* Curr month */}
                  <div className="flex-1 flex flex-col min-h-0">
                    <span
                      className="text-[6.5px] font-semibold text-center pb-0.5 shrink-0"
                      style={{ color: colorPrimary }}
                    >
                      {currLabel}
                    </span>
                    <div className="flex-1 min-h-0">
                      <PillarBarChart
                        data={engData.map((d) => ({ name: d.name, value: d.curr }))}
                        color={colorPrimary}
                        isDark={isDark}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2: Total Post */}
              <div
                className="flex-1 rounded-xl overflow-hidden"
                style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
                  border: `1px solid ${theme.border}`,
                  boxShadow: theme.cardShadow,
                }}
              >
                <div className="px-3 pt-2 pb-0.5 shrink-0 flex items-center justify-between">
                  <span
                    className="text-[8px] font-bold uppercase tracking-wide"
                    style={{ color: isDark ? '#e2e8f0' : '#475569' }}
                  >
                    Total Post
                  </span>
                </div>
                <div className="flex h-[calc(100%-24px)] px-1 gap-1">
                  <div className="flex-1 flex flex-col min-h-0">
                    <span
                      className="text-[6.5px] font-semibold text-center pb-0.5 shrink-0"
                      style={{ color: isDark ? '#64748b' : '#94a3b8' }}
                    >
                      {prevLabel}
                    </span>
                    <div className="flex-1 min-h-0">
                      <PillarBarChart
                        data={postData.map((d) => ({ name: d.name, value: d.prev }))}
                        color={BAR_COLOR}
                        isDark={isDark}
                      />
                    </div>
                  </div>
                  <div
                    className="w-px self-stretch my-2"
                    style={{ background: theme.border }}
                  />
                  <div className="flex-1 flex flex-col min-h-0">
                    <span
                      className="text-[6.5px] font-semibold text-center pb-0.5 shrink-0"
                      style={{ color: colorPrimary }}
                    >
                      {currLabel}
                    </span>
                    <div className="flex-1 min-h-0">
                      <PillarBarChart
                        data={postData.map((d) => ({ name: d.name, value: d.curr }))}
                        color={colorPrimary}
                        isDark={isDark}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: Two delta panels aligned with chart rows */}
            <div className="shrink-0 flex flex-col gap-2 min-h-0" style={{ width: 140 }}>
              <div
                className="flex-1 rounded-xl p-3 overflow-hidden"
                style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
                  border: `1px solid ${theme.border}`,
                  boxShadow: theme.cardShadow,
                }}
              >
                <DeltaPanel
                  title="Avg Engagement Δ"
                  deltas={data.deltaEng}
                  pillars={allPillars}
                  isDark={isDark}
                  colorPrimary={colorPrimary}
                />
              </div>
              <div
                className="flex-1 rounded-xl p-3 overflow-hidden"
                style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
                  border: `1px solid ${theme.border}`,
                  boxShadow: theme.cardShadow,
                }}
              >
                <DeltaPanel
                  title="Total Post Δ"
                  deltas={data.deltaPost}
                  pillars={allPillars}
                  isDark={isDark}
                  colorPrimary={colorPrimary}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Hidden export data */}
      {data && (
        <div
          style={{ display: 'none' }}
          data-ig-cp-eng={JSON.stringify({
            aon,
            currMonth: data.currMonth,
            prevMonth: data.prevMonth,
            engCurr: data.engCurr,
            engPrev: data.engPrev,
            postCurr: data.postCurr,
            postPrev: data.postPrev,
            deltaEng: data.deltaEng,
            deltaPost: data.deltaPost,
          })}
        />
      )}

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
