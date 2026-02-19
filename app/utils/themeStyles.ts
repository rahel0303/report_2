/**
 * Shared Theme Styles for Content Layouts
 * Provides consistent, attractive styling based on logo colors
 * Supports both light and dark modes
 */

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
}

export type ContentMode = 'light' | 'dark';

export interface LayoutThemeStyles {
  // Mode
  mode: ContentMode;

  // Backgrounds
  pageBg: string;
  headerBg: string;
  cardBg: string;

  // Borders & Shadows
  border: string;
  borderLight: string;
  cardShadow: string;
  cardShadowHover: string;

  // Accent elements
  accentLine: string;
  accentGradient: string;
  accentGlow: string;

  // Decorative
  decorCircle1: string;
  decorCircle2: string;
  decorLine: string;

  // Text
  headerText: string;
  bodyText: string;
  mutedText: string;

  // Chart colors
  chartGrid: string;
  chartAxis: string;
  chartTooltipBg: string;
  chartTooltipBorder: string;

  // Table colors
  tableHeaderBg: string;
  tableRowHover: string;
  tableBorder: string;

  // Raw colors for custom use
  colors: ThemeColors;
  rgb: { primary: RGB; secondary: RGB; accent: RGB };
}

interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 59, g: 130, b: 246 }; // Default blue
}

/**
 * Calculate luminance to determine if color is light or dark
 */
