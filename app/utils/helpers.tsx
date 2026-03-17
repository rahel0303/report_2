import React from 'react';

// --- HELPER: TEXT HIGHLIGHTER ---
export const renderTextWithHighlights = (
  text: string,
  isDark: boolean,
  highlightColor: string,
): React.ReactNode => {
  if (!text) return null;

  const renderInline = (line: string, lineIdx: number) =>
    line.split(/(\*\*.*?\*\*)/g).map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <span key={`${lineIdx}-${i}`} className="font-bold" style={{ color: highlightColor }}>
            {part.slice(2, -2)}
          </span>
        );
      }
      return <span key={`${lineIdx}-${i}`}>{part}</span>;
    });

  const lines = text.split('\n');

  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (line.trim() === '') return null;
        const isBullet = /^[-•]\s/.test(line.trim());
        const content = isBullet ? line.trim().replace(/^[-•]\s*/, '') : line;
        if (isBullet) {
          return (
            <div key={i} className="flex gap-1.5 items-start leading-snug">
              <span className="shrink-0 mt-0.5" style={{ color: highlightColor }}>•</span>
              <span>{renderInline(content, i)}</span>
            </div>
          );
        }
        return <p key={i} className="leading-snug">{renderInline(content, i)}</p>;
      })}
    </div>
  );
};

// --- FORMAT HELPERS ---
export const formatNumber = (num: number, isPct?: boolean): string =>
  isPct ? num.toFixed(2) : num.toLocaleString('en-US');

export const formatCompact = (num: number): string =>
  Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(num);

export const calculateGap = (curr: number, prev: number): string =>
  (((curr - prev) / prev) * 100).toFixed(2) + '%';
