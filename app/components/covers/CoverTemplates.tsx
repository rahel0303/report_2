import React from 'react';
import { CoverDesignProps } from '@/app/types/cover';

// Template 1: Geometric Patterns
export const GeometricTemplate: React.FC<CoverDesignProps> = ({
  colors,
  logo,
  title,
  subtitle,
  period,
  fontFamily,
}) => {
  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
        fontFamily: fontFamily || 'Inter',
      }}
    >
      {/* Geometric Shapes Background */}
      <div className="absolute inset-0">
        {/* Large Circle */}
        <div
          className="absolute -top-20 -right-20 w-96 h-96 rounded-full opacity-20"
          style={{ backgroundColor: colors.accent }}
        />
        {/* Medium Square */}
        <div
          className="absolute bottom-0 left-0 w-64 h-64 opacity-15 transform rotate-45"
          style={{ backgroundColor: colors.accent }}
        />
        {/* Small Triangles */}
        <div className="absolute top-1/4 left-1/4">
          <div
            className="w-0 h-0 border-l-[60px] border-l-transparent border-r-[60px] border-r-transparent border-b-[100px] opacity-10"
            style={{ borderBottomColor: colors.accent }}
          />
        </div>
        <div className="absolute bottom-1/3 right-1/3">
          <div
            className="w-0 h-0 border-l-[40px] border-l-transparent border-r-[40px] border-r-transparent border-b-[70px] opacity-10 transform rotate-180"
            style={{ borderBottomColor: colors.accent }}
          />
        </div>
        {/* Grid Pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-5">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-12 text-white">
        {logo && (
          <div className="mb-8">
            <img src={logo} alt="Logo" className="h-24 object-contain" />
          </div>
        )}
        <h1 className="text-6xl font-bold text-center mb-4 drop-shadow-lg">{title}</h1>
        {subtitle && <p className="text-2xl text-center mb-2 opacity-90">{subtitle}</p>}
        {period && <p className="text-xl text-center opacity-75">{period}</p>}
      </div>
    </div>
  );
};

// Template 2: Fluid Waves
export const FluidWavesTemplate: React.FC<CoverDesignProps> = ({
  colors,
  logo,
  title,
  subtitle,
  period,
  fontFamily,
}) => {
  return (
    <div
      className="relative w-full h-full overflow-hidden bg-white"
      style={{ fontFamily: fontFamily || 'Inter' }}
    >
      {/* Wave Patterns */}
      <div className="absolute inset-0">
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 1200 800"
          preserveAspectRatio="none"
        >
          {/* Wave 1 */}
          <path
            d="M0,400 Q300,300 600,400 T1200,400 L1200,800 L0,800 Z"
            fill={colors.primary}
            opacity="0.8"
          />
          {/* Wave 2 */}
          <path
            d="M0,450 Q300,350 600,450 T1200,450 L1200,800 L0,800 Z"
            fill={colors.secondary}
            opacity="0.6"
          />
          {/* Wave 3 */}
          <path
            d="M0,500 Q300,400 600,500 T1200,500 L1200,800 L0,800 Z"
            fill={colors.accent}
            opacity="0.4"
          />
        </svg>

        {/* Decorative Circles */}
        <div
          className="absolute top-20 right-20 w-32 h-32 rounded-full opacity-20"
          style={{ backgroundColor: colors.accent }}
        />
        <div
          className="absolute top-40 right-40 w-20 h-20 rounded-full opacity-15"
          style={{ backgroundColor: colors.primary }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-12">
        {logo && (
          <div className="mb-8">
            <img src={logo} alt="Logo" className="h-24 object-contain" />
          </div>
        )}
        <h1
          className="text-6xl font-bold text-center mb-4 drop-shadow-lg"
          style={{ color: colors.primary }}
        >
          {title}
        </h1>
        {subtitle && <p className="text-2xl text-center mb-2 text-gray-700">{subtitle}</p>}
        {period && <p className="text-xl text-center text-gray-600">{period}</p>}
      </div>
    </div>
  );
};

