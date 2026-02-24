import React from 'react';

interface MiniTemplatePreviewProps {
  templateId: number;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export const MiniTemplatePreview: React.FC<MiniTemplatePreviewProps> = ({ templateId, colors }) => {
  switch (templateId) {
    // ── MODERN ──────────────────────────────────────
    case 1: // Neon Pulse
      return (
        <div className="w-full h-full relative overflow-hidden" style={{ background: '#0a0a0f' }}>
          <div
            className="absolute -top-4 -left-4 w-20 h-20 rounded-full opacity-40"
            style={{ backgroundColor: colors.primary, filter: 'blur(20px)' }}
          />
          <div
            className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full opacity-30"
            style={{ backgroundColor: colors.accent, filter: 'blur(16px)' }}
          />
          <svg className="absolute inset-0 w-full h-full opacity-[0.06]">
            <defs>
              <pattern id="ng-mini" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#ng-mini)" />
          </svg>
          <div
            className="absolute left-0 right-0 h-px opacity-40"
            style={{
              top: '40%',
              background: `linear-gradient(90deg, transparent, ${colors.primary}, transparent)`,
            }}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-white">
            <div
              className="w-7 h-7 rounded-full mb-2 flex items-center justify-center text-[10px]"
              style={{ background: `${colors.primary}33`, border: `1px solid ${colors.primary}55` }}
            >
              📊
            </div>
            <div
              className="text-xs font-black tracking-widest"
              style={{ textShadow: `0 0 10px ${colors.primary}88` }}
            >
              REPORT
            </div>
          </div>
        </div>
      );

    case 2: // Bold Split — editorial card
      return (
        <div
          className="w-full h-full relative overflow-hidden"
          style={{ backgroundColor: colors.primary }}
        >
          {/* White card offset right */}
          <div
            className="absolute top-2 bottom-2 right-0 bg-white"
            style={{ left: '28%', borderRadius: '6px 0 0 6px' }}
          />
          {/* Left panel dots */}
          <div className="absolute top-3 left-2 flex flex-col gap-1">
            <div className="w-2 h-2 rounded-full opacity-40" style={{ backgroundColor: 'white' }} />
            <div
              className="w-1.5 h-1.5 rounded-full opacity-25"
              style={{ backgroundColor: 'white' }}
            />
          </div>
          {/* Left side vertical accent bottom */}
          <div
            className="absolute bottom-3 left-2 right-[73%] h-0.5 rounded-full"
            style={{ backgroundColor: colors.accent }}
          />
          {/* Card content */}
          <div
            className="absolute top-0 bottom-0 flex flex-col justify-center px-2"
            style={{ left: '30%', right: 0 }}
          >
            <div
              className="w-3 h-0.5 mb-1 rounded-full"
              style={{ backgroundColor: colors.primary }}
            />
            <div className="text-[9px] font-black leading-tight" style={{ color: '#0f0f14' }}>
              REPORT
            </div>
          </div>
        </div>
      );

    case 3: // Glass Morphism
      return (
        <div
          className="w-full h-full relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${colors.primary}ee 0%, ${colors.secondary}cc 50%, ${colors.accent}aa 100%)`,
          }}
        >
          <div
            className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-40"
            style={{ backgroundColor: colors.accent, filter: 'blur(12px)' }}
          />
          <div
            className="absolute bottom-0 left-0 w-16 h-16 rounded-full opacity-30"
            style={{ backgroundColor: colors.secondary, filter: 'blur(12px)' }}
          />
          <div
            className="absolute inset-3 rounded-xl flex flex-col items-center justify-center"
            style={{
              background: 'rgba(255,255,255,0.14)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.25)',
            }}
          >
            <div className="text-[10px] mb-1">📊</div>
            <div className="text-xs font-black text-white">REPORT</div>
          </div>
        </div>
      );

    // ── GEOMETRIC ────────────────────────────────────
    case 4: // Prism
      return (
        <div className="w-full h-full relative overflow-hidden bg-gray-950">
          <svg className="absolute inset-0 w-full h-full">
            <polygon points="0,0 100%,0 60%,100%" fill={colors.primary} opacity="0.9" />
            <polygon points="60%,100% 100%,0 100%,100%" fill={colors.secondary} opacity="0.85" />
            <polygon points="0,0 30%,100% 0,100%" fill={colors.accent} opacity="0.7" />
          </svg>
          <div className="absolute inset-0 flex flex-col justify-end pb-3 px-3 text-white">
            <div className="text-xs font-black leading-tight">REPORT</div>
          </div>
          <div
            className="absolute top-2 right-2 w-4 h-4 transform rotate-45 opacity-30"
            style={{ border: '1px solid white' }}
          />
        </div>
      );

