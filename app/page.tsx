'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Settings,
  Layout,
  Palette,
  ChevronRight,
  ArrowLeft,
  MousePointerClick,
  Edit3,
  ChevronDown,
  X,
  Plus,
  Download,
  Presentation,
  FileText,
  CheckCircle2,
} from 'lucide-react';

// Import types
import { ReportConfig, Slide, Template, ThemePreset } from './types';

// Import data
import themesDataRaw from './data/themes.json';
import fontsData from './data/fonts.json';
import clientsData from './data/clients.json';
import { getDummyDataForTemplate } from './data/dummyData';

// Import components
import { AppHeader, Toasts } from './components/report';
import { PlaceholderSlide, ReportCoverVisual, InstagramDashboardSlide, SectionHeadingSlide } from './components/slides';
import { LayoutDashboard, LayoutComparison, LayoutKPI, LayoutContent } from './components/layouts';
import { CoverDesigner } from './components/covers/CoverDesigner';
import { CustomCover } from './components/covers/CustomCover';
import {
  TemplateModal,
  SaveModal,
  LoadModal,
  LoadReportsModal,
  TemplateSelectionModal,
  ExitModal,
  SlideTypeSelectionModal,
  ChannelSelectionModal,
  GridSizeModal,
} from './components/report/modals';
import type { SocialChannel, GridSize } from './components/report/modals';

// Import utilities
import { LAYOUT_TEMPLATES, getPeriodOptions } from './constants/templates';
import { handleDownload } from './utils/exportHelpers';
import {
  clearAllStorage,
  clearCurrentWorkOnly,
  getDefaultSlides,
  getDefaultConfig,
  loadSlidesFromStorage,
  saveSlidesToStorage,
  initializeDefaultTemplate,
} from './utils/storageHelpers';
import { renderSlide } from './utils/slideRenderer';

const themesData = themesDataRaw as ThemePreset[];

