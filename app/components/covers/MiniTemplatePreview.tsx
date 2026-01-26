import React from 'react';

interface MiniTemplatePreviewProps {
  templateId: number;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

// Helper function to determine if color is light or dark
function isLightColor(color: string): boolean {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155;
}

export const MiniTemplatePreview: React.FC<MiniTemplatePreviewProps> = ({ templateId, colors }) => {
  const textColor = isLightColor(colors.primary) ? 'text-gray-900' : 'text-white';

  switch (templateId) {
    case 1: // Geometric
      return (
        <div
          className="w-full h-full relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
          }}
        >
          {/* Mini Geometric Shapes */}
          <div
            className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20"
            style={{ backgroundColor: colors.accent }}
          />
          <div
            className="absolute bottom-0 left-0 w-16 h-16 opacity-15 transform rotate-45"
            style={{ backgroundColor: colors.accent }}
          />
          <div className="absolute top-8 left-8">
            <div
              className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-b-[25px] opacity-10"
              style={{ borderBottomColor: colors.accent }}
            />
          </div>

          {/* Content */}
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center p-3 ${textColor}`}
          >
            <div className="w-8 h-8 bg-white/20 rounded mb-2 flex items-center justify-center text-xs">
              📊
            </div>
            <div className="text-center">
              <div className="text-xs font-bold mb-1">REPORT</div>
              <div className="text-[8px] opacity-80">Analytics</div>
            </div>
          </div>
        </div>
      );

    case 2: // Fluid Waves
      return (
        <div className="w-full h-full relative bg-white overflow-hidden">
          {/* Mini Waves */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 300 200"
            preserveAspectRatio="none"
          >
            <path
              d="M0,100 Q75,75 150,100 T300,100 L300,200 L0,200 Z"
              fill={colors.primary}
              opacity="0.7"
            />
            <path
              d="M0,120 Q75,95 150,120 T300,120 L300,200 L0,200 Z"
              fill={colors.secondary}
              opacity="0.5"
            />
            <path
              d="M0,140 Q75,115 150,140 T300,140 L300,200 L0,200 Z"
              fill={colors.accent}
              opacity="0.3"
            />
          </svg>

          {/* Content */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center p-3"
            style={{ color: colors.primary }}
          >
            <div className="w-8 h-8 bg-white rounded-full shadow mb-2 flex items-center justify-center text-xs">
              📊
            </div>
            <div className="text-center">
              <div className="text-xs font-bold mb-1">REPORT</div>
              <div className="text-[8px] opacity-70">Analytics</div>
            </div>
          </div>
        </div>
      );

    case 3: // Abstract
      return (
        <div
          className="w-full h-full relative overflow-hidden"
          style={{ background: colors.primary }}
        >
          {/* Mini Blobs */}
          <div
            className="absolute -top-8 -left-8 w-24 h-24 rounded-full opacity-30 blur-xl"
            style={{ backgroundColor: colors.accent }}
          />
          <div
            className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full opacity-30 blur-xl"
            style={{ backgroundColor: colors.secondary }}
          />
          <div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full opacity-20 blur-lg"
            style={{ backgroundColor: colors.accent }}
          />

          {/* Abstract Lines */}
          <svg className="absolute inset-0 w-full h-full opacity-20">
            <path d="M0,25 Q75,50 150,25 T300,25" stroke="white" strokeWidth="2" fill="none" />
            <path d="M0,75 Q75,100 150,75 T300,75" stroke="white" strokeWidth="2" fill="none" />
          </svg>

          {/* Content */}
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center p-3 ${textColor}`}
          >
            <div className="w-8 h-8 bg-white/20 backdrop-blur rounded mb-2 flex items-center justify-center text-xs">
              📊
            </div>
            <div className="text-center">
              <div className="text-xs font-bold mb-1">REPORT</div>
              <div className="text-[8px] opacity-80">Analytics</div>
            </div>
          </div>
        </div>
      );

    case 4: // Minimal Gradient
      return (
        <div
          className="w-full h-full relative overflow-hidden"
          style={{
            background: `linear-gradient(to bottom right, ${colors.primary}, ${colors.secondary}, ${colors.accent})`,
          }}
        >
          {/* Subtle Pattern */}
          <svg className="absolute inset-0 w-full h-full opacity-10">
            <defs>
              <pattern
                id={`dots-mini-${templateId}`}
                x="0"
                y="0"
                width="20"
                height="20"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="2" cy="2" r="1" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#dots-mini-${templateId})`} />
          </svg>

          <div className="absolute top-1/4 right-1/4 w-16 h-16 rounded-full bg-white opacity-5 blur-lg" />

          {/* Content */}
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center p-3 ${textColor}`}
          >
            <div className="w-8 h-8 bg-white/10 backdrop-blur rounded-lg mb-2 flex items-center justify-center text-xs shadow-lg">
              📊
            </div>
            <div className="text-center">
              <div className="text-xs font-bold mb-1 tracking-tight">REPORT</div>
              <div className="text-[8px] opacity-80 font-light">Analytics</div>
            </div>
          </div>
        </div>
      );

    case 5: // Modern Grid
      return (
        <div className="w-full h-full relative bg-white overflow-hidden">
          {/* Mini Grid */}
          <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 gap-0">
            <div className="opacity-70" style={{ backgroundColor: colors.primary }} />
            <div className="bg-gray-100" />
            <div className="bg-gray-50" />
            <div className="bg-gray-100" />
            <div className="bg-gray-50" />
            <div className="opacity-50" style={{ backgroundColor: colors.secondary }} />
            <div className="bg-gray-100" />
            <div className="bg-gray-50" />
            <div className="bg-gray-100" />
            <div className="bg-gray-50" />
            <div className="opacity-60" style={{ backgroundColor: colors.accent }} />
            <div className="bg-gray-100" />
            <div className="bg-gray-50" />
            <div className="bg-gray-100" />
            <div className="bg-gray-50" />
            <div className="bg-gray-100" />
          </div>

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-white/85 to-white/75" />

          {/* Accent Line */}
          <div
            className="absolute top-0 left-0 w-1 h-full opacity-70"
            style={{ backgroundColor: colors.primary }}
          />

          {/* Content */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center p-3"
            style={{ color: colors.primary }}
          >
            <div
              className="w-8 h-8 bg-white border-2 rounded mb-2 flex items-center justify-center text-xs shadow"
              style={{ borderColor: colors.primary }}
            >
              📊
            </div>
            <div className="text-center">
              <div className="text-xs font-bold mb-1">REPORT</div>
              <div className="text-[8px] opacity-70 font-medium">Analytics</div>
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
};
