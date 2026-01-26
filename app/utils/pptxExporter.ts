import PptxGenJS from 'pptxgenjs';

export interface SlideData {
  id: number;
  type: string;
  title: string;
}

export interface ReportConfig {
  reportTitle: string;
  reportSubtitle?: string;
  period: string;
  preparedBy: string;
  reportDetails?: string;
  reportType?: 'Monthly' | 'Quarterly';
  brandColor?: string;
  accentColor?: string;
  theme?: any;
  font?: any;
  clientName?: string;
  selectedCompetitors?: string[];
  coverDesign?: {
    templateId: string | number;
    logoData?: string;
    colors: {
      primary: string;
      secondary: string;
      accent: string;
    };
  };
}

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

// Create cover slide
export function createCoverSlide(pptx: PptxGenJS, config: ReportConfig) {
  const slide = pptx.addSlide();

  if (config.coverDesign) {
    const colors = config.coverDesign.colors;

    // Background
    slide.background = { color: cleanColor(colors.primary) };

    // Decorative elements based on template
    if (config.coverDesign.templateId === 'geometric') {
      // Triangle shapes
      slide.addShape(pptx.ShapeType.triangle, {
        x: 7.5,
        y: 1,
        w: 1.5,
        h: 1.5,
        fill: { color: cleanColor(colors.secondary), transparency: 30 },
        line: { type: 'none' },
        rotate: 30,
      });
      slide.addShape(pptx.ShapeType.rect, {
        x: 1,
        y: 4.5,
        w: 1.2,
        h: 1.2,
        fill: { color: cleanColor(colors.accent), transparency: 40 },
        line: { type: 'none' },
        rotate: 45,
      });
    } else if (config.coverDesign.templateId === 'waves') {
      // Wave-like shapes
      slide.addShape(pptx.ShapeType.ellipse, {
        x: 7,
        y: 0.5,
        w: 3,
        h: 1.5,
        fill: { color: cleanColor(colors.secondary), transparency: 20 },
        line: { type: 'none' },
      });
      slide.addShape(pptx.ShapeType.ellipse, {
        x: -0.5,
        y: 5,
        w: 2.5,
        h: 1.5,
        fill: { color: cleanColor(colors.accent), transparency: 30 },
        line: { type: 'none' },
      });
    } else if (config.coverDesign.templateId === 'gradient') {
      // Gradient simulation with overlays
      slide.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: 0,
        w: 10,
        h: 5.625,
        fill: { color: cleanColor(colors.secondary), transparency: 50 },
        line: { type: 'none' },
      });
    }

    // Color bars at bottom
    const barWidth = 10 / 5;
    const bottomColors = [
      colors.primary,
      colors.secondary,
      colors.accent,
      colors.secondary,
      colors.primary,
    ];
    bottomColors.forEach((color, idx) => {
      slide.addShape(pptx.ShapeType.rect, {
        x: idx * barWidth,
        y: 5.125,
        w: barWidth,
        h: 0.5,
        fill: { color: cleanColor(color), transparency: 20 },
        line: { type: 'none' },
      });
    });

    // Title with shadow
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
      shadow: {
        type: 'outer',
        blur: 8,
        offset: 3,
        angle: 45,
        color: '000000',
        opacity: 0.4,
      },
    });

    // Subtitle
    slide.addText(config.reportSubtitle || config.reportDetails || '', {
      x: 0.5,
      y: 3.3,
      w: 9,
      h: 0.6,
      fontSize: 20,
      color: 'FFFFFF',
      align: 'center',
      valign: 'middle',
      transparency: 10,
    });

    // Period badge
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 3.8,
      y: 4.1,
      w: 2.4,
      h: 0.45,
      fill: { color: 'FFFFFF', transparency: 20 },
      line: { color: 'FFFFFF', width: 1, transparency: 30 },
    });
    slide.addText(config.period, {
      x: 3.8,
      y: 4.1,
      w: 2.4,
      h: 0.45,
      fontSize: 16,
      bold: true,
      color: 'FFFFFF',
      align: 'center',
      valign: 'middle',
    });
  } else {
    // Default cover
    slide.background = { color: '3B82F6' };

    // Top accent bar
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
    });

    slide.addText(config.reportSubtitle || config.reportDetails || '', {
      x: 0.5,
      y: 3.3,
      w: 9,
      h: 0.6,
      fontSize: 20,
      color: 'FFFFFF',
      align: 'center',
      valign: 'middle',
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
    });
  }

  // Footer
  slide.addText(`Prepared by: ${config.preparedBy}`, {
    x: 0.5,
    y: 5.2,
    w: 9,
    h: 0.3,
    fontSize: 10,
    color: 'FFFFFF',
    align: 'center',
    transparency: 40,
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

export function exportToPPTX(slides: SlideData[], config: ReportConfig) {
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
