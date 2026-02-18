import PptxGenJS from 'pptxgenjs';
import { ReportConfig, Slide } from '@/app/types';

// Re-export for backwards compatibility
export type SlideData = Slide;
export type { ReportConfig };

// Helper to convert hex to RGB without #
const cleanColor = (hex: string) => hex.replace('#', '');

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

// ─── Hybrid Cover Slide (screenshot bg + native text) ───────────

/** Determine text colors and alignment based on template */
function getCoverTextStyle(templateId: number, primaryColor: string) {
  // Templates 2, 5 use dark text on light bg; rest use white text on dark bg
  const isLightBg = templateId === 2 || templateId === 5;
  // Template 5 is left-aligned
  const isLeftAligned = templateId === 5;

  return {
    titleColor: isLightBg ? cleanColor(primaryColor) : 'FFFFFF',
    subtitleColor: isLightBg ? '374151' : 'FFFFFF',
    periodColor: isLightBg ? '4B5563' : 'FFFFFF',
    footerColor: isLightBg ? '9CA3AF' : 'FFFFFF',
    subtitleTransparency: isLightBg ? 0 : 15,
    periodTransparency: isLightBg ? 0 : 20,
    footerTransparency: isLightBg ? 0 : 40,
    align: (isLeftAligned ? 'left' : 'center') as 'left' | 'center',
    xOffset: isLeftAligned ? 0.8 : 0.5,
    textWidth: isLeftAligned ? 8 : 9,
    titleSize: templateId === 4 ? 48 : 42,
    subtitleSize: templateId === 5 ? 22 : 20,
  };
}

/**
 * Create a cover slide using a screenshot background + native editable text.
 * Called from exportHelpers with the captured background image.
 */
export function createCoverSlideHybrid(pptx: PptxGenJS, config: ReportConfig, bgImageData: string) {
  const slide = pptx.addSlide();
  const font = config.font?.name || 'Inter';
  const templateId = Number(config.coverDesign?.templateId || 1);

  // Background: pixel-perfect screenshot
  slide.addImage({
    data: bgImageData,
    x: 0, y: 0, w: '100%', h: '100%',
  });

  const s = getCoverTextStyle(templateId, config.coverDesign?.colors?.primary || '#3B82F6');

  // Logo (if base64 available) – square, centered for templates 1-4, left for template 5
  if (config.coverDesign?.logoData) {
    const logoSize = 1.2;
    const logoX = templateId === 5 ? 0.8 : (10 - logoSize) / 2;
    slide.addImage({
      data: config.coverDesign.logoData,
      x: logoX,
      y: 0.4,
      w: logoSize,
      h: logoSize,
      sizing: { type: 'contain', w: logoSize, h: logoSize },
    });
  }

  // Title
  slide.addText(config.reportTitle, {
    x: s.xOffset, y: 1.8, w: s.textWidth, h: 1.2,
    fontSize: s.titleSize, bold: true, color: s.titleColor,
    align: s.align, valign: 'middle', fontFace: font,
  });

  // Subtitle
  if (config.reportDetails) {
    slide.addText(config.reportDetails, {
      x: s.xOffset, y: 3.1, w: s.textWidth, h: 0.6,
      fontSize: s.subtitleSize, color: s.subtitleColor,
      transparency: s.subtitleTransparency,
      align: s.align, valign: 'middle', fontFace: font,
    });
  }

  // Period
  if (config.period) {
    slide.addText(config.period, {
      x: s.xOffset, y: 3.8, w: s.textWidth, h: 0.5,
      fontSize: 18, color: s.periodColor,
      transparency: s.periodTransparency,
      align: s.align, valign: 'middle', fontFace: font,
    });
  }

  // Prepared by footer
  slide.addText(`Prepared by: ${config.preparedBy}`, {
    x: s.xOffset, y: 5.1, w: s.textWidth, h: 0.3,
    fontSize: 10, color: s.footerColor,
    transparency: s.footerTransparency,
    align: s.align, fontFace: font,
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
    x: 0, y: 0, w: 10, h: 0.4,
    fill: { color: '8B5CF6' }, line: { type: 'none' },
  });

  slide.addText(config.reportTitle, {
    x: 0.5, y: 2, w: 9, h: 1.2,
    fontSize: 48, bold: true, color: 'FFFFFF',
    align: 'center', valign: 'middle', fontFace: font,
  });

  slide.addText(config.reportDetails || '', {
    x: 0.5, y: 3.3, w: 9, h: 0.6,
    fontSize: 20, color: 'FFFFFF',
    align: 'center', valign: 'middle', fontFace: font,
  });

  slide.addText(config.period, {
    x: 0.5, y: 4.1, w: 9, h: 0.4,
    fontSize: 16, color: 'FFFFFF',
    align: 'center', valign: 'middle', fontFace: font,
  });

  slide.addText(`Prepared by: ${config.preparedBy}`, {
    x: 0.5, y: 5.2, w: 9, h: 0.3,
    fontSize: 10, color: 'FFFFFF', transparency: 40,
    align: 'center', fontFace: font,
  });
}

