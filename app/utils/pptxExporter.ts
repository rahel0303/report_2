import PptxGenJS from 'pptxgenjs';
import { ReportConfig, Slide } from '@/app/types';
import { hexLuminance } from '@/app/utils/colorExtractor';

// Re-export for backwards compatibility
export type SlideData = Slide;
export type { ReportConfig };

// Helper to convert hex to RGB without #
const cleanColor = (hex: string) => hex.replace('#', '');

// Helper to convert hex to RGB object
function hexToRgbObj(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 59, g: 130, b: 246 };
}

// Helper to blend color with opacity over base color
function blendColorWithOpacity(
  rgb: { r: number; g: number; b: number },
  opacity: number,
  baseIsDark: boolean,
): string {
  const base = baseIsDark ? { r: 15, g: 23, b: 42 } : { r: 248, g: 250, b: 252 };
  const blended = {
    r: Math.round(base.r * (1 - opacity) + rgb.r * opacity),
    g: Math.round(base.g * (1 - opacity) + rgb.g * opacity),
    b: Math.round(base.b * (1 - opacity) + rgb.b * opacity),
  };
  return `${blended.r.toString(16).padStart(2, '0')}${blended.g.toString(16).padStart(2, '0')}${blended.b.toString(16).padStart(2, '0')}`.toUpperCase();
}

