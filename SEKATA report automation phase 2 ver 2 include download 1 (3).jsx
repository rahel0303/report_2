import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Settings, User, Calendar, Type, Layout, Palette, ChevronRight,
  MonitorPlay, CheckCircle2, BookOpen, Presentation,
  BarChart3, ArrowLeft, MousePointerClick, Edit3, Save,
  Sparkles, Send, RefreshCw, Eye, 
  Activity, ArrowUpRight, ArrowDownRight, Minus, Key, Moon, Sun, 
  List, AlignLeft, Plus, Grid, Columns, Image as ImageIcon, PieChart, ExternalLink,
  ChevronDown, X, MessageSquare, PenTool, Check, Bot, BarChart2, Table as TableIcon, SlidersHorizontal,
  Download, Printer, FileText, Loader2, File
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Legend } from 'recharts';

// --- GEMINI API HELPER ---
const generateGeminiContent = async (prompt, systemInstruction = "") => {
  const apiKey = ""; // Runtime environment provides this
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] } 
        })
      }
    );
    
    if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Analysis unavailable.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Unable to connect to AI service. Please try again.";
  }
};

// --- TABLE DEFINITIONS & CONFIG ---
const TABLE_TYPES = {
    'performance': {
        id: 'performance',
        label: 'Performance Overview',
        icon: Activity,
        description: 'Month-over-month comparison of key profile metrics.',
        rowType: 'comparison', // Generates Prev, Current, Gap rows
        columns: [
            { id: 'profile_reach', label: 'Profile Reach', format: 'compact' },
            { id: 'profile_visit', label: 'Profile Visit', format: 'number' },
            { id: 'growth', label: 'Followers Growth', format: 'number' },
            { id: 'reach', label: 'Reach', format: 'compact' },
            { id: 'engagement', label: 'Engagement', format: 'number' },
            { id: 'likes', label: 'Likes', format: 'number' },
            { id: 'comments', label: 'Comments', format: 'number' },
            { id: 'shares', label: 'Shares', format: 'number' },
            { id: 'saves', label: 'Saves', format: 'number' },
            { id: 'er_reach', label: 'ER Reach', format: 'percent' },
            { id: 'er_followers', label: 'ER Followers', format: 'percent' },
        ]
    },
    'kpi': {
        id: 'kpi',
        label: 'KPI Achievements',
        icon: CheckCircle2,
        description: 'Cross-channel performance against goals.',
        rowType: 'channels', // Generates Instagram, TikTok, Facebook rows
        columns: [
            { id: 'followers', label: 'Followers', format: 'compact' },
            { id: 'ytd_growth', label: 'YTD Growth', format: 'percent' },
            { id: 'monthly_growth', label: 'MoM Growth', format: 'percent' },
            { id: 'channel_reach', label: 'Reach', format: 'compact' },
            { id: 'profile_visit', label: 'Profile Visit', format: 'number' },
            { id: 'total_eng', label: 'Total Eng.', format: 'compact' },
        ]
    },
    'post_performance': {
        id: 'post_performance',
        label: 'Post Performance',
        icon: BarChart2,
        description: 'Content output and viewership trends.',
        rowType: 'comparison',
        columns: [
            { id: 'post_count', label: 'Post Count', format: 'number' },
            { id: 'reach', label: 'Reach', format: 'compact' },
            { id: 'engagement', label: 'Engagement', format: 'compact' },
            { id: 'views', label: 'Views', format: 'compact' },
            { id: 'watch_time', label: 'Avg Watch Time', format: 'time' },
        ]
    },
    'post_type': {
        id: 'post_type',
        label: 'Post Type Performance',
        icon: ImageIcon,
        description: 'Breakdown by format (Image, Reels, Carousel).',
        rowType: 'types', // Generates Image, Reels, Carousel rows
        columns: [
            { id: 'post_count', label: 'Post Count', format: 'number' },
            { id: 'reach', label: 'Reach', format: 'compact' },
            { id: 'engagement', label: 'Engagement', format: 'compact' },
            { id: 'likes', label: 'Likes', format: 'number' },
            { id: 'comments', label: 'Comments', format: 'number' },
            { id: 'shares', label: 'Shares', format: 'number' },
            { id: 'saves', label: 'Saves', format: 'number' },
        ]
    },
    'custom': {
        id: 'custom',
        label: 'Custom Table',
        icon: SlidersHorizontal,
        description: 'Build your own table.',
        rowType: 'generic', // Generic Row 1, Row 2...
        columns: [
            { id: 'metric_1', label: 'Metric 1', format: 'number' },
            { id: 'metric_2', label: 'Metric 2', format: 'percent' },
            { id: 'metric_3', label: 'Metric 3', format: 'compact' },
        ]
    }
};

// --- HELPER: TEXT HIGHLIGHTER ---
const renderTextWithHighlights = (text, isDark, highlightColor) => {
  if (!text) return null;
  const parts = text.split(/(\*.*?\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <span key={index} className="font-bold" style={{ color: highlightColor }}>
          {part.slice(1, -1)}
        </span>
      );
    }
    return <span key={index}>{part}</span>;
  });
};

// --- HELPER: EMPTY STATE BOX ---
const EmptyStateBox = ({ icon: Icon, label, className }) => (
  <div className={`w-full h-full border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center bg-slate-50/50 text-slate-400 transition-all hover:bg-blue-50/50 hover:border-blue-300 hover:text-blue-500 cursor-pointer group ${className}`}>
    {Icon && <Icon size={24} className="mb-2 opacity-50 group-hover:scale-110 transition-transform" />}
    <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
  </div>
);

// --- COMPONENT: EDITABLE SLIDE TITLE ---
const EditableSlideTitle = ({ title, onChange, isDark }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempTitle, setTempTitle] = useState(title);

    useEffect(() => { setTempTitle(title); }, [title]);

    const handleSave = () => {
        if(tempTitle.trim()) {
            onChange(tempTitle);
        } else {
            setTempTitle(title); // Revert if empty
        }
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <input 
                autoFocus
                className={`text-2xl font-bold bg-transparent border-b-2 outline-none w-full pb-1 ${isDark ? 'text-white border-blue-500' : 'text-slate-800 border-blue-500'}`}
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onBlur={handleSave}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
        );
    }

    return (
        <h2 
            onClick={() => setIsEditing(true)}
            className={`text-2xl font-bold cursor-text hover:opacity-70 transition-opacity flex items-center gap-2 group truncate ${isDark ? 'text-white' : 'text-slate-900/80'}`}
            title="Click to edit title"
        >
            {title}
            <Edit3 size={16} className="opacity-0 group-hover:opacity-50 transition-opacity text-slate-400" />
        </h2>
    );
};