// Template 3: Abstract Shapes
export const AbstractTemplate: React.FC<CoverDesignProps> = ({
  colors,
  logo,
  title,
  subtitle,
  period,
  fontFamily,
}) => {
  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{ background: colors.primary, fontFamily: fontFamily || 'Inter' }}
    >
      {/* Abstract Shapes */}
      <div className="absolute inset-0">
        {/* Large Blob 1 */}
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-30 blur-3xl"
          style={{ backgroundColor: colors.accent }}
        />
        {/* Large Blob 2 */}
        <div
          className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-30 blur-3xl"
          style={{ backgroundColor: colors.secondary }}
        />
        {/* Medium Blob */}
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full opacity-20 blur-2xl"
          style={{ backgroundColor: colors.accent }}
        />

        {/* Abstract Lines */}
        <svg className="absolute inset-0 w-full h-full opacity-20">
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: colors.accent, stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: colors.secondary, stopOpacity: 0 }} />
            </linearGradient>
          </defs>
          <path
            d="M0,100 Q300,200 600,100 T1200,100"
            stroke="url(#lineGradient)"
            strokeWidth="3"
            fill="none"
          />
          <path
            d="M0,300 Q300,400 600,300 T1200,300"
            stroke="url(#lineGradient)"
            strokeWidth="3"
            fill="none"
          />
          <path
            d="M0,600 Q300,500 600,600 T1200,600"
            stroke="url(#lineGradient)"
            strokeWidth="3"
            fill="none"
          />
        </svg>

        {/* Geometric Elements */}
        <div
          className="absolute top-20 left-20 w-24 h-24 transform rotate-45 opacity-20"
          style={{ backgroundColor: colors.accent }}
        />
        <div
          className="absolute bottom-20 right-20 w-32 h-32 rounded-full opacity-15"
          style={{ backgroundColor: colors.secondary }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-12 text-white">
        {logo && (
          <div className="mb-8">
            <img src={logo} alt="Logo" className="h-24 object-contain" />
          </div>
        )}
        <h1 className="text-6xl font-bold text-center mb-4 drop-shadow-lg">{title}</h1>
        {subtitle && <p className="text-2xl text-center mb-2 opacity-90">{subtitle}</p>}
        {period && <p className="text-xl text-center opacity-75">{period}</p>}
      </div>
    </div>
  );
};

// Template 4: Minimal Gradient
export const MinimalGradientTemplate: React.FC<CoverDesignProps> = ({
  colors,
  logo,
  title,
  subtitle,
  period,
  fontFamily,
}) => {
  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{
        background: `linear-gradient(to bottom right, ${colors.primary}, ${colors.secondary}, ${colors.accent})`,
        fontFamily: fontFamily || 'Inter',
      }}
    >
      {/* Subtle Pattern Overlay */}
      <div className="absolute inset-0">
        <svg className="w-full h-full opacity-10">
          <defs>
            <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>

        {/* Subtle Shapes */}
        <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full bg-white opacity-5 blur-2xl" />
        <div className="absolute bottom-1/3 left-1/4 w-48 h-48 rounded-full bg-white opacity-5 blur-2xl" />
      </div>

      {/* Decorative Line */}
      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-32 h-1 bg-white opacity-30" />
      <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-32 h-1 bg-white opacity-30" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-12 text-white">
        {logo && (
          <div className="mb-8 p-4 bg-white bg-opacity-10 rounded-2xl backdrop-blur-sm">
            <img src={logo} alt="Logo" className="h-24 object-contain" />
          </div>
        )}
        <h1 className="text-7xl font-bold text-center mb-4 drop-shadow-2xl tracking-tight">
          {title}
        </h1>
        {subtitle && <p className="text-2xl text-center mb-2 opacity-90 font-light">{subtitle}</p>}
        {period && <p className="text-xl text-center opacity-75 font-light">{period}</p>}
      </div>
    </div>
  );
};

// Template 5: Modern Grid
export const ModernGridTemplate: React.FC<CoverDesignProps> = ({
  colors,
  logo,
  title,
  subtitle,
  period,
  fontFamily,
}) => {
  return (
    <div
      className="relative w-full h-full overflow-hidden bg-white"
      style={{ fontFamily: fontFamily || 'Inter' }}
    >
      {/* Grid Background */}
      <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 gap-0">
        {/* Colored Grid Cells */}
        <div
          className="col-span-2 row-span-2 opacity-80"
          style={{ backgroundColor: colors.primary }}
        />
        <div className="col-span-4 row-span-2 bg-gray-100" />
        <div className="col-span-3 row-span-2 bg-gray-50" />
        <div
          className="col-span-2 row-span-2 opacity-60"
          style={{ backgroundColor: colors.secondary }}
        />
        <div className="col-span-1 row-span-2 bg-gray-100" />
        <div className="col-span-1 row-span-2 bg-gray-50" />
        <div
          className="col-span-2 row-span-2 opacity-70"
          style={{ backgroundColor: colors.accent }}
        />
        <div className="col-span-3 row-span-2 bg-gray-100" />
      </div>

      {/* Overlay with transparency */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-white/80 to-white/70" />

      {/* Accent Lines */}
      <div
        className="absolute top-0 left-0 w-2 h-full opacity-80"
        style={{ backgroundColor: colors.primary }}
      />
      <div
        className="absolute bottom-0 left-0 w-full h-2 opacity-80"
        style={{ backgroundColor: colors.accent }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-start justify-center h-full px-20">
        {logo && (
          <div className="mb-8">
            <img src={logo} alt="Logo" className="h-20 object-contain" />
          </div>
        )}
        <div className="max-w-2xl">
          <h1 className="text-7xl font-bold mb-4 leading-tight" style={{ color: colors.primary }}>
            {title}
          </h1>
          {subtitle && <p className="text-3xl mb-2 text-gray-700 font-medium">{subtitle}</p>}
          {period && <p className="text-xl text-gray-600">{period}</p>}
        </div>

        {/* Decorative Element */}
        <div
          className="absolute bottom-20 right-20 w-32 h-32 opacity-20"
          style={{ backgroundColor: colors.accent }}
        />
      </div>
    </div>
  );
};