// Helper to get gradient background colors from theme
function getThemeGradientColors(config: ReportConfig, isDark: boolean) {
  const primaryHex = config.coverDesign?.colors?.primary || config.theme?.brandColor || '#3B82F6';
  const secondaryHex = config.coverDesign?.colors?.secondary || '#10B981';
  const accentHex = config.coverDesign?.colors?.accent || '#EC4899';

  const primaryRgb = hexToRgbObj(primaryHex);
  const secondaryRgb = hexToRgbObj(secondaryHex);
  const accentRgb = hexToRgbObj(accentHex);

  if (isDark) {
    // Dark mode: darken primary → primary tint → darken primary (match themeStyles)
    const darkened = {
      r: Math.max(0, Math.round(primaryRgb.r * 0.15)),
      g: Math.max(0, Math.round(primaryRgb.g * 0.15)),
      b: Math.max(0, Math.round(primaryRgb.b * 0.15)),
    };
    return {
      start:
        `${darkened.r.toString(16).padStart(2, '0')}${darkened.g.toString(16).padStart(2, '0')}${darkened.b.toString(16).padStart(2, '0')}`.toUpperCase(),
      middle: blendColorWithOpacity(primaryRgb, 0.15, true),
      middleSecondary: blendColorWithOpacity(secondaryRgb, 0.1, true),
      end: `${darkened.r.toString(16).padStart(2, '0')}${darkened.g.toString(16).padStart(2, '0')}${darkened.b.toString(16).padStart(2, '0')}`.toUpperCase(),
    };
  } else {
    // Light mode: matches themeStyles.ts exactly — lightenColor(rgb, 0.92/0.94/0.95)
    // pageBg: lighten(primary 92%) → lighten(secondary 94%) → lighten(accent 95%)
    const lightenToHex = (rgb: { r: number; g: number; b: number }, amount: number) => {
      const r = Math.min(255, Math.round(rgb.r + (255 - rgb.r) * amount));
      const g = Math.min(255, Math.round(rgb.g + (255 - rgb.g) * amount));
      const b = Math.min(255, Math.round(rgb.b + (255 - rgb.b) * amount));
      return `${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
    };
    return {
      start: lightenToHex(primaryRgb, 0.92),
      middle: lightenToHex(secondaryRgb, 0.94),
      end: lightenToHex(accentRgb, 0.95),
    };
  }
}

// Helper to get chart colors from theme
const getChartColors = (config: ReportConfig): string[] => {
  if (config.coverDesign?.colors) {
    // Use cover design colors
    const colors = config.coverDesign.colors;
    return [cleanColor(colors.secondary), cleanColor(colors.accent), cleanColor(colors.primary)];
  } else if (config.theme?.colors) {
    // Use theme colors
    return config.theme.colors.slice(1).map((c: string) => cleanColor(c));
  }
  // Fallback to default colors
  return ['3B82F6', '10B981', 'EC4899', '8B5CF6'];
};

// ─── Shared Layout Helpers ───────────────────────────────────────

interface SlideThemeVars {
  font: string;
  isDark: boolean;
  textColor: string;
  mutedColor: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  cardBg: string;
  borderColor: string;
  pageBg: string;
}

/** Extract common theme variables from config */
function getSlideThemeVars(config: ReportConfig): SlideThemeVars {
  const isDark = (config.coverDesign?.contentMode || 'light') === 'dark';
  return {
    font: config.font?.name || 'Inter',
    isDark,
    textColor: isDark ? 'FFFFFF' : '1E293B',
    mutedColor: isDark ? 'CBD5E1' : '64748B',
    primaryColor: cleanColor(
      config.coverDesign?.colors?.primary || config.theme?.brandColor || '#3B82F6',
    ),
    secondaryColor: cleanColor(config.coverDesign?.colors?.secondary || '#10B981'),
    accentColor: cleanColor(config.coverDesign?.colors?.accent || '#EC4899'),
    cardBg: isDark ? '1E293B' : 'FFFFFF',
    borderColor: isDark ? '334155' : 'E2E8F0',
    pageBg: isDark ? '0F172A' : 'F8FAFC',
  };
}

/** Draw background with gradient overlay matching logo colors */
function drawSlideBackground(
  slide: PptxGenJS.Slide,
  pptx: PptxGenJS,
  config: ReportConfig,
  tv: SlideThemeVars,
) {
  const gc = getThemeGradientColors(config, tv.isDark);

  // Helper: parse a hex color to RGB object
  const hexToRgbLocal = (hex: string) => ({
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
  });

  // Helper: interpolate between two hex colors at position t (0..1), output hex
  const lerpHex = (a: string, b: string, t: number) => {
    const ca = hexToRgbLocal(a);
    const cb = hexToRgbLocal(b);
    const r = Math.round(ca.r + (cb.r - ca.r) * t);
    const g = Math.round(ca.g + (cb.g - ca.g) * t);
    const bl = Math.round(ca.b + (cb.b - ca.b) * t);
    return `${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bl.toString(16).padStart(2, '0')}`.toUpperCase();
  };

  // Set solid base background (start color) so no white bleeds through
  slide.background = { color: gc.start };

  // Draw 20 thin vertical strips to approximate a smooth diagonal gradient
  const NUM_STRIPS = 20;
  const stripW = 10 / NUM_STRIPS;

  for (let i = 0; i < NUM_STRIPS; i++) {
    const t = i / (NUM_STRIPS - 1); // 0 → 1
    let color: string;
    if (t <= 0.5) {
      color = lerpHex(gc.start, gc.middle, t * 2);
    } else {
      color = lerpHex(gc.middle, gc.end, (t - 0.5) * 2);
    }
    if (tv.isDark) {
      // For dark mode also interpolate through middleSecondary
      if (t <= 0.33) {
        color = lerpHex(gc.start, gc.middle, t / 0.33);
      } else if (t <= 0.66) {
        color = lerpHex(gc.middle, (gc as any).middleSecondary || gc.middle, (t - 0.33) / 0.33);
      } else {
        color = lerpHex((gc as any).middleSecondary || gc.middle, gc.end, (t - 0.66) / 0.34);
      }
    }
    slide.addShape(pptx.ShapeType.rect, {
      x: i * stripW,
      y: 0,
      w: stripW + 0.02, // slight overlap to avoid hairline gaps
      h: 5.625,
      fill: { color },
      line: { type: 'none' },
    });
  }
}

/** Draw decorative elements: accent line top + circles */
function drawSlideDecorations(slide: PptxGenJS.Slide, pptx: PptxGenJS, tv: SlideThemeVars) {
  // Accent line at top (3px → ~0.04 inch, gradient approximated as solid primary)
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 10,
    h: 0.04,
    fill: { color: tv.primaryColor },
    line: { type: 'none' },
  });

  // Top-right decorative circle (semi-transparent)
  slide.addShape(pptx.ShapeType.ellipse, {
    x: 8.5,
    y: -0.6,
    w: 2,
    h: 2,
    fill: { color: tv.primaryColor, transparency: tv.isDark ? 85 : 90 },
    line: { type: 'none' },
  });

  // Bottom-left decorative circle
  slide.addShape(pptx.ShapeType.ellipse, {
    x: -0.4,
    y: 4.2,
    w: 1.6,
    h: 1.6,
    fill: { color: tv.secondaryColor, transparency: tv.isDark ? 88 : 92 },
    line: { type: 'none' },
  });
}

/** Draw standard header card with accent bar, title, channel badge */
function drawSlideHeader(
  slide: PptxGenJS.Slide,
  pptx: PptxGenJS,
  tv: SlideThemeVars,
  title: string,
  channel?: string,
  opts?: { headerH?: number; headerY?: number; subtitle?: string; logoData?: string },
) {
  const headerX = 0.3;
  const headerY = opts?.headerY ?? 0.3;
  const headerW = 9.4;
  const hasSubtitle = !!opts?.subtitle;
  const headerH = opts?.headerH ?? (hasSubtitle ? 0.65 : 0.55);
  const rightW = 0.52; // reserved width on right for badge/logo

  // Card background
  slide.addShape(pptx.ShapeType.roundRect, {
    x: headerX,
    y: headerY,
    w: headerW,
    h: headerH,
    fill: { color: tv.cardBg },
    line: { color: tv.borderColor, width: 0.75 },
    rectRadius: 0.08,
    shadow: {
      type: 'outer',
      blur: 6,
      offset: 2,
      color: tv.primaryColor,
      opacity: tv.isDark ? 0.1 : 0.06,
    },
  });

  // Left accent bar
  slide.addShape(pptx.ShapeType.rect, {
    x: headerX,
    y: headerY,
    w: 0.04,
    h: headerH,
    fill: { color: tv.primaryColor },
    line: { type: 'none' },
  });

  // Decorative circle top-right corner
  slide.addShape(pptx.ShapeType.ellipse, {
    x: headerX + headerW - 0.6,
    y: headerY - 0.2,
    w: 0.8,
    h: 0.8,
    fill: { color: tv.primaryColor, transparency: tv.isDark ? 85 : 90 },
    line: { type: 'none' },
  });

  if (hasSubtitle) {
    // Two-line header: title on top half, subtitle on bottom half
    const titleH = headerH * 0.55;
    const subY = headerY + titleH;
    const subH = headerH - titleH;
    slide.addText(title, {
      x: headerX + 0.2,
      y: headerY + 0.03,
      w: headerW - rightW - 0.3,
      h: titleH - 0.03,
      fontSize: 14,
      bold: true,
      color: tv.textColor,
      align: 'left',
      valign: 'bottom',
      fontFace: tv.font,
      wrap: false,
    });
    slide.addText(opts!.subtitle!, {
      x: headerX + 0.2,
      y: subY,
      w: headerW - rightW - 0.3,
      h: subH - 0.04,
      fontSize: 7,
      bold: false,
      color: tv.mutedColor,
      align: 'left',
      valign: 'top',
      fontFace: tv.font,
      wrap: false,
    });
  } else {
    // Single-line header (original)
    slide.addText(title, {
      x: headerX + 0.2,
      y: headerY + 0.03,
      w: headerW - rightW - 0.3,
      h: headerH - 0.06,
      fontSize: 18,
      bold: true,
      color: tv.textColor,
      align: 'left',
      valign: 'middle',
      fontFace: tv.font,
    });
  }

  // Right side: logo image OR channel badge SVG
  if (opts?.logoData) {
    slide.addImage({
      data: opts.logoData,
      x: headerX + headerW - rightW,
      y: headerY + (headerH - 0.4) / 2,
      w: 0.42,
      h: 0.4,
      sizing: { type: 'contain', w: 0.42, h: 0.4 },
    });
  } else if (channel) {
    const badgeSvg = getChannelBadgeSvg(channel);
    if (badgeSvg) {
      slide.addImage({
        data: badgeSvg,
        x: headerX + headerW - rightW,
        y: headerY + (headerH - 0.42) / 2,
        w: 0.42,
        h: 0.42,
      });
    }
  }

  return { headerX, headerY, headerW, headerH };
}

/** Draw insight card with decorative circle, label, separator, and text */
function drawSlideInsight(
  slide: PptxGenJS.Slide,
  pptx: PptxGenJS,
  tv: SlideThemeVars,
  opts: {
    x: number;
    y: number;
    w: number;
    h: number;
    label: string;
    text: string;
  },
) {
  // Card background
  slide.addShape(pptx.ShapeType.roundRect, {
    x: opts.x,
    y: opts.y,
    w: opts.w,
    h: opts.h,
    fill: { color: tv.cardBg },
    line: { color: tv.borderColor, width: 0.75 },
    rectRadius: 0.08,
    shadow: {
      type: 'outer',
      blur: 6,
      offset: 2,
      color: tv.primaryColor,
      opacity: tv.isDark ? 0.1 : 0.06,
    },
  });

  // Decorative circle bottom-right
  slide.addShape(pptx.ShapeType.ellipse, {
    x: opts.x + opts.w - 0.8,
    y: opts.y + opts.h - 0.8,
    w: 1,
    h: 1,
    fill: { color: tv.secondaryColor, transparency: tv.isDark ? 88 : 92 },
    line: { type: 'none' },
  });

  // Label
  slide.addText(opts.label.toUpperCase(), {
    x: opts.x + 0.15,
    y: opts.y + 0.08,
    w: opts.w - 0.3,
    h: 0.22,
    fontSize: 9,
    bold: true,
    color: tv.mutedColor,
    fontFace: tv.font,
    align: 'left',
    valign: 'middle',
  });

  // Separator line
  slide.addShape(pptx.ShapeType.line, {
    x: opts.x + 0.15,
    y: opts.y + 0.35,
    w: opts.w - 0.3,
    h: 0,
    line: { color: tv.borderColor, width: 0.5 },
  });

  // Content text
  if (opts.text) {
    slide.addText(opts.text, {
      x: opts.x + 0.15,
      y: opts.y + 0.42,
      w: opts.w - 0.3,
      h: opts.h - 0.55,
      fontSize: 9,
      color: tv.isDark ? 'CBD5E1' : '475569',
      align: 'left',
      valign: 'top',
      fontFace: tv.font,
      lineSpacingMultiple: 1.3,
      wrap: true,
    });
  } else {
    slide.addText(opts.label, {
      x: opts.x,
      y: opts.y,
      w: opts.w,
      h: opts.h,
      fontSize: 12,
      color: tv.mutedColor,
      align: 'center',
      valign: 'middle',
      fontFace: tv.font,
    });
  }
}

// ─── Hybrid Cover Slide (screenshot bg + native text) ───────────

/**
 * Determine text colors, alignment and positions per template.
 * All 9 templates supported. fontColorOverride takes precedence over auto-detect.
 */
function getCoverTextStyle(templateId: number, primaryColor: string, fontColorOverride?: string) {
  // Templates 3 & 6 use a gradient from primaryColor — treat as light if primary is light
  const gradientIsLight = hexLuminance(primaryColor) > 0.35;
  // Light-background templates (2=white card, 5,7,8,9=white bg; 3/6 dynamic)
  const lightBgSet = new Set([2, 5, 7, 8, 9]);
  const isLightBg =
    lightBgSet.has(templateId) || ((templateId === 3 || templateId === 6) && gradientIsLight);
  const leftAlignedSet = new Set([2, 4, 5, 8]);
  const isLeftAligned = leftAlignedSet.has(templateId);

  // Auto title color per template — dark bg → white, light bg → dark
  // Templates 3 & 6: gradient from primary → use gradientIsLight computed above.
  const autoTitleColors: Record<number, string> = {
    1: 'FFFFFF', // Neon Pulse — dark bg
    2: '111111', // Bold Split — white card
    3: gradientIsLight ? '111111' : 'FFFFFF', // Glass Morphism — gradient from primary
    4: 'FFFFFF', // Prism — dark bg
    5: '111111', // Bauhaus — white bg
    6: gradientIsLight ? '111111' : 'FFFFFF', // Hexagon Mesh — gradient from primary
    7: '111111', // Clean Line — white bg
    8: '111111', // Asymmetric — light bg
    9: '111111', // Nordic Frame — white bg
  };

  const titleColor = fontColorOverride
    ? cleanColor(fontColorOverride)
    : autoTitleColors[templateId] || 'FFFFFF';
  const subtitleColor = fontColorOverride
    ? cleanColor(fontColorOverride)
    : isLightBg
      ? '6B7280'
      : 'FFFFFF';
  const periodColor = fontColorOverride
    ? cleanColor(fontColorOverride)
    : isLightBg
      ? '9CA3AF'
      : 'FFFFFF';
  const footerColor = fontColorOverride
    ? cleanColor(fontColorOverride)
    : isLightBg
      ? '9CA3AF'
      : 'FFFFFF';

  const subtitleTransparency = !fontColorOverride && !isLightBg ? 15 : 0;
  const periodTransparency = !fontColorOverride && !isLightBg ? 20 : 0;
  const footerTransparency = !fontColorOverride && !isLightBg ? 40 : 0;

  const align: 'left' | 'center' = isLeftAligned ? 'left' : 'center';

  // Defaults (centered layout, mid-slide title)
  let xOffset = 0.5;
  let textWidth = 9;
  let titleY = 1.8;
  let titleH = 1.4;
  let subtitleY = 3.3;
  let periodY = 4.0;
  let footerY = 5.1;
  let titleSize = 42;
  let subtitleSize = 20;
  let logoY = 0.4;
  let logoX = -1; // -1 = auto-center

  switch (templateId) {
    case 1: // Neon Pulse — period ABOVE title (matches web layout)
      titleY = 1.9;
      titleH = 1.3;
      subtitleY = 3.15;
      periodY = 1.44; // sits just above the title
      footerY = 5.0;
      titleSize = 44;
      // Slightly more muted subtitle & period so they don’t compete with the title
      subtitleSize = 18;
      break;
    case 2: // Bold Split — content on white card starting at 30%
      xOffset = 3.1;
      textWidth = 6.4;
      titleY = 2.2;
      titleH = 1.1;
      subtitleY = 3.4;
      periodY = 3.85;
      footerY = 5.1;
      titleSize = 36;
      subtitleSize = 18;
      logoX = 3.2;
      logoY = 1.35;
      break;
    case 3: // Glass Morphism — centered, period ABOVE title, all white on gradient
      xOffset = 0.5;
      textWidth = 9;
      titleY = 2.1;
      titleH = 1.2;
      subtitleY = 3.4;
      periodY = 1.62; // above title
      footerY = 5.1;
      titleSize = 44;
      subtitleSize = 20;
      logoX = -1; // auto-center
      logoY = 0.85;
      break;
    case 4: // Prism — bottom-left: logo → period → title → subtitle (justify-end)
      xOffset = 0.5;
      textWidth = 8.5;
      titleY = 3.7; // dynamically overridden from logoBottomY
      titleH = 0.8;
      subtitleY = 4.68; // dynamically overridden
      periodY = 3.42; // dynamically overridden — placed BELOW logo
      footerY = 5.18;
      titleSize = 44;
      logoX = 0.5;
      logoY = 2.7; // upper bottom-third so content has room below
      break;
    case 5: // Bauhaus — left-aligned
      xOffset = 1.8;
      textWidth = 7.0;
      titleY = 1.9;
      titleH = 1.4;
      subtitleY = 3.4;
      periodY = 1.4;
      footerY = 5.1;
      titleSize = 40;
      logoX = 1.8;
      logoY = 0.5;
      break;
    case 7: // Clean Line — centered white, period above title
      xOffset = 0.5;
      textWidth = 9;
      titleY = 2.2;
      titleH = 1.4;
      subtitleY = 3.7;
      periodY = 1.7;
      footerY = 5.0;
      break;
    case 8: // Asymmetric — left-aligned
      xOffset = 2.0;
      textWidth = 7.0;
      titleY = 2.0;
      titleH = 1.4;
      subtitleY = 3.5;
      periodY = 1.5;
      footerY = 5.1;
      logoX = 2.0;
      logoY = 0.5;
      break;
    case 9: // Nordic Frame — centered, period above title
      xOffset = 1.5;
      textWidth = 7.0;
      titleY = 2.1;
      titleH = 1.4;
      subtitleY = 3.6;
      periodY = 1.5;
      footerY = 5.0;
      break;
  }

  return {
    titleColor,
    subtitleColor,
    periodColor,
    footerColor,
    subtitleTransparency,
    periodTransparency,
    footerTransparency,
    align,
    xOffset,
    textWidth,
    titleY,
    titleH,
    subtitleY,
    periodY,
    footerY,
    titleSize,
    subtitleSize,
    logoX,
    logoY,
  };
}

/**
 * Load a logo data-URL onto a canvas, apply rounded corners, and return a new PNG data-URL.
 * Also returns the aspect-ratio-correct PPT dimensions (inches) constrained to maxW × maxH.
 */
async function prepareLogoImage(
  logoData: string,
  maxW: number,
  maxH: number,
  radiusFraction = 0.12,
): Promise<{ data: string; w: number; h: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const natW = img.naturalWidth || img.width;
      const natH = img.naturalHeight || img.height;
      const aspect = natW / natH;

      // Compute dimensions that fit maxW × maxH while keeping aspect ratio
      let pptW = maxW;
      let pptH = pptW / aspect;
      if (pptH > maxH) {
        pptH = maxH;
        pptW = pptH * aspect;
      }

      // Render at 2× for crispness
      const canvasW = Math.round(pptW * 192);
      const canvasH = Math.round(pptH * 192);
      const radius = Math.round(Math.min(canvasW, canvasH) * radiusFraction);

      const canvas = document.createElement('canvas');
      canvas.width = canvasW;
      canvas.height = canvasH;
      const ctx = canvas.getContext('2d')!;

      // Rounded clip
      ctx.beginPath();
      ctx.moveTo(radius, 0);
      ctx.lineTo(canvasW - radius, 0);
      ctx.quadraticCurveTo(canvasW, 0, canvasW, radius);
      ctx.lineTo(canvasW, canvasH - radius);
      ctx.quadraticCurveTo(canvasW, canvasH, canvasW - radius, canvasH);
      ctx.lineTo(radius, canvasH);
      ctx.quadraticCurveTo(0, canvasH, 0, canvasH - radius);
      ctx.lineTo(0, radius);
      ctx.quadraticCurveTo(0, 0, radius, 0);
      ctx.closePath();
      ctx.clip();

      ctx.drawImage(img, 0, 0, canvasW, canvasH);

      resolve({ data: canvas.toDataURL('image/png'), w: pptW, h: pptH });
    };
    img.onerror = () => {
      // Fallback: return original, square dimensions
      resolve({ data: logoData, w: maxW, h: maxH });
    };
    img.src = logoData;
  });
}

/**
 * Create a cover slide using a screenshot background + native editable text.
 * Called from exportHelpers with the captured background image.
 * Supports all 9 cover templates with correct text color/position per template.
 */
export async function createCoverSlideHybrid(
  pptx: PptxGenJS,
  config: ReportConfig,
  bgImageData: string,
) {
  const slide = pptx.addSlide();
  const font = config.font?.name || 'Inter';
  const templateId = Number(config.coverDesign?.templateId || 1);
  const fontColorOverride = config.coverDesign?.fontColor;

  // Background: pixel-perfect screenshot
  slide.addImage({
    data: bgImageData,
    x: 0,
    y: 0,
    w: '100%',
    h: '100%',
  });

  // Template 4 (Prism): SVG now uses viewBox + absolute coords so the background
  // screenshot captures the triangles correctly. Re-add only the diamond decorations
  // that were inside data-cover-content (hidden during screenshot).
  if (templateId === 4) {
    // Diamond outer ring
    slide.addShape(pptx.ShapeType.rect, {
      x: 9.5,
      y: 0.167,
      w: 0.333,
      h: 0.333,
      rotate: 45,
      fill: { type: 'none' },
      line: { color: 'FFFFFF', width: 0.75, transparency: 80 },
    });
    // Inner small diamond
    slide.addShape(pptx.ShapeType.rect, {
      x: 9.545,
      y: 0.333,
      w: 0.125,
      h: 0.125,
      rotate: 45,
      fill: { color: 'FFFFFF', transparency: 90 },
      line: { type: 'none' },
    });
  }

  const s = getCoverTextStyle(
    templateId,
    config.coverDesign?.colors?.primary || '#3B82F6',
    fontColorOverride,
  );

  // Logo — correct aspect ratio + border radius via canvas
  // Template 2: cap logo smaller so text block stays centered in white card
  let logoBottomY = s.logoY; // fallback if no logo
  if (config.coverDesign?.logoData) {
    const maxLogoW = templateId === 2 ? 1.5 : templateId === 3 ? 1.6 : templateId === 4 ? 1.8 : 2.2;
    const maxLogoH =
      templateId === 2 ? 0.65 : templateId === 3 ? 0.65 : templateId === 4 ? 0.6 : 1.1;
    const logo = await prepareLogoImage(config.coverDesign.logoData, maxLogoW, maxLogoH, 0.1);
    const logoX = s.logoX >= 0 ? s.logoX : (10 - logo.w) / 2;
    logoBottomY = s.logoY + logo.h;
    slide.addImage({
      data: logo.data,
      x: logoX,
      y: s.logoY,
      w: logo.w,
      h: logo.h,
    });
  }

  // Template 2 (Bold Split): accent bar RIGHT below logo, then text flows from there
  const pc2 = cleanColor(
    config.coverDesign?.colors?.primary || config.theme?.brandColor || '#3B82F6',
  );
  const sc2 = cleanColor(config.coverDesign?.colors?.secondary || '#10B981');

  let dynTitleY = s.titleY;
  let dynSubtitleY = s.subtitleY;
  let dynPeriodY = s.periodY;
  let dynFooterY = s.footerY;

  if (templateId === 2) {
    const barY = logoBottomY + 0.16; // tight gap between logo bottom and accent bar
    slide.addShape(pptx.ShapeType.rect, {
      x: s.xOffset,
      y: barY,
      w: 0.26,
      h: 0.022,
      fill: { color: pc2 },
      line: { type: 'none' },
    });
    dynTitleY = barY + 0.2;
    dynSubtitleY = dynTitleY + s.titleH + 0.16;
    dynPeriodY = dynSubtitleY + 0.55;
    dynFooterY = 5.15; // pinned to very bottom of slide
  }

  // Template 4 (Prism): anchor from bottom up so nothing overlaps regardless of logo size.
  // Footer → subtitle → title → period, logo placed at static logoY above the block.
  if (templateId === 4) {
    dynFooterY = 5.18;
    dynSubtitleY = dynFooterY - 0.48; // subtitle ends just above footer
    dynTitleY = dynSubtitleY - s.titleH - 0.1; // title block sits above subtitle
    dynPeriodY = dynTitleY - 0.24; // period row sits above title
  }

  // Minimalist templates (7=Clean Line, 8=Asymmetric, 9=Nordic Frame):
  // Same bottom-up anchoring — footer → subtitle → title → period (above title).
  // Logo stays pinned at static logoY (top area). Guarantees no overlap regardless
  // of logo height or title length.
  if (templateId === 7 || templateId === 8 || templateId === 9) {
    dynFooterY = s.footerY;
    dynSubtitleY = dynFooterY - 1.2; // subtitle box ends just above footer
    dynTitleY = dynSubtitleY - s.titleH - 0.4; // title block above subtitle
    dynPeriodY = dynTitleY - 0.3; // period row sits above title
  }

  // Title
  slide.addText(config.reportTitle, {
    x: s.xOffset,
    y: dynTitleY,
    w: s.textWidth,
    h: s.titleH,
    fontSize: s.titleSize,
    bold: true,
    color: s.titleColor,
    align: s.align,
    valign: 'middle',
    fontFace: font,
  });

  // Subtitle — template 2: secondary color matches web (`fontColor || colors.secondary`)
  if (config.reportDetails) {
    slide.addText(config.reportDetails, {
      x: s.xOffset,
      y: dynSubtitleY,
      w: s.textWidth,
      h: 0.6,
      fontSize: s.subtitleSize,
      color:
        templateId === 2
          ? fontColorOverride
            ? cleanColor(fontColorOverride)
            : sc2
          : s.subtitleColor,
      transparency: templateId === 1 ? 35 : templateId === 3 ? 25 : s.subtitleTransparency,
      align: s.align,
      valign: 'middle',
      fontFace: font,
    });
  }

  // Period — template 2: muted gray matches web (`fontColor || '#999'` at opacity 0.7)
  if (config.period) {
    slide.addText(config.period, {
      x: s.xOffset,
      y: dynPeriodY,
      w: s.textWidth,
      h: 0.5,
      fontSize: templateId === 1 ? 13 : 12,
      color:
        templateId === 2
          ? fontColorOverride
            ? cleanColor(fontColorOverride)
            : '999999'
          : s.periodColor,
      transparency:
        templateId === 1
          ? 30
          : templateId === 2
            ? 30
            : templateId === 3
              ? 30
              : templateId === 4
                ? 40
                : s.periodTransparency,
      align: s.align,
      valign: 'middle',
      fontFace: font,
      ...(templateId === 1 ? { charSpacing: 4, bold: true } : {}),
      ...(templateId === 2 ? { charSpacing: 3, bold: true } : {}),
      ...(templateId === 3 ? { charSpacing: 4, bold: true } : {}),
      ...(templateId === 4 ? { charSpacing: 4, bold: true } : {}),
      ...(templateId === 7 ? { charSpacing: 4 } : {}),
      ...(templateId === 8 ? { charSpacing: 4, bold: true } : {}),
      ...(templateId === 9 ? { charSpacing: 5 } : {}),
    });
  }

  // Template 3 (Glass Morphism): 3 white dots below subtitle
  if (templateId === 3) {
    const dotR = 0.07;
    const dotGap = 0.07;
    const totalDotsW = 3 * dotR + 2 * dotGap;
    const dotsStartX = (10 - totalDotsW) / 2;
    const dotsY = dynSubtitleY + 0.65;
    [0, 1, 2].forEach((i) => {
      slide.addShape(pptx.ShapeType.ellipse, {
        x: dotsStartX + i * (dotR + dotGap),
        y: dotsY,
        w: dotR,
        h: dotR,
        fill: { color: 'FFFFFF', transparency: 40 },
        line: { type: 'none' },
      });
    });
  }

  // Template 7 (Clean Line): two thin horizontal lines from data-cover-content
  // Line 1: above the period text (color = primary)
  // Line 2: between title bottom and subtitle (color = accent)
  if (templateId === 7) {
    const lineW = 0.5; // w-12 = 48px ≈ 0.5"
    const lineH = 0.013; // h-px = 1px ≈ 0.013"
    const lineX = (10 - lineW) / 2;
    const pc7 = cleanColor(
      config.coverDesign?.colors?.primary || config.theme?.brandColor || '#3B82F6',
    );
    const ac7 = cleanColor(
      config.coverDesign?.colors?.accent || config.coverDesign?.colors?.secondary || pc7,
    );
    // Line above period
    slide.addShape(pptx.ShapeType.rect, {
      x: lineX,
      y: dynPeriodY - 0.14,
      w: lineW,
      h: lineH,
      fill: { color: pc7 },
      line: { type: 'none' },
    });
    // Line between title and subtitle
    slide.addShape(pptx.ShapeType.rect, {
      x: lineX,
      y: dynTitleY + s.titleH + 0.1,
      w: lineW,
      h: lineH,
      fill: { color: ac7 },
      line: { type: 'none' },
    });
  }

  // Template 9 (Nordic Frame): three stepped color bars below subtitle (inside data-cover-content)
  // Placed just above the footer so they don't overlap.
  if (templateId === 9) {
    const barsY = dynFooterY - 0.28;
    const barsH = 0.04;
    const pc9 = cleanColor(
      config.coverDesign?.colors?.primary || config.theme?.brandColor || '#3B82F6',
    );
    const sc9 = cleanColor(config.coverDesign?.colors?.secondary || pc9);
    const ac9 = cleanColor(config.coverDesign?.colors?.accent || pc9);
    const totalBarsW = 0.5 + 0.04 + 0.25 + 0.04 + 0.125; // gaps between bars
    const barsStartX = (10 - totalBarsW) / 2;
    slide.addShape(pptx.ShapeType.roundRect, {
      x: barsStartX,
      y: barsY,
      w: 0.5,
      h: barsH,
      rectRadius: 0.02,
      fill: { color: pc9 },
      line: { type: 'none' },
    });
    slide.addShape(pptx.ShapeType.roundRect, {
      x: barsStartX + 0.5 + 0.04,
      y: barsY,
      w: 0.25,
      h: barsH,
      rectRadius: 0.02,
      fill: { color: sc9 },
      line: { type: 'none' },
    });
    slide.addShape(pptx.ShapeType.roundRect, {
      x: barsStartX + 0.5 + 0.04 + 0.25 + 0.04,
      y: barsY,
      w: 0.125,
      h: barsH,
      rectRadius: 0.02,
      fill: { color: ac9 },
      line: { type: 'none' },
    });
  }

  // Prepared by footer
  slide.addText(`Prepared by: ${config.preparedBy}`, {
    x: s.xOffset,
    y: dynFooterY,
    w: s.textWidth,
    h: 0.3,
    fontSize: 10,
    color: s.footerColor,
    transparency: s.footerTransparency,
    align: s.align,
    fontFace: font,
  });
}

/**
 * Fallback: create cover slide entirely with native shapes (no screenshot).
 * Used when the DOM element is not available or coverDesign is not set.
 */
export function createCoverSlide(pptx: PptxGenJS, config: ReportConfig) {
  const slide = pptx.addSlide();
  const font = config.font?.name || 'Inter';
  slide.background = { color: '3B82F6' };

  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 10,
    h: 0.4,
    fill: { color: '8B5CF6' },
    line: { type: 'none' },
  });

  slide.addText(config.reportTitle, {
    x: 0.5,
    y: 2,
    w: 9,
    h: 1.2,
    fontSize: 48,
    bold: true,
    color: 'FFFFFF',
    align: 'center',
    valign: 'middle',
    fontFace: font,
  });

  slide.addText(config.reportDetails || '', {
    x: 0.5,
    y: 3.3,
    w: 9,
    h: 0.6,
    fontSize: 20,
    color: 'FFFFFF',
    align: 'center',
    valign: 'middle',
    fontFace: font,
  });

  slide.addText(config.period, {
    x: 0.5,
    y: 4.1,
    w: 9,
    h: 0.4,
    fontSize: 16,
    color: 'FFFFFF',
    align: 'center',
    valign: 'middle',
    fontFace: font,
  });

  slide.addText(`Prepared by: ${config.preparedBy}`, {
    x: 0.5,
    y: 5.2,
    w: 9,
    h: 0.3,
    fontSize: 10,
    color: 'FFFFFF',
    transparency: 40,
    align: 'center',
    fontFace: font,
  });
}

// ─── Thank You Slide (same design as cover, "Thank You" as title) ──────────

/**
 * Create a Thank You closing slide using the same cover template background
 * screenshot + native editable text. Delegates to createCoverSlideHybrid with
 * overridden title/subtitle so every template's styling is reused automatically.
 */
export async function createThankYouSlideHybrid(
  pptx: PptxGenJS,
  config: ReportConfig,
  bgImageData: string,
) {
  await createCoverSlideHybrid(
    pptx,
    {
      ...config,
      reportTitle: 'Thank You',
      reportDetails: config.clientName || config.preparedBy || '',
    },
    bgImageData,
  );
}

// ─── Hybrid Section Heading Slide (screenshot bg + native text) ──

/**
 * Create a section heading slide using a screenshot background + native editable text.
 */
export async function createSectionHeadingSlideHybrid(
  pptx: PptxGenJS,
  config: ReportConfig,
  bgImageData: string,
  sectionTitle: string,
) {
  const slide = pptx.addSlide();
  const font = config.font?.name || 'Inter';
  const templateId = Number(config.coverDesign?.templateId || 1);
  const primaryColor = config.coverDesign?.colors?.primary || config.theme?.brandColor || '3B82F6';
  const fontColorOverride = config.coverDesign?.fontColor;

  // Get per-template text style (color, alignment, position, size)
  const s = getCoverTextStyle(templateId, primaryColor, fontColorOverride);

  // Background: pixel-perfect screenshot (gradients, shapes, decorative elements)
  // The title was hidden during capture so only decorations appear here
  slide.addImage({
    data: bgImageData,
    x: 0,
    y: 0,
    w: '100%',
    h: '100%',
  });

  // Template 4 (Prism): SVG now uses viewBox + absolute coords so the background
  // screenshot captures the triangles correctly. No extra canvas drawing needed.

  // Section title – position / color / alignment driven by template
  // Bold Split (template 2) title sits in the right panel matching cover layout.
  // All other templates: compact centered layout with native decorations.
  // Use explicit centered y-values (not s.titleY) so content sits at slide midpoint.
  let titleY: number;
  let titleH: number;
  if (templateId === 2) {
    titleY = 2.4; // (5.625 - block_h) / 2: bar(0.02)+gap(0.18)+title(0.9)+gap(0.18)+dots ≈ centered
    titleH = 0.9;
  } else {
    titleY = 2.4; // template 1: SECTION(0.22)+gap+bar+gap+title(0.9)+dots ≈ centered
    titleH = 0.9;
  }

  // ── Template 3 (Glass Morphism): SECTION label + white bar above, 3 dots below
  if (templateId === 3) {
    // "SECTION" label above the bar
    slide.addText('SECTION', {
      x: 0.5,
      y: titleY - 0.44,
      w: 9,
      h: 0.22,
      fontSize: 9,
      bold: true,
      color: 'FFFFFF',
      transparency: 30,
      align: 'center',
      valign: 'middle',
      charSpacing: 4,
      fontFace: font,
    });
    // White bar between label and title
    slide.addShape(pptx.ShapeType.rect, {
      x: (10 - 0.29) / 2,
      y: titleY - 0.18,
      w: 0.29,
      h: 0.022,
      fill: { color: 'FFFFFF', transparency: 30 },
      line: { type: 'none' },
    });
    // 3 white dots below title
    const dotR = 0.07;
    const dotGap = 0.07;
    const totalDotsW = 3 * dotR + 2 * dotGap;
    const dotsStartX = (10 - totalDotsW) / 2;
    const dotsY = titleY + titleH + 0.2;
    [0, 1, 2].forEach((i) => {
      slide.addShape(pptx.ShapeType.ellipse, {
        x: dotsStartX + i * (dotR + dotGap),
        y: dotsY,
        w: dotR,
        h: dotR,
        fill: { color: 'FFFFFF', transparency: 40 },
        line: { type: 'none' },
      });
    });
  }

  // ── Template 2 (Bold Split): accent bar above title + dot row below title
  if (templateId === 2) {
    const pc = cleanColor(primaryColor);
    const ac = cleanColor(
      config.coverDesign?.colors?.accent || config.coverDesign?.colors?.secondary || primaryColor,
    );
    const sc = cleanColor(config.coverDesign?.colors?.secondary || primaryColor);

    // Orange accent bar above section title
    slide.addShape(pptx.ShapeType.rect, {
      x: s.xOffset,
      y: titleY - 0.18,
      w: 0.26,
      h: 0.022,
      fill: { color: pc },
      line: { type: 'none' },
    });

    // Bottom dot row: left bar + center dot + right bar
    const rowY = titleY + titleH + 0.16;
    const leftBarW = 0.27;
    const dotW = 0.06;
    const rightBarW = 0.15;
    const gap = 0.06;
    const rowStartX = s.xOffset;

    slide.addShape(pptx.ShapeType.rect, {
      x: rowStartX,
      y: rowY + 0.06,
      w: leftBarW,
      h: 0.018,
      fill: { color: pc },
      line: { type: 'none' },
    });
    slide.addShape(pptx.ShapeType.ellipse, {
      x: rowStartX + leftBarW + gap,
      y: rowY + 0.04,
      w: dotW,
      h: dotW,
      fill: { color: ac },
      line: { type: 'none' },
    });
    slide.addShape(pptx.ShapeType.rect, {
      x: rowStartX + leftBarW + gap + dotW + gap,
      y: rowY + 0.06,
      w: rightBarW,
      h: 0.018,
      fill: { color: sc },
      line: { type: 'none' },
    });
  }

  // ── Template 1 (Neon Pulse): add native decorations (SECTION label, accent bar, dot row)
  if (templateId === 1) {
    const pc = cleanColor(primaryColor);
    const ac = cleanColor(
      config.coverDesign?.colors?.accent || config.coverDesign?.colors?.secondary || primaryColor,
    );

    // "SECTION" label — small tracked uppercase, above title
    slide.addText('SECTION', {
      x: 0.5,
      y: titleY - 0.42,
      w: 9,
      h: 0.22,
      fontSize: 9,
      bold: true,
      color: 'FFFFFF',
      transparency: 45,
      align: 'center',
      valign: 'middle',
      charSpacing: 5,
      fontFace: font,
    });

    // Accent bar between label and title
    slide.addShape(pptx.ShapeType.rect, {
      x: (10 - 0.29) / 2, // centered
      y: titleY - 0.16,
      w: 0.29,
      h: 0.025,
      fill: { color: pc },
      line: { type: 'none' },
    });

    // Bottom decorative row: left bar + center dot + right bar
    const rowY = titleY + titleH + 0.14;
    const rowCenterX = 5; // slide center
    const leftBarW = 0.27;
    const dotW = 0.06;
    const rightBarW = 0.15;
    const gap = 0.06;
    const totalW = leftBarW + gap + dotW + gap + rightBarW;
    const rowStartX = rowCenterX - totalW / 2;

    slide.addShape(pptx.ShapeType.rect, {
      x: rowStartX,
      y: rowY + 0.07,
      w: leftBarW,
      h: 0.018,
      fill: { color: pc },
      line: { type: 'none' },
    });
    slide.addShape(pptx.ShapeType.ellipse, {
      x: rowStartX + leftBarW + gap,
      y: rowY + 0.05,
      w: dotW,
      h: dotW,
      fill: { color: ac },
      line: { type: 'none' },
    });
    slide.addShape(pptx.ShapeType.rect, {
      x: rowStartX + leftBarW + gap + dotW + gap,
      y: rowY + 0.07,
      w: rightBarW,
      h: 0.018,
      fill: { color: pc },
      line: { type: 'none' },
    });
  }

  // ── Template 4 (Prism): SECTION label + gradient bar above, dot+bar below
  if (templateId === 4) {
    const pc = cleanColor(primaryColor);
    const ac = cleanColor(
      config.coverDesign?.colors?.accent || config.coverDesign?.colors?.secondary || primaryColor,
    );
    slide.addText('SECTION', {
      x: 0.5,
      y: titleY - 0.38,
      w: 9,
      h: 0.22,
      fontSize: 9,
      bold: true,
      color: 'FFFFFF',
      transparency: 40,
      align: 'center',
      valign: 'middle',
      charSpacing: 5,
      fontFace: font,
    });
    slide.addShape(pptx.ShapeType.rect, {
      x: (10 - 0.27) / 2,
      y: titleY - 0.14,
      w: 0.27,
      h: 0.022,
      fill: { color: pc },
      line: { type: 'none' },
    });
    const rowY4 = titleY + titleH + 0.18;
    slide.addShape(pptx.ShapeType.rect, {
      x: (10 - 0.54 - 0.06 - 0.06) / 2,
      y: rowY4 + 0.06,
      w: 0.27,
      h: 0.018,
      fill: { color: pc },
      line: { type: 'none' },
    });
    slide.addShape(pptx.ShapeType.ellipse, {
      x: (10 - 0.54 - 0.06 - 0.06) / 2 + 0.33,
      y: rowY4 + 0.04,
      w: 0.06,
      h: 0.06,
      fill: { color: ac },
      line: { type: 'none' },
    });
  }

  // ── Template 5 (Bauhaus): accent SECTION label + primary bar above, staggered bars below
  if (templateId === 5) {
    const pc = cleanColor(primaryColor);
    const sc = cleanColor(config.coverDesign?.colors?.secondary || primaryColor);
    const ac = cleanColor(config.coverDesign?.colors?.accent || primaryColor);
    slide.addText('SECTION', {
      x: 0.5,
      y: titleY - 0.44,
      w: 9,
      h: 0.22,
      fontSize: 9,
      bold: true,
      color: ac,
      transparency: 0,
      align: 'center',
      valign: 'middle',
      charSpacing: 5,
      fontFace: font,
    });
    slide.addShape(pptx.ShapeType.rect, {
      x: (10 - 0.25) / 2,
      y: titleY - 0.18,
      w: 0.25,
      h: 0.022,
      fill: { color: pc },
      line: { type: 'none' },
    });
    const rowY5 = titleY + titleH + 0.2;
    const b5x = (10 - (0.4 + 0.06 + 0.2 + 0.06 + 0.1)) / 2;
    slide.addShape(pptx.ShapeType.rect, {
      x: b5x,
      y: rowY5 + 0.04,
      w: 0.4,
      h: 0.1,
      fill: { color: pc },
      line: { type: 'none' },
    });
    slide.addShape(pptx.ShapeType.rect, {
      x: b5x + 0.46,
      y: rowY5 + 0.04,
      w: 0.2,
      h: 0.1,
      fill: { color: sc },
      line: { type: 'none' },
    });
    slide.addShape(pptx.ShapeType.rect, {
      x: b5x + 0.72,
      y: rowY5 + 0.04,
      w: 0.1,
      h: 0.1,
      fill: { color: ac },
      line: { type: 'none' },
    });
  }

  // ── Template 6 (Hexagon Mesh): SECTION label + white bar above, left-dot-right below
  if (templateId === 6) {
    slide.addText('SECTION', {
      x: 0.5,
      y: titleY - 0.44,
      w: 9,
      h: 0.22,
      fontSize: 9,
      bold: true,
      color: 'FFFFFF',
      transparency: 40,
      align: 'center',
      valign: 'middle',
      charSpacing: 5,
      fontFace: font,
    });
    slide.addShape(pptx.ShapeType.rect, {
      x: (10 - 0.29) / 2,
      y: titleY - 0.18,
      w: 0.29,
      h: 0.022,
      fill: { color: 'FFFFFF', transparency: 30 },
      line: { type: 'none' },
    });
    const rowY6 = titleY + titleH + 0.14;
    const rW6 = 0.27,
      dW6 = 0.06,
      gap6 = 0.06;
    const rx6 = (10 - (rW6 + gap6 + dW6 + gap6 + 0.15)) / 2;
    slide.addShape(pptx.ShapeType.rect, {
      x: rx6,
      y: rowY6 + 0.07,
      w: rW6,
      h: 0.018,
      fill: { color: 'FFFFFF', transparency: 30 },
      line: { type: 'none' },
    });
    slide.addShape(pptx.ShapeType.ellipse, {
      x: rx6 + rW6 + gap6,
      y: rowY6 + 0.05,
      w: dW6,
      h: dW6,
      fill: { color: 'FFFFFF', transparency: 50 },
      line: { type: 'none' },
    });
    slide.addShape(pptx.ShapeType.rect, {
      x: rx6 + rW6 + gap6 + dW6 + gap6,
      y: rowY6 + 0.07,
      w: 0.15,
      h: 0.018,
      fill: { color: 'FFFFFF', transparency: 65 },
      line: { type: 'none' },
    });
  }

  // ── Template 7 (Clean Line): primary bar + SECTION label above, accent bar below
  if (templateId === 7) {
    const pc = cleanColor(primaryColor);
    const ac = cleanColor(config.coverDesign?.colors?.accent || primaryColor);
    slide.addShape(pptx.ShapeType.rect, {
      x: (10 - 0.48) / 2,
      y: titleY - 0.52,
      w: 0.48,
      h: 0.005,
      fill: { color: pc },
      line: { type: 'none' },
    });
    slide.addText('SECTION', {
      x: 0.5,
      y: titleY - 0.42,
      w: 9,
      h: 0.22,
      fontSize: 9,
      color: pc,
      transparency: 45,
      align: 'center',
      valign: 'middle',
      charSpacing: 6,
      fontFace: font,
    });
    slide.addShape(pptx.ShapeType.rect, {
      x: (10 - 0.48) / 2,
      y: titleY + titleH + 0.14,
      w: 0.48,
      h: 0.005,
      fill: { color: ac },
      line: { type: 'none' },
    });
  }

  // ── Template 8 (Asymmetric): accent SECTION label above, gradient bar + dot below
  if (templateId === 8) {
    const pc = cleanColor(primaryColor);
    const ac = cleanColor(config.coverDesign?.colors?.accent || primaryColor);
    slide.addText('SECTION', {
      x: 0.5,
      y: titleY - 0.38,
      w: 9,
      h: 0.22,
      fontSize: 9,
      bold: true,
      color: ac,
      transparency: 0,
      align: 'center',
      valign: 'middle',
      charSpacing: 6,
      fontFace: font,
    });
    const rowY8 = titleY + titleH + 0.18;
    slide.addShape(pptx.ShapeType.rect, {
      x: (10 - 0.54 - 0.06 - 0.12) / 2,
      y: rowY8 + 0.06,
      w: 0.27,
      h: 0.018,
      fill: { color: pc },
      line: { type: 'none' },
    });
    slide.addShape(pptx.ShapeType.ellipse, {
      x: (10 - 0.54 - 0.06 - 0.12) / 2 + 0.33,
      y: rowY8 + 0.04,
      w: 0.06,
      h: 0.06,
      fill: { color: ac },
      line: { type: 'none' },
    });
  }

  // ── Template 9 (Nordic Frame): secondary SECTION label + thin line above, stepped bars below
  if (templateId === 9) {
    const pc = cleanColor(primaryColor);
    const sc = cleanColor(config.coverDesign?.colors?.secondary || primaryColor);
    const ac = cleanColor(config.coverDesign?.colors?.accent || primaryColor);
    slide.addText('SECTION', {
      x: 0.5,
      y: titleY - 0.44,
      w: 9,
      h: 0.22,
      fontSize: 9,
      color: sc,
      transparency: 0,
      align: 'center',
      valign: 'middle',
      charSpacing: 7,
      fontFace: font,
    });
    slide.addShape(pptx.ShapeType.rect, {
      x: (10 - 0.24) / 2,
      y: titleY - 0.16,
      w: 0.24,
      h: 0.005,
      fill: { color: pc },
      line: { type: 'none' },
    });
    const rowY9 = titleY + titleH + 0.18;
    const b9x = (10 - (0.48 + 0.04 + 0.24 + 0.04 + 0.12)) / 2;
    slide.addShape(pptx.ShapeType.rect, {
      x: b9x,
      y: rowY9,
      w: 0.48,
      h: 0.05,
      fill: { color: pc },
      line: { type: 'none' },
    });
    slide.addShape(pptx.ShapeType.rect, {
      x: b9x + 0.52,
      y: rowY9,
      w: 0.24,
      h: 0.05,
      fill: { color: sc },
      line: { type: 'none' },
    });
    slide.addShape(pptx.ShapeType.rect, {
      x: b9x + 0.8,
      y: rowY9,
      w: 0.12,
      h: 0.05,
      fill: { color: ac },
      line: { type: 'none' },
    });
  }

  // Title color: white on dark bg templates, dark on light bg templates
  // Section headings are always centered — only T2 (Bold Split right panel) is left-aligned
  const secHAlign: 'left' | 'center' = templateId === 2 ? s.align : 'center';
  const secHXOffset = templateId === 2 ? s.xOffset : 0.5;
  const secHTextWidth = templateId === 2 ? s.textWidth : 9;

  slide.addText(sectionTitle, {
    x: secHXOffset,
    y: titleY,
    w: secHTextWidth,
    h: titleH,
    fontSize: Math.max(s.titleSize, 36),
    bold: true,
    color: s.titleColor,
    align: secHAlign,
    valign: 'middle',
    fontFace: font,
    charSpacing: -1,
    wrap: true,
  });
}

/**
 * Fallback: section heading with native shapes only.
 */
export function createSectionHeadingSlide(
  pptx: PptxGenJS,
  config: ReportConfig,
  sectionTitle: string,
) {
  const slide = pptx.addSlide();
  const font = config.font?.name || 'Inter';
  const primaryColor = config.coverDesign?.colors?.primary || config.theme?.brandColor || '3B82F6';
  const secondaryColor = config.coverDesign?.colors?.secondary || '8B5CF6';

  slide.background = { color: cleanColor(primaryColor) };

  // Gradient overlay
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 10,
    h: 5.625,
    fill: { color: cleanColor(secondaryColor), transparency: 50 },
    line: { type: 'none' },
  });

  // Title
  slide.addText(sectionTitle, {
    x: 0.5,
    y: 1.8,
    w: 9,
    h: 2,
    fontSize: 48,
    bold: true,
    color: 'FFFFFF',
    align: 'center',
    valign: 'middle',
    fontFace: font,
  });
}

// ─── Hybrid Dashboard Slide (screenshot bg + native chart/table/text) ──

interface DashboardExportData {
  takeaways?: string[];
  tableData?: string[][]; // extracted from DOM: rows × columns
}

/** Generate the same chart data used in the React component (fixed seed) */
function generateDashboardChartData() {
  const labels: string[] = [];
  const reachValues: number[] = [];
  const growthValues: number[] = [];

  // Representative fixed data matching the component's pattern
  const reachSpikes = [5, 12, 20, 28];
  const growthSpikes = [7, 15, 23, 30];

  for (let i = 1; i <= 31; i++) {
    labels.push(`Aug ${i}`);

    let reach = 1200000;
    if (reachSpikes.includes(i)) {
      reach += 2200000;
    } else {
      reach += ((i * 37) % 400000) - 200000;
    }
    reachValues.push(Math.max(0, Math.floor(reach)));

    let growth = 2500;
    if (growthSpikes.includes(i)) {
      growth += 4500;
    } else {
      growth += ((i * 23) % 300) - 150;
    }
    growthValues.push(Math.max(0, Math.floor(growth)));
  }

  return { labels, reachValues, growthValues };
}

/**
 * Create dashboard slide: screenshot for header/decorations + native chart, table, insights.
 */
export function createDashboardSlideHybrid(
  pptx: PptxGenJS,
  config: ReportConfig,
  _bgImageData: string,
  slideData: DashboardExportData,
) {
  const slide = pptx.addSlide();
  const tv = getSlideThemeVars(config);
  const font = tv.font;
  const isDark = tv.isDark;
  const textColor = tv.textColor;
  const mutedColor = tv.mutedColor;
  const primaryColor = tv.primaryColor;
  const secondaryColor = tv.secondaryColor;

  // Fully native background + decorations (no screenshot)
  drawSlideBackground(slide, pptx, config, tv);
  drawSlideDecorations(slide, pptx, tv);

  // === Header card ===
  const headerX = 0.22;
  const headerY = 0.08;
  const headerW = 9.56;
  const headerH = 0.6;

  slide.addShape(pptx.ShapeType.roundRect, {
    x: headerX,
    y: headerY,
    w: headerW,
    h: headerH,
    fill: { color: tv.cardBg },
    line: { color: tv.borderColor, width: 0.75 },
    rectRadius: 0.08,
    shadow: {
      type: 'outer',
      blur: 6,
      offset: 2,
      color: tv.primaryColor,
      opacity: isDark ? 0.1 : 0.06,
    },
  });

  // Left accent bar
  slide.addShape(pptx.ShapeType.rect, {
    x: headerX,
    y: headerY,
    w: 0.04,
    h: headerH,
    fill: { color: primaryColor },
    line: { type: 'none' },
  });

  // Header text
  slide.addText('Instagram Performance', {
    x: headerX + 0.2,
    y: headerY + 0.02,
    w: 3.5,
    h: 0.3,
    fontSize: 18,
    bold: true,
    color: textColor,
    align: 'left',
    valign: 'middle',
    fontFace: font,
  });

  slide.addText(`${config.period} Report`, {
    x: headerX + 0.2,
    y: headerY + 0.32,
    w: 3,
    h: 0.2,
    fontSize: 10,
    bold: true,
    color: mutedColor,
    align: 'left',
    valign: 'middle',
    fontFace: font,
  });

  // Metric cards
  const metrics = [
    { label: 'PROFILE REACH', value: '39M', trend: '\u2193 23%', trendColor: 'F43F5E' },
    { label: 'TOTAL GROWTH', value: '82.2K', trend: '\u2191 192%', trendColor: '10B981' },
    { label: 'ER REACH', value: '2.32%', trend: '\u2191 11%', trendColor: '10B981' },
  ];

  metrics.forEach((m, idx) => {
    const xPos = 5.8 + idx * 1.5;
    slide.addText(m.label, {
      x: xPos,
      y: headerY + 0.02,
      w: 1.4,
      h: 0.18,
      fontSize: 8,
      bold: true,
      color: mutedColor,
      align: 'left',
      valign: 'middle',
      fontFace: font,
    });
    slide.addText(m.value, {
      x: xPos,
      y: headerY + 0.16,
      w: 1.0,
      h: 0.3,
      fontSize: 22,
      bold: true,
      color: textColor,
      align: 'left',
      valign: 'middle',
      fontFace: font,
    });
    slide.addText(m.trend, {
      x: xPos + 0.6,
      y: headerY + 0.22,
      w: 0.7,
      h: 0.2,
      fontSize: 8,
      bold: true,
      color: m.trendColor,
      align: 'left',
      valign: 'middle',
      fontFace: font,
    });
  });

  // === Native Chart ===
  // Positions: chart area roughly at x=0.2, y=0.75, takes ~60% width
  const chartAreaX = 0.22;
  const chartAreaY = 0.78;
  const chartAreaW = 5.7;
  const chartAreaH = 2.45;

  // Chart card background
  slide.addShape(pptx.ShapeType.roundRect, {
    x: chartAreaX,
    y: chartAreaY,
    w: chartAreaW,
    h: chartAreaH,
    fill: { color: isDark ? '1E293B' : 'FFFFFF' },
    line: { color: isDark ? '334155' : 'E2E8F0', width: 0.75 },
    rectRadius: 0.1,
  });

  // Chart title
  slide.addText('Daily Trends (Reach vs Growth)', {
    x: chartAreaX + 0.15,
    y: chartAreaY + 0.05,
    w: 3,
    h: 0.25,
    fontSize: 11,
    bold: true,
    color: textColor,
    align: 'left',
    valign: 'middle',
    fontFace: font,
  });

  // Legend
  slide.addShape(pptx.ShapeType.ellipse, {
    x: chartAreaX + chartAreaW - 2.0,
    y: chartAreaY + 0.1,
    w: 0.12,
    h: 0.12,
    fill: { color: secondaryColor },
    line: { type: 'none' },
  });
  slide.addText('Growth', {
    x: chartAreaX + chartAreaW - 1.85,
    y: chartAreaY + 0.05,
    w: 0.6,
    h: 0.2,
    fontSize: 8,
    color: mutedColor,
    fontFace: font,
  });
  slide.addShape(pptx.ShapeType.ellipse, {
    x: chartAreaX + chartAreaW - 1.1,
    y: chartAreaY + 0.1,
    w: 0.12,
    h: 0.12,
    fill: { color: primaryColor },
    line: { type: 'none' },
  });
  slide.addText('Reach', {
    x: chartAreaX + chartAreaW - 0.95,
    y: chartAreaY + 0.05,
    w: 0.6,
    h: 0.2,
    fontSize: 8,
    color: mutedColor,
    fontFace: font,
  });

  // Native line chart
  const cd = generateDashboardChartData();
  // Sample every 4th label to avoid crowding
  const sampledLabels = cd.labels.map((l, i) => (i % 4 === 0 ? l : ''));

  slide.addChart(
    pptx.ChartType.line,
    [
      { name: 'Growth', labels: sampledLabels, values: cd.growthValues },
      { name: 'Reach', labels: sampledLabels, values: cd.reachValues },
    ],
    {
      x: chartAreaX + 0.1,
      y: chartAreaY + 0.35,
      w: chartAreaW - 0.2,
      h: chartAreaH - 0.45,
      chartColors: [secondaryColor, primaryColor],
      showLegend: false,
      showTitle: false,
      lineSmooth: true,
      lineSize: 1.5,
      valGridLine: { style: 'dash', color: isDark ? '334155' : 'F1F5F9' },
      catGridLine: { style: 'none' },
      catAxisLabelFontSize: 7,
      valAxisLabelFontSize: 7,
      catAxisLabelColor: mutedColor,
      valAxisLabelColor: mutedColor,
      catAxisLineShow: false,
      valAxisLineShow: false,
    },
  );

  // === Native Insights ===
  const insightX = chartAreaX + chartAreaW + 0.12;
  const insightW = 10 - insightX - 0.22;
  const insightH = chartAreaH;

  // Insight card background
  slide.addShape(pptx.ShapeType.roundRect, {
    x: insightX,
    y: chartAreaY,
    w: insightW,
    h: insightH,
    fill: { color: isDark ? '1E293B' : 'FFFFFF' },
    line: { color: isDark ? '334155' : 'E2E8F0', width: 0.75 },
    rectRadius: 0.1,
  });

  // Insight header
  slide.addText('KEY TAKEAWAYS', {
    x: insightX + 0.15,
    y: chartAreaY + 0.05,
    w: insightW - 0.3,
    h: 0.25,
    fontSize: 10,
    bold: true,
    color: textColor,
    align: 'left',
    valign: 'middle',
    fontFace: font,
  });

  // Separator line
  slide.addShape(pptx.ShapeType.line, {
    x: insightX + 0.15,
    y: chartAreaY + 0.35,
    w: insightW - 0.3,
    h: 0,
    line: { color: isDark ? '334155' : 'F1F5F9', width: 0.75 },
  });

  // Takeaway bullets
  const takeawayLines = slideData.takeaways || [
    'Profile Reach dropped by 23.41%, but Growth skyrocketed +192%.',
    'Engagement Rate (Reach) improved to 2.32%.',
    'Shares remain high at 12.9k.',
  ];
  const cleanMd = (t: string) => t.replace(/\*/g, '');
  const takeawayText = takeawayLines.map((t) => `\u2022  ${cleanMd(t)}`).join('\n\n');

  slide.addText(takeawayText, {
    x: insightX + 0.15,
    y: chartAreaY + 0.4,
    w: insightW - 0.3,
    h: insightH - 0.55,
    fontSize: 9,
    color: mutedColor,
    align: 'left',
    valign: 'top',
    fontFace: font,
    lineSpacingMultiple: 1.2,
    wrap: true,
  });

  // === Native Table ===
  const tableY = chartAreaY + chartAreaH + 0.12;
  const tableH = 5.625 - tableY - 0.45; // leave room for footer
  const tableW = 10 - 0.44;

  // Table card background
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.22,
    y: tableY,
    w: tableW,
    h: tableH,
    fill: { color: isDark ? '1E293B' : 'FFFFFF' },
    line: { color: isDark ? '334155' : 'E2E8F0', width: 0.75 },
    rectRadius: 0.1,
  });

  // Build table from extracted DOM data or fallback
  const headerStyle = {
    bold: true,
    fontSize: 7,
    color: mutedColor,
    fill: { color: isDark ? '0F172A' : 'F8FAFC' },
    align: 'center' as const,
    valign: 'middle' as const,
    fontFace: font,
  };
  const cellStyle = {
    fontSize: 7,
    color: textColor,
    align: 'center' as const,
    valign: 'middle' as const,
    fontFace: font,
  };
  const cellBoldStyle = { ...cellStyle, bold: true };
  const gapGreenStyle = { ...cellBoldStyle, color: '10B981' };
  const gapRedStyle = { ...cellBoldStyle, color: 'F43F5E' };

  const colHeaders = [
    'Month',
    'Profile Reach',
    'Profile Visit',
    'Growth',
    'Reach',
    'Engagement',
    'Likes',
    'Comments',
    'Shares',
    'Saves',
    'ER Reach',
    'ER Follow',
  ];

  // Use DOM-extracted data if available, otherwise fallback
  let tableRows: any[][];
  if (slideData.tableData && slideData.tableData.length >= 3) {
    const [prevRow, currRow, gapRow] = slideData.tableData;
    tableRows = [
      colHeaders.map((h) => ({ text: h, options: headerStyle })),
      prevRow.map((v, i) => ({
        text: v,
        options: i === 0 ? { ...cellStyle, align: 'left' as const } : cellStyle,
      })),
      currRow.map((v, i) => ({
        text: v,
        options: i === 0 ? { ...cellBoldStyle, align: 'left' as const } : cellBoldStyle,
      })),
      gapRow.map((v, i) => {
        if (i === 0)
          return {
            text: v,
            options: { ...cellBoldStyle, color: primaryColor, align: 'left' as const },
          };
        const isPositive = !v.startsWith('-');
        return { text: v, options: isPositive ? gapGreenStyle : gapRedStyle };
      }),
    ];
  } else {
    // Fallback with hardcoded data matching the component
    const prevData = [
      'Previous',
      '50.9M',
      '480K',
      '28.1K',
      '14.1M',
      '118K',
      '82.4K',
      '10.8K',
      '22.3K',
      '2.5K',
      '2.07%',
      '0.08%',
    ];
    const currData = [
      'Current',
      '39M',
      '287K',
      '82.2K',
      '9.9M',
      '71.7K',
      '51.6K',
      '5.5K',
      '12.9K',
      '1.7K',
      '2.32%',
      '0.03%',
    ];
    const gapData = [
      'Gap',
      '-23.4%',
      '-40.2%',
      '+192.7%',
      '-29.6%',
      '-39.3%',
      '-37.4%',
      '-49.2%',
      '-42.1%',
      '-32.6%',
      '+12.1%',
      '-62.5%',
    ];

    tableRows = [
      colHeaders.map((h) => ({ text: h, options: headerStyle })),
      prevData.map((v, i) => ({
        text: v,
        options: i === 0 ? { ...cellStyle, align: 'left' as const } : cellStyle,
      })),
      currData.map((v, i) => ({
        text: v,
        options: i === 0 ? { ...cellBoldStyle, align: 'left' as const } : cellBoldStyle,
      })),
      gapData.map((v, i) => {
        if (i === 0)
          return {
            text: v,
            options: { ...cellBoldStyle, color: primaryColor, align: 'left' as const },
          };
        const isPositive = v.startsWith('+');
        return { text: v, options: isPositive ? gapGreenStyle : gapRedStyle };
      }),
    ];
  }

  slide.addTable(tableRows, {
    x: 0.3,
    y: tableY + 0.05,
    w: tableW - 0.16,
    fontSize: 7,
    border: { pt: 0.5, color: isDark ? '334155' : 'E2E8F0' },
    align: 'center',
    valign: 'middle',
    fontFace: font,
    color: textColor,
    rowH: [0.22, 0.2, 0.2, 0.2],
  });
}

// Create Instagram dashboard slide
export function createInstagramDashboard(pptx: PptxGenJS, config: ReportConfig) {
  const slide = pptx.addSlide();
  slide.background = { color: 'FFFFFF' };

  // Header bar
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 10,
    h: 0.65,
    fill: { color: 'F9FAFB' },
    line: { type: 'none' },
  });

  // Instagram icon (circle)
  slide.addShape(pptx.ShapeType.ellipse, {
    x: 0.25,
    y: 0.15,
    w: 0.35,
    h: 0.35,
    fill: {
      type: 'solid',
      color: 'E1306C', // Instagram gradient approximation
    },
    line: { type: 'none' },
  });

  // Title
  slide.addText('Instagram Performance', {
    x: 0.7,
    y: 0.15,
    w: 8,
    h: 0.35,
    fontSize: 22,
    bold: true,
    color: '1F2937',
    valign: 'middle',
  });

  // Subtitle
  slide.addText('AUGUST 2024 REPORT', {
    x: 0.7,
    y: 0.38,
    w: 8,
    h: 0.2,
    fontSize: 10,
    color: '6B7280',
    valign: 'middle',
  });

  // Key Metrics - 3 cards
  const metrics = [
    {
      label: 'PROFILE REACH',
      value: '39M',
      change: '↑ 2.23%',
      changeColor: '10B981',
      icon: '👥',
    },
    {
      label: 'TOTAL GROWTH',
      value: '82.2K',
      change: '↑ 7.19%',
      changeColor: '10B981',
      icon: '📈',
    },
    {
      label: 'ER REACH',
      value: '2.32%',
      change: '↑ 3.45%',
      changeColor: '10B981',
      icon: '💡',
    },
  ];

  metrics.forEach((metric, idx) => {
    const xPos = 0.3 + idx * 3.2;

    // Card background with shadow
    slide.addShape(pptx.ShapeType.roundRect, {
      x: xPos,
      y: 0.95,
      w: 2.9,
      h: 1.15,
      fill: { color: 'FFFFFF' },
      line: { color: 'E5E7EB', width: 1 },
      shadow: {
        type: 'outer',
        blur: 4,
        offset: 1,
        angle: 90,
        color: '000000',
        opacity: 0.08,
      },
    });

    // Icon
    slide.addText(metric.icon, {
      x: xPos + 0.15,
      y: 1.05,
      w: 0.4,
      h: 0.4,
      fontSize: 20,
      valign: 'middle',
    });

    // Label
    slide.addText(metric.label, {
      x: xPos + 0.15,
      y: 1.15,
      w: 2.6,
      h: 0.22,
      fontSize: 9,
      color: '6B7280',
      bold: true,
    });

    // Value
    slide.addText(metric.value, {
      x: xPos + 0.15,
      y: 1.42,
      w: 2.6,
      h: 0.38,
      fontSize: 28,
      color: '111827',
      bold: true,
    });

    // Change badge
    slide.addShape(pptx.ShapeType.roundRect, {
      x: xPos + 0.15,
      y: 1.82,
      w: 0.9,
      h: 0.22,
      fill: { color: metric.changeColor, transparency: 85 },
      line: { type: 'none' },
    });
    slide.addText(metric.change, {
      x: xPos + 0.15,
      y: 1.82,
      w: 0.9,
      h: 0.22,
      fontSize: 10,
      color: metric.changeColor,
      bold: true,
      align: 'center',
      valign: 'middle',
    });
  });

  // Daily Trends section title
  slide.addText('Daily Trends (Reach vs Growth)', {
    x: 0.3,
    y: 2.3,
    w: 9,
    h: 0.25,
    fontSize: 14,
    bold: true,
    color: '1F2937',
  });

  // Get chart colors for legend
  const legendColors = getChartColors(config);

  // Legend
  slide.addShape(pptx.ShapeType.rect, {
    x: 7.5,
    y: 2.32,
    w: 0.15,
    h: 0.15,
    fill: { color: legendColors[0] },
    line: { type: 'none' },
  });
  slide.addText('Growth', {
    x: 7.7,
    y: 2.3,
    w: 0.8,
    h: 0.2,
    fontSize: 9,
    color: '6B7280',
    valign: 'middle',
  });

  slide.addShape(pptx.ShapeType.rect, {
    x: 8.6,
    y: 2.32,
    w: 0.15,
    h: 0.15,
    fill: { color: legendColors[1] },
    line: { type: 'none' },
  });
  slide.addText('Reach', {
    x: 8.8,
    y: 2.3,
    w: 0.8,
    h: 0.2,
    fontSize: 9,
    color: '6B7280',
    valign: 'middle',
  });

  // Trend chart
  const chartData = [
    {
      name: 'Growth',
      labels: ['Aug 1', 'Aug 5', 'Aug 9', 'Aug 13', 'Aug 17', 'Aug 21', 'Aug 25', 'Aug 29'],
      values: [32, 35, 33, 38, 36, 39, 38, 39],
    },
    {
      name: 'Reach',
      labels: ['Aug 1', 'Aug 5', 'Aug 9', 'Aug 13', 'Aug 17', 'Aug 21', 'Aug 25', 'Aug 29'],
      values: [28, 30, 29, 33, 31, 34, 33, 35],
    },
  ];

  const chartColors = getChartColors(config);

  slide.addChart(pptx.ChartType.line, chartData, {
    x: 0.3,
    y: 2.65,
    w: 9.4,
    h: 2.5,
    chartColors: [chartColors[0], chartColors[1]],
    showLegend: false,
    showTitle: false,
    valGridLine: { style: 'dash', color: 'E5E7EB' },
    catGridLine: { style: 'none' },
    valAxisMaxVal: 45,
    catAxisLabelFontSize: 9,
    valAxisLabelFontSize: 9,
    catAxisLabelColor: '6B7280',
    valAxisLabelColor: '6B7280',
    border: { pt: 1, color: 'E5E7EB' },
  });

  // Performance table
  const tableData = [
    [
      {
        text: 'MONTH',
        options: { bold: true, fontSize: 9, color: '6B7280', fill: { color: 'F9FAFB' } },
      },
      {
        text: 'PROFILE REACH',
        options: { bold: true, fontSize: 9, color: '6B7280', fill: { color: 'F9FAFB' } },
      },
      {
        text: 'PROFILE VISIT',
        options: { bold: true, fontSize: 9, color: '6B7280', fill: { color: 'F9FAFB' } },
      },
      {
        text: 'GROWTH',
        options: { bold: true, fontSize: 9, color: '6B7280', fill: { color: 'F9FAFB' } },
      },
      {
        text: 'REACH',
        options: { bold: true, fontSize: 9, color: '6B7280', fill: { color: 'F9FAFB' } },
      },
      {
        text: 'ENGAGEMENT',
        options: { bold: true, fontSize: 9, color: '6B7280', fill: { color: 'F9FAFB' } },
      },
      {
        text: 'LIKES',
        options: { bold: true, fontSize: 9, color: '6B7280', fill: { color: 'F9FAFB' } },
      },
    ],
    [
      { text: 'Aug 2024', options: {} },
      { text: '39M', options: { bold: true, color: '111827' } },
      { text: '2.5M', options: {} },
      { text: '+7.19%', options: { color: '10B981' } },
      { text: '2.32%', options: {} },
      { text: '185K', options: {} },
      { text: '1.2M', options: {} },
    ],
  ];

  slide.addTable(tableData, {
    x: 0.3,
    y: 5.35,
    w: 9.4,
    h: 0.18,
    fontSize: 9,
    border: { pt: 1, color: 'E5E7EB' },
    align: 'center',
    valign: 'middle',
    color: '374151',
  });
}

// ─── Hybrid Layout Dashboard (screenshot bg + native chart/table/insight) ──

interface LayoutDashboardExportData {
  title?: string;
  channel?: string;
  badgeImage?: string | null;
  chartData?: {
    type: string;
    orientation?: string;
    labels: string[];
    series: { name: string; values: number[] }[];
  };
  insightText?: string;
  tableTitle?: string;
  tableHeaders?: string[];
  tableRows?: string[][];
  currentPage?: number;
  totalPages?: number;
}

/** Channel short labels for PPTX badge */
const CHANNEL_LABELS: Record<string, string> = {
  instagram: 'IG',
  facebook: 'FB',
  twitter: 'X',
  tiktok: 'TT',
  youtube: 'YT',
};

/**
 * Generate channel badge as SVG data URL (dark rounded square with white icon).
 * Uses the same lucide icon paths as ChannelBadge component.
 */
function getChannelBadgeSvg(channel: string): string {
  // Lucide icon SVG paths (24x24 viewBox)
  const iconPaths: Record<string, string> = {
    instagram:
      '<rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    facebook:
      '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    twitter:
      '<path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    tiktok:
      '<path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    youtube:
      '<path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polygon points="10 15 15 12 10 9 10 15" fill="white"/>',
  };

  const iconPath = iconPaths[channel] || '';
  if (!iconPath) return '';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
    <rect width="96" height="96" rx="16" fill="#1e293b"/>
    <g transform="translate(24, 24) scale(2)">${iconPath}</g>
  </svg>`;

  return 'data:image/svg+xml;base64,' + btoa(svg);
}

/**
 * Extract chart data from DOM SVG (Recharts renders data in SVG elements).
 */
export function extractChartInfo(
  chartEl: HTMLElement,
): LayoutDashboardExportData['chartData'] | null {
  // Primary: read from data-chart-json attribute (exact data from React component)
  const jsonEl = chartEl.querySelector('[data-chart-json]') as HTMLElement;
  if (jsonEl) {
    try {
      const parsed = JSON.parse(jsonEl.getAttribute('data-chart-json') || '');
      if (parsed && parsed.labels && parsed.series) {
        return {
          type: parsed.type || 'line',
          orientation: parsed.orientation || 'horizontal',
          labels: parsed.labels,
          series: parsed.series,
        };
      }
    } catch (e) {
      console.warn('Failed to parse data-chart-json, falling back to SVG extraction:', e);
    }
  }

  // Fallback: try to extract from SVG
  const svg = chartEl.querySelector('.recharts-wrapper svg');
  if (!svg) return null;

  const hasBar = svg.querySelector('.recharts-bar');

  const legendItems = chartEl.querySelectorAll('.recharts-legend-item-text');
  const seriesNames: string[] = [];
  legendItems.forEach((el) => {
    const name = el.textContent?.trim();
    if (name) seriesNames.push(name);
  });

  const xLabels: string[] = [];
  const xTicks = chartEl.querySelectorAll('.recharts-xAxis .recharts-cartesian-axis-tick-value');
  xTicks.forEach((el) => xLabels.push(el.textContent?.trim() || ''));

  const yTickValues: number[] = [];
  const yTicks = chartEl.querySelectorAll('.recharts-yAxis .recharts-cartesian-axis-tick-value');
  yTicks.forEach((el) => {
    const txt = el.textContent?.trim() || '';
    const num = parseFloat(txt.replace(/[,]/g, '').replace(/[^0-9.-]/g, ''));
    if (!isNaN(num)) yTickValues.push(num);
  });

  const maxY = yTickValues.length > 0 ? Math.max(...yTickValues) : 100;
  const numLabels = xLabels.length || 5;

  return {
    type: hasBar ? 'bar' : 'line',
    labels:
      xLabels.length > 0 ? xLabels : Array.from({ length: numLabels }, (_, i) => String(i + 1)),
    series: (seriesNames.length > 0 ? seriesNames : ['Series 1']).map((name, sIdx) => ({
      name,
      values: Array.from({ length: numLabels }, (_, i) =>
        Math.floor(maxY * 0.3 + (maxY * 0.5 * ((i * 37 + sIdx * 13) % 100)) / 100),
      ),
    })),
  };
}

/**
 * Draw a native footer matching the SlideFooter component.
 */
function drawNativeFooter(
  slide: PptxGenJS.Slide,
  pptx: PptxGenJS,
  config: ReportConfig,
  primaryColor: string,
  font: string,
  currentPage: number,
  totalPages: number,
) {
  const footerY = 5.15;
  const footerH = 0.47;

  // Footer accent line
  slide.addShape(pptx.ShapeType.line, {
    x: 0.3,
    y: footerY,
    w: 9.4,
    h: 0,
    line: { color: primaryColor, width: 1 },
  });

  // Footer background
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: footerY,
    w: 10,
    h: footerH,
    fill: { color: 'FFFFFF', transparency: 5 },
    line: { type: 'none' },
  });

  // Logo
  if (config.coverDesign?.logoData) {
    slide.addImage({
      data: config.coverDesign.logoData,
      x: 0.3,
      y: footerY + 0.06,
      w: 0.35,
      h: 0.35,
      sizing: { type: 'contain', w: 0.35, h: 0.35 },
    });
  }

  // Client name + period
  const logoOffset = config.coverDesign?.logoData ? 0.72 : 0.3;
  slide.addText(`${config.clientName}  \u2022  ${config.period}`, {
    x: logoOffset,
    y: footerY + 0.04,
    w: 3.5,
    h: 0.38,
    fontSize: 8,
    color: '374151',
    fontFace: font,
    align: 'left',
    valign: 'middle',
  });

  // Powered by Sekata
  slide.addText('Powered by Sekata', {
    x: 3.5,
    y: footerY + 0.04,
    w: 3,
    h: 0.38,
    fontSize: 7,
    color: '9CA3AF',
    fontFace: font,
    align: 'center',
    valign: 'middle',
  });

  // Page number
  slide.addText(`${currentPage} / ${totalPages}`, {
    x: 8,
    y: footerY + 0.04,
    w: 1.5,
    h: 0.38,
    fontSize: 8,
    bold: true,
    color: primaryColor,
    fontFace: font,
    align: 'right',
    valign: 'middle',
  });
}