// ─── Hybrid Section Heading Slide (screenshot bg + native text) ──

/**
 * Create a section heading slide using a screenshot background + native editable text.
 */
export function createSectionHeadingSlideHybrid(
  pptx: PptxGenJS,
  config: ReportConfig,
  bgImageData: string,
  sectionTitle: string,
) {
  const slide = pptx.addSlide();
  const font = config.font?.name || 'Inter';

  // Background: pixel-perfect screenshot (gradients, shapes, decorative elements)
  slide.addImage({
    data: bgImageData,
    x: 0, y: 0, w: '100%', h: '100%',
  });

  // Section title – centered, white, large
  slide.addText(sectionTitle, {
    x: 0.5, y: 1.8, w: 9, h: 2,
    fontSize: 48, bold: true, color: 'FFFFFF',
    align: 'center', valign: 'middle', fontFace: font,
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
    x: 0, y: 0, w: 10, h: 5.625,
    fill: { color: cleanColor(secondaryColor), transparency: 50 },
    line: { type: 'none' },
  });

  // Title
  slide.addText(sectionTitle, {
    x: 0.5, y: 1.8, w: 9, h: 2,
    fontSize: 48, bold: true, color: 'FFFFFF',
    align: 'center', valign: 'middle', fontFace: font,
  });
}

// ─── Hybrid Dashboard Slide (screenshot bg + native chart/table/text) ──

