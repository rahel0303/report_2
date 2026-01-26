'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
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
  ) => void;
  initialTitle?: string;
  initialSubtitle?: string;
  initialPeriod?: string;
}

export const CoverDesigner: React.FC<CoverDesignerProps> = ({
  onSelectCover,
  initialTitle,
  initialSubtitle,
  initialPeriod,
}) => {
  const [logoFile, setLogoFile] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<LogoAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [title, setTitle] = useState(initialTitle || 'Social Media Report');
  const [subtitle, setSubtitle] = useState(initialSubtitle || 'Performance Analytics & Insights');
  const [period, setPeriod] = useState(initialPeriod || 'January 2026');

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

            {/* Extracted Colors */}
            {analysis && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">Extracted Colors</h2>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-12 h-12 rounded-lg border-2 border-gray-200 shadow-sm"
                      style={{ backgroundColor: analysis.colorPalette.primary }}
                    />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-700">Primary</p>
                      <p className="text-xs text-gray-500 font-mono">
                        {analysis.colorPalette.primary}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-12 h-12 rounded-lg border-2 border-gray-200 shadow-sm"
                      style={{ backgroundColor: analysis.colorPalette.secondary }}
                    />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-700">Secondary</p>
                      <p className="text-xs text-gray-500 font-mono">
                        {analysis.colorPalette.secondary}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-12 h-12 rounded-lg border-2 border-gray-200 shadow-sm"
                      style={{ backgroundColor: analysis.colorPalette.accent }}
                    />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-700">Accent</p>
                      <p className="text-xs text-gray-500 font-mono">
                        {analysis.colorPalette.accent}
                      </p>
                    </div>
                  </div>
                </div>
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
                  <h3 className="text-lg font-semibold mb-3">Full Preview</h3>
                  <div
                    key={`preview-${selectedTemplate}-${analysis?.colorPalette?.primary || 'default'}`}
                    className="aspect-video rounded-lg overflow-hidden shadow-xl"
                  >
                    {getTemplateComponent(selectedTemplate)}
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
