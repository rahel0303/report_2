'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  BarChart2,
  TrendingDown,
  TrendingUp,
  Loader2,
  Sparkles,
  Send,
  ExternalLink,
} from 'lucide-react';
import { generateGeminiContent } from '@/app/utils/api';
import { renderTextWithHighlights } from '@/app/utils/helpers';
import { ReportConfig } from '@/app/types';
import { SlideFooter } from '@/app/components/ui/SlideFooter';
import { ChannelBadge } from '@/app/components/ui';
import { generateLayoutTheme } from '@/app/utils/themeStyles';

// instagram_page_10.py — Content Pillar Analysis (Lowest/Highest per pillar)
// Layout: horizontal per pillar row — Lowest 3×2 | Highest 3×2 | Insight

const IG_ORANGE = '#E67E22';
const COLOR_HIGH = '#16a34a';
const COLOR_LOW = '#dc2626';

interface PostItem {
  reach: number | null;
  engagement: number | null;
  engagement_rate: number | null;
  saves: number | null;
  shares: number | null;
  comments: number | null;
  repost: number | null;
  format: string;
  url: string | null;
  image_url: string | null;
}

interface PillarData {
  pillar: string;
  lowest: PostItem[];
  highest: PostItem[];
}

interface Props {
  config: ReportConfig;
  isThumbnail?: boolean;
  currentPage?: number;
  totalPages?: number;
  pillarOffset?: number; // 0 = first 2 pillars, 2 = next 2, etc.
  onUpdate?: (key: string, value: any) => void;
}

