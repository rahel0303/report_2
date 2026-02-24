import React from 'react';
import { CoverDesignProps } from '@/app/types/cover';
import { getAutoTextColor, ensureTextContrast } from '@/app/utils/colorExtractor';

// ─────────────────────────────────────────
//  MODERN – Template 1: Neon Pulse
// ─────────────────────────────────────────
export const ModernNeonTemplate: React.FC<CoverDesignProps> = ({
  colors,
  logo,
  title,
  subtitle,
  period,
  fontFamily,
  fontColor,
}) => {
  const textColor = fontColor || '#ffffff';
  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{ background: '#0a0a0f', fontFamily: fontFamily || 'Inter' }}
    >
      {/* Neon glow blobs */}
      <div className="absolute inset-0">
        <div
          className="absolute -top-24 -left-24 w-105 h-105 rounded-full opacity-30"
          style={{ backgroundColor: colors.primary, filter: 'blur(80px)' }}
        />
        <div
          className="absolute -bottom-24 -right-24 w-95 h-95 rounded-full opacity-25"
          style={{ backgroundColor: colors.accent, filter: 'blur(80px)' }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-75 h-75 rounded-full opacity-15"
          style={{ backgroundColor: colors.secondary, filter: 'blur(60px)' }}
        />
      </div>
      {/* Grid lines */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.04]">
        <defs>
          <pattern id="ng-grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#ng-grid)" />
      </svg>
      {/* Horizontal neon accent lines */}
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
      {/* Content */}
      <div
        data-cover-content
        className="relative z-10 flex flex-col items-center justify-center h-full px-12 text-white"
      >
        {logo && (
          <div className="mb-8 flex justify-center">
            <img
              src={logo}
              alt="Logo"
              className="h-16 object-contain"
              style={{ filter: 'drop-shadow(0 0 16px rgba(255,255,255,0.4))' }}
            />
          </div>
        )}
        <div
          className="text-xs font-bold tracking-[0.4em] uppercase mb-4"
          style={{ color: textColor, opacity: 0.6 }}
        >
          {period || 'Performance Report'}
        </div>
        <h1
          className="text-6xl font-black text-center mb-4 leading-tight"
          style={{
            color: textColor,
            textShadow: `0 0 40px ${colors.primary}88, 0 0 80px ${colors.primary}44`,
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className="text-xl text-center font-light tracking-wide"
            style={{ color: textColor, opacity: 0.7 }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────
//  MODERN – Template 2: Bold Split
// ─────────────────────────────────────────
export const ModernSplitTemplate: React.FC<CoverDesignProps> = ({
  colors,
  logo,
  title,
  subtitle,
  period,
  fontFamily,
  fontColor,
}) => {
  const titleColor = fontColor || '#0f0f14';
  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{ backgroundColor: colors.primary, fontFamily: fontFamily || 'Inter' }}
    >
      {/* Big white editorial card — offset right */}
      <div
        className="absolute top-8 bottom-8 right-0"
        style={{ left: '28%', backgroundColor: '#ffffff', borderRadius: '16px 0 0 16px' }}
      />

      {/* Left side: colored panel with accent elements */}
      <div
        className="absolute top-0 left-0 bottom-0 flex flex-col justify-between py-12 px-8"
        style={{ width: '32%' }}
      >
        {/* Top dots */}
        <div className="flex flex-col gap-2">
          <div
            className="w-6 h-6 rounded-full"
            style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
          />
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
          />
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
          />
        </div>
        {/* Bottom accent bar */}
        <div className="w-full h-1 rounded-full" style={{ backgroundColor: colors.accent }} />
      </div>

      {/* Right card content */}
      <div
        data-cover-content
        className="absolute top-0 bottom-0 flex flex-col justify-center px-10"
        style={{ left: '30%', right: 0 }}
      >
        {logo && (
          <div className="mb-6">
            <img src={logo} alt="Logo" className="h-12 object-contain" />
          </div>
        )}
        {/* Accent line */}
        <div className="w-10 h-1 mb-5 rounded-full" style={{ backgroundColor: colors.primary }} />
        <h1
          className="font-black leading-tight mb-4"
          style={{ color: titleColor, fontSize: '3.2rem' }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className="text-base font-medium mb-2"
            style={{ color: fontColor || colors.secondary }}
          >
            {subtitle}
          </p>
        )}
        <div
          className="text-xs tracking-widest uppercase"
          style={{ color: fontColor || '#999', opacity: 0.7 }}
        >
          {period}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────
//  MODERN – Template 3: Glass Morphism
// ─────────────────────────────────────────
export const ModernGlassTemplate: React.FC<CoverDesignProps> = ({
  colors,
  logo,
  title,
  subtitle,
  period,
  fontFamily,
  fontColor,
}) => {
  const textColor = fontColor || getAutoTextColor(colors.primary);
  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${colors.primary}ee 0%, ${colors.secondary}cc 50%, ${colors.accent}aa 100%)`,
        fontFamily: fontFamily || 'Inter',
      }}
    >
      {/* Mesh gradient orbs */}
      <div className="absolute inset-0">
        <div
          className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-40"
          style={{ backgroundColor: colors.accent, filter: 'blur(60px)' }}
        />
        <div
          className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-30"
          style={{ backgroundColor: colors.secondary, filter: 'blur(60px)' }}
        />
      </div>
      {/* Content — direct on gradient, no glass */}
      <div
        data-cover-content
        className="relative z-10 flex flex-col items-center justify-center h-full px-12 text-white text-center"
      >
        {logo && (
          <div className="mb-6">
            <img src={logo} alt="Logo" className="h-16 object-contain" />
          </div>
        )}
        <div
          className="text-xs font-semibold tracking-[0.3em] uppercase mb-3"
          style={{ color: textColor, opacity: 0.7 }}
        >
          {period}
        </div>
        <h1
          className="text-5xl font-black mb-3 leading-tight drop-shadow-lg"
          style={{ color: textColor }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-lg font-light" style={{ color: textColor, opacity: 0.75 }}>
            {subtitle}
          </p>
        )}
        <div className="flex gap-2 mt-6">
          <div className="w-2 h-2 rounded-full bg-white opacity-60" />
          <div className="w-2 h-2 rounded-full bg-white opacity-60" />
          <div className="w-2 h-2 rounded-full bg-white opacity-60" />
        </div>
      </div>
    </div>
  );
}; // end ModernGlassTemplate

// ─────────────────────────────────────────
//  GEOMETRIC – Template 4: Prism
// ─────────────────────────────────────────
export const GeometricPrismTemplate: React.FC<CoverDesignProps> = ({
  colors,
  logo,
  title,
  subtitle,
  period,
  fontFamily,
  fontColor,
}) => {
  const textColor = fontColor || '#ffffff';
  return (
    <div
      className="relative w-full h-full overflow-hidden bg-gray-950"
      style={{ fontFamily: fontFamily || 'Inter' }}
    >
      {/* Prism triangles — use viewBox so coordinates are resolution-independent */}
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
      {/* Sharp diagonal accent line */}
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
      {/* Content */}
      <div
        data-cover-content
        className="relative z-10 flex flex-col justify-end h-full pb-12 px-12 text-white"
      >
        {logo && (
          <div className="mb-6 inline-flex">
            <img
              src={logo}
              alt="Logo"
              className="h-12 object-contain"
              style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.6))' }}
            />
          </div>
        )}
        <div
          className="text-xs font-bold tracking-[0.4em] uppercase mb-3"
          style={{ color: textColor, opacity: 0.6 }}
        >
          {period}
        </div>
        <h1
          className="text-6xl font-black mb-3 leading-tight drop-shadow-2xl"
          style={{ color: textColor }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-xl font-light" style={{ color: textColor, opacity: 0.75 }}>
            {subtitle}
          </p>
        )}
        <div
          className="absolute top-8 right-8 w-16 h-16 transform rotate-45 opacity-20"
          style={{ border: '2px solid white' }}
        />
        <div
          className="absolute top-16 right-16 w-6 h-6 transform rotate-45 opacity-10"
          style={{ backgroundColor: 'white' }}
        />
      </div>
    </div>
  );
}; // end GeometricPrismTemplate

// ─────────────────────────────────────────
//  GEOMETRIC – Template 5: Bauhaus
// ─────────────────────────────────────────
export const GeometricBauhausTemplate: React.FC<CoverDesignProps> = ({
  colors,
  logo,
  title,
  subtitle,
  period,
  fontFamily,
  fontColor,
}) => {
  // Auto-contrast: if primary is too light for white bg, fall back to dark text
  const textColor = fontColor || ensureTextContrast(colors.primary, '#ffffff');
  return (
    <div
      className="relative w-full h-full overflow-hidden bg-white"
      style={{ fontFamily: fontFamily || 'Inter' }}
    >
      {/* Bauhaus color blocks */}
      <div className="absolute inset-0">
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
        <div
          className="absolute bottom-20 left-10 right-0 h-px"
          style={{ backgroundColor: colors.primary, opacity: 0.08 }}
        />
      </div>
      {/* Content */}
      <div
        data-cover-content
        className="relative z-10 flex flex-col justify-center h-full pl-20 pr-10"
      >
        {logo && (
          <div className="mb-6">
            <img src={logo} alt="Logo" className="h-14 object-contain" />
          </div>
        )}
        <div
          className="text-xs font-bold tracking-[0.4em] uppercase mb-4"
          style={{ color: fontColor || colors.accent }}
        >
          {period}
        </div>
        <h1 className="text-6xl font-black leading-tight mb-4" style={{ color: textColor }}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-xl font-medium" style={{ color: fontColor || '#6B7280' }}>
            {subtitle}
          </p>
        )}
        <div className="flex gap-2 mt-8">
          <div className="w-8 h-2 rounded-sm" style={{ backgroundColor: colors.primary }} />
          <div className="w-4 h-2 rounded-sm" style={{ backgroundColor: colors.secondary }} />
          <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: colors.accent }} />
        </div>
      </div>
    </div>
  );
}; // end GeometricBauhausTemplate

// ─────────────────────────────────────────
//  GEOMETRIC – Template 6: Hexagon Mesh
// ─────────────────────────────────────────
export const GeometricHexTemplate: React.FC<CoverDesignProps> = ({
  colors,
  logo,
  title,
  subtitle,
  period,
  fontFamily,
  fontColor,
}) => {
  // Auto-contrast: if primary gradient is light, use dark text instead of white
  const textColor = fontColor || getAutoTextColor(colors.primary);
  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
        fontFamily: fontFamily || 'Inter',
      }}
    >
      {/* Hexagon SVG pattern */}
      <svg className="absolute inset-0 w-full h-full opacity-10">
        <defs>
          <pattern
            id="hex-pattern"
            x="0"
            y="0"
            width="56"
            height="100"
            patternUnits="userSpaceOnUse"
          >
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
        <rect width="100%" height="100%" fill="url(#hex-pattern)" />
      </svg>
      {/* Large filled hexagon decorations */}
      <svg className="absolute -top-16 -right-16 w-96 h-96 opacity-20">
        <polygon points="192,10 338,96 338,288 192,374 46,288 46,96" fill={colors.accent} />
      </svg>
      <svg className="absolute -bottom-20 -left-16 w-72 h-72 opacity-15">
        <polygon points="144,10 254,72 254,216 144,278 34,216 34,72" fill="white" />
      </svg>
      {/* Content */}
      <div
        data-cover-content
        className="relative z-10 flex flex-col items-center justify-center h-full px-12 text-white text-center"
      >
        {logo && (
          <div className="mb-6">
            <img
              src={logo}
              alt="Logo"
              className="h-16 object-contain"
              style={{ filter: 'drop-shadow(0 2px 12px rgba(0,0,0,0.5))' }}
            />
          </div>
        )}
        <div
          className="text-xs font-bold tracking-[0.4em] uppercase mb-4"
          style={{ color: textColor, opacity: 0.6 }}
        >
          {period}
        </div>
        <h1
          className="text-6xl font-black mb-4 leading-tight drop-shadow-2xl"
          style={{ color: textColor }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-2xl font-light" style={{ color: textColor, opacity: 0.75 }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}; // end GeometricHexTemplate

// ─────────────────────────────────────────
//  MINIMALIST – Template 7: Clean Line
// ─────────────────────────────────────────
export const MinimalistCleanTemplate: React.FC<CoverDesignProps> = ({
  colors,
  logo,
  title,
  subtitle,
  period,
  fontFamily,
  fontColor,
}) => {
  // Auto-contrast: if primary is too light for white bg, fall back to dark text
  const textColor = fontColor || ensureTextContrast(colors.primary, '#ffffff');
  return (
    <div
      className="relative w-full h-full overflow-hidden bg-white"
      style={{ fontFamily: fontFamily || 'Inter' }}
    >
      {/* Very subtle dot grid */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.04]">
        <defs>
          <pattern id="mc-dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill={colors.primary} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#mc-dots)" />
      </svg>
      {/* Single accent bar top */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ background: `linear-gradient(90deg, ${colors.primary}, ${colors.accent})` }}
      />
      {/* Thin decorative vertical line left */}
      <div
        className="absolute top-0 left-16 bottom-0 w-px opacity-10"
        style={{ backgroundColor: colors.primary }}
      />
      {/* Content */}
      <div
        data-cover-content
        className="relative z-10 flex flex-col items-center justify-center h-full px-16 text-center"
      >
        {logo && (
          <div className="mb-8">
            <img src={logo} alt="Logo" className="h-14 object-contain mx-auto" />
          </div>
        )}
        <div className="w-12 h-px mb-6" style={{ backgroundColor: colors.primary }} />
        <div
          className="text-xs font-medium tracking-[0.5em] uppercase mb-5"
          style={{ color: textColor, opacity: 0.55 }}
        >
          {period}
        </div>
        <h1 className="text-6xl font-black leading-tight mb-5" style={{ color: textColor }}>
          {title}
        </h1>
        <div className="w-12 h-px mt-2 mb-5" style={{ backgroundColor: colors.accent }} />
        {subtitle && (
          <p className="text-lg font-light tracking-wide" style={{ color: fontColor || '#6B7280' }}>
            {subtitle}
          </p>
        )}
      </div>
      {/* Bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-16 py-4 border-t border-gray-100">
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.primary }} />
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.secondary }} />
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.accent }} />
        </div>
        <span className="text-xs text-gray-300 tracking-widest uppercase">Report</span>
      </div>
    </div>
  );
}; // end MinimalistCleanTemplate

// ─────────────────────────────────────────
//  MINIMALIST – Template 8: Asymmetric
// ─────────────────────────────────────────
export const MinimalistAsymmetricTemplate: React.FC<CoverDesignProps> = ({
  colors,
  logo,
  title,
  subtitle,
  period,
  fontFamily,
  fontColor,
}) => {
  // Auto-contrast: if primary is too light for #fafafa bg, fall back to dark text
  const textColor = fontColor || ensureTextContrast(colors.primary, '#fafafa');
  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{ background: '#fafafa', fontFamily: fontFamily || 'Inter' }}
    >
      {/* Large background letter */}
      <div
        className="absolute -right-8 top-1/2 -translate-y-1/2 text-[220px] font-black opacity-[0.04] leading-none select-none"
        style={{ color: colors.primary }}
      >
        R
      </div>
      {/* Thin vertical accent */}
      <div
        className="absolute left-16 top-12 bottom-12 w-0.75 rounded-full"
        style={{ background: `linear-gradient(180deg, ${colors.primary}, ${colors.accent})` }}
      />
      {/* Floating circles */}
      <div
        className="absolute right-24 top-16 w-24 h-24 rounded-full opacity-10"
        style={{ backgroundColor: colors.primary }}
      />
      <div
        className="absolute right-32 top-24 w-10 h-10 rounded-full opacity-15"
        style={{ backgroundColor: colors.accent }}
      />
      {/* Content */}
      <div
        data-cover-content
        className="relative z-10 flex flex-col justify-center h-full pl-24 pr-16"
      >
        {logo && (
          <div className="mb-6">
            <img src={logo} alt="Logo" className="h-12 object-contain" />
          </div>
        )}
        <div
          className="text-xs font-bold tracking-[0.5em] uppercase mb-4"
          style={{ color: fontColor || colors.accent }}
        >
          {period}
        </div>
        <h1 className="text-6xl font-black leading-[1.05] mb-6" style={{ color: textColor }}>
          {title}
        </h1>
        {subtitle && (
          <p
            className="text-xl font-light max-w-xs leading-relaxed"
            style={{ color: fontColor || '#6B7280' }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}; // end MinimalistAsymmetricTemplate

// ─────────────────────────────────────────
//  MINIMALIST – Template 9: Nordic Frame
// ─────────────────────────────────────────
export const MinimalistFrameTemplate: React.FC<CoverDesignProps> = ({
  colors,
  logo,
  title,
  subtitle,
  period,
  fontFamily,
  fontColor,
}) => {
  const textColor = fontColor || '#111';
  return (
    <div
      className="relative w-full h-full overflow-hidden bg-white"
      style={{ fontFamily: fontFamily || 'Inter' }}
    >
      {/* Corner accents */}
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
      {/* Subtle radial background wash */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          background: `radial-gradient(ellipse at center, ${colors.primary} 0%, transparent 70%)`,
        }}
      />
      {/* Content */}
      <div
        data-cover-content
        className="relative z-10 flex flex-col items-center justify-center h-full px-20 text-center"
      >
        {logo && (
          <div className="mb-8">
            <img src={logo} alt="Logo" className="h-12 object-contain mx-auto" />
          </div>
        )}
        <div
          className="text-[10px] font-semibold tracking-[0.6em] uppercase mb-6"
          style={{ color: fontColor || colors.secondary }}
        >
          {period}
        </div>
        <h1
          className="text-5xl font-black leading-tight mb-6 tracking-tight"
          style={{ color: textColor }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className="text-base font-light tracking-widest uppercase"
            style={{ color: fontColor || '#9CA3AF' }}
          >
            {subtitle}
          </p>
        )}
        <div className="flex gap-1 mt-8">
          <div className="w-12 h-1 rounded-full" style={{ backgroundColor: colors.primary }} />
          <div className="w-6 h-1 rounded-full" style={{ backgroundColor: colors.secondary }} />
          <div className="w-3 h-1 rounded-full" style={{ backgroundColor: colors.accent }} />
        </div>
      </div>
    </div>
  );
}; // end MinimalistFrameTemplate