// ─── Layout Dashboard Native Export ──────────────────────────

/**
 * Create a layout_dashboard slide using fully native PPTX elements.
 * No screenshot background – draws background/decorations the same way as KPI/Overview.
 */
export function createLayoutDashboardNative(
  pptx: PptxGenJS,
  config: ReportConfig,
  exportData: LayoutDashboardExportData,
) {
  const slide = pptx.addSlide();
  const tv = getSlideThemeVars(config);

  // Shared background + decorations + header (same as KPI/Overview)
  drawSlideBackground(slide, pptx, config, tv);
  drawSlideDecorations(slide, pptx, tv);
  const { headerH, headerY } = drawSlideHeader(
    slide,
    pptx,
    tv,
    exportData.title || 'Dashboard',
    exportData.channel,
  );

  const font = tv.font;
  const isDark = tv.isDark;
  const mutedColor = tv.mutedColor;
  const cardBg = tv.cardBg;
  const borderColor = tv.borderColor;

  // Layout dimensions
  const contentY = headerY + headerH + 0.15;
  const chartX = 0.3;
  const chartW = 5.7;
  const chartH = 2.3;
  const insightX = chartX + chartW + 0.15;
  const insightW = 10 - insightX - 0.3;
  const tableY = contentY + chartH + 0.15;
  const tblFooterY = 5.15;
  const tableH = tblFooterY - tableY - 0.08;
  const tableW = 9.4;

  // === Chart Card ===
  slide.addShape(pptx.ShapeType.roundRect, {
    x: chartX,
    y: contentY,
    w: chartW,
    h: chartH,
    fill: { color: cardBg },
    line: { color: borderColor, width: 0.75 },
    rectRadius: 0.08,
    shadow: { type: 'outer', blur: 4, offset: 1, color: '000000', opacity: 0.05 },
  });

  const cd = exportData.chartData;
  if (cd && cd.series.length > 0) {
    const chartColors = [
      '3B82F6',
      '10B981',
      'F59E0B',
      'EF4444',
      '8B5CF6',
      'EC4899',
      '06B6D4',
      'F97316',
    ];
    const isBar = cd.type === 'bar';
    const isHorizontalBar = isBar && cd.orientation !== 'vertical';
    const chartSeries = cd.series.map((s) => ({
      name: s.name,
      labels: cd.labels,
      values: s.values,
    }));

    if (cd.type === 'pie') {
      slide.addChart(pptx.ChartType.pie, chartSeries, {
        x: chartX + 0.1,
        y: contentY + 0.1,
        w: chartW - 0.2,
        h: chartH - 0.2,
        chartColors: chartColors.slice(0, cd.labels.length),
        showLegend: true,
        legendPos: 'r',
        legendFontSize: 7,
        showTitle: false,
        showPercent: true,
        dataLabelFontSize: 7,
      });
    } else if (isBar) {
      slide.addChart(pptx.ChartType.bar, chartSeries, {
        x: chartX + 0.1,
        y: contentY + 0.1,
        w: chartW - 0.2,
        h: chartH - 0.2,
        chartColors: chartColors.slice(0, cd.series.length),
        barDir: isHorizontalBar ? 'bar' : 'col',
        barGrouping: 'clustered',
        barGapWidthPct: 80,
        showLegend: true,
        legendPos: 't',
        legendFontSize: 7,
        showTitle: false,
        showValue: false,
        valGridLine: { style: 'dash', color: isDark ? '334155' : 'E2E8F0' },
        catGridLine: { style: 'none' },
        catAxisLabelFontSize: 7,
        valAxisLabelFontSize: 7,
        catAxisLabelColor: mutedColor,
        valAxisLabelColor: mutedColor,
        catAxisLineShow: false,
        valAxisLineShow: false,
      });
    } else {
      slide.addChart(pptx.ChartType.line, chartSeries, {
        x: chartX + 0.1,
        y: contentY + 0.1,
        w: chartW - 0.2,
        h: chartH - 0.2,
        chartColors: chartColors.slice(0, cd.series.length),
        showLegend: true,
        legendPos: 't',
        legendFontSize: 7,
        showTitle: false,
        lineSmooth: true,
        lineSize: 2,
        lineDataSymbolSize: cd.labels.length > 10 ? 4 : 6,
        valGridLine: { style: 'dash', color: isDark ? '334155' : 'E2E8F0' },
        catGridLine: { style: 'none' },
        catAxisLabelFontSize: 7,
        valAxisLabelFontSize: 7,
        catAxisLabelColor: mutedColor,
        valAxisLabelColor: mutedColor,
        catAxisLineShow: false,
        valAxisLineShow: false,
      });
    }
  } else {
    slide.addText('Chart Area', {
      x: chartX,
      y: contentY,
      w: chartW,
      h: chartH,
      fontSize: 12,
      color: mutedColor,
      align: 'center',
      valign: 'middle',
      fontFace: font,
    });
  }

  // === Insight Panel ===
  drawSlideInsight(slide, pptx, tv, {
    x: insightX,
    y: contentY,
    w: insightW,
    h: chartH,
    label: 'AI Key Insights',
    text: exportData.insightText || '',
  });

  // === Table Card ===
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.3,
    y: tableY,
    w: tableW,
    h: tableH,
    fill: { color: cardBg },
    line: { color: borderColor, width: 0.75 },
    rectRadius: 0.08,
    shadow: { type: 'outer', blur: 4, offset: 1, color: '000000', opacity: 0.05 },
  });

  if (exportData.tableHeaders && exportData.tableRows && exportData.tableRows.length > 0) {
    if (exportData.tableTitle) {
      slide.addText(exportData.tableTitle, {
        x: 0.45,
        y: tableY + 0.05,
        w: tableW - 0.3,
        h: 0.25,
        fontSize: 9,
        bold: true,
        color: tv.textColor,
        align: 'left',
        valign: 'middle',
        fontFace: font,
      });
    }

    const headerStyle = {
      bold: true,
      fontSize: 7,
      color: mutedColor,
      fill: { color: isDark ? '0F172A' : 'F8FAFC' },
      align: 'center' as const,
      valign: 'middle' as const,
      fontFace: font,
    };
    const cellStyle = {
      fontSize: 7,
      color: tv.textColor,
      align: 'center' as const,
      valign: 'middle' as const,
      fontFace: font,
    };
    const cellBoldStyle = { ...cellStyle, bold: true };
    const numDataRows = exportData.tableRows.length;

    const tableRows: any[][] = [
      exportData.tableHeaders.map((h) => ({ text: h, options: headerStyle })),
    ];
    exportData.tableRows.forEach((row, rowIdx) => {
      const isLastRow = rowIdx === numDataRows - 1;
      tableRows.push(
        row.map((v, i) => {
          if (isLastRow && i > 0) {
            const isPositive = v.startsWith('+') || (!v.startsWith('-') && v !== '0' && v !== '0%');
            return {
              text: v,
              options: { ...cellBoldStyle, color: isPositive ? '10B981' : 'F43F5E' },
            };
          }
          return {
            text: v,
            options:
              i === 0
                ? { ...cellBoldStyle, align: 'left' as const }
                : isLastRow
                  ? cellBoldStyle
                  : cellStyle,
          };
        }),
      );
    });

    const tblYStart = exportData.tableTitle ? tableY + 0.32 : tableY + 0.08;
    const availH = tableH - (exportData.tableTitle ? 0.4 : 0.15);
    const rowH = Math.min(0.3, availH / tableRows.length);

    slide.addTable(tableRows, {
      x: 0.35,
      y: tblYStart,
      w: tableW - 0.1,
      fontSize: 7,
      border: { pt: 0.5, color: borderColor },
      align: 'center',
      valign: 'middle',
      fontFace: font,
      color: tv.textColor,
      rowH: tableRows.map(() => rowH),
    });
  } else {
    slide.addText('Data Table', {
      x: 0.3,
      y: tableY,
      w: tableW,
      h: tableH,
      fontSize: 12,
      color: mutedColor,
      align: 'center',
      valign: 'middle',
      fontFace: font,
    });
  }

  // === Footer ===
  drawNativeFooter(
    slide,
    pptx,
    config,
    tv.primaryColor,
    font,
    exportData.currentPage || 1,
    exportData.totalPages || 1,
  );
}

// ─── Comparison Hybrid Export ─────────────────────────────────

interface ComparisonExportData {
  title?: string;
  channel?: string;
  chartAData?: {
    type: string;
    orientation?: string;
    labels: string[];
    series: { name: string; values: number[] }[];
  } | null;
  chartBData?: {
    type: string;
    orientation?: string;
    labels: string[];
    series: { name: string; values: number[] }[];
  } | null;
  insightText?: string;
  currentPage?: number;
  totalPages?: number;
}

/**
 * Create a comparison slide: screenshot bg + native header, two charts, insight, footer.
 */
export function createComparisonHybrid(
  pptx: PptxGenJS,
  config: ReportConfig,
  _bgImageData: string,
  exportData: ComparisonExportData,
) {
  const slide = pptx.addSlide();
  const tv = getSlideThemeVars(config);

  // Fully native background + decorations + header (no screenshot)
  drawSlideBackground(slide, pptx, config, tv);
  drawSlideDecorations(slide, pptx, tv);
  drawSlideHeader(slide, pptx, tv, exportData.title || 'Comparison', exportData.channel);

  const font = tv.font;
  const isDark = tv.isDark;
  const textColor = tv.textColor;
  const mutedColor = tv.mutedColor;
  const primaryColor = tv.primaryColor;
  const cardBg = tv.cardBg;
  const borderColor = tv.borderColor;
  const pageBg = tv.pageBg;
  const headerY = 0.3;
  const headerH = 0.55;

  // === Two Chart Columns ===
  const contentY = headerY + headerH + 0.15;
  const chartGap = 0.15;
  const chartW = (9.4 - chartGap) / 2;
  const chartH = 2.6;
  const chartAX = 0.3;
  const chartBX = chartAX + chartW + chartGap;

  // Helper to draw a chart in a card
  const drawChartCard = (
    x: number,
    chartData: ComparisonExportData['chartAData'],
    fallbackLabel: string,
  ) => {
    // Card bg
    slide.addShape(pptx.ShapeType.roundRect, {
      x,
      y: contentY,
      w: chartW,
      h: chartH,
      fill: { color: cardBg },
      line: { color: borderColor, width: 0.75 },
      rectRadius: 0.08,
    });

    if (chartData && chartData.series.length > 0) {
      const chartColors = [
        '3B82F6',
        '10B981',
        'F59E0B',
        'EF4444',
        '8B5CF6',
        'EC4899',
        '06B6D4',
        'F97316',
      ];
      const isBar = chartData.type === 'bar';
      const isHorizontalBar = isBar && chartData.orientation !== 'vertical';

      const chartSeries = chartData.series.map((s) => ({
        name: s.name,
        labels: chartData.labels,
        values: s.values,
      }));

      if (chartData.type === 'pie') {
        slide.addChart(pptx.ChartType.pie, chartSeries, {
          x: x + 0.1,
          y: contentY + 0.1,
          w: chartW - 0.2,
          h: chartH - 0.2,
          chartColors: chartColors.slice(0, chartData.labels.length),
          showLegend: true,
          legendPos: 'b',
          legendFontSize: 6,
          showTitle: false,
          showPercent: true,
          dataLabelFontSize: 6,
        });
      } else if (isBar) {
        slide.addChart(pptx.ChartType.bar, chartSeries, {
          x: x + 0.1,
          y: contentY + 0.1,
          w: chartW - 0.2,
          h: chartH - 0.2,
          chartColors: chartColors.slice(0, chartData.series.length),
          barDir: isHorizontalBar ? 'bar' : 'col',
          barGrouping: 'clustered',
          barGapWidthPct: 80,
          showLegend: true,
          legendPos: 't',
          legendFontSize: 6,
          showTitle: false,
          showValue: false,
          valGridLine: { style: 'dash', color: isDark ? '334155' : 'E2E8F0' },
          catGridLine: { style: 'none' },
          catAxisLabelFontSize: 6,
          valAxisLabelFontSize: 6,
          catAxisLabelColor: mutedColor,
          valAxisLabelColor: mutedColor,
          catAxisLineShow: false,
          valAxisLineShow: false,
        });
      } else {
        slide.addChart(pptx.ChartType.line, chartSeries, {
          x: x + 0.1,
          y: contentY + 0.1,
          w: chartW - 0.2,
          h: chartH - 0.2,
          chartColors: chartColors.slice(0, chartData.series.length),
          showLegend: true,
          legendPos: 't',
          legendFontSize: 6,
          showTitle: false,
          lineSmooth: true,
          lineSize: 2,
          lineDataSymbolSize: chartData.labels.length > 10 ? 3 : 5,
          valGridLine: { style: 'dash', color: isDark ? '334155' : 'E2E8F0' },
          catGridLine: { style: 'none' },
          catAxisLabelFontSize: 6,
          valAxisLabelFontSize: 6,
          catAxisLabelColor: mutedColor,
          valAxisLabelColor: mutedColor,
          catAxisLineShow: false,
          valAxisLineShow: false,
        });
      }
    } else {
      slide.addText(fallbackLabel, {
        x,
        y: contentY,
        w: chartW,
        h: chartH,
        fontSize: 11,
        color: mutedColor,
        align: 'center',
        valign: 'middle',
        fontFace: font,
      });
    }
  };

  drawChartCard(chartAX, exportData.chartAData, 'Period A / Segment A');
  drawChartCard(chartBX, exportData.chartBData, 'Period B / Segment B');

  // === Native Insight ===
  const insightY = contentY + chartH + 0.15;
  const footerY = 5.15;
  const insightH = footerY - insightY - 0.08;

  drawSlideInsight(slide, pptx, tv, {
    x: 0.3,
    y: insightY,
    w: 9.4,
    h: insightH,
    label: 'Comparative Analysis & Notes',
    text: exportData.insightText || '',
  });

  // === Native Footer ===
  drawNativeFooter(
    slide,
    pptx,
    config,
    primaryColor,
    font,
    exportData.currentPage || 1,
    exportData.totalPages || 1,
  );
}

// ─── KPI Hybrid Export ─────────────────────────────────────────

interface KPIExportData {
  title?: string;
  channel?: string;
  metrics?: Array<{
    label: string;
    value: string;
    trend: 'up' | 'down';
    trendValue: string;
    iconId?: string;
  }>;
  chartData?: {
    type: string;
    orientation?: string;
    labels: string[];
    series: { name: string; values: number[] }[];
  } | null;
  insightText?: string;
  currentPage?: number;
  totalPages?: number;
}

/**
 * Create a KPI slide: All native elements with background from theme.
 * All elements are rendered as native editable PowerPoint objects.
 */
export function createKPINative(pptx: PptxGenJS, config: ReportConfig, exportData: KPIExportData) {
  const slide = pptx.addSlide();
  const tv = getSlideThemeVars(config);

  // Shared background + decorations + header
  drawSlideBackground(slide, pptx, config, tv);
  drawSlideDecorations(slide, pptx, tv);
  drawSlideHeader(slide, pptx, tv, exportData.title || 'KPI Overview', exportData.channel);

  // Keep local aliases for code below that still uses them
  const font = tv.font;
  const isDark = tv.isDark;
  const textColor = tv.textColor;
  const mutedColor = tv.mutedColor;
  const primaryColor = tv.primaryColor;
  const cardBg = tv.cardBg;
  const borderColor = tv.borderColor;

  // === Native Metric Scorecards ===
  const metrics = exportData.metrics || [];
  const metricCount = metrics.length || 4;
  const metricsY = 0.95;
  const metricsH = metricCount >= 6 ? 1.2 : 1.1;
  const metricsW = 9.4;
  const cardGap = metricCount >= 6 ? 0.08 : 0.15;
  const metricCardW = (metricsW - (metricCount - 1) * cardGap) / metricCount;

  metrics.forEach((metric, idx) => {
    const cardX = 0.3 + idx * (metricCardW + cardGap);

    // Metric card bg
    slide.addShape(pptx.ShapeType.roundRect, {
      x: cardX,
      y: metricsY,
      w: metricCardW,
      h: metricsH,
      fill: { color: cardBg },
      line: { color: borderColor, width: 0.75 },
      rectRadius: 0.08,
      shadow: {
        type: 'outer',
        blur: 4,
        offset: 1,
        angle: 90,
        color: '000000',
        opacity: 0.05,
      },
    });

    // Metric label — no wrap to stay on 1 line
    const labelFontSize = metricCount <= 5 ? 8 : 7;
    slide.addText(metric.label.toUpperCase(), {
      x: cardX + 0.1,
      y: metricsY + 0.12,
      w: metricCardW - 0.2,
      h: 0.2,
      fontSize: labelFontSize,
      bold: true,
      color: mutedColor,
      align: 'left',
      valign: 'top',
      fontFace: font,
      wrap: false,
    });

    // Metric value — font size scales with metric count to prevent overflow
    const valueFontSize = metricCount <= 4 ? 22 : metricCount === 5 ? 18 : 14;
    slide.addText(metric.value, {
      x: cardX + 0.1,
      y: metricsY + 0.38,
      w: metricCardW - 0.2,
      h: 0.4,
      fontSize: valueFontSize,
      bold: true,
      color: textColor,
      align: 'left',
      valign: 'middle',
      fontFace: font,
      wrap: false,
    });

    // Trend badge — width scales with card width for 5-6 metrics
    const trendColor = metric.trend === 'up' ? '10B981' : 'EF4444';
    const trendBg = metric.trend === 'up' ? 'D1FAE5' : 'FEE2E2';
    const trendArrow = metric.trend === 'up' ? '↑ ' : '↓ ';
    const badgeW = metricCount >= 6 ? 0.58 : metricCount === 5 ? 0.65 : 0.75;
    const badgeY = metricsY + 0.82;
    const badgeH = 0.18;

    slide.addShape(pptx.ShapeType.roundRect, {
      x: cardX + 0.1,
      y: badgeY,
      w: badgeW,
      h: badgeH,
      fill: { color: isDark ? trendColor : trendBg, transparency: isDark ? 85 : 0 },
      line: { type: 'none' },
      rectRadius: 0.08,
    });

    slide.addText(trendArrow + metric.trendValue, {
      x: cardX + 0.1,
      y: badgeY,
      w: badgeW,
      h: badgeH,
      fontSize: metricCount >= 6 ? 7 : 8,
      bold: true,
      color: trendColor,
      align: 'center',
      valign: 'middle',
      fontFace: font,
    });

    // Caption — side-by-side with badge, vertically centred to badge
    const captionX = cardX + 0.1 + badgeW + 0.04;
    const captionW = metricCardW - 0.2 - badgeW - 0.04;
    slide.addText('vs last period', {
      x: captionX,
      y: badgeY,
      w: captionW,
      h: badgeH,
      fontSize: metricCount >= 6 ? 6 : 7,
      color: mutedColor,
      align: 'left',
      valign: 'middle',
      fontFace: font,
      wrap: true,
    });
  });

  // === Chart + Insight Row ===
  // Chart + insight row starts below metrics
  const contentY = 2.15;
  const footerY = 5.15;
  const contentH = footerY - contentY - 0.08;

  // Chart area (flex-[2] = 2/3 width)
  const chartX = 0.3;
  const chartW = 6.1;
  const insightX = chartX + chartW + 0.15;
  const insightW = 9.7 - insightX;

  // Chart card bg (opaque cover)
  slide.addShape(pptx.ShapeType.roundRect, {
    x: chartX,
    y: contentY,
    w: chartW,
    h: contentH,
    fill: { color: cardBg },
    line: { color: borderColor, width: 0.75 },
    rectRadius: 0.08,
  });

  const cd = exportData.chartData;
  if (cd && cd.series.length > 0) {
    const chartColors = [
      '3B82F6',
      '10B981',
      'F59E0B',
      'EF4444',
      '8B5CF6',
      'EC4899',
      '06B6D4',
      'F97316',
    ];
    const isBar = cd.type === 'bar';
    const isHorizontalBar = isBar && cd.orientation !== 'vertical';

    const chartSeries = cd.series.map((s) => ({
      name: s.name,
      labels: cd.labels,
      values: s.values,
    }));

    if (cd.type === 'pie') {
      slide.addChart(pptx.ChartType.pie, chartSeries, {
        x: chartX + 0.1,
        y: contentY + 0.1,
        w: chartW - 0.2,
        h: contentH - 0.2,
        chartColors: chartColors.slice(0, cd.labels.length),
        showLegend: true,
        legendPos: 'r',
        legendFontSize: 7,
        showTitle: false,
        showPercent: true,
        dataLabelFontSize: 7,
      });
    } else if (isBar) {
      slide.addChart(pptx.ChartType.bar, chartSeries, {
        x: chartX + 0.1,
        y: contentY + 0.1,
        w: chartW - 0.2,
        h: contentH - 0.2,
        chartColors: chartColors.slice(0, cd.series.length),
        barDir: isHorizontalBar ? 'bar' : 'col',
        barGrouping: 'clustered',
        barGapWidthPct: 80,
        showLegend: true,
        legendPos: 't',
        legendFontSize: 7,
        showTitle: false,
        showValue: false,
        valGridLine: { style: 'dash', color: isDark ? '334155' : 'E2E8F0' },
        catGridLine: { style: 'none' },
        catAxisLabelFontSize: 7,
        valAxisLabelFontSize: 7,
        catAxisLabelColor: mutedColor,
        valAxisLabelColor: mutedColor,
        catAxisLineShow: false,
        valAxisLineShow: false,
      });
    } else {
      slide.addChart(pptx.ChartType.line, chartSeries, {
        x: chartX + 0.1,
        y: contentY + 0.1,
        w: chartW - 0.2,
        h: contentH - 0.2,
        chartColors: chartColors.slice(0, cd.series.length),
        showLegend: true,
        legendPos: 't',
        legendFontSize: 7,
        showTitle: false,
        lineSmooth: true,
        lineSize: 2,
        lineDataSymbolSize: cd.labels.length > 10 ? 4 : 6,
        valGridLine: { style: 'dash', color: isDark ? '334155' : 'E2E8F0' },
        catGridLine: { style: 'none' },
        catAxisLabelFontSize: 7,
        valAxisLabelFontSize: 7,
        catAxisLabelColor: mutedColor,
        valAxisLabelColor: mutedColor,
        catAxisLineShow: false,
        valAxisLineShow: false,
      });
    }
  } else {
    slide.addText('Deep Dive Analysis', {
      x: chartX,
      y: contentY,
      w: chartW,
      h: contentH,
      fontSize: 12,
      color: mutedColor,
      align: 'center',
      valign: 'middle',
      fontFace: font,
    });
  }

  // === Native Insight ===
  drawSlideInsight(slide, pptx, tv, {
    x: insightX,
    y: contentY,
    w: insightW,
    h: contentH,
    label: 'Summary & Actions',
    text: exportData.insightText || '',
  });

  // === Native Footer ===
  drawNativeFooter(
    slide,
    pptx,
    config,
    primaryColor,
    font,
    exportData.currentPage || 1,
    exportData.totalPages || 1,
  );
}

// ─── Overview Native Export ─────────────────────────────────────

interface OverviewExportData {
  title?: string;
  channel?: string;
  visualMode?: 'chart' | 'table' | null;
  chartData?: {
    type: string;
    orientation?: string;
    labels: string[];
    series: { name: string; values: number[] }[];
  } | null;
  tableHeaders?: string[];
  tableRows?: string[][];
  insightText?: string;
  currentPage?: number;
  totalPages?: number;
}

/**
 * Create an overview slide: All native elements with background from theme.
 * Visual area (chart/table) takes most space, with smaller insight area below.
 */
export function createOverviewNative(
  pptx: PptxGenJS,
  config: ReportConfig,
  exportData: OverviewExportData,
) {
  const slide = pptx.addSlide();
  const tv = getSlideThemeVars(config);

  // Shared background + decorations + header
  drawSlideBackground(slide, pptx, config, tv);
  drawSlideDecorations(slide, pptx, tv);
  drawSlideHeader(slide, pptx, tv, exportData.title || 'Overview Slide', exportData.channel);

  const font = tv.font;
  const isDark = tv.isDark;
  const textColor = tv.textColor;
  const mutedColor = tv.mutedColor;
  const cardBg = tv.cardBg;
  const borderColor = tv.borderColor;

  // === Visual Area (chart or table) ===
  const headerH = 0.55;
  const visualY = 0.3 + headerH + 0.15;
  const footerY = 5.15;
  const insightH = 1.1;
  const insightY = footerY - insightH - 0.08;
  const visualH = insightY - visualY - 0.15;

  // Visual card bg
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.3,
    y: visualY,
    w: 9.4,
    h: visualH,
    fill: { color: cardBg },
    line: { color: borderColor, width: 0.75 },
    rectRadius: 0.08,
    shadow: {
      type: 'outer',
      blur: 6,
      offset: 2,
      color: tv.primaryColor,
      opacity: isDark ? 0.1 : 0.06,
    },
  });

  if (
    exportData.visualMode === 'chart' &&
    exportData.chartData &&
    exportData.chartData.series.length > 0
  ) {
    const cd = exportData.chartData;
    const chartColors = [
      '3B82F6',
      '10B981',
      'F59E0B',
      'EF4444',
      '8B5CF6',
      'EC4899',
      '06B6D4',
      'F97316',
    ];
    const isBar = cd.type === 'bar';
    const isHorizontalBar = isBar && cd.orientation !== 'vertical';
    const chartSeries = cd.series.map((s) => ({
      name: s.name,
      labels: cd.labels,
      values: s.values,
    }));

    if (cd.type === 'pie') {
      slide.addChart(pptx.ChartType.pie, chartSeries, {
        x: 0.4,
        y: visualY + 0.1,
        w: 9.2,
        h: visualH - 0.2,
        chartColors: chartColors.slice(0, cd.labels.length),
        showLegend: true,
        legendPos: 'r',
        legendFontSize: 8,
        showTitle: false,
        showPercent: true,
        dataLabelFontSize: 8,
      });
    } else if (isBar) {
      slide.addChart(pptx.ChartType.bar, chartSeries, {
        x: 0.4,
        y: visualY + 0.1,
        w: 9.2,
        h: visualH - 0.2,
        chartColors: chartColors.slice(0, cd.series.length),
        barDir: isHorizontalBar ? 'bar' : 'col',
        barGrouping: 'clustered',
        barGapWidthPct: 80,
        showLegend: true,
        legendPos: 't',
        legendFontSize: 8,
        showTitle: false,
        showValue: false,
        valGridLine: { style: 'dash', color: isDark ? '334155' : 'E2E8F0' },
        catGridLine: { style: 'none' },
        catAxisLabelFontSize: 8,
        valAxisLabelFontSize: 8,
        catAxisLabelColor: mutedColor,
        valAxisLabelColor: mutedColor,
        catAxisLineShow: false,
        valAxisLineShow: false,
      });
    } else {
      slide.addChart(pptx.ChartType.line, chartSeries, {
        x: 0.4,
        y: visualY + 0.1,
        w: 9.2,
        h: visualH - 0.2,
        chartColors: chartColors.slice(0, cd.series.length),
        showLegend: true,
        legendPos: 't',
        legendFontSize: 8,
        showTitle: false,
        lineSmooth: true,
        lineSize: 2,
        lineDataSymbolSize: cd.labels.length > 10 ? 4 : 6,
        valGridLine: { style: 'dash', color: isDark ? '334155' : 'E2E8F0' },
        catGridLine: { style: 'none' },
        catAxisLabelFontSize: 8,
        valAxisLabelFontSize: 8,
        catAxisLabelColor: mutedColor,
        valAxisLabelColor: mutedColor,
        catAxisLineShow: false,
        valAxisLineShow: false,
      });
    }
  } else if (exportData.visualMode === 'table' && exportData.tableHeaders && exportData.tableRows) {
    const tHeaderStyle = {
      bold: true,
      fontSize: 8,
      color: mutedColor,
      fill: { color: isDark ? '0F172A' : 'F8FAFC' },
      align: 'center' as const,
      valign: 'middle' as const,
      fontFace: font,
    };
    const tCellStyle = {
      fontSize: 8,
      color: textColor,
      align: 'center' as const,
      valign: 'middle' as const,
      fontFace: font,
    };
    const tRows: any[][] = [
      exportData.tableHeaders.map((h) => ({ text: h, options: tHeaderStyle })),
    ];
    exportData.tableRows.forEach((row) => {
      tRows.push(
        row.map((v, i) => ({
          text: v,
          options: i === 0 ? { ...tCellStyle, bold: true, align: 'left' as const } : tCellStyle,
        })),
      );
    });
    const rowH = Math.min(0.35, (visualH - 0.3) / tRows.length);
    slide.addTable(tRows, {
      x: 0.4,
      y: visualY + 0.15,
      w: 9.2,
      fontSize: 8,
      border: { pt: 0.5, color: borderColor },
      align: 'center',
      valign: 'middle',
      fontFace: font,
      color: textColor,
      rowH: tRows.map(() => rowH),
    });
  } else {
    slide.addText('Visual Analysis', {
      x: 0.3,
      y: visualY,
      w: 9.4,
      h: visualH,
      fontSize: 12,
      color: mutedColor,
      align: 'center',
      valign: 'middle',
      fontFace: font,
    });
  }

  // === Insight (shared helper) ===
  drawSlideInsight(slide, pptx, tv, {
    x: 0.3,
    y: insightY,
    w: 9.4,
    h: insightH,
    label: 'Comparative Analysis & Notes',
    text: exportData.insightText || '',
  });

  // === Footer ===
  drawNativeFooter(
    slide,
    pptx,
    config,
    tv.primaryColor,
    font,
    exportData.currentPage || 1,
    exportData.totalPages || 1,
  );
}
// ─── Content Native Export ──────────────────────────────────────

