'use client';

import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import PptxGenJS from 'pptxgenjs';
import {
  Settings,
  Calendar,
  Layout,
  Palette,
  ChevronRight,
  MonitorPlay,
  CheckCircle2,
  ArrowLeft,
  MousePointerClick,
  Edit3,
  Save,
  ChevronDown,
  X,
  Plus,
  Loader2,
  Download,
  Presentation,
  FileText,
  Minus,
  RefreshCw,
} from 'lucide-react';

// Import types
import { ReportConfig, Slide, Template, ThemePreset } from './types';

// Import data
import themesDataRaw from './data/themes.json';
import fontsData from './data/fonts.json';
import clientsData from './data/clients.json';
import { getDummyDataForTemplate } from './data/dummyData';

const themesData = themesDataRaw as ThemePreset[];

// Import slide components
import { PlaceholderSlide, ReportCoverVisual, InstagramDashboardSlide } from './components/slides';
// Import layout components
import { LayoutDashboard, LayoutComparison, LayoutKPI, LayoutContent } from './components/layouts';
// Import cover designer
import { CoverDesigner } from './components/covers/CoverDesigner';
import { CustomCover } from './components/covers/CustomCover';

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
    const savedSlides = localStorage.getItem('report_slides');
    if (savedSlides) {
      try {
        setSlides(JSON.parse(savedSlides));
      } catch (error) {
        console.error('Failed to load saved slides:', error);
        // Set default slides if parse fails
        setSlides([
          { id: 1, type: 'cover', title: 'Report Cover', content: {} },
          { id: 2, type: 'dashboard', title: 'Instagram Performance', content: {} },
        ]);
      }
    } else {
      // Set default slides
      setSlides([
        { id: 1, type: 'cover', title: 'Report Cover', content: {} },
        { id: 2, type: 'dashboard', title: 'Instagram Performance', content: {} },
      ]);
    }
  }, []);

  // Auto-save slides to localStorage whenever they change
  useEffect(() => {
    if (slides.length > 0) {
      localStorage.setItem('report_slides', JSON.stringify(slides));
    }
  }, [slides]);

  const [config, setConfig] = useState<ReportConfig>({
    reportTitle: 'Social Media Report',
    reportDetails: 'Monthly Performance & Strategy',
    preparedBy: 'Sekata Data Team',
    reportType: 'Monthly',
    period: 'January 2026',
    theme: themesData[0],
    font: fontsData[0],
    clientName: 'BYD',
    selectedCompetitors: [],
    coverDesign: undefined,
  });

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
    const existingTemplates = localStorage.getItem('report_templates');
    if (!existingTemplates) {
      // Create default template
      const defaultTemplate = {
        id: 'default-template-1',
        name: 'Default Template',
        savedAt: new Date().toISOString(),
        templateData: {
          theme: themesData[0],
          font: fontsData[0],
          coverDesign: undefined,
        },
        slides: [
          { id: 1, type: 'cover', title: 'Report Cover', content: {} },
          { id: 2, type: 'dashboard', title: 'Instagram Performance', content: {} },
        ],
      };
      localStorage.setItem('report_templates', JSON.stringify([defaultTemplate]));
      console.log('Default template created in localStorage');
    }
  }, []);

  const [previewMode, setPreviewMode] = useState<'cover' | 'content'>('cover');

  const handleCoverDesignSelect = (
    templateId: number,
    logoData: string,
    colors: any,
    title: string,
    subtitle: string,
    period: string,
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
      },
    }));
    setCurrentStep('setup');
  };

  const getPeriodOptions = (type: 'Monthly' | 'Quarterly'): string[] => {
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

  // REMOVED: Period validation useEffect that was resetting config
  // useEffect(() => {
  //   const opts = getPeriodOptions(config.reportType);
  //   if (!opts.includes(config.period)) setConfig((prev) => ({ ...prev, period: opts[0] }));
  // }, [config.reportType]);

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
      // Only handle arrow keys when in edit mode
      if (currentStep !== 'edit_cover' && currentStep !== 'edit_generic') return;

      // Check if user is typing in an input/textarea
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

  const clearAllStorage = () => {
    localStorage.removeItem('report_slides');
    localStorage.removeItem('report_config');
    localStorage.removeItem('report_templates');
    localStorage.removeItem('saved_reports');
  };

  const clearCurrentWorkOnly = () => {
    // Only clear current work, keep saved templates and reports
    localStorage.removeItem('report_slides');
    localStorage.removeItem('report_config');
  };

  const resetToInitialState = () => {
    // Clear ONLY current work, NOT saved templates/reports
    clearCurrentWorkOnly();
    // Reset to default slides
    setSlides([
      { id: 1, type: 'cover', title: 'Report Cover', content: {} },
      { id: 2, type: 'dashboard', title: 'Instagram Performance', content: {} },
    ]);
    // Reset config
    setConfig({
      reportTitle: 'Social Media Report',
      reportDetails: 'Monthly Performance & Strategy',
      preparedBy: 'Sekata Data Team',
      reportType: 'Monthly',
      period: 'January 2026',
      theme: themesData[0],
      font: fontsData[0],
      clientName: 'BYD',
      selectedCompetitors: [],
      coverDesign: undefined,
    });
    setCurrentStep('setup');
  };

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

  const handleDownload = async (format: string) => {
    setIsDownloadOpen(false);
    setIsExporting(true);

    try {
      if (format === 'pdf') {
        alert('PDF export coming soon. Please use PowerPoint export for now.');
        setIsExporting(false);
        return;
      } else if (format === 'pptx') {
        const PptxGenJS = (await import('pptxgenjs')).default;
        const { toPng } = await import('html-to-image');

        const pptx = new PptxGenJS();
        pptx.layout = 'LAYOUT_16x9';
        pptx.author = config.preparedBy;
        pptx.title = config.reportTitle;

        console.log('📸 Capturing slides as images...');

        for (let i = 0; i < slides.length; i++) {
          const slide = slides[i];
          console.log(`📸 Capturing slide ${i + 1}/${slides.length}: ${slide.title}`);

          // Find the hidden export div for this slide
          const exportDiv = document.querySelector(
            `[data-slide-id="${slide.id}"][data-slide-export="true"]`,
          ) as HTMLElement;

          if (!exportDiv) {
            console.error(`Export div not found for slide ${slide.id}`);
            continue;
          }

          // Wait for charts and content to render
          await new Promise((resolve) => setTimeout(resolve, 500));

          try {
            // Capture the slide directly as PNG without moving DOM elements
            const imgData = await toPng(exportDiv, {
              cacheBust: true,
              width: 1920,
              height: 1080,
              backgroundColor: '#ffffff',
              pixelRatio: 2,
              filter: (node) => {
                // Skip script tags and other non-visual elements
                if (node.nodeName === 'SCRIPT') return false;
                if (node.nodeName === 'NOSCRIPT') return false;
                return true;
              },
              style: {
                transform: 'scale(1)',
                transformOrigin: 'top left',
                position: 'relative',
                left: '0',
                top: '0',
                margin: '0',
                padding: '0',
              },
            });

            // Create PPTX slide and add the image
            const pptxSlide = pptx.addSlide();
            pptxSlide.addImage({
              data: imgData,
              x: 0,
              y: 0,
              w: '100%',
              h: '100%',
            });

            console.log(`✅ Slide ${i + 1} captured successfully`);
          } catch (error) {
            console.error(`Error capturing slide ${i + 1}:`, error);
            // Add error placeholder slide
            const pptxSlide = pptx.addSlide();
            pptxSlide.addText(`Error capturing: ${slide.title}`, {
              x: 1,
              y: 2.5,
              w: 8,
              h: 0.5,
              fontSize: 24,
              color: 'FF0000',
              align: 'center',
            });
          }
        }

        // Save file
        const fileName = `${config.reportTitle.replace(/\s+/g, '_')}_${config.period}.pptx`;
        await pptx.writeFile({ fileName });

        console.log('🎉 Export completed with screenshots!');
        alert(
          `✓ Successfully exported: ${fileName}\n\n📸 All slides captured as high-quality images!`,
        );
      }

      setIsExporting(false);
      setShowExportToast(true);
      setTimeout(() => setShowExportToast(false), 3000);
    } catch (error) {
      console.error('Export error:', error);
      setIsExporting(false);
      alert(
        `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
      );
    }
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

  const handleSaveAsTemplate = (name: string) => {
    console.log('Saving template structure, current slides:', slides);

    const template = {
      id: Date.now().toString(),
      name,
      savedAt: new Date().toISOString(),
      templateData: {
        theme: config.theme,
        font: config.font,
        coverDesign: config.coverDesign,
      },
      slides: slides.map((slide) => {
        // Save content structure (which keys exist) with metadata
        let contentStructure: any = {};

        if (slide.content && typeof slide.content === 'object') {
          Object.keys(slide.content).forEach((key) => {
            const value = slide.content[key];

            // Check if the field has actual data (not empty)
            if (value && typeof value === 'object' && Object.keys(value).length > 0) {
              // For charts, save structure metadata
              if ((key === 'chart' || key.startsWith('chart_')) && value.chartType) {
                contentStructure[key] = {
                  chartType: value.chartType,
                  dataLength: value.data?.length || 4, // Save number of data points
                };
              } else {
                contentStructure[key] = {}; // Mark this field as "should be filled"
              }
            }
          });
        }

        console.log(`Slide ${slide.id} structure:`, contentStructure);

        return {
          id: slide.id,
          type: slide.type,
          title: slide.title,
          content: contentStructure,
        };
      }),
    };

    const existingTemplates = JSON.parse(localStorage.getItem('report_templates') || '[]');
    const updatedTemplates = [...existingTemplates, template];
    localStorage.setItem('report_templates', JSON.stringify(updatedTemplates));

    console.log('Template saved:', template);
    console.log('Template slides with content:', template.slides);
    console.log('All templates:', updatedTemplates);

    setIsSaveModalOpen(false);
    alert(`Template "${name}" saved successfully!`);
    resetToInitialState();
  };

  const handleSaveAsReport = (name: string) => {
    const report = {
      id: Date.now().toString(),
      name,
      savedAt: new Date().toISOString(),
      config: config, // Simpan SEMUA config
      slides: slides, // Simpan SEMUA slides dengan content
    };

    const existingReports = JSON.parse(localStorage.getItem('saved_reports') || '[]');
    localStorage.setItem('saved_reports', JSON.stringify([...existingReports, report]));

    setIsSaveModalOpen(false);
    alert(`Report "${name}" saved successfully!`);
    resetToInitialState();
  };

  const handleLoadTemplate = (template: any) => {
    if (confirm('Load this template? Current unsaved changes will be lost.')) {
      console.log('🔵 Loading template structure:', template);
      console.log('🔵 Current selected brand:', config.clientName);

      setConfig((prev) => ({
        ...prev,
        theme: template.templateData.theme,
        font: template.templateData.font,
        coverDesign: prev.coverDesign || template.templateData.coverDesign,
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
    if (confirm('Load this report? Current unsaved changes will be lost.')) {
      setConfig(report.config);
      setSlides(report.slides);
      setIsLoadModalOpen(false);
      setCurrentStep('review');
    }
  };

  const handleDeleteSaved = (id: string, type: 'template' | 'report') => {
    if (confirm('Delete this saved item?')) {
      const key = type === 'template' ? 'report_templates' : 'saved_reports';
      const items = JSON.parse(localStorage.getItem(key) || '[]');
      localStorage.setItem(key, JSON.stringify(items.filter((item: any) => item.id !== id)));
      // Force re-render
      setIsLoadModalOpen(false);
      setTimeout(() => setIsLoadModalOpen(true), 0);
    }
  };

  const handleSlideContentChange = (slideId: number, key: string, value: any) => {
    setSlides((prev) =>
      prev.map((slide) =>
        slide.id === slideId ? { ...slide, content: { ...slide.content, [key]: value } } : slide,
      ),
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
    const templateMap: Record<string, string> = {
      layout_dashboard: 'Standard Dashboard',
      layout_comparison: 'Comparison Analysis',
      layout_kpi: 'KPI Performance',
      layout_content: 'Creative Analysis',
    };

    setSlides(
      slides.map((s) => {
        if (s.id === activeSlideId) {
          const isGenericTitle = s.title.startsWith('New Slide');
          return {
            ...s,
            type: templateType as any,
            title: isGenericTitle ? templateMap[templateType] : s.title,
            content: {}, // Keep empty for manual filling
          };
        }
        return s;
      }),
    );
    setIsTemplateModalOpen(false);
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

    const mode = 'full';
    const currentIndex = slides.findIndex((s) => s.id === activeSlide.id);
    const currentPage = currentIndex + 1;
    const totalPages = slides.length;

    // Render based on slide type
    switch (activeSlide.type) {
      case 'cover':
        return config.coverDesign ? (
          <CustomCover config={config} />
        ) : (
          <ReportCoverVisual config={config} mode={mode} />
        );
      case 'dashboard':
        return (
          <InstagramDashboardSlide
            key={`instagram-${config.clientName}-${config.period}`}
            config={config}
            currentPage={currentPage}
            totalPages={totalPages}
          />
        );
      case 'layout_dashboard':
        return (
          <LayoutDashboard
            key={`dashboard-${config.clientName}-${config.period}`}
            config={config}
            data={activeSlide.content}
            onUpdate={(key, value) => handleSlideContentChange(activeSlide.id, key, value)}
            currentPage={currentPage}
            totalPages={totalPages}
          />
        );
      case 'layout_comparison':
        return (
          <LayoutComparison
            key={`comparison-${config.clientName}-${config.period}`}
            config={config}
            data={activeSlide.content}
            onUpdate={(key, value) => handleSlideContentChange(activeSlide.id, key, value)}
            currentPage={currentPage}
            totalPages={totalPages}
          />
        );
      case 'layout_kpi':
        return (
          <LayoutKPI
            key={`kpi-${config.clientName}-${config.period}`}
            config={config}
            data={activeSlide.content}
            onUpdate={(key, value) => handleSlideContentChange(activeSlide.id, key, value)}
            currentPage={currentPage}
            totalPages={totalPages}
          />
        );
      case 'layout_content':
        return (
          <LayoutContent
            key={`content-${config.clientName}-${config.period}`}
            config={config}
            data={activeSlide.content}
            onUpdate={(key, value) => handleSlideContentChange(activeSlide.id, key, value)}
            currentPage={currentPage}
            totalPages={totalPages}
          />
        );
      case 'placeholder':
      default:
        return <PlaceholderSlide onOpenSelector={() => setIsTemplateModalOpen(true)} />;
    }
  };

  const renderSlideThumbnail = (slide: Slide) => {
    // Render based on slide type - full size for accurate preview
    switch (slide.type) {
      case 'cover':
        return config.coverDesign ? (
          <CustomCover config={config} key={`cover-${config.clientName}-${config.period}`} />
        ) : (
          <ReportCoverVisual
            config={config}
            mode="full"
            key={`cover-${config.clientName}-${config.period}`}
          />
        );
      case 'dashboard':
        return (
          <InstagramDashboardSlide
            config={config}
            isThumbnail={false}
            key={`thumb-dashboard-${config.clientName}`}
          />
        );
      case 'layout_dashboard':
        return (
          <LayoutDashboard
            config={config}
            data={slide.content}
            key={`thumb-layout-dash-${config.clientName}`}
          />
        );
      case 'layout_comparison':
        return (
          <LayoutComparison
            config={config}
            data={slide.content}
            key={`thumb-layout-comp-${config.clientName}`}
          />
        );
      case 'layout_kpi':
        return (
          <LayoutKPI
            config={config}
            data={slide.content}
            key={`thumb-layout-kpi-${config.clientName}`}
          />
        );
      case 'layout_content':
        return (
          <LayoutContent
            config={config}
            data={slide.content}
            key={`thumb-layout-content-${config.clientName}`}
          />
        );
      case 'placeholder':
      default:
        return (
          <div className="w-full h-full bg-slate-50 flex items-center justify-center flex-col gap-2 p-4">
            <Layout size={24} className="text-slate-300" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {slide.type}
            </span>
          </div>
        );
    }
  };

  const templates: Template[] = [
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

  const CLIENT_DATA = clientsData as Record<string, string[]>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20 relative">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm h-16">
        <div className="max-w-7xl mx-auto px-6 h-full flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-slate-900 text-white p-1.5 rounded-lg">
              <MonitorPlay size={20} />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              AutoReport <span className="text-slate-400 font-normal">Generator</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Auto-save indicator */}
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
              <CheckCircle2 size={12} />
              <span className="font-medium">Auto-saved</span>
            </div>

            {currentStep === 'setup' && (
              <span className="px-3 py-1 rounded bg-blue-50 text-blue-700 text-xs font-bold">
                Step 1: Setup
              </span>
            )}
            {currentStep === 'review' && (
              <span className="px-3 py-1 rounded bg-blue-50 text-blue-700 text-xs font-bold">
                Step 2: Review
              </span>
            )}
            {currentStep.startsWith('edit') && (
              <span className="px-3 py-1 rounded bg-blue-50 text-blue-700 text-xs font-bold">
                Step 3: Editing
              </span>
            )}
          </div>
        </div>
      </header>

      {/* TOASTS */}
      {showSaveToast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-in slide-in-from-right fade-in duration-300">
          <CheckCircle2 size={20} />
          <div>
            <h4 className="font-bold text-sm">Report Saved</h4>
            <p className="text-xs opacity-90">Returning to setup...</p>
          </div>
        </div>
      )}
      {isExporting && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-6 py-4 rounded-lg shadow-xl flex items-center gap-4">
          <Loader2 size={24} className="animate-spin text-blue-400" />
          <div>
            <h4 className="font-bold text-sm">Generating File...</h4>
            <p className="text-xs text-slate-400">Capturing slides & compiling assets</p>
          </div>
        </div>
      )}
      {showExportToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white px-6 py-4 rounded-lg shadow-xl flex items-center gap-3">
          <Download size={24} />
          <div>
            <h4 className="font-bold text-sm">Download Complete</h4>
            <p className="text-xs opacity-90">Your file has been generated successfully.</p>
          </div>
        </div>
      )}

      {/* TEMPLATE MODAL */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl border border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Choose Layout</h3>
                <p className="text-sm text-slate-500">Select a starting point for your analysis.</p>
              </div>
              <button
                onClick={() => setIsTemplateModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-500"
              >
                <Minus size={20} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {templates.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => handleTemplateSelect(tmpl.id)}
                  className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 hover:shadow-md transition-all text-left group"
                >
                  <div className="p-3 bg-blue-100 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <tmpl.icon size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 group-hover:text-blue-700">
                      {tmpl.name}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">{tmpl.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

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

                  {/* Theme Selection */}
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-400 mb-2 block flex items-center gap-2">
                      <Palette size={12} /> Select Theme
                    </label>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {themesData.map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => setConfig({ ...config, theme: preset })}
                          className={`p-2 rounded-lg border text-left transition-all ${
                            config.theme.id === preset.id
                              ? 'border-slate-800 ring-1 ring-slate-800 bg-slate-50 shadow-sm'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold">{preset.name}</span>
                          </div>
                          <div
                            className={`flex h-3 w-full rounded-sm overflow-hidden ring-1 ring-black/5 ${
                              preset.type === 'light' ? 'border border-slate-200' : ''
                            }`}
                          >
                            {preset.colors.slice(0, 3).map((color: string, idx: number) => (
                              <div
                                key={idx}
                                className="h-full flex-1"
                                style={{ backgroundColor: color }}
                              ></div>
                            ))}
                          </div>
                        </button>
                      ))}
                    </div>
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
                          className="w-full border p-2 rounded text-sm bg-white flex justify-between items-center text-left min-h-[38px] hover:border-blue-400 transition-colors"
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
              <div className="flex-grow flex items-center justify-center bg-slate-200/50 rounded-xl border border-slate-300 p-4 lg:p-12 overflow-hidden shadow-inner relative">
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
                        onClick={() => handleDownload('pdf')}
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
                        onClick={() => handleDownload('pptx')}
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
      <div className="fixed left-[-9999px] top-0">
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
              ) : (
                <PlaceholderSlide onOpenSelector={() => {}} />
              )}
            </div>
          );
        })}
      </div>

      {/* Save Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">
              {saveMode === 'template' ? 'Save as Template' : 'Save Report'}
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              {saveMode === 'template'
                ? 'Save the structure/layout without data. You can reuse this template later.'
                : 'Save the complete report with all data. You can continue editing later.'}
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const name = (e.target as any).saveName.value;
                if (saveMode === 'template') {
                  handleSaveAsTemplate(name);
                } else {
                  handleSaveAsReport(name);
                }
              }}
            >
              <input
                type="text"
                name="saveName"
                placeholder="Enter name..."
                required
                autoFocus
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none mb-4"
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsSaveModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Load Modal */}
      {isLoadModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-xl font-bold">
                {loadMode === 'template' ? 'Load Template' : 'Load Saved Report'}
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                {loadMode === 'template'
                  ? 'Select a template to load its structure'
                  : 'Select a saved report to continue editing'}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {(() => {
                const key = loadMode === 'template' ? 'report_templates' : 'saved_reports';
                const items = JSON.parse(localStorage.getItem(key) || '[]');

                if (items.length === 0) {
                  return (
                    <div className="text-center py-12 text-slate-400">
                      <FileText size={48} className="mx-auto mb-3 opacity-50" />
                      <p>No {loadMode === 'template' ? 'templates' : 'saved reports'} yet</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {items.map((item: any) => (
                      <div
                        key={item.id}
                        className="border border-slate-200 rounded-lg p-4 hover:border-blue-400 hover:bg-blue-50/50 transition-all group"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-bold text-slate-900">{item.name}</h4>
                            <p className="text-xs text-slate-500 mt-1">
                              Saved: {new Date(item.savedAt).toLocaleString()}
                            </p>
                            <p className="text-xs text-slate-600 mt-1">
                              {item.slides.length} slides
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                loadMode === 'template'
                                  ? handleLoadTemplate(item)
                                  : handleLoadReport(item)
                              }
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium"
                            >
                              Load
                            </button>
                            <button
                              onClick={() => handleDeleteSaved(item.id, loadMode)}
                              className="px-2 py-1.5 text-red-500 hover:bg-red-50 rounded"
                              title="Delete"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
            <div className="p-4 border-t border-slate-200">
              <button
                onClick={() => setIsLoadModalOpen(false)}
                className="w-full px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
                    { id: 2, type: 'dashboard', title: 'Instagram Performance', content: {} },
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl border border-slate-200 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Load Saved Reports</h3>
                <p className="text-sm text-slate-500">Select a report to load</p>
              </div>
              <button
                onClick={() => setIsLoadReportsModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-500"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-2">
              {(() => {
                const saved = localStorage.getItem('saved_reports');
                const reports = saved ? JSON.parse(saved) : [];
                return reports.length > 0 ? (
                  reports.map((report: any, index: number) => (
                    <button
                      key={index}
                      onClick={() => {
                        handleLoadReport(report);
                        setIsLoadReportsModalOpen(false);
                      }}
                      className="w-full p-4 border-2 border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-bold text-slate-900 mb-1">
                            {report.config.reportTitle || 'Untitled Report'}
                          </div>
                          <div className="text-sm text-slate-600">
                            Client: {report.config.clientName}
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
                            {report.slides.length} slides • Period: {report.config.period}
                          </div>
                        </div>
                        <div className="text-blue-600">
                          <ChevronRight size={20} />
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="text-slate-400 mb-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mx-auto mb-4"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                      </svg>
                    </div>
                    <h4 className="font-bold text-slate-700 mb-1">No Reports Saved</h4>
                    <p className="text-sm text-slate-500">Create and save a report first</p>
                  </div>
                );
              })()}
            </div>

            <button
              onClick={() => setIsLoadReportsModalOpen(false)}
              className="w-full mt-6 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportSetupInterface;
