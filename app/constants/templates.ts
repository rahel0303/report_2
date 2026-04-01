import { Layout } from 'lucide-react';
import { Template } from '@/app/types';

export const LAYOUT_TEMPLATES: Template[] = [
  {
    id: 'layout_dashboard',
    name: 'Standard Dashboard',
    icon: Layout,
    desc: 'Chart, Key Insights & Data Table',
  },
  {
    id: 'layout_comparison',
    name: 'Comparison View',
    icon: Layout,
    desc: 'Side-by-side Metric Analysis',
  },
  {
    id: 'layout_kpi',
    name: 'KPI Overview',
    icon: Layout,
    desc: 'Top Metrics with Deep Dive Area',
  },
  {
    id: 'layout_content',
    name: 'Visual Analysis',
    icon: Layout,
    desc: 'Media / Screenshot & Analysis',
  },
  {
    id: 'layout_overview',
    name: 'Overview Slide',
    icon: Layout,
    desc: 'Full Visualization & Notes',
  },
  {
    id: 'layout_custom',
    name: 'Custom Template',
    icon: Layout,
    desc: 'Configurable Grid (2x2, 3x3)',
  },
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const getPeriodOptions = (type: 'Monthly' | 'Quarterly'): string[] => {
  const now = new Date();
  if (type === 'Monthly') {
    // Semua bulan dari Januari 2025 hingga bulan lalu (tidak termasuk bulan ini)
    const options: string[] = [];
    const start = new Date(2025, 0, 1); // January 2025
    const end = new Date(now.getFullYear(), now.getMonth() - 1, 1); // last month
    const cur = new Date(end);
    while (cur >= start) {
      options.push(`${MONTHS[cur.getMonth()]} ${cur.getFullYear()}`);
      cur.setMonth(cur.getMonth() - 1);
    }
    return options;
  }
  const year = now.getFullYear();
  const prevYear = year - 1;
  return [
    `Q1 ${year}`, `Q2 ${year}`, `Q3 ${year}`, `Q4 ${year}`,
    `Q1 ${prevYear}`, `Q2 ${prevYear}`, `Q3 ${prevYear}`, `Q4 ${prevYear}`,
  ];
};
