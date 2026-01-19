import React from 'react';

// --- HELPER: TEXT HIGHLIGHTER ---
export const renderTextWithHighlights = (text: string, isDark: boolean, highlightColor: string): React.ReactNode => {
  if (!text) return null;
  const parts = text.split(/(\*.*?\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <span key={index} className="font-bold" style={{ color: highlightColor }}>
          {part.slice(1, -1)}
        </span>
      );
    }
    return <span key={index}>{part}</span>;
  });
};

// --- FORMAT HELPERS ---
export const formatNumber = (num: number, isPct?: boolean): string => 
  isPct ? num.toFixed(2) : num.toLocaleString('en-US');

export const formatCompact = (num: number): string => 
  Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(num);

export const calculateGap = (curr: number, prev: number): string => 
  ((curr - prev) / prev * 100).toFixed(2) + '%';
