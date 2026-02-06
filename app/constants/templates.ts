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
];

export const getPeriodOptions = (type: 'Monthly' | 'Quarterly'): string[] => {
  const year = new Date().getFullYear();
  if (type === 'Monthly')
    return [
      `January ${year}`,
      `February ${year}`,
      `March ${year}`,
      `April ${year}`,
      `May ${year}`,
      `June ${year}`,
      `July ${year}`,
      `August ${year}`,
      `September ${year}`,
      `October ${year}`,
      `November ${year}`,
      `December ${year}`,
    ];
  return [`Q1 ${year}`, `Q2 ${year}`, `Q3 ${year}`, `Q4 ${year}`];
};
