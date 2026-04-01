'use client';

import React, { useEffect, useRef, useState } from 'react';
import { BarChart2, Trophy, TrendingDown, Loader2, ExternalLink, Sparkles } from 'lucide-react';
import { ReportConfig } from '@/app/types';
import { SlideFooter } from '@/app/components/ui/SlideFooter';
import { ChannelBadge } from '@/app/components/ui';
import { generateLayoutTheme } from '@/app/utils/themeStyles';
import { generateGeminiContent } from '@/app/utils/api';
import {
  IG_BEST_LEAST_ANALYST_SYSTEM_PROMPT,
  buildBestPostsPrompt,
  buildLeastPostsPrompt,
  parseIgBestLeastInsight,
  type ParsedInsight,
} from '@/app/innercircle/prompts/igBestLeastPrompt';

// instagram_page_9.py — Best 5 & Least 5 posts by engagement

interface PostCard {
  follows: number | null;
  reach: number | null;
  engagement: number | null;
  engagement_rate: number | null;
  url: string | null;
  image_url: string | null;
}

interface Props {
  config: ReportConfig;
  isThumbnail?: boolean;
  currentPage?: number;
  totalPages?: number;
  savedInsight?: string;
  onInsightChange?: (value: string) => void;
}

function fmtN(v: number | null | undefined): string {
  if (v === null || v === undefined) return '-';
  const n = Number(v);
  if (isNaN(n)) return '-';
  return n.toLocaleString();
}

function fmtER(v: number | null | undefined): string {
  if (v === null || v === undefined) return '-';
  const n = Number(v);
  if (isNaN(n)) return '-';
  const pct = Math.abs(n) <= 1 ? n * 100 : n;
  return `${pct.toFixed(2)}%`;
}