export interface ContentPostExportData {
  imageBase64: string;
  postId: string;
  reach: string;
  engagement: string;
  er: string;
  filterBadge?: string; // 'top' | 'low' | ''
}

interface ContentNativeExportData {
  title?: string;
  channel?: string;
  insightText?: string;
  currentPage?: number;
  totalPages?: number;
  posts: ContentPostExportData[];
  postCount?: number;
  filterType?: string;
}

/**
 * Fully native content/creative analysis slide — no screenshot required.
 * Renders post cards with images (or placeholders), stats, insight, footer.
 */
export function createContentNative(
  pptx: PptxGenJS,
  config: ReportConfig,
  exportData: ContentNativeExportData,
) {
  const slide = pptx.addSlide();
  const tv = getSlideThemeVars(config);

  // Shared background + decorations + header
  drawSlideBackground(slide, pptx, config, tv);
  drawSlideDecorations(slide, pptx, tv);
  drawSlideHeader(slide, pptx, tv, exportData.title || 'Creative Analysis', exportData.channel, {
    headerH: 0.5,
  });

  const font = tv.font;
  const isDark = tv.isDark;
  const textColor = tv.textColor;
  const mutedColor = tv.mutedColor;
  const primaryColor = tv.primaryColor;
  const cardBg = tv.cardBg;
  const borderColor = tv.borderColor;
  const borderLightColor = isDark ? '1E293B' : 'F1F5F9';
  const headerX = 0.3;
  const headerY = 0.3;
  const headerW = 9.4;
  const headerH = 0.5;

  // ── Post Grid ──────────────────────────────────────────────────
  const posts = exportData.posts || [];
  const postCount = exportData.postCount || posts.length || 4;

  const gridX = 0.3;
  const gridY = 0.9;
  const gridW = 9.4;
  const gridH = 3.1;
  const cols = Math.min(postCount, 8);
  const gapW = postCount <= 4 ? 0.1 : postCount <= 6 ? 0.08 : 0.06;
  const cardW = (gridW - (cols - 1) * gapW) / cols;
  const cardH = gridH;

  // Image area is ~62% of card height; stats below
  const imageAreaH = parseFloat((cardH * 0.62).toFixed(3));
  const statsAreaH = parseFloat((cardH - imageAreaH).toFixed(3));

  // Font sizes scale with card width
  const fs = postCount <= 4 ? 8 : postCount <= 6 ? 6.5 : 5.5;
  const fsLabel = postCount <= 4 ? 7 : postCount <= 6 ? 5.5 : 4.5;

  posts.forEach((post, idx) => {
    if (idx >= cols) return; // safety: one row only
    const cx = gridX + idx * (cardW + gapW);
    const cy = gridY;

    // Card background
    const radius = postCount >= 6 ? 0.06 : 0.08;
    slide.addShape(pptx.ShapeType.roundRect, {
      x: cx,
      y: cy,
      w: cardW,
      h: cardH,
      fill: { color: cardBg },
      line: { color: borderColor, width: 0.5 },
      rectRadius: radius,
    });

    // Image area
    if (post.imageBase64) {
      slide.addImage({
        data: post.imageBase64,
        x: cx,
        y: cy,
        w: cardW,
        h: imageAreaH,
      });
      // overlay rounded clip illusion — draw top-rounding strip over image corners
    } else {
      // Placeholder with gentle bg
      slide.addShape(pptx.ShapeType.rect, {
        x: cx,
        y: cy,
        w: cardW,
        h: imageAreaH,
        fill: { color: isDark ? '1E293B' : 'F1F5F9' },
        line: { type: 'none' },
      });
      slide.addText('[ Image ]', {
        x: cx,
        y: cy,
        w: cardW,
        h: imageAreaH,
        fontSize: fsLabel,
        color: mutedColor,
        align: 'center',
        valign: 'middle',
        fontFace: font,
      });
    }

    // Filter badge (top or low) for mixed mode
    if (post.filterBadge === 'top' || post.filterBadge === 'low') {
      const badgeColor = post.filterBadge === 'top' ? '10B981' : 'F43F5E';
      const badgeW = postCount <= 4 ? 0.5 : 0.4;
      const badgeH = postCount <= 4 ? 0.16 : 0.13;
      slide.addShape(pptx.ShapeType.roundRect, {
        x: cx + 0.06,
        y: cy + 0.06,
        w: badgeW,
        h: badgeH,
        fill: { color: badgeColor },
        line: { type: 'none' },
        rectRadius: 0.05,
      });
      slide.addText(post.filterBadge.toUpperCase(), {
        x: cx + 0.06,
        y: cy + 0.06,
        w: badgeW,
        h: badgeH,
        fontSize: postCount <= 4 ? 5 : 4,
        bold: true,
        color: 'FFFFFF',
        align: 'center',
        valign: 'middle',
        fontFace: font,
      });
    }

    // Stats section separator
    const statsY = cy + imageAreaH;
    slide.addShape(pptx.ShapeType.line, {
      x: cx,
      y: statsY,
      w: cardW,
      h: 0,
      line: { color: borderLightColor, width: 0.5 },
    });

    // Post ID header row
    const idRowH = statsAreaH * 0.28;
    const idRowY = statsY + statsAreaH * 0.04;
    slide.addText(post.postId || `#${204 + idx}`, {
      x: cx + 0.06,
      y: idRowY,
      w: cardW - 0.12,
      h: idRowH,
      fontSize: fs,
      bold: true,
      color: textColor,
      align: 'left',
      valign: 'middle',
      fontFace: font,
    });

    // Divider under ID
    const dividerY = statsY + idRowH + statsAreaH * 0.06;
    slide.addShape(pptx.ShapeType.line, {
      x: cx + 0.06,
      y: dividerY,
      w: cardW - 0.12,
      h: 0,
      line: { color: borderLightColor, width: 0.4 },
    });

    // Three stat rows: Reach, Engagement, ER
    const statsStartY = dividerY + 0.04;
    const statRowH = (statsY + statsAreaH - 0.06 - statsStartY) / 3;

    const statRows = [
      { label: postCount <= 4 ? 'Reach' : 'Rch', value: post.reach, color: textColor },
      { label: postCount <= 4 ? 'Engagement' : 'Eng', value: post.engagement, color: textColor },
      {
        label: postCount <= 4 ? 'Eng. Rate' : 'ER',
        value: post.er,
        color: post.er && parseFloat(post.er) > 2.5 ? '10B981' : 'F59E0B',
      },
    ];

    statRows.forEach((row, ri) => {
      const ry = statsStartY + ri * statRowH;
      slide.addText(row.label, {
        x: cx + 0.06,
        y: ry,
        w: cardW * 0.52,
        h: statRowH,
        fontSize: fsLabel,
        color: mutedColor,
        align: 'left',
        valign: 'middle',
        fontFace: font,
      });
      slide.addText(row.value || '-', {
        x: cx + cardW * 0.48,
        y: ry,
        w: cardW * 0.46,
        h: statRowH,
        fontSize: fsLabel,
        bold: ri === 2, // bold ER
        color: row.color,
        align: 'right',
        valign: 'middle',
        fontFace: font,
      });
    });
  });

  // ── Insight Panel (shared helper) ─────────────────────────────
  const footerY = 5.15;
  const insightH = 0.95;
  const insightY = footerY - insightH - 0.08;

  drawSlideInsight(slide, pptx, tv, {
    x: headerX,
    y: insightY,
    w: headerW,
    h: insightH,
    label: 'Visual Strategy Notes & Insights',
    text: exportData.insightText || '',
  });

  // ── Footer ─────────────────────────────────────────────────────
  drawNativeFooter(
    slide,
    pptx,
    config,
    primaryColor,
    font,
    exportData.currentPage || 1,
    exportData.totalPages || 1,
  );
}

// Create layout comparison slide
export function createLayoutComparison(pptx: PptxGenJS, config: ReportConfig, title: string) {
  const slide = pptx.addSlide();
  slide.background = { color: 'FFFFFF' };

  // Header
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 10,
    h: 0.7,
    fill: { color: 'F9FAFB' },
    line: { type: 'none' },
  });

  slide.addText(title, {
    x: 0.4,
    y: 0.2,
    w: 9,
    h: 0.3,
    fontSize: 22,
    bold: true,
    color: '1F2937',
    valign: 'middle',
  });

  // Left side - Platform A
  slide.addText('Platform A', {
    x: 0.4,
    y: 0.95,
    w: 4.5,
    h: 0.3,
    fontSize: 16,
    bold: true,
    color: '3B82F6',
  });

  const metricsA = [
    { label: 'Reach', value: '25M' },
    { label: 'Engagement', value: '1.5M' },
    { label: 'Growth', value: '+8%' },
  ];

  metricsA.forEach((metric, idx) => {
    slide.addText(`${metric.label}: ${metric.value}`, {
      x: 0.6,
      y: 1.4 + idx * 0.3,
      w: 4,
      h: 0.25,
      fontSize: 12,
      color: '374151',
    });
  });

  // Right side - Platform B
  slide.addText('Platform B', {
    x: 5.2,
    y: 0.95,
    w: 4.5,
    h: 0.3,
    fontSize: 16,
    bold: true,
    color: '8B5CF6',
  });

  const metricsB = [
    { label: 'Reach', value: '20M' },
    { label: 'Engagement', value: '1.3M' },
    { label: 'Growth', value: '+5%' },
  ];

  metricsB.forEach((metric, idx) => {
    slide.addText(`${metric.label}: ${metric.value}`, {
      x: 5.4,
      y: 1.4 + idx * 0.3,
      w: 4,
      h: 0.25,
      fontSize: 12,
      color: '374151',
    });
  });

  // Comparison chart
  slide.addText('Side-by-Side Comparison', {
    x: 0.4,
    y: 2.6,
    w: 9,
    h: 0.25,
    fontSize: 14,
    bold: true,
    color: '1F2937',
  });

  const chartColors = getChartColors(config);

  slide.addChart(
    pptx.ChartType.bar,
    [
      {
        name: 'Platform A',
        labels: ['Reach (M)', 'Engagement (M)', 'Growth (%)'],
        values: [25, 1.5, 8],
      },
      {
        name: 'Platform B',
        labels: ['Reach (M)', 'Engagement (M)', 'Growth (%)'],
        values: [20, 1.3, 5],
      },
    ],
    {
      x: 0.4,
      y: 3,
      w: 9.2,
      h: 2.5,
      chartColors: [chartColors[0], chartColors[1]],
      showLegend: true,
      showTitle: false,
      barGrouping: 'clustered',
      catAxisLabelFontSize: 11,
      valAxisLabelFontSize: 11,
    },
  );
}

// Create layout KPI slide
export function createLayoutKPI(pptx: PptxGenJS, config: ReportConfig, title: string) {
  const slide = pptx.addSlide();
  slide.background = { color: 'FFFFFF' };

  // Header
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 10,
    h: 0.7,
    fill: { color: 'F9FAFB' },
    line: { type: 'none' },
  });

  slide.addText(title, {
    x: 0.4,
    y: 0.2,
    w: 9,
    h: 0.3,
    fontSize: 22,
    bold: true,
    color: '1F2937',
    valign: 'middle',
  });

  // Large KPI cards
  const kpis = [
    { label: 'TOTAL REACH', value: '45.2M', icon: '📊', color: '3B82F6' },
    { label: 'ENGAGEMENT RATE', value: '6.2%', icon: '💡', color: '10B981' },
    { label: 'NEW FOLLOWERS', value: '125K', icon: '👥', color: 'EC4899' },
    { label: 'POST FREQUENCY', value: '3.5/day', icon: '📅', color: 'F59E0B' },
  ];

  kpis.forEach((kpi, idx) => {
    const row = Math.floor(idx / 2);
    const col = idx % 2;
    const xPos = 0.4 + col * 4.9;
    const yPos = 1 + row * 2.1;

    // Card
    slide.addShape(pptx.ShapeType.roundRect, {
      x: xPos,
      y: yPos,
      w: 4.6,
      h: 1.8,
      fill: { color: 'FFFFFF' },
      line: { color: 'E5E7EB', width: 1 },
      shadow: {
        type: 'outer',
        blur: 4,
        offset: 2,
        angle: 90,
        color: '000000',
        opacity: 0.1,
      },
    });

    // Icon
    slide.addText(kpi.icon, {
      x: xPos + 0.3,
      y: yPos + 0.3,
      w: 0.5,
      h: 0.5,
      fontSize: 28,
    });

    // Label
    slide.addText(kpi.label, {
      x: xPos + 0.3,
      y: yPos + 0.9,
      w: 4,
      h: 0.2,
      fontSize: 10,
      color: '6B7280',
      bold: true,
    });

    // Value
    slide.addText(kpi.value, {
      x: xPos + 0.3,
      y: yPos + 1.15,
      w: 4,
      h: 0.4,
      fontSize: 32,
      color: kpi.color,
      bold: true,
    });
  });
}

// Create layout content slide
export function createLayoutContent(pptx: PptxGenJS, config: ReportConfig, title: string) {
  const slide = pptx.addSlide();
  slide.background = { color: 'FFFFFF' };

  // Header
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 10,
    h: 0.7,
    fill: { color: 'F9FAFB' },
    line: { type: 'none' },
  });

  slide.addText(title, {
    x: 0.4,
    y: 0.2,
    w: 9,
    h: 0.3,
    fontSize: 22,
    bold: true,
    color: '1F2937',
    valign: 'middle',
  });

  // Content area (left side - would be media/screenshot in real case)
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.4,
    y: 1,
    w: 4.5,
    h: 4.5,
    fill: { color: 'F9FAFB' },
    line: { color: 'E5E7EB', width: 1 },
  });

  slide.addText('📸', {
    x: 0.4,
    y: 2.5,
    w: 4.5,
    h: 1,
    fontSize: 48,
    align: 'center',
    valign: 'middle',
  });

  slide.addText('Media Content Area', {
    x: 0.4,
    y: 3.5,
    w: 4.5,
    h: 0.3,
    fontSize: 12,
    color: '6B7280',
    align: 'center',
  });

  // Analysis area (right side)
  slide.addText('Key Insights', {
    x: 5.2,
    y: 1,
    w: 4.4,
    h: 0.3,
    fontSize: 16,
    bold: true,
    color: '1F2937',
  });

  const insights = [
    '• Strong visual engagement with carousel posts',
    '• Peak posting time: 7-9 PM',
    '• Video content performs 2.5x better',
    '• User-generated content drives 40% more engagement',
    '• Stories see highest completion rate at 85%',
  ];

  insights.forEach((insight, idx) => {
    slide.addText(insight, {
      x: 5.2,
      y: 1.5 + idx * 0.45,
      w: 4.4,
      h: 0.4,
      fontSize: 11,
      color: '374151',
    });
  });

  // Performance metrics box
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 5.2,
    y: 3.8,
    w: 4.4,
    h: 1.7,
    fill: { color: 'DBEAFE' },
    line: { type: 'none' },
  });

  slide.addText('Content Performance', {
    x: 5.4,
    y: 4,
    w: 4,
    h: 0.25,
    fontSize: 12,
    bold: true,
    color: '1E40AF',
  });

  const metrics = [
    { label: 'Avg. Engagement', value: '15.2K' },
    { label: 'Reach per Post', value: '250K' },
    { label: 'Save Rate', value: '8.5%' },
  ];

  metrics.forEach((metric, idx) => {
    slide.addText(`${metric.label}: ${metric.value}`, {
      x: 5.4,
      y: 4.4 + idx * 0.3,
      w: 4,
      h: 0.25,
      fontSize: 10,
      color: '1E40AF',
    });
  });
}

// Create layout custom slide
export function createLayoutCustom(pptx: PptxGenJS, config: ReportConfig, title: string) {
  const slide = pptx.addSlide();
  slide.background = { color: 'FFFFFF' };

  // Header
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 10,
    h: 0.7,
    fill: { color: 'F9FAFB' },
    line: { type: 'none' },
  });

  slide.addText(title, {
    x: 0.4,
    y: 0.2,
    w: 9,
    h: 0.3,
    fontSize: 22,
    bold: true,
    color: '1F2937',
    valign: 'middle',
  });

  // Grid placeholder
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.4,
    y: 1,
    w: 9.2,
    h: 4.5,
    fill: { color: 'F9FAFB' },
    line: { color: 'E5E7EB', width: 1 },
  });

  slide.addText('Custom Grid Layout', {
    x: 0.4,
    y: 2.8,
    w: 9.2,
    h: 0.4,
    fontSize: 16,
    color: '6B7280',
    align: 'center',
    valign: 'middle',
  });
}

// ─── InnerCircle Native / Hybrid Export Functions ────────────────────────────
// Matches design of AllChannelOverviewSlide, AllChannelSentimentSlide,
// ChannelSentimentSlide — same layout helpers as other native slides.

const IC_POSITIVE = '27AE60';
const IC_NEUTRAL = '95A5A6';
const IC_NEGATIVE = 'E74C3C';

// ── ic_all_overview ──────────────────────────────────────────────────────────
interface IcTableMetricCell {
  base: string;
  pct: string;
  positive: boolean | null; // true = green, false = red, null = muted
}
type IcTableCell = string | IcTableMetricCell;

interface IcAllOverviewExportData {
  tableHeaders: string[];
  tableRows: IcTableCell[][];
  insightText: string;
  currentPage: number;
  totalPages: number;
}

export function createIcAllOverviewNative(
  pptx: PptxGenJS,
  config: ReportConfig,
  data: IcAllOverviewExportData,
) {
  const slide = pptx.addSlide();
  const tv = getSlideThemeVars(config);

  drawSlideBackground(slide, pptx, config, tv);
  drawSlideDecorations(slide, pptx, tv);
  drawSlideHeader(slide, pptx, tv, `${config.clientName} — All Channel Overview`, undefined, {
    subtitle: `${config.period} Report`,
    logoData: config.coverDesign?.logoData,
  });

  const { font, isDark, textColor, mutedColor, cardBg, borderColor, primaryColor } = tv;

  // ── Performance Table card ──────────────────────────────────────────────
  const tblX = 0.3;
  const tblY = 0.97;
  const tblW = 9.4;
  const tblH = 2.35;

  slide.addShape(pptx.ShapeType.roundRect, {
    x: tblX,
    y: tblY,
    w: tblW,
    h: tblH,
    fill: { color: cardBg },
    line: { color: borderColor, width: 0.75 },
    rectRadius: 0.08,
    shadow: { type: 'outer', blur: 4, offset: 1, color: '000000', opacity: 0.05 },
  });
  // Top accent strip
  slide.addShape(pptx.ShapeType.rect, {
    x: tblX,
    y: tblY,
    w: tblW,
    h: 0.03,
    fill: { color: primaryColor },
    line: { type: 'none' },
  });

  if (data.tableRows.length > 0) {
    const colCount = data.tableHeaders.length || 7;
    const chW = 1.4;
    const otherW = (tblW - chW - 0.1) / (colCount - 1);
    const colWidths = [chW, ...Array(colCount - 1).fill(otherW)];
    const rowH = (tblH - 0.12) / (data.tableRows.length + 1);

    const headerRow = data.tableHeaders.map((h, ci) => ({
      text: h,
      options: {
        bold: true,
        fontSize: 8,
        color: mutedColor,
        fontFace: font,
        align: (ci === 0 ? 'left' : 'center') as 'left' | 'center',
        fill: { color: isDark ? '1E293B' : 'F1F5F9' },
      },
    }));

    const dataRows = data.tableRows.map((row, ri) =>
      row.map((cell, ci) => {
        const rowFill = { color: ri % 2 === 0 ? cardBg : isDark ? '1A2535' : 'F8FAFC' };
        const baseAlign = (ci === 0 ? 'left' : 'center') as 'left' | 'center';
        if (typeof cell === 'object' && 'base' in cell) {
          // Metric cell: base value on line 1, colored +/- percentage on line 2
          const pctColor =
            cell.positive === true ? '15803D' : cell.positive === false ? 'B91C1C' : '94A3B8';
          type TP = { text: string; options: Record<string, unknown> };
          const richText: TP[] = [
            {
              text: cell.base,
              options: { fontSize: 9, bold: true, color: textColor, breakLine: true },
            },
          ];
          if (cell.pct) {
            richText.push({
              text: cell.pct,
              options: { fontSize: 7, bold: true, color: pctColor },
            });
          }
          return {
            text: richText,
            options: {
              fontFace: font,
              align: 'center' as const,
              valign: 'middle' as const,
              fill: rowFill,
            },
          };
        }
        return {
          text: cell as string,
          options: {
            fontSize: 9,
            color: textColor,
            fontFace: font,
            align: baseAlign,
            valign: 'middle' as const,
            fill: rowFill,
          },
        };
      }),
    );

    slide.addTable([headerRow, ...dataRows], {
      x: tblX + 0.05,
      y: tblY + 0.06,
      w: tblW - 0.1,
      h: tblH - 0.08,
      colW: colWidths,
      rowH,
      border: { type: 'solid', color: borderColor, pt: 0.4 },
      fontFace: font,
    });
  }

  // ── Analysis / Insight card ──────────────────────────────────────────────
  const insY = tblY + tblH + 0.12;
  const insH = 5.1 - insY - 0.05;
  drawSlideInsight(slide, pptx, tv, {
    x: tblX,
    y: insY,
    w: tblW,
    h: insH,
    label: 'Analysis',
    text: data.insightText,
  });

  drawNativeFooter(slide, pptx, config, primaryColor, font, data.currentPage, data.totalPages);
}

// ── ic_all_sentiment ─────────────────────────────────────────────────────────
interface IcAllSentimentExportData {
  chartData: ReturnType<typeof extractChartInfo>;
  wcImage: string; // base64 PNG of the combined wordcloud panel
  totals: { positive_pct: number; neutral_pct: number; negative_pct: number } | null;
  currentPage: number;
  totalPages: number;
}

export function createIcAllSentimentHybrid(
  pptx: PptxGenJS,
  config: ReportConfig,
  data: IcAllSentimentExportData,
) {
  const slide = pptx.addSlide();
  const tv = getSlideThemeVars(config);

  drawSlideBackground(slide, pptx, config, tv);
  drawSlideDecorations(slide, pptx, tv);
  drawSlideHeader(slide, pptx, tv, `${config.clientName} — All Channel Sentiment`, undefined, {
    subtitle: `${config.period} Report`,
    logoData: config.coverDesign?.logoData,
  });

  const { font, isDark, mutedColor, cardBg, borderColor, primaryColor } = tv;

  // ── Line Chart card (full width) ────────────────────────────────────────
  const chartX = 0.3;
  const chartY = 0.97;
  const chartW = 9.4;
  const chartH = 2.3;

  slide.addShape(pptx.ShapeType.roundRect, {
    x: chartX,
    y: chartY,
    w: chartW,
    h: chartH,
    fill: { color: cardBg },
    line: { color: borderColor, width: 0.75 },
    rectRadius: 0.08,
    shadow: { type: 'outer', blur: 4, offset: 1, color: '000000', opacity: 0.05 },
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: chartX,
    y: chartY,
    w: chartW,
    h: 0.03,
    fill: { color: primaryColor },
    line: { type: 'none' },
  });
  slide.addText('Daily Mentions by Sentiment (All Channels)', {
    x: chartX + 0.15,
    y: chartY + 0.06,
    w: chartW - 0.3,
    h: 0.22,
    fontSize: 9,
    bold: true,
    color: isDark ? 'CBD5E1' : '334155',
    align: 'center',
    fontFace: font,
  });

  const cd = data.chartData;
  if (cd && cd.series.length > 0) {
    slide.addChart(
      pptx.ChartType.line,
      cd.series.map((s) => ({
        name: s.name,
        labels: cd.labels,
        values: s.values,
      })),
      {
        x: chartX + 0.1,
        y: chartY + 0.3,
        w: chartW - 0.2,
        h: chartH - 0.38,
        chartColors: [IC_POSITIVE, IC_NEUTRAL, IC_NEGATIVE],
        showLegend: true,
        legendPos: 't',
        legendFontSize: 8,
        showTitle: false,
        lineSmooth: false,
        lineSize: 2,
        lineDataSymbolSize: cd.labels.length > 15 ? 4 : 6,
        valGridLine: { style: 'dash', color: isDark ? '334155' : 'E2E8F0' },
        catGridLine: { style: 'none' },
        catAxisLabelFontSize: 7,
        valAxisLabelFontSize: 7,
        catAxisLabelColor: mutedColor,
        valAxisLabelColor: mutedColor,
        catAxisLineShow: false,
        valAxisLineShow: false,
      },
    );
  }

  // ── Bottom row ───────────────────────────────────────────────────────────
  const botY = chartY + chartH + 0.12;
  const botH = 5.1 - botY - 0.05;

  // Wordcloud screenshot
  const wcW = 4.1;
  if (data.wcImage) {
    slide.addShape(pptx.ShapeType.roundRect, {
      x: chartX,
      y: botY,
      w: wcW,
      h: botH,
      fill: { color: 'FFFFFF' },
      line: { color: borderColor, width: 0.75 },
      rectRadius: 0.08,
    });
    slide.addText('Wordcloud Keywords All Sentiment', {
      x: chartX + 0.1,
      y: botY + 0.06,
      w: wcW - 0.2,
      h: 0.2,
      fontSize: 8,
      bold: true,
      color: '475569',
      align: 'center',
      fontFace: font,
    });
    slide.addImage({
      data: data.wcImage,
      x: chartX + 0.08,
      y: botY + 0.3,
      w: wcW - 0.16,
      h: botH - 0.36,
      sizing: { type: 'contain', w: wcW - 0.16, h: botH - 0.36 },
    });
  }

  // 3 Sentiment % boxes
  if (data.totals) {
    const sentiments = [
      {
        label: 'POSITIVE',
        pct: data.totals.positive_pct,
        color: IC_POSITIVE,
        desc: 'Strong interest & appreciation',
      },
      {
        label: 'NEUTRAL',
        pct: data.totals.neutral_pct,
        color: IC_NEUTRAL,
        desc: 'Questions or general discussion',
      },
      {
        label: 'NEGATIVE',
        pct: data.totals.negative_pct,
        color: IC_NEGATIVE,
        desc: 'Concerns or dissatisfaction',
      },
    ];
    const boxGap = 0.1;
    const totalBoxW = 9.7 - (chartX + wcW + 0.1);
    const boxW = (totalBoxW - boxGap * 2) / 3;
    let boxX = chartX + wcW + 0.1;

    sentiments.forEach(({ label, pct, color, desc }) => {
      // Header bar
      slide.addShape(pptx.ShapeType.roundRect, {
        x: boxX,
        y: botY,
        w: boxW,
        h: 0.3,
        fill: { color },
        line: { type: 'none' },
        rectRadius: 0.06,
      });
      slide.addText(label, {
        x: boxX,
        y: botY + 0.03,
        w: boxW,
        h: 0.24,
        fontSize: 8,
        bold: true,
        color: 'FFFFFF',
        align: 'center',
        fontFace: font,
      });
      // Body
      slide.addShape(pptx.ShapeType.roundRect, {
        x: boxX,
        y: botY + 0.28,
        w: boxW,
        h: botH - 0.28,
        fill: { color },
        line: { type: 'none' },
        rectRadius: 0.06,
      });
      slide.addText(`${pct.toFixed(1)}%`, {
        x: boxX,
        y: botY + 0.35,
        w: boxW,
        h: botH * 0.45,
        fontSize: 24,
        bold: true,
        color: 'FFFFFF',
        align: 'center',
        valign: 'middle',
        fontFace: font,
      });
      slide.addText(desc, {
        x: boxX + 0.06,
        y: botY + botH * 0.68,
        w: boxW - 0.12,
        h: botH * 0.28,
        fontSize: 7,
        color: 'FFFFFFCC',
        align: 'center',
        valign: 'top',
        fontFace: font,
        wrap: true,
      });
      boxX += boxW + boxGap;
    });
  }

  drawNativeFooter(slide, pptx, config, primaryColor, font, data.currentPage, data.totalPages);
}

// ── ic_ig/tt/fb_sentiment ────────────────────────────────────────────────────
interface IcChannelSentimentExportData {
  platform: string; // 'Instagram' | 'TikTok' | 'Facebook'
  platformColor: string; // e.g. 'E1306C'
  chartData: ReturnType<typeof extractChartInfo>;
  wcNeutral: string; // base64 PNG
  wcPositive: string;
  wcNegative: string;
  currentPage: number;
  totalPages: number;
}

export function createIcChannelSentimentHybrid(
  pptx: PptxGenJS,
  config: ReportConfig,
  data: IcChannelSentimentExportData,
) {
  const slide = pptx.addSlide();
  const tv = getSlideThemeVars(config);

  drawSlideBackground(slide, pptx, config, tv);
  drawSlideDecorations(slide, pptx, tv);
  drawSlideHeader(
    slide,
    pptx,
    tv,
    `${config.clientName} — ${data.platform} Sentiment`,
    data.platform.toLowerCase(),
    {
      subtitle: `${config.period} Report`,
    },
  );

  const { font, isDark, mutedColor, cardBg, borderColor, primaryColor } = tv;

  // Platform badge (colored pill — kept for visual accent below header)
  // ── Line Chart card ──────────────────────────────────────────────────────
  const chartX = 0.3;
  const chartY = 0.97;
  const chartW = 9.4;
  const chartH = 2.3;

  slide.addShape(pptx.ShapeType.roundRect, {
    x: chartX,
    y: chartY,
    w: chartW,
    h: chartH,
    fill: { color: cardBg },
    line: { color: borderColor, width: 0.75 },
    rectRadius: 0.08,
    shadow: { type: 'outer', blur: 4, offset: 1, color: '000000', opacity: 0.05 },
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: chartX,
    y: chartY,
    w: chartW,
    h: 0.03,
    fill: { color: primaryColor },
    line: { type: 'none' },
  });
  slide.addText(`Daily Sentiment Trend — ${data.platform}`, {
    x: chartX + 0.15,
    y: chartY + 0.06,
    w: chartW - 0.3,
    h: 0.22,
    fontSize: 9,
    bold: true,
    color: isDark ? 'CBD5E1' : '334155',
    align: 'center',
    fontFace: font,
  });

  const cd = data.chartData;
  if (cd && cd.series.length > 0) {
    slide.addChart(
      pptx.ChartType.line,
      cd.series.map((s) => ({
        name: s.name,
        labels: cd.labels,
        values: s.values,
      })),
      {
        x: chartX + 0.1,
        y: chartY + 0.3,
        w: chartW - 0.2,
        h: chartH - 0.38,
        chartColors: [IC_POSITIVE, IC_NEUTRAL, IC_NEGATIVE],
        showLegend: true,
        legendPos: 't',
        legendFontSize: 8,
        showTitle: false,
        lineSmooth: false,
        lineSize: 2,
        lineDataSymbolSize: cd.labels.length > 15 ? 4 : 6,
        valGridLine: { style: 'dash', color: isDark ? '334155' : 'E2E8F0' },
        catGridLine: { style: 'none' },
        catAxisLabelFontSize: 7,
        valAxisLabelFontSize: 7,
        catAxisLabelColor: mutedColor,
        valAxisLabelColor: mutedColor,
        catAxisLineShow: false,
        valAxisLineShow: false,
      },
    );
  }

  // ── Bottom row: 3 equal wordcloud panels ────────────────────────────────
  const botY = chartY + chartH + 0.12;
  const botH = 5.1 - botY - 0.05;
  const panelGap = 0.12;
  const panelW = (9.4 - panelGap * 2) / 3;

  const wcPanels = [
    { img: data.wcNeutral, color: '7F8C8D', label: `Neutral WordCloud — ${data.platform}` },
    { img: data.wcPositive, color: IC_POSITIVE, label: `Positive WordCloud — ${data.platform}` },
    { img: data.wcNegative, color: 'C0392B', label: `Negative WordCloud — ${data.platform}` },
  ];

  wcPanels.forEach(({ img, color, label }, idx) => {
    const panelX = 0.3 + idx * (panelW + panelGap);

    slide.addShape(pptx.ShapeType.roundRect, {
      x: panelX,
      y: botY,
      w: panelW,
      h: botH,
      fill: { color: 'FFFFFF' },
      line: { color: borderColor, width: 0.75 },
      rectRadius: 0.08,
    });
    // Title in sentiment color
    slide.addText(label.toUpperCase(), {
      x: panelX + 0.08,
      y: botY + 0.06,
      w: panelW - 0.16,
      h: 0.2,
      fontSize: 7,
      bold: true,
      color,
      align: 'center',
      fontFace: font,
    });
    if (img) {
      slide.addImage({
        data: img,
        x: panelX + 0.06,
        y: botY + 0.3,
        w: panelW - 0.12,
        h: botH - 0.36,
        sizing: { type: 'contain', w: panelW - 0.12, h: botH - 0.36 },
      });
    }
  });

  drawNativeFooter(slide, pptx, config, primaryColor, font, data.currentPage, data.totalPages);
}

// ── ic_ig_growth ─────────────────────────────────────────────────────────────
interface IcIgGrowthExportData {
  chartData: ReturnType<typeof extractChartInfo>;
  tableHeaders: string[];
  tableRows: string[][];
  insightText: string;
  currentPage: number;
  totalPages: number;
}

