export interface CoverTemplate {
  id: number;
  name: string;
  description: string;
  patternStyle: string;
}

export interface LogoAnalysis {
  dominantColors: string[];
  colorPalette: {
    primary: string;
    secondary: string;
    accent: string;
  };
  mood: string;
  industry: string;
  recommendedTemplates: number[];
  designSuggestions: {
    patternStyle: string;
    complexity: string;
    contrast: string;
  };
}

export interface CoverDesignProps {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  logo?: string;
  title: string;
  subtitle?: string;
  period?: string;
  fontFamily?: string;
}