interface DashboardExportData {
  takeaways?: string[];
  tableData?: string[][];  // extracted from DOM: rows × columns
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
      reach += (i * 37 % 400000) - 200000;
    }
    reachValues.push(Math.max(0, Math.floor(reach)));

    let growth = 2500;
    if (growthSpikes.includes(i)) {
      growth += 4500;
    } else {
      growth += (i * 23 % 300) - 150;
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
  bgImageData: string,
  slideData: DashboardExportData,
) {
  const slide = pptx.addSlide();
  const font = config.font?.name || 'Inter';
  const isDark = (config.coverDesign?.contentMode || 'light') === 'dark';
  const textColor = isDark ? 'FFFFFF' : '1E293B';
  const mutedColor = isDark ? 'CBD5E1' : '64748B';
  const primaryColor = cleanColor(config.coverDesign?.colors?.primary || config.theme?.brandColor || '#3B82F6');
  const secondaryColor = cleanColor(config.coverDesign?.colors?.secondary || '#10B981');
  const bgColor = isDark ? cleanColor(config.theme.colors[0]) : 'F8FAFC';

  // Screenshot background (header + decorative elements only)
  slide.addImage({
    data: bgImageData,
    x: 0, y: 0, w: '100%', h: '100%',
  });

  // === Header text overlays ===
  slide.addText('Instagram Performance', {
    x: 0.55, y: 0.08, w: 3.5, h: 0.3,
    fontSize: 18, bold: true, color: textColor,
    align: 'left', valign: 'middle', fontFace: font,
  });

  slide.addText(`${config.period} Report`, {
    x: 0.55, y: 0.38, w: 3, h: 0.2,
    fontSize: 10, bold: true, color: mutedColor,
    align: 'left', valign: 'middle', fontFace: font,
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
      x: xPos, y: 0.06, w: 1.4, h: 0.18,
      fontSize: 8, bold: true, color: mutedColor,
      align: 'left', valign: 'middle', fontFace: font,
    });
    slide.addText(m.value, {
      x: xPos, y: 0.22, w: 1.0, h: 0.35,
      fontSize: 24, bold: true, color: textColor,
      align: 'left', valign: 'middle', fontFace: font,
    });
    slide.addText(m.trend, {
      x: xPos + 0.65, y: 0.28, w: 0.7, h: 0.2,
      fontSize: 8, bold: true, color: m.trendColor,
      align: 'left', valign: 'middle', fontFace: font,
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
    x: chartAreaX, y: chartAreaY, w: chartAreaW, h: chartAreaH,
    fill: { color: isDark ? '1E293B' : 'FFFFFF' },
    line: { color: isDark ? '334155' : 'E2E8F0', width: 0.75 },
    rectRadius: 0.1,
  });

  // Chart title
  slide.addText('Daily Trends (Reach vs Growth)', {
    x: chartAreaX + 0.15, y: chartAreaY + 0.05, w: 3, h: 0.25,
    fontSize: 11, bold: true, color: textColor,
    align: 'left', valign: 'middle', fontFace: font,
  });

  // Legend
  slide.addShape(pptx.ShapeType.ellipse, {
    x: chartAreaX + chartAreaW - 2.0, y: chartAreaY + 0.1, w: 0.12, h: 0.12,
    fill: { color: secondaryColor }, line: { type: 'none' },
  });
  slide.addText('Growth', {
    x: chartAreaX + chartAreaW - 1.85, y: chartAreaY + 0.05, w: 0.6, h: 0.2,
    fontSize: 8, color: mutedColor, fontFace: font,
  });
  slide.addShape(pptx.ShapeType.ellipse, {
    x: chartAreaX + chartAreaW - 1.1, y: chartAreaY + 0.1, w: 0.12, h: 0.12,
    fill: { color: primaryColor }, line: { type: 'none' },
  });
  slide.addText('Reach', {
    x: chartAreaX + chartAreaW - 0.95, y: chartAreaY + 0.05, w: 0.6, h: 0.2,
    fontSize: 8, color: mutedColor, fontFace: font,
  });

  // Native line chart
  const cd = generateDashboardChartData();
  // Sample every 4th label to avoid crowding
  const sampledLabels = cd.labels.map((l, i) => i % 4 === 0 ? l : '');

  slide.addChart(pptx.ChartType.line, [
    { name: 'Growth', labels: sampledLabels, values: cd.growthValues },
    { name: 'Reach', labels: sampledLabels, values: cd.reachValues },
  ], {
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
  });

  // === Native Insights ===
  const insightX = chartAreaX + chartAreaW + 0.12;
  const insightW = 10 - insightX - 0.22;
  const insightH = chartAreaH;

  // Insight card background
  slide.addShape(pptx.ShapeType.roundRect, {
    x: insightX, y: chartAreaY, w: insightW, h: insightH,
    fill: { color: isDark ? '1E293B' : 'FFFFFF' },
    line: { color: isDark ? '334155' : 'E2E8F0', width: 0.75 },
    rectRadius: 0.1,
  });

  // Insight header
  slide.addText('KEY TAKEAWAYS', {
    x: insightX + 0.15, y: chartAreaY + 0.05, w: insightW - 0.3, h: 0.25,
    fontSize: 10, bold: true, color: textColor,
    align: 'left', valign: 'middle', fontFace: font,
  });

  // Separator line
  slide.addShape(pptx.ShapeType.line, {
    x: insightX + 0.15, y: chartAreaY + 0.35, w: insightW - 0.3, h: 0,
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
    x: insightX + 0.15, y: chartAreaY + 0.4, w: insightW - 0.3, h: insightH - 0.55,
    fontSize: 9, color: mutedColor,
    align: 'left', valign: 'top', fontFace: font,
    lineSpacingMultiple: 1.2,
    wrap: true,
  });

  // === Native Table ===
  const tableY = chartAreaY + chartAreaH + 0.12;
  const tableH = 5.625 - tableY - 0.45; // leave room for footer
  const tableW = 10 - 0.44;

  // Table card background
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.22, y: tableY, w: tableW, h: tableH,
    fill: { color: isDark ? '1E293B' : 'FFFFFF' },
    line: { color: isDark ? '334155' : 'E2E8F0', width: 0.75 },
    rectRadius: 0.1,
  });

  // Build table from extracted DOM data or fallback
  const headerStyle = {
    bold: true, fontSize: 7, color: mutedColor,
    fill: { color: isDark ? '0F172A' : 'F8FAFC' },
    align: 'center' as const, valign: 'middle' as const, fontFace: font,
  };
  const cellStyle = {
    fontSize: 7, color: textColor,
    align: 'center' as const, valign: 'middle' as const, fontFace: font,
  };
  const cellBoldStyle = { ...cellStyle, bold: true };
  const gapGreenStyle = { ...cellBoldStyle, color: '10B981' };
  const gapRedStyle = { ...cellBoldStyle, color: 'F43F5E' };

  const colHeaders = ['Month', 'Profile Reach', 'Profile Visit', 'Growth', 'Reach',
    'Engagement', 'Likes', 'Comments', 'Shares', 'Saves', 'ER Reach', 'ER Follow'];

  // Use DOM-extracted data if available, otherwise fallback
  let tableRows: any[][];
  if (slideData.tableData && slideData.tableData.length >= 3) {
    const [prevRow, currRow, gapRow] = slideData.tableData;
    tableRows = [
      colHeaders.map((h) => ({ text: h, options: headerStyle })),
      prevRow.map((v, i) => ({ text: v, options: i === 0 ? { ...cellStyle, align: 'left' as const } : cellStyle })),
      currRow.map((v, i) => ({ text: v, options: i === 0 ? { ...cellBoldStyle, align: 'left' as const } : cellBoldStyle })),
      gapRow.map((v, i) => {
        if (i === 0) return { text: v, options: { ...cellBoldStyle, color: primaryColor, align: 'left' as const } };
        const isPositive = !v.startsWith('-');
        return { text: v, options: isPositive ? gapGreenStyle : gapRedStyle };
      }),
    ];
  } else {
    // Fallback with hardcoded data matching the component
    const prevData = ['Previous', '50.9M', '480K', '28.1K', '14.1M', '118K', '82.4K', '10.8K', '22.3K', '2.5K', '2.07%', '0.08%'];
    const currData = ['Current', '39M', '287K', '82.2K', '9.9M', '71.7K', '51.6K', '5.5K', '12.9K', '1.7K', '2.32%', '0.03%'];
    const gapData = ['Gap', '-23.4%', '-40.2%', '+192.7%', '-29.6%', '-39.3%', '-37.4%', '-49.2%', '-42.1%', '-32.6%', '+12.1%', '-62.5%'];

    tableRows = [
      colHeaders.map((h) => ({ text: h, options: headerStyle })),
      prevData.map((v, i) => ({ text: v, options: i === 0 ? { ...cellStyle, align: 'left' as const } : cellStyle })),
      currData.map((v, i) => ({ text: v, options: i === 0 ? { ...cellBoldStyle, align: 'left' as const } : cellBoldStyle })),
      gapData.map((v, i) => {
        if (i === 0) return { text: v, options: { ...cellBoldStyle, color: primaryColor, align: 'left' as const } };
        const isPositive = v.startsWith('+');
        return { text: v, options: isPositive ? gapGreenStyle : gapRedStyle };
      }),
    ];
  }

  slide.addTable(tableRows, {
    x: 0.3, y: tableY + 0.05,
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
  chartData?: { type: string; orientation?: string; labels: string[]; series: { name: string; values: number[] }[] };
  insightText?: string;
  tableTitle?: string;
  tableHeaders?: string[];
  tableRows?: string[][];
  currentPage?: number;
  totalPages?: number;
}

/** Channel short labels for PPTX badge */
const CHANNEL_LABELS: Record<string, string> = {
  instagram: 'IG', facebook: 'FB', twitter: 'X', tiktok: 'TT', youtube: 'YT',
};

/**
 * Generate channel badge as SVG data URL (dark rounded square with white icon).
 * Uses the same lucide icon paths as ChannelBadge component.
 */
function getChannelBadgeSvg(channel: string): string {
  // Lucide icon SVG paths (24x24 viewBox)
  const iconPaths: Record<string, string> = {
    instagram: '<rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    facebook: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    twitter: '<path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    tiktok: '<path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    youtube: '<path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polygon points="10 15 15 12 10 9 10 15" fill="white"/>',
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
export function extractChartInfo(chartEl: HTMLElement): LayoutDashboardExportData['chartData'] | null {
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
    labels: xLabels.length > 0 ? xLabels : Array.from({ length: numLabels }, (_, i) => String(i + 1)),
    series: (seriesNames.length > 0 ? seriesNames : ['Series 1']).map((name, sIdx) => ({
      name,
      values: Array.from({ length: numLabels }, (_, i) =>
        Math.floor(maxY * 0.3 + (maxY * 0.5 * ((i * 37 + sIdx * 13) % 100)) / 100)
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
    x: 0.3, y: footerY, w: 9.4, h: 0,
    line: { color: primaryColor, width: 1 },
  });

  // Footer background
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: footerY, w: 10, h: footerH,
    fill: { color: 'FFFFFF', transparency: 5 },
    line: { type: 'none' },
  });

  // Logo
  if (config.coverDesign?.logoData) {
    slide.addImage({
      data: config.coverDesign.logoData,
      x: 0.3, y: footerY + 0.06, w: 0.35, h: 0.35,
      sizing: { type: 'contain', w: 0.35, h: 0.35 },
    });
  }

  // Client name + period
  const logoOffset = config.coverDesign?.logoData ? 0.72 : 0.3;
  slide.addText(`${config.clientName}  \u2022  ${config.period}`, {
    x: logoOffset, y: footerY + 0.04, w: 3.5, h: 0.38,
    fontSize: 8, color: '374151', fontFace: font,
    align: 'left', valign: 'middle',
  });

  // Powered by Sekata
  slide.addText('Powered by Sekata', {
    x: 3.5, y: footerY + 0.04, w: 3, h: 0.38,
    fontSize: 7, color: '9CA3AF', fontFace: font,
    align: 'center', valign: 'middle',
  });

  // Page number
  slide.addText(`${currentPage} / ${totalPages}`, {
    x: 8, y: footerY + 0.04, w: 1.5, h: 0.38,
    fontSize: 8, bold: true, color: primaryColor, fontFace: font,
    align: 'right', valign: 'middle',
  });
}

/**
 * Create a layout dashboard slide: screenshot bg + native header, chart, table, insights, footer.
 */
export function createLayoutDashboardHybrid(
  pptx: PptxGenJS,
  config: ReportConfig,
  bgImageData: string,
  exportData: LayoutDashboardExportData,
) {
  const slide = pptx.addSlide();
  const font = config.font?.name || 'Inter';
  const isDark = (config.coverDesign?.contentMode || 'light') === 'dark';
  const textColor = isDark ? 'FFFFFF' : '1E293B';
  const mutedColor = isDark ? 'CBD5E1' : '64748B';
  const primaryColor = cleanColor(config.coverDesign?.colors?.primary || config.theme?.brandColor || '#3B82F6');
  const secondaryColor = cleanColor(config.coverDesign?.colors?.secondary || '#10B981');
  const accentColor = cleanColor(config.coverDesign?.colors?.accent || '#8B5CF6');
  const cardBg = isDark ? '1E293B' : 'FFFFFF';
  const borderColor = isDark ? '334155' : 'E2E8F0';

  // Screenshot background (only page bg + decorative elements)
  slide.addImage({
    data: bgImageData,
    x: 0, y: 0, w: '100%', h: '100%',
  });

  // === Native Header ===
  const headerX = 0.3;
  const headerY = 0.3;
  const headerW = 9.4;
  const headerH = 0.6;

  // Header card bg
  slide.addShape(pptx.ShapeType.roundRect, {
    x: headerX, y: headerY, w: headerW, h: headerH,
    fill: { color: cardBg },
    line: { color: borderColor, width: 0.75 },
    rectRadius: 0.08,
  });

  // Header left accent bar
  slide.addShape(pptx.ShapeType.rect, {
    x: headerX, y: headerY, w: 0.04, h: headerH,
    fill: { color: primaryColor },
    line: { type: 'none' },
  });

  // Title text (editable, slightly bigger)
  slide.addText(exportData.title || 'Dashboard', {
    x: headerX + 0.2, y: headerY + 0.05, w: 6, h: headerH - 0.1,
    fontSize: 18, bold: true, color: textColor,
    align: 'left', valign: 'middle', fontFace: font,
  });

  // Channel badge (SVG icon)
  if (exportData.channel) {
    const badgeSvg = getChannelBadgeSvg(exportData.channel);
    if (badgeSvg) {
      slide.addImage({
        data: badgeSvg,
        x: headerX + headerW - 0.55, y: headerY + 0.08, w: 0.44, h: 0.44,
      });
    }
  }

  const contentY = headerY + headerH + 0.15;
  const chartX = 0.3;
  const chartW = 5.7;
  const chartH = 2.3;

  // === Native Chart (editable) ===
  // Chart card bg (opaque, covers hidden screenshot area)
  slide.addShape(pptx.ShapeType.roundRect, {
    x: chartX, y: contentY, w: chartW, h: chartH,
    fill: { color: cardBg },
    line: { color: borderColor, width: 0.75 },
    rectRadius: 0.08,
  });

  const cd = exportData.chartData;
  if (cd && cd.series.length > 0) {
    // Use same color palette as SmartChartBlock metricColors
    const chartColors = ['3B82F6', '10B981', 'F59E0B', 'EF4444', '8B5CF6', 'EC4899', '06B6D4', 'F97316'];
    const isBar = cd.type === 'bar';
    // Recharts: barOrientation 'vertical' = vertical bars (normal), default/horizontal = horizontal bars (layout=vertical)
    const isHorizontalBar = isBar && cd.orientation !== 'vertical';

    const chartSeries = cd.series.map((s) => ({
      name: s.name,
      labels: cd.labels,
      values: s.values,
    }));

    if (cd.type === 'pie') {
      // Pie chart
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
        dataLabelPosition: 'outEnd',
        dataLabelFontSize: 7,
        showPercent: true,
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
      // Line chart
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
      x: chartX, y: contentY, w: chartW, h: chartH,
      fontSize: 12, bold: true, color: mutedColor,
      align: 'center', valign: 'middle', fontFace: font,
    });
  }

  // === Native Insight (editable) ===
  const insightX = chartX + chartW + 0.15;
  const insightW = 10 - insightX - 0.3;

  // Large opaque cover to fully hide any dashed border artifacts from screenshot
  const pageBg = isDark ? '0F172A' : 'F8FAFC';
  slide.addShape(pptx.ShapeType.rect, {
    x: insightX - 0.15, y: contentY - 0.15, w: insightW + 0.45, h: chartH + 0.3,
    fill: { color: pageBg },
    line: { type: 'none' },
  });
  // Insight card with border
  slide.addShape(pptx.ShapeType.roundRect, {
    x: insightX, y: contentY, w: insightW, h: chartH,
    fill: { color: cardBg },
    line: { color: borderColor, width: 0.75 },
    rectRadius: 0.08,
  });

  slide.addText('AI KEY INSIGHTS', {
    x: insightX + 0.15, y: contentY + 0.1, w: insightW - 0.3, h: 0.22,
    fontSize: 9, bold: true, color: mutedColor, fontFace: font,
    align: 'left', valign: 'middle',
  });

  // Separator line
  slide.addShape(pptx.ShapeType.line, {
    x: insightX + 0.15, y: contentY + 0.38, w: insightW - 0.3, h: 0,
    line: { color: borderColor, width: 0.5 },
  });

  const insightContent = exportData.insightText || '';
  if (insightContent) {
    slide.addText(insightContent, {
      x: insightX + 0.15, y: contentY + 0.45, w: insightW - 0.3, h: chartH - 0.6,
      fontSize: 9, color: isDark ? 'CBD5E1' : '475569',
      align: 'left', valign: 'top', fontFace: font,
      lineSpacingMultiple: 1.3, wrap: true,
    });
  } else {
    slide.addText('AI Key Insights', {
      x: insightX, y: contentY, w: insightW, h: chartH,
      fontSize: 12, color: mutedColor,
      align: 'center', valign: 'middle', fontFace: font,
    });
  }

  // === Native Table ===
  const tableY = contentY + chartH + 0.15;
  const tblFooterY = 5.15;
  const tableH = tblFooterY - tableY - 0.08;
  const tableW = 9.4;

  // Table card bg
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.3, y: tableY, w: tableW, h: tableH,
    fill: { color: cardBg },
    line: { color: borderColor, width: 0.75 },
    rectRadius: 0.08,
  });

  if (exportData.tableHeaders && exportData.tableRows && exportData.tableRows.length > 0) {
    // Table title (e.g. "PERFORMANCE OVERVIEW")
    if (exportData.tableTitle) {
      slide.addText(exportData.tableTitle, {
        x: 0.45, y: tableY + 0.05, w: tableW - 0.3, h: 0.25,
        fontSize: 9, bold: true, color: textColor,
        align: 'left', valign: 'middle', fontFace: font,
      });
    }

    const headerStyle = {
      bold: true, fontSize: 7, color: mutedColor,
      fill: { color: isDark ? '0F172A' : 'F8FAFC' },
      align: 'center' as const, valign: 'middle' as const, fontFace: font,
    };
    const cellStyle = {
      fontSize: 7, color: textColor,
      align: 'center' as const, valign: 'middle' as const, fontFace: font,
    };
    const cellBoldStyle = { ...cellStyle, bold: true };

    const tableRows: any[][] = [
      exportData.tableHeaders.map((h) => ({ text: h, options: headerStyle })),
    ];

    const numDataRows = exportData.tableRows.length;
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
            options: i === 0 ? { ...cellBoldStyle, align: 'left' as const } : (isLastRow ? cellBoldStyle : cellStyle),
          };
        }),
      );
    });

    const tblYStart = exportData.tableTitle ? tableY + 0.32 : tableY + 0.08;
    const availH = tableH - (exportData.tableTitle ? 0.4 : 0.15);
    const rowH = Math.min(0.3, availH / tableRows.length);

    slide.addTable(tableRows, {
      x: 0.35, y: tblYStart,
      w: tableW - 0.1,
      fontSize: 7,
      border: { pt: 0.5, color: borderColor },
      align: 'center', valign: 'middle',
      fontFace: font, color: textColor,
      rowH: tableRows.map(() => rowH),
    });
  } else {
    slide.addText('Data Table', {
      x: 0.3, y: tableY, w: tableW, h: tableH,
      fontSize: 12, color: mutedColor,
      align: 'center', valign: 'middle', fontFace: font,
    });
  }

  // === Native Footer ===
  drawNativeFooter(slide, pptx, config, primaryColor, font,
    exportData.currentPage || 1, exportData.totalPages || 1);
}