export function createIcIgGrowthNative(
  pptx: PptxGenJS,
  config: ReportConfig,
  data: IcIgGrowthExportData,
) {
  const slide = pptx.addSlide();
  const tv = getSlideThemeVars(config);

  drawSlideBackground(slide, pptx, config, tv);
  drawSlideDecorations(slide, pptx, tv);
  drawSlideHeader(slide, pptx, tv, `${config.clientName} — Instagram Growth`, 'instagram', {
    subtitle: `${config.period} Report`,
  });

  const { font, isDark, textColor, mutedColor, cardBg, borderColor, primaryColor } = tv;

  // ── Top row: Chart left (63%) + Analysis right (37%) ─────────────────────
  const rowX = 0.3;
  const rowY = 0.97;
  const rowW = 9.4;
  const rowH = 2.9; // taller chart area
  const gap = 0.12;
  const chartW = Math.round(rowW * 0.63 * 100) / 100;
  const analysisX = rowX + chartW + gap;
  const analysisW = rowW - chartW - gap;

  // Chart card
  slide.addShape(pptx.ShapeType.roundRect, {
    x: rowX,
    y: rowY,
    w: chartW,
    h: rowH,
    fill: { color: cardBg },
    line: { color: borderColor, width: 0.75 },
    rectRadius: 0.08,
    shadow: { type: 'outer', blur: 4, offset: 1, color: '000000', opacity: 0.05 },
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: rowX,
    y: rowY,
    w: chartW,
    h: 0.03,
    fill: { color: primaryColor },
    line: { type: 'none' },
  });

  const cd = data.chartData;
  if (cd && cd.series.length > 0) {
    const symSize = cd.labels.length > 15 ? 3 : 5;
    // 2 stacked charts — equal height split with small gap
    const labelH = 0.13;
    const subGap = 0.05;
    const totalUsable = rowH - 0.1 - 2 * labelH - subGap;
    const subH = totalUsable / 2;

    const commonOpts = {
      showLegend: false,
      showTitle: false,
      lineSmooth: false,
      lineSize: 1.5,
      lineDataSymbolSize: symSize,
      valGridLine: { style: 'dash' as const, color: isDark ? '334155' : 'E2E8F0' },
      catGridLine: { style: 'none' as const },
      catAxisLabelFontSize: 6,
      valAxisLabelFontSize: 6,
      catAxisLabelColor: mutedColor,
      valAxisLabelColor: mutedColor,
      catAxisLineShow: false,
      valAxisLineShow: false,
      valAxisMinVal: 0,
      valAxisNumFmt: '#,##0',
    };

    // ── Chart 1: Followers Growth (top) ──
    const c1Y = rowY + 0.08;
    slide.addText('Followers Growth', {
      x: rowX + 0.1,
      y: c1Y,
      w: chartW - 0.2,
      h: labelH,
      fontSize: 6,
      bold: true,
      color: isDark ? 'CBD5E1' : '475569',
      fontFace: font,
    });
    if (cd.series[0]) {
      slide.addChart(
        pptx.ChartType.line,
        [{ name: cd.series[0].name, labels: cd.labels, values: cd.series[0].values }],
        {
          ...commonOpts,
          chartColors: ['E67E22'],
          x: rowX + 0.05,
          y: c1Y + labelH,
          w: chartW - 0.1,
          h: subH,
        },
      );
    }

    // ── Chart 2: Profile Reach (bottom) ──
    const c2Y = c1Y + labelH + subH + subGap;
    slide.addText('Profile Reach', {
      x: rowX + 0.1,
      y: c2Y,
      w: chartW - 0.2,
      h: labelH,
      fontSize: 6,
      bold: true,
      color: isDark ? 'CBD5E1' : '475569',
      fontFace: font,
    });
    if (cd.series[1]) {
      slide.addChart(
        pptx.ChartType.line,
        [{ name: cd.series[1].name, labels: cd.labels, values: cd.series[1].values }],
        {
          ...commonOpts,
          chartColors: ['3B82F6'],
          x: rowX + 0.05,
          y: c2Y + labelH,
          w: chartW - 0.1,
          h: subH,
        },
      );
    }
  }

  // Analysis card
  drawSlideInsight(slide, pptx, tv, {
    x: analysisX,
    y: rowY,
    w: analysisW,
    h: rowH,
    label: 'Analysis',
    text: data.insightText,
  });

  // ── Full-width Table ──────────────────────────────────────────────────────
  const tblY = rowY + rowH + 0.1;
  const tblH = 5.1 - tblY - 0.05;

  slide.addShape(pptx.ShapeType.roundRect, {
    x: rowX,
    y: tblY,
    w: rowW,
    h: tblH,
    fill: { color: cardBg },
    line: { color: borderColor, width: 0.75 },
    rectRadius: 0.08,
    shadow: { type: 'outer', blur: 4, offset: 1, color: '000000', opacity: 0.05 },
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: rowX,
    y: tblY,
    w: rowW,
    h: 0.03,
    fill: { color: primaryColor },
    line: { type: 'none' },
  });

  if (data.tableRows.length > 0) {
    const colCount = data.tableHeaders.length || 12;
    const monthColW = 0.95;
    const otherColW = (rowW - monthColW - 0.1) / (colCount - 1);
    const colWidths = [monthColW, ...Array(colCount - 1).fill(otherColW)];
    const rowH_tbl = (tblH - 0.1) / (data.tableRows.length + 1);

    const headerRow = data.tableHeaders.map((h, ci) => ({
      text: h,
      options: {
        bold: true,
        fontSize: 6,
        color: 'FFFFFF',
        fontFace: font,
        align: (ci === 0 ? 'left' : 'center') as 'left' | 'center',
        fill: { color: primaryColor },
      },
    }));

    const dataRows = data.tableRows.map((row, ri) => {
      const isGap = row[0]?.toLowerCase().includes('gap');
      return row.map((cell, ci) => {
        let cellColor = textColor;
        if (isGap && ci > 0) {
          if (cell.startsWith('-')) cellColor = 'EF4444';
          else if (cell === '0' || cell === '0.00%') cellColor = '94A3B8';
          else cellColor = '10B981';
        }
        return {
          text: cell,
          options: {
            fontSize: 7,
            color: cellColor,
            fontFace: font,
            align: (ci === 0 ? 'left' : 'center') as 'left' | 'center',
            bold: isGap || ci === 0,
            fill: {
              color: isGap
                ? isDark
                  ? '1A2535'
                  : 'F1F5F9'
                : ri % 2 === 0
                  ? cardBg
                  : isDark
                    ? '1A2535'
                    : 'F8FAFC',
            },
          },
        };
      });
    });

    slide.addTable([headerRow, ...dataRows], {
      x: rowX + 0.05,
      y: tblY + 0.06,
      w: rowW - 0.1,
      h: tblH - 0.09,
      colW: colWidths,
      rowH: rowH_tbl,
      border: { type: 'solid', color: borderColor, pt: 0.4 },
      fontFace: font,
    });
  }

  drawNativeFooter(slide, pptx, config, primaryColor, font, data.currentPage, data.totalPages);
}

// ── ic_ig_best_least ──────────────────────────────────────────────────────────
interface IcPostCard {
  follows: number | null;
  reach: number | null;
  engagement: number | null;
  engagement_rate: number | null;
  url: string | null;
  image_url: string | null; // base64 data URI pre-fetched by exportHelpers
}

interface IcIgBestLeastExportData {
  best: IcPostCard[];
  least: IcPostCard[];
  bestAnalysis: string;
  leastAnalysis: string;
  currentPage: number;
  totalPages: number;
}

// ── TikTok export interfaces ───────────────────────────────────────────────

interface IcTtGrowthExportData {
  chartData: { date: string; net_growth: number; profile_views: number; video_views: number }[];
  tableRows: {
    month: string;
    post_count: string;
    profile_views: string;
    followers_growth: string;
    reach: string;
    views: string;
    engagement: string;
    avg_watch_time: string;
  }[];
  insight: string;
  currentPage: number;
  totalPages: number;
}

interface IcTtPost {
  views: number | null;
  engagement: number | null;
  vr_rate: number | null;
  url: string | null;
  image_url?: string | null;
}

interface IcTtBestLeastExportData {
  highest: IcTtPost[];
  lowest: IcTtPost[];
  bestAllTime: IcTtPost | null;
  insight: string;
  mode: 'organic' | 'paid';
  currentPage: number;
  totalPages: number;
}

interface IcTtPillarPost {
  post_date: string | null;
  vr_rate: number | null;
  views: number | null;
  engagement: number | null;
  avg_watch_time: number | null;
  url: string | null;
  image_url?: string | null;
}

interface IcTtContentPillarExportData {
  pillars: { pillar: string; posts: IcTtPillarPost[]; insight: string }[];
  currentPage: number;
  totalPages: number;
}

function fmtNative(v: number | null | undefined): string {
  if (v === null || v === undefined) return '-';
  const n = Number(v);
  if (isNaN(n)) return '-';
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

function fmtERNative(v: number | null | undefined): string {
  if (v === null || v === undefined) return '-';
  const n = Number(v);
  if (isNaN(n)) return '-';
  const pct = Math.abs(n) <= 1 ? n * 100 : n;
  return `${pct.toFixed(2)}%`;
}

export function createIcIgBestLeastNative(
  pptx: PptxGenJS,
  config: ReportConfig,
  data: IcIgBestLeastExportData,
) {
  const slide = pptx.addSlide();
  const tv = getSlideThemeVars(config);
  drawSlideBackground(slide, pptx, config, tv);
  drawSlideDecorations(slide, pptx, tv);
  drawSlideHeader(
    slide,
    pptx,
    tv,
    `${config.clientName} \u2014 Instagram Best & Least`,
    'instagram',
    { subtitle: `${config.period} Report \u00b7 Top 5 Posts by Engagement` },
  );

  const { font, isDark, textColor, mutedColor, cardBg, borderColor, primaryColor } = tv;

  const BEST_COLOR = '16A34A';
  const LEAST_COLOR = 'DC2626';

  // Layout constants
  const colW = 4.6;
  const gapBetweenCols = 0.2;
  const colX = [0.3, 0.3 + colW + gapBetweenCols] as const; // left, right
  const colHeaderY = 0.97;
  const colHeaderH = 0.3;
  const cardsY = colHeaderY + colHeaderH + 0.08;
  const cardsH = 2.3;
  const analysisY = cardsY + cardsH + 0.08;
  const analysisH = 5.08 - analysisY;

  const cardCount = 5;
  const cardGap = 0.04;
  const cardW = (colW - (cardCount - 1) * cardGap) / cardCount;
  const imgH = cardsH * 0.52;
  const metricsH = cardsH - imgH;

  const columns: Array<{ posts: IcPostCard[]; color: string; label: string; analysis: string }> = [
    { posts: data.best, color: BEST_COLOR, label: 'Best 5', analysis: data.bestAnalysis },
    { posts: data.least, color: LEAST_COLOR, label: 'Least 5', analysis: data.leastAnalysis },
  ];

  columns.forEach(({ posts, color, label, analysis }, ci) => {
    const cx = colX[ci];

    // ── Column header ─────────────────────────────────────────────────────
    slide.addShape(pptx.ShapeType.roundRect, {
      x: cx,
      y: colHeaderY,
      w: colW,
      h: colHeaderH,
      fill: { color: color, transparency: 90 },
      line: { color: color, width: 0.75, transparency: 70 },
      rectRadius: 0.06,
    });
    slide.addText(label.toUpperCase(), {
      x: cx + 0.18,
      y: colHeaderY,
      w: colW - 0.36,
      h: colHeaderH,
      fontSize: 9,
      bold: true,
      color: color,
      fontFace: font,
      align: 'left',
      valign: 'middle',
    });

    // ── Post cards ────────────────────────────────────────────────────────
    posts.slice(0, cardCount).forEach((post, pi) => {
      const cardX = cx + pi * (cardW + cardGap);

      // Card background
      slide.addShape(pptx.ShapeType.roundRect, {
        x: cardX,
        y: cardsY,
        w: cardW,
        h: cardsH,
        fill: { color: cardBg },
        line: { color: borderColor, width: 0.5 },
        rectRadius: 0.06,
        shadow: { type: 'outer', blur: 3, offset: 1, color: '000000', opacity: 0.05 },
      });

      // Image — use actual thumbnail if available, else colored placeholder
      if (post.image_url) {
        slide.addImage({
          data: post.image_url,
          x: cardX,
          y: cardsY,
          w: cardW,
          h: imgH,
          ...(post.url ? { hyperlink: { url: post.url } } : {}),
        });
      } else {
        slide.addShape(pptx.ShapeType.rect, {
          x: cardX,
          y: cardsY,
          w: cardW,
          h: imgH,
          fill: { color: isDark ? '1E293B' : 'E2E8F0' },
          line: { type: 'none' },
          ...(post.url ? { hyperlink: { url: post.url } } : {}),
        });
      }

      // Rank badge — wider shape + wrap:false so "#1" never breaks to 2 lines
      slide.addShape(pptx.ShapeType.roundRect, {
        x: cardX + 0.04,
        y: cardsY + 0.04,
        w: 0.34,
        h: 0.17,
        fill: { color: color },
        line: { type: 'none' },
        rectRadius: 0.05,
      });
      slide.addText(`#${pi + 1}`, {
        x: cardX + 0.04,
        y: cardsY + 0.04,
        w: 0.34,
        h: 0.17,
        fontSize: 6,
        bold: true,
        color: 'FFFFFF',
        fontFace: font,
        align: 'center',
        valign: 'middle',
        wrap: false,
      });

      // Metrics — short labels
      const metrics = [
        { label: 'Follow', value: fmtNative(post.follows) },
        { label: 'Reach', value: fmtNative(post.reach) },
        { label: 'Engage', value: fmtNative(post.engagement) },
        { label: 'ER', value: fmtERNative(post.engagement_rate) },
      ];
      const rowH_m = metricsH / (metrics.length + 1);
      metrics.forEach(({ label: ml, value }, mi) => {
        const my = cardsY + imgH + mi * rowH_m + 0.02;
        const isER = ml === 'ER';
        slide.addText(ml, {
          x: cardX + 0.02,
          y: my,
          w: cardW * 0.5,
          h: rowH_m,
          fontSize: 4.5,
          color: mutedColor,
          fontFace: font,
          valign: 'middle',
          wrap: false,
        });
        slide.addText(value, {
          x: cardX + cardW * 0.5,
          y: my,
          w: cardW * 0.48,
          h: rowH_m,
          fontSize: 5,
          bold: true,
          color: isER ? color : textColor,
          fontFace: font,
          align: 'right',
          valign: 'middle',
          wrap: false,
        });
      });
      // Link row
      const linkY = cardsY + imgH + metrics.length * rowH_m + 0.02;
      slide.addText('Link', {
        x: cardX + 0.02,
        y: linkY,
        w: cardW * 0.4,
        h: rowH_m,
        fontSize: 4.5,
        color: mutedColor,
        fontFace: font,
        valign: 'middle',
        wrap: false,
      });
      if (post.url) {
        slide.addText('View', {
          x: cardX + cardW * 0.4,
          y: linkY,
          w: cardW * 0.58,
          h: rowH_m,
          fontSize: 5,
          color: '3B82F6',
          bold: true,
          fontFace: font,
          underline: { style: 'sng', color: '3B82F6' },
          align: 'right',
          valign: 'middle',
          wrap: false,
          hyperlink: { url: post.url, tooltip: post.url },
        });
      } else {
        slide.addText('—', {
          x: cardX + cardW * 0.4,
          y: linkY,
          w: cardW * 0.58,
          h: rowH_m,
          fontSize: 5,
          color: mutedColor,
          fontFace: font,
          align: 'right',
          valign: 'middle',
          wrap: false,
        });
      }
    });

    // ── Analysis box ──────────────────────────────────────────────────────
    slide.addShape(pptx.ShapeType.roundRect, {
      x: cx,
      y: analysisY,
      w: colW,
      h: analysisH,
      fill: { color: color, transparency: 96 },
      line: { color: color, width: 0.75, transparency: 70 },
      rectRadius: 0.06,
    });
    // Title bar
    slide.addShape(pptx.ShapeType.rect, {
      x: cx,
      y: analysisY,
      w: colW,
      h: 0.22,
      fill: { color: color, transparency: 85 },
      line: { type: 'none' },
    });
    slide.addText(`INSIGHTS \u2014 ${label.toUpperCase()}`, {
      x: cx + 0.1,
      y: analysisY,
      w: colW - 0.2,
      h: 0.22,
      fontSize: 6,
      bold: true,
      color: color,
      fontFace: font,
      valign: 'middle',
    });
    // Analysis body text
    slide.addText(analysis || 'No analysis provided.', {
      x: cx + 0.1,
      y: analysisY + 0.24,
      w: colW - 0.2,
      h: analysisH - 0.3,
      fontSize: 7,
      color: isDark ? 'CBD5E1' : '475569',
      fontFace: font,
      valign: 'top',
      wrap: true,
    });
  });

  drawNativeFooter(slide, pptx, config, primaryColor, font, data.currentPage, data.totalPages);
}

// ── ic_ig_content_pillar ──────────────────────────────────────────────────────
interface IcCpPostItem {
  reach: number | null;
  engagement: number | null;
  engagement_rate: number | null;
  saves: number | null;
  shares: number | null;
  comments: number | null;
  format: string;
  url: string | null;
  image_url: string | null;
}

interface IcCpPillarData {
  pillar: string;
  lowest: IcCpPostItem[];
  highest: IcCpPostItem[];
  insight: string;
}

interface IcIgContentPillarExportData {
  pillars: IcCpPillarData[];
  currentPage: number;
  totalPages: number;
}

export function createIcIgContentPillarNative(
  pptx: PptxGenJS,
  config: ReportConfig,
  data: IcIgContentPillarExportData,
) {
  const slide = pptx.addSlide();
  const tv = getSlideThemeVars(config);
  drawSlideBackground(slide, pptx, config, tv);
  drawSlideDecorations(slide, pptx, tv);
  drawSlideHeader(
    slide,
    pptx,
    tv,
    `${config.clientName} \u2014 Instagram Content Pillar`,
    'instagram',
    { subtitle: `${config.period} \u00b7 Lowest & Highest 6 Posts per Pillar` },
  );

  const { font, isDark, textColor, mutedColor, cardBg, borderColor, primaryColor } = tv;
  const COLOR_LOW = 'DC2626';
  const COLOR_HIGH = '16A34A';

  // ── Layout constants ─────────────────────────────────────────────────────
  const contentX = 0.3;
  const contentW = 9.4;
  const bodyY = 0.97;
  const footerY = 5.15;
  const bodyH = footerY - bodyY; // 4.18 inches
  const pillarGap = 0.08;
  const numPillars = Math.min(data.pillars.length, 2);
  const pillarH =
    numPillars > 1
      ? (bodyH - pillarGap) / 2 // ~2.05
      : bodyH;

  const sidebarW = 0.22;
  const insightW = 1.8;
  const secGap = 0.06;
  const lowHighW = (contentW - sidebarW - insightW - 3 * secGap) / 2; // ~3.6

  const sidebarX = contentX;
  const lowX = sidebarX + sidebarW + secGap;
  const highX = lowX + lowHighW + secGap;
  const insightX = highX + lowHighW + secGap;

  const cardGap = 0.03;
  const cardW = (lowHighW - 2 * cardGap) / 3; // ~1.18

  const padV = 0.04;
  const labelH = 0.15;
  const cardsAreaH = pillarH - labelH - 2 * padV;
  const cardRowGap = 0.04;
  const cardH = (cardsAreaH - cardRowGap) / 2; // ~0.89

  const imgW = cardW * 0.5;
  const metricsW = cardW - imgW;
  const numMetricRows = 8;
  const mRowH = cardH / numMetricRows;

  // ── Draw each pillar row ──────────────────────────────────────────────────
  data.pillars.slice(0, 2).forEach((pData, pi) => {
    const py = bodyY + pi * (pillarH + pillarGap);

    // Outer pillar card
    slide.addShape(pptx.ShapeType.roundRect, {
      x: contentX,
      y: py,
      w: contentW,
      h: pillarH,
      fill: { color: cardBg },
      line: { color: borderColor, width: 0.5 },
      rectRadius: 0.06,
      shadow: { type: 'outer', blur: 3, offset: 1, color: '000000', opacity: 0.04 },
    });

    // Sidebar — pillar name (rotated)
    slide.addShape(pptx.ShapeType.roundRect, {
      x: sidebarX + 0.02,
      y: py + padV,
      w: sidebarW - 0.04,
      h: pillarH - 2 * padV,
      fill: { color: primaryColor, transparency: 90 },
      line: { color: primaryColor, width: 0.5, transparency: 75 },
      rectRadius: 0.04,
    });
    slide.addText(pData.pillar.toUpperCase(), {
      x: sidebarX + 0.02,
      y: py + padV,
      w: sidebarW - 0.04,
      h: pillarH - 2 * padV,
      fontSize: 5.5,
      bold: true,
      color: primaryColor,
      fontFace: font,
      align: 'center',
      valign: 'middle',
      rotate: 270,
      wrap: false,
    });

    // ── Lowest + Highest sections ─────────────────────────────────────────
    const sections = [
      { posts: pData.lowest, color: COLOR_LOW, label: 'LOWEST', sx: lowX },
      { posts: pData.highest, color: COLOR_HIGH, label: 'HIGHEST', sx: highX },
    ];

    sections.forEach(({ posts, color, label, sx }) => {
      // Section label
      slide.addText(label, {
        x: sx,
        y: py + padV,
        w: lowHighW,
        h: labelH,
        fontSize: 5.5,
        bold: true,
        color: color,
        fontFace: font,
        align: 'left',
        valign: 'middle',
      });

      // 2 rows × 3 cards
      [0, 1].forEach((row) => {
        const cy = py + padV + labelH + row * (cardH + cardRowGap);
        const startIdx = row * 3;

        [0, 1, 2].forEach((col) => {
          const cx = sx + col * (cardW + cardGap);
          const post = posts[startIdx + col] as IcCpPostItem | undefined;

          // Card background
          slide.addShape(pptx.ShapeType.roundRect, {
            x: cx,
            y: cy,
            w: cardW,
            h: cardH,
            fill: { color: color, transparency: 95 },
            line: { color: color, width: 0.5, transparency: 78 },
            rectRadius: 0.04,
          });

          if (!post) return;

          // Image (left half) — actual thumbnail or placeholder
          if (post.image_url) {
            slide.addImage({
              data: post.image_url,
              x: cx,
              y: cy,
              w: imgW,
              h: cardH,
              ...(post.url ? { hyperlink: { url: post.url } } : {}),
            });
          } else {
            slide.addShape(pptx.ShapeType.rect, {
              x: cx,
              y: cy,
              w: imgW,
              h: cardH,
              fill: { color: isDark ? '1E293B' : 'E2E8F0' },
              line: { type: 'none' },
              ...(post.url ? { hyperlink: { url: post.url } } : {}),
            });
          }

          // Rank badge
          const rankIdx = startIdx + col + 1;
          slide.addShape(pptx.ShapeType.roundRect, {
            x: cx + 0.02,
            y: cy + 0.02,
            w: 0.2,
            h: 0.12,
            fill: { color: color },
            line: { type: 'none' },
            rectRadius: 0.04,
          });
          slide.addText(`#${rankIdx}`, {
            x: cx + 0.02,
            y: cy + 0.02,
            w: 0.2,
            h: 0.12,
            fontSize: 4.5,
            bold: true,
            color: 'FFFFFF',
            fontFace: font,
            align: 'center',
            valign: 'middle',
            wrap: false,
          });

          // Metrics (right half)
          const mx = cx + imgW;
          const metrics: { lbl: string; val: string; isER?: boolean; isLink?: boolean }[] = [
            { lbl: 'Reach', val: fmtNative(post.reach) },
            { lbl: 'Eng', val: fmtNative(post.engagement) },
            { lbl: 'ER', val: fmtERNative(post.engagement_rate), isER: true },
            { lbl: 'Saves', val: fmtNative(post.saves) },
            { lbl: 'Shares', val: fmtNative(post.shares) },
            { lbl: 'Cmts', val: fmtNative(post.comments) },
            { lbl: 'Fmt', val: (post.format || '-').substring(0, 7) },
            { lbl: 'Link', val: post.url ? 'View' : '\u2014', isLink: !!post.url },
          ];

          metrics.forEach(({ lbl, val, isER, isLink }, mi) => {
            const my = cy + mi * mRowH;
            slide.addText(lbl, {
              x: mx + 0.01,
              y: my,
              w: metricsW * 0.44,
              h: mRowH,
              fontSize: 3.5,
              color: mutedColor,
              fontFace: font,
              valign: 'middle',
              wrap: false,
            });
            if (isLink && post.url) {
              slide.addText('View', {
                x: mx + metricsW * 0.44,
                y: my,
                w: metricsW * 0.54,
                h: mRowH,
                fontSize: 4,
                bold: true,
                color: '3B82F6',
                fontFace: font,
                align: 'right',
                valign: 'middle',
                wrap: false,
                hyperlink: { url: post.url, tooltip: post.url },
              });
            } else {
              slide.addText(val, {
                x: mx + metricsW * 0.44,
                y: my,
                w: metricsW * 0.54,
                h: mRowH,
                fontSize: 4,
                bold: true,
                color: isER ? color : textColor,
                fontFace: font,
                align: 'right',
                valign: 'middle',
                wrap: false,
              });
            }
          });
        });
      });
    });

    // ── Insight box ───────────────────────────────────────────────────────
    slide.addShape(pptx.ShapeType.roundRect, {
      x: insightX,
      y: py,
      w: insightW,
      h: pillarH,
      fill: { color: isDark ? '1E293B' : 'F8FAFC' },
      line: { color: borderColor, width: 0.5 },
      rectRadius: 0.06,
    });
    // Header bar
    slide.addShape(pptx.ShapeType.rect, {
      x: insightX,
      y: py,
      w: insightW,
      h: 0.22,
      fill: { color: primaryColor, transparency: 88 },
      line: { type: 'none' },
    });
    slide.addText('ANALYSIS', {
      x: insightX + 0.08,
      y: py,
      w: insightW - 0.16,
      h: 0.22,
      fontSize: 6,
      bold: true,
      color: primaryColor,
      fontFace: font,
      valign: 'middle',
    });
    // Body text
    slide.addText(pData.insight || 'No analysis provided.', {
      x: insightX + 0.08,
      y: py + 0.24,
      w: insightW - 0.16,
      h: pillarH - 0.3,
      fontSize: 6.5,
      color: isDark ? 'CBD5E1' : '475569',
      fontFace: font,
      valign: 'top',
      wrap: true,
    });
  });

  drawNativeFooter(slide, pptx, config, primaryColor, font, data.currentPage, data.totalPages);
}

// ── ic_ig_tagged_post ─────────────────────────────────────────────────────────
interface IcTaggedPost {
  post_date: string | null;
  engagement: number | null;
  url: string | null;
  image_url: string | null;
}

interface IcTaggedSummary {
  total_tagged_post: number | null;
  total_tagged_post_inc: number | null;
  total_user_count: number | null;
  total_user_count_inc: number | null;
}

interface IcTaggedSentiments {
  Negative: string[];
  Positive: string[];
  Neutral: string[];
}

interface IcIgTaggedPostExportData {
  posts: IcTaggedPost[];
  summary: IcTaggedSummary | null;
  sentiments: IcTaggedSentiments;
  currentPage: number;
  totalPages: number;
}

export function createIcIgTaggedPostNative(
  pptx: PptxGenJS,
  config: ReportConfig,
  data: IcIgTaggedPostExportData,
) {
  const slide = pptx.addSlide();
  const tv = getSlideThemeVars(config);
  drawSlideBackground(slide, pptx, config, tv);
  drawSlideDecorations(slide, pptx, tv);
  drawSlideHeader(
    slide,
    pptx,
    tv,
    `${config.clientName} \u2014 Instagram Tagged Post`,
    'instagram',
    { subtitle: `${config.period} \u00b7 Top 3 Tagged Posts \u00b7 Sentiment Comments` },
  );

  const { font, isDark, textColor, mutedColor, cardBg, borderColor, primaryColor } = tv;

  // ── Layout constants ──────────────────────────────────────────────────────
  const contentX = 0.3;
  const contentW = 9.4;
  const bodyY = 0.97;
  const footerY = 5.15;
  const bodyH = footerY - bodyY; // 4.18"

  const row1H = 2.1;
  const rowGap = 0.08;
  const row2Y = bodyY + row1H + rowGap;
  const row2H = footerY - row2Y; // ~2.0"

  // Post cards area (left 68% of content)
  const postsW = 6.4;
  const kpiGap = 0.15;
  const kpiX = contentX + postsW + kpiGap;
  const kpiW = contentW - postsW - kpiGap; // ~2.85"

  const cardCount = 3;
  const cardGap = 0.08;
  const cardW = (postsW - (cardCount - 1) * cardGap) / cardCount; // ~2.08"
  const cardH = row1H;
  const infoH = 0.68;
  const imgH = cardH - infoH;

  // KPI cards
  const kpiCardGap = 0.1;
  const kpiCardH = (row1H - kpiCardGap) / 2; // ~1.0"

  // Sentiment columns
  const sentGap = 0.1;
  const sentColW = (contentW - 2 * sentGap) / 3; // ~3.067"

  const SENT_COLORS: Record<string, string> = {
    Negative: 'DC2626',
    Positive: '16A34A',
    Neutral: '6366F1',
  };

  // ── Post cards ────────────────────────────────────────────────────────────
  data.posts.slice(0, 3).forEach((post, pi) => {
    const cx = contentX + pi * (cardW + cardGap);
    const cy = bodyY;

    // Card background
    slide.addShape(pptx.ShapeType.roundRect, {
      x: cx,
      y: cy,
      w: cardW,
      h: cardH,
      fill: { color: cardBg },
      line: { color: borderColor, width: 0.5 },
      rectRadius: 0.06,
      shadow: { type: 'outer', blur: 3, offset: 1, color: '000000', opacity: 0.05 },
    });

    // Info box background
    slide.addShape(pptx.ShapeType.rect, {
      x: cx,
      y: cy,
      w: cardW,
      h: infoH,
      fill: { color: isDark ? '1E293B' : 'F8FAFC' },
      line: { type: 'none' },
    });

    // Rank badge
    slide.addShape(pptx.ShapeType.roundRect, {
      x: cx + 0.08,
      y: cy + 0.08,
      w: 0.28,
      h: 0.17,
      fill: { color: primaryColor },
      line: { type: 'none' },
      rectRadius: 0.06,
    });
    slide.addText(`#${pi + 1}`, {
      x: cx + 0.08,
      y: cy + 0.08,
      w: 0.28,
      h: 0.17,
      fontSize: 6.5,
      bold: true,
      color: 'FFFFFF',
      fontFace: font,
      align: 'center',
      valign: 'middle',
      wrap: false,
    });

    // Engagement value
    slide.addText(fmtNative(post.engagement), {
      x: cx + 0.42,
      y: cy + 0.08,
      w: cardW - 0.5,
      h: 0.18,
      fontSize: 10,
      bold: true,
      color: textColor,
      fontFace: font,
      align: 'left',
      valign: 'middle',
      wrap: false,
    });
    slide.addText('engagement', {
      x: cx + 0.42,
      y: cy + 0.26,
      w: cardW - 0.5,
      h: 0.13,
      fontSize: 5.5,
      color: mutedColor,
      fontFace: font,
      align: 'left',
      valign: 'middle',
      wrap: false,
    });

    // Date
    const dateStr = post.post_date
      ? (() => {
          try {
            return new Date(post.post_date).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            });
          } catch {
            return post.post_date;
          }
        })()
      : '-';
    slide.addText(dateStr, {
      x: cx + 0.08,
      y: cy + 0.4,
      w: cardW - 0.16,
      h: 0.14,
      fontSize: 6,
      color: mutedColor,
      fontFace: font,
      align: 'left',
      valign: 'middle',
      wrap: false,
    });

    // Link
    if (post.url) {
      slide.addText('View Post', {
        x: cx + 0.08,
        y: cy + 0.53,
        w: cardW - 0.16,
        h: 0.13,
        fontSize: 6,
        bold: true,
        color: '3B82F6',
        fontFace: font,
        align: 'left',
        valign: 'middle',
        wrap: false,
        underline: { style: 'sng', color: '3B82F6' },
        hyperlink: { url: post.url, tooltip: post.url },
      });
    } else {
      slide.addText('No link', {
        x: cx + 0.08,
        y: cy + 0.53,
        w: cardW - 0.16,
        h: 0.13,
        fontSize: 6,
        color: mutedColor,
        fontFace: font,
        align: 'left',
        valign: 'middle',
        wrap: false,
      });
    }

    // Image — actual thumbnail or placeholder
    if (post.image_url) {
      slide.addImage({
        data: post.image_url,
        x: cx,
        y: cy + infoH,
        w: cardW,
        h: imgH,
        ...(post.url ? { hyperlink: { url: post.url } } : {}),
      });
    } else {
      slide.addShape(pptx.ShapeType.rect, {
        x: cx,
        y: cy + infoH,
        w: cardW,
        h: imgH,
        fill: { color: isDark ? '1E293B' : 'E2E8F0' },
        line: { type: 'none' },
        ...(post.url ? { hyperlink: { url: post.url } } : {}),
      });
      slide.addText('Image', {
        x: cx,
        y: cy + infoH,
        w: cardW,
        h: imgH,
        fontSize: 7,
        color: isDark ? '334155' : 'CBD5E1',
        fontFace: font,
        align: 'center',
        valign: 'middle',
      });
    }
  });

  // ── KPI Cards ─────────────────────────────────────────────────────────────
  const kpiItems = [
    {
      label: 'TOTAL TAGGED POSTS',
      value: data.summary?.total_tagged_post ?? null,
      change: data.summary?.total_tagged_post_inc ?? null,
    },
    {
      label: 'TAGGED USER COUNT',
      value: data.summary?.total_user_count ?? null,
      change: data.summary?.total_user_count_inc ?? null,
    },
  ];

  kpiItems.forEach(({ label, value, change }, ki) => {
    const ky = bodyY + ki * (kpiCardH + kpiCardGap);
    const isPos = (change ?? 0) >= 0;
    const pctStr = change !== null ? `${isPos ? '+' : ''}${Number(change).toFixed(1)}%` : '';

    // Card background
    slide.addShape(pptx.ShapeType.roundRect, {
      x: kpiX,
      y: ky,
      w: kpiW,
      h: kpiCardH,
      fill: { color: cardBg },
      line: { color: borderColor, width: 0.5 },
      rectRadius: 0.06,
      shadow: { type: 'outer', blur: 3, offset: 1, color: '000000', opacity: 0.05 },
    });

    // Left accent
    slide.addShape(pptx.ShapeType.rect, {
      x: kpiX,
      y: ky,
      w: 0.04,
      h: kpiCardH,
      fill: { color: primaryColor },
      line: { type: 'none' },
    });

    // Label
    slide.addText(label, {
      x: kpiX + 0.14,
      y: ky + 0.1,
      w: kpiW - 0.22,
      h: 0.2,
      fontSize: 6.5,
      bold: true,
      color: mutedColor,
      fontFace: font,
      align: 'left',
      valign: 'middle',
      wrap: false,
    });

    // Value
    slide.addText(fmtNative(value), {
      x: kpiX + 0.14,
      y: ky + 0.3,
      w: kpiW - 0.22,
      h: 0.42,
      fontSize: 22,
      bold: true,
      color: textColor,
      fontFace: font,
      align: 'left',
      valign: 'middle',
      wrap: false,
    });

    // % change badge
    if (pctStr) {
      slide.addShape(pptx.ShapeType.roundRect, {
        x: kpiX + 0.14,
        y: ky + kpiCardH - 0.27,
        w: 0.55,
        h: 0.18,
        fill: { color: isPos ? '16A34A' : 'DC2626', transparency: 88 },
        line: { type: 'none' },
        rectRadius: 0.04,
      });
      slide.addText(pctStr, {
        x: kpiX + 0.14,
        y: ky + kpiCardH - 0.27,
        w: 0.55,
        h: 0.18,
        fontSize: 7,
        bold: true,
        color: isPos ? '16A34A' : 'DC2626',
        fontFace: font,
        align: 'center',
        valign: 'middle',
        wrap: false,
      });
    }
  });

  // ── Sentiment Columns ─────────────────────────────────────────────────────
  const sentOrder = ['Negative', 'Positive', 'Neutral'] as const;

  sentOrder.forEach((cat, ci) => {
    const sx = contentX + ci * (sentColW + sentGap);
    const sy = row2Y;
    const color = SENT_COLORS[cat];
    const comments: string[] = data.sentiments[cat] || [];

    // Column card background
    slide.addShape(pptx.ShapeType.roundRect, {
      x: sx,
      y: sy,
      w: sentColW,
      h: row2H,
      fill: { color: color, transparency: 96 },
      line: { color: color, width: 0.5, transparency: 70 },
      rectRadius: 0.06,
    });

    // Header bar
    slide.addShape(pptx.ShapeType.rect, {
      x: sx,
      y: sy,
      w: sentColW,
      h: 0.25,
      fill: { color: color, transparency: 85 },
      line: { type: 'none' },
    });
    slide.addText(`${cat.toUpperCase()}  (${comments.length})`, {
      x: sx + 0.1,
      y: sy,
      w: sentColW - 0.2,
      h: 0.25,
      fontSize: 7,
      bold: true,
      color: color,
      fontFace: font,
      valign: 'middle',
      wrap: false,
    });

    // Comment rows
    const commentsAreaH = row2H - 0.3;
    const rowH = commentsAreaH / 4;
    comments.slice(0, 4).forEach((c, i) => {
      const ry = sy + 0.3 + i * rowH;
      const text = c.length > 85 ? c.substring(0, 85) + '\u2026' : c;
      slide.addText(`\u2022  ${text}`, {
        x: sx + 0.1,
        y: ry,
        w: sentColW - 0.2,
        h: rowH,
        fontSize: 6,
        color: isDark ? 'CBD5E1' : '374151',
        fontFace: font,
        valign: 'top',
        wrap: true,
      });
    });

    if (comments.length === 0) {
      slide.addText('No comments available', {
        x: sx + 0.1,
        y: sy + 0.3,
        w: sentColW - 0.2,
        h: 0.3,
        fontSize: 7,
        color: mutedColor,
        fontFace: font,
        valign: 'middle',
        italic: true,
      });
    }
  });

  drawNativeFooter(slide, pptx, config, primaryColor, font, data.currentPage, data.totalPages);
}

