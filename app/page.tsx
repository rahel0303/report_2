'use client';

import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
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
import { AppHeader, Toasts, ExportProgressModal } from './components/report';
import { AppSidebar } from './components/ui/AppSidebar';
import {
  PlaceholderSlide,
  ReportCoverVisual,
  InstagramDashboardSlide,
  SectionHeadingSlide,
} from './components/slides';
import {
  AllChannelOverviewSlide,
  AllChannelSentimentSlide,
  ChannelSentimentSlide,
  IgGrowthSlide,
  IgBestLeastSlide,
  IgContentPillarSlide,
  IgTaggedPostSlide,
  TtGrowthSlide,
  TtBestLeastSlide,
  TtContentPillarSlide,
  IgCpEngSlide,
  IgCpReachSlide,
  TwGrowthSlide,
  TwBestLeastSlide,
  TwContentSlide,
  FbGrowthSlide,
  CompetitorOverviewSlide,
  CompetitorDetailSlide,
  CompetitorIgFocusSlide,
} from './innercircle/slides';
import {
  LayoutDashboard,
  LayoutComparison,
  LayoutKPI,
  LayoutContent,
  LayoutOverview,
} from './components/layouts';
import { CoverDesigner } from './components/covers/CoverDesigner';
import { CustomCover } from './components/covers/CustomCover';
import { ThankYouSlide } from './components/covers/ThankYouSlide';
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
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0, title: '' });
  const [exportDone, setExportDone] = useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [showDebugModal, setShowDebugModal] = useState(false);
  const [debugSelectedIds, setDebugSelectedIds] = useState<Set<number>>(new Set());
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

  // Brands from DB
  const [brandList, setBrandList] = useState<
    { id: number; brand_name_identifier: string; brand_name_display: string }[]
  >([]);
  const [isBrandsLoading, setIsBrandsLoading] = useState(false);

  // Load slides from localStorage on mount
  useEffect(() => {
    setSlides(loadSlidesFromStorage());
  }, []);

  // Auto-save slides to localStorage whenever they change
  useEffect(() => {
    saveSlidesToStorage(slides);
  }, [slides]);

  const [config, setConfig] = useState<ReportConfig>(getDefaultConfig());

  // Fetch client brands active in the selected period
  useEffect(() => {
    const MONTH_NUMS: Record<string, string> = {
      January: '01',
      February: '02',
      March: '03',
      April: '04',
      May: '05',
      June: '06',
      July: '07',
      August: '08',
      September: '09',
      October: '10',
      November: '11',
      December: '12',
    };
    const [month, year] = config.period.split(' ');
    const monthYear = `${MONTH_NUMS[month] ?? '01'}-${year}`;
    setIsBrandsLoading(true);
    fetch(`/api/brands?month_year=${monthYear}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.brands && data.brands.length > 0) {
          setBrandList(data.brands);
          setConfig((prev) => {
            const names = data.brands.map(
              (b: { brand_name_display: string }) => b.brand_name_display,
            );
            const currentValid = names.includes(prev.clientName);
            return {
              ...prev,
              clientName: currentValid ? prev.clientName : data.brands[0].brand_name_display,
            };
          });
        } else {
          setBrandList([]);
        }
      })
      .catch(console.error)
      .finally(() => setIsBrandsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.period]);

  // Re-fill clientName from already-fetched brandList whenever it becomes empty (e.g. after reset)
  useEffect(() => {
    if (!config.clientName && brandList.length > 0) {
      setConfig((prev) => ({
        ...prev,
        clientName: brandList[0].brand_name_display,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.clientName, brandList]);

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

  // Pre-expand ig_content_pillar slides as soon as brand + period are known
  // so all pillar slides exist before the user enters review mode.
  // NOTE: `slides` is intentionally in the dep array so this re-runs once slides load.
  useEffect(() => {
    if (!config.clientName || !config.period) return;
    const firstPillarSlide = slides.find((s) => s.type === 'ic_ig_content_pillar');
    if (!firstPillarSlide) return;
    const pillarCount = slides.filter((s) => s.type === 'ic_ig_content_pillar').length;
    if (pillarCount > 1) return; // already expanded — stop
    fetch(
      `/api/innercircle/ig-content-pillar?brand=${encodeURIComponent(config.clientName)}&period=${encodeURIComponent(config.period)}`,
    )
      .then((r) => r.json())
      .then((d) => {
        const total: number = (d.pillars || []).length;
        if (total > 0) handlePillarSlidesNeeded(firstPillarSlide.id, total);
      })
      .catch(() => {
        /* silent */
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.clientName, config.period, slides]);

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
    fontColor?: string,
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
        fontColor,
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

  const saveExportHistory = async (blob: Blob, slideCount: number, isPartial: boolean) => {
    try {
      const MONTH_NUMS: Record<string, string> = {
        January: '01',
        February: '02',
        March: '03',
        April: '04',
        May: '05',
        June: '06',
        July: '07',
        August: '08',
        September: '09',
        October: '10',
        November: '11',
        December: '12',
      };
      const [mon, yr] = config.period.split(' ');
      const periodFormatted = `${MONTH_NUMS[mon] ?? '01'}-${yr}`;

      const brandSlug = config.clientName
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_-]/g, '');

      // 1. Get signed upload URL from server
      let gcsObjectName: string | null = null;
      try {
        const params = new URLSearchParams({
          brandSlug,
          period: periodFormatted,
          isPartial: String(isPartial),
        });
        const urlRes = await fetch(`/api/export-history/upload-url?${params}`);
        if (urlRes.ok) {
          const { signedUrl, objectName: confirmedName } = await urlRes.json();
          // 2. Upload PPTX directly from browser to GCS (no Next.js body limit)
          const uploadRes = await fetch(signedUrl, {
            method: 'PUT',
            headers: {
              'Content-Type':
                'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            },
            body: blob,
          });
          if (uploadRes.ok) gcsObjectName = confirmedName;
        }
      } catch {
        // GCS upload optional, continue without it
      }

      // 3. Capture cover thumbnail
      let coverImageUrl: string | null = null;
      try {
        const coverSlide = slides.find((s) => s.type === 'cover');
        if (coverSlide) {
          const el = document.querySelector(
            `[data-slide-id="${coverSlide.id}"][data-slide-export="true"]`,
          ) as HTMLElement | null;
          if (el) {
            const { toPng } = await import('html-to-image');
            const base64 = await toPng(el, { pixelRatio: 0.3 });
            const uploadRes = await fetch('/api/upload/cover-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ base64 }),
            });
            const uploadData = await uploadRes.json();
            coverImageUrl = uploadData.url ?? null;
          }
        }
      } catch {
        // thumbnail optional
      }

      // 4. Save metadata to DB
      await fetch('/api/export-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName: config.clientName,
          period: periodFormatted,
          slideCount,
          isPartial,
          config,
          coverImageUrl,
          gcsObjectName,
        }),
      });
    } catch (err) {
      console.error('Failed to save export history:', err);
    }
  };

  const handleDownloadWrapper = async (format: string) => {
    setIsDownloadOpen(false);
    setExportDone(false);
    setExportProgress({ current: 0, total: slides.length, title: '' });
    await handleDownload(
      format,
      slides,
      config,
      setIsExporting,
      setShowExportToast,
      (current, total, title) => setExportProgress({ current, total, title }),
      () => setExportDone(true),
      format === 'pptx' ? (blob, count) => saveExportHistory(blob, count, false) : undefined,
    );
  };

  const openDebugModal = () => {
    setIsDownloadOpen(false);
    // Pre-select all slides
    setDebugSelectedIds(new Set(slides.map((s) => s.id)));
    setShowDebugModal(true);
  };

  const handleDebugExport = async () => {
    setShowDebugModal(false);
    const selected = slides.filter((s) => debugSelectedIds.has(s.id));
    if (selected.length === 0) return;
    setExportDone(false);
    setExportProgress({ current: 0, total: selected.length, title: '' });
    await handleDownload(
      'pptx',
      selected,
      config,
      setIsExporting,
      setShowExportToast,
      (current, total, title) => setExportProgress({ current, total, title }),
      () => setExportDone(true),
      (blob, count) => saveExportHistory(blob, count, true),
    );
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

  const handleDeleteSlide = async (slideId: number) => {
    // Prevent deleting the cover slide
    const slideToDelete = slides.find((s) => s.id === slideId);
    if (slideToDelete?.type === 'cover') {
      Swal.fire({
        icon: 'warning',
        title: 'Cannot delete cover slide',
        text: 'The cover slide cannot be removed.',
        confirmButtonColor: '#1e293b',
      });
      return;
    }

    const result = await Swal.fire({
      icon: 'warning',
      title: 'Delete slide?',
      text: 'This action cannot be undone.',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#94a3b8',
    });
    if (result.isConfirmed) {
      setSlides(slides.filter((s) => s.id !== slideId));
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
      await Swal.fire({
        icon: 'success',
        title: 'Template Saved!',
        text: `"${name}" berhasil disimpan.`,
        confirmButtonColor: '#1e293b',
        timer: 2000,
        showConfirmButton: false,
      });
      resetToInitialState();
    } catch (error) {
      console.error('Save template error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Gagal!',
        text: 'Gagal menyimpan template.',
        confirmButtonColor: '#1e293b',
      });
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
      await Swal.fire({
        icon: 'success',
        title: 'Report Saved!',
        text: `"${name}" berhasil disimpan.`,
        confirmButtonColor: '#1e293b',
        timer: 2000,
        showConfirmButton: false,
      });
      resetToInitialState();
    } catch (error) {
      console.error('Save report error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Gagal!',
        text: 'Gagal menyimpan report.',
        confirmButtonColor: '#1e293b',
      });
    }
  };

  const handleLoadTemplate = async (template: any) => {
    const res = await Swal.fire({
      icon: 'question',
      title: 'Load Template?',
      text: 'Perubahan yang belum disimpan akan hilang.',
      showCancelButton: true,
      confirmButtonText: 'Load',
      confirmButtonColor: '#1e293b',
      cancelButtonColor: '#94a3b8',
    });
    if (res.isConfirmed) {
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

  const handleLoadReport = async (report: any) => {
    const res2 = await Swal.fire({
      icon: 'question',
      title: 'Load Report?',
      text: 'Perubahan yang belum disimpan akan hilang.',
      showCancelButton: true,
      confirmButtonText: 'Load',
      confirmButtonColor: '#1e293b',
      cancelButtonColor: '#94a3b8',
    });
    if (res2.isConfirmed) {
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
    // Special: auto-expand content pillar slides based on actual pillar count
    if (key === '_pillarSlidesNeeded' && typeof value === 'number') {
      handlePillarSlidesNeeded(slideId, value);
      return;
    }
    setSlides((prev) =>
      prev.map((slide) => {
        if (slide.id === slideId) {
          // Handle title change via special '_title' key
          if (key === '_title' && typeof value === 'string') {
            return { ...slide, title: value };
          }
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

  // Auto-create the correct number of ic_ig_content_pillar slides (2 pillars per slide)
  const handlePillarSlidesNeeded = (slideId: number, totalPillars: number) => {
    const needed = Math.ceil(totalPillars / 2); // how many slides total
    setSlides((prev) => {
      const idx = prev.findIndex((s) => s.id === slideId);
      if (idx === -1) return prev;

      // Count existing consecutive pillar slides starting at idx
      let existingCount = 0;
      for (let i = idx; i < prev.length && prev[i].type === 'ic_ig_content_pillar'; i++) {
        existingCount++;
      }

      if (existingCount === needed) return prev; // already the right count

      const maxId = Math.max(...prev.map((s) => s.id), 0);
      const pillarSlides: Slide[] = [];
      for (let i = 0; i < needed; i++) {
        const rangeStart = i * 2 + 1;
        const rangeEnd = Math.min(i * 2 + 2, totalPillars);
        const title =
          needed === 1
            ? 'Instagram Content Pillar'
            : `Instagram Content Pillar (${rangeStart}-${rangeEnd})`;
        if (i === 0) {
          // Preserve the existing first slide, ensure offset = 0, update title
          pillarSlides.push({
            ...prev[idx],
            title,
            content: { ...prev[idx].content, pillarOffset: 0 },
          });
        } else {
          pillarSlides.push({
            id: maxId + i,
            type: 'ic_ig_content_pillar',
            title,
            content: { pillarOffset: i * 2 },
          });
        }
      }

      const before = prev.slice(0, idx);
      const after = prev.slice(idx + existingCount);
      return [...before, ...pillarSlides, ...after];
    });
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
      <AppSidebar mode="overlay" />
      <AppHeader currentStep={currentStep} />

      {/* EXPORT PROGRESS MODAL */}
      <ExportProgressModal
        isOpen={(isExporting && exportProgress.total > 0) || exportDone}
        current={exportProgress.current}
        total={exportProgress.total}
        currentTitle={exportProgress.title}
        isDone={exportDone}
        onClose={() => {
          setExportDone(false);
          setExportProgress({ current: 0, total: 0, title: '' });
        }}
      />

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
                    <div className="space-y-3">
                      {/* Type - fixed to Monthly */}
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                          Type
                        </label>
                        <div className="w-full border p-2 rounded text-sm bg-slate-50 text-slate-700 font-medium">
                          Monthly
                        </div>
                      </div>
                      {/* Period - month + year selectors */}
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                          Period
                        </label>
                        <select
                          value={config.period}
                          onChange={(e) =>
                            setConfig({ ...config, period: e.target.value, reportType: 'Monthly' })
                          }
                          className="w-full border p-2 rounded text-sm bg-white"
                        >
                          {getPeriodOptions('Monthly').map((p) => (
                            <option key={p} value={p}>
                              {p}
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
                        {isBrandsLoading ? (
                          <option value="">Loading...</option>
                        ) : brandList.length === 0 ? (
                          <option value="">No client for this period</option>
                        ) : (
                          brandList.map((b) => (
                            <option key={b.id} value={b.brand_name_display}>
                              {b.brand_name_display}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    {/* Competitors */}
                    <div className="mt-2" ref={dropdownRef}>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-2">
                        Competitors (Multi-select)
                      </label>
                      <div className="relative">
                        <button
                          disabled
                          className="w-full border p-2 rounded text-sm bg-slate-50 flex justify-between items-center text-left min-h-9.5 cursor-not-allowed opacity-50"
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
                    disabled={!config.coverDesign?.logoData}
                    title={!config.coverDesign?.logoData ? 'Please upload a logo first' : ''}
                    className="w-full py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition flex items-center justify-center gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next: Review Content <ChevronRight size={16} />
                  </button>
                  <button
                    onClick={async () => {
                      const r = await Swal.fire({
                        icon: 'warning',
                        title: 'Clear All Data?',
                        text: 'This cannot be undone.',
                        showCancelButton: true,
                        confirmButtonText: 'Clear',
                        confirmButtonColor: '#dc2626',
                        cancelButtonColor: '#94a3b8',
                      });
                      if (r.isConfirmed) {
                        clearAllStorage();
                        resetToInitialState();
                        Swal.fire({
                          icon: 'success',
                          title: 'Cleared!',
                          text: 'All data has been cleared.',
                          confirmButtonColor: '#1e293b',
                          timer: 1500,
                          showConfirmButton: false,
                        });
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
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors px-3 py-1.5 rounded-lg border border-slate-300 hover:border-slate-400 hover:bg-slate-50"
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
                      <button
                        onClick={openDebugModal}
                        className="w-full text-left px-4 py-3 hover:bg-amber-50 flex items-center gap-3 transition-colors border-t border-slate-100"
                      >
                        <div className="bg-amber-50 text-amber-500 p-1.5 rounded-lg">
                          <Presentation size={16} />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">
                            Export Selected Slides
                          </span>
                          <span className="text-[10px] text-amber-500 font-medium">
                            Choose slides to export
                          </span>
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
                        {slide.type.startsWith('ic_') ? (
                          <div className="bg-emerald-50 px-4 py-2 rounded-full shadow-sm text-xs font-bold text-emerald-700 flex items-center gap-2 border border-emerald-200">
                            <MousePointerClick size={12} /> View Slide
                          </div>
                        ) : (
                          <div className="bg-white px-4 py-2 rounded-full shadow-sm text-xs font-bold text-blue-600 flex items-center gap-2 border border-slate-100">
                            <MousePointerClick size={12} /> Edit Slide
                          </div>
                        )}
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
                          {!slide.type.startsWith('ic_') && (
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
                          )}
                          {slide.type.startsWith('ic_') && (
                            <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              Live Data
                            </span>
                          )}
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
              {(() => {
                const isLast =
                  slides.findIndex((s) => s.id === activeSlideId) === slides.length - 1;
                return (
                  <button
                    onClick={() => {
                      if (isLast) {
                        addNewPage();
                        setIsSlideTypeModalOpen(true);
                      } else {
                        goToNextSlide();
                      }
                    }}
                    className={`p-4 rounded-xl shadow-md transition-all hover:scale-105 hover:shadow-lg border-2 ${
                      isLast
                        ? 'bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-300 hover:border-blue-500'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-400'
                    }`}
                    title={isLast ? 'Add new slide' : 'Next slide (→ or ↓)'}
                  >
                    {isLast ? <Plus size={28} /> : <ChevronRight size={28} />}
                  </button>
                );
              })()}
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
                <Layout size={16} />
                {slides.find((s) => s.id === activeSlideId)?.type.startsWith('ic_')
                  ? `Viewing: ${slides.find((s) => s.id === activeSlideId)?.title}`
                  : `Editing: ${slides.find((s) => s.id === activeSlideId)?.title}`}
              </h2>
              <div className="flex flex-col items-end gap-1.5">
                <button
                  onClick={goBackToReview}
                  className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 hover:border-slate-400 hover:bg-slate-50 transition-colors"
                >
                  <ArrowLeft size={12} /> Back to Configuration
                </button>
                <div className="flex items-center gap-2">
                  {slides.find((s) => s.id === activeSlideId)?.type !== 'cover' && (
                    <button
                      onClick={() => handleDeleteSlide(activeSlideId!)}
                      className="text-xs font-medium text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors border border-red-200 hover:border-red-300"
                      title="Delete this slide"
                    >
                      <X size={14} /> Delete
                    </button>
                  )}
                  <span className="text-xs font-mono bg-slate-100 px-3 py-1 rounded text-slate-600">
                    {slides.findIndex((s) => s.id === activeSlideId) + 1} / {slides.length}
                  </span>
                </div>
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
              {(() => {
                const isLast =
                  slides.findIndex((s) => s.id === activeSlideId) === slides.length - 1;
                return (
                  <button
                    onClick={() => {
                      if (isLast) {
                        addNewPage();
                        setIsSlideTypeModalOpen(true);
                      } else {
                        goToNextSlide();
                      }
                    }}
                    className={`p-4 rounded-xl shadow-md transition-all hover:scale-105 hover:shadow-lg border-2 ${
                      isLast
                        ? 'bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-300 hover:border-blue-500'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-400'
                    }`}
                    title={isLast ? 'Add new slide' : 'Next slide (→ or ↓)'}
                  >
                    {isLast ? <Plus size={28} /> : <ChevronRight size={28} />}
                  </button>
                );
              })()}
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
      <div
        style={{
          position: 'fixed',
          left: '-99999px',
          top: '-99999px',
          overflow: 'hidden',
          pointerEvents: 'none',
          zIndex: -1,
        }}
      >
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
              ) : slide.type === 'layout_overview' ? (
                <LayoutOverview
                  config={config}
                  data={slide.content}
                  title={slide.title}
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
              ) : slide.type === 'ic_all_overview' ? (
                isExporting ? (
                  <AllChannelOverviewSlide
                    config={config}
                    isThumbnail={false}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    savedInsight={slide.content?.insight}
                  />
                ) : null
              ) : slide.type === 'ic_all_sentiment' ? (
                isExporting ? (
                  <AllChannelSentimentSlide
                    config={config}
                    isThumbnail={false}
                    currentPage={currentPage}
                    totalPages={totalPages}
                  />
                ) : null
              ) : slide.type === 'ic_ig_sentiment' ? (
                isExporting ? (
                  <ChannelSentimentSlide
                    config={config}
                    platform="instagram"
                    isThumbnail={false}
                    currentPage={currentPage}
                    totalPages={totalPages}
                  />
                ) : null
              ) : slide.type === 'ic_tt_sentiment' ? (
                isExporting ? (
                  <ChannelSentimentSlide
                    config={config}
                    platform="tiktok"
                    isThumbnail={false}
                    currentPage={currentPage}
                    totalPages={totalPages}
                  />
                ) : null
              ) : slide.type === 'ic_fb_sentiment' ? (
                isExporting ? (
                  <ChannelSentimentSlide
                    config={config}
                    platform="facebook"
                    isThumbnail={false}
                    currentPage={currentPage}
                    totalPages={totalPages}
                  />
                ) : null
              ) : slide.type === 'ic_ig_growth' ? (
                isExporting ? (
                  <IgGrowthSlide
                    config={config}
                    isThumbnail={false}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    savedInsight={slide.content?.insight}
                  />
                ) : null
              ) : slide.type === 'ic_ig_best_least' ? (
                isExporting ? (
                  <IgBestLeastSlide
                    config={config}
                    isThumbnail={false}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    savedInsight={slide.content?.insight}
                  />
                ) : null
              ) : slide.type === 'ic_ig_content_pillar' ? (
                isExporting ? (
                  <IgContentPillarSlide
                    config={config}
                    isThumbnail={false}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    pillarOffset={slide.content?.pillarOffset ?? 0}
                    savedInsights={slide.content?.pillarInsights}
                  />
                ) : null
              ) : slide.type === 'ic_ig_tagged_post' ? (
                isExporting ? (
                  <IgTaggedPostSlide
                    config={config}
                    isThumbnail={false}
                    currentPage={currentPage}
                    totalPages={totalPages}
                  />
                ) : null
              ) : slide.type === 'ic_tt_growth' ? (
                isExporting ? (
                  <TtGrowthSlide
                    config={config}
                    isThumbnail={false}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    savedInsight={slide.content?.insight}
                  />
                ) : null
              ) : slide.type === 'ic_tt_organic_best_least' ? (
                isExporting ? (
                  <TtBestLeastSlide
                    config={config}
                    mode="organic"
                    isThumbnail={false}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    savedInsight={slide.content?.insight}
                  />
                ) : null
              ) : slide.type === 'ic_tt_paid_best_least' ? (
                isExporting ? (
                  <TtBestLeastSlide
                    config={config}
                    mode="paid"
                    isThumbnail={false}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    savedInsight={slide.content?.insight}
                  />
                ) : null
              ) : slide.type === 'ic_tt_content_pillar' ? (
                isExporting ? (
                  <TtContentPillarSlide
                    config={config}
                    isThumbnail={false}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    savedInsights={slide.content?.pillarInsights}
                  />
                ) : null
              ) : slide.type === 'ic_ig_cp_eng_aon' ? (
                isExporting ? (
                  <IgCpEngSlide
                    config={config}
                    aon={true}
                    isThumbnail={false}
                    currentPage={currentPage}
                    totalPages={totalPages}
                  />
                ) : null
              ) : slide.type === 'ic_ig_cp_eng_nonaon' ? (
                isExporting ? (
                  <IgCpEngSlide
                    config={config}
                    aon={false}
                    isThumbnail={false}
                    currentPage={currentPage}
                    totalPages={totalPages}
                  />
                ) : null
              ) : slide.type === 'ic_ig_cp_reach_aon' ? (
                isExporting ? (
                  <IgCpReachSlide
                    config={config}
                    aon={true}
                    isThumbnail={false}
                    currentPage={currentPage}
                    totalPages={totalPages}
                  />
                ) : null
              ) : slide.type === 'ic_ig_cp_reach_nonaon' ? (
                isExporting ? (
                  <IgCpReachSlide
                    config={config}
                    aon={false}
                    isThumbnail={false}
                    currentPage={currentPage}
                    totalPages={totalPages}
                  />
                ) : null
              ) : slide.type === 'ic_tw_growth' ? (
                isExporting ? (
                  <TwGrowthSlide
                    config={config}
                    isThumbnail={false}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    savedInsight={slide.content?.insight}
                  />
                ) : null
              ) : slide.type === 'ic_tw_best_least' ? (
                isExporting ? (
                  <TwBestLeastSlide
                    config={config}
                    isThumbnail={false}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    savedInsight={slide.content?.insight}
                  />
                ) : null
              ) : slide.type === 'ic_tw_content' ? (
                isExporting ? (
                  <TwContentSlide
                    config={config}
                    isThumbnail={false}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    savedInsight={slide.content?.insight}
                  />
                ) : null
              ) : slide.type === 'ic_fb_growth' ? (
                isExporting ? (
                  <FbGrowthSlide
                    config={config}
                    isThumbnail={false}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    savedInsight={slide.content?.insight}
                  />
                ) : null
              ) : slide.type === 'ic_comp_overview' ? (
                isExporting ? (
                  <CompetitorOverviewSlide
                    config={config}
                    isThumbnail={false}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    savedInsight={slide.content?.insight}
                  />
                ) : null
              ) : slide.type === 'ic_comp_detail' ? (
                isExporting ? (
                  <CompetitorDetailSlide
                    config={config}
                    competitor={slide.content?.competitor ?? null}
                    isThumbnail={false}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    savedInsight={slide.content?.insight}
                  />
                ) : null
              ) : slide.type === 'ic_comp_ig_focus' ? (
                isExporting ? (
                  <CompetitorIgFocusSlide
                    config={config}
                    competitor={slide.content?.competitor ?? null}
                    isThumbnail={false}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    savedInsight={slide.content?.insight}
                  />
                ) : null
              ) : slide.type === 'thank_you' ? (
                isExporting ? (
                  config.coverDesign ? (
                    <ThankYouSlide config={config} />
                  ) : null
                ) : null
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

            <div className="grid grid-cols-3 gap-4">
              {/* Start from scratch - Coming Soon */}
              <div className="relative p-6 border-2 border-slate-200 rounded-xl opacity-50 cursor-not-allowed">
                <span className="absolute top-2 right-2 text-[10px] font-bold bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-wide">
                  Coming Soon
                </span>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Plus size={24} className="text-blue-600" />
                </div>
                <h4 className="font-bold text-slate-900 mb-2">Start Fresh</h4>
                <p className="text-sm text-slate-600">Begin with an empty report</p>
              </div>

              {/* InnerCircle Template */}
              <button
                onClick={async () => {
                  clearCurrentWorkOnly();
                  const baseSlides: Slide[] = [
                    { id: 1, type: 'cover', title: 'Report Cover', content: {} },
                    {
                      id: 2,
                      type: 'section_heading',
                      title: 'Chapter 1 : General Overview',
                      content: { sectionTitle: 'Chapter 1 : General Overview' },
                    },
                    { id: 3, type: 'ic_all_overview', title: 'All Channel Overview', content: {} },
                    {
                      id: 4,
                      type: 'ic_all_sentiment',
                      title: 'All Channel Sentiment',
                      content: {},
                    },
                    {
                      id: 5,
                      type: 'ic_ig_sentiment',
                      title: 'Instagram Sentiment',
                      content: {},
                    },
                    {
                      id: 6,
                      type: 'ic_tt_sentiment',
                      title: 'TikTok Sentiment',
                      content: {},
                    },
                    {
                      id: 7,
                      type: 'ic_fb_sentiment',
                      title: 'Facebook Sentiment',
                      content: {},
                    },
                    {
                      id: 8,
                      type: 'section_heading',
                      title: 'Chapter 2: Instagram Section',
                      content: { sectionTitle: 'Chapter 2: Instagram Section' },
                    },
                    {
                      id: 9,
                      type: 'ic_ig_growth',
                      title: 'Instagram Growth',
                      content: {},
                    },
                    {
                      id: 10,
                      type: 'ic_ig_best_least',
                      title: 'Instagram Best & Least',
                      content: {},
                    },
                    {
                      id: 11,
                      type: 'ic_ig_content_pillar',
                      title: 'Instagram Content Pillar',
                      content: {},
                    },
                    {
                      id: 120,
                      type: 'ic_ig_cp_eng_aon',
                      title: 'IG Content Pillar — Engagement (AON)',
                      content: {},
                    },
                    {
                      id: 121,
                      type: 'ic_ig_cp_eng_nonaon',
                      title: 'IG Content Pillar — Engagement (Non-AON)',
                      content: {},
                    },
                    {
                      id: 122,
                      type: 'ic_ig_cp_reach_aon',
                      title: 'IG Content Pillar — Reach (AON)',
                      content: {},
                    },
                    {
                      id: 123,
                      type: 'ic_ig_cp_reach_nonaon',
                      title: 'IG Content Pillar — Reach (Non-AON)',
                      content: {},
                    },
                    {
                      id: 12,
                      type: 'ic_ig_tagged_post',
                      title: 'Instagram Tagged Post',
                      content: {},
                    },
                    {
                      id: 13,
                      type: 'section_heading',
                      title: 'Chapter 3: TikTok Section',
                      content: { sectionTitle: 'Chapter 3: TikTok Section' },
                    },
                    {
                      id: 14,
                      type: 'ic_tt_growth',
                      title: 'TikTok Growth',
                      content: {},
                    },
                    {
                      id: 15,
                      type: 'ic_tt_organic_best_least',
                      title: 'TikTok Organic Best & Least',
                      content: {},
                    },
                    {
                      id: 16,
                      type: 'ic_tt_paid_best_least',
                      title: 'TikTok Paid Best & Least',
                      content: {},
                    },
                    {
                      id: 17,
                      type: 'ic_tt_content_pillar',
                      title: 'TikTok Content Pillar',
                      content: {},
                    },
                    {
                      id: 18,
                      type: 'section_heading',
                      title: 'Chapter 4: Twitter/X Section',
                      content: { sectionTitle: 'Chapter 4: Twitter/X Section' },
                    },
                    {
                      id: 19,
                      type: 'ic_tw_growth',
                      title: 'Twitter Growth',
                      content: {},
                    },
                    {
                      id: 20,
                      type: 'ic_tw_content',
                      title: 'Twitter Content Overview',
                      content: {},
                    },
                    {
                      id: 21,
                      type: 'ic_tw_best_least',
                      title: 'Twitter Best & Least',
                      content: {},
                    },
                    {
                      id: 22,
                      type: 'section_heading',
                      title: 'Chapter 5: Facebook Section',
                      content: { sectionTitle: 'Chapter 5: Facebook Section' },
                    },
                    {
                      id: 23,
                      type: 'ic_fb_growth',
                      title: 'Facebook Growth',
                      content: {},
                    },
                    {
                      id: 24,
                      type: 'section_heading',
                      title: 'Chapter 6: Competitor Analysis',
                      content: { sectionTitle: 'Chapter 6: Competitor Analysis' },
                    },
                    {
                      id: 25,
                      type: 'ic_comp_overview',
                      title: 'Competitor Overview',
                      content: {},
                    },
                  ];

                  // Pre-fetch competitor list to create one slide per competitor for ch6 & ch7
                  let compDetailSlides: Slide[] = [];
                  let compIgFocusSlides: Slide[] = [];
                  try {
                    const r = await fetch(
                      `/api/innercircle/competitor-overview?brand=${encodeURIComponent(config.clientName)}&period=${encodeURIComponent(config.period)}`,
                    );
                    const d = await r.json();
                    const allComp: string[] = d.allCompetitors || [];
                    if (allComp.length > 0) {
                      compDetailSlides = allComp.map((comp, i) => ({
                        id: 26 + i,
                        type: 'ic_comp_detail' as const,
                        title: `Competitor Detail — ${comp}`,
                        content: { competitor: comp },
                      }));
                      const ch7Base = 26 + allComp.length;
                      compIgFocusSlides = [
                        {
                          id: ch7Base,
                          type: 'section_heading' as const,
                          title: 'Chapter 7: Competitor Instagram Focus',
                          content: { sectionTitle: 'Chapter 7: Competitor Instagram Focus' },
                        },
                        ...allComp.map((comp, i) => ({
                          id: ch7Base + 1 + i,
                          type: 'ic_comp_ig_focus' as const,
                          title: `IG Focus — ${comp}`,
                          content: { competitor: comp },
                        })),
                      ];
                    }
                  } catch {}

                  if (compDetailSlides.length === 0) {
                    compDetailSlides = [
                      {
                        id: 26,
                        type: 'ic_comp_detail' as const,
                        title: 'Competitor Detail',
                        content: {},
                      },
                    ];
                    compIgFocusSlides = [
                      {
                        id: 27,
                        type: 'section_heading' as const,
                        title: 'Chapter 7: Competitor Instagram Focus',
                        content: { sectionTitle: 'Chapter 7: Competitor Instagram Focus' },
                      },
                      {
                        id: 28,
                        type: 'ic_comp_ig_focus' as const,
                        title: 'IG Focus',
                        content: {},
                      },
                    ];
                  }

                  setSlides([
                    ...baseSlides,
                    ...compDetailSlides,
                    ...compIgFocusSlides,
                    {
                      id: 9999,
                      type: 'thank_you' as const,
                      title: 'Thank You',
                      content: {},
                    },
                  ]);
                  setIsTemplateSelectionOpen(false);
                  setCurrentStep('review');
                }}
                className="p-6 border-2 border-slate-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50/50 transition-all group"
              >
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-emerald-200 transition-colors">
                  <Layout size={24} className="text-emerald-600" />
                </div>
                <h4 className="font-bold text-slate-900 mb-2">InnerCircle</h4>
                <p className="text-sm text-slate-600">Social media report template</p>
              </button>

              {/* Load from template - Coming Soon */}
              <div className="relative p-6 border-2 border-slate-200 rounded-xl opacity-50 cursor-not-allowed">
                <span className="absolute top-2 right-2 text-[10px] font-bold bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-wide">
                  Coming Soon
                </span>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FileText size={24} className="text-purple-600" />
                </div>
                <h4 className="font-bold text-slate-900 mb-2">Load Template</h4>
                <p className="text-sm text-slate-600">Use a saved template</p>
              </div>
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
              <div className="relative w-full p-4 border-2 border-slate-200 rounded-lg opacity-50 cursor-not-allowed text-left">
                <span className="absolute top-2 right-2 text-[10px] font-bold bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-wide">
                  Coming Soon
                </span>
                <div className="font-bold text-slate-900">Save as Template</div>
                <div className="text-sm text-slate-600">Save structure only (reusable)</div>
              </div>

              <div className="relative w-full p-4 border-2 border-slate-200 rounded-lg opacity-50 cursor-not-allowed text-left">
                <span className="absolute top-2 right-2 text-[10px] font-bold bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-wide">
                  Coming Soon
                </span>
                <div className="font-bold text-slate-900">Save Report</div>
                <div className="text-sm text-slate-600">Save with all data</div>
              </div>

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

      {/* DEBUG EXPORT MODAL */}
      {showDebugModal && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-120 max-h-[80vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="bg-amber-50 text-amber-500 p-1.5 rounded-lg">
                  <Presentation size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Export Selected Slides</h2>
                  <p className="text-[10px] text-slate-400">
                    Choose which slides to export as PPTX
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDebugModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            {/* Select all / none bar */}
            <div className="flex items-center gap-3 px-5 py-2 bg-slate-50 border-b border-slate-100">
              <button
                onClick={() => setDebugSelectedIds(new Set(slides.map((s) => s.id)))}
                className="text-[11px] font-bold text-indigo-600 hover:underline"
              >
                Select All
              </button>
              <span className="text-slate-300">|</span>
              <button
                onClick={() => setDebugSelectedIds(new Set())}
                className="text-[11px] font-bold text-slate-500 hover:underline"
              >
                Deselect All
              </button>
              <span className="ml-auto text-[11px] text-slate-400">
                {debugSelectedIds.size} / {slides.length} selected
              </span>
            </div>

            {/* Slide list */}
            <div className="overflow-y-auto flex-1 divide-y divide-slate-50">
              {slides.map((s, idx) => (
                <label
                  key={s.id}
                  className="flex items-center gap-3 px-5 py-2.5 hover:bg-slate-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={debugSelectedIds.has(s.id)}
                    onChange={(e) => {
                      const next = new Set(debugSelectedIds);
                      if (e.target.checked) next.add(s.id);
                      else next.delete(s.id);
                      setDebugSelectedIds(next);
                    }}
                    className="w-4 h-4 accent-indigo-600 shrink-0"
                  />
                  <span className="text-[11px] text-slate-400 w-5 shrink-0">{idx + 1}</span>
                  <span className="text-[11px] font-medium text-slate-700 truncate">
                    {s.title || `Slide ${idx + 1}`}
                  </span>
                  <span className="ml-auto text-[10px] text-slate-400 shrink-0 bg-slate-100 px-1.5 py-0.5 rounded">
                    {s.type}
                  </span>
                </label>
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-100 bg-slate-50">
              <button
                onClick={() => setShowDebugModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDebugExport}
                disabled={debugSelectedIds.size === 0}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Download size={13} />
                Export {debugSelectedIds.size} Slide{debugSelectedIds.size !== 1 ? 's' : ''}
              </button>
            </div>
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