// --- COMPONENT: METRIC SELECTION MODAL ---
const MetricSelectionModal = ({ isOpen, onClose, onSelect, config }) => {
    if (!isOpen) return null;
    const isDark = config.theme.type === 'dark';
    
    const metrics = [
        { id: 'reach', label: 'Reach', icon: User },
        { id: 'impressions', label: 'Impressions', icon: Eye },
        { id: 'followers', label: 'Total Followers', icon: User },
        { id: 'growth', label: 'Followers Growth', icon: Activity },
        { id: 'engagement', label: 'Engagement', icon: MousePointerClick },
        { id: 'er', label: 'Engagement Rate', icon: BarChart3 },
        { id: 'saves', label: 'Saves', icon: BookOpen },
        { id: 'shares', label: 'Shares', icon: Send },
        { id: 'views', label: 'Video Views', icon: MonitorPlay },
        { id: 'visits', label: 'Profile Visits', icon: Layout },
        { id: 'clicks', label: 'Website Clicks', icon: MousePointerClick },
        { id: 'watch_time', label: 'Avg. Watch Time', icon: Activity },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`w-full max-w-lg p-6 rounded-2xl shadow-2xl ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`}>
                <div className="flex justify-between items-center mb-6">
                     <div>
                        <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>Select Metric</h3>
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Choose a key performance indicator to display.</p>
                     </div>
                     <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
                </div>

                <div className="grid grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto p-1">
                    {metrics.map(m => (
                        <button 
                            key={m.id}
                            onClick={() => onSelect(m)}
                            className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all hover:scale-105 ${isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-50 text-slate-700'}`}
                        >
                            <m.icon size={20} className="opacity-70" />
                            <span className="text-xs font-bold text-center">{m.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- COMPONENT: TABLE SELECTION MODAL ---
const TableSelectionModal = ({ isOpen, onClose, onConfirm, config }) => {
    if (!isOpen) return null;
    const isDark = config.theme.type === 'dark';
    const [selectedType, setSelectedType] = useState('performance');
    const [selectedColumns, setSelectedColumns] = useState(TABLE_TYPES['performance'].columns.map(c => c.id));

    const handleTypeChange = (typeId) => {
        setSelectedType(typeId);
        setSelectedColumns(TABLE_TYPES[typeId].columns.map(c => c.id));
    };

    const toggleColumn = (colId) => {
        setSelectedColumns(prev => 
            prev.includes(colId) ? prev.filter(id => id !== colId) : [...prev, colId]
        );
    };

    const handleConfirm = () => {
        onConfirm({
            type: selectedType,
            columns: selectedColumns
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`w-full max-w-2xl h-[32rem] rounded-2xl shadow-2xl flex flex-col overflow-hidden ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`}>
                {/* Header */}
                <div className={`p-4 border-b flex justify-between items-center ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
                    <div>
                        <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>Configure Data Table</h3>
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Select a template and customize metrics.</p>
                    </div>
                    <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
                </div>
                
                <div className="flex-1 flex min-h-0">
                    {/* Left: Types */}
                    <div className={`w-1/3 border-r overflow-y-auto p-2 space-y-2 ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-100 bg-slate-50'}`}>
                        {Object.values(TABLE_TYPES).map(type => (
                            <button
                                key={type.id}
                                onClick={() => handleTypeChange(type.id)}
                                className={`w-full text-left p-3 rounded-lg border transition-all ${selectedType === type.id ? 'bg-blue-50 border-blue-400 ring-1 ring-blue-400 dark:bg-blue-900/20 dark:border-blue-500' : 'border-transparent hover:bg-white dark:hover:bg-slate-800'}`}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <type.icon size={16} className={selectedType === type.id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'} />
                                    <span className={`text-sm font-bold ${selectedType === type.id ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'}`}>{type.label}</span>
                                </div>
                                <p className="text-[10px] text-slate-500 leading-tight">{type.description}</p>
                            </button>
                        ))}
                    </div>

                    {/* Right: Columns */}
                    <div className="flex-1 p-4 overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Visible Columns</h4>
                            <button 
                                onClick={() => setSelectedColumns(TABLE_TYPES[selectedType].columns.map(c => c.id))}
                                className="text-[10px] text-blue-500 hover:underline"
                            >
                                Reset to Default
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {TABLE_TYPES[selectedType].columns.map(col => (
                                <label key={col.id} className={`flex items-center gap-2 p-2 rounded border cursor-pointer select-none transition-all ${selectedColumns.includes(col.id) ? 'bg-blue-50/50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-700' : 'border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedColumns.includes(col.id) ? 'bg-blue-500 border-blue-500' : 'border-slate-300 bg-white'}`}>
                                        {selectedColumns.includes(col.id) && <Check size={10} className="text-white" />}
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        className="hidden"
                                        checked={selectedColumns.includes(col.id)}
                                        onChange={() => toggleColumn(col.id)}
                                    />
                                    <span className={`text-xs font-medium ${selectedColumns.includes(col.id) ? 'text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400'}`}>{col.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className={`p-4 border-t flex justify-end gap-2 ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
                    <button onClick={onClose} className="px-4 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded-lg">Cancel</button>
                    <button 
                        onClick={handleConfirm}
                        disabled={selectedColumns.length === 0}
                        className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        Insert Table
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- COMPONENT: METRIC SCORECARD BLOCK ---
const MetricScorecard = ({ config, className, savedState, onSave }) => {
    const [data, setData] = useState(savedState || null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    useEffect(() => {
        setData(savedState || null);
    }, [savedState]);
    
    const isDark = config.theme.type === 'dark';
    const styles = {
        cardBg: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
        textMain: isDark ? 'text-white' : 'text-slate-900',
        textMuted: isDark ? 'text-slate-400' : 'text-slate-500',
    };

    const handleSelect = (metric) => {
        let val, trend, trendVal, isPercent = false;
        
        const randomTrend = () => Math.random() > 0.4 ? 'up' : 'down';
        const randomPct = () => (Math.random() * 20 + 1).toFixed(1) + '%';
        
        switch(metric.id) {
            case 'er':
            case 'growth':
                val = (Math.random() * 5 + 1).toFixed(2) + '%';
                isPercent = true;
                break;
            case 'reach':
            case 'impressions':
            case 'views':
                val = (Math.floor(Math.random() * 500) + 100) + 'k';
                break;
            default:
                val = (Math.floor(Math.random() * 5000) + 500).toLocaleString();
        }

        const newData = {
            id: metric.id,
            label: metric.label,
            value: val,
            trend: randomTrend(),
            trendValue: randomPct(),
            iconId: metric.id 
        };

        setData(newData);
        if(onSave) onSave(newData);
        setIsModalOpen(false);
    };

    if (!data) {
        return (
            <>
                <div onClick={() => setIsModalOpen(true)} className={`w-full h-full ${className}`}>
                    <EmptyStateBox icon={Activity} label="Add Metric" />
                </div>
                <MetricSelectionModal 
                    isOpen={isModalOpen} 
                    onClose={() => setIsModalOpen(false)} 
                    onSelect={handleSelect}
                    config={config} 
                />
            </>
        );
    }

    return (
        <>
            <div 
                className={`w-full h-full rounded-xl border p-4 shadow-sm flex flex-col justify-between relative group cursor-pointer transition-all hover:shadow-md ${isDark ? 'border-white/10' : 'border-slate-200'}`} 
                style={{ backgroundColor: styles.cardBg }}
                onClick={() => setIsModalOpen(true)}
            >
                <div className="flex justify-between items-start">
                    <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${styles.textMuted}`}>
                        <Activity size={12} />
                        {data.label}
                    </span>
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-blue-500">
                        <Edit3 size={12} />
                    </button>
                </div>

                <div className="mt-2">
                    <span className={`text-3xl font-bold tracking-tight ${styles.textMain}`} style={{ fontFamily: config.font.name }}>
                        {data.value}
                    </span>
                </div>

                <div className="mt-2 flex items-center gap-2">
                    <div className={`flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full ${data.trend === 'up' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400' : 'text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400'}`}>
                        {data.trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        <span>{data.trendValue}</span>
                    </div>
                    <span className={`text-[9px] ${styles.textMuted}`}>vs last period</span>
                </div>
            </div>

            <MetricSelectionModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSelect={handleSelect}
                config={config} 
            />
        </>
    );
};

// --- COMPONENT: SMART TABLE BLOCK ---
const SmartTableBlock = ({ config, savedState, onSave, className }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [tableState, setTableState] = useState(savedState || null);
    
    useEffect(() => { setTableState(savedState || null); }, [savedState]);

    const isDark = config.theme.type === 'dark';
    const styles = {
        cardBg: isDark ? 'bg-slate-800' : 'bg-white',
        textMain: isDark ? 'text-white' : 'text-slate-900',
        textMuted: isDark ? 'text-slate-400' : 'text-slate-500',
        border: isDark ? 'border-slate-700' : 'border-slate-200',
        headerBg: isDark ? 'bg-slate-700/50' : 'bg-slate-50',
        rowHover: isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'
    };

    const handleConfigSave = (config) => {
        setTableState(config);
        if(onSave) onSave(config);
        setIsModalOpen(false);
    };

    const getRowData = (typeId, columns) => {
        const typeDef = TABLE_TYPES[typeId];
        let rows = [];

        const formatVal = (format, val) => {
            if(format === 'percent') return val + '%';
            if(format === 'compact') return Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(val);
            if(format === 'time') return val + 's';
            return val.toLocaleString();
        }

        const generateRowValues = (isGap = false) => {
            let rowData = {};
            columns.forEach(colId => {
                const colDef = typeDef.columns.find(c => c.id === colId);
                if (!colDef) return;

                if (isGap) {
                     const isPos = Math.random() > 0.4;
                     rowData[colId] = { 
                         value: (Math.random() * 20 + 1).toFixed(1) + '%',
                         isPositive: isPos
                     };
                } else {
                    let rawVal = 0;
                    if(colDef.format === 'percent') rawVal = (Math.random() * 5).toFixed(2);
                    else if(colDef.format === 'time') rawVal = Math.floor(Math.random() * 60 + 10);
                    else rawVal = Math.floor(Math.random() * 50000 + 1000);
                    rowData[colId] = formatVal(colDef.format, rawVal);
                }
            });
            return rowData;
        };

        if (typeDef.rowType === 'comparison') {
             rows = [
                 { id: 'prev', label: 'Previous Month', ...generateRowValues() },
                 { id: 'curr', label: 'Current Month', ...generateRowValues() },
                 { id: 'gap', label: 'Gap (%)', isGap: true, ...generateRowValues(true) }
             ];
        } else if (typeDef.rowType === 'channels') {
             rows = [
                 { id: 'ig', label: 'Instagram', ...generateRowValues() },
                 { id: 'tiktok', label: 'TikTok', ...generateRowValues() },
                 { id: 'fb', label: 'Facebook', ...generateRowValues() }
             ];
        } else if (typeDef.rowType === 'types') {
             rows = [
                 { id: 'img', label: 'Image', ...generateRowValues() },
                 { id: 'reel', label: 'Reels', ...generateRowValues() },
                 { id: 'car', label: 'Carousel', ...generateRowValues() }
             ];
        } else {
             rows = [
                 { id: '1', label: 'Item 1', ...generateRowValues() },
                 { id: '2', label: 'Item 2', ...generateRowValues() },
                 { id: '3', label: 'Item 3', ...generateRowValues() }
             ];
        }
        return rows;
    };

    const renderTable = () => {
        if (!tableState) return null;
        const typeDef = TABLE_TYPES[tableState.type];
        const rows = getRowData(tableState.type, tableState.columns);
        const visibleCols = typeDef.columns.filter(c => tableState.columns.includes(c.id));

        return (
            <div className={`w-full h-full flex flex-col rounded-xl border overflow-hidden ${styles.border} ${styles.cardBg}`}>
                <div className={`px-4 py-2 border-b flex justify-between items-center ${styles.border} ${styles.headerBg}`}>
                    <div className="flex items-center gap-2">
                        <typeDef.icon size={14} className={isDark ? 'text-blue-400' : 'text-blue-600'} />
                        <span className={`text-xs font-bold uppercase tracking-wide ${styles.textMain}`}>{typeDef.label}</span>
                    </div>
                    <button onClick={() => setIsModalOpen(true)} className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 hover:text-blue-500 transition-colors">
                        <Edit3 size={12} />
                    </button>
                </div>
                
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-right border-collapse">
                        <thead className={`sticky top-0 z-10 ${styles.headerBg}`}>
                            <tr>
                                <th className={`px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider border-b w-24 sticky left-0 z-20 ${styles.border} ${styles.textMuted} ${styles.headerBg}`}>
                                    {typeDef.rowType === 'comparison' ? 'Period' : typeDef.rowType === 'channels' ? 'Channel' : 'Category'}
                                </th>
                                {visibleCols.map(col => (
                                    <th key={col.id} className={`px-2 py-2 text-[9px] font-bold uppercase tracking-wider border-b min-w-[60px] ${styles.border} ${styles.textMuted}`}>
                                        {col.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-slate-100'}`}>
                            {rows.map((row, idx) => (
                                <tr key={row.id} className={`transition-colors ${styles.rowHover} ${row.isGap ? (isDark ? 'bg-white/5' : 'bg-slate-50/80') : ''}`}>
                                    <td className={`px-3 py-2 text-left text-[10px] font-bold sticky left-0 z-10 ${styles.textMain} ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
                                        {row.label}
                                    </td>
                                    {visibleCols.map(col => {
                                        const cellData = row[col.id];
                                        if (row.isGap) {
                                            return (
                                                <td key={col.id} className={`px-2 py-2 text-[10px] font-bold font-mono ${cellData.isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                    {cellData.isPositive ? '+' : ''}{cellData.value}
                                                </td>
                                            );
                                        }
                                        return (
                                            <td key={col.id} className={`px-2 py-2 text-[10px] font-mono ${styles.textMuted}`}>
                                                {cellData}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <>
            <div className={`w-full h-full ${className}`}>
                {tableState ? renderTable() : (
                    <div onClick={() => setIsModalOpen(true)} className="w-full h-full cursor-pointer">
                        <EmptyStateBox icon={TableIcon} label="Configure Data Table" />
                    </div>
                )}
            </div>
            
            <TableSelectionModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleConfigSave}
                config={config}
            />
        </>
    );
};

const ChartSelectionModal = ({ isOpen, onClose, onSelect, config }) => {
    if (!isOpen) return null;
    const isDark = config.theme.type === 'dark';
    const [postMode, setPostMode] = useState(false);

    const options = [
        { id: 'line', label: 'Line Chart', icon: Activity },
        { id: 'bar', label: 'Bar Chart', icon: BarChart3 }, 
        { id: 'column', label: 'Column Chart', icon: BarChart2 }, 
        { id: 'pie', label: 'Pie Chart', icon: PieChart },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`w-full max-w-md p-6 rounded-2xl shadow-2xl transform transition-all ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`}>
                <div className="flex justify-between items-center mb-6">
                     <div>
                        <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>Select Visualization</h3>
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Choose data representation style.</p>
                     </div>
                     <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
                </div>

                {!postMode ? (
                    <div className="grid grid-cols-3 gap-3">
                        {options.map(opt => (
                            <button 
                                key={opt.id}
                                onClick={() => onSelect(opt.id)}
                                className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all hover:scale-105 ${isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-50 text-slate-700'}`}
                            >
                                <opt.icon size={24} className="opacity-70" />
                                <span className="text-xs font-bold">{opt.label}</span>
                            </button>
                        ))}
                        <button 
                            onClick={() => setPostMode(true)}
                            className={`col-span-2 p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all hover:scale-105 bg-blue-50/50 border-blue-200 text-blue-700`}
                        >
                            <Grid size={24} />
                            <span className="text-xs font-bold">Post Visual Analysis</span>
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        <button onClick={() => setPostMode(false)} className="text-xs text-slate-500 flex items-center gap-1 mb-2 hover:text-blue-500"><ArrowLeft size={12}/> Back to Charts</button>
                        <div className="grid grid-cols-3 gap-3">
                            {[2, 3, 4].map(num => (
                                <button 
                                    key={num}
                                    onClick={() => onSelect('posts', { count: num })}
                                    className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all hover:scale-105 ${isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-50 text-slate-700'}`}
                                >
                                    <div className="flex gap-0.5">
                                        {Array.from({length: Math.min(num, 3)}).map((_,i) => <div key={i} className="w-2 h-3 bg-current opacity-50 rounded-[1px]"/>)}
                                        {num > 3 && <span className="text-[8px]">+</span>}
                                    </div>
                                    <span className="text-xs font-bold">{num} Posts</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const InsightMethodSelectionModal = ({ isOpen, onClose, onSelectManual, onSelectAI, config }) => {
    if (!isOpen) return null;
    const isDark = config.theme.type === 'dark';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`w-full max-w-sm p-6 rounded-2xl shadow-2xl transform transition-all ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`}>
                <div className="text-center mb-6">
                    <h3 className={`font-bold text-lg mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Add Insight</h3>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Choose how you want to add content to this slide.</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={onSelectManual}
                        className={`p-4 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all hover:scale-[1.02] group ${isDark ? 'border-slate-700 hover:border-blue-500 hover:bg-slate-800' : 'border-slate-200 hover:border-blue-500 hover:bg-blue-50'}`}
                    >
                        <div className={`p-3 rounded-full ${isDark ? 'bg-slate-800 text-blue-400 group-hover:bg-blue-900/30' : 'bg-slate-100 text-blue-600 group-hover:bg-blue-100'}`}>
                            <PenTool size={24} />
                        </div>
                        <span className={`text-sm font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Manual Note</span>
                    </button>

                    <button 
                        onClick={onSelectAI}
                        className={`p-4 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all hover:scale-[1.02] group ${isDark ? 'border-slate-700 hover:border-purple-500 hover:bg-slate-800' : 'border-slate-200 hover:border-purple-500 hover:bg-purple-50'}`}
                    >
                        <div className={`p-3 rounded-full ${isDark ? 'bg-slate-800 text-purple-400 group-hover:bg-purple-900/30' : 'bg-slate-100 text-purple-600 group-hover:bg-purple-100'}`}>
                            <Sparkles size={24} />
                        </div>
                        <span className={`text-sm font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>AI Generator</span>
                    </button>
                </div>

                <button onClick={onClose} className={`mt-6 w-full py-2 text-xs font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Cancel
                </button>
            </div>
        </div>
    );
};

const AiPromptModal = ({ isOpen, onClose, onGenerate, config }) => {
    if (!isOpen) return null;
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const isDark = config.theme.type === 'dark';

    const handleSubmit = async (e) => {
        e.preventDefault();
        if(!prompt.trim()) return;
        
        setIsGenerating(true);
        
        try {
            const systemPrompt = "You are a professional social media analyst helper. Your goal is to generate a single, professional insight paragraph suitable for a presentation slide based on the user's request. Use *bold* for emphasis on key metrics or trends. Keep it concise (under 50 words) and impactful.";
            const result = await generateGeminiContent(prompt, systemPrompt);
            onGenerate(result);
            setPrompt('');
        } catch (err) {
            console.error(err);
            // Fallback is handled in helper, but double check
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
             <div className={`w-full max-w-md p-6 rounded-2xl shadow-2xl ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`}>
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                        <Bot size={18} className="text-purple-500" />
                        <h3 className={`font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>AI Insight Generator</h3>
                    </div>
                    <button onClick={onClose} disabled={isGenerating}><X size={18} className="text-slate-400 hover:text-slate-600"/></button>
                </div>
                
                <form onSubmit={handleSubmit}>
                    <textarea 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="What should I analyze? (e.g., 'Summarize the engagement drop...')"
                        className={`w-full h-32 p-3 rounded-xl resize-none text-sm border focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none mb-4 ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                        autoFocus
                    />
                    
                    <div className="flex justify-end gap-2">
                         <button type="button" onClick={onClose} disabled={isGenerating} className={`px-4 py-2 text-xs font-bold rounded-lg ${isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'}`}>Cancel</button>
                         <button 
                            type="submit" 
                            disabled={!prompt.trim() || isGenerating}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 disabled:opacity-50 transition-all"
                         >
                            {isGenerating ? <Loader2 size={14} className="animate-spin"/> : <Sparkles size={14} />}
                            {isGenerating ? 'Generating...' : 'Generate Insight'}
                         </button>
                    </div>
                </form>
             </div>
        </div>
    );
};

const SmartChartBlock = ({ label, className, config, savedState, onSave }) => {
    const [chartType, setChartType] = useState(savedState?.type || null); 
    const [settings, setSettings] = useState(savedState?.settings || {});
    const [blockTitle, setBlockTitle] = useState(savedState?.title || label);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);

    useEffect(() => {
        if(savedState) {
            setChartType(savedState.type);
            setSettings(savedState.settings);
            if(savedState.title) setBlockTitle(savedState.title);
        }
    }, [savedState]);

    const isDark = config.theme.type === 'dark';
    const colorPrimary = config.theme.brandColor;
    const chartColors = config.theme.colors.slice(1); 

    const handleSelect = (type, extraSettings = {}) => {
        const newData = { type, settings: extraSettings, title: blockTitle };
        setChartType(type);
        setSettings(extraSettings);
        if(onSave) onSave(newData);
        setIsModalOpen(false);
    };

    const handleTitleSave = () => {
        setIsEditingTitle(false);
        if(onSave) onSave({ type: chartType, settings, title: blockTitle });
    }

    const data = useMemo(() => [
        { name: 'Jan', val: 4000, val2: 2400 },
        { name: 'Feb', val: 3000, val2: 1398 },
        { name: 'Mar', val: 2000, val2: 9800 },
        { name: 'Apr', val: 2780, val2: 3908 },
        { name: 'May', val: 1890, val2: 4800 },
        { name: 'Jun', val: 2390, val2: 3800 },
    ], []);

    const pieData = useMemo(() => [
        { name: 'Organic', value: 400 },
        { name: 'Paid', value: 300 },
        { name: 'Viral', value: 300 },
        { name: 'Direct', value: 200 },
    ], []);

    const postsData = useMemo(() => Array.from({length: settings.count || 3}).map((_, i) => ({
        id: i, reach: 12000 + i * 1500, eng: 450 + i * 50
    })), [settings.count]);

    const renderContent = () => {
        if (!chartType) return <EmptyStateBox icon={BarChart3} label={blockTitle} className={className} />;

        const ChartWrapper = ({ children }) => (
            <div className="w-full h-full flex flex-col bg-white dark:bg-slate-800 rounded-lg overflow-hidden relative group">
                <div className={`shrink-0 px-3 py-2 border-b flex justify-between items-center ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-100 bg-slate-50/50'}`}>
                    {isEditingTitle ? (
                        <input 
                           autoFocus 
                           className={`text-[10px] font-bold uppercase tracking-wider px-1 py-0.5 w-full mr-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-blue-200 text-slate-800'}`}
                           value={blockTitle}
                           onChange={e => setBlockTitle(e.target.value)}
                           onBlur={handleTitleSave}
                           onKeyDown={e => e.key === 'Enter' && handleTitleSave()}
                           onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <span 
                            onClick={(e) => { e.stopPropagation(); setIsEditingTitle(true); }} 
                            className={`text-[10px] font-bold uppercase tracking-wider cursor-text truncate border border-transparent hover:border-slate-200 px-1 py-0.5 rounded ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-blue-600'}`}
                            title="Click to edit title"
                        >
                            {blockTitle}
                        </span>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }} className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 transition-colors">
                        <Edit3 size={12}/>
                    </button>
                </div>
                <div className="flex-1 min-h-0 relative p-2">
                    {children}
                </div>
            </div>
        );

        if (chartType === 'posts') {
            return (
                <ChartWrapper>
                    <div className={`w-full h-full grid gap-2 ${settings.count === 2 ? 'grid-cols-2' : settings.count === 3 ? 'grid-cols-3' : 'grid-cols-2 grid-rows-2'}`}>
                        {postsData.map((post, i) => (
                            <div key={i} className={`rounded-lg border overflow-hidden flex flex-col ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                                <div className="flex-1 bg-slate-100/50 flex items-center justify-center">
                                    <ImageIcon className="text-slate-300" size={20} />
                                </div>
                                <div className="p-2 border-t border-slate-100 dark:border-slate-700">
                                    <div className="flex justify-between text-[8px] mb-1">
                                        <span className="text-slate-400">Reach</span>
                                        <span className={`font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{post.reach.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-[8px]">
                                        <span className="text-slate-400">Eng.</span>
                                        <span className={`font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{post.eng}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </ChartWrapper>
            );
        }

        return (
            <ChartWrapper>
                <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'line' ? (
                        <LineChart data={data} margin={{top:10, right:10, left:-20, bottom:0}}>
                            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} vertical={false} />
                            <XAxis dataKey="name" tick={{fontSize:10, fill: isDark ? '#94a3b8' : '#64748b'}} axisLine={false} tickLine={false} />
                            <YAxis tick={{fontSize:10, fill: isDark ? '#94a3b8' : '#64748b'}} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{fontSize:'10px', borderRadius:'8px', border:'none', boxShadow:'0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                            <Line type="monotone" dataKey="val" stroke={colorPrimary} strokeWidth={2} dot={{r:3}} />
                            <Line type="monotone" dataKey="val2" stroke={chartColors[1]} strokeWidth={2} dot={{r:3}} />
                        </LineChart>
                    ) : chartType === 'column' ? (
                        <BarChart data={data} margin={{top:10, right:10, left:-20, bottom:0}}>
                            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} vertical={false} />
                            <XAxis dataKey="name" tick={{fontSize:10, fill: isDark ? '#94a3b8' : '#64748b'}} axisLine={false} tickLine={false} />
                            <YAxis tick={{fontSize:10, fill: isDark ? '#94a3b8' : '#64748b'}} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{fontSize:'10px', borderRadius:'8px', border:'none', boxShadow:'0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                            <Bar dataKey="val" fill={colorPrimary} radius={[4,4,0,0]} />
                        </BarChart>
                    ) : chartType === 'bar' ? (
                        <BarChart layout="vertical" data={data} margin={{top:10, right:10, left:0, bottom:0}}>
                            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} horizontal={false} />
                            <XAxis type="number" tick={{fontSize:10, fill: isDark ? '#94a3b8' : '#64748b'}} axisLine={false} tickLine={false} />
                            <YAxis dataKey="name" type="category" tick={{fontSize:10, fill: isDark ? '#94a3b8' : '#64748b'}} axisLine={false} tickLine={false} width={30} />
                            <Tooltip contentStyle={{fontSize:'10px', borderRadius:'8px', border:'none', boxShadow:'0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                            <Bar dataKey="val" fill={colorPrimary} radius={[0,4,4,0]} barSize={20} />
                        </BarChart>
                    ) : (
                        <PieChart margin={{top:0, right:0, left:0, bottom:0}}>
                             <Pie 
                                data={pieData} 
                                cx="50%" 
                                cy="50%" 
                                innerRadius={0} 
                                outerRadius={60} 
                                paddingAngle={2} 
                                dataKey="value"
                                label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, x, y, textAnchor }) => (
                                    <text 
                                        x={x} 
                                        y={y} 
                                        fill={isDark ? '#e2e8f0' : '#475569'} 
                                        textAnchor={textAnchor} 
                                        dominantBaseline="central" 
                                        style={{ fontSize: '10px', fontWeight: 'bold' }}
                                    >
                                        {`${name} ${(percent * 100).toFixed(0)}%`}
                                    </text>
                                )}
                                labelLine={false}
                             >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                                ))}
                             </Pie>
                             <Tooltip contentStyle={{fontSize:'10px', borderRadius:'8px', border:'none'}} />
                             <Legend 
                                verticalAlign="bottom" 
                                height={24} 
                                iconType="circle"
                                iconSize={8}
                                wrapperStyle={{fontSize: '10px'}}
                             />
                        </PieChart>
                    )}
                </ResponsiveContainer>
            </ChartWrapper>
        );
    };

    return (
        <>
            <div onClick={() => !chartType && setIsModalOpen(true)} className="w-full h-full cursor-pointer">
                {renderContent()}
            </div>
            <ChartSelectionModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSelect={handleSelect}
                config={config} 
            />
        </>
    );
};

const SmartInsightBlock = ({ icon, label, className, config, savedState, onSave }) => {
    const [content, setContent] = useState(savedState || null); 
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState('');
    
    useEffect(() => {
        setContent(savedState || null);
    }, [savedState]);

    const [showSelectionModal, setShowSelectionModal] = useState(false);
    const [showAiPromptModal, setShowAiPromptModal] = useState(false);

    const isDark = config.theme.type === 'dark';
    const colorPrimary = config.theme.brandColor;
    const inputRef = useRef(null);

    const handleBlockClick = () => {
        if (content && !isEditing) {
            setEditValue(content);
            setIsEditing(true);
        } else if (!isEditing) {
            setShowSelectionModal(true);
        }
    };

    const handleSelectManual = () => {
        setShowSelectionModal(false);
        setEditValue(content || '');
        setIsEditing(true);
    };

    const handleSelectAI = () => {
        setShowSelectionModal(false);
        setShowAiPromptModal(true);
    };

    const handleAiGenerated = (generatedText) => {
        setShowAiPromptModal(false);
        setEditValue(generatedText);
        setIsEditing(true); 
    };

    const handleSave = () => {
        setContent(editValue);
        if(onSave) onSave(editValue);
        setIsEditing(false);
    };

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.setSelectionRange(inputRef.current.value.length, inputRef.current.value.length);
        }
    }, [isEditing]);

    return (
        <>
            <div className="h-full w-full group relative">
                {isEditing ? (
                    <div className={`h-full w-full rounded-lg border flex flex-col relative animate-in fade-in duration-200 ring-2 ring-blue-500/20 ${isDark ? 'bg-slate-800 border-blue-500/50' : 'bg-white border-blue-400'}`}>
                        <div className={`px-3 py-2 border-b flex justify-between items-center ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
                             <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500 flex items-center gap-1">
                                 <PenTool size={10} /> Editing...
                             </span>
                        </div>
                        <textarea
                            ref={inputRef}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className={`flex-1 w-full p-3 resize-none text-[10px] leading-relaxed outline-none bg-transparent ${isDark ? 'text-white placeholder:text-slate-600' : 'text-slate-800 placeholder:text-slate-400'}`}
                            placeholder="Type your notes here..."
                        />
                        <div className="absolute bottom-3 right-3 flex gap-2">
                             <button 
                                onClick={() => setIsEditing(false)} 
                                className={`p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors`}
                                title="Cancel"
                             >
                                 <X size={14} />
                             </button>
                             <button 
                                onClick={handleSave} 
                                className="bg-blue-600 text-white p-1.5 rounded-md hover:bg-blue-700 shadow-md transition-transform hover:scale-105"
                                title="Save"
                             >
                                 <Check size={14} />
                             </button>
                        </div>
                    </div>
                ) : (
                    <div onClick={handleBlockClick} className="h-full w-full cursor-pointer">
                        {content ? (
                            <div className={`h-full w-full p-3 rounded-lg border overflow-hidden relative transition-all group-hover:ring-2 group-hover:ring-blue-400/50 ${isDark ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-white border-slate-200 text-slate-600'}`}>
                                <div className="flex justify-between items-start mb-2 opacity-50">
                                     <div className="flex items-center gap-1.5">
                                         {icon && React.createElement(icon, { size: 12 })}
                                         <span className="font-bold uppercase tracking-wider text-[9px]">{label}</span>
                                     </div>
                                     <div className="flex gap-1">
                                         <Edit3 size={12} />
                                     </div>
                                </div>
                                <div className="text-[10px] leading-relaxed whitespace-pre-wrap font-medium">
                                    {renderTextWithHighlights(content, isDark, colorPrimary)}
                                </div>
                            </div>
                        ) : (
                            <EmptyStateBox icon={icon} label={label} className={className} />
                        )}
                    </div>
                )}
            </div>
            
            <InsightMethodSelectionModal 
                isOpen={showSelectionModal}
                onClose={() => setShowSelectionModal(false)}
                onSelectManual={handleSelectManual}
                onSelectAI={handleSelectAI}
                config={config}
            />

            <AiPromptModal 
                isOpen={showAiPromptModal}
                onClose={() => setShowAiPromptModal(false)}
                onGenerate={handleAiGenerated}
                config={config}
            />
        </>
    )
};

// --- COMPONENT: PLACEHOLDER SLIDE ---
const PlaceholderSlide = ({ onOpenSelector }) => {
    return (
        <div className="w-full h-full p-12 flex items-center justify-center bg-white">
            <div 
                onClick={onOpenSelector}
                className="w-full h-full border-4 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center bg-slate-50/50 group hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer"
            >
                 <div className="p-6 bg-white rounded-2xl shadow-sm mb-4 border border-slate-100 group-hover:scale-110 group-hover:shadow-md transition-all duration-300">
                     <Plus size={48} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                 </div>
                 <p className="text-slate-400 font-semibold text-lg group-hover:text-blue-600 transition-colors">Add Content Layout</p>
                 <span className="text-slate-300 text-sm mt-1 group-hover:text-blue-400">Click to choose a template</span>
            </div>
        </div>
    );
};

// --- TEMPLATE LAYOUTS ---

// 1. Standard Dashboard (UPDATED with SmartTableBlock)
const LayoutDashboardEmpty = ({ config, title, onTitleChange, data = {}, onUpdate }) => {
  const isDark = config.theme.type === 'dark';
  const styles = { bg: config.theme.colors[0], cardBg: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff', border: isDark ? 'border-white/20' : 'border-slate-200' };

  return (
    <div className="w-full h-full flex flex-col p-6 gap-3" style={{ fontFamily: config.font.name, backgroundColor: styles.bg }}>
       {/* Header with Editable Title */}
       <div className={`h-[12%] shrink-0 border rounded-xl p-4 flex items-center justify-between ${styles.border}`} style={{ backgroundColor: styles.cardBg }}>
            <div className="w-full">
                <EditableSlideTitle title={title} onChange={onTitleChange} isDark={isDark} />
            </div>
            {/* Header Graphics Placeholder */}
            <div className="flex gap-4 opacity-50">
                 <div className="h-8 w-8 bg-slate-200 rounded animate-pulse"></div>
                 <div className="h-8 w-20 bg-slate-100 rounded animate-pulse"></div>
            </div>
       </div>

       <div className="flex gap-3 h-[50%] min-h-0 w-full">
          <div className={`flex-[1.85] rounded-xl border p-2 shadow-sm ${styles.border}`} style={{ backgroundColor: styles.cardBg }}>
             <SmartChartBlock 
                label="Main Chart Area" 
                config={config} 
                savedState={data.main_chart}
                onSave={(val) => onUpdate('main_chart', val)}
             />
          </div>
          <div className={`flex-1 rounded-xl border p-2 shadow-sm ${styles.border}`} style={{ backgroundColor: styles.cardBg }}>
             <SmartInsightBlock 
                icon={Sparkles} 
                label="AI Key Insights" 
                className="bg-blue-50/20 border-blue-200/50" 
                config={config} 
                savedState={data.insights}
                onSave={(val) => onUpdate('insights', val)}
             />
          </div>
       </div>

       {/* Data Table Section */}
       <div className={`h-[38%] rounded-xl shadow-sm p-0 overflow-hidden`}>
          <SmartTableBlock 
             config={config}
             savedState={data.table_block}
             onSave={(val) => onUpdate('table_block', val)}
             className="w-full h-full"
          />
       </div>
    </div>
  );
};

// 2. Comparison Layout (Refactored for dedicated summary space)
const LayoutComparison = ({ config, title, onTitleChange, data = {}, onUpdate }) => {
  const isDark = config.theme.type === 'dark';
  const styles = { bg: config.theme.colors[0], cardBg: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff', border: isDark ? 'border-white/20' : 'border-slate-200' };

  return (
    <div className="w-full h-full flex flex-col p-6 gap-4" style={{ fontFamily: config.font.name, backgroundColor: styles.bg }}>
       <div className={`h-[10%] shrink-0 border-b flex items-end pb-4 ${styles.border}`}>
            <EditableSlideTitle title={title} onChange={onTitleChange} isDark={isDark} />
       </div>
       {/* Comparison Columns */}
       <div className="flex-1 flex gap-6 min-h-0">
          <div className={`flex-1 flex flex-col gap-2 rounded-xl border p-2 shadow-sm ${styles.border}`} style={{ backgroundColor: styles.cardBg }}>
             <SmartChartBlock 
                label="Period A / Segment A" 
                config={config} 
                savedState={data.chart_a}
                onSave={(val) => onUpdate('chart_a', val)}
             />
          </div>
          <div className={`flex-1 flex flex-col gap-2 rounded-xl border p-2 shadow-sm ${styles.border}`} style={{ backgroundColor: styles.cardBg }}>
             <SmartChartBlock 
                label="Period B / Segment B" 
                config={config} 
                savedState={data.chart_b}
                onSave={(val) => onUpdate('chart_b', val)}
             />
          </div>
       </div>
       {/* Dedicated Summary Block */}
       <div className={`h-[20%] shrink-0 rounded-xl border p-2 shadow-sm ${styles.border}`} style={{ backgroundColor: styles.cardBg }}>
            <SmartInsightBlock 
                icon={Sparkles} 
                label="Comparative Analysis & Notes" 
                className="bg-blue-50/20 border-blue-200/50" 
                config={config} 
                savedState={data.summary}
                onSave={(val) => onUpdate('summary', val)}
             />
       </div>
    </div>
  );
};

// 3. KPI Overview Layout (UPDATED)
const LayoutKPI = ({ config, title, onTitleChange, data = {}, onUpdate }) => {
  const isDark = config.theme.type === 'dark';
  const styles = { bg: config.theme.colors[0], cardBg: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff', border: isDark ? 'border-white/20' : 'border-slate-200' };

  return (
    <div className="w-full h-full flex flex-col p-6 gap-4" style={{ fontFamily: config.font.name, backgroundColor: styles.bg }}>
       <div className={`h-[10%] shrink-0 border-b flex items-end pb-4 ${styles.border}`}>
            <EditableSlideTitle title={title} onChange={onTitleChange} isDark={isDark} />
       </div>
       {/* KPI Row - UPDATED to use MetricScorecard */}
       <div className="flex gap-4 h-[22%] min-h-[120px]">
           {[1,2,3,4].map(i => (
               <div key={i} className="flex-1">
                   <MetricScorecard 
                      config={config} 
                      savedState={data[`metric_${i}`]}
                      onSave={(val) => onUpdate(`metric_${i}`, val)}
                   />
               </div>
           ))}
       </div>
       {/* Main Content */}
       <div className="flex-1 flex gap-4 min-h-0">
           <div className={`flex-[2] rounded-xl border p-2 shadow-sm ${styles.border}`} style={{ backgroundColor: styles.cardBg }}>
                <SmartChartBlock 
                    label="Deep Dive Analysis" 
                    config={config} 
                    savedState={data.main_chart}
                    onSave={(val) => onUpdate('main_chart', val)}
                />
           </div>
           {/* Dedicated Summary Block */}
           <div className={`flex-1 rounded-xl border p-2 shadow-sm ${styles.border}`} style={{ backgroundColor: styles.cardBg }}>
                <SmartInsightBlock 
                    icon={Sparkles} 
                    label="Summary & Actions" 
                    className="bg-blue-50/20 border-blue-200/50" 
                    config={config} 
                    savedState={data.summary}
                    onSave={(val) => onUpdate('summary', val)}
                />
           </div>
       </div>
    </div>
  );
};

const LayoutContent = ({ config, title, onTitleChange, data = {}, onUpdate }) => {
  const isDark = config.theme.type === 'dark';
  const styles = { 
      bg: config.theme.colors[0], 
      cardBg: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff', 
      border: isDark ? 'border-white/20' : 'border-slate-200',
      textMain: isDark ? 'text-white' : 'text-slate-900',
      textMuted: isDark ? 'text-slate-300' : 'text-slate-500',
      divider: isDark ? 'border-white/10' : 'border-slate-100'
  };

  const postCount = data.postCount || 4;
  const filterType = data.filterType || 'top';
  
  const setPostCount = (val) => onUpdate('postCount', val);
  const setFilterType = (val) => onUpdate('filterType', val);

  // Mock Data Generator
  const posts = useMemo(() => {
     // Generate some dummy posts
     const dummy = Array.from({length: 24}).map((_, i) => ({
         id: i,
         image: null, // Placeholder
         reach: Math.floor(Math.random() * 50000) + 1000,
         engagement: Math.floor(Math.random() * 5000) + 100,
         get er() { return ((this.engagement / this.reach) * 100).toFixed(2) },
         link: '#'
     })).sort((a,b) => b.engagement - a.engagement); // Default sort by performance (engagement)

     let filtered = [];
     if (filterType === 'top') {
         filtered = dummy.slice(0, postCount);
     } else if (filterType === 'low') {
         filtered = [...dummy].reverse().slice(0, postCount);
     } else if (filterType === 'mixed') {
         const half = Math.ceil(postCount / 2);
         filtered = [...dummy.slice(0, half), ...dummy.reverse().slice(0, postCount - half)];
     }
     return filtered;
  }, [postCount, filterType]);

  return (
    <div className="w-full h-full flex flex-col p-6 gap-4" style={{ fontFamily: config.font.name, backgroundColor: styles.bg }}>
       {/* Header & Controls */}
       <div className={`shrink-0 border-b flex items-center justify-between pb-2 ${styles.border}`}>
            <EditableSlideTitle title={title} onChange={onTitleChange} isDark={isDark} />
            
            {/* Controls */}
            <div className="flex gap-2">
                <div className="flex bg-slate-100 rounded-md p-0.5 border border-slate-200">
                    {[4, 6, 8].map(count => (
                        <button 
                            key={count}
                            onClick={() => setPostCount(count)}
                            className={`px-3 py-1 text-xs font-bold rounded transition-all ${postCount === count ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            {count} Posts
                        </button>
                    ))}
                </div>
                 <div className="flex bg-slate-100 rounded-md p-0.5 border border-slate-200">
                    {['top', 'mixed', 'low'].map(type => (
                        <button 
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={`px-3 py-1 text-xs font-bold rounded capitalize transition-all ${filterType === type ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            {type === 'mixed' ? 'Top & Low' : type}
                        </button>
                    ))}
                </div>
            </div>
       </div>

       {/* Content: Grid */}
       <div className={`grid gap-4 flex-1 min-h-0 ${postCount === 4 ? 'grid-cols-4' : postCount === 6 ? 'grid-cols-3' : 'grid-cols-4'}`}>
           {posts.map((post, i) => (
               <div key={i} className={`rounded-xl border overflow-hidden flex flex-col shadow-sm ${styles.border}`} style={{ backgroundColor: styles.cardBg }}>
                   {/* Image Section */}
                   <div className="relative flex-1 bg-slate-50/50 flex items-center justify-center min-h-0 overflow-hidden group">
                       <ImageIcon size={28} className="text-slate-300 group-hover:scale-110 transition-transform" />
                       
                       {/* Overlay info for Top/Low if mixed */}
                       {filterType === 'mixed' && (
                           <div className={`absolute top-2 left-2 text-[8px] font-bold px-1.5 py-0.5 rounded text-white shadow-sm z-10 ${i < postCount/2 ? 'bg-emerald-500/90' : 'bg-rose-500/90'}`}>
                               {i < postCount/2 ? 'TOP' : 'LOW'}
                           </div>
                       )}
                   </div>

                   {/* Metrics Section (Vertical Table) */}
                   <div className={`p-3 border-t ${styles.divider}`}>
                       <div className={`flex items-center justify-between mb-2 pb-2 border-b ${styles.divider}`}>
                           <span className={`text-[10px] font-bold ${styles.textMain}`}>Post #{post.id + 204}</span>
                           <ExternalLink size={10} className="text-blue-500 cursor-pointer hover:text-blue-600" />
                       </div>
                       
                       <div className="grid grid-cols-2 gap-y-1.5 text-[9px]">
                           <span className={`${styles.textMuted} font-medium`}>Reach</span>
                           <span className={`font-mono text-right ${styles.textMain}`}>{post.reach.toLocaleString()}</span>
                           
                           <span className={`${styles.textMuted} font-medium`}>Engagement</span>
                           <span className={`font-mono text-right ${styles.textMain}`}>{post.engagement.toLocaleString()}</span>
                           
                           <span className={`${styles.textMuted} font-medium`}>Eng. Rate</span>
                           <span className={`font-bold text-right ${post.er > 2.5 ? 'text-emerald-500' : 'text-amber-500'}`}>{post.er}%</span>
                       </div>
                   </div>
               </div>
           ))}
       </div>

       {/* Dedicated Summary Block */}
       <div className={`h-[18%] shrink-0 rounded-xl border p-2 shadow-sm ${styles.border}`} style={{ backgroundColor: styles.cardBg }}>
            {/* UPDATED: Smart Insight Block */}
            <SmartInsightBlock 
                icon={Sparkles} 
                label="Visual Strategy Notes & Insights" 
                className="bg-blue-50/20 border-blue-200/50" 
                config={config} 
                savedState={data.insight}
                onSave={(val) => onUpdate('insight', val)}
             />
       </div>
    </div>
  );
};


// --- 1. COMPONENT: COVER VISUAL (Modified for Reusability) ---
const ReportCoverVisual = ({ config, mode = 'full' }) => {
  const bgStyle = { backgroundColor: config.theme.colors[0] }; 
  const textStyle = config.theme.textColor;
  const borderStyle = config.theme.type === 'dark' ? 'border-white/30' : 'border-slate-900/20';

  const typo = {
    full: { 
      title: 'text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1]', 
      subtitle: 'text-xl md:text-2xl font-light tracking-wide', 
      period: 'text-sm font-bold tracking-[0.25em]', 
      logo: 'text-lg', dolphin: 'text-2xl', footer: 'text-[10px]' 
    },
    preview: { 
      title: 'text-3xl font-bold leading-tight', 
      subtitle: 'text-sm font-light', 
      period: 'text-[8px] font-bold tracking-widest', 
      logo: 'text-xs', dolphin: 'text-base', footer: 'text-[8px]' 
    },
    thumbnail: { 
      title: 'text-lg font-bold leading-tight', 
      subtitle: 'text-[8px]', 
      period: 'text-[6px]', 
      logo: 'text-[6px]', dolphin: 'text-[10px]', footer: 'text-[6px]' 
    },
  }[mode];

  const spacing = { full: 'p-16', preview: 'p-8', thumbnail: 'p-4' }[mode];

  return (
    <div className={`w-full h-full relative flex flex-col overflow-hidden font-sans ${spacing}`} style={{...bgStyle, fontFamily: config.font.name}}>
        
        {/* Header Logo */}
        <div className={`absolute top-8 left-8 z-20 ${textStyle} ${mode === 'thumbnail' ? 'top-3 left-3' : ''}`}>
             <a 
                href="#" 
                className="flex items-center gap-2 hover:opacity-75 transition-opacity cursor-pointer no-underline"
                onClick={(e) => e.preventDefault()} 
             >
                <span className={`${typo.dolphin} filter drop-shadow-sm`}>🐬</span>
                <span className={`${typo.logo} font-bold opacity-90 underline decoration-dotted underline-offset-4`}>Sekata 2025</span>
             </a>
        </div>

        {/* --- REUSABLE CENTER CONTENT START --- */}
        {/* This block is designed to be dropped into any "Add Page" or hero section */}
        <div className="flex-1 flex flex-col items-center justify-center text-center z-10 w-full px-4">
            <div className={`${textStyle} w-full max-w-4xl mx-auto`}>
               {/* Title with balance for symmetry */}
               <h1 
                 className={`${typo.title} mb-6 drop-shadow-md break-words`} 
                 style={{ textWrap: 'balance' }}
               >
                 {config.reportTitle}
               </h1>
               
               {/* Divider and Subtitle Block */}
               <div className={`border-t pt-6 w-full max-w-lg mx-auto ${borderStyle} flex flex-col gap-3`}>
                 <p className={`${typo.subtitle} opacity-90 leading-relaxed`}>{config.reportDetails}</p>
                 
                 {/* Period Badge */}
                 <div className="mt-2 inline-flex justify-center">
                    <span className={`${typo.period} uppercase opacity-80 border py-1.5 px-5 rounded-full ${borderStyle} inline-block`}>
                      {config.period}
                    </span>
                 </div>
               </div>
            </div>

            {/* Optional Author Footer within Center Block */}
            {config.preparedBy && (
                <div className={`mt-16 ${textStyle} opacity-80`}>
                   <p className={`${typo.period} font-medium`}>Prepared by: {config.preparedBy}</p>
                </div>
            )}
        </div>
        {/* --- REUSABLE CENTER CONTENT END --- */}
        
        {/* Decorative Bars */}
        <div className="absolute bottom-0 left-0 w-full h-4 flex">
            {config.theme.colors.slice(1).map((c, i) => (
                <div key={i} className="h-full flex-1" style={{backgroundColor: c}}/>
            ))}
        </div>

        <div className={`absolute bottom-8 right-8 font-mono uppercase opacity-40 ${textStyle} ${typo.footer} ${mode === 'thumbnail' ? 'bottom-3 right-3' : ''}`}>
           Confidential Document
        </div>
    </div>
  );
};

// --- 2. COMPONENT: DASHBOARD SLIDE (Slide 2) ---
const InstagramDashboardSlide = ({ config, isThumbnail = false }) => {
  const isDark = config.theme.type === 'dark';
  
  // Styling System
  const styles = {
    bg: config.theme.colors[0], // Background Utama
    textMain: isDark ? 'text-white' : 'text-slate-900',
    textMuted: isDark ? 'text-slate-300' : 'text-slate-500',
    cardBg: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
    border: isDark ? 'border-white/20' : 'border-slate-200',
    gridColor: isDark ? 'rgba(255,255,255,0.1)' : '#f1f5f9', 
    axisColor: isDark ? '#cbd5e1' : '#64748b',
    tableHeaderBg: isDark ? 'rgba(0,0,0,0.2)' : '#f8fafc',
    tableRowHover: isDark ? 'hover:bg-white/10' : 'hover:bg-slate-50/80',
    aiInputBg: isDark ? 'bg-white/10 border-white/10 text-white' : 'bg-white border-indigo-200 text-slate-700',
    aiButtonActive: isDark ? 'bg-indigo-500/30 text-indigo-300 border-indigo-500/50' : 'bg-indigo-100 text-indigo-700 border-indigo-200',
    aiButtonInactive: isDark ? 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10' : 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100',
  };

  const colorPrimary = config.theme.brandColor;
  const colorSecondary = config.theme.colors[4]; 

  // --- CHART DATA WITH SPIKES ---
  const chartData = useMemo(() => {
    const data = [];
    for (let i = 1; i <= 31; i++) {
      let reachBase = 1200000; 
      let followerBase = 2500;
      
      // Spikes logic
      if (i === 5 || i === 12 || i === 20 || i === 28) { 
          reachBase += 2000000 + Math.random() * 500000; 
      } else {
          reachBase += Math.random() * 400000 - 200000;
      }

      if (i === 7 || i === 15 || i === 23 || i === 30) {
          followerBase += 4000 + Math.random() * 1000;
      } else {
          followerBase += Math.random() * 300 - 150;
      }
      
      const day = i.toString().padStart(2, '0');
      data.push({ 
        date: `Aug ${i}`, 
        formattedDate: `${day}/08/25`,
        reach: Math.floor(reachBase > 0 ? reachBase : 0), 
        followers: Math.floor(followerBase > 0 ? followerBase : 0) 
      });
    }
    return data;
  }, []);

  // Identify Top 3 Spikes
  const top3Followers = useMemo(() => 
    [...chartData].sort((a, b) => b.followers - a.followers).slice(0, 3).map(d => d.date), 
  [chartData]);

  const top3Reach = useMemo(() => 
    [...chartData].sort((a, b) => b.reach - a.reach).slice(0, 3).map(d => d.date), 
  [chartData]);

  // Custom Dot & Label for Charts
  const CustomizedDot = (props) => {
    const { cx, cy, payload, stroke, topList } = props;
    if (topList.includes(payload.date)) {
      return (
        <svg x={cx - 3} y={cy - 3} width={6} height={6} fill="white" viewBox="0 0 6 6">
          <circle cx="3" cy="3" r="3" stroke={stroke} strokeWidth="1.5" fill={isDark ? '#1e293b' : 'white'} />
        </svg>
      );
    }
    return null;
  };

  const CustomizedLabel = (props) => {
    const { x, y, value, index, data, topList, color, dy } = props;
    const item = data[index];
    if (topList.includes(item.date)) {
        const formattedValue = value >= 1000000 
            ? (value / 1000000).toFixed(1) + 'M' 
            : (value / 1000).toFixed(1) + 'k';
        return (
            <g>
                <text x={x} y={y} dy={dy || -12} fill={color} fontSize={8} textAnchor="middle" fontWeight="bold" style={{ fontFamily: config.font.name }}>{item.formattedDate}</text>
                <text x={x} y={y} dy={(dy || -12) + 8} fill={color} fontSize={8} textAnchor="middle" style={{ fontFamily: config.font.name }}>{formattedValue}</text>
            </g>
        );
    }
    return null;
  };

  // --- MATRIX DATA ---
  const summaryData = {
    previous: { label: "Previous", profileReach: 50937555, profileVisit: 480363, growth: 28084, reach: 14109803, engagement: 118003, likes: 82416, comments: 10835, shares: 22267, saves: 2485, erReach: 2.07, erFollowers: 0.08 },
    current: { label: "Current", profileReach: 39011421, profileVisit: 287334, growth: 82207, reach: 9934685, engagement: 71666, likes: 51579, comments: 5502, shares: 12909, saves: 1676, erReach: 2.32, erFollowers: 0.03 }
  };

  const columns = [
    { key: 'profileReach', label: 'Profile Reach' }, { key: 'profileVisit', label: 'Profile Visit' }, { key: 'growth', label: 'Growth' },
    { key: 'reach', label: 'Reach' }, { key: 'engagement', label: 'Engagement' }, { key: 'likes', label: 'Likes' },
    { key: 'comments', label: 'Comments' }, { key: 'shares', label: 'Shares' }, { key: 'saves', label: 'Saves' },
    { key: 'erReach', label: 'ER Reach (%)', isPercent: true }, { key: 'erFollowers', label: 'ER Follow (%)', isPercent: true },
  ];

  const calculateGap = (curr, prev) => ((curr - prev) / prev * 100).toFixed(2) + '%';
  const formatNumber = (num, isPct) => isPct ? num.toFixed(2) : num.toLocaleString('en-US');
  const formatCompact = (num) => Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(num);

  // --- NEW KEY TAKEAWAYS STATE ---
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isParagraphMode, setIsParagraphMode] = useState(false);
  
  // Initial Key Takeaways Data
  const [takeaways, setTakeaways] = useState([
    "Profile Reach dropped by *23.41%*, but Growth skyrocketed *+192%* indicating viral content outside follower base.",
    "Engagement Rate (Reach) improved to *2.32%*, showing higher quality interactions per view.",
    "Shares remain high at *12.9k*, suggesting content resonance is still strong despite lower reach."
  ]);

  const handleAiRefine = async (e) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    
    setIsTyping(true);
    
    // Construct Prompt with REAL (mock) DATA
    const contextData = JSON.stringify(summaryData);
    const topReachDates = JSON.stringify(top3Reach);
    const fullPrompt = `
      Context Data (Social Media Performance):
      ${contextData}
      
      Top Reach Dates: ${topReachDates}

      User Request: ${aiPrompt}

      Task: Provide a refined, professional set of 3 key takeaways (bullet points) based on the data above. Focus on growth, reach, and engagement changes. Use *bold* for key numbers.
    `;

    try {
        const result = await generateGeminiContent(fullPrompt);
        // Basic parsing to split by bullet points if possible, else just show paragraph
        const lines = result.split('\n').filter(line => line.trim().startsWith('-') || line.trim().startsWith('*'));
        
        if (lines.length > 0) {
            setIsParagraphMode(false);
            setTakeaways(lines.map(l => l.replace(/^[-*]\s*/, '')));
        } else {
            setIsParagraphMode(true);
            setTakeaways([result]);
        }
        setAiPrompt("");
    } catch (error) {
        console.error("AI Error", error);
    } finally {
        setIsTyping(false);
    }
  };

  const MetricCard = ({ label, value, trend, trendValue }) => (
    <div className="flex flex-col justify-center">
        <span className={`text-[10px] font-bold uppercase tracking-wider ${styles.textMuted}`} style={{ fontFamily: config.font.name }}>{label}</span>
        <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-xl font-bold leading-none ${styles.textMain}`} style={{ fontFamily: config.font.name }}>{value}</span>
            <div className={`flex items-center text-[10px] font-bold ${trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
                {trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                <span>{trendValue}</span>
            </div>
        </div>
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col overflow-hidden transition-colors duration-300" style={{ fontFamily: config.font.name, backgroundColor: styles.bg }}>
        
       {/* Header Dashboard */}
       <header className={`px-6 py-3 border-b flex justify-between items-center h-[12%] shrink-0 ${styles.border}`} style={{ backgroundColor: styles.bg }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${colorPrimary}20` }}>
                <Activity size={20} style={{ color: colorPrimary }} />
            </div>
            <div>
                <h1 className={`text-xl font-bold tracking-tight leading-none ${styles.textMain}`}>Instagram Performance</h1>
                <p className={`text-[10px] font-medium flex items-center gap-1 mt-1 uppercase tracking-wide ${styles.textMuted}`}>
                    <Calendar size={10} /> {config.period} Report
                </p>
            </div>
          </div>
          <div className="flex gap-8">
            <MetricCard label="Profile Reach" value={formatCompact(summaryData.current.profileReach)} trend="down" trendValue="23%" />
            <MetricCard label="Total Growth" value={formatCompact(summaryData.current.growth)} trend="up" trendValue="192%" />
            <MetricCard label="ER Reach" value={summaryData.current.erReach + "%"} trend="up" trendValue="11%" />
          </div>
       </header>

       {/* Body */}
       <div className="flex-1 flex flex-col p-4 gap-3 overflow-hidden min-h-0">
          
          {/* Top Section: Chart & Key Takeaways */}
          <div className="flex gap-3 h-[55%] min-h-0 w-full">
              
              {/* Chart (65% Width) */}
              <div className={`flex-[1.85] rounded-xl border p-3 shadow-sm flex flex-col min-w-0 ${styles.border}`} style={{ backgroundColor: styles.cardBg }}>
                 <div className="flex justify-between items-center mb-1">
                    <h3 className={`text-xs font-bold flex items-center gap-2 ${styles.textMain}`}>Daily Trends (Reach vs Growth)</h3>
                    <div className={`flex gap-3 text-[10px] font-medium ${styles.textMuted}`}>
                         <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{backgroundColor: colorSecondary}}></div> Growth</span>
                         <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{backgroundColor: colorPrimary}}></div> Reach</span>
                    </div>
                 </div>
                 <div className="flex-1 min-h-0 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                       <LineChart data={chartData} margin={{ top: 20, right: 10, left: -15, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={styles.gridColor} vertical={false} />
                          <XAxis dataKey="date" tick={{fontSize: 9, fill: styles.axisColor}} axisLine={{ stroke: styles.gridColor }} tickLine={false} interval={6} dy={5} />
                          <YAxis yAxisId="left" tick={{fontSize: 9, fill: styles.axisColor}} axisLine={false} tickLine={false} tickFormatter={(val) => `${(val/1000).toFixed(0)}k`} />
                          <YAxis yAxisId="right" orientation="right" tick={{fontSize: 9, fill: styles.axisColor}} axisLine={false} tickLine={false} tickFormatter={(val) => `${(val/1000000).toFixed(1)}M`} />
                          {!isThumbnail && <Tooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderRadius: '6px', border: `1px solid ${styles.border}`, fontSize: '10px', padding: '4px', color: isDark ? '#fff' : '#000' }} />}
                          
                          <Line yAxisId="right" type="monotone" dataKey="followers" stroke={colorSecondary} strokeWidth={2} dot={<CustomizedDot topList={top3Followers} stroke={colorSecondary} />} activeDot={{ r: 4 }}>
                             <LabelList content={<CustomizedLabel data={chartData} topList={top3Followers} color={colorSecondary} dy={-12} />} />
                          </Line>
                          <Line yAxisId="left" type="monotone" dataKey="reach" stroke={colorPrimary} strokeWidth={2} dot={<CustomizedDot topList={top3Reach} stroke={colorPrimary} />} activeDot={{ r: 4 }}>
                             <LabelList content={<CustomizedLabel data={chartData} topList={top3Reach} color={colorPrimary} dy={12} />} />
                          </Line>
                       </LineChart>
                    </ResponsiveContainer>
                 </div>
              </div>

              {/* KEY TAKEAWAYS (35% Width) */}
              <div className={`flex-1 rounded-md border p-3 shadow-sm flex flex-col overflow-hidden relative ${styles.border}`} style={{ backgroundColor: styles.cardBg }}>
                 {/* Header */}
                 <div className={`flex items-center justify-between mb-2 border-b pb-2 shrink-0 ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
                     <div className="flex items-center gap-2">
                         <Key size={16} className={styles.textMuted} />
                         <h3 className={`text-[12px] font-bold uppercase tracking-wide ${styles.textMain}`}>Key Takeaways</h3>
                     </div>
                     
                     {!isThumbnail && (
                         <div className="flex items-center gap-1">
                             <button onClick={() => setIsParagraphMode(!isParagraphMode)} className={`p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 ${styles.textMuted}`} title="Toggle View">
                                 {isParagraphMode ? <List size={12}/> : <AlignLeft size={12}/>}
                             </button>
                             
                             <button 
                                 onClick={() => setIsAiOpen(!isAiOpen)}
                                 className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-all border ${isAiOpen ? styles.aiButtonActive : styles.aiButtonInactive}`}
                             >
                                 <Sparkles size={10} className={isAiOpen ? "" : ""} />
                                 <span>{isAiOpen ? 'Close AI' : 'Refine'}</span>
                             </button>
                         </div>
                     )}
                 </div>
                 
                 {/* AI Input Form */}
                 {isAiOpen && !isThumbnail && (
                     <div className={`mb-2 p-2 rounded border animate-in fade-in slide-in-from-top-1 duration-200 ${isDark ? 'bg-indigo-900/20 border-indigo-500/30' : 'bg-indigo-50/50 border-indigo-100'}`}>
                         <form onSubmit={handleAiRefine} className="flex gap-2">
                             <input 
                                 type="text" 
                                 value={aiPrompt}
                                 onChange={(e) => setAiPrompt(e.target.value)}
                                 placeholder="Try: 'Focus on growth'..." 
                                 className={`flex-1 text-[10px] px-2 py-1 rounded border focus:outline-none focus:border-indigo-400 placeholder:opacity-50 ${styles.aiInputBg}`}
                                 autoFocus
                             />
                             <button type="submit" disabled={!aiPrompt.trim() || isTyping} className="bg-indigo-600 text-white px-2 rounded hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center">
                                 {isTyping ? <Loader2 size={10} className="animate-spin"/> : <Send size={10} />}
                             </button>
                         </form>
                     </div>
                 )}

                 {/* Content Area */}
                 <div className="flex-1 flex flex-col justify-center overflow-hidden">
                     {isTyping ? (
                         <div className="flex flex-col items-center justify-center h-full gap-2 opacity-70">
                             <Sparkles size={20} className="text-indigo-500 animate-spin" />
                             <span className="text-[10px] text-indigo-500 font-medium animate-pulse">Analyzing Data...</span>
                         </div>
                     ) : (
                         <>
                         {isParagraphMode ? (
                             <div className={`text-[10px] leading-relaxed font-medium animate-in fade-in duration-500 text-justify ${styles.textMuted}`}>
                                 {renderTextWithHighlights(takeaways[0], isDark, colorPrimary)}
                             </div>
                         ) : (
                             <ul className={`space-y-2 text-[10px] leading-tight font-medium ${styles.textMuted}`}>
                                 {takeaways.map((item, idx) => (
                                 <li key={idx} className="flex gap-2 items-start animate-in fade-in duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                                     <span className="text-[10px] mt-[2px]" style={{ color: config.theme.colors[4] }}>•</span>
                                     <span>{renderTextWithHighlights(item, isDark, colorPrimary)}</span>
                                 </li>
                                 ))}
                             </ul>
                         )}
                         </>
                     )}
                 </div>
              </div>

          </div>

          {/* Bottom: Table */}
          <div className={`h-[45%] rounded-xl border shadow-sm flex flex-col min-h-0 overflow-hidden ${styles.border}`} style={{ backgroundColor: styles.cardBg }}>
             <div className={`flex-1 overflow-hidden flex flex-col`}>
                <table className="w-full text-right border-collapse h-full table-fixed">
                   <thead className={`sticky top-0 z-10`} style={{ backgroundColor: styles.tableHeaderBg }}>
                      <tr>
                          <th className={`px-1 py-2 text-left text-[9px] font-bold uppercase tracking-wider border-b border-r w-16 ${styles.border} ${styles.textMuted}`}>Month</th>
                          {columns.map(col => (
                             <th key={col.key} className={`px-1 py-2 text-[8px] font-bold uppercase tracking-tighter border-b border-r last:border-r-0 leading-tight break-words w-[7%] ${styles.border} ${styles.textMuted}`}>{col.label}</th>
                          ))}
                      </tr>
                   </thead>
                   <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-slate-50'}`}>
                      {/* Rows... (Same as before) */}
                      <tr className={`transition-colors ${styles.tableRowHover}`}>
                          <td className={`px-1 py-1.5 text-left text-[9px] font-bold border-r ${styles.border} ${styles.textMuted}`}>{summaryData.previous.label}</td>
                          {columns.map(col => <td key={`prev-${col.key}`} className={`px-1 py-1.5 text-[9px] border-r font-mono truncate ${styles.border} ${styles.textMuted}`}>{formatNumber(summaryData.previous[col.key], col.isPercent)}</td>)}
                      </tr>
                      <tr className={`transition-colors ${styles.tableRowHover}`}>
                          <td className={`px-1 py-1.5 text-left text-[9px] font-bold border-r ${styles.border} ${styles.textMain}`}>{summaryData.current.label}</td>
                          {columns.map(col => <td key={`curr-${col.key}`} className={`px-1 py-1.5 text-[9px] font-bold border-r font-mono truncate ${styles.border} ${styles.textMain}`}>{formatNumber(summaryData.current[col.key], col.isPercent)}</td>)}
                      </tr>
                      <tr className={`transition-colors border-t ${styles.border}`} style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f0f9ff' }}>
                          <td className="px-1 py-1.5 text-left text-[9px] font-bold border-r" style={{ color: colorPrimary, borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0' }}>Gap</td>
                          {columns.map(col => {
                              const rawGap = calculateGap(summaryData.current[col.key], summaryData.previous[col.key]);
                              const isPositive = !rawGap.startsWith('-');
                              return <td key={`gap-${col.key}`} className={`px-1 py-1.5 text-[9px] font-bold border-r font-mono truncate ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`} style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0' }}>{rawGap}</td>
                          })}
                      </tr>
                   </tbody>
                </table>
             </div>
          </div>
       </div>
    </div>
  );
};

// --- 3. MAIN APP SHELL ---
const ReportSetupInterface = () => {
  const [currentStep, setCurrentStep] = useState('setup');
  const [editingTitleId, setEditingTitleId] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [showExportToast, setShowExportToast] = useState(false);
  
  // -- NEW STATE FOR DYNAMIC SLIDES --
  const [slides, setSlides] = useState([
    { id: 1, type: 'cover', title: 'Report Cover', content: {} },
    { id: 2, type: 'dashboard', title: 'Instagram Performance', content: {} }
  ]);
  const [activeSlideId, setActiveSlideId] = useState(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isCompetitorDropdownOpen, setIsCompetitorDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const downloadRef = useRef(null);
  
  const themePresets = [
    { id: "light_theme", name: "Fresh Light", type: "light", colors: ["#FFFFFF", "#334B48", "#5CE1D3", "#96B1AD", "#FFB4EA", "#CA7EB2"], brandColor: "#334B48", textColor: "text-slate-900" },
    { id: "dark_theme", name: "Forest Dark", type: "dark", colors: ["#334B48", "#5CE1D3", "#96B1AD", "#FFB4EA", "#CA7EB2"], brandColor: "#5CE1D3", textColor: "text-white" }
  ];

  const fontOptions = [{ id: "Sora", name: "Sora" }, { id: "Inter", name: "Inter" }, { id: "Nunito", name: "Nunito" }];

  const CLIENT_DATA = {
    "BYD": ["Wuling", "Chery", "Neta", "GAC Aion", "VinFast"],
    "Dior": ["Chanel", "Gucci", "Louis Vuitton", "Prada", "Hermes"],
    "Apple": ["Samsung", "Google", "Xiaomi", "Oppo", "Vivo"],
    "Nestle": ["Danone", "FrieslandCampina", "Arla", "Fonterra", "Mead Johnson"]
  };

  const [config, setConfig] = useState({
    reportTitle: "Social Media Report",
    reportDetails: "Monthly Performance & Strategy",
    preparedBy: "Sekata Data Team",
    reportType: "Monthly",
    period: "SEPTEMBER 2025",
    theme: themePresets[0],
    font: fontOptions[0], 
    clientName: "BYD",
    selectedCompetitors: []
  });
  const [previewMode, setPreviewMode] = useState("cover"); 
  
  const getPeriodOptions = (type) => {
    const year = new Date().getFullYear();
    if (type === "Monthly") return [`August ${year}`, `September ${year}`, `July ${year}`, `June ${year}`, `May ${year}`, `April ${year}`];
    return [`Q3 ${year}`, `Q2 ${year}`, `Q1 ${year}`, `Q4 ${year-1}`];
  };

  useEffect(() => {
     const opts = getPeriodOptions(config.reportType);
     if(!opts.includes(config.period)) setConfig(prev => ({ ...prev, period: opts[0] }));
  }, [config.reportType]);

  // Click outside listener for dropdowns
  useEffect(() => {
      const handleClickOutside = (event) => {
          if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
              setIsCompetitorDropdownOpen(false);
          }
          if (downloadRef.current && !downloadRef.current.contains(event.target)) {
            setIsDownloadOpen(false);
          }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
          document.removeEventListener("mousedown", handleClickOutside);
      };
  }, []);

  const goNext = () => { setCurrentStep('review'); window.scrollTo(0,0); };
  const goBack = () => setCurrentStep('setup');
  const goBackToReview = () => setCurrentStep('review');
  
  // -- ACTION HANDLERS --
  const handleSaveReport = () => {
      setShowSaveToast(true);
      setTimeout(() => {
          setShowSaveToast(false);
          setCurrentStep('setup');
      }, 1500);
  };

  const handleDownload = (format) => {
      setIsDownloadOpen(false);
      setIsExporting(true);
      // Simulate generation delay to allow "last state animation" to settle
      setTimeout(() => {
          setIsExporting(false);
          setShowExportToast(true);
          setTimeout(() => setShowExportToast(false), 3000);
      }, 2500);
  };

  // -- UPDATED NAVIGATION --
  const goToSlide = (id) => { 
      setActiveSlideId(id);
      const slide = slides.find(s => s.id === id);
      if(slide && slide.type === 'cover') {
        setCurrentStep('edit_cover');
      } else {
        setCurrentStep('edit_generic'); // Generic full-screen editor
      }
      window.scrollTo(0,0); 
  };

  // -- RENAME LOGIC --
  const handleRename = (id, newTitle) => {
    if (!newTitle.trim()) {
        setEditingTitleId(null);
        return;
    }
    setSlides(slides.map(s => s.id === id ? { ...s, title: newTitle } : s));
    setEditingTitleId(null);
  };

  // -- SLIDE CONTENT MANAGEMENT --
  const handleSlideTitleChange = (id, newTitle) => {
      setSlides(slides.map(s => s.id === id ? { ...s, title: newTitle } : s));
  };

  const handleSlideContentChange = (slideId, key, value) => {
      setSlides(prev => prev.map(slide => 
          slide.id === slideId 
              ? { ...slide, content: { ...slide.content, [key]: value } }
              : slide
      ));
  };


  // -- NEW ADD PAGE LOGIC --
  const addNewPage = () => {
     const newId = slides.length + 1;
     const newSlide = { id: newId, type: 'placeholder', title: `New Slide ${newId}`, content: {} };
     setSlides([...slides, newSlide]);
     goToSlide(newId);
  };

  // -- TEMPLATE SELECTION LOGIC --
  const handleTemplateSelect = (templateType) => {
     const templateMap = {
         'layout_dashboard': 'Standard Dashboard',
         'layout_comparison': 'Comparison Analysis',
         'layout_kpi': 'KPI Performance',
         'layout_content': 'Creative Analysis'
     };
     
     // Update slide type and set default title if it's currently a generic "New Slide X"
     setSlides(slides.map(s => {
         if (s.id === activeSlideId) {
             const isGenericTitle = s.title.startsWith('New Slide');
             return { 
                 ...s, 
                 type: templateType,
                 title: isGenericTitle ? templateMap[templateType] : s.title,
                 content: {} // Reset content on template change
             };
         }
         return s;
     }));
     setIsTemplateModalOpen(false);
  };

  // -- CLIENT CHANGE LOGIC --
  const handleClientChange = (e) => {
      const newClient = e.target.value;
      setConfig(prev => ({
          ...prev,
          clientName: newClient,
          selectedCompetitors: [] // Reset competitors when client changes
      }));
  };

  const toggleCompetitor = (comp) => {
      setConfig(prev => {
          const exists = prev.selectedCompetitors.includes(comp);
          return {
              ...prev,
              selectedCompetitors: exists 
                 ? prev.selectedCompetitors.filter(c => c !== comp)
                 : [...prev.selectedCompetitors, comp]
          };
      });
  };

  // Helper to render the correct component based on active slide
  const renderActiveSlide = () => {
      const activeSlide = slides.find(s => s.id === activeSlideId);
      if(!activeSlide) return null;
      
      const commonProps = {
          config,
          title: activeSlide.title,
          onTitleChange: (newTitle) => handleSlideTitleChange(activeSlide.id, newTitle),
          data: activeSlide.content || {},
          onUpdate: (key, val) => handleSlideContentChange(activeSlide.id, key, val)
      };

      switch(activeSlide.type) {
          case 'cover': return <ReportCoverVisual {...commonProps} mode="full" />;
          case 'dashboard': return <InstagramDashboardSlide {...commonProps} />;
          case 'placeholder': return <PlaceholderSlide onOpenSelector={() => setIsTemplateModalOpen(true)} />;
          case 'layout_dashboard': return <LayoutDashboardEmpty {...commonProps} />;
          case 'layout_comparison': return <LayoutComparison {...commonProps} />;
          case 'layout_kpi': return <LayoutKPI {...commonProps} />;
          case 'layout_content': return <LayoutContent {...commonProps} />;
          default: return <PlaceholderSlide onOpenSelector={() => setIsTemplateModalOpen(true)} />;
      }
  };

  const templates = [
      { id: 'layout_dashboard', name: 'Standard Dashboard', icon: Grid, desc: 'Chart, Key Insights & Data Table' },
      { id: 'layout_comparison', name: 'Comparison View', icon: Columns, desc: 'Side-by-side Metric Analysis' },
      { id: 'layout_kpi', name: 'KPI Overview', icon: Activity, desc: 'Top Metrics with Deep Dive Area' },
      { id: 'layout_content', name: 'Visual Analysis', icon: ImageIcon, desc: 'Media / Screenshot & Analysis' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20 relative">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm h-16">
        <div className="max-w-7xl mx-auto px-6 h-full flex justify-between items-center">
          <div className="flex items-center gap-2"><div className="bg-slate-900 text-white p-1.5 rounded-lg"><MonitorPlay size={20} /></div><h1 className="text-xl font-bold text-slate-900 tracking-tight">AutoReport <span className="text-slate-400 font-normal">Generator</span></h1></div>
          <div className="flex items-center gap-3">
             {currentStep === 'setup' && <span className="px-3 py-1 rounded bg-blue-50 text-blue-700 text-xs font-bold">Step 1: Setup</span>}
             {currentStep === 'review' && <span className="px-3 py-1 rounded bg-blue-50 text-blue-700 text-xs font-bold">Step 2: Review</span>}
             {currentStep.startsWith('edit') && <span className="px-3 py-1 rounded bg-blue-50 text-blue-700 text-xs font-bold">Step 3: Editing</span>}
          </div>
        </div>
      </header>
      
      {/* GLOBAL TOASTS */}
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
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-6 py-4 rounded-lg shadow-xl flex items-center gap-4 animate-in slide-in-from-bottom fade-in duration-300">
              <Loader2 size={24} className="animate-spin text-blue-400" />
              <div>
                  <h4 className="font-bold text-sm">Generating File...</h4>
                  <p className="text-xs text-slate-400">Capturing slides & compiling assets</p>
              </div>
          </div>
      )}
      {showExportToast && (
          <div className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white px-6 py-4 rounded-lg shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom fade-in duration-300">
              <Download size={24} />
              <div>
                  <h4 className="font-bold text-sm">Download Complete</h4>
                  <p className="text-xs opacity-90">Your file has been generated successfully.</p>
              </div>
          </div>
      )}

      {/* TEMPLATE SELECTION MODAL */}
      {isTemplateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
             <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl border border-slate-200">
                 <div className="flex justify-between items-center mb-6">
                     <div>
                        <h3 className="text-xl font-bold text-slate-900">Choose Layout</h3>
                        <p className="text-sm text-slate-500">Select a starting point for your analysis.</p>
                     </div>
                     <button onClick={() => setIsTemplateModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><Minus size={20}/></button>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                     {templates.map(tmpl => (
                         <button 
                            key={tmpl.id} 
                            onClick={() => handleTemplateSelect(tmpl.id)}
                            className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 hover:shadow-md transition-all text-left group"
                         >
                            <div className="p-3 bg-blue-100 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <tmpl.icon size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 group-hover:text-blue-700">{tmpl.name}</h4>
                                <p className="text-xs text-slate-500 mt-1">{tmpl.desc}</p>
                            </div>
                         </button>
                     ))}
                 </div>
             </div>
          </div>
      )}

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* SETUP */}
        {currentStep === 'setup' && (
          <div className="grid grid-cols-12 gap-8 h-[calc(100vh-8rem)] animate-fade-in-up">
            <div className="col-span-12 lg:col-span-4 space-y-6 h-full overflow-y-auto pr-2">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200"><h2 className="font-semibold text-slate-700 flex items-center gap-2"><Settings size={16} /> Setup Report</h2></div>
                <div className="p-6 space-y-6">
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-400 mb-2 block flex items-center gap-2"><Palette size={12}/> Select Theme</label>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        {themePresets.map((preset) => (
                            <button key={preset.id} onClick={() => setConfig({...config, theme: preset})} className={`p-2 rounded-lg border text-left transition-all ${config.theme.id === preset.id ? 'border-slate-800 ring-1 ring-slate-800 bg-slate-50 shadow-sm' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                                <div className="flex justify-between items-center mb-2"><span className="text-xs font-bold">{preset.name}</span></div>
                                <div className={`flex h-3 w-full rounded-sm overflow-hidden ring-1 ring-black/5 ${preset.type === 'light' ? 'border border-slate-200' : ''}`}>
                                    <div className="h-full flex-1" style={{backgroundColor: preset.colors[0]}}></div>
                                    <div className="h-full flex-1" style={{backgroundColor: preset.colors[1]}}></div>
                                    <div className="h-full flex-1" style={{backgroundColor: preset.colors[2]}}></div>
                                </div>
                            </button>
                        ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-400 mb-2 block">Typography</label>
                    <div className="grid grid-cols-1 gap-2">
                      {fontOptions.map((font) => (
                        <button key={font.id} onClick={() => setConfig({...config, font: font})} className={`flex items-center justify-between p-3 rounded-lg border transition-all ${config.font.id === font.id ? 'border-slate-800 bg-slate-50 ring-1 ring-slate-800' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                          <div className="flex items-center gap-3"><div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center text-lg text-slate-700" style={{ fontFamily: font.name }}>Ag</div><div className="text-left"><div className="text-sm font-semibold text-slate-900">{font.name}</div></div></div>
                          {config.font.id === font.id && <CheckCircle2 size={16} className="text-slate-800" />}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase text-slate-400 mb-2 block">Parameters</label>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-[10px] font-semibold text-slate-500 mb-1">Type</label><select value={config.reportType} onChange={(e) => setConfig({...config, reportType: e.target.value})} className="w-full border p-2 rounded text-sm bg-white"><option value="Monthly">Monthly</option><option value="Quarterly">Quarterly</option></select></div>
                        <div><label className="block text-[10px] font-semibold text-slate-500 mb-1">Period</label><select value={config.period} onChange={(e) => setConfig({...config, period: e.target.value})} className="w-full border p-2 rounded text-sm bg-white">{getPeriodOptions(config.reportType).map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></div>
                    </div>
                    {/* Client Selector */}
                    <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">Client Name</label>
                        <select 
                            value={config.clientName} 
                            onChange={handleClientChange}
                            className="w-full border p-2 rounded text-sm bg-white cursor-pointer hover:border-blue-400 focus:border-blue-500 focus:outline-none transition-colors"
                        >
                            {Object.keys(CLIENT_DATA).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    {/* Competitors Multi-Select Dropdown */}
                    <div className="mt-2" ref={dropdownRef}>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-2">Competitors (Multi-select)</label>
                        <div className="relative">
                            <button 
                                onClick={() => setIsCompetitorDropdownOpen(!isCompetitorDropdownOpen)}
                                className="w-full border p-2 rounded text-sm bg-white flex justify-between items-center text-left min-h-[38px] hover:border-blue-400 transition-colors"
                            >
                                <span className={`truncate block ${config.selectedCompetitors.length === 0 ? 'text-slate-400' : 'text-slate-800'}`}>
                                    {config.selectedCompetitors.length > 0 
                                        ? config.selectedCompetitors.join(', ') 
                                        : "Select Competitors..."}
                                </span>
                                <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${isCompetitorDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>
                            
                            {isCompetitorDropdownOpen && (
                                <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-200">
                                    <div className="p-1">
                                        {CLIENT_DATA[config.clientName].map(comp => (
                                            <label key={comp} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer transition-colors group">
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${config.selectedCompetitors.includes(comp) ? 'bg-blue-500 border-blue-500' : 'border-slate-300 group-hover:border-blue-400'}`}>
                                                    {config.selectedCompetitors.includes(comp) && <CheckCircle2 size={10} className="text-white" />}
                                                </div>
                                                <input 
                                                    type="checkbox" 
                                                    checked={config.selectedCompetitors.includes(comp)}
                                                    onChange={() => toggleCompetitor(comp)}
                                                    className="hidden"
                                                />
                                                <span className={`text-xs font-medium ${config.selectedCompetitors.includes(comp) ? 'text-blue-700' : 'text-slate-700'}`}>{comp}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-4">
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">Report Title</label>
                        <input type="text" value={config.reportTitle} onChange={e => setConfig({...config, reportTitle: e.target.value})} className="w-full border p-2 rounded text-sm" placeholder="Report Title" />
                    </div>
                    
                    <div className="mt-2">
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">Report Subtitle</label>
                        <input type="text" value={config.reportDetails} onChange={e => setConfig({...config, reportDetails: e.target.value})} className="w-full border p-2 rounded text-sm" placeholder="Subtitle" />
                    </div>

                    <div className="mt-2">
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">Prepared By</label>
                        <input type="text" value={config.preparedBy} onChange={e => setConfig({...config, preparedBy: e.target.value})} className="w-full border p-2 rounded text-sm" placeholder="Prepared By" />
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 border-t border-slate-200"><button onClick={goNext} className="w-full py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition flex items-center justify-center gap-2 text-sm">Next: Review Content <ChevronRight size={16} /></button></div>
              </div>
            </div>
            <div className="col-span-12 lg:col-span-8 flex flex-col h-full">
               <div className="flex items-center justify-between mb-4 px-1">
                  <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2"><Layout size={20} className="text-slate-500" /> Live Preview</h2>
                  <div className="flex bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
                    <button onClick={() => setPreviewMode('cover')} className={`px-3 py-1 text-xs font-medium rounded ${previewMode === 'cover' ? 'bg-slate-100 text-slate-900' : 'text-slate-500'}`}>Cover</button>
                    <button onClick={() => setPreviewMode('content')} className={`px-3 py-1 text-xs font-medium rounded ${previewMode === 'content' ? 'bg-slate-100 text-slate-900' : 'text-slate-500'}`}>Content</button>
                  </div>
               </div>
               <div className="flex-grow flex items-center justify-center bg-slate-200/50 rounded-xl border border-slate-300 p-4 lg:p-12 overflow-hidden shadow-inner relative">
                  <div className="w-full max-w-4xl aspect-video shadow-2xl rounded-lg overflow-hidden relative flex flex-col bg-white">
                     {previewMode === 'cover' ? <ReportCoverVisual config={config} mode="preview" /> : (
                        <div className="w-full h-full"><InstagramDashboardSlide config={config} /></div>
                     )}
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* REVIEW LIST - DYNAMIC MAPPING */}
        {currentStep === 'review' && (
          <div className="animate-fade-in-up">
              <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <button onClick={goBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors">
                      <ArrowLeft size={16} /> Back to Configuration
                  </button>
                  
                  {/* NEW: ACTION BUTTONS (Save & Download) */}
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
                             className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white font-bold text-sm rounded-lg hover:bg-slate-800 transition-all shadow-md active:scale-95"
                          >
                             <Download size={16} />
                             Download Report
                             <ChevronDown size={14} className={`opacity-70 transition-transform ${isDownloadOpen ? 'rotate-180' : ''}`} />
                          </button>
                          
                          {/* DOWNLOAD DROPDOWN */}
                          {isDownloadOpen && (
                              <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                                  <button onClick={() => handleDownload('pdf')} className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 transition-colors">
                                      <div className="bg-red-50 text-red-500 p-1.5 rounded-lg"><FileText size={16} /></div>
                                      <div><span className="text-xs font-bold text-slate-800 block">Export as PDF</span><span className="text-[10px] text-slate-400">Best for sharing</span></div>
                                  </button>
                                  <button onClick={() => handleDownload('pptx')} className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 transition-colors border-t border-slate-50">
                                      <div className="bg-orange-50 text-orange-500 p-1.5 rounded-lg"><Presentation size={16} /></div>
                                      <div><span className="text-xs font-bold text-slate-800 block">Export as PPTX</span><span className="text-[10px] text-slate-400">Editable slides</span></div>
                                  </button>
                              </div>
                          )}
                      </div>
                  </div>
              </div>

              <div className="space-y-6">
                 <div className="flex justify-between items-end">
                    <div><h2 className="text-2xl font-bold text-slate-800">Review Slides</h2><p className="text-slate-500">Click a slide to edit.</p></div>
                    <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-500">{slides.length} Slides Generated</span>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {slides.map(slide => (
                       <div key={slide.id} onClick={() => goToSlide(slide.id)} className="group cursor-pointer bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-blue-400 transition-all hover:-translate-y-1">
                          <div className="aspect-video relative flex items-center justify-center border-b border-slate-100 overflow-hidden bg-slate-50">
                             {/* Thumbnail Logic */}
                             {slide.type === 'cover' && (
                                <div className="w-full h-full flex items-center justify-center"><ReportCoverVisual config={config} mode="thumbnail" /></div>
                             )}
                             {slide.type === 'dashboard' && (
                                <div className="w-full h-full scale-50 origin-center p-4"><InstagramDashboardSlide config={config} isThumbnail={true} /></div>
                             )}
                             {slide.type === 'placeholder' && (
                                <div className="w-full h-full scale-50 origin-center p-8"><PlaceholderSlide /></div>
                             )}
                             {/* Generic Thumbnail for new layouts */}
                             {['layout_dashboard', 'layout_comparison', 'layout_kpi', 'layout_content'].includes(slide.type) && (
                                 <div className="w-full h-full bg-slate-50 flex items-center justify-center flex-col gap-2 p-4">
                                     <Layout size={24} className="text-slate-300"/>
                                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{slide.type.replace('layout_', '')}</span>
                                 </div>
                             )}
                             
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
                                      <h3 className="font-bold text-slate-800 truncate pr-2" title={slide.title}>{slide.title}</h3>
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
                   
                   {/* Add Page Button */}
                   <button className="aspect-video rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50 transition-all flex flex-col items-center justify-center gap-3 group" onClick={addNewPage}>
                      <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
                          <Plus size={24} />
                      </div>
                      <span className="text-sm font-semibold text-slate-500 group-hover:text-blue-600">Add New Page</span>
                   </button>
                 </div>
              </div>
          </div>
        )}

        {/* EDIT GENERIC SLIDE (Full Screen - Used for Dashboard & Placeholders) */}
        {currentStep === 'edit_generic' && (
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] animate-fade-in-up py-4">
              <div className="w-full max-w-6xl mb-2 flex justify-between items-end">
                  <h2 className="font-bold text-slate-700 flex items-center gap-2">
                      <Layout size={16} /> Editing: {slides.find(s => s.id === activeSlideId)?.title}
                  </h2>
                  <button onClick={goBackToReview} className="text-xs font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1">
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