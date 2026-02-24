/**
 * Extract dominant colors from an image using canvas
 * This is a client-side backup method if AI fails
 */

// ─────────────────────────────────────────
//  Color contrast utilities
// ─────────────────────────────────────────

/** Compute relative luminance of a hex color (0 = black, 1 = white). */
export function hexLuminance(hex: string): number {
  try {
    const c = hex.replace('#', '');
    if (c.length !== 6) return 0.5;
    const r = parseInt(c.slice(0, 2), 16) / 255;
    const g = parseInt(c.slice(2, 4), 16) / 255;
    const b = parseInt(c.slice(4, 6), 16) / 255;
    const toLinear = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  } catch {
    return 0.5;
  }
}

/**
 * Returns '#111111' when the background is light, '#ffffff' when dark.
 * Threshold: luminance > 0.35 → light background.
 */
export function getAutoTextColor(bgHex: string): string {
  return hexLuminance(bgHex) > 0.35 ? '#111111' : '#ffffff';
}

/**
 * Returns `textHex` if it already has ≥3:1 contrast ratio with `bgHex`,
 * otherwise returns the auto-contrast fallback.
 */
export function ensureTextContrast(textHex: string, bgHex: string): string {
  try {
    const tL = hexLuminance(textHex);
    const bL = hexLuminance(bgHex);
    const ratio = (Math.max(tL, bL) + 0.05) / (Math.min(tL, bL) + 0.05);
    return ratio < 3 ? getAutoTextColor(bgHex) : textHex;
  } catch {
    return textHex;
  }
}

interface ColorCount {
  color: string;
  count: number;
  rgb: { r: number; g: number; b: number };
}

export function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
}

export function extractColorsFromImage(imageData: string): Promise<{
  primary: string;
  secondary: string;
  accent: string;
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Scale down for performance
        const maxSize = 200;
        const scale = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageDataObj.data;

        const colorMap = new Map<string, ColorCount>();

        // Sample every 4th pixel for performance
        for (let i = 0; i < pixels.length; i += 16) {
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          const a = pixels[i + 3];

          // Skip transparent and very light/dark pixels
          if (a < 128) continue;
          if (r > 240 && g > 240 && b > 240) continue; // Skip white
          if (r < 15 && g < 15 && b < 15) continue; // Skip black

          // Round colors to reduce variations
          const roundedR = Math.round(r / 10) * 10;
          const roundedG = Math.round(g / 10) * 10;
          const roundedB = Math.round(b / 10) * 10;

          const colorKey = `${roundedR},${roundedG},${roundedB}`;

          if (colorMap.has(colorKey)) {
            const existing = colorMap.get(colorKey)!;
            existing.count++;
          } else {
            colorMap.set(colorKey, {
              color: rgbToHex(roundedR, roundedG, roundedB),
              count: 1,
              rgb: { r: roundedR, g: roundedG, b: roundedB },
            });
          }
        }

        // Sort by frequency
        const sortedColors = Array.from(colorMap.values()).sort((a, b) => b.count - a.count);

        if (sortedColors.length === 0) {
          resolve({
            primary: '#3B82F6',
            secondary: '#8B5CF6',
            accent: '#EC4899',
          });
          return;
        }

        // Get top colors
        const primary = sortedColors[0]?.color || '#3B82F6';

        // Find complementary colors (different enough from primary)
        let secondary = '#8B5CF6';
        let accent = '#EC4899';

        for (const colorData of sortedColors.slice(1)) {
          const primaryRgb = sortedColors[0].rgb;
          const diff =
            Math.abs(colorData.rgb.r - primaryRgb.r) +
            Math.abs(colorData.rgb.g - primaryRgb.g) +
            Math.abs(colorData.rgb.b - primaryRgb.b);

          // Color should be different enough (threshold: 100)
          if (diff > 100) {
            if (secondary === '#8B5CF6') {
              secondary = colorData.color;
            } else if (accent === '#EC4899') {
              accent = colorData.color;
              break;
            }
          }
        }

        // If we couldn't find enough distinct colors, create variations
        if (secondary === '#8B5CF6' && sortedColors.length > 0) {
          const baseRgb = sortedColors[0].rgb;
          secondary = rgbToHex(
            Math.min(255, baseRgb.r + 40),
            Math.max(0, baseRgb.g - 20),
            Math.min(255, baseRgb.b + 40),
          );
        }

        if (accent === '#EC4899' && sortedColors.length > 0) {
          const baseRgb = sortedColors[0].rgb;
          accent = rgbToHex(
            Math.max(0, baseRgb.r - 30),
            Math.min(255, baseRgb.g + 30),
            Math.max(0, baseRgb.b - 30),
          );
        }

        resolve({ primary, secondary, accent });
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = imageData;
  });
}
