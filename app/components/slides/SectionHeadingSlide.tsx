import React, { useState, useEffect } from 'react';
import { ReportConfig } from '@/app/types';
import { generateLayoutTheme } from '@/app/utils/themeStyles';

interface SectionHeadingSlideProps {
  config: ReportConfig;
  title?: string;
  onTitleChange?: (title: string) => void;
  isExport?: boolean;
}

export const SectionHeadingSlide: React.FC<SectionHeadingSlideProps> = ({
  config,
  title = 'Section Title',
  onTitleChange,
  isExport = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);

  useEffect(() => {
    setEditValue(title);
  }, [title]);

  // Generate theme from cover design colors with content mode
  const contentMode = config.coverDesign?.contentMode || 'light';
  const theme = generateLayoutTheme(
    config.coverDesign?.colors,
    config.theme.brandColor,
    contentMode
  );
  const colors = theme.colors;

  const handleSave = () => {
    if (editValue.trim() && onTitleChange) {
      onTitleChange(editValue.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(title);
      setIsEditing(false);
    }
  };

  return (
    <div
      className="w-full h-full flex items-center justify-center relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
        fontFamily: config.font?.name || 'Inter',
      }}
    >
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Large gradient circle - top right */}
        <div
          className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full"
          style={{
            background: `radial-gradient(circle, ${colors.accent}30 0%, transparent 70%)`,
          }}
        />

        {/* Medium circle - bottom left */}
        <div
          className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full"
          style={{
            background: `radial-gradient(circle, ${colors.secondary}40 0%, transparent 70%)`,
          }}
        />

        {/* Geometric shapes */}
        <div
          className="absolute top-1/4 left-16 w-24 h-24 rounded-2xl transform rotate-45 opacity-10"
          style={{ backgroundColor: 'white' }}
        />
        <div
          className="absolute bottom-1/4 right-16 w-16 h-16 rounded-xl transform -rotate-12 opacity-10"
          style={{ backgroundColor: 'white' }}
        />

        {/* Decorative lines */}
        <div
          className="absolute left-0 top-1/2 transform -translate-y-1/2 w-20 h-1 rounded-r-full"
          style={{
            background: `linear-gradient(90deg, ${colors.accent}80 0%, transparent 100%)`,
          }}
        />
        <div
          className="absolute right-0 top-1/2 transform -translate-y-1/2 w-20 h-1 rounded-l-full"
          style={{
            background: `linear-gradient(270deg, ${colors.accent}80 0%, transparent 100%)`,
          }}
        />

        {/* Grid pattern overlay */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]">
          <defs>
            <pattern id="section-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#section-grid)" />
        </svg>

        {/* Floating dots */}
        <div className="absolute top-20 left-1/4 w-2 h-2 rounded-full bg-white/20" />
        <div className="absolute top-32 right-1/3 w-3 h-3 rounded-full bg-white/15" />
        <div className="absolute bottom-24 left-1/3 w-2 h-2 rounded-full bg-white/20" />
        <div className="absolute bottom-32 right-1/4 w-4 h-4 rounded-full bg-white/10" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center px-12 max-w-4xl">
        {/* Top decorative element */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div
            className="w-12 h-[2px] rounded-full"
            style={{ background: `linear-gradient(90deg, transparent, ${colors.accent})` }}
          />
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: colors.accent, boxShadow: `0 0 20px ${colors.accent}60` }}
          />
          <div
            className="w-12 h-[2px] rounded-full"
            style={{ background: `linear-gradient(270deg, transparent, ${colors.accent})` }}
          />
        </div>

        {/* Title */}
        {isEditing && !isExport ? (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            autoFocus
            className="w-full text-6xl md:text-7xl font-bold text-white text-center bg-transparent border-b-4 border-white/50 outline-none focus:border-white/80 transition-colors"
            style={{ fontFamily: config.font?.name || 'Inter' }}
            placeholder="Enter section title..."
          />
        ) : (
          <h1
            onClick={() => !isExport && setIsEditing(true)}
            className={`text-6xl md:text-7xl font-bold text-white ${
              !isExport ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''
            }`}
            style={{
              textShadow: '0 4px 30px rgba(0,0,0,0.3)',
              letterSpacing: '-0.02em',
            }}
            title={!isExport ? 'Click to edit' : undefined}
          >
            {title}
          </h1>
        )}

        {/* Bottom decorative element */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <div
            className="w-20 h-1 rounded-full opacity-40"
            style={{ backgroundColor: 'white' }}
          />
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: colors.accent }}
          />
          <div
            className="w-8 h-1 rounded-full opacity-30"
            style={{ backgroundColor: 'white' }}
          />
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: colors.accent }}
          />
          <div
            className="w-20 h-1 rounded-full opacity-40"
            style={{ backgroundColor: 'white' }}
          />
        </div>
      </div>

      {/* Corner accents */}
      <div
        className="absolute top-0 left-0 w-32 h-32"
        style={{
          background: `linear-gradient(135deg, ${colors.accent}15 0%, transparent 60%)`,
        }}
      />
      <div
        className="absolute bottom-0 right-0 w-32 h-32"
        style={{
          background: `linear-gradient(315deg, ${colors.accent}15 0%, transparent 60%)`,
        }}
      />
    </div>
  );
};