// ─── Comparison Hybrid Export ─────────────────────────────────

interface ComparisonExportData {
  title?: string;
  channel?: string;
  chartAData?: { type: string; orientation?: string; labels: string[]; series: { name: string; values: number[] }[] } | null;
  chartBData?: { type: string; orientation?: string; labels: string[]; series: { name: string; values: number[] }[] } | null;
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
  bgImageData: string,
  exportData: ComparisonExportData,
) {
  const slide = pptx.addSlide();
  const font = config.font?.name || 'Inter';
  const isDark = (config.coverDesign?.contentMode || 'light') === 'dark';
  const textColor = isDark ? 'FFFFFF' : '1E293B';
  const mutedColor = isDark ? 'CBD5E1' : '64748B';
  const primaryColor = cleanColor(config.coverDesign?.colors?.primary || config.theme?.brandColor || '#3B82F6');
  const cardBg = isDark ? '1E293B' : 'FFFFFF';
  const borderColor = isDark ? '334155' : 'E2E8F0';
  const pageBg = isDark ? '0F172A' : 'F8FAFC';

  // Screenshot background (page bg + decoratives only)
  slide.addImage({
    data: bgImageData,
    x: 0, y: 0, w: '100%', h: '100%',
  });

  // === Native Header ===
  const headerX = 0.3;
  const headerY = 0.3;
  const headerW = 9.4;
  const headerH = 0.55;

  slide.addShape(pptx.ShapeType.roundRect, {
    x: headerX, y: headerY, w: headerW, h: headerH,
    fill: { color: cardBg },
    line: { color: borderColor, width: 0.75 },
    rectRadius: 0.08,
  });

  // Header left accent bar
  slide.addShape(pptx.ShapeType.rect, {
    x: headerX, y: headerY, w: 0.04, h: headerH,
    fill: { color: primaryColor },
    line: { type: 'none' },
  });

  // Title
  slide.addText(exportData.title || 'Comparison', {
    x: headerX + 0.2, y: headerY + 0.03, w: 6, h: headerH - 0.06,
    fontSize: 18, bold: true, color: textColor,
    align: 'left', valign: 'middle', fontFace: font,
  });

  // Channel badge
  if (exportData.channel) {
    const badgeSvg = getChannelBadgeSvg(exportData.channel);
    if (badgeSvg) {
      slide.addImage({
        data: badgeSvg,
        x: headerX + headerW - 0.5, y: headerY + 0.06, w: 0.42, h: 0.42,
      });
    }
  }

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
      x, y: contentY, w: chartW, h: chartH,
      fill: { color: cardBg },
      line: { color: borderColor, width: 0.75 },
      rectRadius: 0.08,
    });

    if (chartData && chartData.series.length > 0) {
      const chartColors = ['3B82F6', '10B981', 'F59E0B', 'EF4444', '8B5CF6', 'EC4899', '06B6D4', 'F97316'];
      const isBar = chartData.type === 'bar';
      const isHorizontalBar = isBar && chartData.orientation !== 'vertical';

      const chartSeries = chartData.series.map((s) => ({
        name: s.name,
        labels: chartData.labels,
        values: s.values,
      }));

      if (chartData.type === 'pie') {
        slide.addChart(pptx.ChartType.pie, chartSeries, {
          x: x + 0.1, y: contentY + 0.1, w: chartW - 0.2, h: chartH - 0.2,
          chartColors: chartColors.slice(0, chartData.labels.length),
          showLegend: true, legendPos: 'b', legendFontSize: 6,
          showTitle: false, showPercent: true, dataLabelFontSize: 6,
        });
      } else if (isBar) {
        slide.addChart(pptx.ChartType.bar, chartSeries, {
          x: x + 0.1, y: contentY + 0.1, w: chartW - 0.2, h: chartH - 0.2,
          chartColors: chartColors.slice(0, chartData.series.length),
          barDir: isHorizontalBar ? 'bar' : 'col',
          barGrouping: 'clustered', barGapWidthPct: 80,
          showLegend: true, legendPos: 't', legendFontSize: 6,
          showTitle: false, showValue: false,
          valGridLine: { style: 'dash', color: isDark ? '334155' : 'E2E8F0' },
          catGridLine: { style: 'none' },
          catAxisLabelFontSize: 6, valAxisLabelFontSize: 6,
          catAxisLabelColor: mutedColor, valAxisLabelColor: mutedColor,
          catAxisLineShow: false, valAxisLineShow: false,
        });
      } else {
        slide.addChart(pptx.ChartType.line, chartSeries, {
          x: x + 0.1, y: contentY + 0.1, w: chartW - 0.2, h: chartH - 0.2,
          chartColors: chartColors.slice(0, chartData.series.length),
          showLegend: true, legendPos: 't', legendFontSize: 6,
          showTitle: false, lineSmooth: true, lineSize: 2,
          lineDataSymbolSize: chartData.labels.length > 10 ? 3 : 5,
          valGridLine: { style: 'dash', color: isDark ? '334155' : 'E2E8F0' },
          catGridLine: { style: 'none' },
          catAxisLabelFontSize: 6, valAxisLabelFontSize: 6,
          catAxisLabelColor: mutedColor, valAxisLabelColor: mutedColor,
          catAxisLineShow: false, valAxisLineShow: false,
        });
      }
    } else {
      slide.addText(fallbackLabel, {
        x, y: contentY, w: chartW, h: chartH,
        fontSize: 11, color: mutedColor,
        align: 'center', valign: 'middle', fontFace: font,
      });
    }
  };

  drawChartCard(chartAX, exportData.chartAData, 'Period A / Segment A');
  drawChartCard(chartBX, exportData.chartBData, 'Period B / Segment B');

  // === Native Insight ===
  const insightY = contentY + chartH + 0.15;
  const footerY = 5.15;
  const insightH = footerY - insightY - 0.08;
  const insightW = 9.4;

  // Cover any screenshot artifacts
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.15, y: insightY - 0.1, w: insightW + 0.3, h: insightH + 0.2,
    fill: { color: pageBg },
    line: { type: 'none' },
  });

  // Insight card
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.3, y: insightY, w: insightW, h: insightH,
    fill: { color: cardBg },
    line: { color: borderColor, width: 0.75 },
    rectRadius: 0.08,
  });

  slide.addText('COMPARATIVE ANALYSIS & NOTES', {
    x: 0.45, y: insightY + 0.08, w: insightW - 0.3, h: 0.2,
    fontSize: 8, bold: true, color: mutedColor, fontFace: font,
    align: 'left', valign: 'middle',
  });

  slide.addShape(pptx.ShapeType.line, {
    x: 0.45, y: insightY + 0.32, w: insightW - 0.3, h: 0,
    line: { color: borderColor, width: 0.5 },
  });

  const insightContent = exportData.insightText || '';
  if (insightContent) {
    slide.addText(insightContent, {
      x: 0.45, y: insightY + 0.38, w: insightW - 0.3, h: insightH - 0.5,
      fontSize: 9, color: isDark ? 'CBD5E1' : '475569',
      align: 'left', valign: 'top', fontFace: font,
      lineSpacingMultiple: 1.3, wrap: true,
    });
  } else {
    slide.addText('Comparative Analysis & Notes', {
      x: 0.3, y: insightY, w: insightW, h: insightH,
      fontSize: 12, color: mutedColor,
      align: 'center', valign: 'middle', fontFace: font,
    });
  }

  // === Native Footer ===
  drawNativeFooter(slide, pptx, config, primaryColor, font,
    exportData.currentPage || 1, exportData.totalPages || 1);
}