export function exportToPPTX(slides: Slide[], config: ReportConfig) {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = config.preparedBy;
  pptx.title = config.reportTitle;

  slides.forEach((slideData) => {
    console.log(`Exporting slide: ${slideData.title} (type: ${slideData.type})`);

    if (slideData.type === 'cover') {
      createCoverSlide(pptx, config);
    } else if (slideData.type === 'dashboard') {
      createInstagramDashboard(pptx, config);
    } else if (slideData.type === 'layout_dashboard') {
      createLayoutDashboardNative(pptx, config, { title: slideData.title });
    } else if (slideData.type === 'layout_comparison') {
      createLayoutComparison(pptx, config, slideData.title);
    } else if (slideData.type === 'layout_kpi') {
      createLayoutKPI(pptx, config, slideData.title);
    } else if (slideData.type === 'layout_content') {
      createLayoutContent(pptx, config, slideData.title);
    } else if (slideData.type === 'layout_overview') {
      createLayoutContent(pptx, config, slideData.title);
    } else if (slideData.type === 'layout_custom') {
      createLayoutCustom(pptx, config, slideData.title);
    } else {
      // Generic placeholder for unknown types
      const slide = pptx.addSlide();
      slide.background = { color: 'FFFFFF' };

      slide.addText(slideData.title, {
        x: 0.5,
        y: 2.5,
        w: 9,
        h: 0.5,
        fontSize: 24,
        bold: true,
        color: '1F2937',
        align: 'center',
        valign: 'middle',
      });

      slide.addText(`Type: ${slideData.type}`, {
        x: 0.5,
        y: 3.2,
        w: 9,
        h: 0.3,
        fontSize: 14,
        color: '6B7280',
        align: 'center',
        valign: 'middle',
      });
    }
  });

  return pptx;
}

// ─────────────────────────────────────────────────────────────────────────────
// TikTok: Growth (tiktok_page_17)
// ─────────────────────────────────────────────────────────────────────────────
export function createIcTtGrowthNative(
  pptx: PptxGenJS,
  config: ReportConfig,
  data: IcTtGrowthExportData,
) {
  const slide = pptx.addSlide();
  const tv = getSlideThemeVars(config);
  drawSlideBackground(slide, pptx, config, tv);
  drawSlideDecorations(slide, pptx, tv);
  drawSlideHeader(slide, pptx, tv, `${config.clientName} \u2014 TikTok Growth`, 'tiktok', {
    subtitle: `${config.period} \u00b7 Profile Views \u00b7 Net Growth \u00b7 Video Views`,
  });

  const { font, isDark, textColor, mutedColor, cardBg, borderColor, primaryColor } = tv;

  const contentX = 0.3;
  const contentW = 9.4;
  const bodyY = 0.97;
  const footerY = 5.15;
  const bodyH = footerY - bodyY; // 4.18"

  const gap = 0.12;
  const insightW = contentW * 0.28;
  const chartW = contentW - insightW - gap;
  const insightX = contentX + chartW + gap;

  // Table taller (more room), charts shorter
  const tableH = 1.3;
  const tableGap = 0.08;
  const chartsH = bodyH - tableH - tableGap; // ~2.80"

  // ── Chart card ─────────────────────────────────────────────────────────────
  slide.addShape(pptx.ShapeType.roundRect, {
    x: contentX,
    y: bodyY,
    w: chartW,
    h: chartsH,
    fill: { color: cardBg },
    line: { color: borderColor, width: 0.75 },
    rectRadius: 0.08,
    shadow: { type: 'outer', blur: 4, offset: 1, color: '000000', opacity: 0.05 },
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: contentX,
    y: bodyY,
    w: chartW,
    h: 0.03,
    fill: { color: primaryColor },
    line: { type: 'none' },
  });

  if (data.chartData.length > 0) {
    // Format tanggal: ambil "MMM-DD" dari ISO string misalnya "2025-01-15" → "Jan-15"
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const labels = data.chartData.map((d) => {
      const raw = d.date ?? '';
      const parts = raw.split('-');
      if (parts.length >= 3) {
        const mo = parseInt(parts[1], 10);
        const day = parts[2].slice(0, 2);
        return `${monthNames[(mo - 1) % 12]}-${day}`;
      }
      return raw;
    });

    const pvSeries = data.chartData.map((d) => d.profile_views ?? 0);
    const ngSeries = data.chartData.map((d) => d.net_growth ?? 0);
    const vvSeries = data.chartData.map((d) => d.video_views ?? 0);
    const symSize = labels.length > 15 ? 2 : 4;
    // Reduce label frequency if too many dates
    const labelFreq = labels.length > 20 ? Math.ceil(labels.length / 10) : 1;

    // Common axis options — NO catAxisLabelFontFace / valAxisLabelFontFace
    // to avoid PowerPoint glyph fallback bug ("g" appears instead of labels)
    const axisOpts = {
      showLegend: false,
      showTitle: false,
      lineSmooth: false,
      lineSize: 1.5,
      lineDataSymbolSize: symSize,
      valGridLine: { style: 'dash' as const, color: isDark ? '334155' : 'E2E8F0' },
      catGridLine: { style: 'none' as const },
      catAxisLabelFontSize: 6,
      valAxisLabelFontSize: 6,
      catAxisLabelColor: mutedColor,
      valAxisLabelColor: mutedColor,
      catAxisLineShow: false,
      valAxisLineShow: false,
      catAxisLabelFrequency: String(labelFreq),
    };

    const labelH = 0.12;
    const subGap = 0.04;
    const totalUsable = chartsH - 0.08 - 3 * labelH - 2 * subGap;
    const subH = totalUsable / 3;

    // ── Chart 1: Profile Views ─────────────────────────────────────────────
    const c1Y = bodyY + 0.06;
    slide.addText('Profile Views', {
      x: contentX + 0.1,
      y: c1Y,
      w: chartW - 0.2,
      h: labelH,
      fontSize: 5.5,
      bold: true,
      color: isDark ? 'CBD5E1' : '475569',
      fontFace: font,
    });
    slide.addChart(pptx.ChartType.line, [{ name: 'Profile Views', labels, values: pvSeries }], {
      ...axisOpts,
      valAxisMinVal: 0,
      chartColors: ['E67E22'],
      x: contentX + 0.05,
      y: c1Y + labelH,
      w: chartW - 0.1,
      h: subH,
    });

    // ── Chart 2: Net Growth ────────────────────────────────────────────────
    const c2Y = c1Y + labelH + subH + subGap;
    slide.addText('Net Growth', {
      x: contentX + 0.1,
      y: c2Y,
      w: chartW - 0.2,
      h: labelH,
      fontSize: 5.5,
      bold: true,
      color: isDark ? 'CBD5E1' : '475569',
      fontFace: font,
    });
    slide.addChart(pptx.ChartType.line, [{ name: 'Net Growth', labels, values: ngSeries }], {
      ...axisOpts,
      chartColors: ['3B82F6'],
      x: contentX + 0.05,
      y: c2Y + labelH,
      w: chartW - 0.1,
      h: subH,
    });

    // ── Chart 3: Video Views ───────────────────────────────────────────────
    const c3Y = c2Y + labelH + subH + subGap;
    slide.addText('Video Views', {
      x: contentX + 0.1,
      y: c3Y,
      w: chartW - 0.2,
      h: labelH,
      fontSize: 5.5,
      bold: true,
      color: isDark ? 'CBD5E1' : '475569',
      fontFace: font,
    });
    slide.addChart(pptx.ChartType.bar, [{ name: 'Video Views', labels, values: vvSeries }], {
      ...axisOpts,
      valAxisMinVal: 0,
      chartColors: ['2980B9'],
      barDir: 'col' as const,
      x: contentX + 0.05,
      y: c3Y + labelH,
      w: chartW - 0.1,
      h: subH,
    });
  }

  // ── Insight box ────────────────────────────────────────────────────────────
  drawSlideInsight(slide, pptx, tv, {
    x: insightX,
    y: bodyY,
    w: insightW,
    h: chartsH,
    label: 'Analysis',
    text: data.insight || '',
  });

  // ── Overview table — styled like IG Growth ─────────────────────────────────
  const tableY = bodyY + chartsH + tableGap;
  const headers = [
    'Month',
    'Post Count',
    'Profile Views',
    'Followers Growth',
    'Reach',
    'Views',
    'Engagement',
    'Avg Watch Time',
  ];
  const colCount = headers.length;
  const monthColW = 0.85;
  const otherColW = (contentW - monthColW - 0.1) / (colCount - 1);
  const colWidths = [monthColW, ...Array(colCount - 1).fill(otherColW)];
  const rowH_tbl = (tableH - 0.1) / (data.tableRows.length + 1);

  if (data.tableRows.length > 0) {
    slide.addShape(pptx.ShapeType.roundRect, {
      x: contentX,
      y: tableY,
      w: contentW,
      h: tableH,
      fill: { color: cardBg },
      line: { color: borderColor, width: 0.75 },
      rectRadius: 0.08,
      shadow: { type: 'outer', blur: 4, offset: 1, color: '000000', opacity: 0.05 },
    });
    slide.addShape(pptx.ShapeType.rect, {
      x: contentX,
      y: tableY,
      w: contentW,
      h: 0.03,
      fill: { color: primaryColor },
      line: { type: 'none' },
    });

    const headerRow = headers.map((h, ci) => ({
      text: h,
      options: {
        bold: true,
        fontSize: 6,
        color: 'FFFFFF',
        fontFace: font,
        align: (ci === 0 ? 'left' : 'center') as 'left' | 'center',
        fill: { color: primaryColor },
      },
    }));

    const dataRows = data.tableRows.map((row, ri) => {
      const vals = [
        row.month,
        row.post_count,
        row.profile_views,
        row.followers_growth,
        row.reach,
        row.views,
        row.engagement,
        row.avg_watch_time,
      ];
      const isGap = row.month?.toLowerCase().includes('gap');
      return vals.map((cell, ci) => {
        let cellColor = textColor;
        if (isGap && ci > 0) {
          if ((cell ?? '').startsWith('-')) cellColor = 'EF4444';
          else if (cell === '0' || cell === '-') cellColor = '94A3B8';
          else cellColor = '10B981';
        }
        return {
          text: cell ?? '-',
          options: {
            fontSize: 6.5,
            color: cellColor,
            fontFace: font,
            align: (ci === 0 ? 'left' : 'center') as 'left' | 'center',
            bold: isGap || ci === 0,
            fill: {
              color: isGap
                ? isDark
                  ? '1A2535'
                  : 'F1F5F9'
                : ri % 2 === 0
                  ? cardBg
                  : isDark
                    ? '1A2535'
                    : 'F8FAFC',
            },
          },
        };
      });
    });

    slide.addTable([headerRow, ...dataRows], {
      x: contentX + 0.05,
      y: tableY + 0.06,
      w: contentW - 0.1,
      h: tableH - 0.09,
      colW: colWidths,
      rowH: rowH_tbl,
      border: { type: 'solid', color: borderColor, pt: 0.4 },
      fontFace: font,
    });
  }

  drawNativeFooter(slide, pptx, config, primaryColor, font, data.currentPage, data.totalPages);
}

// ─────────────────────────────────────────────────────────────────────────────
// TikTok: Best & Least (tiktok_page_18 organic / tiktok_page_19 paid)
// ─────────────────────────────────────────────────────────────────────────────
export function createIcTtBestLeastNative(
  pptx: PptxGenJS,
  config: ReportConfig,
  data: IcTtBestLeastExportData,
) {
  const slide = pptx.addSlide();
  const tv = getSlideThemeVars(config);
  drawSlideBackground(slide, pptx, config, tv);
  drawSlideDecorations(slide, pptx, tv);
  const modeLabel = data.mode === 'paid' ? 'Paid' : 'Organic';
  drawSlideHeader(
    slide,
    pptx,
    tv,
    `${config.clientName} \u2014 TikTok ${modeLabel} Best & Least`,
    'tiktok',
    {
      subtitle: `${config.period} \u00b7 Highest & Lowest 3`,
    },
  );

  const { font, isDark, textColor, mutedColor, cardBg, borderColor, primaryColor } = tv;
  const COLOR_HIGH = '16A34A';
  const COLOR_LOW = 'DC2626';

  const contentX = 0.3;
  const contentW = 9.4;
  const bodyY = 0.97;
  const footerY = 5.15;
  const bodyH = footerY - bodyY;

  const gap = 0.1;
  const rightW = contentW * 0.28;
  const leftW = contentW - rightW - gap;
  const rightX = contentX + leftW + gap;

  const rowGap = 0.08;
  const rowH = (bodyH - rowGap) / 2;

  // ── Left column: Highest + Lowest ─────────────────────────────────────────
  const drawPostRow = (posts: IcTtPost[], label: string, color: string, rowY: number) => {
    // Section header
    slide.addShape(pptx.ShapeType.roundRect, {
      x: contentX,
      y: rowY,
      w: leftW,
      h: 0.17,
      fill: { color: color, transparency: 88 },
      line: { color: color, width: 0.5, transparency: 70 },
      rectRadius: 0.04,
    });
    slide.addText(label, {
      x: contentX + 0.1,
      y: rowY,
      w: leftW - 0.2,
      h: 0.17,
      fontSize: 6.5,
      bold: true,
      color: color,
      fontFace: font,
      align: 'left',
      valign: 'middle',
    });

    const cardsY = rowY + 0.2;
    const cardsH = rowH - 0.2;
    if (posts.length === 0) return;
    // Always size cards as if there are 3 slots so width is consistent
    const SLOTS = 3;
    const cardGap = 0.06;
    const cardW = (leftW - (SLOTS - 1) * cardGap) / SLOTS;
    // Horizontal split: image LEFT 55%, metrics RIGHT 45%
    const imgW = cardW * 0.55;
    const metW = cardW - imgW;

    posts.slice(0, 3).forEach((post, pi) => {
      const cx = contentX + pi * (cardW + cardGap);
      const metX = cx + imgW;
      // Card bg
      slide.addShape(pptx.ShapeType.roundRect, {
        x: cx,
        y: cardsY,
        w: cardW,
        h: cardsH,
        fill: { color: cardBg },
        line: { color: borderColor, width: 0.5 },
        rectRadius: 0.05,
        shadow: { type: 'outer', blur: 3, offset: 1, color: '000000', opacity: 0.04 },
      });
      // Image — left half, actual thumbnail or placeholder
      if (post.image_url) {
        slide.addImage({
          data: post.image_url,
          x: cx,
          y: cardsY,
          w: imgW,
          h: cardsH,
        });
      } else {
        slide.addShape(pptx.ShapeType.rect, {
          x: cx,
          y: cardsY,
          w: imgW,
          h: cardsH,
          fill: { color: isDark ? '1E293B' : 'E2E8F0' },
          line: { type: 'none' },
        });
      }
      // Rank badge — top-left of metrics area (right column)
      slide.addShape(pptx.ShapeType.roundRect, {
        x: metX + 0.04,
        y: cardsY + 0.05,
        w: 0.34,
        h: 0.16,
        fill: { color: color },
        line: { type: 'none' },
        rectRadius: 0.04,
      });
      slide.addText(`#${pi + 1}`, {
        x: metX + 0.04,
        y: cardsY + 0.05,
        w: 0.34,
        h: 0.16,
        fontSize: 6.5,
        bold: true,
        color: 'FFFFFF',
        fontFace: font,
        align: 'center',
        valign: 'middle',
      });
      // Metrics — stacked in right column
      const metrics = [
        { label: 'Views', val: fmtNative(post.views) },
        { label: 'Engagement', val: fmtNative(post.engagement) },
        {
          label: 'VR Rate',
          val: post.vr_rate != null ? `${Number(post.vr_rate).toFixed(2)}%` : '-',
        },
      ];
      const metAreaY = cardsY + 0.26;
      const metAreaH = cardsH - 0.26 - (post.url ? 0.18 : 0.05);
      const mRowH = metAreaH / metrics.length;
      metrics.forEach((m, mi) => {
        const my = metAreaY + mi * mRowH;
        slide.addText(m.label, {
          x: metX + 0.04,
          y: my,
          w: metW - 0.06,
          h: mRowH * 0.45,
          fontSize: 4.5,
          color: mutedColor,
          fontFace: font,
          align: 'left',
          valign: 'bottom',
        });
        slide.addText(m.val, {
          x: metX + 0.04,
          y: my + mRowH * 0.45,
          w: metW - 0.06,
          h: mRowH * 0.55,
          fontSize: 5.5,
          bold: true,
          color: textColor,
          fontFace: font,
          align: 'left',
          valign: 'top',
        });
      });
      if (post.url) {
        slide.addText('View Post', {
          x: metX + 0.04,
          y: cardsY + cardsH - 0.18,
          w: metW - 0.06,
          h: 0.16,
          fontSize: 5,
          bold: true,
          color: '3B82F6',
          fontFace: font,
          align: 'left',
          valign: 'middle',
          hyperlink: { url: post.url },
        });
      }
    });
  };

  drawPostRow(data.highest, 'HIGHEST 3', COLOR_HIGH, bodyY);
  drawPostRow(data.lowest, 'LOWEST 3', COLOR_LOW, bodyY + rowH + rowGap);

  // ── Right column: Insight (full height) ───────────────────────────────────
  slide.addShape(pptx.ShapeType.roundRect, {
    x: rightX,
    y: bodyY,
    w: rightW,
    h: bodyH,
    fill: { color: cardBg },
    line: { color: borderColor, width: 0.75 },
    rectRadius: 0.08,
    shadow: { type: 'outer', blur: 4, offset: 1, color: '000000', opacity: 0.05 },
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: rightX,
    y: bodyY,
    w: rightW,
    h: 0.15,
    fill: { color: primaryColor, transparency: 85 },
    line: { type: 'none' },
  });
  slide.addText('Analysis', {
    x: rightX + 0.08,
    y: bodyY,
    w: rightW - 0.16,
    h: 0.15,
    fontSize: 6,
    bold: true,
    color: primaryColor,
    fontFace: font,
    align: 'left',
    valign: 'middle',
  });
  const insightText = data.insight
    ? data.insight
        .split('\n')
        .filter(Boolean)
        .map((l) =>
          l
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/^[-•]\s*/, '• ')
            .trim(),
        )
        .join('\n')
    : 'No insight generated.';
  slide.addText(insightText, {
    x: rightX + 0.08,
    y: bodyY + 0.18,
    w: rightW - 0.16,
    h: bodyH - 0.22,
    fontSize: 6.5,
    color: data.insight ? textColor : mutedColor,
    fontFace: font,
    align: 'left',
    valign: 'top',
    italic: !data.insight,
    paraSpaceAfter: 4,
    lineSpacingMultiple: 1.2,
    wrap: true,
  });

  drawNativeFooter(slide, pptx, config, primaryColor, font, data.currentPage, data.totalPages);
}

// ─────────────────────────────────────────────────────────────────────────────
// TikTok: Content Pillar (tiktok_page_20)
// ─────────────────────────────────────────────────────────────────────────────
export function createIcTtContentPillarNative(
  pptx: PptxGenJS,
  config: ReportConfig,
  data: IcTtContentPillarExportData,
) {
  const slide = pptx.addSlide();
  const tv = getSlideThemeVars(config);
  drawSlideBackground(slide, pptx, config, tv);
  drawSlideDecorations(slide, pptx, tv);
  drawSlideHeader(slide, pptx, tv, `${config.clientName} \u2014 TikTok Content Pillar`, 'tiktok', {
    subtitle: `${config.period} \u00b7 Top 2 Pillars \u00b7 Lowest \u2192 Highest`,
  });

  const { font, isDark, textColor, mutedColor, cardBg, borderColor, primaryColor } = tv;

  const contentX = 0.3;
  const contentW = 9.4;
  const bodyY = 0.97;
  const footerY = 5.15;
  const bodyH = footerY - bodyY;

  // Direction label row
  const dirH = 0.18;
  const dirY = bodyY;
  slide.addText('Lowest', {
    x: contentX,
    y: dirY,
    w: 0.45,
    h: dirH,
    fontSize: 6,
    bold: true,
    color: mutedColor,
    fontFace: font,
    align: 'left',
    valign: 'middle',
  });
  slide.addText('\u2192 Highest', {
    x: contentX + contentW - 0.55,
    y: dirY,
    w: 0.55,
    h: dirH,
    fontSize: 6,
    bold: true,
    color: mutedColor,
    fontFace: font,
    align: 'right',
    valign: 'middle',
  });

  const pillarStartY = bodyY + dirH + 0.06;
  const pillarGap = 0.08;
  // Always use half-height per pillar (as if 2 pillars) so size is consistent
  const pillarH = (bodyH - dirH - 0.06 - pillarGap) / 2;

  const insightW = contentW * 0.28;
  const postsW = contentW - insightW - 0.08;
  const insightX = contentX + postsW + 0.08;

  const cardCount = 3;
  const cardGap = 0.06;
  const cardW = (postsW - (cardCount - 1) * cardGap) / cardCount;

  data.pillars.slice(0, 2).forEach((pData, pi) => {
    const py = pillarStartY + pi * (pillarH + pillarGap);

    // Pillar label bar
    slide.addShape(pptx.ShapeType.rect, {
      x: contentX,
      y: py,
      w: 0.04,
      h: pillarH,
      fill: { color: primaryColor },
      line: { type: 'none' },
    });
    slide.addText(pData.pillar.toUpperCase(), {
      x: contentX + 0.08,
      y: py,
      w: postsW - 0.08,
      h: 0.16,
      fontSize: 6,
      bold: true,
      color: isDark ? 'E2E8F0' : '475569',
      fontFace: font,
      align: 'left',
      valign: 'middle',
    });

    // Post cards — image LEFT, metrics RIGHT
    const cardsY = py + 0.18;
    const cardH = pillarH - 0.18;
    // Horizontal split: image 54%, metrics 46%
    const imgW = cardW * 0.54;
    const metW = cardW - imgW;

    pData.posts.slice(0, 3).forEach((post, ci) => {
      const cx = contentX + ci * (cardW + cardGap);
      const metX = cx + imgW;
      // Card bg
      slide.addShape(pptx.ShapeType.roundRect, {
        x: cx,
        y: cardsY,
        w: cardW,
        h: cardH,
        fill: { color: cardBg },
        line: { color: borderColor, width: 0.5 },
        rectRadius: 0.05,
        shadow: { type: 'outer', blur: 3, offset: 1, color: '000000', opacity: 0.04 },
      });
      // Image — left half, actual thumbnail or placeholder
      if (post.image_url) {
        slide.addImage({
          data: post.image_url,
          x: cx,
          y: cardsY,
          w: imgW,
          h: cardH,
        });
      } else {
        slide.addShape(pptx.ShapeType.rect, {
          x: cx,
          y: cardsY,
          w: imgW,
          h: cardH,
          fill: { color: isDark ? '1E293B' : 'E2E8F0' },
          line: { type: 'none' },
        });
      }
      // Rank badge — top-left of metrics area (right column)
      slide.addShape(pptx.ShapeType.roundRect, {
        x: metX + 0.04,
        y: cardsY + 0.04,
        w: 0.32,
        h: 0.15,
        fill: { color: primaryColor },
        line: { type: 'none' },
        rectRadius: 0.04,
      });
      slide.addText(`#${ci + 1}`, {
        x: metX + 0.04,
        y: cardsY + 0.04,
        w: 0.32,
        h: 0.15,
        fontSize: 6,
        bold: true,
        color: 'FFFFFF',
        fontFace: font,
        align: 'center',
        valign: 'middle',
      });

      // Metrics — stacked in right column
      const metrics: { label: string; val: string }[] = [
        {
          label: 'Date',
          val: post.post_date
            ? new Date(post.post_date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })
            : '-',
        },
        { label: 'VR', val: post.vr_rate != null ? `${Number(post.vr_rate).toFixed(1)}%` : '-' },
        { label: 'Views', val: fmtNative(post.views) },
        { label: 'Eng', val: fmtNative(post.engagement) },
        {
          label: 'Avg WT',
          val: post.avg_watch_time != null ? `${Number(post.avg_watch_time).toFixed(1)}s` : '-',
        },
      ];
      const metAreaY = cardsY + 0.24;
      const metAreaH = cardH - 0.24 - (post.url ? 0.16 : 0.04);
      const mRowH = metAreaH / metrics.length;
      metrics.forEach((m, mi) => {
        const my = metAreaY + mi * mRowH;
        slide.addText(m.label, {
          x: metX + 0.04,
          y: my,
          w: metW - 0.06,
          h: mRowH * 0.42,
          fontSize: 4,
          color: mutedColor,
          fontFace: font,
          align: 'left',
          valign: 'bottom',
        });
        slide.addText(m.val, {
          x: metX + 0.04,
          y: my + mRowH * 0.42,
          w: metW - 0.06,
          h: mRowH * 0.58,
          fontSize: 4.5,
          bold: true,
          color: textColor,
          fontFace: font,
          align: 'left',
          valign: 'top',
        });
      });
      if (post.url) {
        slide.addText('Link', {
          x: metX + 0.04,
          y: cardsY + cardH - 0.16,
          w: metW - 0.06,
          h: 0.14,
          fontSize: 4.5,
          bold: true,
          color: '3B82F6',
          fontFace: font,
          align: 'left',
          valign: 'middle',
          hyperlink: { url: post.url },
        });
      }
    });

    // Insight box
    slide.addShape(pptx.ShapeType.roundRect, {
      x: insightX,
      y: py,
      w: insightW,
      h: pillarH,
      fill: { color: cardBg },
      line: { color: borderColor, width: 0.75 },
      rectRadius: 0.08,
      shadow: { type: 'outer', blur: 4, offset: 1, color: '000000', opacity: 0.05 },
    });
    slide.addShape(pptx.ShapeType.rect, {
      x: insightX,
      y: py,
      w: insightW,
      h: 0.15,
      fill: { color: primaryColor, transparency: 85 },
      line: { type: 'none' },
    });
    slide.addText(`Insight: ${pData.pillar}`, {
      x: insightX + 0.08,
      y: py,
      w: insightW - 0.16,
      h: 0.15,
      fontSize: 5.5,
      bold: true,
      color: primaryColor,
      fontFace: font,
      align: 'left',
      valign: 'middle',
    });
    const iText = pData.insight
      ? pData.insight
          .split('\n')
          .filter(Boolean)
          .map((l) =>
            l
              .replace(/\*\*(.*?)\*\*/g, '$1')
              .replace(/^[-•]\s*/, '• ')
              .trim(),
          )
          .join('\n')
      : 'No insight generated.';
    slide.addText(iText, {
      x: insightX + 0.08,
      y: py + 0.18,
      w: insightW - 0.16,
      h: pillarH - 0.22,
      fontSize: 6,
      color: pData.insight ? textColor : mutedColor,
      fontFace: font,
      align: 'left',
      valign: 'top',
      italic: !pData.insight,
      paraSpaceAfter: 4,
      lineSpacingMultiple: 1.2,
      wrap: true,
    });
  });

  drawNativeFooter(slide, pptx, config, primaryColor, font, data.currentPage, data.totalPages);
}

// ── ic_ig_cp_eng (Slides 11 & 12) ────────────────────────────────────────────
interface IcCpPillarRow {
  content_pillar: string;
  value: number;
}
interface IcCpDeltaRow {
  content_pillar: string;
  inc: number | null;
}

interface IcIgCpEngExportData {
  aon: boolean;
  currMonth: string;
  prevMonth: string;
  engCurr: IcCpPillarRow[];
  engPrev: IcCpPillarRow[];
  postCurr: IcCpPillarRow[];
  postPrev: IcCpPillarRow[];
  deltaEng: IcCpDeltaRow[];
  deltaPost: IcCpDeltaRow[];
  currentPage: number;
  totalPages: number;
}

function fmtPct(v: number | null): string {
  if (v === null || v === undefined || isNaN(v as number)) return '-';
  return `${(v as number) >= 0 ? '+' : ''}${(v as number).toFixed(0)}%`;
}

function buildAlignedRows(
  curr: IcCpPillarRow[],
  prev: IcCpPillarRow[],
): { pillar: string; currVal: number; prevVal: number }[] {
  const all = Array.from(
    new Set([
      ...curr.map((r: IcCpPillarRow) => r.content_pillar),
      ...prev.map((r: IcCpPillarRow) => r.content_pillar),
    ]),
  ).sort();
  const cm = Object.fromEntries(curr.map((r: IcCpPillarRow) => [r.content_pillar, r.value]));
  const pm = Object.fromEntries(prev.map((r: IcCpPillarRow) => [r.content_pillar, r.value]));
  return all.map((p: string) => ({
    pillar: p,
    currVal: (cm as any)[p] ?? 0,
    prevVal: (pm as any)[p] ?? 0,
  }));
}

const MONTH_ID_PPTX: Record<string, string> = {
  '01': 'Jan',
  '02': 'Feb',
  '03': 'Mar',
  '04': 'Apr',
  '05': 'Mei',
  '06': 'Jun',
  '07': 'Jul',
  '08': 'Agu',
  '09': 'Sep',
  '10': 'Okt',
  '11': 'Nov',
  '12': 'Des',
};
function monthLabelPptx(mmYyyy: string) {
  const [mm, yyyy] = mmYyyy.split('-');
  return `${MONTH_ID_PPTX[mm] ?? mm} ${yyyy}`;
}

function drawCpBarChart(
  slide: PptxGenJS.Slide,
  tv: SlideThemeVars,
  rows: { pillar: string; currVal: number; prevVal: number }[],
  prevLabel: string,
  currLabel: string,
  title: string,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const { font, isDark, mutedColor, primaryColor, cardBg, borderColor } = tv;
  const BAR_PREV = '4FC1E9';

  // Card background
  slide.addShape('roundRect' as any, {
    x,
    y,
    w,
    h,
    fill: { color: cardBg },
    line: { color: borderColor, width: 0.75 },
    rectRadius: 0.08,
  });

  // Section title
  slide.addText(title, {
    x: x + 0.1,
    y: y + 0.04,
    w: w - 0.2,
    h: 0.17,
    fontSize: 7,
    bold: true,
    color: isDark ? 'E2E8F0' : '475569',
    fontFace: font,
    align: 'left',
    valign: 'middle',
  });

  if (rows.length === 0) {
    slide.addText('No data', {
      x,
      y: y + h / 2,
      w,
      h: 0.2,
      fontSize: 8,
      color: mutedColor,
      fontFace: font,
      align: 'center',
    });
    return;
  }

  const labels = rows.map((r: any) =>
    r.pillar.length > 14 ? r.pillar.substring(0, 13) + '...' : r.pillar,
  );
  // Replace 0 or near-zero (<1) with null → no bar rendered, no data label rendered
  const prevVals = rows.map((r: any) => (!r.prevVal || r.prevVal < 1 ? null : r.prevVal)) as any[];
  const currVals = rows.map((r: any) => (!r.currVal || r.currVal < 1 ? null : r.currVal)) as any[];

  // Layout: two charts side by side, matching preview layout
  const pad = 0.06;
  const gap = 0.06;
  const titleH = 0.22;
  const lblH = 0.14;
  const chartY = y + titleH + lblH;
  const chartH = h - titleH - lblH - 0.05;
  const cW = (w - pad * 2 - gap) / 2;
  const cx1 = x + pad;
  const cx2 = cx1 + cW + gap;

  // Month labels
  slide.addText(prevLabel, {
    x: cx1,
    y: y + titleH,
    w: cW,
    h: lblH,
    fontSize: 5.5,
    color: mutedColor,
    fontFace: font,
    align: 'center',
  });
  slide.addText(currLabel, {
    x: cx2,
    y: y + titleH,
    w: cW,
    h: lblH,
    fontSize: 5.5,
    bold: true,
    color: primaryColor,
    fontFace: font,
    align: 'center',
  });

  // Centre divider
  slide.addShape('line' as any, {
    x: cx2 - gap / 2,
    y: y + titleH,
    w: 0,
    h: h - titleH - 0.04,
    line: { color: borderColor, width: 0.5 },
  });

  const sharedOpts = {
    barDir: 'bar',
    barGrouping: 'clustered',
    barGapWidthPct: 20,
    showLegend: false,
    showValue: true,
    dataLabelFontSize: 6.5,
    dataLabelColor: isDark ? 'FFFFFF' : '374151',
    dataLabelFormatCode: '#,##0.##;-#,##0.##;""',
    catAxisLabelFontSize: 5.5,
    catAxisLabelColor: mutedColor,
    valAxisLabelFontSize: 5.5,
    valAxisLabelColor: mutedColor,
    valLabelFormatCode: '#,##0;-#,##0;""',
    valAxisLineShow: false,
    catAxisLineShow: false,
    valGridLine: { style: 'none' as const },
    catGridLine: { style: 'none' as const },
    showTitle: false,
  } as any;

  // Left chart — previous month (blue)
  slide.addChart('bar' as any, [{ name: prevLabel, labels, values: prevVals }], {
    x: cx1,
    y: chartY,
    w: cW,
    h: chartH,
    chartColors: [BAR_PREV],
    ...sharedOpts,
  } as any);

  // Right chart — current month (primary color)
  slide.addChart('bar' as any, [{ name: currLabel, labels, values: currVals }], {
    x: cx2,
    y: chartY,
    w: cW,
    h: chartH,
    chartColors: [primaryColor],
    ...sharedOpts,
  } as any);
}

function drawDeltaPanel(
  slide: PptxGenJS.Slide,
  tv: SlideThemeVars,
  title: string,
  pillars: string[],
  deltas: IcCpDeltaRow[],
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const { font, isDark, cardBg, borderColor, primaryColor, mutedColor } = tv;

  slide.addShape('roundRect' as any, {
    x,
    y,
    w,
    h,
    fill: { color: cardBg },
    line: { color: borderColor, width: 0.75 },
    rectRadius: 0.08,
  });

  slide.addText(title, {
    x: x + 0.1,
    y: y + 0.06,
    w: w - 0.2,
    h: 0.18,
    fontSize: 6.5,
    bold: true,
    color: primaryColor,
    fontFace: font,
    align: 'left',
    valign: 'middle',
  });

  const deltaMap = Object.fromEntries(deltas.map((d: IcCpDeltaRow) => [d.content_pillar, d.inc]));
  const rowH = Math.min(0.22, (h - 0.28) / Math.max(pillars.length, 1));
  let ry = y + 0.28;

  pillars.forEach((p: string) => {
    const inc = (deltaMap as any)[p] ?? null;
    const label = fmtPct(inc);
    const color = inc === null ? mutedColor : inc >= 0 ? '16A34A' : 'DC2626';

    slide.addText(p.length > 12 ? p.substring(0, 11) + '...' : p, {
      x: x + 0.08,
      y: ry,
      w: w * 0.6,
      h: rowH,
      fontSize: 5.5,
      color: isDark ? '94A3B8' : '64748B',
      fontFace: font,
      align: 'left',
      valign: 'middle',
    });
    slide.addText(label, {
      x: x + w * 0.58,
      y: ry,
      w: w * 0.38,
      h: rowH,
      fontSize: 6,
      bold: true,
      color,
      fontFace: font,
      align: 'right',
      valign: 'middle',
    });
    ry += rowH;
  });
}

export function createIcIgCpEngNative(
  pptx: PptxGenJS,
  config: ReportConfig,
  data: IcIgCpEngExportData,
) {
  const slide = pptx.addSlide();
  const tv = getSlideThemeVars(config);
  drawSlideBackground(slide, pptx, config, tv);
  drawSlideDecorations(slide, pptx, tv);

  const aonLabel = data.aon ? 'AON (Brand-Owned)' : 'Non-AON (Client)';
  drawSlideHeader(
    slide,
    pptx,
    tv,
    `${config.clientName} \u2014 Content Pillar \u2014 ${aonLabel}`,
    'instagram',
    { subtitle: `${config.period} \u00b7 Avg Engagement & Total Post per Pillar` },
  );

  const { primaryColor, font } = tv;
  const prevLabel = monthLabelPptx(data.prevMonth);
  const currLabel = monthLabelPptx(data.currMonth);

  const engRows = buildAlignedRows(data.engCurr, data.engPrev);
  const postRows = buildAlignedRows(data.postCurr, data.postPrev);
  const allPillars = engRows.map((r: any) => r.pillar);

  const bodyY = 0.97;
  const bodyH = 5.15 - bodyY;
  const rowH = (bodyH - 0.1) / 2;
  const chartX = 0.3;
  const chartW = 7.0;
  const deltaX = 7.4;
  const deltaW = 2.25;

  drawCpBarChart(
    slide,
    tv,
    engRows,
    prevLabel,
    currLabel,
    'Average Engagement',
    chartX,
    bodyY,
    chartW,
    rowH,
  );
  drawDeltaPanel(
    slide,
    tv,
    'Avg Engagement \u0394',
    allPillars,
    data.deltaEng,
    deltaX,
    bodyY,
    deltaW,
    rowH,
  );

  drawCpBarChart(
    slide,
    tv,
    postRows,
    prevLabel,
    currLabel,
    'Total Post',
    chartX,
    bodyY + rowH + 0.1,
    chartW,
    rowH,
  );
  drawDeltaPanel(
    slide,
    tv,
    'Total Post \u0394',
    allPillars,
    data.deltaPost,
    deltaX,
    bodyY + rowH + 0.1,
    deltaW,
    rowH,
  );

  drawNativeFooter(slide, pptx, config, primaryColor, font, data.currentPage, data.totalPages);
}