// ─── inline bold renderer ─────────────────────────────────────
const renderBoldInline = (text: string, color: string) =>
  text.split(/(\*\*.*?\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <span key={i} className="font-bold" style={{ color }}>{part.slice(2, -2)}</span>
      : <span key={i}>{part}</span>,
  );

// ─── InsightView ──────────────────────────────────────────────
const InsightView: React.FC<{
  parsed: ParsedInsight;
  isDark: boolean;
  colorPrimary: string;
  onEdit: () => void;
}> = ({ parsed, isDark, colorPrimary, onEdit }) => {
  const bodyColor = isDark ? '#cbd5e1' : '#475569';
  const labelColor = isDark ? '#e2e8f0' : '#374151';
  return (
    <div className="flex flex-col gap-1 w-full min-w-0 cursor-pointer" onClick={onEdit}>
      {parsed.analysis && (
        <div className="text-[8px] leading-relaxed break-words" style={{ color: bodyColor, overflowWrap: 'break-word' }}>
          {renderBoldInline(parsed.analysis, colorPrimary)}
        </div>
      )}
      {parsed.recommendations.map((rec) => (
        <div key={rec.type} className="text-[7.5px] leading-snug break-words" style={{ color: bodyColor, overflowWrap: 'break-word' }}>
          <span className="font-bold" style={{ color: labelColor }}>• {rec.type}: </span>
          {renderBoldInline(rec.text, colorPrimary)}
        </div>
      ))}
    </div>
  );
};

// ─── PostCardItem ─────────────────────────────────────────────
const PostCardItem: React.FC<{
  post: PostCard;
  rank: number;
  isDark: boolean;
  theme: ReturnType<typeof generateLayoutTheme>;
  badgeColor: string;
}> = ({ post, rank, isDark, theme, badgeColor }) => {
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
      className="flex flex-col rounded-xl overflow-hidden border flex-1 min-w-0"
      style={{
        backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#fff',
        border: `1px solid ${theme.border}`,
        boxShadow: theme.cardShadow,
      }}
    >
      <div className="relative flex-1 min-h-0">
        {imgLoading ? (
          <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc' }}>
            <Loader2 size={20} className="animate-spin" style={{ color: badgeColor }} />
          </div>
        ) : imageUrl ? (
          <img src={imageUrl} alt={`Post #${rank}`} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' }}>
            <span className="text-[8px]" style={{ color: isDark ? '#4b5563' : '#94a3b8' }}>No image</span>
          </div>
        )}
        <span className="absolute top-1.5 left-1.5 text-[9px] font-bold px-2 py-0.5 rounded-full text-white shadow z-10" style={{ backgroundColor: badgeColor }}>
          #{rank}
        </span>
      </div>
      <div className="p-2 shrink-0 space-y-1">
        {[
          { label: 'Follow', value: fmtN(post.follows) },
          { label: 'Reach', value: fmtN(post.reach) },
          { label: 'Engagement', value: fmtN(post.engagement) },
          { label: 'ER', value: fmtER(post.engagement_rate) },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between items-center gap-1">
            <span className="text-[9px]" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>{label}</span>
            <span className="text-[10px] font-semibold shrink-0" style={{ color: label === 'ER' ? badgeColor : isDark ? '#e2e8f0' : '#1e293b' }}>{value}</span>
          </div>
        ))}
        <div className="flex justify-between items-center gap-1">
          <span className="text-[9px]" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>Link</span>
          {post.url ? (
            <a href={post.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-0.5 text-[9px] font-semibold text-blue-500 hover:text-blue-600">
              <ExternalLink size={8} />View
            </a>
          ) : (
            <span className="text-[9px]" style={{ color: isDark ? '#4b5563' : '#d1d5db' }}>—</span>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Per-section analysis box ──────────────────────────────────
interface SectionBoxProps {
  label: string;
  Icon: React.ElementType;
  accentColor: string;
  posts: PostCard[];
  emptyMsg: string;
  insight: string;
  isGenerating: boolean;
  isEditing: boolean;
  editValue: string;
  isDark: boolean;
  theme: ReturnType<typeof generateLayoutTheme>;
  colorPrimary: string;
  onGenerate: () => void;
  onEditStart: () => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  onEditChange: (v: string) => void;
}

const SectionBox: React.FC<SectionBoxProps> = ({
  label, Icon, accentColor, posts, emptyMsg,
  insight, isGenerating, isEditing, editValue,
  isDark, theme, colorPrimary,
  onGenerate, onEditStart, onEditSave, onEditCancel, onEditChange,
}) => {
  const parsed: ParsedInsight = React.useMemo(() => parseIgBestLeastInsight(insight), [insight]);
  const hasContent = !!insight;

  return (
    <div className="flex-1 flex flex-col gap-2 min-w-0 min-h-0">
      {/* Section header */}
      <div className="flex items-center gap-2 rounded-lg px-3 py-1.5 shrink-0" style={{ backgroundColor: `${accentColor}15`, border: `1px solid ${accentColor}30` }}>
        <Icon size={12} style={{ color: accentColor }} />
        <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: accentColor }}>{label}</span>
      </div>

      {/* Posts row — selalu 5 slot agar ukuran konsisten */}
      <div className="flex gap-2 flex-1 min-h-0">
        {Array.from({ length: 5 }).map((_, i) => {
          const post = posts[i];
          if (post) {
            return <PostCardItem key={i} post={post} rank={i + 1} isDark={isDark} theme={theme} badgeColor={accentColor} />;
          }
          return (
            <div
              key={i}
              className="flex-1 min-w-0 rounded-xl flex items-center justify-center"
              style={{
                border: `1px dashed ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
                backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc',
              }}
            >
              {posts.length === 0 && i === 0 && (
                <span className="text-[9px] text-center px-2" style={{ color: isDark ? '#4b5563' : '#94a3b8' }}>{emptyMsg}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Analysis box */}
      <div
        className="shrink-0 rounded-xl border flex flex-col overflow-hidden"
        style={{
          height: 150,
          backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#fff',
          borderColor: `${accentColor}40`,
          boxShadow: theme.cardShadow,
        }}
      >
        {/* Box header */}
        <div className="flex items-center justify-between px-2.5 py-1 border-b shrink-0" style={{ borderColor: `${accentColor}25` }}>
          <div className="flex items-center gap-1">
            <Sparkles size={9} style={{ color: colorPrimary }} />
            <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: isDark ? '#e2e8f0' : '#475569' }}>Analysis</span>
          </div>
          <div className="flex items-center gap-1">
            {hasContent && !isEditing && (
              <button
                onClick={onEditStart}
                className="text-[8px] font-medium px-1.5 py-0.5 rounded-full border"
                style={{ color: isDark ? '#94a3b8' : '#64748b', borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0' }}
              >Edit</button>
            )}
            {isEditing && (
              <>
                <button onClick={onEditCancel} className="text-[8px] font-medium px-1.5 py-0.5 rounded-full border" style={{ color: isDark ? '#94a3b8' : '#64748b', borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0' }}>Cancel</button>
                <button onClick={onEditSave} className="text-[8px] font-medium px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: colorPrimary }}>Save</button>
              </>
            )}
            {!isEditing && (
              <button
                onClick={onGenerate}
                disabled={isGenerating}
                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-medium border disabled:opacity-50"
                style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#eef2ff', color: isDark ? '#94a3b8' : '#6366f1', borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#c7d2fe' }}
              >
                {isGenerating ? <Loader2 size={7} className="animate-spin" /> : <Sparkles size={7} />}
                <span>AI</span>
              </button>
            )}
          </div>
        </div>

        {/* Box content */}
        <div className="flex-1 min-h-0 px-2.5 py-1.5 overflow-y-auto overflow-x-hidden">
          {isGenerating ? (
            <div className="flex items-center gap-1 opacity-60">
              <Sparkles size={8} className="text-indigo-500 animate-spin" />
              <span className="text-[8px] text-indigo-500 animate-pulse">Analyzing…</span>
            </div>
          ) : isEditing ? (
            <textarea
              value={editValue}
              onChange={(e) => onEditChange(e.target.value)}
              autoFocus
              className="w-full h-full resize-none text-[8px] leading-relaxed focus:outline-none bg-transparent"
              style={{ color: isDark ? '#cbd5e1' : '#374151' }}
            />
          ) : hasContent ? (
            <InsightView parsed={parsed} isDark={isDark} colorPrimary={colorPrimary} onEdit={onEditStart} />
          ) : (
            <span
              className="text-[8px] cursor-pointer"
              style={{ color: isDark ? '#4b5563' : '#94a3b8' }}
              onClick={onGenerate}
            >Click AI to generate.</span>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────
export const IgBestLeastSlide: React.FC<Props> = ({
  config,
  isThumbnail = false,
  currentPage,
  totalPages,
  savedInsight,
  onInsightChange,
}) => {
  const [best, setBest] = useState<PostCard[]>([]);
  const [least, setLeast] = useState<PostCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Separate insight states for Best and Least
  // savedInsight stores "bestInsight|||leastInsight" — init eagerly for correct export DOM
  const [bestInsight, setBestInsight] = useState<string>(() => {
    if (!savedInsight) return '';
    return savedInsight.split('|||')[0] || '';
  });
  const [leastInsight, setLeastInsight] = useState<string>(() => {
    if (!savedInsight) return '';
    return savedInsight.split('|||')[1] || '';
  });
  const [bestGenerating, setBestGenerating] = useState(false);
  const [leastGenerating, setLeastGenerating] = useState(false);
  const [bestEditing, setBestEditing] = useState(false);
  const [leastEditing, setLeastEditing] = useState(false);
  const [bestEditVal, setBestEditVal] = useState('');
  const [leastEditVal, setLeastEditVal] = useState('');

  const persistInsight = (b: string, l: string) => {
    onInsightChange?.(`${b}|||${l}`);
  };

  useEffect(() => {
    if (!config.clientName || isThumbnail) return;
    setLoading(true);
    setError(null);
    fetch(`/api/innercircle/ig-best-least?brand=${encodeURIComponent(config.clientName)}&period=${encodeURIComponent(config.period)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        setBest(d.best || []);
        setLeast(d.least || []);
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [config.clientName, config.period, isThumbnail]);

  const contentMode = config.coverDesign?.contentMode || 'light';
  const theme = generateLayoutTheme(config.coverDesign?.colors, config.theme?.brandColor, contentMode);
  const isDark = contentMode === 'dark';
  const colorPrimary = theme.colors.primary;

  const BEST_COLOR = '#16a34a';
  const LEAST_COLOR = '#dc2626';

  const handleGenerateBest = async () => {
    setBestGenerating(true);
    try {
      const data = best.map((p, i) => ({
        rank: i + 1,
        follows: fmtN(p.follows),
        reach: fmtN(p.reach),
        engagement: fmtN(p.engagement),
        er: fmtER(p.engagement_rate),
      }));
      const prompt = buildBestPostsPrompt(config.clientName, config.period, data);
      const text = await generateGeminiContent(prompt, IG_BEST_LEAST_ANALYST_SYSTEM_PROMPT);
      setBestInsight(text);
      persistInsight(text, leastInsight);
    } catch { /* silently fail */ }
    finally { setBestGenerating(false); }
  };

  const handleGenerateLeast = async () => {
    setLeastGenerating(true);
    try {
      const data = least.map((p, i) => ({
        rank: i + 1,
        follows: fmtN(p.follows),
        reach: fmtN(p.reach),
        engagement: fmtN(p.engagement),
        er: fmtER(p.engagement_rate),
      }));
      const prompt = buildLeastPostsPrompt(config.clientName, config.period, data);
      const text = await generateGeminiContent(prompt, IG_BEST_LEAST_ANALYST_SYSTEM_PROMPT);
      setLeastInsight(text);
      persistInsight(bestInsight, text);
    } catch { /* silently fail */ }
    finally { setLeastGenerating(false); }
  };

  if (isThumbnail) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ fontFamily: config.font?.name || 'Inter', background: theme.pageBg }}>
        <p className={`text-4xl font-bold text-center px-4 leading-snug ${isDark ? 'text-white' : 'text-slate-800'}`}>
          {config.clientName || '—'}{' — '}Instagram Best &amp; Least
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden relative pb-14" style={{ fontFamily: config.font?.name || 'Inter', background: theme.pageBg }}>
      <div className="absolute top-0 left-0 right-0 h-0.75 z-10" style={{ background: theme.accentLine }} />
      <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full pointer-events-none" style={{ background: `${colorPrimary}18`, filter: 'blur(40px)' }} />

      {/* Header */}
      <div className="px-5 pt-4 shrink-0">
        <div className="rounded-xl p-3.5 flex items-center justify-between relative overflow-hidden" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff', border: `1px solid ${theme.border}`, boxShadow: theme.cardShadow }}>
          <div className="absolute top-0 left-0 w-1 h-full rounded-l-xl" style={{ background: theme.accentGradient }} />
          <div className="pl-3">
            <h1 className={`text-base font-bold tracking-tight leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {config.clientName || '—'}{' — '}Instagram Best &amp; Least
            </h1>
            <p className={`text-[10px] font-medium flex items-center gap-1 mt-1 uppercase tracking-wide ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
              <BarChart2 size={9} style={{ color: colorPrimary }} /> {config.period} Report · Top 5 Posts by Engagement
            </p>
          </div>
          {loading ? <Loader2 size={14} className="animate-spin text-slate-400" /> : <ChannelBadge channel="instagram" isDark={isDark} size="md" />}
        </div>
      </div>

      {error && (
        <div className="mx-5 mt-2 text-[9px] text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
      )}

      {/* Body */}
      <div className="flex-1 overflow-hidden px-5 pt-3 pb-2 flex gap-4 min-h-0">
        <SectionBox
          label="Best 5" Icon={Trophy} accentColor={BEST_COLOR}
          posts={best} emptyMsg="No best posts data"
          insight={bestInsight} isGenerating={bestGenerating}
          isEditing={bestEditing} editValue={bestEditVal}
          isDark={isDark} theme={theme} colorPrimary={colorPrimary}
          onGenerate={handleGenerateBest}
          onEditStart={() => { setBestEditVal(bestInsight); setBestEditing(true); }}
          onEditSave={() => { setBestInsight(bestEditVal); persistInsight(bestEditVal, leastInsight); setBestEditing(false); }}
          onEditCancel={() => setBestEditing(false)}
          onEditChange={setBestEditVal}
        />
        <SectionBox
          label="Least 5" Icon={TrendingDown} accentColor={LEAST_COLOR}
          posts={least} emptyMsg="No least posts data"
          insight={leastInsight} isGenerating={leastGenerating}
          isEditing={leastEditing} editValue={leastEditVal}
          isDark={isDark} theme={theme} colorPrimary={colorPrimary}
          onGenerate={handleGenerateLeast}
          onEditStart={() => { setLeastEditVal(leastInsight); setLeastEditing(true); }}
          onEditSave={() => { setLeastInsight(leastEditVal); persistInsight(bestInsight, leastEditVal); setLeastEditing(false); }}
          onEditCancel={() => setLeastEditing(false)}
          onEditChange={setLeastEditVal}
        />
      </div>

      {/* Hidden export data */}
      <div
        style={{ display: 'none' }}
        data-ic-best-data={JSON.stringify(best)}
        data-ic-least-data={JSON.stringify(least)}
        data-ic-best-analysis={bestInsight}
        data-ic-least-analysis={leastInsight}
      />

      <div className="absolute bottom-0 left-0 right-0">
        <SlideFooter clientName={config.clientName} period={config.period} currentPage={currentPage ?? 1} totalPages={totalPages ?? 1} logo={config.coverDesign?.logoData} brandColor={config.coverDesign?.colors?.primary} preparedBy={config.preparedBy} />
      </div>
    </div>
  );
};