export function getLuminance(rgb: RGB): number {
  const { r, g, b } = rgb;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/**
 * Lighten a color
 */
export function lightenColor(rgb: RGB, amount: number): RGB {
  return {
    r: Math.min(255, Math.round(rgb.r + (255 - rgb.r) * amount)),
    g: Math.min(255, Math.round(rgb.g + (255 - rgb.g) * amount)),
    b: Math.min(255, Math.round(rgb.b + (255 - rgb.b) * amount)),
  };
}

/**
 * Darken a color
 */
export function darkenColor(rgb: RGB, amount: number): RGB {
  return {
    r: Math.max(0, Math.round(rgb.r * (1 - amount))),
    g: Math.max(0, Math.round(rgb.g * (1 - amount))),
    b: Math.max(0, Math.round(rgb.b * (1 - amount))),
  };
}

/**
 * Convert RGB to CSS rgba string
 */
export function rgbaString(rgb: RGB, alpha: number): string {
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

/**
 * Convert RGB to hex string
 */
export function rgbToHex(rgb: RGB): string {
  return `#${[rgb.r, rgb.g, rgb.b]
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('')}`;
}

/**
 * Generate comprehensive theme styles from logo colors
 */
export function generateLayoutTheme(
  colors?: ThemeColors,
  fallbackBrandColor?: string,
  mode: ContentMode = 'light'
): LayoutThemeStyles {
  // Default colors
  const defaultColors: ThemeColors = {
    primary: fallbackBrandColor || '#3B82F6',
    secondary: '#8B5CF6',
    accent: '#EC4899',
  };

  const themeColors = colors || defaultColors;

  // Convert to RGB
  const primaryRgb = hexToRgb(themeColors.primary);
  const secondaryRgb = hexToRgb(themeColors.secondary);
  const accentRgb = hexToRgb(themeColors.accent);

  // Check if primary is light
  const isLightPrimary = getLuminance(primaryRgb) > 0.6;

  if (mode === 'dark') {
    // Dark mode styles
    return {
      mode: 'dark',

      // Page background - dark with visible color tint from logo
      pageBg: `linear-gradient(135deg,
        ${rgbaString(darkenColor(primaryRgb, 0.85), 1)} 0%,
        ${rgbaString(primaryRgb, 0.15)} 40%,
        ${rgbaString(secondaryRgb, 0.1)} 70%,
        ${rgbaString(darkenColor(primaryRgb, 0.85), 1)} 100%)`,

      // Header background - darker with color tint
      headerBg: `linear-gradient(135deg,
        rgba(30, 41, 59, 0.85) 0%,
        ${rgbaString(primaryRgb, 0.2)} 100%)`,

      // Card background - dark surface
      cardBg: 'rgba(30, 41, 59, 0.8)',

      // Borders - subtle with color
      border: rgbaString(primaryRgb, 0.3),
      borderLight: rgbaString(primaryRgb, 0.15),

      // Shadows with color glow
      cardShadow: `0 4px 20px rgba(0, 0, 0, 0.3), 0 0 40px ${rgbaString(primaryRgb, 0.1)}`,
      cardShadowHover: `0 8px 30px rgba(0, 0, 0, 0.4), 0 0 60px ${rgbaString(primaryRgb, 0.15)}`,

      // Accent elements - more vibrant in dark mode
      accentLine: `linear-gradient(90deg,
        ${themeColors.primary} 0%,
        ${themeColors.secondary} 50%,
        ${themeColors.accent} 100%)`,
      accentGradient: `linear-gradient(135deg,
        ${themeColors.primary} 0%,
        ${themeColors.secondary} 100%)`,
      accentGlow: `0 0 60px ${rgbaString(primaryRgb, 0.5)}`,

      // Decorative elements - more visible in dark
      decorCircle1: rgbaString(primaryRgb, 0.15),
      decorCircle2: rgbaString(secondaryRgb, 0.12),
      decorLine: rgbaString(accentRgb, 0.2),

      // Text colors - light text on dark
      headerText: '#f8fafc',
      bodyText: '#e2e8f0',
      mutedText: '#94a3b8',

      // Chart colors for dark mode
      chartGrid: 'rgba(255, 255, 255, 0.1)',
      chartAxis: '#94a3b8',
      chartTooltipBg: '#1e293b',
      chartTooltipBorder: rgbaString(primaryRgb, 0.3),

      // Table colors for dark mode
      tableHeaderBg: 'rgba(15, 23, 42, 0.6)',
      tableRowHover: 'rgba(255, 255, 255, 0.05)',
      tableBorder: 'rgba(255, 255, 255, 0.1)',

      // Raw values
      colors: themeColors,
      rgb: {
        primary: primaryRgb,
        secondary: secondaryRgb,
        accent: accentRgb,
      },
    };
  }

  // Light mode styles (default)
  return {
    mode: 'light',

    // Page background - visible gradient from logo colors
    pageBg: `linear-gradient(135deg,
      ${rgbaString(lightenColor(primaryRgb, 0.92), 1)} 0%,
      ${rgbaString(lightenColor(secondaryRgb, 0.94), 1)} 50%,
      ${rgbaString(lightenColor(accentRgb, 0.95), 1)} 100%)`,

    // Header background - elegant gradient with logo colors
    headerBg: `linear-gradient(135deg,
      ${rgbaString(primaryRgb, 0.12)} 0%,
      ${rgbaString(secondaryRgb, 0.06)} 100%)`,

    // Card background
    cardBg: '#ffffff',

    // Borders
    border: rgbaString(primaryRgb, 0.15),
    borderLight: rgbaString(primaryRgb, 0.08),

    // Shadows with brand color tint
    cardShadow: `0 4px 20px ${rgbaString(primaryRgb, 0.08)}, 0 1px 3px ${rgbaString(primaryRgb, 0.05)}`,
    cardShadowHover: `0 8px 30px ${rgbaString(primaryRgb, 0.12)}, 0 2px 6px ${rgbaString(primaryRgb, 0.08)}`,

    // Accent elements
    accentLine: `linear-gradient(90deg,
      ${themeColors.primary} 0%,
      ${themeColors.secondary} 50%,
      ${themeColors.accent} 100%)`,
    accentGradient: `linear-gradient(135deg,
      ${themeColors.primary} 0%,
      ${themeColors.secondary} 100%)`,
    accentGlow: `0 0 40px ${rgbaString(primaryRgb, 0.3)}`,

    // Decorative elements
    decorCircle1: rgbaString(primaryRgb, 0.1),
    decorCircle2: rgbaString(secondaryRgb, 0.08),
    decorLine: rgbaString(accentRgb, 0.15),

    // Text colors
    headerText: isLightPrimary ? '#1e293b' : themeColors.primary,
    bodyText: '#1e293b',
    mutedText: '#64748b',

    // Chart colors for light mode
    chartGrid: '#f1f5f9',
    chartAxis: '#64748b',
    chartTooltipBg: '#ffffff',
    chartTooltipBorder: rgbaString(primaryRgb, 0.2),

    // Table colors for light mode
    tableHeaderBg: '#f8fafc',
    tableRowHover: 'rgba(0, 0, 0, 0.02)',
    tableBorder: '#e2e8f0',

    // Raw values
    colors: themeColors,
    rgb: {
      primary: primaryRgb,
      secondary: secondaryRgb,
      accent: accentRgb,
    },
  };
}

/**
 * CSS for decorative background elements
 */
export function getDecorativeStyles(theme: LayoutThemeStyles) {
  return {
    // Top right decorative circle
    topRightCircle: {
      position: 'absolute' as const,
      top: '-60px',
      right: '-60px',
      width: '200px',
      height: '200px',
      borderRadius: '50%',
      background: theme.decorCircle1,
      filter: 'blur(40px)',
      pointerEvents: 'none' as const,
    },
    // Bottom left decorative circle
    bottomLeftCircle: {
      position: 'absolute' as const,
      bottom: '-40px',
      left: '-40px',
      width: '160px',
      height: '160px',
      borderRadius: '50%',
      background: theme.decorCircle2,
      filter: 'blur(30px)',
      pointerEvents: 'none' as const,
    },
    // Accent line at top
    accentLineTop: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      height: '3px',
      background: theme.accentLine,
    },
    // Corner accent
    cornerAccent: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      width: '100px',
      height: '100px',
      background: `linear-gradient(135deg, ${theme.colors.primary}10 0%, transparent 60%)`,
      pointerEvents: 'none' as const,
    },
  };
}