// ─────────────────────────────────────────────────────────────────────────────
// Twitter: Growth (twitter_page_22)
// ─────────────────────────────────────────────────────────────────────────────
interface IcTwGrowthExportData {
  chartData: { date: string; new_follows: number; impressions: number; engagement: number }[];
  tableRows: {
    month: string;
    post_count: string;
    followers_growth: string;
    impressions: string;
    engagement: string;
  }[];
  insight: string;
  currentPage: number;
  totalPages: number;
}

export function createIcTwGrowthNative(
  pptx: PptxGenJS,
  config: ReportConfig,
  data: IcTwGrowthExportData,
) {
  const slide = pptx.addSlide();
  const tv = getSlideThemeVars(config);
  drawSlideBackground(slide, pptx, config, tv);
  drawSlideDecorations(slide, pptx, tv);
  drawSlideHeader(slide, pptx, tv, `${config.clientName} \u2014 Twitter Growth`, 'twitter', {
    subtitle: `${config.period} \u00b7 New Follows \u00b7 Impressions \u00b7 Engagement`,
  });

  const { font, isDark, textColor, mutedColor, cardBg, borderColor, primaryColor } = tv;
  const contentX = 0.3;
  const contentW = 9.4;
  const bodyY = 0.97;
  const footerY = 5.15;
  const bodyH = footerY - bodyY;
  const gap = 0.12;
  const insightW = contentW * 0.28;
  const chartAreaW = contentW - insightW - gap;
  const insightX = contentX + chartAreaW + gap;
  const tableH = 1.1;
  const tableGap = 0.08;
  const chartsH = bodyH - tableH - tableGap;

  slide.addShape(pptx.ShapeType.roundRect, {
    x: contentX,
    y: bodyY,
    w: chartAreaW,
    h: chartsH,
    fill: { color: cardBg },
    line: { color: borderColor, width: 0.75 },
    rectRadius: 0.08,
    shadow: { type: 'outer', blur: 4, offset: 1, color: '000000', opacity: 0.05 },
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: contentX,
    y: bodyY,
    w: chartAreaW,
    h: 0.03,
    fill: { color: primaryColor },
    line: { type: 'none' },
  });

  if (data.chartData.length > 0) {
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const labels = data.chartData.map((d) => {
      const parts = (d.date ?? '').split('-');
      if (parts.length >= 3) {
        const mo = parseInt(parts[1], 10);
        return `${monthNames[(mo - 1) % 12]}-${parts[2].slice(0, 2)}`;
      }
      return d.date ?? '';
    });
    const followsSeries = data.chartData.map((d) => d.new_follows ?? 0);
    const impSeries = data.chartData.map((d) => d.impressions ?? 0);
    const engSeries = data.chartData.map((d) => d.engagement ?? 0);
    const symSize = labels.length > 15 ? 2 : 4;
    const labelFreq = labels.length > 20 ? Math.ceil(labels.length / 10) : 1;
    const axisOpts = {
      showLegend: false,
      showTitle: false,
      lineSmooth: false,
      lineSize: 1.5,
      lineDataSymbolSize: symSize,
      valGridLine: { style: 'dash' as const, color: isDark ? '334155' : 'E2E8F0' },
      catGridLine: { style: 'none' as const },
      catAxisLabelFontSize: 6,
      valAxisLabelFontSize: 6,
      catAxisLabelColor: mutedColor,
      valAxisLabelColor: mutedColor,
      catAxisLineShow: false,
      valAxisLineShow: false,
      catAxisLabelFrequency: String(labelFreq),
    };
    const labelH = 0.12;
    const subGap = 0.04;
    const totalUsable = chartsH - 0.08 - 3 * labelH - 2 * subGap;
    const subH = totalUsable / 3;

    const c1Y = bodyY + 0.06;
    slide.addText('New Follows', {
      x: contentX + 0.1,
      y: c1Y,
      w: chartAreaW - 0.2,
      h: labelH,
      fontSize: 5.5,
      bold: true,
      color: isDark ? 'CBD5E1' : '475569',
      fontFace: font,
    });
    slide.addChart(pptx.ChartType.line, [{ name: 'New Follows', labels, values: followsSeries }], {
      ...axisOpts,
      valAxisMinVal: 0,
      chartColors: ['E67E22'],
      x: contentX + 0.05,
      y: c1Y + labelH,
      w: chartAreaW - 0.1,
      h: subH,
    });
    const c2Y = c1Y + labelH + subH + subGap;
    slide.addText('Impressions', {
      x: contentX + 0.1,
      y: c2Y,
      w: chartAreaW - 0.2,
      h: labelH,
      fontSize: 5.5,
      bold: true,
      color: isDark ? 'CBD5E1' : '475569',
      fontFace: font,
    });
    slide.addChart(pptx.ChartType.line, [{ name: 'Impressions', labels, values: impSeries }], {
      ...axisOpts,
      valAxisMinVal: 0,
      chartColors: ['3B82F6'],
      x: contentX + 0.05,
      y: c2Y + labelH,
      w: chartAreaW - 0.1,
      h: subH,
    });
    const c3Y = c2Y + labelH + subH + subGap;
    slide.addText('Engagement', {
      x: contentX + 0.1,
      y: c3Y,
      w: chartAreaW - 0.2,
      h: labelH,
      fontSize: 5.5,
      bold: true,
      color: isDark ? 'CBD5E1' : '475569',
      fontFace: font,
    });
    slide.addChart(pptx.ChartType.bar, [{ name: 'Engagement', labels, values: engSeries }], {
      ...axisOpts,
      valAxisMinVal: 0,
      chartColors: ['2980B9'],
      barDir: 'col' as const,
      x: contentX + 0.05,
      y: c3Y + labelH,
      w: chartAreaW - 0.1,
      h: subH,
    });
  }

  drawSlideInsight(slide, pptx, tv, {
    x: insightX,
    y: bodyY,
    w: insightW,
    h: chartsH,
    label: 'Analysis',
    text: data.insight || '',
  });

  const tableY = bodyY + chartsH + tableGap;
  const headers = ['Month', 'Post Count', 'Followers Growth', 'Impressions', 'Engagement'];
  if (data.tableRows.length > 0) {
    slide.addShape(pptx.ShapeType.roundRect, {
      x: contentX,
      y: tableY,
      w: contentW,
      h: tableH,
      fill: { color: cardBg },
      line: { color: borderColor, width: 0.75 },
      rectRadius: 0.08,
      shadow: { type: 'outer', blur: 4, offset: 1, color: '000000', opacity: 0.05 },
    });
    slide.addShape(pptx.ShapeType.rect, {
      x: contentX,
      y: tableY,
      w: contentW,
      h: 0.03,
      fill: { color: primaryColor },
      line: { type: 'none' },
    });
    const monthColW = 0.85;
    const otherColW = (contentW - monthColW - 0.1) / (headers.length - 1);
    const colWidths = [monthColW, ...Array(headers.length - 1).fill(otherColW)];
    const rowH_tbl = (tableH - 0.1) / (data.tableRows.length + 1);
    const headerRow = headers.map((h, ci) => ({
      text: h,
      options: {
        bold: true,
        fontSize: 6,
        color: 'FFFFFF',
        fontFace: font,
        align: (ci === 0 ? 'left' : 'center') as 'left' | 'center',
        fill: { color: primaryColor },
      },
    }));
    const dataRows = data.tableRows.map((row, ri) => {
      const vals = [
        row.month,
        row.post_count,
        row.followers_growth,
        row.impressions,
        row.engagement,
      ];
      return vals.map((cell, ci) => ({
        text: cell ?? '-',
        options: {
          fontSize: 6.5,
          color: textColor,
          fontFace: font,
          align: (ci === 0 ? 'left' : 'center') as 'left' | 'center',
          bold: ci === 0,
          fill: { color: ri % 2 === 0 ? cardBg : isDark ? '1A2535' : 'F8FAFC' },
        },
      }));
    });
    slide.addTable([headerRow, ...dataRows], {
      x: contentX + 0.05,
      y: tableY + 0.06,
      w: contentW - 0.1,
      h: tableH - 0.09,
      colW: colWidths,
      rowH: rowH_tbl,
      border: { type: 'solid', color: borderColor, pt: 0.4 },
      fontFace: font,
    });
  }

  drawNativeFooter(slide, pptx, config, primaryColor, font, data.currentPage, data.totalPages);
}

// ─────────────────────────────────────────────────────────────────────────────
// Twitter: Best & Least (twitter_page_24)
// ─────────────────────────────────────────────────────────────────────────────
interface IcTwPost {
  date: string | null;
  url: string | null;
  impressions: number | null;
  er: number | null;
  engagement: number | null;
  image_url?: string | null;
}

interface IcTwBestLeastExportData {
  highest: IcTwPost[];
  lowest: IcTwPost[];
  insight: string;
  currentPage: number;
  totalPages: number;
}

export function createIcTwBestLeastNative(
  pptx: PptxGenJS,
  config: ReportConfig,
  data: IcTwBestLeastExportData,
) {
  const slide = pptx.addSlide();
  const tv = getSlideThemeVars(config);
  drawSlideBackground(slide, pptx, config, tv);
  drawSlideDecorations(slide, pptx, tv);
  drawSlideHeader(slide, pptx, tv, `${config.clientName} \u2014 Twitter Best & Least`, 'twitter', {
    subtitle: `${config.period} \u00b7 Top 3 & Bottom 3 by Impressions`,
  });

  const { font, isDark, textColor, mutedColor, cardBg, borderColor, primaryColor } = tv;
  const COLOR_HIGH = '16A34A';
  const COLOR_LOW = 'DC2626';
  const contentX = 0.3;
  const contentW = 9.4;
  const bodyY = 0.97;
  const footerY = 5.15;
  const bodyH = footerY - bodyY;
  const gap = 0.1;
  const rightW = contentW * 0.28;
  const leftW = contentW - rightW - gap;
  const rightX = contentX + leftW + gap;
  const rowGap = 0.08;
  const rowH = (bodyH - rowGap) / 2;

  const drawPostRow = (posts: IcTwPost[], label: string, color: string, rowY: number) => {
    slide.addShape(pptx.ShapeType.roundRect, {
      x: contentX,
      y: rowY,
      w: leftW,
      h: 0.17,
      fill: { color, transparency: 88 },
      line: { color, width: 0.5, transparency: 70 },
      rectRadius: 0.04,
    });
    slide.addText(label, {
      x: contentX + 0.1,
      y: rowY,
      w: leftW - 0.2,
      h: 0.17,
      fontSize: 6.5,
      bold: true,
      color,
      fontFace: font,
      align: 'left',
      valign: 'middle',
    });
    const cardsY = rowY + 0.2;
    const cardsH = rowH - 0.2;
    const cardGap = 0.06;
    const cardW = (leftW - 2 * cardGap) / 3;
    // Vertical: image TOP 55%, metrics BOTTOM 45%
    const imgH = cardsH * 0.55;
    const metH = cardsH - imgH;

    posts.slice(0, 3).forEach((post, pi) => {
      const cx = contentX + pi * (cardW + cardGap);
      // Card bg
      slide.addShape(pptx.ShapeType.roundRect, {
        x: cx,
        y: cardsY,
        w: cardW,
        h: cardsH,
        fill: { color: cardBg },
        line: { color: borderColor, width: 0.5 },
        rectRadius: 0.05,
        shadow: { type: 'outer', blur: 3, offset: 1, color: '000000', opacity: 0.04 },
      });
      // Image — top
      if (post.image_url) {
        slide.addImage({ data: post.image_url, x: cx, y: cardsY, w: cardW, h: imgH });
      } else {
        slide.addShape(pptx.ShapeType.rect, {
          x: cx,
          y: cardsY,
          w: cardW,
          h: imgH,
          fill: { color: isDark ? '1E293B' : 'E2E8F0' },
          line: { type: 'none' },
        });
      }
      // Rank badge
      slide.addShape(pptx.ShapeType.roundRect, {
        x: cx + 0.04,
        y: cardsY + 0.04,
        w: 0.36,
        h: 0.16,
        fill: { color },
        line: { type: 'none' },
        rectRadius: 0.04,
      });
      slide.addText(`#${pi + 1}`, {
        x: cx + 0.04,
        y: cardsY + 0.04,
        w: 0.36,
        h: 0.16,
        fontSize: 6.5,
        bold: true,
        color: 'FFFFFF',
        fontFace: font,
        align: 'center',
        valign: 'middle',
      });
      // Metrics — bottom
      const metrics = [
        { label: 'Impress.', val: fmtNative(post.impressions) },
        { label: 'Eng.', val: fmtNative(post.engagement) },
        { label: 'ER', val: post.er != null ? `${Number(post.er).toFixed(2)}%` : '-' },
      ];
      const extraRows = (post.date ? 0.5 : 0) + (post.url ? 1 : 0);
      const mRowH = metH / (metrics.length + extraRows);
      metrics.forEach((m, mi) => {
        const my = cardsY + imgH + mi * mRowH;
        slide.addText(m.label, {
          x: cx + 0.04,
          y: my,
          w: cardW * 0.46,
          h: mRowH,
          fontSize: 4.5,
          color: mutedColor,
          fontFace: font,
          align: 'left',
          valign: 'middle',
        });
        slide.addText(m.val, {
          x: cx + cardW * 0.46,
          y: my,
          w: cardW * 0.54 - 0.04,
          h: mRowH,
          fontSize: 5,
          bold: true,
          color: textColor,
          fontFace: font,
          align: 'right',
          valign: 'middle',
        });
      });
      let off = metrics.length;
      if (post.date) {
        slide.addText(String(post.date).slice(0, 10), {
          x: cx + 0.04,
          y: cardsY + imgH + off * mRowH,
          w: cardW - 0.08,
          h: mRowH * 0.5,
          fontSize: 4,
          color: mutedColor,
          fontFace: font,
          align: 'left',
          valign: 'middle',
        });
        off += 0.5;
      }
      if (post.url) {
        slide.addText('View tweet', {
          x: cx + 0.04,
          y: cardsY + imgH + off * mRowH,
          w: cardW - 0.08,
          h: mRowH,
          fontSize: 4.5,
          bold: true,
          color: '3B82F6',
          fontFace: font,
          align: 'right',
          valign: 'middle',
          hyperlink: { url: post.url },
        });
      }
    });
  };

  drawPostRow(data.highest, 'HIGHEST BY IMPRESSIONS', COLOR_HIGH, bodyY);
  drawPostRow(data.lowest, 'LOWEST BY IMPRESSIONS', COLOR_LOW, bodyY + rowH + rowGap);

  // Analysis panel
  slide.addShape(pptx.ShapeType.roundRect, {
    x: rightX,
    y: bodyY,
    w: rightW,
    h: bodyH,
    fill: { color: cardBg },
    line: { color: borderColor, width: 0.75 },
    rectRadius: 0.08,
    shadow: { type: 'outer', blur: 4, offset: 1, color: '000000', opacity: 0.05 },
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: rightX,
    y: bodyY,
    w: rightW,
    h: 0.15,
    fill: { color: primaryColor, transparency: 85 },
    line: { type: 'none' },
  });
  slide.addText('Analysis', {
    x: rightX + 0.08,
    y: bodyY,
    w: rightW - 0.16,
    h: 0.15,
    fontSize: 6,
    bold: true,
    color: primaryColor,
    fontFace: font,
    align: 'left',
    valign: 'middle',
  });
  const insightText = data.insight
    ? data.insight
        .split('\n')
        .filter(Boolean)
        .map((l) =>
          l
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/^[-•]\s*/, '• ')
            .trim(),
        )
        .join('\n')
    : 'No insight generated.';
  slide.addText(insightText, {
    x: rightX + 0.08,
    y: bodyY + 0.18,
    w: rightW - 0.16,
    h: bodyH - 0.22,
    fontSize: 6.5,
    color: data.insight ? textColor : mutedColor,
    fontFace: font,
    align: 'left',
    valign: 'top',
    italic: !data.insight,
    paraSpaceAfter: 4,
    lineSpacingMultiple: 1.2,
    wrap: true,
  });

  drawNativeFooter(slide, pptx, config, primaryColor, font, data.currentPage, data.totalPages);
}

// ─────────────────────────────────────────────────────────────────────────────
// Twitter: Content Overview (twitter_page_23)
// ─────────────────────────────────────────────────────────────────────────────
interface IcTwContentPost {
  content_pillar: string;
  date: string | null;
  engagement: number | null;
  impressions: number | null;
  er: number | null;
  url: string | null;
  image_url?: string | null;
}

interface IcTwContentExportData {
  brandOwned: IcTwContentPost[];
  nonBrandOwned: IcTwContentPost[];
  insight: string;
  currentPage: number;
  totalPages: number;
}

export function createIcTwContentNative(
  pptx: PptxGenJS,
  config: ReportConfig,
  data: IcTwContentExportData,
) {
  const slide = pptx.addSlide();
  const tv = getSlideThemeVars(config);
  drawSlideBackground(slide, pptx, config, tv);
  drawSlideDecorations(slide, pptx, tv);
  drawSlideHeader(
    slide,
    pptx,
    tv,
    `${config.clientName} \u2014 Twitter Content Overview`,
    'twitter',
    {
      subtitle: `${config.period} \u00b7 by Impressions \u00b7 Brand-owned & Per-pillar`,
    },
  );

  const { font, isDark, textColor, mutedColor, cardBg, borderColor, primaryColor } = tv;
  const TW_BLUE = '0078D7';
  const contentX = 0.3;
  const contentW = 9.4;
  const bodyY = 0.97;
  const footerY = 5.15;
  const bodyH = footerY - bodyY;
  const gap = 0.1;
  const rightW = contentW * 0.32;
  const leftW = contentW - rightW - gap;
  const rightX = contentX + leftW + gap;
  const CARD_W = 130 / 96; // ~1.35"
  const cardGap = 0.08;

  const drawTwCard = (
    post: IcTwContentPost,
    accentColor: string,
    cx: number,
    cy: number,
    cardH: number,
  ) => {
    slide.addShape(pptx.ShapeType.roundRect, {
      x: cx,
      y: cy,
      w: CARD_W,
      h: cardH,
      fill: { color: cardBg },
      line: { color: borderColor, width: 0.5 },
      rectRadius: 0.05,
      shadow: { type: 'outer', blur: 3, offset: 1, color: '000000', opacity: 0.04 },
    });
    slide.addShape(pptx.ShapeType.rect, {
      x: cx,
      y: cy,
      w: CARD_W,
      h: 0.15,
      fill: { color: accentColor },
      line: { type: 'none' },
    });
    slide.addText((post.content_pillar || 'General').toUpperCase(), {
      x: cx + 0.04,
      y: cy,
      w: CARD_W - 0.08,
      h: 0.15,
      fontSize: 5,
      bold: true,
      color: 'FFFFFF',
      fontFace: font,
      align: 'left',
      valign: 'middle',
    });
    const imgH = cardH * 0.44;
    if (post.image_url) {
      slide.addImage({
        data: post.image_url,
        x: cx,
        y: cy + 0.15,
        w: CARD_W,
        h: imgH,
      });
    } else {
      slide.addShape(pptx.ShapeType.rect, {
        x: cx,
        y: cy + 0.15,
        w: CARD_W,
        h: imgH,
        fill: { color: isDark ? '1E293B' : 'E2E8F0' },
        line: { type: 'none' },
      });
    }
    const metY = cy + 0.15 + imgH;
    const metH = cardH - 0.15 - imgH;
    const metrics = [
      { label: 'Impress.', val: fmtNative(post.impressions) },
      { label: 'Eng.', val: fmtNative(post.engagement) },
      { label: 'ER', val: post.er != null ? `${Number(post.er).toFixed(2)}%` : '-' },
    ];
    const extraRows = (post.date ? 0.5 : 0) + (post.url ? 1 : 0);
    const mRowH = metH / (metrics.length + extraRows);
    metrics.forEach((m, mi) => {
      const my = metY + mi * mRowH;
      slide.addText(m.label, {
        x: cx + 0.03,
        y: my,
        w: CARD_W * 0.48,
        h: mRowH,
        fontSize: 4.5,
        color: mutedColor,
        fontFace: font,
        align: 'left',
        valign: 'middle',
      });
      slide.addText(m.val, {
        x: cx + CARD_W * 0.48,
        y: my,
        w: CARD_W * 0.52 - 0.03,
        h: mRowH,
        fontSize: 5,
        bold: true,
        color: textColor,
        fontFace: font,
        align: 'right',
        valign: 'middle',
      });
    });
    let off = metrics.length;
    if (post.date) {
      slide.addText(String(post.date).slice(0, 10), {
        x: cx + 0.03,
        y: metY + off * mRowH,
        w: CARD_W - 0.06,
        h: mRowH * 0.5,
        fontSize: 4,
        color: mutedColor,
        fontFace: font,
        align: 'left',
        valign: 'middle',
      });
      off += 0.5;
    }
    if (post.url) {
      slide.addText('View tweet', {
        x: cx + 0.03,
        y: metY + off * mRowH,
        w: CARD_W - 0.06,
        h: mRowH,
        fontSize: 4.5,
        bold: true,
        color: '3B82F6',
        fontFace: font,
        align: 'right',
        valign: 'middle',
        hyperlink: { url: post.url },
      });
    }
  };

  const brandH = bodyH * 0.35;
  const nonBrandH = bodyH - brandH - 0.08;
  const nonBrandY = bodyY + brandH + 0.08;

  // Brand-owned section
  slide.addShape(pptx.ShapeType.roundRect, {
    x: contentX,
    y: bodyY,
    w: leftW,
    h: brandH,
    fill: { color: cardBg },
    line: { color: borderColor, width: 0.75 },
    rectRadius: 0.08,
    shadow: { type: 'outer', blur: 4, offset: 1, color: '000000', opacity: 0.05 },
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: contentX,
    y: bodyY,
    w: leftW,
    h: 0.03,
    fill: { color: primaryColor },
    line: { type: 'none' },
  });
  slide.addText('Brand-owned', {
    x: contentX + 0.1,
    y: bodyY + 0.04,
    w: leftW - 0.2,
    h: 0.17,
    fontSize: 6,
    bold: true,
    color: primaryColor,
    fontFace: font,
    align: 'left',
    valign: 'middle',
  });
  if (data.brandOwned.length === 0) {
    slide.addText('No brand-owned data', {
      x: contentX + 0.1,
      y: bodyY + 0.28,
      w: leftW - 0.2,
      h: brandH - 0.32,
      fontSize: 7,
      color: mutedColor,
      fontFace: font,
      align: 'center',
      valign: 'middle',
    });
  } else {
    const cardH = brandH - 0.28;
    data.brandOwned
      .slice(0, 1)
      .forEach((post, i) =>
        drawTwCard(
          post,
          primaryColor,
          contentX + 0.1 + i * (CARD_W + cardGap),
          bodyY + 0.24,
          cardH,
        ),
      );
  }

  // Non-brand section
  slide.addShape(pptx.ShapeType.roundRect, {
    x: contentX,
    y: nonBrandY,
    w: leftW,
    h: nonBrandH,
    fill: { color: cardBg },
    line: { color: borderColor, width: 0.75 },
    rectRadius: 0.08,
    shadow: { type: 'outer', blur: 4, offset: 1, color: '000000', opacity: 0.05 },
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: contentX,
    y: nonBrandY,
    w: leftW,
    h: 0.03,
    fill: { color: TW_BLUE },
    line: { type: 'none' },
  });
  slide.addText('Non Brand-owned', {
    x: contentX + 0.1,
    y: nonBrandY + 0.04,
    w: leftW - 0.2,
    h: 0.17,
    fontSize: 6,
    bold: true,
    color: TW_BLUE,
    fontFace: font,
    align: 'left',
    valign: 'middle',
  });
  if (data.nonBrandOwned.length === 0) {
    slide.addText('No non-brand data', {
      x: contentX + 0.1,
      y: nonBrandY + 0.28,
      w: leftW - 0.2,
      h: nonBrandH - 0.32,
      fontSize: 7,
      color: mutedColor,
      fontFace: font,
      align: 'center',
      valign: 'middle',
    });
  } else {
    const cardH = nonBrandH - 0.28;
    data.nonBrandOwned
      .slice(0, 4)
      .forEach((post, i) =>
        drawTwCard(post, TW_BLUE, contentX + 0.1 + i * (CARD_W + cardGap), nonBrandY + 0.24, cardH),
      );
  }

  // Analysis panel (right, full height)
  slide.addShape(pptx.ShapeType.roundRect, {
    x: rightX,
    y: bodyY,
    w: rightW,
    h: bodyH,
    fill: { color: cardBg },
    line: { color: borderColor, width: 0.75 },
    rectRadius: 0.08,
    shadow: { type: 'outer', blur: 4, offset: 1, color: '000000', opacity: 0.05 },
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: rightX,
    y: bodyY,
    w: rightW,
    h: 0.15,
    fill: { color: primaryColor, transparency: 85 },
    line: { type: 'none' },
  });
  slide.addText('Analysis', {
    x: rightX + 0.08,
    y: bodyY,
    w: rightW - 0.16,
    h: 0.15,
    fontSize: 6,
    bold: true,
    color: primaryColor,
    fontFace: font,
    align: 'left',
    valign: 'middle',
  });
  const insightText = data.insight
    ? data.insight
        .split('\n')
        .filter(Boolean)
        .map((l) =>
          l
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/^[-•]\s*/, '• ')
            .trim(),
        )
        .join('\n')
    : 'No insight generated.';
  slide.addText(insightText, {
    x: rightX + 0.08,
    y: bodyY + 0.18,
    w: rightW - 0.16,
    h: bodyH - 0.22,
    fontSize: 6.5,
    color: data.insight ? textColor : mutedColor,
    fontFace: font,
    align: 'left',
    valign: 'top',
    italic: !data.insight,
    paraSpaceAfter: 4,
    lineSpacingMultiple: 1.2,
    wrap: true,
  });

  drawNativeFooter(slide, pptx, config, primaryColor, font, data.currentPage, data.totalPages);
}

// ─────────────────────────────────────────────────────────────────────────────
// Facebook: Growth (facebook_page_26)
// ─────────────────────────────────────────────────────────────────────────────
interface IcFbGrowthExportData {
  chartData: { date: string; follows: number; likes: number; engagement: number }[];
  tableRows: {
    month: string;
    post_count: string;
    fans_growth: string;
    post_reach: string;
    engagement: string;
  }[];
  insight: string;
  currentPage: number;
  totalPages: number;
}

export function createIcFbGrowthNative(
  pptx: PptxGenJS,
  config: ReportConfig,
  data: IcFbGrowthExportData,
) {
  const slide = pptx.addSlide();
  const tv = getSlideThemeVars(config);
  drawSlideBackground(slide, pptx, config, tv);
  drawSlideDecorations(slide, pptx, tv);
  drawSlideHeader(slide, pptx, tv, `${config.clientName} \u2014 Facebook Growth`, 'facebook', {
    subtitle: `${config.period} \u00b7 Follows \u00b7 Likes \u00b7 Engagement`,
  });

  const { font, isDark, textColor, mutedColor, cardBg, borderColor, primaryColor } = tv;
  const FB_BLUE = '2980B9'; // Follows — left axis
  const FB_ORANGE = 'E67E22'; // Likes   — right axis
  const FB_BAR = '3498DB'; // Engagement bar
  const contentX = 0.3;
  const contentW = 9.4;
  const bodyY = 0.97;
  const footerY = 5.15;
  const bodyH = footerY - bodyY;
  const gap = 0.12;
  const insightW = contentW * 0.28;
  const chartAreaW = contentW - insightW - gap;
  const insightX = contentX + chartAreaW + gap;
  const tableH = 1.1;
  const tableGap = 0.08;
  const chartsH = bodyH - tableH - tableGap;

  slide.addShape(pptx.ShapeType.roundRect, {
    x: contentX,
    y: bodyY,
    w: chartAreaW,
    h: chartsH,
    fill: { color: cardBg },
    line: { color: borderColor, width: 0.75 },
    rectRadius: 0.08,
    shadow: { type: 'outer', blur: 4, offset: 1, color: '000000', opacity: 0.05 },
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: contentX,
    y: bodyY,
    w: chartAreaW,
    h: 0.03,
    fill: { color: primaryColor },
    line: { type: 'none' },
  });

  if (data.chartData.length > 0) {
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const labels = data.chartData.map((d) => {
      const parts = (d.date ?? '').split('-');
      if (parts.length >= 3) {
        const mo = parseInt(parts[1], 10);
        return `${monthNames[(mo - 1) % 12]}-${parts[2].slice(0, 2)}`;
      }
      return d.date ?? '';
    });
    const followsSeries = data.chartData.map((d) => d.follows ?? 0);
    const likesSeries = data.chartData.map((d) => d.likes ?? 0);
    const engSeries = data.chartData.map((d) => d.engagement ?? 0);
    const symSize = labels.length > 15 ? 2 : 4;
    const labelFreq = labels.length > 20 ? Math.ceil(labels.length / 10) : 1;
    const axisOpts = {
      showLegend: false,
      showTitle: false,
      lineSmooth: false,
      lineSize: 1.5,
      lineDataSymbolSize: symSize,
      valGridLine: { style: 'dash' as const, color: isDark ? '334155' : 'E2E8F0' },
      catGridLine: { style: 'none' as const },
      catAxisLabelFontSize: 6,
      valAxisLabelFontSize: 6,
      catAxisLabelColor: mutedColor,
      valAxisLabelColor: mutedColor,
      catAxisLineShow: false,
      valAxisLineShow: false,
      catAxisLabelFrequency: String(labelFreq),
    };
    const labelH = 0.12;
    const subGap = 0.04;
    const totalUsable = chartsH - 0.08 - 3 * labelH - 2 * subGap;
    const subH = totalUsable / 3;

    const c1Y = bodyY + 0.06;
    slide.addText('Follows', {
      x: contentX + 0.1,
      y: c1Y,
      w: chartAreaW - 0.2,
      h: labelH,
      fontSize: 5.5,
      bold: true,
      color: isDark ? 'CBD5E1' : '475569',
      fontFace: font,
    });
    slide.addChart(pptx.ChartType.line, [{ name: 'Follows', labels, values: followsSeries }], {
      ...axisOpts,
      valAxisMinVal: 0,
      chartColors: [FB_BLUE],
      x: contentX + 0.05,
      y: c1Y + labelH,
      w: chartAreaW - 0.1,
      h: subH,
    });

    const c2Y = c1Y + labelH + subH + subGap;
    slide.addText('Likes', {
      x: contentX + 0.1,
      y: c2Y,
      w: chartAreaW - 0.2,
      h: labelH,
      fontSize: 5.5,
      bold: true,
      color: isDark ? 'CBD5E1' : '475569',
      fontFace: font,
    });
    slide.addChart(pptx.ChartType.line, [{ name: 'Likes', labels, values: likesSeries }], {
      ...axisOpts,
      valAxisMinVal: 0,
      chartColors: [FB_ORANGE],
      x: contentX + 0.05,
      y: c2Y + labelH,
      w: chartAreaW - 0.1,
      h: subH,
    });

    const c3Y = c2Y + labelH + subH + subGap;
    slide.addText('Engagement', {
      x: contentX + 0.1,
      y: c3Y,
      w: chartAreaW - 0.2,
      h: labelH,
      fontSize: 5.5,
      bold: true,
      color: isDark ? 'CBD5E1' : '475569',
      fontFace: font,
    });
    slide.addChart(pptx.ChartType.bar, [{ name: 'Engagement', labels, values: engSeries }], {
      ...axisOpts,
      valAxisMinVal: 0,
      chartColors: [FB_BAR],
      barDir: 'col',
      x: contentX + 0.05,
      y: c3Y + labelH,
      w: chartAreaW - 0.1,
      h: subH,
    });
  } else {
    slide.addText('No chart data available', {
      x: contentX + 0.1,
      y: bodyY + chartsH / 2 - 0.12,
      w: chartAreaW - 0.2,
      h: 0.25,
      fontSize: 8,
      color: mutedColor,
      fontFace: font,
      align: 'center',
    });
  }

  // Analysis panel (right)
  drawSlideInsight(slide, pptx, tv, {
    x: insightX,
    y: bodyY,
    w: insightW,
    h: chartsH,
    label: 'Analysis',
    text: data.insight || '',
  });

  // Summary table (bottom)
  const tableY = bodyY + chartsH + tableGap;
  slide.addShape(pptx.ShapeType.roundRect, {
    x: contentX,
    y: tableY,
    w: contentW,
    h: tableH,
    fill: { color: cardBg },
    line: { color: borderColor, width: 0.75 },
    rectRadius: 0.08,
    shadow: { type: 'outer', blur: 4, offset: 1, color: '000000', opacity: 0.05 },
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: contentX,
    y: tableY,
    w: contentW,
    h: 0.03,
    fill: { color: primaryColor },
    line: { type: 'none' },
  });

  if (data.tableRows.length > 0) {
    const colHeaders = ['Month', 'Post Count', 'Fans Growth', 'Post Reach', 'Engagement'];
    const tableW = contentW - 0.1;
    const colWidths = [1.68, 1.63, 1.73, 2.13, 2.13]; // sums to 9.3 = tableW
    const rowCount = data.tableRows.length;
    const rowH_tbl = (tableH - 0.09) / (rowCount + 1);
    const headerRow = colHeaders.map((h, ci) => ({
      text: h,
      options: {
        fontSize: 6.5,
        bold: true,
        color: 'FFFFFF' as string,
        fontFace: font,
        align: (ci === 0 ? 'left' : 'center') as 'left' | 'center',
        fill: { color: primaryColor },
      },
    }));
    const dataRows = data.tableRows.map((row, ri) => {
      const isGap = row.month === 'Gap';
      const vals = [row.month, row.post_count, row.fans_growth, row.post_reach, row.engagement];
      return vals.map((cell, ci) => {
        let cellColor = textColor;
        if (isGap && ci > 0) {
          const num = parseFloat((cell ?? '').replace('%', '').replace(/,/g, ''));
          if (!isNaN(num)) cellColor = num >= 0 ? '16A34A' : 'DC2626';
        }
        return {
          text: cell ?? '-',
          options: {
            fontSize: 6.5,
            color: cellColor,
            fontFace: font,
            align: (ci === 0 ? 'left' : 'center') as 'left' | 'center',
            bold: ci === 0 || isGap,
            fill: { color: ri % 2 === 0 ? cardBg : isDark ? '1A2535' : 'F8FAFC' },
          },
        };
      });
    });
    slide.addTable([headerRow, ...dataRows], {
      x: contentX + 0.05,
      y: tableY + 0.06,
      w: contentW - 0.1,
      h: tableH - 0.09,
      colW: colWidths,
      rowH: rowH_tbl,
      border: { type: 'solid', color: borderColor, pt: 0.4 },
      fontFace: font,
    });
  }

  drawNativeFooter(slide, pptx, config, primaryColor, font, data.currentPage, data.totalPages);
}

// ── IC Competitor Overview — native 3-table layout ────────────────────────────

interface IcCompIgRow {
  competitor: string;
  followers_inc: number | null;
  followers_growth: number | null;
  ig_engagement: number | null;
  ig_engagement_growth: number | null;
  er_folls: number | null;
}

interface IcCompTtRow {
  competitor: string;
  followers_growth: number | null;
  followers_growth_inc: number | null;
  engagement: number | null;
  engagement_inc: number | null;
  avg_views: number | null;
  avg_views_inc: number | null;
}