// Create layout dashboard slide
export function createLayoutDashboard(pptx: PptxGenJS, config: ReportConfig, title: string) {
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

  // KPI Cards - 3 cards
  const kpis = [
    { label: 'TOTAL REACH', value: '45.2M', trend: '+12.5%', color: '3B82F6' },
    { label: 'ENGAGEMENT', value: '2.8M', trend: '+8.3%', color: '10B981' },
    { label: 'GROWTH RATE', value: '15.7%', trend: '+2.1%', color: '8B5CF6' },
  ];

  kpis.forEach((kpi, idx) => {
    const xPos = 0.4 + idx * 3.1;

    // Card
    slide.addShape(pptx.ShapeType.roundRect, {
      x: xPos,
      y: 0.95,
      w: 2.9,
      h: 0.9,
      fill: { color: 'FFFFFF' },
      line: { color: 'E5E7EB', width: 1 },
      shadow: {
        type: 'outer',
        blur: 3,
        offset: 1,
        angle: 90,
        color: '000000',
        opacity: 0.08,
      },
    });

    // Color bar
    slide.addShape(pptx.ShapeType.rect, {
      x: xPos,
      y: 0.95,
      w: 0.15,
      h: 0.9,
      fill: { color: kpi.color },
      line: { type: 'none' },
    });

    slide.addText(kpi.label, {
      x: xPos + 0.3,
      y: 1.05,
      w: 2.4,
      h: 0.2,
      fontSize: 9,
      color: '6B7280',
      bold: true,
    });

    slide.addText(kpi.value, {
      x: xPos + 0.3,
      y: 1.3,
      w: 2.4,
      h: 0.3,
      fontSize: 24,
      color: '111827',
      bold: true,
    });

    slide.addText(kpi.trend, {
      x: xPos + 0.3,
      y: 1.65,
      w: 2.4,
      h: 0.15,
      fontSize: 10,
      color: '10B981',
      bold: true,
    });
  });

  // Chart Title
  slide.addText('Performance Trends (Last 6 Months)', {
    x: 0.4,
    y: 2.05,
    w: 9,
    h: 0.25,
    fontSize: 13,
    bold: true,
    color: '1F2937',
  });

  // Line chart
  const chartData = [
    {
      name: 'Reach',
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      values: [38, 40, 42, 43, 44, 45.2],
    },
    {
      name: 'Engagement',
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      values: [2.2, 2.3, 2.5, 2.6, 2.7, 2.8],
    },
  ];

  const chartColors = getChartColors(config);

  slide.addChart(pptx.ChartType.line, chartData, {
    x: 0.4,
    y: 2.4,
    w: 9.2,
    h: 2.2,
    chartColors: [chartColors[0], chartColors[1]],
    showLegend: true,
    showTitle: false,
    valGridLine: { style: 'dash', color: 'E5E7EB' },
    catGridLine: { style: 'none' },
    catAxisLabelFontSize: 10,
    valAxisLabelFontSize: 10,
    catAxisLabelColor: '6B7280',
    valAxisLabelColor: '6B7280',
  });

  // Table
  slide.addText('Detailed Metrics', {
    x: 0.4,
    y: 4.75,
    w: 9,
    h: 0.2,
    fontSize: 12,
    bold: true,
    color: '1F2937',
  });

  const tableData = [
    [
      {
        text: 'METRIC',
        options: { bold: true, fontSize: 9, color: '6B7280', fill: { color: 'F9FAFB' } },
      },
      {
        text: 'CURRENT',
        options: { bold: true, fontSize: 9, color: '6B7280', fill: { color: 'F9FAFB' } },
      },
      {
        text: 'PREVIOUS',
        options: { bold: true, fontSize: 9, color: '6B7280', fill: { color: 'F9FAFB' } },
      },
      {
        text: 'CHANGE',
        options: { bold: true, fontSize: 9, color: '6B7280', fill: { color: 'F9FAFB' } },
      },
    ],
    [
      { text: 'Reach', options: {} },
      { text: '45.2M', options: { bold: true } },
      { text: '40.4M', options: {} },
      { text: '+12.5%', options: { color: '10B981', bold: true } },
    ],
    [
      { text: 'Engagement', options: {} },
      { text: '2.8M', options: { bold: true } },
      { text: '2.6M', options: {} },
      { text: '+8.3%', options: { color: '10B981', bold: true } },
    ],
  ];

  slide.addTable(tableData, {
    x: 0.4,
    y: 5.05,
    w: 9.2,
    h: 0.35,
    fontSize: 9,
    border: { pt: 1, color: 'E5E7EB' },
    align: 'center',
    valign: 'middle',
    color: '374151',
  });
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
      createLayoutDashboard(pptx, config, slideData.title);
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
