'use client';
import React, { useState, useEffect } from 'react';
import { ReportConfig } from '@/app/types';
import { getAutoTextColor, ensureTextContrast } from '@/app/utils/colorExtractor';

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

  const templateId = Number(config.coverDesign?.templateId ?? 1);
  const fontFamily = config.font?.name || 'Inter';
  const colors = {
    primary: config.coverDesign?.colors?.primary || config.theme?.brandColor || '#3B82F6',
    secondary: config.coverDesign?.colors?.secondary || '#10B981',
    accent: config.coverDesign?.colors?.accent || '#F59E0B',
  };
  const fontColor = config.coverDesign?.fontColor;

  const handleSave = () => {
    if (editValue.trim() && onTitleChange) onTitleChange(editValue.trim());
    setIsEditing(false);
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    else if (e.key === 'Escape') {
      setEditValue(title);
      setIsEditing(false);
    }
  };

  const titleNode = (color: string, extraStyle?: React.CSSProperties) =>
    isEditing && !isExport ? (
      <input
        data-section-title="true"
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        autoFocus
        className="bg-transparent border-b-2 outline-none font-black w-full"
        style={{
          color,
          borderColor: `${color}99`,
          fontFamily,
          letterSpacing: '-0.03em',
          fontSize: '3.75rem',
          lineHeight: 1.1,
          textAlign: 'center',
          maxWidth: '860px',
          ...extraStyle,
        }}
        placeholder="Enter section title..."
      />
    ) : (
      <h1
        data-section-title="true"
        onClick={() => !isExport && setIsEditing(true)}
        className={`font-black leading-tight${!isExport ? ' cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
        style={{
          color,
          letterSpacing: '-0.03em',
          fontSize: '3.75rem',
          lineHeight: 1.1,
          textAlign: 'center',
          maxWidth: '860px',
          ...extraStyle,
        }}
        title={!isExport ? 'Click to edit' : undefined}
      >
        {title}
      </h1>
    );

  if (templateId === 1) {
    const textColor = fontColor || '#ffffff';
    return (
      <div
        className="w-full h-full relative overflow-hidden flex flex-col items-center justify-center"
        style={{ background: '#0a0a0f', fontFamily }}
      >
        <div
          className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-25"
          style={{ backgroundColor: colors.primary, filter: 'blur(80px)' }}
        />
        <div
          className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full opacity-20"
          style={{ backgroundColor: colors.accent, filter: 'blur(80px)' }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full opacity-10"
          style={{ backgroundColor: colors.secondary, filter: 'blur(60px)' }}
        />
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]">
          <defs>
            <pattern id="sh-ng" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M60 0L0 0 0 60" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#sh-ng)" />
        </svg>
        <div
          className="absolute left-0 right-0"
          style={{
            top: '30%',
            height: '1px',
            background: `linear-gradient(90deg, transparent, ${colors.primary}88, transparent)`,
          }}
        />
        <div
          className="absolute left-0 right-0"
          style={{
            top: '70%',
            height: '1px',
            background: `linear-gradient(90deg, transparent, ${colors.accent}66, transparent)`,
          }}
        />
        <div className="relative z-10 flex flex-col items-center text-center px-16">
          <div
            data-section-decoration="true"
            className="text-xs font-bold tracking-[0.4em] uppercase mb-6"
            style={{ color: textColor, opacity: 0.55 }}
          >
            Section
          </div>
          <div
            data-section-decoration="true"
            className="mb-8 rounded-full"
            style={{
              width: '56px',
              height: '3px',
              background: `linear-gradient(90deg, ${colors.primary}, ${colors.accent})`,
            }}
          />
          {titleNode(textColor, {
            textShadow: `0 0 40px ${colors.primary}88, 0 0 80px ${colors.primary}44`,
          })}
          <div data-section-decoration="true" className="flex items-center gap-3 mt-8">
            <div
              className="rounded-full"
              style={{
                width: '52px',
                height: '3px',
                background: `linear-gradient(90deg, ${colors.primary}, ${colors.accent})`,
              }}
            />
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.accent }} />
            <div
              className="rounded-full opacity-40"
              style={{ width: '28px', height: '3px', backgroundColor: colors.primary }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (templateId === 2) {
    const titleColor = fontColor || '#111111';
    return (
      <div
        className="w-full h-full relative overflow-hidden"
        style={{ backgroundColor: colors.primary, fontFamily }}
      >
        <div
          className="absolute top-8 bottom-8 right-0 bg-white"
          style={{ left: '28%', borderRadius: '16px 0 0 16px' }}
        />
        <div
          className="absolute top-0 left-0 bottom-0 flex flex-col justify-between py-12 px-8"
          style={{ width: '32%' }}
        >
          <div className="flex flex-col gap-2">
            <div
              className="w-6 h-6 rounded-full"
              style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
            />
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
            />
          </div>
          <div className="w-full h-1 rounded-full" style={{ backgroundColor: colors.accent }} />
        </div>
        <div
          className="absolute top-0 bottom-0 flex flex-col justify-center px-10"
          style={{ left: '30%', right: 0 }}
        >
          <div
            data-section-decoration="true"
            className="w-10 h-1 mb-6 rounded-full"
            style={{ backgroundColor: colors.primary }}
          />
          {isEditing && !isExport ? (
            <input
              data-section-title="true"
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              autoFocus
              className="bg-transparent border-b-2 outline-none font-black w-full"
              style={{
                color: titleColor,
                borderColor: `${titleColor}99`,
                fontFamily,
                letterSpacing: '-0.03em',
                fontSize: '3.5rem',
                lineHeight: 1.1,
                textAlign: 'left',
              }}
              placeholder="Enter section title..."
            />
          ) : (
            <h1
              data-section-title="true"
              onClick={() => !isExport && setIsEditing(true)}
              className={`font-black leading-tight${!isExport ? ' cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
              style={{
                color: titleColor,
                letterSpacing: '-0.03em',
                fontSize: '3.5rem',
                lineHeight: 1.1,
                textAlign: 'left',
              }}
              title={!isExport ? 'Click to edit' : undefined}
            >
              {title}
            </h1>
          )}
          <div data-section-decoration="true" className="flex items-center gap-2 mt-6">
            <div
              className="w-6 h-6 rounded-full"
              style={{ backgroundColor: colors.primary, opacity: 0.15 }}
            />
            <div
              className="w-12 h-1 rounded-full"
              style={{ backgroundColor: colors.secondary, opacity: 0.4 }}
            />
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: colors.accent, opacity: 0.3 }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (templateId === 3) {
    // Auto-contrast: gradient built from primary; if primary is light, use dark text
    const textColor = fontColor || getAutoTextColor(colors.primary);
    return (
      <div
        className="w-full h-full relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${colors.primary}ee 0%, ${colors.secondary}cc 50%, ${colors.accent}aa 100%)`,
          fontFamily,
        }}
      >
        <div
          className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-40"
          style={{ backgroundColor: colors.accent, filter: 'blur(60px)' }}
        />
        <div
          className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-30"
          style={{ backgroundColor: colors.secondary, filter: 'blur(60px)' }}
        />
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-16">
          <div
            data-section-decoration="true"
            className="text-xs font-semibold tracking-[0.4em] uppercase mb-3"
            style={{ color: textColor, opacity: 0.7 }}
          >
            Section
          </div>
          <div
            data-section-decoration="true"
            className="mb-8 rounded-full"
            style={{ width: '48px', height: '2px', backgroundColor: 'rgba(255,255,255,0.7)' }}
          />
          {titleNode(textColor)}
          <div data-section-decoration="true" className="flex gap-2 mt-8">
            <div className="w-2 h-2 rounded-full bg-white opacity-60" />
            <div className="w-2 h-2 rounded-full bg-white opacity-60" />
            <div className="w-2 h-2 rounded-full bg-white opacity-60" />
          </div>
        </div>
      </div>
    );
  }

  if (templateId === 4) {
    const textColor = fontColor || '#ffffff';
    return (
      <div className="w-full h-full relative overflow-hidden bg-gray-950" style={{ fontFamily }}>
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <polygon points="0,0 100,0 60,100" fill={colors.primary} opacity="0.9" />
          <polygon points="60,100 100,0 100,100" fill={colors.secondary} opacity="0.85" />
          <polygon points="0,0 30,100 0,100" fill={colors.accent} opacity="0.7" />
          <polygon points="0,0 60,100 30,100 0,60" fill={colors.primary} opacity="0.3" />
        </svg>
        <div
          className="absolute"
          style={{
            top: 0,
            left: '60%',
            width: '2px',
            height: '100%',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.4), transparent)',
          }}
        />
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-16">
          <div
            data-section-decoration="true"
            className="text-xs font-bold tracking-[0.5em] uppercase mb-4"
            style={{ color: textColor, opacity: 0.5 }}
          >
            Section
          </div>
          <div
            data-section-decoration="true"
            className="mb-8 rounded-full"
            style={{ width: '48px', height: '2px', backgroundColor: colors.primary }}
          />
          {titleNode(textColor, { textShadow: '0 4px 24px rgba(0,0,0,0.5)' })}
          <div data-section-decoration="true" className="flex items-center gap-3 mt-8">
            <div
              className="h-px rounded-full"
              style={{ width: '48px', backgroundColor: colors.primary }}
            />
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.accent }} />
          </div>
        </div>
      </div>
    );
  }

  if (templateId === 5) {
    // Auto-contrast: white bg + primary text → ensure readable
    const textColor = fontColor || ensureTextContrast(colors.primary, '#ffffff');
    return (
      <div className="w-full h-full relative overflow-hidden bg-white" style={{ fontFamily }}>
        <div
          className="absolute top-0 left-0 right-0 h-3"
          style={{ backgroundColor: colors.primary }}
        />
        <div
          className="absolute left-0 top-3 bottom-0 w-10"
          style={{ backgroundColor: colors.secondary }}
        />
        <div
          className="absolute bottom-0 right-0 w-64 h-40"
          style={{ backgroundColor: colors.accent, opacity: 0.15 }}
        />
        <div
          className="absolute right-16 top-16 w-52 h-52 rounded-full opacity-10"
          style={{ backgroundColor: colors.primary }}
        />
        <div
          className="absolute right-28 top-28 w-20 h-20 rounded-full opacity-25"
          style={{ backgroundColor: colors.accent }}
        />
        <div
          className="absolute bottom-16 left-10 right-0 h-px"
          style={{ backgroundColor: colors.primary, opacity: 0.15 }}
        />
        <div className="relative z-10 flex flex-col justify-center h-full pl-20 pr-10">
          <div
            data-section-decoration="true"
            className="text-xs font-bold tracking-[0.4em] uppercase mb-4"
            style={{ color: fontColor || colors.accent }}
          >
            Section
          </div>
          <div
            data-section-decoration="true"
            className="w-10 h-1 mb-6 rounded-full"
            style={{ backgroundColor: colors.primary }}
          />
          {isEditing && !isExport ? (
            <input
              data-section-title="true"
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              autoFocus
              className="bg-transparent border-b-2 outline-none font-black w-full"
              style={{
                color: textColor,
                borderColor: `${textColor}99`,
                fontFamily,
                letterSpacing: '-0.03em',
                fontSize: '3.5rem',
                lineHeight: 1.1,
                textAlign: 'left',
              }}
              placeholder="Enter section title..."
            />
          ) : (
            <h1
              data-section-title="true"
              onClick={() => !isExport && setIsEditing(true)}
              className={`font-black leading-tight${!isExport ? ' cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
              style={{
                color: textColor,
                letterSpacing: '-0.03em',
                fontSize: '3.5rem',
                lineHeight: 1.1,
                textAlign: 'left',
              }}
              title={!isExport ? 'Click to edit' : undefined}
            >
              {title}
            </h1>
          )}
          <div data-section-decoration="true" className="flex gap-2 mt-8">
            <div className="w-8 h-2 rounded-sm" style={{ backgroundColor: colors.primary }} />
            <div className="w-4 h-2 rounded-sm" style={{ backgroundColor: colors.secondary }} />
            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: colors.accent }} />
          </div>
        </div>
      </div>
    );
  }

  if (templateId === 6) {
    // Auto-contrast: gradient built from primary; if primary is light, use dark text
    const textColor = fontColor || getAutoTextColor(colors.primary);
    return (
      <div
        className="w-full h-full relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
          fontFamily,
        }}
      >
        <svg className="absolute inset-0 w-full h-full opacity-10">
          <defs>
            <pattern id="sh-hex" x="0" y="0" width="56" height="100" patternUnits="userSpaceOnUse">
              <polygon
                points="28,2 54,16 54,44 28,58 2,44 2,16"
                fill="none"
                stroke="white"
                strokeWidth="1.5"
              />
              <polygon
                points="28,52 54,66 54,94 28,108 2,94 2,66"
                fill="none"
                stroke="white"
                strokeWidth="1.5"
              />
              <polygon
                points="56,27 82,41 82,69 56,83 30,69 30,41"
                fill="none"
                stroke="white"
                strokeWidth="1.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#sh-hex)" />
        </svg>
        <svg className="absolute -top-16 -right-16 w-96 h-96 opacity-20">
          <polygon points="192,10 338,96 338,288 192,374 46,288 46,96" fill={colors.accent} />
        </svg>
        <svg className="absolute -bottom-20 -left-16 w-72 h-72 opacity-15">
          <polygon points="144,10 254,72 254,216 144,278 34,216 34,72" fill="white" />
        </svg>
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-16">
          {titleNode(textColor, { textShadow: '0 4px 24px rgba(0,0,0,0.4)' })}
        </div>
      </div>
    );
  }

  if (templateId === 7) {
    // Auto-contrast: white bg + primary text → ensure readable
    const textColor = fontColor || ensureTextContrast(colors.primary, '#ffffff');
    return (
      <div className="w-full h-full relative overflow-hidden bg-white" style={{ fontFamily }}>
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]">
          <defs>
            <pattern id="sh-dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill={colors.primary} />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#sh-dots)" />
        </svg>
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ background: `linear-gradient(90deg, ${colors.primary}, ${colors.accent})` }}
        />
        <div
          className="absolute top-0 left-16 bottom-0 w-px opacity-10"
          style={{ backgroundColor: colors.primary }}
        />
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-16">
          <div
            data-section-decoration="true"
            className="w-12 h-px mb-8"
            style={{ backgroundColor: colors.primary }}
          />
          {titleNode(textColor)}
          <div
            data-section-decoration="true"
            className="w-12 h-px mt-8"
            style={{ backgroundColor: colors.accent }}
          />
        </div>
      </div>
    );
  }

  if (templateId === 8) {
    // Auto-contrast: #fafafa bg + primary text → ensure readable
    const textColor = fontColor || ensureTextContrast(colors.primary, '#fafafa');
    return (
      <div
        className="w-full h-full relative overflow-hidden"
        style={{ background: '#fafafa', fontFamily }}
      >
        <div
          className="absolute -right-8 top-1/2 -translate-y-1/2 text-[220px] font-black opacity-[0.04] leading-none select-none"
          style={{ color: colors.primary }}
        >
          S
        </div>
        <div
          className="absolute left-16 top-12 bottom-12 rounded-full"
          style={{
            width: '3px',
            background: `linear-gradient(180deg, ${colors.primary}, ${colors.accent})`,
          }}
        />
        <div
          className="absolute right-24 top-16 w-24 h-24 rounded-full opacity-10"
          style={{ backgroundColor: colors.primary }}
        />
        <div
          className="absolute right-32 top-24 w-10 h-10 rounded-full opacity-15"
          style={{ backgroundColor: colors.accent }}
        />
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-16">
          <div
            data-section-decoration="true"
            className="text-xs font-bold tracking-[0.5em] uppercase mb-6"
            style={{ color: fontColor || colors.accent }}
          >
            Section
          </div>
          {titleNode(textColor)}
        </div>
      </div>
    );
  }

  if (templateId === 9) {
    const textColor = fontColor || '#111111';
    return (
      <div className="w-full h-full relative overflow-hidden bg-white" style={{ fontFamily }}>
        <div
          className="absolute top-6 left-6 w-12 h-12"
          style={{
            borderTop: `2px solid ${colors.primary}`,
            borderLeft: `2px solid ${colors.primary}`,
          }}
        />
        <div
          className="absolute top-6 right-6 w-12 h-12"
          style={{
            borderTop: `2px solid ${colors.primary}`,
            borderRight: `2px solid ${colors.primary}`,
          }}
        />
        <div
          className="absolute bottom-6 left-6 w-12 h-12"
          style={{
            borderBottom: `2px solid ${colors.primary}`,
            borderLeft: `2px solid ${colors.primary}`,
          }}
        />
        <div
          className="absolute bottom-6 right-6 w-12 h-12"
          style={{
            borderBottom: `2px solid ${colors.primary}`,
            borderRight: `2px solid ${colors.primary}`,
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            background: `radial-gradient(ellipse at center, ${colors.primary} 0%, transparent 70%)`,
          }}
        />
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-20">
          <div
            data-section-decoration="true"
            className="text-[10px] font-semibold tracking-[0.6em] uppercase mb-6"
            style={{ color: fontColor || colors.secondary }}
          >
            Section
          </div>
          {titleNode(textColor)}
          <div data-section-decoration="true" className="flex gap-1 mt-8">
            <div className="w-12 h-1 rounded-full" style={{ backgroundColor: colors.primary }} />
            <div className="w-6 h-1 rounded-full" style={{ backgroundColor: colors.secondary }} />
            <div className="w-3 h-1 rounded-full" style={{ backgroundColor: colors.accent }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full h-full flex items-center justify-center relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
        fontFamily,
      }}
    >
      <div className="relative z-10 text-center px-12">{titleNode(fontColor || '#ffffff')}</div>
    </div>
  );
};
