import React, { useState } from 'react';
import { LayoutProps } from '@/app/types';
import { EditableSlideTitle, SlideFooter, ChannelBadge } from '@/app/components/ui';
import { SmartChartBlock } from '@/app/components/charts';
import { SmartTableBlock } from '@/app/components/tables';
import { SmartInsightBlock } from '@/app/components/insights';
import { Sparkles, BarChart3, Table as TableIcon, Edit3, X, Grid3X3, ArrowLeftRight } from 'lucide-react';

type CellType = 'chart' | 'table' | 'insight' | null;
type GridSize = '2x2' | '3x3';

const GRID_OPTIONS: { value: GridSize; label: string; cols: number; rows: number }[] = [
  { value: '2x2', label: '2 x 2', cols: 2, rows: 2 },
  { value: '3x3', label: '3 x 3', cols: 3, rows: 3 },
];

const getGridConfig = (size: GridSize) => {
  const option = GRID_OPTIONS.find((o) => o.value === size);
  return option || GRID_OPTIONS[0];
};

export const LayoutCustom: React.FC<LayoutProps> = ({
  config,
  title = 'Custom Template',
  onTitleChange = () => {},
  data = {},
  onUpdate = () => {},
  currentPage = 1,
  totalPages = 1,
  isExport = false,
}) => {
  const [isGridModalOpen, setIsGridModalOpen] = useState(false);

  const logoColors = config.coverDesign?.colors;
  const isDark = false;
  const styles = {
    bg: '#ffffff',
    cardBg: '#ffffff',
    border: 'border-slate-200',
    accent: logoColors?.primary || config.theme.brandColor,
  };

  const gridSize: GridSize = data.gridSize || '2x2';
  const { cols, rows } = getGridConfig(gridSize);
  const cellCount = cols * rows;

  const renderCell = (cellIndex: number) => {
    const cellKey = `cell_${cellIndex}`;
    const cellTypeKey = `cell_${cellIndex}_type`;
    const cellType: CellType = data[cellTypeKey] || null;

    if (cellType === 'chart') {
      return (
        <div className="w-full h-full relative">
          {!isExport && (
            <button
              onClick={() => {
                onUpdate(cellTypeKey, null);
                onUpdate(cellKey, null);
              }}
              className="absolute top-1 right-1 z-10 p-1 rounded-md bg-white border border-slate-200 text-slate-400 hover:text-blue-500 hover:border-blue-300 shadow-sm transition-colors"
              title="Switch visualization type"
            >
              <ArrowLeftRight size={12} />
            </button>
          )}
          <SmartChartBlock
            label="Select Chart"
            config={config}
            savedState={data[cellKey]}
            onSave={(val) => onUpdate(cellKey, val)}
            isExport={isExport}
            allowWordCloud
          />
        </div>
      );
    }

    if (cellType === 'table') {
      return (
        <div className="w-full h-full relative">
          {!isExport && (
            <button
              onClick={() => {
                onUpdate(cellTypeKey, null);
                onUpdate(cellKey, null);
              }}
              className="absolute top-1 right-1 z-10 p-1 rounded-md bg-white border border-slate-200 text-slate-400 hover:text-blue-500 hover:border-blue-300 shadow-sm transition-colors"
              title="Switch visualization type"
            >
              <ArrowLeftRight size={12} />
            </button>
          )}
          <SmartTableBlock
            config={config}
            savedState={data[cellKey]}
            onSave={(val) => onUpdate(cellKey, val)}
            isExport={isExport}
          />
        </div>
      );
    }

    if (cellType === 'insight') {
      return (
        <div className="w-full h-full relative">
          {!isExport && (
            <button
              onClick={() => {
                onUpdate(cellTypeKey, null);
                onUpdate(cellKey, null);
              }}
              className="absolute top-1 right-1 z-10 p-1 rounded-md bg-white border border-slate-200 text-slate-400 hover:text-blue-500 hover:border-blue-300 shadow-sm transition-colors"
              title="Switch visualization type"
            >
              <ArrowLeftRight size={12} />
            </button>
          )}
          <SmartInsightBlock
            icon={Sparkles}
            label="Text Insight"
            className="bg-blue-50/20 border-blue-200/50"
            config={config}
            savedState={data[cellKey]}
            onSave={(val) => onUpdate(cellKey, val)}
            contextData={data}
            contextType="custom_insight"
            isExport={isExport}
          />
        </div>
      );
    }

    // No type selected - show picker
    return (
      <div className="w-full h-full flex items-center justify-center gap-3">
        <button
          onClick={() => onUpdate(cellTypeKey, 'chart')}
          className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/50 text-slate-400 hover:text-blue-500 transition-all group"
        >
          <BarChart3 size={20} className="opacity-50 group-hover:opacity-80 group-hover:scale-110 transition-all" />
          <span className="text-[9px] font-bold uppercase tracking-wider">Chart</span>
        </button>
        <button
          onClick={() => onUpdate(cellTypeKey, 'table')}
          className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/50 text-slate-400 hover:text-blue-500 transition-all group"
        >
          <TableIcon size={20} className="opacity-50 group-hover:opacity-80 group-hover:scale-110 transition-all" />
          <span className="text-[9px] font-bold uppercase tracking-wider">Table</span>
        </button>
        <button
          onClick={() => onUpdate(cellTypeKey, 'insight')}
          className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/50 text-slate-400 hover:text-blue-500 transition-all group"
        >
          <Sparkles size={20} className="opacity-50 group-hover:opacity-80 group-hover:scale-110 transition-all" />
          <span className="text-[9px] font-bold uppercase tracking-wider">Insight</span>
        </button>
      </div>
    );
  };

  return (
    <div
      className="w-full h-full flex flex-col p-6 gap-4 pb-16 relative"
      style={{ fontFamily: config.font.name, backgroundColor: styles.bg }}
    >
      <div
        className={`h-[10%] shrink-0 border-b flex items-center justify-between pb-4 ${styles.border}`}
      >
        <EditableSlideTitle title={title} onChange={onTitleChange} isDark={isDark} />
        <div className="flex items-center gap-3">
          {data.channel && (
            <ChannelBadge channel={data.channel} isDark={isDark} size="lg" />
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 relative">
        {!isExport && (
          <button
            onClick={() => setIsGridModalOpen(true)}
            className="absolute -top-1 -right-1 z-10 p-1 rounded-md bg-white border border-slate-200 text-slate-400 hover:text-blue-500 hover:border-blue-300 shadow-sm transition-colors"
            title="Change grid size"
          >
            <Edit3 size={12} />
          </button>
        )}

        <div
          className="w-full h-full grid gap-3"
          style={{
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gridTemplateRows: `repeat(${rows}, 1fr)`,
          }}
        >
          {Array.from({ length: cellCount }, (_, i) => (
            <div
              key={i}
              className={`rounded-xl border p-2 shadow-sm overflow-hidden ${styles.border}`}
              style={{ backgroundColor: styles.cardBg }}
            >
              {renderCell(i + 1)}
            </div>
          ))}
        </div>
      </div>

      {/* Grid Size Modal */}
      {isGridModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 rounded-2xl shadow-2xl bg-white">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="font-bold text-lg text-slate-900">Grid Size</h3>
                <p className="text-xs text-slate-500">Select the grid layout for this slide</p>
              </div>
              <button onClick={() => setIsGridModalOpen(false)}>
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {GRID_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onUpdate('gridSize', option.value);
                    setIsGridModalOpen(false);
                  }}
                  className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all hover:scale-[1.02] ${
                    gridSize === option.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Grid3X3 size={24} className="opacity-70" />
                  <span className="text-lg font-bold">{option.label}</span>
                  <span className="text-[10px] text-slate-400">{option.cols * option.rows} blocks</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <SlideFooter
        clientName={config.clientName}
        period={config.period}
        currentPage={currentPage}
        totalPages={totalPages}
        logo={config.coverDesign?.logoData}
        brandColor={config.theme.brandColor}
        preparedBy={config.preparedBy}
      />
    </div>
  );
};