function fmtN(v: number | null | undefined): string {
  if (v === null || v === undefined) return '-';
  const n = Number(v);
  if (isNaN(n)) return '-';
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

function fmtER(v: number | null | undefined): string {
  if (v === null || v === undefined) return '-';
  const n = Number(v);
  if (isNaN(n)) return '-';
  const pct = Math.abs(n) <= 1 ? n * 100 : n;
  return `${pct.toFixed(2)}%`;
}

// ── Metric row inside PostCard ───────────────────────────────────────────────
const MetricRow: React.FC<{ label: string; value: string; isDark: boolean; color?: string }> = ({
  label,
  value,
  isDark,
  color,
}) => (
  <div className="flex justify-between items-center">
    <span className="text-[4.5px] shrink-0" style={{ color: isDark ? '#6b7280' : '#9ca3af' }}>
      {label}
    </span>
    <span
      className="text-[5px] font-bold"
      style={{ color: color || (isDark ? '#d1d5db' : '#374151') }}
    >
      {value}
    </span>
  </div>
);

// ── Compact Post Card — horizontal layout: image LEFT, metrics RIGHT ─────────
const PostCard: React.FC<{
  post: PostItem;
  rank: number;
  isDark: boolean;
  accentColor: string;
}> = ({ post, rank, isDark, accentColor }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(post.image_url);
  const [imgLoading, setImgLoading] = useState(!post.image_url && !!post.url);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (post.image_url) return;
    if (!post.url || fetchedRef.current) return;
    fetchedRef.current = true;
    setImgLoading(true);
    fetch(`/api/innercircle/ig-thumbnail?url=${encodeURIComponent(post.url)}&channel=instagram`)
      .then((r) => r.json())
      .then((d) => setImageUrl(d.image_url || null))
      .catch(() => setImageUrl(null))
      .finally(() => setImgLoading(false));
  }, [post.url, post.image_url]);

  return (
    <div
      className="flex rounded-lg overflow-hidden min-w-0"
      style={{
        flex: '0 0 calc(33.33% - 2px)',
        maxWidth: 'calc(33.33% - 2px)',
        border: `1px solid ${accentColor}35`,
        backgroundColor: isDark ? `${accentColor}0D` : `${accentColor}08`,
      }}
    >
      {/* LEFT: Thumbnail — fixed width, full height */}
      <div className="relative shrink-0" style={{ width: '50%' }}>
        {imgLoading ? (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9' }}
          >
            <Loader2 size={8} className="animate-spin" style={{ color: accentColor }} />
          </div>
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt={`Post ${rank}`}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9' }}
          >
            <span className="text-[4px]" style={{ color: isDark ? '#4b5563' : '#94a3b8' }}>
              No img
            </span>
          </div>
        )}
        <span
          className="absolute top-0.5 left-0.5 text-[4px] font-bold px-0.5 py-0.5 rounded text-white leading-none z-10"
          style={{ backgroundColor: accentColor }}
        >
          #{rank}
        </span>
      </div>

      {/* RIGHT: Metrics — takes remaining width, evenly distributes rows */}
      <div className="flex-1 flex flex-col justify-between px-0.5 py-0.5 min-w-0">
        <MetricRow label="Reach" value={fmtN(post.reach)} isDark={isDark} />
        <MetricRow label="Eng" value={fmtN(post.engagement)} isDark={isDark} />
        <MetricRow
          label="ER"
          value={fmtER(post.engagement_rate)}
          isDark={isDark}
          color={accentColor}
        />
        <MetricRow label="Saves" value={fmtN(post.saves)} isDark={isDark} />
        <MetricRow label="Shares" value={fmtN(post.shares)} isDark={isDark} />
        <MetricRow label="Comments" value={fmtN(post.comments)} isDark={isDark} />
        <MetricRow label="Format" value={post.format || '-'} isDark={isDark} />
        {/* Link */}
        <div className="flex justify-between items-center">
          <span className="text-[4.5px] shrink-0" style={{ color: isDark ? '#6b7280' : '#9ca3af' }}>
            Link
          </span>
          {post.url ? (
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-0.5 text-[4.5px] font-bold"
              style={{ color: '#3b82f6' }}
            >
              <ExternalLink size={5} />
              View
            </a>
          ) : (
            <span className="text-[4.5px]" style={{ color: isDark ? '#4b5563' : '#d1d5db' }}>
              —
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Empty slot placeholder — fixed 1/3 width ───────────────────────────────
const EmptyPostSlot: React.FC<{ accentColor: string }> = ({ accentColor }) => (
  <div
    className="rounded-lg border border-dashed min-w-0"
    style={{
      flex: '0 0 calc(33.33% - 2px)',
      maxWidth: 'calc(33.33% - 2px)',
      borderColor: `${accentColor}28`,
    }}
  />
);

// ── Insight Box per pillar ────────────────────────────────────────────────────
interface InsightBoxProps {
  isDark: boolean;
  colorPrimary: string;
  borderColor: string;
  insight: string;
  isGenerating: boolean;
  isEditing: boolean;
  editValue: string;
  showAiInput: boolean;
  aiPrompt: string;
  onEdit: () => void;
  onSave: (v: string) => void;
  onToggleAi: () => void;
  onAiPromptChange: (v: string) => void;
  onGenerate: () => void;
}

const InsightBox: React.FC<InsightBoxProps> = ({
  isDark,
  colorPrimary,
  borderColor,
  insight,
  isGenerating,
  isEditing,
  editValue,
  showAiInput,
  aiPrompt,
  onEdit,
  onSave,
  onToggleAi,
  onAiPromptChange,
  onGenerate,
}) => (
  <div
    className="flex-1 rounded-lg border overflow-hidden flex flex-col min-h-0"
    style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc', borderColor }}
  >
    {/* Header */}
    <div
      className="flex items-center justify-between px-1.5 py-0.5 border-b shrink-0"
      style={{ borderColor }}
    >
      <div className="flex items-center gap-0.5">
        <Sparkles size={7} style={{ color: colorPrimary }} />
        <span
          className="text-[6px] font-bold uppercase tracking-wide"
          style={{ color: isDark ? '#e2e8f0' : '#475569' }}
        >
          Analysis
        </span>
      </div>
      <div className="flex items-center gap-0.5">
        {insight && !isEditing && (
          <button
            onClick={onEdit}
            className="text-[6px] font-medium px-1 py-0.5 rounded-full border"
            style={{
              color: isDark ? '#94a3b8' : '#64748b',
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
            }}
          >
            Edit
          </button>
        )}
        {isEditing && (
          <button
            onClick={() => onSave(editValue)}
            className="text-[6px] font-medium px-1 py-0.5 rounded-full border"
            style={{ color: colorPrimary, borderColor: colorPrimary }}
          >
            Done
          </button>
        )}
        <button
          onClick={onToggleAi}
          className="flex items-center gap-0.5 px-1 py-0.5 rounded-full text-[6px] font-medium border"
          style={
            showAiInput
              ? { backgroundColor: '#4f46e520', color: '#6366f1', borderColor: '#4f46e540' }
              : {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#eef2ff',
                  color: isDark ? '#94a3b8' : '#6366f1',
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#c7d2fe',
                }
          }
        >
          <Sparkles size={6} />
          <span>AI</span>
        </button>
      </div>
    </div>

    {/* AI prompt row */}
    {showAiInput && (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onGenerate();
        }}
        className="flex gap-0.5 px-1.5 py-0.5 border-b shrink-0"
        style={{
          backgroundColor: isDark ? 'rgba(99,102,241,0.08)' : '#eef2ff',
          borderColor: isDark ? 'rgba(99,102,241,0.2)' : '#c7d2fe',
        }}
      >
        <input
          type="text"
          value={aiPrompt}
          onChange={(e) => onAiPromptChange(e.target.value)}
          placeholder="Optional focus…"
          maxLength={150}
          className="flex-1 text-[6px] px-1 py-0.5 rounded border focus:outline-none placeholder:opacity-40"
          style={{
            background: isDark ? 'rgba(255,255,255,0.08)' : '#fff',
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#c7d2fe',
            color: isDark ? '#fff' : '#374151',
          }}
        />
        <button
          type="submit"
          disabled={isGenerating}
          className="bg-indigo-600 text-white px-1 rounded hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center"
        >
          {isGenerating ? <Loader2 size={7} className="animate-spin" /> : <Send size={7} />}
        </button>
      </form>
    )}

    {/* Content */}
    <div className="px-1.5 py-1 flex-1 overflow-y-auto">
      {isGenerating ? (
        <div className="flex items-center gap-1 opacity-60">
          <Sparkles size={7} className="text-indigo-500 animate-spin" />
          <span className="text-[6px] text-indigo-500 animate-pulse">Analyzing…</span>
        </div>
      ) : isEditing ? (
        <textarea
          value={editValue}
          onChange={(e) => onSave(e.target.value)}
          autoFocus
          className="w-full h-full resize-none text-[6px] leading-relaxed focus:outline-none bg-transparent"
          style={{ color: isDark ? '#cbd5e1' : '#374151' }}
        />
      ) : insight ? (
        <div
          className="text-[6px] leading-relaxed"
          style={{ color: isDark ? '#cbd5e1' : '#475569' }}
        >
          {renderTextWithHighlights(insight, isDark, colorPrimary)}
        </div>
      ) : (
        <span className="text-[6px]" style={{ color: isDark ? '#4b5563' : '#94a3b8' }}>
          Click AI to generate, or Edit to type manually.
        </span>
      )}
    </div>
  </div>
);

// ── Single Pillar Section — horizontal layout matching instagram_page_10.py ───
// [Sidebar] | [Lowest 3×2] | [Highest 3×2] | [Insight]
interface PillarSectionProps {
  data: PillarData;
  isDark: boolean;
  theme: ReturnType<typeof generateLayoutTheme>;
  colorPrimary: string;
  insight: string;
  isGenerating: boolean;
  isEditing: boolean;
  editValue: string;
  showAiInput: boolean;
  aiPrompt: string;
  onEditStart: () => void;
  onEditSave: (v: string) => void;
  onToggleAi: () => void;
  onAiPromptChange: (v: string) => void;
  onGenerate: () => void;
}

const PostRow: React.FC<{
  posts: PostItem[];
  indices: [number, number, number];
  accentColor: string;
  isDark: boolean;
}> = ({ posts, indices, accentColor, isDark }) => (
  <div className="flex gap-0.5 flex-1 min-h-0">
    {indices.map((i) =>
      posts[i] ? (
        <PostCard key={i} post={posts[i]} rank={i + 1} isDark={isDark} accentColor={accentColor} />
      ) : (
        <EmptyPostSlot key={`e${i}`} accentColor={accentColor} />
      ),
    )}
  </div>
);

const PillarSection: React.FC<PillarSectionProps> = ({
  data,
  isDark,
  theme,
  colorPrimary,
  insight,
  isGenerating,
  isEditing,
  editValue,
  showAiInput,
  aiPrompt,
  onEditStart,
  onEditSave,
  onToggleAi,
  onAiPromptChange,
  onGenerate,
}) => (
  <div className="flex gap-1.5 w-full h-full min-h-0 overflow-hidden">
    {/* LEFT: Pillar name sidebar */}
    <div
      className="flex items-center justify-center shrink-0 rounded-lg"
      style={{
        width: 22,
        backgroundColor: `${colorPrimary}12`,
        border: `1px solid ${colorPrimary}28`,
      }}
    >
      <span
        className="text-[6px] font-bold uppercase tracking-widest text-center leading-none"
        style={{
          color: colorPrimary,
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          transform: 'rotate(180deg)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          maxHeight: '100%',
        }}
      >
        {data.pillar}
      </span>
    </div>

    {/* LOWEST section — flex-1, 2 rows × 3 cards */}
    <div className="flex-1 flex flex-col gap-0.5 min-w-0 min-h-0">
      <div className="flex items-center gap-0.5 shrink-0">
        <TrendingDown size={6} style={{ color: COLOR_LOW }} />
        <span
          className="text-[5.5px] font-bold uppercase tracking-wide"
          style={{ color: COLOR_LOW }}
        >
          Lowest
        </span>
      </div>
      <PostRow posts={data.lowest} indices={[0, 1, 2]} accentColor={COLOR_LOW} isDark={isDark} />
      <PostRow posts={data.lowest} indices={[3, 4, 5]} accentColor={COLOR_LOW} isDark={isDark} />
    </div>

    {/* HIGHEST section — flex-1, 2 rows × 3 cards */}
    <div className="flex-1 flex flex-col gap-0.5 min-w-0 min-h-0">
      <div className="flex items-center gap-0.5 shrink-0">
        <TrendingUp size={6} style={{ color: COLOR_HIGH }} />
        <span
          className="text-[5.5px] font-bold uppercase tracking-wide"
          style={{ color: COLOR_HIGH }}
        >
          Highest
        </span>
      </div>
      <PostRow posts={data.highest} indices={[0, 1, 2]} accentColor={COLOR_HIGH} isDark={isDark} />
      <PostRow posts={data.highest} indices={[3, 4, 5]} accentColor={COLOR_HIGH} isDark={isDark} />
    </div>

    {/* INSIGHT box — fixed width */}
    <div className="flex flex-col shrink-0 min-h-0" style={{ width: '21%' }}>
      <div className="flex items-center gap-0.5 shrink-0" style={{ height: 14 }}>
        <Sparkles size={6} style={{ color: colorPrimary }} />
        <span
          className="text-[5.5px] font-bold uppercase tracking-wide"
          style={{ color: isDark ? '#e2e8f0' : '#475569' }}
        >
          Insight
        </span>
      </div>
      <InsightBox
        isDark={isDark}
        colorPrimary={colorPrimary}
        borderColor={theme.border}
        insight={insight}
        isGenerating={isGenerating}
        isEditing={isEditing}
        editValue={editValue}
        showAiInput={showAiInput}
        aiPrompt={aiPrompt}
        onEdit={onEditStart}
        onSave={onEditSave}
        onToggleAi={onToggleAi}
        onAiPromptChange={onAiPromptChange}
        onGenerate={onGenerate}
      />
    </div>
  </div>
);

// ── Main slide component ──────────────────────────────────────────────────────
export const IgContentPillarSlide: React.FC<Props> = ({
  config,
  isThumbnail = false,
  currentPage,
  totalPages,
  pillarOffset = 0,
  onUpdate,
}) => {
  const [pillars, setPillars] = useState<PillarData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Per-pillar insight states (keyed by pillar name)
  const [insights, setInsights] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [showAiInputs, setShowAiInputs] = useState<Record<string, boolean>>({});
  const [aiPrompts, setAiPrompts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!config.clientName || isThumbnail) return;
    setLoading(true);
    setError(null);
    fetch(
      `/api/innercircle/ig-content-pillar?brand=${encodeURIComponent(config.clientName)}&period=${encodeURIComponent(config.period)}`,
    )
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        const fetched: PillarData[] = d.pillars || [];
        setPillars(fetched);
        if (pillarOffset === 0 && fetched.length > 0) {
          onUpdate?.('_pillarSlidesNeeded', fetched.length);
        }
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

  const visiblePillars = pillars.slice(pillarOffset, pillarOffset + 2);

  const handleGenerate = async (pillarName: string) => {
    const pillar = pillars.find((p) => p.pillar === pillarName);
    if (!pillar) return;
    setGenerating((g) => ({ ...g, [pillarName]: true }));
    setShowAiInputs((a) => ({ ...a, [pillarName]: false }));
    try {
      const avgLow = fmtN(
        pillar.lowest.reduce((s, p) => s + (p.engagement || 0), 0) / (pillar.lowest.length || 1),
      );
      const avgHigh = fmtN(
        pillar.highest.reduce((s, p) => s + (p.engagement || 0), 0) / (pillar.highest.length || 1),
      );
      const focus = aiPrompts[pillarName] ? `\n\nFocus: ${aiPrompts[pillarName]}` : '';
      const prompt = `Analyze Instagram Content Pillar "${pillarName}" for ${config.clientName} in ${config.period}.\nLowest posts (${pillar.lowest.length}): avg engagement ${avgLow}\nHighest posts (${pillar.highest.length}): avg engagement ${avgHigh}${focus}\n\nGenerate 2-3 SHORT bullet points (start each with -). Each under 120 chars. Use **bold** for key numbers. Write in English.`;
      const result = await generateGeminiContent(prompt);
      setInsights((i) => ({ ...i, [pillarName]: result }));
    } catch (err) {
      console.error('AI error', err);
    } finally {
      setGenerating((g) => ({ ...g, [pillarName]: false }));
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
          {config.clientName || '—'} — Content Pillar
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
              {config.clientName || '—'} — Instagram Content Pillar
            </h1>
            <p
              className={`text-[10px] font-medium flex items-center gap-1 mt-1 uppercase tracking-wide ${isDark ? 'text-slate-300' : 'text-slate-500'}`}
            >
              <BarChart2 size={9} style={{ color: colorPrimary }} /> {config.period} · Lowest &amp;
              Highest 6 Posts per Pillar
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

      {/* Body: 2 pillar sections stacked */}
      <div className="flex-1 flex flex-col px-5 pt-2 pb-1 gap-0 min-h-0 overflow-hidden">
        {loading && pillars.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-slate-400" />
          </div>
        )}
        {!loading && pillars.length === 0 && !error && (
          <div
            className="flex-1 flex items-center justify-center text-[11px] rounded-xl border-2 border-dashed"
            style={{ color: isDark ? '#4b5563' : '#94a3b8', borderColor: theme.border }}
          >
            No content pillar data available for this period.
          </div>
        )}

        {visiblePillars.map((pillar, idx) => (
          <div
            key={pillar.pillar}
            className="flex-1 min-h-0 rounded-xl p-2 overflow-hidden"
            style={{
              backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
              border: `1px solid ${theme.border}`,
              boxShadow: theme.cardShadow,
              marginBottom: idx === 0 && visiblePillars.length > 1 ? 8 : 0,
            }}
          >
            <PillarSection
              data={pillar}
              isDark={isDark}
              theme={theme}
              colorPrimary={colorPrimary}
              insight={insights[pillar.pillar] || ''}
              isGenerating={generating[pillar.pillar] || false}
              isEditing={editing[pillar.pillar] || false}
              editValue={editValues[pillar.pillar] ?? insights[pillar.pillar] ?? ''}
              showAiInput={showAiInputs[pillar.pillar] || false}
              aiPrompt={aiPrompts[pillar.pillar] || ''}
              onEditStart={() => {
                setEditValues((v) => ({ ...v, [pillar.pillar]: insights[pillar.pillar] || '' }));
                setEditing((e) => ({ ...e, [pillar.pillar]: true }));
                setShowAiInputs((a) => ({ ...a, [pillar.pillar]: false }));
              }}
              onEditSave={(v) => {
                setEditValues((ev) => ({ ...ev, [pillar.pillar]: v }));
                setInsights((i) => ({ ...i, [pillar.pillar]: v }));
              }}
              onToggleAi={() => {
                setShowAiInputs((a) => ({ ...a, [pillar.pillar]: !a[pillar.pillar] }));
                setEditing((e) => ({ ...e, [pillar.pillar]: false }));
              }}
              onAiPromptChange={(v) => setAiPrompts((p) => ({ ...p, [pillar.pillar]: v }))}
              onGenerate={() => handleGenerate(pillar.pillar)}
            />
          </div>
        ))}

        {!loading && visiblePillars.length === 1 && (
          <div
            className="flex-1 rounded-xl border-2 border-dashed flex items-center justify-center text-[10px]"
            style={{ color: isDark ? '#4b5563' : '#94a3b8', borderColor: theme.border }}
          >
            No more pillars
          </div>
        )}
      </div>

      {/* Hidden export data — read by pptxExporter */}
      <div
        style={{ display: 'none' }}
        data-ic-content-pillar={JSON.stringify(
          visiblePillars.map((p) => ({
            pillar: p.pillar,
            lowest: p.lowest,
            highest: p.highest,
            insight: insights[p.pillar] || '',
          })),
        )}
      />

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