const ReportSetupInterface: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<
    'setup' | 'review' | 'edit_cover' | 'edit_generic' | 'design_cover'
  >('setup');
  const [editingTitleId, setEditingTitleId] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [showExportToast, setShowExportToast] = useState(false);

  const [slides, setSlides] = useState<Slide[]>([]);
  const [activeSlideId, setActiveSlideId] = useState<number | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isSlideTypeModalOpen, setIsSlideTypeModalOpen] = useState(false);
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<SocialChannel | null>(null);
  const [isGridSizeModalOpen, setIsGridSizeModalOpen] = useState(false);
  const [isCompetitorDropdownOpen, setIsCompetitorDropdownOpen] = useState(false);
  const [isSaveDropdownOpen, setIsSaveDropdownOpen] = useState(false);
  const [isLoadDropdownOpen, setIsLoadDropdownOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [isTemplateSelectionOpen, setIsTemplateSelectionOpen] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [isLoadReportsModalOpen, setIsLoadReportsModalOpen] = useState(false);
  const [saveMode, setSaveMode] = useState<'template' | 'report'>('template');
  const [loadMode, setLoadMode] = useState<'template' | 'report'>('template');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const downloadRef = useRef<HTMLDivElement>(null);
  const saveDropdownRef = useRef<HTMLDivElement>(null);
  const loadDropdownRef = useRef<HTMLDivElement>(null);

  // Load slides from localStorage on mount
  useEffect(() => {
    setSlides(loadSlidesFromStorage());
  }, []);

  // Auto-save slides to localStorage whenever they change
  useEffect(() => {
    saveSlidesToStorage(slides);
  }, [slides]);

  const [config, setConfig] = useState<ReportConfig>(getDefaultConfig());

  // Load config from localStorage on mount - ONLY if localStorage has it and state is default
  useEffect(() => {
    // Skip loading from localStorage - let user configure fresh each time
    // This prevents old cached values from overriding current selections
    console.log('Current config:', config);
  }, []);

  // Track config changes for debugging
  useEffect(() => {
    console.log('✅ Config updated:', {
      clientName: config.clientName,
      period: config.period,
      timestamp: new Date().toISOString(),
    });
  }, [config.clientName, config.period]);

  // DON'T auto-save config - only save when explicitly saving report/template
  // This prevents localStorage from caching old selections
  // useEffect(() => {
  //   localStorage.setItem('report_config', JSON.stringify(config));
  // }, [config]);

  // Initialize default template in localStorage on first load
  useEffect(() => {
    initializeDefaultTemplate();
  }, []);

  const [previewMode, setPreviewMode] = useState<'cover' | 'content'>('cover');

  const handleCoverDesignSelect = (
    templateId: number,
    logoData: string,
    colors: any,
    title: string,
    subtitle: string,
    period: string,
    contentMode: 'light' | 'dark' = 'light',
  ) => {
    setConfig((prev) => ({
      ...prev,
      reportTitle: title,
      reportDetails: subtitle,
      period: period,
      coverDesign: {
        templateId,
        logoData,
        colors,
        contentMode,
      },
    }));
    setCurrentStep('setup');
  };

  const resetToInitialState = () => {
    clearCurrentWorkOnly();
    setSlides(getDefaultSlides());
    setConfig(getDefaultConfig());
    setCurrentStep('setup');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCompetitorDropdownOpen(false);
      }
      if (downloadRef.current && !downloadRef.current.contains(event.target as Node)) {
        setIsDownloadOpen(false);
      }
      if (saveDropdownRef.current && !saveDropdownRef.current.contains(event.target as Node)) {
        setIsSaveDropdownOpen(false);
      }
      if (loadDropdownRef.current && !loadDropdownRef.current.contains(event.target as Node)) {
        setIsLoadDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Keyboard navigation for slides
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (currentStep !== 'edit_cover' && currentStep !== 'edit_generic') return;

      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        goToNextSlide();
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        goToPrevSlide();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentStep, activeSlideId, slides]);

  const goNext = () => {
    setCurrentStep('review');
    window.scrollTo(0, 0);
  };
  const goBack = () => setCurrentStep('setup');
  const goBackToReview = () => setCurrentStep('review');

  const handleSaveToSetup = () => {
    setShowSaveToast(true);
    setTimeout(() => {
      setShowSaveToast(false);
      setCurrentStep('setup');
    }, 1500);
  };

  const handleDownloadWrapper = async (format: string) => {
    setIsDownloadOpen(false);
    await handleDownload(format, slides, config, setIsExporting, setShowExportToast);
  };

  const goToSlide = (id: number) => {
    setActiveSlideId(id);
    const slide = slides.find((s) => s.id === id);
    if (slide && slide.type === 'cover') {
      setCurrentStep('edit_cover');
    } else {
      setCurrentStep('edit_generic');
    }
    window.scrollTo(0, 0);
  };

  const goToNextSlide = () => {
    if (!activeSlideId) return;
    const currentIndex = slides.findIndex((s) => s.id === activeSlideId);
    if (currentIndex < slides.length - 1) {
      const nextSlide = slides[currentIndex + 1];
      goToSlide(nextSlide.id);
    }
  };

  const goToPrevSlide = () => {
    if (!activeSlideId) return;
    const currentIndex = slides.findIndex((s) => s.id === activeSlideId);
    if (currentIndex > 0) {
      const prevSlide = slides[currentIndex - 1];
      goToSlide(prevSlide.id);
    }
  };

  const handleRename = (id: number, newTitle: string) => {
    if (!newTitle.trim()) {
      setEditingTitleId(null);
      return;
    }
    setSlides(slides.map((s) => (s.id === id ? { ...s, title: newTitle } : s)));
    setEditingTitleId(null);
  };

  const handleSlideTitleChange = (id: number, newTitle: string) => {
    setSlides(slides.map((s) => (s.id === id ? { ...s, title: newTitle } : s)));
  };

  const handleDeleteSlide = (slideId: number) => {
    // Prevent deleting the cover slide
    const slideToDelete = slides.find((s) => s.id === slideId);
    if (slideToDelete?.type === 'cover') {
      alert('Cannot delete the cover slide!');
      return;
    }

    if (confirm('Are you sure you want to delete this slide?')) {
      setSlides(slides.filter((s) => s.id !== slideId));
      // If the deleted slide was active, go back to review
      if (activeSlideId === slideId) {
        setActiveSlideId(null);
        setCurrentStep('review');
      }
    }
  };

  const handleSaveAsTemplate = async (name: string) => {
    console.log('Saving template structure, current slides:', slides);

    const templateSlides = slides.map((slide) => {
      let contentStructure: any = {};

      if (slide.content && typeof slide.content === 'object') {
        Object.keys(slide.content).forEach((key) => {
          const value = slide.content[key];
          if (value && typeof value === 'object' && Object.keys(value).length > 0) {
            if ((key === 'chart' || key.startsWith('chart_')) && value.chartType) {
              contentStructure[key] = {
                chartType: value.chartType,
                dataLength: value.data?.length || 4,
              };
            } else {
              contentStructure[key] = {};
            }
          }
        });
      }

      return {
        id: slide.id,
        type: slide.type,
        title: slide.title,
        content: contentStructure,
      };
    });

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slides: templateSlides,
          config: {
            theme: config.theme,
            font: config.font,
            coverDesign: config.coverDesign,
          },
          reportType: 'template',
        }),
      });

      if (!response.ok) throw new Error('Gagal menyimpan template');

      setIsSaveModalOpen(false);
      alert(`Template "${name}" berhasil disimpan!`);
      resetToInitialState();
    } catch (error) {
      console.error('Save template error:', error);
      alert('Gagal menyimpan template');
    }
  };

  const handleSaveAsReport = async (name: string) => {
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slides: slides,
          config: config,
          reportType: 'report',
        }),
      });

      if (!response.ok) throw new Error('Gagal menyimpan report');

      setIsSaveModalOpen(false);
      alert(`Report "${name}" berhasil disimpan!`);
      resetToInitialState();
    } catch (error) {
      console.error('Save report error:', error);
      alert('Gagal menyimpan report');
    }
  };

  const handleLoadTemplate = (template: any) => {
    if (confirm('Muat template ini? Perubahan yang belum disimpan akan hilang.')) {
      console.log('🔵 Loading template structure:', template);
      console.log('🔵 Current selected brand:', config.clientName);

      // Template dari API memiliki struktur berbeda (config langsung, bukan templateData)
      const templateConfig = template.config || template.templateData || {};

      setConfig((prev) => ({
        ...prev,
        theme: templateConfig.theme || prev.theme,
        font: templateConfig.font || prev.font,
        coverDesign: prev.coverDesign || templateConfig.coverDesign,
      }));

      const loadedSlides = template.slides.map((slide: any) => {
        if (slide.type.startsWith('layout_')) {
          const allDummyData = getDummyDataForTemplate(config.clientName, slide.type);
          const templateStructure = slide.content || {};

          console.log(`\n📦 Processing ${slide.type}:`);
          console.log('  Template structure:', templateStructure);
          console.log('  Dummy data available:', Object.keys(allDummyData));

          const populatedContent: any = {};

          // If template structure is empty, populate with ALL dummy data
          if (Object.keys(templateStructure).length === 0) {
            console.log('  ⚠️ Empty template structure, populating ALL fields');
            Object.assign(populatedContent, allDummyData);
            console.log('  ✅ Populated with:', Object.keys(populatedContent));
          } else {
            console.log('  📋 Template has structure, populating according to it');
            // Template has structure - populate according to it
            Object.keys(templateStructure).forEach((key) => {
              const structureInfo = templateStructure[key];
              console.log(`    Processing key: ${key}`, structureInfo);

              // Handle charts with structure metadata
              if (
                (key === 'chart' || key.startsWith('chart_') || key.includes('chart')) &&
                structureInfo?.chartType
              ) {
                // Try to find matching chart data - try exact key first, then fallback to 'chart'
                let dummyChartData = allDummyData[key];

                // If key is 'main_chart' or similar, try 'chart' as fallback
                if (!dummyChartData && key !== 'chart') {
                  console.log(`      🔍 Key "${key}" not found, trying "chart" as fallback`);
                  dummyChartData = allDummyData['chart'];
                }

                console.log(`      🎨 Chart found! Dummy data:`, dummyChartData);
                if (dummyChartData) {
                  // Use template's chartType and dataLength
                  const dataLength = structureInfo.dataLength || 4;
                  populatedContent[key] = {
                    chartType: structureInfo.chartType, // Keep same chart type
                    data: dummyChartData.data?.slice(0, dataLength) || [], // Keep same number of data points
                  };
                  console.log(
                    `      ✅ Chart ${key} populated: type=${structureInfo.chartType}, points=${dataLength}`,
                  );
                } else {
                  console.log(`      ❌ No dummy data for chart ${key}`);
                }
              }
              // Handle other fields normally
              else if (allDummyData[key]) {
                populatedContent[key] = allDummyData[key];
                console.log(`      ✅ ${key} populated with ${config.clientName} data`);
              } else {
                console.log(`      ❌ No dummy data for ${key}`);
              }
            });
            console.log('  ✅ Final content keys:', Object.keys(populatedContent));
          }

          return {
            ...slide,
            content: populatedContent,
          };
        }

        return slide;
      });

      setSlides(loadedSlides);
      setIsLoadModalOpen(false);
      setCurrentStep('review');
    }
  };

  const handleLoadReport = (report: any) => {
    if (confirm('Muat report ini? Perubahan yang belum disimpan akan hilang.')) {
      setConfig(report.config);
      setSlides(report.slides);
      setIsLoadModalOpen(false);
      setIsLoadReportsModalOpen(false);
      setCurrentStep('review');
    }
  };

  const handleDeleteSaved = async (id: string, type: 'template' | 'report') => {
    try {
      const response = await fetch(`/api/reports/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Gagal menghapus');
    } catch (error) {
      console.error('Delete error:', error);
      throw error;
    }
  };

  const handleSlideContentChange = (slideId: number, key: string, value: any) => {
    setSlides((prev) =>
      prev.map((slide) => {
        if (slide.id === slideId) {
          const updatedSlide = { ...slide, content: { ...slide.content, [key]: value } };
          // Sync section title to slide title for consistency in review grid
          if (key === 'sectionTitle' && typeof value === 'string') {
            updatedSlide.title = value;
          }
          return updatedSlide;
        }
        return slide;
      }),
    );
    // Show brief save indicator (optional)
    console.log('✓ Changes auto-saved');
  };

  const addNewPage = () => {
    const newId = slides.length + 1;
    const newSlide: Slide = {
      id: newId,
      type: 'placeholder',
      title: `New Slide ${newId}`,
      content: {},
    };
    setSlides([...slides, newSlide]);
    goToSlide(newId);
  };

  const handleTemplateSelect = (templateType: string) => {
    // For custom template, show grid size modal first
    if (templateType === 'layout_custom') {
      setIsTemplateModalOpen(false);
      setIsGridSizeModalOpen(true);
      return;
    }

    const templateMap: Record<string, string> = {
      layout_dashboard: 'Standard Dashboard',
      layout_comparison: 'Comparison Analysis',
      layout_kpi: 'KPI Performance',
      layout_content: 'Creative Analysis',
    };

    const channelNames: Record<SocialChannel, string> = {
      instagram: 'Instagram',
      facebook: 'Facebook',
      twitter: 'Twitter/X',
      tiktok: 'TikTok',
      youtube: 'YouTube',
    };

    setSlides(
      slides.map((s) => {
        if (s.id === activeSlideId) {
          const isGenericTitle = s.title.startsWith('New Slide');
          const channelSuffix = selectedChannel ? ` - ${channelNames[selectedChannel]}` : '';
          return {
            ...s,
            type: templateType as any,
            title: isGenericTitle ? `${templateMap[templateType]}${channelSuffix}` : s.title,
            content: {
              channel: selectedChannel, // Store selected channel
            },
          };
        }
        return s;
      }),
    );
    setIsTemplateModalOpen(false);
    setSelectedChannel(null); // Reset after use
  };

  const handleGridSizeSelect = (gridSize: GridSize) => {
    const channelNames: Record<SocialChannel, string> = {
      instagram: 'Instagram',
      facebook: 'Facebook',
      twitter: 'Twitter/X',
      tiktok: 'TikTok',
      youtube: 'YouTube',
    };

    setSlides(
      slides.map((s) => {
        if (s.id === activeSlideId) {
          const isGenericTitle = s.title.startsWith('New Slide');
          const channelSuffix = selectedChannel ? ` - ${channelNames[selectedChannel]}` : '';
          return {
            ...s,
            type: 'layout_custom' as any,
            title: isGenericTitle ? `Custom Template${channelSuffix}` : s.title,
            content: {
              channel: selectedChannel,
              gridSize,
            },
          };
        }
        return s;
      }),
    );
    setIsGridSizeModalOpen(false);
    setSelectedChannel(null);
  };

  const handleSectionHeadingSelect = () => {
    setSlides(
      slides.map((s) => {
        if (s.id === activeSlideId) {
          return {
            ...s,
            type: 'section_heading' as any,
            title: 'Section Heading',
            content: { sectionTitle: 'Section Title' },
          };
        }
        return s;
      }),
    );
    setIsSlideTypeModalOpen(false);
  };

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newClient = e.target.value;
    console.log('🔄 Client changed to:', newClient);
    setConfig((prev) => ({
      ...prev,
      clientName: newClient,
      selectedCompetitors: [],
    }));
  };

  const toggleCompetitor = (comp: string) => {
    setConfig((prev) => {
      const exists = prev.selectedCompetitors.includes(comp);
      return {
        ...prev,
        selectedCompetitors: exists
          ? prev.selectedCompetitors.filter((c) => c !== comp)
          : [...prev.selectedCompetitors, comp],
      };
    });
  };

  const renderActiveSlide = () => {
    const activeSlide = slides.find((s) => s.id === activeSlideId);
    if (!activeSlide) return null;

    const currentIndex = slides.findIndex((s) => s.id === activeSlide.id);
    const currentPage = currentIndex + 1;
    const totalPages = slides.length;

    if (activeSlide.type === 'placeholder') {
      return <PlaceholderSlide onOpenSelector={() => setIsSlideTypeModalOpen(true)} />;
    }

    return renderSlide(activeSlide, config, 'full', currentPage, totalPages, (key, value) =>
      handleSlideContentChange(activeSlide.id, key, value),
    );
  };

  const renderSlideThumbnail = (slide: Slide) => {
    return renderSlide(slide, config, 'thumbnail');
  };

  const templates: Template[] = LAYOUT_TEMPLATES;

  const CLIENT_DATA = clientsData as Record<string, string[]>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20 relative">
      <AppHeader currentStep={currentStep} />

      {/* TOASTS */}
      <Toasts
        showSaveToast={showSaveToast}
        isExporting={isExporting}
        showExportToast={showExportToast}
      />

      {/* SLIDE TYPE SELECTION MODAL */}
      <SlideTypeSelectionModal
        isOpen={isSlideTypeModalOpen}
        onClose={() => setIsSlideTypeModalOpen(false)}
        onSelectSectionHeading={handleSectionHeadingSelect}
        onSelectContentTemplate={() => {
          setIsSlideTypeModalOpen(false);
          setIsChannelModalOpen(true);
        }}
      />

      {/* CHANNEL SELECTION MODAL */}
      <ChannelSelectionModal
        isOpen={isChannelModalOpen}
        onClose={() => {
          setIsChannelModalOpen(false);
          setSelectedChannel(null);
        }}
        onSelect={(channel) => {
          setSelectedChannel(channel);
          setIsChannelModalOpen(false);
          setIsTemplateModalOpen(true);
        }}
      />

      {/* TEMPLATE MODAL */}
      <TemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelect={handleTemplateSelect}
        templates={templates}
      />

      {/* GRID SIZE MODAL (for Custom Template) */}
      <GridSizeModal
        isOpen={isGridSizeModalOpen}
        onClose={() => {
          setIsGridSizeModalOpen(false);
          setSelectedChannel(null);
        }}
        onSelect={handleGridSizeSelect}
      />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* SETUP STEP */}
        {currentStep === 'setup' && (
          <div className="grid grid-cols-12 gap-8 h-[calc(100vh-8rem)]">
            <div className="col-span-12 lg:col-span-4 space-y-6 h-full overflow-y-auto pr-2">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <h2 className="font-semibold text-slate-700 flex items-center gap-2">
                    <Settings size={16} /> Setup Report
                  </h2>
                  <button
                    onClick={() => setIsLoadReportsModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm hover:shadow-md"
                    title="Load Saved Reports"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Load
                  </button>
                </div>
                <div className="p-6 space-y-6">
                  {/* Cover Design Button */}
                  <div>
                    <button
                      onClick={() => setCurrentStep('design_cover')}
                      className="w-full p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <Palette size={20} />
                        <div className="text-left">
                          <div className="font-semibold">AI Cover Designer</div>
                          <div className="text-xs text-white/80">Upload logo & let AI design</div>
                        </div>
                      </div>
                      <ChevronRight
                        size={20}
                        className="group-hover:translate-x-1 transition-transform"
                      />
                    </button>
                  </div>

                  {/* Font Selection */}
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-400 mb-2 block">
                      Typography
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {fontsData.map((font) => (
                        <button
                          key={font.id}
                          onClick={() => setConfig({ ...config, font: font })}
                          className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                            config.font.id === font.id
                              ? 'border-slate-800 bg-slate-50 ring-1 ring-slate-800'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center text-lg text-slate-700"
                              style={{ fontFamily: font.name }}
                            >
                              Ag
                            </div>
                            <div className="text-left">
                              <div className="text-sm font-semibold text-slate-900">
                                {font.name}
                              </div>
                            </div>
                          </div>
                          {config.font.id === font.id && (
                            <CheckCircle2 size={16} className="text-slate-800" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Parameters */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase text-slate-400 mb-2 block">
                      Parameters
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                          Type
                        </label>
                        <select
                          value={config.reportType}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              reportType: e.target.value as 'Monthly' | 'Quarterly',
                            })
                          }
                          className="w-full border p-2 rounded text-sm bg-white"
                        >
                          <option value="Monthly">Monthly</option>
                          <option value="Quarterly">Quarterly</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                          Period
                        </label>
                        <select
                          value={config.period}
                          onChange={(e) => setConfig({ ...config, period: e.target.value })}
                          className="w-full border p-2 rounded text-sm bg-white"
                        >
                          {getPeriodOptions(config.reportType).map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Client */}
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                        Client Name
                      </label>
                      <select
                        value={config.clientName}
                        onChange={handleClientChange}
                        className="w-full border p-2 rounded text-sm bg-white cursor-pointer hover:border-blue-400 focus:border-blue-500 focus:outline-none transition-colors"
                      >
                        {Object.keys(CLIENT_DATA).map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Competitors */}
                    <div className="mt-2" ref={dropdownRef}>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-2">
                        Competitors (Multi-select)
                      </label>
                      <div className="relative">
                        <button
                          onClick={() => setIsCompetitorDropdownOpen(!isCompetitorDropdownOpen)}
                          className="w-full border p-2 rounded text-sm bg-white flex justify-between items-center text-left min-h-9.5 hover:border-blue-400 transition-colors"
                        >
                          <span
                            className={`truncate block ${
                              config.selectedCompetitors.length === 0
                                ? 'text-slate-400'
                                : 'text-slate-800'
                            }`}
                          >
                            {config.selectedCompetitors.length > 0
                              ? config.selectedCompetitors.join(', ')
                              : 'Select Competitors...'}
                          </span>
                          <ChevronDown
                            size={14}
                            className={`text-slate-400 transition-transform duration-200 ${
                              isCompetitorDropdownOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </button>

                        {isCompetitorDropdownOpen && (
                          <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            <div className="p-1">
                              {CLIENT_DATA[config.clientName].map((comp) => (
                                <label
                                  key={comp}
                                  className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer transition-colors group"
                                >
                                  <div
                                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                      config.selectedCompetitors.includes(comp)
                                        ? 'bg-blue-500 border-blue-500'
                                        : 'border-slate-300 group-hover:border-blue-400'
                                    }`}
                                  >
                                    {config.selectedCompetitors.includes(comp) && (
                                      <CheckCircle2 size={10} className="text-white" />
                                    )}
                                  </div>
                                  <input
                                    type="checkbox"
                                    checked={config.selectedCompetitors.includes(comp)}
                                    onChange={() => toggleCompetitor(comp)}
                                    className="hidden"
                                  />
                                  <span
                                    className={`text-xs font-medium ${
                                      config.selectedCompetitors.includes(comp)
                                        ? 'text-blue-700'
                                        : 'text-slate-700'
                                    }`}
                                  >
                                    {comp}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Titles */}
                    <div className="mt-4">
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                        Report Title
                      </label>
                      <input
                        type="text"
                        value={config.reportTitle}
                        onChange={(e) => setConfig({ ...config, reportTitle: e.target.value })}
                        className="w-full border p-2 rounded text-sm"
                        placeholder="Report Title"
                      />
                    </div>

                    <div className="mt-2">
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                        Report Subtitle
                      </label>
                      <input
                        type="text"
                        value={config.reportDetails}
                        onChange={(e) => setConfig({ ...config, reportDetails: e.target.value })}
                        className="w-full border p-2 rounded text-sm"
                        placeholder="Subtitle"
                      />
                    </div>

                    <div className="mt-2">
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                        Prepared By
                      </label>
                      <input
                        type="text"
                        value={config.preparedBy}
                        onChange={(e) => setConfig({ ...config, preparedBy: e.target.value })}
                        className="w-full border p-2 rounded text-sm"
                        placeholder="Prepared By"
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 border-t border-slate-200 space-y-2">
                  <button
                    onClick={() => setIsTemplateSelectionOpen(true)}
                    className="w-full py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition flex items-center justify-center gap-2 text-sm"
                  >
                    Next: Review Content <ChevronRight size={16} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Clear all saved data? This cannot be undone.')) {
                        clearAllStorage();
                        resetToInitialState();
                        alert('All data cleared!');
                      }
                    }}
                    className="w-full py-2 bg-white text-red-600 border border-red-200 font-medium rounded-lg hover:bg-red-50 transition flex items-center justify-center gap-2 text-xs"
                  >
                    <X size={14} /> Clear All Data
                  </button>
                </div>
              </div>
            </div>

            {/* Preview Area */}
            <div className="col-span-12 lg:col-span-8 flex flex-col h-full">
              <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                  <Layout size={20} className="text-slate-500" /> Live Preview
                </h2>
                <div className="flex bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
                  <button
                    onClick={() => setPreviewMode('cover')}
                    className={`px-3 py-1 text-xs font-medium rounded ${
                      previewMode === 'cover' ? 'bg-slate-100 text-slate-900' : 'text-slate-500'
                    }`}
                  >
                    Cover
                  </button>
                  <button
                    onClick={() => setPreviewMode('content')}
                    className={`px-3 py-1 text-xs font-medium rounded ${
                      previewMode === 'content' ? 'bg-slate-100 text-slate-900' : 'text-slate-500'
                    }`}
                  >
                    Content
                  </button>
                </div>
              </div>
              <div className="grow flex items-center justify-center bg-slate-200/50 rounded-xl border border-slate-300 p-4 lg:p-12 overflow-hidden shadow-inner relative">
                <div className="w-full max-w-4xl aspect-video shadow-2xl rounded-lg overflow-hidden relative flex flex-col bg-white">
                  {/* Preview based on mode */}
                  {previewMode === 'cover' ? (
                    config.coverDesign ? (
                      <CustomCover config={config} />
                    ) : (
                      <ReportCoverVisual config={config} mode="preview" />
                    )
                  ) : (
                    <InstagramDashboardSlide config={config} isThumbnail={false} />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* REVIEW STEP */}
        {currentStep === 'review' && (
          <div>
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <button
                onClick={goBack}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors"
              >
                <ArrowLeft size={16} /> Back to Configuration
              </button>

              <div className="flex gap-3 relative">
                <button
                  onClick={() => setIsExitModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                >
                  <ArrowLeft size={16} className="text-slate-500" />
                  Save & Exit
                </button>

                <div className="relative" ref={downloadRef}>
                  <button
                    onClick={() => setIsDownloadOpen(!isDownloadOpen)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white font-bold text-sm rounded-lg hover:bg-slate-800 transition-all shadow-md"
                  >
                    <Download size={16} />
                    Download Report
                    <ChevronDown
                      size={14}
                      className={`opacity-70 transition-transform ${
                        isDownloadOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isDownloadOpen && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-20">
                      <button
                        onClick={() => handleDownloadWrapper('pdf')}
                        className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                      >
                        <div className="bg-red-50 text-red-500 p-1.5 rounded-lg">
                          <FileText size={16} />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">
                            Export as PDF
                          </span>
                          <span className="text-[10px] text-slate-400">Best for sharing</span>
                        </div>
                      </button>
                      <button
                        onClick={() => handleDownloadWrapper('pptx')}
                        className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 transition-colors border-t border-slate-50"
                      >
                        <div className="bg-orange-50 text-orange-500 p-1.5 rounded-lg">
                          <Presentation size={16} />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">
                            Export as PPTX
                          </span>
                          <span className="text-[10px] text-slate-400">Editable slides</span>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Review Slides</h2>
                  <p className="text-slate-500">Click a slide to edit.</p>
                </div>
                <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-500">
                  {slides.length} Slides Generated
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {slides.map((slide) => (
                  <div
                    key={slide.id}
                    onClick={() => goToSlide(slide.id)}
                    className="group cursor-pointer bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-blue-400 transition-all hover:-translate-y-1"
                  >
                    <div className="aspect-video relative border-b border-slate-100 overflow-hidden bg-white">
                      {/* Thumbnail preview - scaled to fit */}
                      <div className="w-full h-full relative">
                        <div
                          className="absolute inset-0 origin-top-left"
                          style={{
                            width: '1280px',
                            height: '720px',
                            transform: 'scale(var(--thumb-scale))',
                          }}
                          ref={(el) => {
                            if (el) {
                              const parent = el.parentElement;
                              if (parent) {
                                const scale = Math.min(
                                  parent.offsetWidth / 1280,
                                  parent.offsetHeight / 720,
                                );
                                el.style.setProperty('--thumb-scale', scale.toString());
                              }
                            }
                          }}
                        >
                          {renderSlideThumbnail(slide)}
                        </div>
                      </div>

                      <div className="absolute inset-0 bg-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-200">
                        <div className="bg-white px-4 py-2 rounded-full shadow-sm text-xs font-bold text-blue-600 flex items-center gap-2 border border-slate-100">
                          <MousePointerClick size={12} /> Edit Slide
                        </div>
                      </div>
                    </div>
                    <div className="p-4 flex items-center justify-between group/title h-14">
                      {editingTitleId === slide.id ? (
                        <input
                          autoFocus
                          type="text"
                          defaultValue={slide.title}
                          className="w-full text-sm font-bold text-slate-800 border-b-2 border-blue-500 outline-none bg-transparent"
                          onBlur={(e) => handleRename(slide.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRename(slide.id, e.currentTarget.value);
                            if (e.key === 'Escape') setEditingTitleId(null);
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <>
                          <h3
                            className="font-bold text-slate-800 truncate pr-2"
                            title={slide.title}
                          >
                            {slide.title}
                          </h3>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTitleId(slide.id);
                            }}
                            className="opacity-0 group-hover/title:opacity-100 text-slate-400 hover:text-blue-500 transition-opacity p-1 bg-slate-50 rounded-md hover:bg-blue-50"
                            title="Rename Slide"
                          >
                            <Edit3 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}

                <button
                  className="aspect-video rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50 transition-all flex flex-col items-center justify-center gap-3 group"
                  onClick={addNewPage}
                >
                  <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
                    <Plus size={24} />
                  </div>
                  <span className="text-sm font-semibold text-slate-500 group-hover:text-blue-600">
                    Add New Page
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* EDIT COVER SLIDE */}
        {currentStep === 'edit_cover' && (
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] py-4">
            <div className="w-full max-w-6xl mb-2 flex justify-between items-end">
              <h2 className="font-bold text-slate-700 flex items-center gap-2">
                <Layout size={16} /> Editing: {slides.find((s) => s.id === activeSlideId)?.title}
              </h2>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono bg-slate-100 px-3 py-1 rounded text-slate-600">
                  {slides.findIndex((s) => s.id === activeSlideId) + 1} / {slides.length}
                </span>
                <button
                  onClick={goBackToReview}
                  className="text-xs font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1"
                >
                  <ArrowLeft size={12} /> Back to Review
                </button>
              </div>
            </div>
            <div className="w-full max-w-7xl flex items-center gap-4 justify-center">
              {/* Previous Button */}
              <button
                onClick={goToPrevSlide}
                disabled={slides.findIndex((s) => s.id === activeSlideId) === 0}
                className="bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed p-4 rounded-xl shadow-md transition-all hover:scale-105 hover:shadow-lg border-2 border-slate-200 hover:border-blue-400"
                title="Previous slide (← or ↑)"
              >
                <ChevronRight size={28} className="rotate-180" />
              </button>

              {/* Slide Container */}
              <div className="w-full max-w-6xl aspect-video bg-white shadow-2xl rounded-sm overflow-hidden border border-slate-200">
                {renderActiveSlide()}
              </div>

              {/* Next Button */}
              <button
                onClick={goToNextSlide}
                disabled={slides.findIndex((s) => s.id === activeSlideId) === slides.length - 1}
                className="bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed p-4 rounded-xl shadow-md transition-all hover:scale-105 hover:shadow-lg border-2 border-slate-200 hover:border-blue-400"
                title="Next slide (→ or ↓)"
              >
                <ChevronRight size={28} />
              </button>
            </div>

            {/* Keyboard shortcuts hint */}
            <div className="mt-4 text-xs text-slate-400 flex items-center gap-2">
              <span className="bg-slate-100 px-2 py-1 rounded font-mono">←</span>
              <span className="bg-slate-100 px-2 py-1 rounded font-mono">→</span>
              <span>Use arrow keys to navigate</span>
            </div>
          </div>
        )}

        {/* EDIT SLIDE */}
        {currentStep === 'edit_generic' && (
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] py-4">
            <div className="w-full max-w-6xl mb-2 flex justify-between items-end">
              <h2 className="font-bold text-slate-700 flex items-center gap-2">
                <Layout size={16} /> Editing: {slides.find((s) => s.id === activeSlideId)?.title}
              </h2>
              <div className="flex items-center gap-3">
                {slides.find((s) => s.id === activeSlideId)?.type !== 'cover' && (
                  <button
                    onClick={() => handleDeleteSlide(activeSlideId!)}
                    className="text-xs font-medium text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors border border-red-200 hover:border-red-300"
                    title="Delete this slide"
                  >
                    <X size={14} /> Delete Slide
                  </button>
                )}
                <span className="text-xs font-mono bg-slate-100 px-3 py-1 rounded text-slate-600">
                  {slides.findIndex((s) => s.id === activeSlideId) + 1} / {slides.length}
                </span>
                <button
                  onClick={goBackToReview}
                  className="text-xs font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1"
                >
                  <ArrowLeft size={12} /> Back to Review
                </button>
              </div>
            </div>
            <div className="w-full max-w-7xl flex items-center gap-4 justify-center">
              {/* Previous Button */}
              <button
                onClick={goToPrevSlide}
                disabled={slides.findIndex((s) => s.id === activeSlideId) === 0}
                className="bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed p-4 rounded-xl shadow-md transition-all hover:scale-105 hover:shadow-lg border-2 border-slate-200 hover:border-blue-400"
                title="Previous slide (← or ↑)"
              >
                <ChevronRight size={28} className="rotate-180" />
              </button>

              {/* Slide Container */}
              <div className="w-full max-w-6xl aspect-video bg-white shadow-2xl rounded-sm overflow-hidden border border-slate-200">
                {renderActiveSlide()}
              </div>

              {/* Next Button */}
              <button
                onClick={goToNextSlide}
                disabled={slides.findIndex((s) => s.id === activeSlideId) === slides.length - 1}
                className="bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed p-4 rounded-xl shadow-md transition-all hover:scale-105 hover:shadow-lg border-2 border-slate-200 hover:border-blue-400"
                title="Next slide (→ or ↓)"
              >
                <ChevronRight size={28} />
              </button>
            </div>

            {/* Keyboard shortcuts hint */}
            <div className="mt-4 text-xs text-slate-400 flex items-center gap-2">
              <span className="bg-slate-100 px-2 py-1 rounded font-mono">←</span>
              <span className="bg-slate-100 px-2 py-1 rounded font-mono">→</span>
              <span>Use arrow keys to navigate</span>
            </div>
          </div>
        )}

        {/* DESIGN COVER STEP */}
        {currentStep === 'design_cover' && (
          <div>
            <div className="mb-6">
              <button
                onClick={() => setCurrentStep('setup')}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors"
              >
                <ArrowLeft size={16} /> Back to Setup
              </button>
            </div>
            <CoverDesigner
              onSelectCover={handleCoverDesignSelect}
              initialTitle={config.reportTitle}
              initialSubtitle={config.reportDetails}
              initialPeriod={config.period}
              fontFamily={config.font.name}
            />
          </div>
        )}
      </main>

      {/* Hidden slides for export */}
      <div className="fixed -left-2499.75 top-0">
        {slides.map((slide, index) => {
          const currentPage = index + 1;
          const totalPages = slides.length;

          return (
            <div
              key={`export-${slide.id}-${config.clientName}-${config.period}`}
              data-slide-id={slide.id}
              data-slide-export="true"
              style={{
                width: '1920px',
                height: '1080px',
                position: 'relative',
                backgroundColor: 'white',
                overflow: 'hidden',
              }}
            >
              {slide.type === 'cover' && config.coverDesign ? (
                <CustomCover config={config} />
              ) : slide.type === 'cover' ? (
                <ReportCoverVisual config={config} mode="full" />
              ) : slide.type === 'dashboard' ? (
                <InstagramDashboardSlide
                  config={config}
                  isThumbnail={false}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  isExport={true}
                />
              ) : slide.type === 'layout_dashboard' ? (
                <LayoutDashboard
                  config={config}
                  data={slide.content}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  isExport={true}
                />
              ) : slide.type === 'layout_comparison' ? (
                <LayoutComparison
                  config={config}
                  data={slide.content}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  isExport={true}
                />
              ) : slide.type === 'layout_kpi' ? (
                <LayoutKPI
                  config={config}
                  data={slide.content}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  isExport={true}
                />
              ) : slide.type === 'layout_content' ? (
                <LayoutContent
                  config={config}
                  data={slide.content}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  isExport={true}
                />
              ) : slide.type === 'section_heading' ? (
                <SectionHeadingSlide
                  config={config}
                  title={slide.content?.sectionTitle || slide.title || 'Section Title'}
                  isExport={true}
                />
              ) : (
                <PlaceholderSlide onOpenSelector={() => {}} />
              )}
            </div>
          );
        })}
      </div>

      {/* Save Modal */}
      <SaveModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={saveMode === 'template' ? handleSaveAsTemplate : handleSaveAsReport}
        mode={saveMode}
      />

      {/* Load Modal */}
      <LoadModal
        isOpen={isLoadModalOpen}
        onClose={() => setIsLoadModalOpen(false)}
        onLoad={loadMode === 'template' ? handleLoadTemplate : handleLoadReport}
        onDelete={handleDeleteSaved}
        mode={loadMode}
      />

      {/* Template Selection Modal - Before entering review */}
      {isTemplateSelectionOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6">
            <h3 className="text-2xl font-bold mb-4">Start Your Report</h3>
            <p className="text-slate-600 mb-6">Choose how you want to begin</p>

            <div className="grid grid-cols-2 gap-4">
              {/* Start from scratch */}
              <button
                onClick={() => {
                  // Clear old localStorage and reset slides only, KEEP current config
                  clearCurrentWorkOnly();
                  setSlides([
                    { id: 1, type: 'cover', title: 'Report Cover', content: {} },
                  ]);
                  // DON'T reset config - keep user's selections!
                  setIsTemplateSelectionOpen(false);
                  setCurrentStep('review');
                }}
                className="p-6 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50/50 transition-all group"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-200 transition-colors">
                  <Plus size={24} className="text-blue-600" />
                </div>
                <h4 className="font-bold text-slate-900 mb-2">Start Fresh</h4>
                <p className="text-sm text-slate-600">Begin with an empty report</p>
              </button>

              {/* Load from template */}
              <button
                onClick={() => {
                  setIsTemplateSelectionOpen(false);
                  setLoadMode('template');
                  setIsLoadModalOpen(true);
                }}
                className="p-6 border-2 border-slate-200 rounded-xl hover:border-purple-500 hover:bg-purple-50/50 transition-all group"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-purple-200 transition-colors">
                  <FileText size={24} className="text-purple-600" />
                </div>
                <h4 className="font-bold text-slate-900 mb-2">Load Template</h4>
                <p className="text-sm text-slate-600">Use a saved template</p>
              </button>
            </div>

            <button
              onClick={() => setIsTemplateSelectionOpen(false)}
              className="w-full mt-4 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Exit Modal - Save options */}
      {isExitModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">Save Before Exiting?</h3>
            <p className="text-slate-600 mb-6">Choose how you want to save your work</p>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setSaveMode('template');
                  setIsExitModalOpen(false);
                  setIsSaveModalOpen(true);
                }}
                className="w-full p-4 border-2 border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
              >
                <div className="font-bold text-slate-900">Save as Template</div>
                <div className="text-sm text-slate-600">Save structure only (reusable)</div>
              </button>

              <button
                onClick={() => {
                  setSaveMode('report');
                  setIsExitModalOpen(false);
                  setIsSaveModalOpen(true);
                }}
                className="w-full p-4 border-2 border-slate-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-left"
              >
                <div className="font-bold text-slate-900">Save Report</div>
                <div className="text-sm text-slate-600">Save with all data</div>
              </button>

              <button
                onClick={() => {
                  setIsExitModalOpen(false);
                  resetToInitialState();
                }}
                className="w-full p-4 border-2 border-slate-200 rounded-lg hover:border-red-500 hover:bg-red-50 transition-all text-left"
              >
                <div className="font-bold text-slate-900">Exit Without Saving</div>
                <div className="text-sm text-slate-600">Discard changes</div>
              </button>
            </div>

            <button
              onClick={() => setIsExitModalOpen(false)}
              className="w-full mt-4 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* LOAD REPORTS MODAL */}
      {isLoadReportsModalOpen && (
        <LoadReportsModal
          isOpen={isLoadReportsModalOpen}
          onClose={() => setIsLoadReportsModalOpen(false)}
          onLoad={handleLoadReport}
        />
      )}
    </div>
  );
};

export default ReportSetupInterface;
