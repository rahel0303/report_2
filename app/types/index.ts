import { LucideIcon } from 'lucide-react';

// Theme Configuration
export interface ThemePreset {
  id: string;
  name: string;
  type: 'light' | 'dark';
  colors: string[];
  brandColor: string;
  textColor: string;
}

// Font Configuration
export interface FontOption {
  id: string;
  name: string;
}

// Report Configuration
export interface ReportConfig {
  reportTitle: string;
  reportDetails: string;
  preparedBy: string;
  reportType: 'Monthly' | 'Quarterly';
  period: string;
  theme: ThemePreset;
  font: FontOption;
  clientName: string;
  selectedCompetitors: string[];
  coverDesign?: {
    templateId: number;
    logoData: string;
    colors: {
      primary: string;
      secondary: string;
      accent: string;
    };
    contentMode?: 'light' | 'dark';
  };
}

// Slide Types
export type SlideType =
  | 'cover'
  | 'dashboard'
  | 'placeholder'
  | 'layout_dashboard'
  | 'layout_comparison'
  | 'layout_kpi'
  | 'layout_content'
  | 'layout_overview'
  | 'layout_custom'
  | 'section_heading';

export interface Slide {
  id: number;
  type: SlideType;
  title: string;
  content: Record<string, any>;
}

// Table Configuration
export interface TableColumn {
  id: string;
  label: string;
  format: 'number' | 'percent' | 'compact' | 'time';
}

export interface TableType {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
  rowType: 'comparison' | 'channels' | 'types' | 'competitors' | 'sentiments' | 'generic';
  columns: TableColumn[];
}

export interface TableConfig {
  type: string;
  columns: string[];
}

// Metric Types
export interface Metric {
  id: string;
  label: string;
  icon: LucideIcon;
}

export interface MetricData {
  id: string;
  label: string;
  value: string;
  trend: 'up' | 'down';
  trendValue: string;
  iconId: string;
}

// Chart Types
export type ChartType = 'line' | 'bar' | 'column' | 'pie' | 'posts' | 'wordcloud';

export interface ChartSettings {
  count?: number;
}

export interface ChartData {
  type: ChartType;
  settings: ChartSettings;
  title: string;
}

// Template Types
export interface Template {
  id: string;
  name: string;
  icon: LucideIcon;
  desc: string;
}

// Chart Data Types
export interface LineChartDataPoint {
  name: string;
  val: number;
  val2: number;
}

export interface PieChartDataPoint {
  name: string;
  value: number;
  [key: string]: any;
}

export interface PostData {
  id: number;
  reach: number;
  eng: number;
  image?: string;
}

// Dashboard Data Types
export interface DashboardChartDataPoint {
  date: string;
  formattedDate: string;
  reach: number;
  followers: number;
}

export interface SummaryMetrics {
  label: string;
  profileReach: number;
  profileVisit: number;
  growth: number;
  reach: number;
  engagement: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  erReach: number;
  erFollowers: number;
}

export interface SummaryData {
  previous: SummaryMetrics;
  current: SummaryMetrics;
}

export interface TableColumnDef {
  key: string;
  label: string;
  isPercent?: boolean;
}

// Post Content Types
export interface Post {
  id: number;
  image: string | null;
  reach: number;
  engagement: number;
  er: string;
  link: string;
}

// Component Props Types
export interface EditableSlideProps {
  title: string;
  onChange: (title: string) => void;
  isDark: boolean;
}

export interface EmptyStateBoxProps {
  icon?: LucideIcon;
  label: string;
  className?: string;
}

export interface MetricSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (metric: Metric) => void;
  config: ReportConfig;
}

export interface TableSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (config: TableConfig) => void;
  config: ReportConfig;
}

export interface ChartSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: ChartType | string, settings?: ChartSettings) => void;
  config: ReportConfig;
  allowWordCloud?: boolean;
}

export interface InsightMethodSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectManual: () => void;
  onSelectAI: () => void;
  config: ReportConfig;
}

export interface AiPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (text: string) => void;
  config: ReportConfig;
  contextData?: any; // Optional data for analysis
  contextType?: string; // Type of analysis
  autoGenerate?: boolean; // If true, generates without user prompt
}

export interface MetricScorecardProps {
  config: ReportConfig;
  className?: string;
  savedState?: MetricData | null;
  onSave?: (data: MetricData) => void;
  isExport?: boolean;
}

export interface SmartTableBlockProps {
  config: ReportConfig;
  savedState?: TableConfig | null;
  onSave?: (config: TableConfig) => void;
  className?: string;
  isExport?: boolean;
}

export interface SmartChartBlockProps {
  label: string;
  className?: string;
  config: ReportConfig;
  savedState?: ChartData | null;
  onSave?: (data: ChartData) => void;
  isExport?: boolean;
  allowWordCloud?: boolean;
}

export interface SmartInsightBlockProps {
  icon?: LucideIcon;
  label: string;
  className?: string;
  config: ReportConfig;
  savedState?: string | null;
  onSave?: (content: string) => void;
  contextData?: any; // Data to auto-analyze
  contextType?: string; // Type of data (e.g., 'instagram_summary', 'growth_analysis')
  isExport?: boolean;
}

export interface LayoutProps {
  config: ReportConfig;
  title?: string;
  onTitleChange?: (title: string) => void;
  data?: Record<string, any>;
  onUpdate?: (key: string, value: any) => void;
  currentPage?: number;
  totalPages?: number;
  isExport?: boolean;
}

export interface ReportCoverVisualProps {
  config: ReportConfig;
  mode?: 'full' | 'preview' | 'thumbnail';
}

export interface InstagramDashboardSlideProps {
  config: ReportConfig;
  isThumbnail?: boolean;
  currentPage?: number;
  totalPages?: number;
  isExport?: boolean;
}

export interface PlaceholderSlideProps {
  onOpenSelector?: () => void;
}
