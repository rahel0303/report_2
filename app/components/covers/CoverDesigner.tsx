'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Sun, Moon } from 'lucide-react';
import {
  GeometricTemplate,
  FluidWavesTemplate,
  AbstractTemplate,
  MinimalGradientTemplate,
  ModernGridTemplate,
} from './CoverTemplates';
import { CoverTemplate, LogoAnalysis } from '@/app/types/cover';
import { extractColorsFromImage } from '@/app/utils/colorExtractor';
import { MiniTemplatePreview } from './MiniTemplatePreview';
import type { ContentMode } from '@/app/utils/themeStyles';

const TEMPLATES: CoverTemplate[] = [
  {
    id: 1,
    name: 'Geometric Patterns',
    description: 'Modern geometric shapes with bold colors',
    patternStyle: 'geometric',
  },
  {
    id: 2,
    name: 'Fluid Waves',
    description: 'Smooth flowing waves with gradients',
    patternStyle: 'waves',
  },
  {
    id: 3,
    name: 'Abstract Shapes',
    description: 'Creative abstract elements with dynamic composition',
    patternStyle: 'abstract',
  },
  {
    id: 4,
    name: 'Minimal Gradient',
    description: 'Clean gradients with subtle patterns',
    patternStyle: 'gradient',
  },
  {
    id: 5,
    name: 'Modern Grid',
    description: 'Contemporary grid-based design with depth',
    patternStyle: 'grid',
  },
];

interface CoverDesignerProps {
  onSelectCover?: (
    templateId: number,
    logoData: string,
    colors: any,
    title: string,
    subtitle: string,
    period: string,
    contentMode: ContentMode,
  ) => void;
  initialTitle?: string;
  initialSubtitle?: string;
  initialPeriod?: string;
  fontFamily?: string;
}

