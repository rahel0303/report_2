'use client';

import React, { useState, useEffect, useRef } from 'react';
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
} from 'lucide-react';

// Import types
import { ReportConfig, Slide, Template, ThemePreset } from './types';

// Import data
import themesDataRaw from './data/themes.json';
import fontsData from './data/fonts.json';
import clientsData from './data/clients.json';

const themesData = themesDataRaw as ThemePreset[];

// Import slide components
import { PlaceholderSlide, ReportCoverVisual, InstagramDashboardSlide } from './components/slides';
// Import layout components
import { LayoutDashboard, LayoutComparison, LayoutKPI, LayoutContent } from './components/layouts';

const ReportSetupInterface: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<
    'setup' | 'review' | 'edit_cover' | 'edit_generic'
  >('setup');
  const [editingTitleId, setEditingTitleId] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [showExportToast, setShowExportToast] = useState(false);

  const [slides, setSlides] = useState<Slide[]>([
    { id: 1, type: 'cover', title: 'Report Cover', content: {} },
    { id: 2, type: 'dashboard', title: 'Instagram Performance', content: {} },
  ]);
  const [activeSlideId, setActiveSlideId] = useState<number | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isCompetitorDropdownOpen, setIsCompetitorDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const downloadRef = useRef<HTMLDivElement>(null);

  const [config, setConfig] = useState<ReportConfig>({
    reportTitle: 'Social Media Report',
    reportDetails: 'Monthly Performance & Strategy',
    preparedBy: 'Sekata Data Team',
    reportType: 'Monthly',
    period: 'SEPTEMBER 2025',
    theme: themesData[0],
    font: fontsData[0],
    clientName: 'BYD',
    selectedCompetitors: [],
  });
  const [previewMode, setPreviewMode] = useState<'cover' | 'content'>('cover');

  const getPeriodOptions = (type: 'Monthly' | 'Quarterly'): string[] => {
    const year = new Date().getFullYear();
    if (type === 'Monthly')
      return [
        `August ${year}`,
        `September ${year}`,
        `July ${year}`,
        `June ${year}`,
        `May ${year}`,
        `April ${year}`,
      ];
    return [`Q3 ${year}`, `Q2 ${year}`, `Q1 ${year}`, `Q4 ${year - 1}`];
  };

  useEffect(() => {
    const opts = getPeriodOptions(config.reportType);
    if (!opts.includes(config.period)) setConfig((prev) => ({ ...prev, period: opts[0] }));
  }, [config.reportType]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCompetitorDropdownOpen(false);
      }
      if (downloadRef.current && !downloadRef.current.contains(event.target as Node)) {
        setIsDownloadOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const goNext = () => {
    setCurrentStep('review');
    window.scrollTo(0, 0);
  };
  const goBack = () => setCurrentStep('setup');
  const goBackToReview = () => setCurrentStep('review');

  const handleSaveReport = () => {
    setShowSaveToast(true);
    setTimeout(() => {
      setShowSaveToast(false);
      setCurrentStep('setup');
    }, 1500);
  };

  const handleDownload = (format: string) => {
    setIsDownloadOpen(false);
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      setShowExportToast(true);
      setTimeout(() => setShowExportToast(false), 3000);
    }, 2500);
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

  const handleSlideContentChange = (slideId: number, key: string, value: any) => {
    setSlides((prev) =>
      prev.map((slide) =>
        slide.id === slideId ? { ...slide, content: { ...slide.content, [key]: value } } : slide
      )
    );
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
            content: {},
          };
        }
        return s;
      })
    );
    setIsTemplateModalOpen(false);
  };

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newClient = e.target.value;
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

    // Render based on slide type
    switch (activeSlide.type) {
      case 'cover':
        return <ReportCoverVisual config={config} mode={mode} />;
      case 'dashboard':
        return <InstagramDashboardSlide config={config} />;
      case 'layout_dashboard':
        return <LayoutDashboard config={config} />;
      case 'layout_comparison':
        return <LayoutComparison config={config} />;
      case 'layout_kpi':
        return <LayoutKPI config={config} />;
      case 'layout_content':
        return <LayoutContent config={config} />;
      case 'placeholder':
      default:
        return <PlaceholderSlide onOpenSelector={() => setIsTemplateModalOpen(true)} />;
    }
  };

  const renderSlideThumbnail = (slide: Slide) => {
    // Render based on slide type
    switch (slide.type) {
      case 'cover':
        return <ReportCoverVisual config={config} mode="thumbnail" />;
      case 'dashboard':
        return <InstagramDashboardSlide config={config} isThumbnail={true} />;
      case 'layout_dashboard':
        return <LayoutDashboard config={config} />;
      case 'layout_comparison':
        return <LayoutComparison config={config} />;
      case 'layout_kpi':
        return <LayoutKPI config={config} />;
      case 'layout_content':
        return <LayoutContent config={config} />;
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
                <div className="p-4 bg-slate-50 border-b border-slate-200">
                  <h2 className="font-semibold text-slate-700 flex items-center gap-2">
                    <Settings size={16} /> Setup Report
                  </h2>
                </div>
                <div className="p-6 space-y-6">
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
                <div className="bg-slate-50 p-4 border-t border-slate-200">
                  <button
                    onClick={goNext}
                    className="w-full py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition flex items-center justify-center gap-2 text-sm"
                  >
                    Next: Review Content <ChevronRight size={16} />
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
                    <ReportCoverVisual config={config} mode="preview" />
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
                  onClick={handleSaveReport}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                >
                  <Save size={16} className="text-emerald-500" />
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
                      {/* Thumbnail preview */}
                      <div className="w-full h-full">{renderSlideThumbnail(slide)}</div>

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
              <button
                onClick={goBackToReview}
                className="text-xs font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1"
              >
                <ArrowLeft size={12} /> Back to Review
              </button>
            </div>
            <div className="w-full max-w-6xl aspect-video bg-white shadow-2xl rounded-sm overflow-hidden border border-slate-200">
              {renderActiveSlide()}
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
              <button
                onClick={goBackToReview}
                className="text-xs font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1"
              >
                <ArrowLeft size={12} /> Back to Review
              </button>
            </div>
            <div className="w-full max-w-6xl aspect-video bg-white shadow-2xl rounded-sm overflow-hidden border border-slate-200">
              {renderActiveSlide()}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ReportSetupInterface;