    case 5: // Bauhaus Grid
      return (
        <div className="w-full h-full relative bg-white overflow-hidden">
          <div
            className="absolute top-0 left-0 right-0 h-1.5"
            style={{ backgroundColor: colors.primary }}
          />
          <div
            className="absolute left-0 top-1.5 bottom-0 w-3"
            style={{ backgroundColor: colors.secondary }}
          />
          <div
            className="absolute right-3 top-3 w-10 h-10 rounded-full opacity-15"
            style={{ backgroundColor: colors.primary }}
          />
          <div
            className="absolute right-5 top-5 w-4 h-4 rounded-full opacity-25"
            style={{ backgroundColor: colors.accent }}
          />
          <div
            className="absolute bottom-0 right-0 w-14 h-8 opacity-10"
            style={{ backgroundColor: colors.accent }}
          />
          <div className="absolute inset-0 flex flex-col justify-center pl-5 pr-2">
            <div className="text-xs font-black leading-tight" style={{ color: colors.primary }}>
              REPORT
            </div>
            <div className="flex gap-1 mt-1">
              <div className="w-3 h-0.5 rounded" style={{ backgroundColor: colors.primary }} />
              <div className="w-1.5 h-0.5 rounded" style={{ backgroundColor: colors.secondary }} />
              <div className="w-1 h-0.5 rounded" style={{ backgroundColor: colors.accent }} />
            </div>
          </div>
        </div>
      );

    case 6: // Hexagon Mesh
      return (
        <div
          className="w-full h-full relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
          }}
        >
          <svg className="absolute inset-0 w-full h-full opacity-15">
            <defs>
              <pattern
                id="hex-mini"
                x="0"
                y="0"
                width="20"
                height="34"
                patternUnits="userSpaceOnUse"
              >
                <polygon
                  points="10,1 19,6 19,16 10,21 1,16 1,6"
                  fill="none"
                  stroke="white"
                  strokeWidth="1"
                />
                <polygon
                  points="10,18 19,23 19,33 10,38 1,33 1,23"
                  fill="none"
                  stroke="white"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hex-mini)" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <div className="text-[10px] mb-1">📊</div>
            <div className="text-xs font-black">REPORT</div>
          </div>
        </div>
      );

    // ── MINIMALIST ───────────────────────────────────
    case 7: // Clean Line
      return (
        <div className="w-full h-full relative bg-white overflow-hidden">
          <div
            className="absolute top-0 left-0 right-0 h-0.5"
            style={{ background: `linear-gradient(90deg, ${colors.primary}, ${colors.accent})` }}
          />
          <div
            className="absolute top-0 left-3 bottom-0 w-px opacity-10"
            style={{ backgroundColor: colors.primary }}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-3">
            <div className="w-5 h-px mb-2" style={{ backgroundColor: colors.primary }} />
            <div className="text-xs font-black" style={{ color: colors.primary }}>
              REPORT
            </div>
            <div className="w-5 h-px mt-2" style={{ backgroundColor: colors.accent }} />
          </div>
          <div className="absolute bottom-1.5 left-0 right-0 flex justify-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.primary }} />
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: colors.secondary }}
            />
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.accent }} />
          </div>
        </div>
      );

    case 8: // Asymmetric
      return (
        <div className="w-full h-full relative overflow-hidden" style={{ background: '#fafafa' }}>
          <div
            className="absolute left-3 top-3 bottom-3 w-0.5 rounded-full"
            style={{ background: `linear-gradient(180deg, ${colors.primary}, ${colors.accent})` }}
          />
          <div
            className="absolute right-3 top-3 w-8 h-8 rounded-full opacity-10"
            style={{ backgroundColor: colors.primary }}
          />
          <div className="absolute inset-0 flex flex-col justify-center pl-6 pr-2">
            <div
              className="text-[8px] font-bold tracking-wider uppercase opacity-50"
              style={{ color: colors.accent }}
            >
              Report
            </div>
            <div
              className="text-xs font-black leading-tight mt-0.5"
              style={{ color: colors.primary }}
            >
              REPORT
            </div>
          </div>
        </div>
      );

    case 9: // Nordic Frame
      return (
        <div className="w-full h-full relative bg-white overflow-hidden">
          <div
            className="absolute top-2 left-2 w-4 h-4"
            style={{
              borderTop: `1.5px solid ${colors.primary}`,
              borderLeft: `1.5px solid ${colors.primary}`,
            }}
          />
          <div
            className="absolute top-2 right-2 w-4 h-4"
            style={{
              borderTop: `1.5px solid ${colors.primary}`,
              borderRight: `1.5px solid ${colors.primary}`,
            }}
          />
          <div
            className="absolute bottom-2 left-2 w-4 h-4"
            style={{
              borderBottom: `1.5px solid ${colors.primary}`,
              borderLeft: `1.5px solid ${colors.primary}`,
            }}
          />
          <div
            className="absolute bottom-2 right-2 w-4 h-4"
            style={{
              borderBottom: `1.5px solid ${colors.primary}`,
              borderRight: `1.5px solid ${colors.primary}`,
            }}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <div className="text-[8px] tracking-widest uppercase text-gray-400 mb-1">Report</div>
            <div className="text-xs font-black tracking-tight" style={{ color: '#111' }}>
              ANALYTICS
            </div>
            <div className="flex gap-0.5 mt-2">
              <div className="w-4 h-0.5 rounded-full" style={{ backgroundColor: colors.primary }} />
              <div
                className="w-2 h-0.5 rounded-full"
                style={{ backgroundColor: colors.secondary }}
              />
              <div className="w-1 h-0.5 rounded-full" style={{ backgroundColor: colors.accent }} />
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
};