export const CoverDesigner: React.FC<CoverDesignerProps> = ({
  onSelectCover,
  initialTitle,
  initialSubtitle,
  initialPeriod,
  fontFamily = 'Inter',
}) => {
  const [logoFile, setLogoFile] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<LogoAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [title, setTitle] = useState(initialTitle || 'Social Media Report');
  const [subtitle, setSubtitle] = useState(initialSubtitle || 'Performance Analytics & Insights');
  const [period, setPeriod] = useState(initialPeriod || 'January 2026');
  const [contentMode, setContentMode] = useState<ContentMode>('light');

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Preview logo
    const reader = new FileReader();
    reader.onload = async () => {
      const logoDataUrl = reader.result as string;
      setLogoFile(logoDataUrl);
      setLoading(true);

      // Extract colors from uploaded logo
      try {
        const extractedColors = await extractColorsFromImage(logoDataUrl);
        setAnalysis({
          dominantColors: [
            extractedColors.primary,
            extractedColors.secondary,
            extractedColors.accent,
          ],
          colorPalette: extractedColors,
          mood: 'modern',
          industry: 'unknown',
          recommendedTemplates: [],
          designSuggestions: {
            patternStyle: 'modern',
            complexity: 'moderate',
            contrast: 'medium',
          },
        });
      } catch (error) {
        console.error('Color extraction failed:', error);
        alert('Failed to extract colors from logo. Please try another image.');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.svg'],
    },
    maxFiles: 1,
  });

  const getTemplateComponent = (templateId: number, forceColors?: any) => {
    const colors = forceColors ||
      analysis?.colorPalette || {
        primary: '#3B82F6',
        secondary: '#8B5CF6',
        accent: '#EC4899',
      };

    const props = {
      colors,
      logo: logoFile || undefined,
      title,
      subtitle,
      period,
      fontFamily,
    };

    switch (templateId) {
      case 1:
        return <GeometricTemplate {...props} />;
      case 2:
        return <FluidWavesTemplate {...props} />;
      case 3:
        return <AbstractTemplate {...props} />;
      case 4:
        return <MinimalGradientTemplate {...props} />;
      case 5:
        return <ModernGridTemplate {...props} />;
      default:
        return null;
    }
  };

  const handleSelectCover = () => {
    if (selectedTemplate && logoFile && onSelectCover) {
      onSelectCover(
        selectedTemplate,
        logoFile,
        analysis?.colorPalette || {
          primary: '#3B82F6',
          secondary: '#8B5CF6',
          accent: '#EC4899',
        },
        title,
        subtitle,
        period,
        contentMode,
      );
      // Show success message
      alert(
        'Cover design applied successfully! 🎉\n\nYou can now see your custom cover in the preview.',
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Cover Design Studio</h1>
        <p className="text-gray-600 mb-8">
          Upload your logo and choose the perfect cover design for your report
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar - Upload & Settings */}
          <div className="space-y-6">
            {/* Logo Upload */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Upload Logo</h2>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input {...getInputProps()} />
                {logoFile ? (
                  <div className="space-y-2">
                    <img src={logoFile} alt="Logo" className="h-24 mx-auto object-contain" />
                    <p className="text-sm text-gray-600">Click or drag to change</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <p className="text-gray-600">
                      {isDragActive ? 'Drop the logo here' : 'Drag & drop logo or click to browse'}
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, SVG up to 10MB</p>
                  </div>
                )}
              </div>
              {loading && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <div>
                      <p className="text-sm font-semibold text-blue-900">
                        🎨 Extracting colors from your logo...
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Analyzing brand colors for templates
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {!loading && analysis && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm font-semibold text-green-900 flex items-center gap-2">
                    ✅ Colors extracted! Choose your preferred template below
                  </p>
                </div>
              )}
            </div>

            {/* Extracted Colors with Override */}
            {analysis && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Brand Colors</h2>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Click to edit</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <label className="relative cursor-pointer group">
                      <div
                        className="w-12 h-12 rounded-lg border-2 border-gray-200 shadow-sm transition-transform group-hover:scale-105"
                        style={{ backgroundColor: analysis.colorPalette.primary }}
                      />
                      <input
                        type="color"
                        value={analysis.colorPalette.primary}
                        onChange={(e) => setAnalysis({
                          ...analysis,
                          colorPalette: { ...analysis.colorPalette, primary: e.target.value }
                        })}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </label>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-700">Primary</p>
                      <input
                        type="text"
                        value={analysis.colorPalette.primary}
                        onChange={(e) => setAnalysis({
                          ...analysis,
                          colorPalette: { ...analysis.colorPalette, primary: e.target.value }
                        })}
                        className="text-xs text-gray-500 font-mono bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none w-20"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="relative cursor-pointer group">
                      <div
                        className="w-12 h-12 rounded-lg border-2 border-gray-200 shadow-sm transition-transform group-hover:scale-105"
                        style={{ backgroundColor: analysis.colorPalette.secondary }}
                      />
                      <input
                        type="color"
                        value={analysis.colorPalette.secondary}
                        onChange={(e) => setAnalysis({
                          ...analysis,
                          colorPalette: { ...analysis.colorPalette, secondary: e.target.value }
                        })}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </label>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-700">Secondary</p>
                      <input
                        type="text"
                        value={analysis.colorPalette.secondary}
                        onChange={(e) => setAnalysis({
                          ...analysis,
                          colorPalette: { ...analysis.colorPalette, secondary: e.target.value }
                        })}
                        className="text-xs text-gray-500 font-mono bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none w-20"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="relative cursor-pointer group">
                      <div
                        className="w-12 h-12 rounded-lg border-2 border-gray-200 shadow-sm transition-transform group-hover:scale-105"
                        style={{ backgroundColor: analysis.colorPalette.accent }}
                      />
                      <input
                        type="color"
                        value={analysis.colorPalette.accent}
                        onChange={(e) => setAnalysis({
                          ...analysis,
                          colorPalette: { ...analysis.colorPalette, accent: e.target.value }
                        })}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </label>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-700">Accent</p>
                      <input
                        type="text"
                        value={analysis.colorPalette.accent}
                        onChange={(e) => setAnalysis({
                          ...analysis,
                          colorPalette: { ...analysis.colorPalette, accent: e.target.value }
                        })}
                        className="text-xs text-gray-500 font-mono bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none w-20"
                      />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-3 italic">
                  Colors auto-extracted from logo. Click swatches or type hex codes to customize.
                </p>
              </div>
            )}

            {/* Text Settings */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Cover Text</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
                  <input
                    type="text"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Content Theme Mode */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-2">Content Theme</h2>
              <p className="text-xs text-gray-500 mb-4">Choose light or dark mode for your report slides</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setContentMode('light')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all ${
                    contentMode === 'light'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Sun size={20} />
                  <span className="font-medium">Light</span>
                </button>
                <button
                  onClick={() => setContentMode('dark')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all ${
                    contentMode === 'dark'
                      ? 'border-indigo-500 bg-indigo-900 text-white'
                      : 'border-gray-200 bg-gray-800 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <Moon size={20} />
                  <span className="font-medium">Dark</span>
                </button>
              </div>
            </div>

            {/* Action Button */}
            {selectedTemplate && logoFile && (
              <button
                onClick={handleSelectCover}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors"
              >
                Use This Design
              </button>
            )}
          </div>

          {/* Right Side - Template Gallery */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Choose Your Template</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {TEMPLATES.map((template) => {
                  const isSelected = selectedTemplate === template.id;

                  // Create unique key that changes when colors change to force re-render
                  const colorKey = analysis?.colorPalette
                    ? `${analysis.colorPalette.primary}-${analysis.colorPalette.secondary}-${analysis.colorPalette.accent}`
                    : 'default';

                  const currentColors = analysis?.colorPalette || {
                    primary: '#3B82F6',
                    secondary: '#8B5CF6',
                    accent: '#EC4899',
                  };

                  return (
                    <div
                      key={`${template.id}-${colorKey}`}
                      onClick={() => setSelectedTemplate(template.id)}
                      className={`relative cursor-pointer rounded-xl overflow-hidden transition-all group ${
                        isSelected
                          ? 'ring-3 ring-blue-500 shadow-xl scale-105'
                          : 'ring-1 ring-gray-200 hover:ring-2 hover:ring-blue-300 hover:shadow-lg'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-2 left-2 z-20 bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-lg">
                          ✓
                        </div>
                      )}

                      {/* Mini Preview */}
                      <div className="aspect-[4/3] relative">
                        <MiniTemplatePreview templateId={template.id} colors={currentColors} />

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-200" />
                      </div>

                      {/* Info Section */}
                      <div
                        className={`p-2.5 transition-colors ${
                          isSelected ? 'bg-blue-50' : 'bg-white'
                        }`}
                      >
                        <h3
                          className={`text-xs font-semibold mb-0.5 ${
                            isSelected ? 'text-blue-900' : 'text-gray-900'
                          }`}
                        >
                          {template.name}
                        </h3>
                        <p className="text-[10px] text-gray-500 line-clamp-1">
                          {template.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Large Preview */}
              {selectedTemplate && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">Cover Preview</h3>
                  <div
                    key={`preview-${selectedTemplate}-${analysis?.colorPalette?.primary || 'default'}`}
                    className="aspect-video rounded-lg overflow-hidden shadow-xl"
                  >
                    {getTemplateComponent(selectedTemplate)}
                  </div>
                </div>
              )}

              {/* Content Theme Preview */}
              {analysis && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">Content Theme Preview</h3>
                  <div
                    key={`content-preview-${contentMode}-${analysis?.colorPalette?.primary || 'default'}`}
                    className="aspect-video rounded-lg overflow-hidden shadow-xl"
                  >
                    <ContentThemePreview
                      colors={analysis.colorPalette}
                      mode={contentMode}
                      fontFamily={fontFamily}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Content Theme Preview Component
interface ContentThemePreviewProps {
  colors: { primary: string; secondary: string; accent: string };
  mode: ContentMode;
  fontFamily: string;
}

const ContentThemePreview: React.FC<ContentThemePreviewProps> = ({ colors, mode, fontFamily }) => {
  const isDark = mode === 'dark';

  // Helper to convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
      : { r: 59, g: 130, b: 246 };
  };

  const rgb = hexToRgb(colors.primary);
  const rgbSecondary = hexToRgb(colors.secondary);

  const styles = {
    bg: isDark
      ? `linear-gradient(135deg, #0f172a 0%, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.05) 50%, #0f172a 100%)`
      : `linear-gradient(135deg, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.03) 0%, rgba(${rgbSecondary.r}, ${rgbSecondary.g}, ${rgbSecondary.b}, 0.02) 100%)`,
    cardBg: isDark ? 'rgba(30, 41, 59, 0.8)' : '#ffffff',
    border: isDark ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)` : `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`,
    textMain: isDark ? '#f8fafc' : '#1e293b',
    textMuted: isDark ? '#94a3b8' : '#64748b',
    accentLine: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.secondary} 50%, ${colors.accent} 100%)`,
  };

  return (
    <div
      className="w-full h-full p-4 relative overflow-hidden"
      style={{ background: styles.bg, fontFamily }}
    >
      {/* Accent line at top */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px]"
        style={{ background: styles.accentLine }}
      />

      {/* Decorative circles */}
      <div
        className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-50"
        style={{ background: isDark ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)` : `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.06)`, filter: 'blur(20px)' }}
      />

      {/* Header */}
      <div
        className="rounded-lg px-3 py-2 mb-3 flex items-center justify-between"
        style={{
          background: isDark
            ? `linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1) 100%)`
            : `linear-gradient(135deg, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.08) 0%, rgba(${rgbSecondary.r}, ${rgbSecondary.g}, ${rgbSecondary.b}, 0.04) 100%)`,
          border: `1px solid ${styles.border}`,
        }}
      >
        <span className="text-sm font-bold" style={{ color: styles.textMain }}>
          Dashboard Preview
        </span>
        <div
          className="px-2 py-0.5 rounded text-[10px] font-medium text-white"
          style={{ background: styles.accentLine }}
        >
          {mode === 'dark' ? 'Dark Mode' : 'Light Mode'}
        </div>
      </div>

      {/* Content Grid */}
      <div className="flex gap-3 h-[calc(100%-80px)]">
        {/* Chart Card */}
        <div
          className="flex-[2] rounded-lg p-3 relative overflow-hidden"
          style={{
            backgroundColor: styles.cardBg,
            border: `1px solid ${styles.border}`,
            boxShadow: isDark
              ? `0 4px 20px rgba(0, 0, 0, 0.3), 0 0 40px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`
              : `0 4px 20px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.08)`,
          }}
        >
          {/* Card accent line */}
          <div
            className="absolute top-0 left-3 right-3 h-[2px] rounded-full"
            style={{ background: styles.accentLine }}
          />

          <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: styles.textMuted }}>
            Chart Area
          </div>

          {/* Fake chart bars */}
          <div className="flex items-end gap-2 h-[60%] mt-2">
            {[65, 85, 45, 90, 70, 55, 80].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t transition-all"
                style={{
                  height: `${h}%`,
                  background: i % 2 === 0 ? colors.primary : colors.secondary,
                  opacity: 0.8,
                }}
              />
            ))}
          </div>

          {/* Fake axis labels */}
          <div className="flex justify-between mt-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => (
              <span key={i} className="text-[8px]" style={{ color: styles.textMuted }}>
                {d}
              </span>
            ))}
          </div>
        </div>

        {/* Metrics & Insights */}
        <div className="flex-1 flex flex-col gap-3">
          {/* Metric Cards */}
          <div className="flex gap-2">
            {[
              { label: 'Reach', value: '45.2K', trend: '+12%' },
              { label: 'Eng.', value: '3.2K', trend: '+8%' },
            ].map((m, i) => (
              <div
                key={i}
                className="flex-1 rounded-lg p-2"
                style={{
                  backgroundColor: styles.cardBg,
                  border: `1px solid ${styles.border}`,
                }}
              >
                <div className="text-[8px] uppercase tracking-wider" style={{ color: styles.textMuted }}>
                  {m.label}
                </div>
                <div className="text-sm font-bold" style={{ color: styles.textMain }}>
                  {m.value}
                </div>
                <div className="text-[8px] font-bold text-emerald-500">{m.trend}</div>
              </div>
            ))}
          </div>

          {/* Insights Card */}
          <div
            className="flex-1 rounded-lg p-2 relative overflow-hidden"
            style={{
              backgroundColor: styles.cardBg,
              border: `1px solid ${styles.border}`,
            }}
          >
            <div className="text-[8px] font-bold uppercase tracking-wider mb-1" style={{ color: styles.textMuted }}>
              Key Insights
            </div>
            <div className="space-y-1">
              {['Engagement up by **12%**', 'Peak time at **9 AM**', 'Reels perform **2x** better'].map(
                (insight, i) => (
                  <div key={i} className="flex gap-1 text-[8px]" style={{ color: styles.textMain }}>
                    <span style={{ color: colors.accent }}>•</span>
                    <span>{insight.replace(/\*\*/g, '')}</span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        className="absolute bottom-0 left-0 right-0 h-8 flex items-center justify-between px-4"
        style={{
          background: isDark
            ? `linear-gradient(to right, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.03), rgba(30,41,59,0.98), rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.03))`
            : `linear-gradient(to right, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.03), rgba(255,255,255,0.98), rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.03))`,
          borderTop: `2px solid ${colors.primary}`,
        }}
      >
        <span className="text-[8px]" style={{ color: styles.textMuted }}>
          Client Name • January 2026
        </span>
        <span className="text-[8px] font-bold" style={{ color: colors.primary }}>
          Sekata
        </span>
      </div>
    </div>
  );
};