interface IcCompTwRow {
  competitor: string;
  followers_growth: number | null;
  followers_growth_inc: number | null;
  engagement: number | null;
  engagement_inc: number | null;
  er_folls: number | null;
}

interface IcCompOverviewExportData {
  igTable: IcCompIgRow[];
  ttTable: IcCompTtRow[];
  twTable: IcCompTwRow[];
  insight: string;
  currentPage: number;
  totalPages: number;
}

/** Format compact number (K/M) */
function _fmtNC(v: number | null): string {
  if (v === null || v === undefined) return '-';
  const n = Number(v);
  if (isNaN(n)) return '-';
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return Math.round(n).toLocaleString();
}

/** Format growth percentage — fraction heuristic same as slide */
function _fmtPctC(v: number | null): string {
  if (v === null || v === undefined) return '';
  const pct = Math.abs(v) < 2 ? v * 100 : v;
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
}

/** Format ER as percentage */
function _fmtERC(v: number | null): string {
  if (v === null || v === undefined) return '-';
  const n = Number(v);
  if (isNaN(n)) return '-';
  const pct = Math.abs(n) < 2 ? n * 100 : n;
  return `${pct.toFixed(2)}%`;
}

type _RTP = { text: string; options: Record<string, unknown> };

/** Build a richText cell with value on line 1 + coloured pct on line 2 */
function _growthCell(
  val: number | null,
  pct: number | null,
  textColor: string,
  font: string,
): { text: _RTP[] | string; options: { fontFace: string; align: 'center'; valign: 'middle' } } {
  const valStr = _fmtNC(val);
  const pctStr = _fmtPctC(pct);
  if (!pctStr) {
    return {
      text: valStr,
      options: { fontFace: font, align: 'center', valign: 'middle' },
    };
  }
  const numPct = pct !== null ? (Math.abs(pct) < 2 ? pct * 100 : pct) : 0;
  const pctColor = numPct >= 0 ? '16A34A' : 'DC2626';
  return {
    text: [
      { text: valStr, options: { fontSize: 8, bold: true, color: textColor, breakLine: true } },
      { text: pctStr, options: { fontSize: 6.5, bold: true, color: pctColor } },
    ],
    options: { fontFace: font, align: 'center', valign: 'middle' },
  };
}

/**
 * Draw one platform table card inside a slide.
 * @param accentColor 6-char hex (no #)  e.g. 'E1306C'
 * @param headers     column header strings
 * @param rows        array of cell objects — each cell is { text, options } or richText
 */
function _drawCompTable(
  slide: PptxGenJS.Slide,
  pptx: PptxGenJS,
  tv: SlideThemeVars,
  opts: {
    x: number;
    y: number;
    w: number;
    h: number;
    platformLabel: string;
    accentColor: string;
    headers: string[];
    rows: ReturnType<typeof _growthCell>[][];
  },
) {
  const { font, textColor, mutedColor, cardBg, borderColor, isDark } = tv;
  const { x, y, w, h, headers, rows } = opts;

  // Card background
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    fill: { color: cardBg },
    line: { color: borderColor, width: 0.75 },
    rectRadius: 0.08,
    shadow: { type: 'outer', blur: 4, offset: 1, color: '000000', opacity: 0.05 },
  });

  // Table inside card
  const tblY = y + 0.04;
  const tblH = h - 0.08;

  if (rows.length === 0) {
    slide.addText('No data available', {
      x: x + 0.05,
      y: tblY,
      w: w - 0.1,
      h: tblH,
      fontSize: 8,
      color: mutedColor,
      align: 'center',
      valign: 'middle',
      fontFace: font,
    });
    return;
  }

  const colCount = headers.length;
  const nameColW = w * 0.32;
  const otherColW = (w - nameColW - 0.08) / (colCount - 1);
  const colWidths = [nameColW, ...Array(colCount - 1).fill(otherColW)];
  const rowH_each = (tblH - 0.04) / (rows.length + 1);

  // Header row
  const headerRow = headers.map((h, ci) => ({
    text: h,
    options: {
      bold: true,
      fontSize: 6.5,
      color: mutedColor,
      fontFace: font,
      align: (ci === 0 ? 'left' : 'center') as 'left' | 'center',
      fill: { color: isDark ? '1E293B' : 'F1F5F9' },
      valign: 'middle' as const,
    },
  }));

  // Data rows
  const dataRows = rows.map((row, ri) =>
    row.map((cell, ci) => {
      const rowFill = { color: ri % 2 === 0 ? cardBg : isDark ? '1A2535' : 'F8FAFC' };
      if (ci === 0) {
        // Competitor name column — plain text, left-aligned
        return {
          text: typeof cell.text === 'string' ? cell.text : '',
          options: {
            fontSize: 8,
            bold: true,
            color: textColor,
            fontFace: font,
            align: 'left' as const,
            valign: 'middle' as const,
            fill: rowFill,
          },
        };
      }
      if (typeof cell.text === 'string') {
        return {
          text: cell.text,
          options: {
            fontSize: 8,
            color: textColor,
            fontFace: font,
            align: 'center' as const,
            valign: 'middle' as const,
            fill: rowFill,
          },
        };
      }
      // richText cell
      return {
        text: (cell.text as _RTP[]).map((p) => ({ text: p.text, options: p.options })),
        options: {
          ...cell.options,
          fill: rowFill,
        },
      };
    }),
  );

  slide.addTable([headerRow, ...dataRows] as any, {
    x: x + 0.04,
    y: tblY,
    w: w - 0.08,
    h: tblH,
    colW: colWidths,
    rowH: rowH_each,
    border: { type: 'solid', color: borderColor, pt: 0.3 },
    fontFace: font,
  });
}

export function createIcCompOverviewNative(
  pptx: PptxGenJS,
  config: ReportConfig,
  data: IcCompOverviewExportData,
) {
  const slide = pptx.addSlide();
  const tv = getSlideThemeVars(config);
  drawSlideBackground(slide, pptx, config, tv);
  drawSlideDecorations(slide, pptx, tv);

  const { font, primaryColor, textColor } = tv;

  // ── Custom header with 3 badges ──────────────────────────────────────────
  const { headerX, headerY, headerW, headerH } = drawSlideHeader(
    slide,
    pptx,
    tv,
    `${config.clientName} \u2014 Competitor Overview`,
    undefined, // no single channel — we add 3 badges manually below
    {
      subtitle: `${config.period} \u00b7 Competitor Analysis`,
    },
  );

  // 3 small channel badges on the far right of the header
  const badgeSize = 0.3;
  const badgeGap = 0.06;
  const totalBadgesW = 3 * badgeSize + 2 * badgeGap;
  let bx = headerX + headerW - totalBadgesW - 0.08;
  const by = headerY + (headerH - badgeSize) / 2;
  for (const ch of ['instagram', 'tiktok', 'twitter'] as const) {
    const svg = getChannelBadgeSvg(ch);
    if (svg) {
      slide.addImage({ data: svg, x: bx, y: by, w: badgeSize, h: badgeSize });
    }
    bx += badgeSize + badgeGap;
  }

  // ── 3 Side-by-side table cards ──────────────────────────────────────────
  const contentX = 0.3;
  const contentW = 9.4;
  const bodyY = headerY + headerH + 0.1; // just below header
  const footerTop = 5.15;
  const insightH = 1.4;
  const insightGap = 0.1;
  const tablesH = footerTop - bodyY - insightH - insightGap - 0.05;

  const tblGap = 0.1;
  const tblW = (contentW - 2 * tblGap) / 3;

  // IG table
  const igRows = data.igTable.map((r) => [
    {
      text: r.competitor,
      options: { fontFace: font, align: 'left' as const, valign: 'middle' as const },
    },
    _growthCell(r.followers_inc, r.followers_growth, textColor, font),
    _growthCell(r.ig_engagement, r.ig_engagement_growth, textColor, font),
    {
      text: _fmtERC(r.er_folls),
      options: { fontFace: font, align: 'center' as const, valign: 'middle' as const },
    },
  ]);

  _drawCompTable(slide, pptx, tv, {
    x: contentX,
    y: bodyY,
    w: tblW,
    h: tablesH,
    platformLabel: 'Instagram',
    accentColor: 'E1306C',
    headers: ['Competitor', 'Followers Growth', 'Engagement', 'ER Folls'],
    rows: igRows as any,
  });

  // TikTok table
  const ttRows = data.ttTable.map((r) => [
    {
      text: r.competitor,
      options: { fontFace: font, align: 'left' as const, valign: 'middle' as const },
    },
    _growthCell(r.followers_growth, r.followers_growth_inc, textColor, font),
    _growthCell(r.engagement, r.engagement_inc, textColor, font),
    _growthCell(r.avg_views, r.avg_views_inc, textColor, font),
  ]);

  _drawCompTable(slide, pptx, tv, {
    x: contentX + tblW + tblGap,
    y: bodyY,
    w: tblW,
    h: tablesH,
    platformLabel: 'TikTok',
    accentColor: 'EE1D52',
    headers: ['Competitor', 'Followers Growth', 'Engagement', 'Avg Views'],
    rows: ttRows as any,
  });

  // Twitter table
  const twRows = data.twTable.map((r) => [
    {
      text: r.competitor,
      options: { fontFace: font, align: 'left' as const, valign: 'middle' as const },
    },
    _growthCell(r.followers_growth, r.followers_growth_inc, textColor, font),
    _growthCell(r.engagement, r.engagement_inc, textColor, font),
    {
      text: _fmtERC(r.er_folls),
      options: { fontFace: font, align: 'center' as const, valign: 'middle' as const },
    },
  ]);

  _drawCompTable(slide, pptx, tv, {
    x: contentX + 2 * (tblW + tblGap),
    y: bodyY,
    w: tblW,
    h: tablesH,
    platformLabel: 'Twitter / X',
    accentColor: '1DA1F2',
    headers: ['Competitor', 'Followers Growth', 'Engagement', 'ER Folls'],
    rows: twRows as any,
  });

  // ── Insight box ─────────────────────────────────────────────────────────
  const insightY = bodyY + tablesH + insightGap;
  drawSlideInsight(slide, pptx, tv, {
    x: contentX,
    y: insightY,
    w: contentW,
    h: insightH,
    label: 'Analysis & Insights',
    text: data.insight || '',
  });

  drawNativeFooter(slide, pptx, config, primaryColor, font, data.currentPage, data.totalPages);
}

// ── IC Competitor Detail — native 3-channel post-card layout ─────────────────

interface IcCompDetailPost {
  ig_engagement?: number | null;
  permalink?: string | null;
  play_count?: number | null;
  engagement_b?: number | null;
  url?: string | null;
  image_url?: string | null;
}

interface IcCompDetailExportData {
  competitor: string;
  igPosts: { ig_engagement: number | null; permalink: string | null; image_url?: string | null }[];
  ttPosts: {
    play_count: number | null;
    engagement_b: number | null;
    url: string | null;
    image_url?: string | null;
  }[];
  twPosts: { engagement_b: number | null; url: string | null; image_url?: string | null }[];
  narrative: string;
  currentPage: number;
  totalPages: number;
}

export function createIcCompDetailNative(
  pptx: PptxGenJS,
  config: ReportConfig,
  data: IcCompDetailExportData,
) {
  const slide = pptx.addSlide();
  const tv = getSlideThemeVars(config);
  drawSlideBackground(slide, pptx, config, tv);
  drawSlideDecorations(slide, pptx, tv);

  const { font, primaryColor, textColor, mutedColor, cardBg, borderColor, isDark } = tv;

  // ── Header ─────────────────────────────────────────────────────────────────
  const { headerX, headerY, headerW, headerH } = drawSlideHeader(
    slide,
    pptx,
    tv,
    data.competitor || 'Competitor Detail',
    undefined,
    {
      subtitle: `${config.period} \u00b7 Top 3 Posts per Channel`,
    },
  );

  // 3 channel badges on right side of header
  const badgeSize = 0.3;
  const badgeGap = 0.06;
  let bx = headerX + headerW - 3 * badgeSize - 2 * badgeGap - 0.08;
  const by = headerY + (headerH - badgeSize) / 2;
  for (const ch of ['instagram', 'tiktok', 'twitter'] as const) {
    const svg = getChannelBadgeSvg(ch);
    if (svg) slide.addImage({ data: svg, x: bx, y: by, w: badgeSize, h: badgeSize });
    bx += badgeSize + badgeGap;
  }

  // ── Body layout ────────────────────────────────────────────────────────────
  const contentX = 0.3;
  const contentW = 9.4;
  const bodyY = headerY + headerH + 0.08;
  const footerTop = 5.15;
  const bodyH = footerTop - bodyY - 0.05;

  const narrativeW = 2.1;
  const narrativeGap = 0.12;
  const postsX = contentX;
  const postsW = contentW - narrativeW - narrativeGap;
  const narrativeX = contentX + postsW + narrativeGap;

  const rowCount = 3;
  const rowGap = 0.06;
  const rowH = (bodyH - (rowCount - 1) * rowGap) / rowCount;
  const labelH = 0.22;
  const cardGap = 0.05;
  const cardAreaH = rowH - labelH - 0.03;
  const cardW = (postsW - 2 * cardGap) / 3;
  const imgW = cardW * 0.45;
  const metricsW = cardW - imgW;

  type ChannelCfg = {
    label: string;
    color: string;
    posts: IcCompDetailPost[];
    getMetrics: (p: IcCompDetailPost) => { label: string; value: string }[];
    getUrl: (p: IcCompDetailPost) => string | null | undefined;
  };

  const channelCfg: ChannelCfg[] = [
    {
      label: 'Instagram',
      color: 'E1306C',
      posts: data.igPosts as IcCompDetailPost[],
      getMetrics: (p) => [{ label: 'Engagement', value: _fmtNC(p.ig_engagement ?? null) }],
      getUrl: (p) => p.permalink,
    },
    {
      label: 'TikTok',
      color: 'EE1D52',
      posts: data.ttPosts as IcCompDetailPost[],
      getMetrics: (p) => [
        { label: 'Views', value: _fmtNC(p.play_count ?? null) },
        { label: 'Engagement', value: _fmtNC(p.engagement_b ?? null) },
      ],
      getUrl: (p) => p.url,
    },
    {
      label: 'Twitter / X',
      color: '1DA1F2',
      posts: data.twPosts as IcCompDetailPost[],
      getMetrics: (p) => [{ label: 'Engagement', value: _fmtNC(p.engagement_b ?? null) }],
      getUrl: (p) => p.url,
    },
  ];

  channelCfg.forEach(({ label, color, posts, getMetrics, getUrl }, rowIdx) => {
    const rowY = bodyY + rowIdx * (rowH + rowGap);

    // Coloured channel label band
    slide.addShape(pptx.ShapeType.roundRect, {
      x: postsX,
      y: rowY,
      w: postsW,
      h: labelH,
      fill: { color },
      line: { type: 'none' },
      rectRadius: 0.04,
    });
    slide.addText(label, {
      x: postsX,
      y: rowY,
      w: postsW,
      h: labelH,
      fontSize: 8,
      bold: true,
      color: 'FFFFFF',
      align: 'center',
      valign: 'middle',
      fontFace: font,
    });

    const cardY = rowY + labelH + 0.03;

    for (let cardIdx = 0; cardIdx < 3; cardIdx++) {
      const cardX = postsX + cardIdx * (cardW + cardGap);
      const post = posts[cardIdx] || null;

      // --- Empty placeholder ---
      if (!post) {
        slide.addShape(pptx.ShapeType.roundRect, {
          x: cardX,
          y: cardY,
          w: cardW,
          h: cardAreaH,
          fill: { color: isDark ? '1A2535' : 'FAFAFA' },
          line: { color: isDark ? '334155' : 'E2E8F0', width: 0.5, dashType: 'dash' },
          rectRadius: 0.05,
        });
        continue;
      }

      // --- Card background ---
      slide.addShape(pptx.ShapeType.roundRect, {
        x: cardX,
        y: cardY,
        w: cardW,
        h: cardAreaH,
        fill: { color: cardBg },
        line: { color: borderColor, width: 0.5 },
        rectRadius: 0.05,
        shadow: { type: 'outer', blur: 2, offset: 1, color: '000000', opacity: 0.05 },
      });

      // --- Image area (left ~45%) ---
      slide.addShape(pptx.ShapeType.roundRect, {
        x: cardX,
        y: cardY,
        w: imgW,
        h: cardAreaH,
        fill: { color: isDark ? '334155' : 'CBD5E1' },
        line: { type: 'none' },
        rectRadius: 0.05,
      });
      slide.addShape(pptx.ShapeType.rect, {
        x: cardX + imgW - 0.05,
        y: cardY,
        w: 0.06,
        h: cardAreaH,
        fill: { color: isDark ? '334155' : 'CBD5E1' },
        line: { type: 'none' },
      });
      if (post.image_url) {
        slide.addImage({
          data: post.image_url,
          x: cardX,
          y: cardY,
          w: imgW,
          h: cardAreaH,
          sizing: { type: 'cover', w: imgW, h: cardAreaH },
        });
      }
      // Rank badge
      slide.addShape(pptx.ShapeType.roundRect, {
        x: cardX + 0.04,
        y: cardY + 0.04,
        w: 0.32,
        h: 0.17,
        fill: { color },
        line: { type: 'none' },
        rectRadius: 0.04,
      });
      slide.addText(`#${cardIdx + 1}`, {
        x: cardX + 0.04,
        y: cardY + 0.04,
        w: 0.32,
        h: 0.17,
        fontSize: 7,
        bold: true,
        color: 'FFFFFF',
        align: 'center',
        valign: 'middle',
        fontFace: font,
        wrap: false,
      });

      // --- Metrics (right half) ---
      const mx = cardX + imgW + 0.05;
      const mw = metricsW - 0.08;
      const metrics = getMetrics(post);
      const metricRowH = 0.15;
      const metricGap = 0.04;
      const startY = cardY + 0.07;

      metrics.forEach(({ label: mLabel, value }, mi) => {
        const my = startY + mi * (metricRowH * 2 + metricGap);
        slide.addText(mLabel, {
          x: mx,
          y: my,
          w: mw,
          h: metricRowH,
          fontSize: 5.5,
          color: mutedColor,
          fontFace: font,
          align: 'left',
        });
        slide.addText(value, {
          x: mx,
          y: my + metricRowH,
          w: mw,
          h: metricRowH,
          fontSize: 7.5,
          bold: true,
          color: textColor,
          fontFace: font,
          align: 'left',
        });
      });

      // Link row at bottom of metrics
      const urlStr = getUrl(post);
      const linkY = cardY + cardAreaH - 0.19;
      slide.addShape(pptx.ShapeType.line, {
        x: mx,
        y: linkY,
        w: mw,
        h: 0,
        line: { color: borderColor, width: 0.3 },
      });
      slide.addText(urlStr ? 'View Post \u2197' : '—', {
        x: mx,
        y: linkY + 0.04,
        w: mw,
        h: 0.13,
        fontSize: 5.5,
        bold: !!urlStr,
        color: urlStr ? '3B82F6' : mutedColor,
        fontFace: font,
        align: 'left',
      });
    }
  });

  // ── Narrative panel (right) ────────────────────────────────────────────────
  // Card
  slide.addShape(pptx.ShapeType.roundRect, {
    x: narrativeX,
    y: bodyY,
    w: narrativeW,
    h: bodyH,
    fill: { color: cardBg },
    line: { color: borderColor, width: 0.75 },
    rectRadius: 0.08,
    shadow: { type: 'outer', blur: 4, offset: 1, color: '000000', opacity: 0.05 },
  });
  // Header band
  slide.addShape(pptx.ShapeType.roundRect, {
    x: narrativeX,
    y: bodyY,
    w: narrativeW,
    h: 0.3,
    fill: { color: isDark ? '1E293B' : 'F1F5F9' },
    line: { type: 'none' },
    rectRadius: 0.08,
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: narrativeX,
    y: bodyY + 0.15,
    w: narrativeW,
    h: 0.16,
    fill: { color: isDark ? '1E293B' : 'F1F5F9' },
    line: { type: 'none' },
  });
  slide.addShape(pptx.ShapeType.line, {
    x: narrativeX,
    y: bodyY + 0.3,
    w: narrativeW,
    h: 0,
    line: { color: borderColor, width: 0.5 },
  });
  slide.addText('NARRATIVE', {
    x: narrativeX + 0.1,
    y: bodyY + 0.06,
    w: narrativeW - 0.2,
    h: 0.2,
    fontSize: 7,
    bold: true,
    color: mutedColor,
    fontFace: font,
    align: 'left',
    valign: 'middle',
  });
  // Text content
  slide.addText(data.narrative || (isDark ? '' : 'Add analysis here\u2026'), {
    x: narrativeX + 0.1,
    y: bodyY + 0.35,
    w: narrativeW - 0.2,
    h: bodyH - 0.42,
    fontSize: 7.5,
    color: data.narrative ? textColor : mutedColor,
    fontFace: font,
    valign: 'top',
    wrap: true,
  });

  drawNativeFooter(slide, pptx, config, primaryColor, font, data.currentPage, data.totalPages);
}

// ── Chapter 7: Competitor Instagram Focus ──────────────────────────────────
interface IcCompIgFocusExportData {
  competitor: string;
  top3: Array<{
    ig_engagement: number | null;
    likes: number | null;
    comments: number | null;
    er_folls: number | null;
    permalink: string | null;
    image_url?: string | null;
  }>;
  growthSeries: Array<{ date: string; daily_foll_growth: number | null }>;
  mainBrandRow: {
    brand: string;
    followers_growth: number | null;
    followers_growth_gap: number | null;
    post_count: number | null;
    post_count_growth: number | null;
    total_engagement: number | null;
    total_engagement_gap: number | null;
    avg_er_folls_b: number | null;
  } | null;
  compRow: {
    brand: string;
    ig_followers_increase: number | null;
    ig_followers_growth: number | null;
    post_count: number | null;
    post_count_growth: number | null;
    ig_engagement_b: number | null;
    ig_engagement_b_growth: number | null;
    er_folls: number | null;
  } | null;
  narrative: string;
  currentPage: number;
  totalPages: number;
}

export function createIcCompIgFocusNative(
  pptx: PptxGenJS,
  config: ReportConfig,
  data: IcCompIgFocusExportData,
) {
  const slide = pptx.addSlide();
  const tv = getSlideThemeVars(config);
  drawSlideBackground(slide, pptx, config, tv);
  drawSlideDecorations(slide, pptx, tv);

  const { font, primaryColor, textColor, mutedColor, cardBg, borderColor, isDark } = tv;

  // ── Header ────────────────────────────────────────────────────────────────
  const { headerX, headerY, headerW, headerH } = drawSlideHeader(
    slide,
    pptx,
    tv,
    `${data.competitor || 'Competitor'} — Instagram Focus`,
    'instagram',
    { subtitle: `${config.period} · Top Posts · Followers Growth · Performance` },
  );

  // ── Body layout ────────────────────────────────────────────────────────────
  const contentX = 0.3;
  const contentW = 9.4;
  const bodyY = headerY + headerH + 0.08;
  const footerTop = 5.15;
  const bodyH = footerTop - bodyY - 0.05;

  const narrativeW = 2.0;
  const narrativeGap = 0.1;
  const leftW = contentW - narrativeW - narrativeGap;
  const leftX = contentX;
  const narrativeX = contentX + leftW + narrativeGap;

  const secGap = 0.06;
  const postsH = 1.5; // 0.2" band + 1.3" cards
  const tableH = 0.95;
  const chartH = bodyH - postsH - tableH - 2 * secGap;

  let curY = bodyY;

  // ── TOP 3 POST CARDS ───────────────────────────────────────────────────────
  // Pink IG band
  slide.addShape(pptx.ShapeType.roundRect, {
    x: leftX,
    y: curY,
    w: leftW,
    h: 0.2,
    fill: { color: 'E1306C' },
    line: { type: 'none' },
    rectRadius: 0.04,
  });
  slide.addText('Instagram · Top 3 Posts', {
    x: leftX,
    y: curY,
    w: leftW,
    h: 0.2,
    fontSize: 7,
    bold: true,
    color: 'FFFFFF',
    align: 'center',
    valign: 'middle',
    fontFace: font,
  });
  curY += 0.2;

  const cardAreaH = postsH - 0.2;
  const cardGap = 0.05;
  const cardW = (leftW - 2 * cardGap) / 3;
  const imgW = cardW * 0.44;

  for (let ci = 0; ci < 3; ci++) {
    const cardX = leftX + ci * (cardW + cardGap);
    const post = data.top3[ci] || null;

    // Card background
    slide.addShape(pptx.ShapeType.roundRect, {
      x: cardX,
      y: curY,
      w: cardW,
      h: cardAreaH,
      fill: { color: post ? cardBg : isDark ? '1A2535' : 'FAFAFA' },
      line: {
        color: post ? borderColor : isDark ? '334155' : 'E2E8F0',
        width: 0.5,
        dashType: post ? 'solid' : 'dash',
      },
      rectRadius: 0.05,
    });

    if (post) {
      // Image area (left 44%)
      slide.addShape(pptx.ShapeType.roundRect, {
        x: cardX,
        y: curY,
        w: imgW,
        h: cardAreaH,
        fill: { color: isDark ? '334155' : 'CBD5E1' },
        line: { type: 'none' },
        rectRadius: 0.05,
      });
      slide.addShape(pptx.ShapeType.rect, {
        x: cardX + imgW - 0.05,
        y: curY,
        w: 0.06,
        h: cardAreaH,
        fill: { color: isDark ? '334155' : 'CBD5E1' },
        line: { type: 'none' },
      });
      if (post.image_url) {
        slide.addImage({
          data: post.image_url,
          x: cardX,
          y: curY,
          w: imgW,
          h: cardAreaH,
          sizing: { type: 'cover', w: imgW, h: cardAreaH },
        });
      }

      // Rank badge
      slide.addShape(pptx.ShapeType.roundRect, {
        x: cardX + 0.04,
        y: curY + 0.04,
        w: 0.32,
        h: 0.17,
        fill: { color: 'E1306C' },
        line: { type: 'none' },
        rectRadius: 0.04,
      });
      slide.addText(`#${ci + 1}`, {
        x: cardX + 0.04,
        y: curY + 0.04,
        w: 0.32,
        h: 0.17,
        fontSize: 7,
        bold: true,
        color: 'FFFFFF',
        align: 'center',
        valign: 'middle',
        fontFace: font,
        wrap: false,
      });

      // Metrics (right side)
      const mx = cardX + imgW + 0.05;
      const mw = cardW - imgW - 0.08;
      const mRowH = 0.12;
      const mGap = 0.02;
      const metrics = [
        { label: 'Engagement', value: _fmtNC(post.ig_engagement) },
        { label: 'Likes', value: _fmtNC(post.likes) },
        { label: 'Comments', value: _fmtNC(post.comments) },
        { label: 'ER Folls', value: _fmtERC(post.er_folls) },
      ];
      let my = curY + 0.05;
      for (const { label, value } of metrics) {
        slide.addText(label, {
          x: mx,
          y: my,
          w: mw,
          h: mRowH,
          fontSize: 5,
          color: mutedColor,
          fontFace: font,
          align: 'left',
        });
        slide.addText(value, {
          x: mx,
          y: my + mRowH,
          w: mw,
          h: mRowH,
          fontSize: 6.5,
          bold: true,
          color: textColor,
          fontFace: font,
          align: 'left',
        });
        my += mRowH * 2 + mGap;
      }

      // View Post link at bottom
      const linkY = curY + cardAreaH - 0.18;
      slide.addShape(pptx.ShapeType.line, {
        x: mx,
        y: linkY,
        w: mw,
        h: 0,
        line: { color: borderColor, width: 0.3 },
      });
      slide.addText(post.permalink ? 'View Post \u2197' : '\u2014', {
        x: mx,
        y: linkY + 0.03,
        w: mw,
        h: 0.13,
        fontSize: 5,
        bold: !!post.permalink,
        color: post.permalink ? '3B82F6' : mutedColor,
        fontFace: font,
        align: 'left',
      });
    }
  }
  curY += cardAreaH + secGap;

  // ── FOLLOWERS GROWTH CHART ────────────────────────────────────────────────
  slide.addShape(pptx.ShapeType.roundRect, {
    x: leftX,
    y: curY,
    w: leftW,
    h: chartH,
    fill: { color: cardBg },
    line: { color: borderColor, width: 0.5 },
    rectRadius: 0.06,
  });
  slide.addText('Daily Followers Growth', {
    x: leftX + 0.1,
    y: curY + 0.05,
    w: leftW - 0.2,
    h: 0.18,
    fontSize: 6.5,
    bold: true,
    color: mutedColor,
    fontFace: font,
  });

  const growthLabels = data.growthSeries.map((g) => {
    const d = new Date(g.date);
    return `${d.toLocaleString('default', { month: 'short' })} ${d.getDate()}`;
  });
  const growthValues = data.growthSeries.map((g) => g.daily_foll_growth ?? 0);

  if (growthLabels.length > 0) {
    slide.addChart(
      pptx.ChartType.line,
      [{ name: 'Foll. Growth', labels: growthLabels, values: growthValues }],
      {
        x: leftX + 0.05,
        y: curY + 0.23,
        w: leftW - 0.1,
        h: chartH - 0.28,
        chartColors: ['E1306C'],
        showLegend: false,
        showTitle: false,
        valGridLine: { style: 'dash', color: isDark ? '334155' : 'E5E7EB' },
        catGridLine: { style: 'none' },
        catAxisLabelFontSize: 7,
        valAxisLabelFontSize: 7,
        catAxisLabelColor: mutedColor,
        valAxisLabelColor: mutedColor,
        lineDataSymbol: 'none',
        lineSize: 1.5,
      } as Record<string, unknown>,
    );
  } else {
    slide.addText('No growth data available', {
      x: leftX + 0.1,
      y: curY + 0.23,
      w: leftW - 0.2,
      h: chartH - 0.28,
      fontSize: 8,
      color: mutedColor,
      fontFace: font,
      align: 'center',
      valign: 'middle',
    });
  }
  curY += chartH + secGap;

  // ── COMPARISON TABLE ──────────────────────────────────────────────────────
  const tblHeaders = ['Brand', 'Flw. Growth', 'Post Count', 'Engagement', 'ER Folls'];

  const nameCell = (name: string) => ({
    text: name,
    options: { fontFace: font, align: 'center' as const, valign: 'middle' as const },
  });
  const erCell = (v: number | null) => ({
    text: _fmtERC(v),
    options: { fontFace: font, align: 'center' as const, valign: 'middle' as const },
  });

  const tblRows: ReturnType<typeof _growthCell>[][] = [];
  if (data.mainBrandRow) {
    const r = data.mainBrandRow;
    tblRows.push([
      nameCell(r.brand || config.clientName || '\u2014'),
      _growthCell(r.followers_growth, r.followers_growth_gap, textColor, font),
      _growthCell(r.post_count, r.post_count_growth, textColor, font),
      _growthCell(r.total_engagement, r.total_engagement_gap, textColor, font),
      erCell(r.avg_er_folls_b),
    ]);
  }
  if (data.compRow) {
    const r = data.compRow;
    tblRows.push([
      nameCell(r.brand || data.competitor || '\u2014'),
      _growthCell(r.ig_followers_increase, r.ig_followers_growth, textColor, font),
      _growthCell(r.post_count, r.post_count_growth, textColor, font),
      _growthCell(r.ig_engagement_b, r.ig_engagement_b_growth, textColor, font),
      erCell(r.er_folls),
    ]);
  }

  _drawCompTable(slide, pptx, tv, {
    x: leftX,
    y: curY,
    w: leftW,
    h: tableH,
    platformLabel: 'Instagram',
    accentColor: 'E1306C',
    headers: tblHeaders,
    rows: tblRows,
  });

  // ── NARRATIVE PANEL ───────────────────────────────────────────────────────
  slide.addShape(pptx.ShapeType.roundRect, {
    x: narrativeX,
    y: bodyY,
    w: narrativeW,
    h: bodyH,
    fill: { color: cardBg },
    line: { color: borderColor, width: 0.75 },
    rectRadius: 0.08,
    shadow: { type: 'outer', blur: 4, offset: 1, color: '000000', opacity: 0.05 },
  });
  // Header band
  slide.addShape(pptx.ShapeType.roundRect, {
    x: narrativeX,
    y: bodyY,
    w: narrativeW,
    h: 0.3,
    fill: { color: isDark ? '1E293B' : 'F1F5F9' },
    line: { type: 'none' },
    rectRadius: 0.08,
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: narrativeX,
    y: bodyY + 0.15,
    w: narrativeW,
    h: 0.16,
    fill: { color: isDark ? '1E293B' : 'F1F5F9' },
    line: { type: 'none' },
  });
  slide.addShape(pptx.ShapeType.line, {
    x: narrativeX,
    y: bodyY + 0.3,
    w: narrativeW,
    h: 0,
    line: { color: borderColor, width: 0.5 },
  });
  slide.addText(data.competitor ? `${data.competitor} INSIGHT` : 'INSIGHT', {
    x: narrativeX + 0.1,
    y: bodyY + 0.06,
    w: narrativeW - 0.2,
    h: 0.2,
    fontSize: 7,
    bold: true,
    color: primaryColor,
    fontFace: font,
    align: 'left',
    valign: 'middle',
  });
  slide.addText(data.narrative || 'Add Instagram analysis here\u2026', {
    x: narrativeX + 0.1,
    y: bodyY + 0.35,
    w: narrativeW - 0.2,
    h: bodyH - 0.42,
    fontSize: 7.5,
    color: data.narrative ? textColor : mutedColor,
    fontFace: font,
    valign: 'top',
    wrap: true,
  });

  drawNativeFooter(slide, pptx, config, primaryColor, font, data.currentPage, data.totalPages);
}

interface IcIgCpReachExportData {
  aon: boolean;
  currMonth: string;
  prevMonth: string;
  reachCurr: IcCpPillarRow[];
  reachPrev: IcCpPillarRow[];
  erCurr: IcCpPillarRow[];
  erPrev: IcCpPillarRow[];
  deltaReach: IcCpDeltaRow[];
  deltaEr: IcCpDeltaRow[];
  currentPage: number;
  totalPages: number;
}

export function createIcIgCpReachNative(
  pptx: PptxGenJS,
  config: ReportConfig,
  data: IcIgCpReachExportData,
) {
  const slide = pptx.addSlide();
  const tv = getSlideThemeVars(config);
  drawSlideBackground(slide, pptx, config, tv);
  drawSlideDecorations(slide, pptx, tv);

  const aonLabel = data.aon ? 'AON (Brand-Owned)' : 'Non-AON (Client)';
  drawSlideHeader(
    slide,
    pptx,
    tv,
    `${config.clientName} \u2014 Content Pillar Reach \u2014 ${aonLabel}`,
    'instagram',
    { subtitle: `${config.period} \u00b7 Avg Reach & Avg ER Reach per Pillar` },
  );

  const { primaryColor, font } = tv;
  const prevLabel = monthLabelPptx(data.prevMonth);
  const currLabel = monthLabelPptx(data.currMonth);

  const reachRows = buildAlignedRows(data.reachCurr, data.reachPrev);
  const erRows = buildAlignedRows(data.erCurr, data.erPrev);
  const allPillars = reachRows.map((r: any) => r.pillar);

  const bodyY = 0.97;
  const bodyH = 5.15 - bodyY;
  const rowH = (bodyH - 0.1) / 2;
  const chartX = 0.3;
  const chartW = 7.0;
  const deltaX = 7.4;
  const deltaW = 2.25;

  drawCpBarChart(
    slide,
    tv,
    reachRows,
    prevLabel,
    currLabel,
    'Average Reach',
    chartX,
    bodyY,
    chartW,
    rowH,
  );
  drawDeltaPanel(
    slide,
    tv,
    'Avg Reach \u0394',
    allPillars,
    data.deltaReach,
    deltaX,
    bodyY,
    deltaW,
    rowH,
  );

  drawCpBarChart(
    slide,
    tv,
    erRows,
    prevLabel,
    currLabel,
    'Average ER Reach',
    chartX,
    bodyY + rowH + 0.1,
    chartW,
    rowH,
  );
  drawDeltaPanel(
    slide,
    tv,
    'Avg ER Reach \u0394',
    allPillars,
    data.deltaEr,
    deltaX,
    bodyY + rowH + 0.1,
    deltaW,
    rowH,
  );

  drawNativeFooter(slide, pptx, config, primaryColor, font, data.currentPage, data.totalPages);
}
