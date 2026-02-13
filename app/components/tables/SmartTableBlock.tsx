import React, { useState, useEffect } from 'react';
import { Edit3, Table as TableIcon } from 'lucide-react';
import { SmartTableBlockProps, TableConfig } from '@/app/types';
import { TableSelectionModal } from '@/app/components/ui';
import { TABLE_TYPES } from '@/app/data/tableTypes';

export const SmartTableBlock: React.FC<SmartTableBlockProps> = ({
  config,
  savedState,
  onSave,
  className,
  isExport = false,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tableState, setTableState] = useState<TableConfig | null>(savedState || null);

  useEffect(() => {
    setTableState(savedState || null);
  }, [savedState]);

  // Use contentMode from coverDesign for theme
  const contentMode = config.coverDesign?.contentMode || 'light';
  const isDark = contentMode === 'dark';

  // Font sizes - much larger for export
  const fontSize = {
    header: isExport ? 'text-lg' : 'text-[10px]',
    headerSub: isExport ? 'text-base' : 'text-[9px]',
    cell: isExport ? 'text-lg' : 'text-[10px]',
  };

  const styles = {
    cardBg: isDark ? 'bg-slate-800' : 'bg-white',
    textMain: isDark ? 'text-white' : 'text-slate-900',
    textMuted: isDark ? 'text-slate-400' : 'text-slate-500',
    border: isDark ? 'border-slate-600' : 'border-slate-200',
    headerBg: isDark ? 'bg-slate-700/50' : 'bg-slate-50',
    rowHover: isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50',
    stickyBg: isDark ? 'bg-slate-800' : 'bg-white',
  };

  const handleConfigSave = (config: TableConfig) => {
    setTableState(config);
    if (onSave) onSave(config);
    setIsModalOpen(false);
  };

  const getRowData = (typeId: string, columns: string[]) => {
    const typeDef = TABLE_TYPES[typeId];
    let rows: any[] = [];

    const formatVal = (format: string, val: number): string => {
      if (format === 'percent') return val + '%';
      if (format === 'compact')
        return Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(
          val,
        );
      if (format === 'time') return val + 's';
      return val.toLocaleString();
    };

    const generateRowValues = (isGap = false): Record<string, any> => {
      let rowData: Record<string, any> = {};
      columns.forEach((colId) => {
        const colDef = typeDef.columns.find((c) => c.id === colId);
        if (!colDef) return;

        if (isGap) {
          const isPos = Math.random() > 0.4;
          rowData[colId] = {
            value: (Math.random() * 20 + 1).toFixed(1) + '%',
            isPositive: isPos,
          };
        } else {
          let rawVal = 0;
          if (colDef.format === 'percent') rawVal = parseFloat((Math.random() * 5).toFixed(2));
          else if (colDef.format === 'time') rawVal = Math.floor(Math.random() * 60 + 10);
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
        { id: 'gap', label: 'Gap (%)', isGap: true, ...generateRowValues(true) },
      ];
    } else if (typeDef.rowType === 'channels') {
      rows = [
        { id: 'ig', label: 'Instagram', ...generateRowValues() },
        { id: 'tiktok', label: 'TikTok', ...generateRowValues() },
        { id: 'fb', label: 'Facebook', ...generateRowValues() },
      ];
    } else if (typeDef.rowType === 'types') {
      rows = [
        { id: 'img', label: 'Image', ...generateRowValues() },
        { id: 'reel', label: 'Reels', ...generateRowValues() },
        { id: 'car', label: 'Carousel', ...generateRowValues() },
      ];
    } else if (typeDef.rowType === 'competitors') {
      rows = [
        { id: 'brand', label: 'Brand', ...generateRowValues() },
        { id: 'comp_a', label: 'Competitor A', ...generateRowValues() },
        { id: 'comp_b', label: 'Competitor B', ...generateRowValues() },
        { id: 'comp_c', label: 'Competitor C', ...generateRowValues() },
      ];
    } else if (typeDef.rowType === 'sentiments') {
      rows = [
        { id: 'positive', label: 'Positive', ...generateRowValues() },
        { id: 'neutral', label: 'Neutral', ...generateRowValues() },
        { id: 'negative', label: 'Negative', ...generateRowValues() },
      ];
    } else {
      rows = [
        { id: '1', label: 'Item 1', ...generateRowValues() },
        { id: '2', label: 'Item 2', ...generateRowValues() },
        { id: '3', label: 'Item 3', ...generateRowValues() },
      ];
    }
    return rows;
  };

  const renderTable = () => {
    if (!tableState) return null;
    const typeDef = TABLE_TYPES[tableState.type];
    const rows = getRowData(tableState.type, tableState.columns);
    const visibleCols = typeDef.columns.filter((c) => tableState.columns.includes(c.id));

    return (
      <div
        className={`w-full h-full flex flex-col rounded-xl border overflow-hidden ${styles.border} ${styles.cardBg}`}
      >
        <div
          className={`px-4 py-2 border-b flex justify-between items-center ${styles.border} ${styles.headerBg}`}
        >
          <div className="flex items-center gap-2">
            <typeDef.icon size={14} className={isDark ? 'text-blue-400' : 'text-blue-600'} />
            <span className={`text-xs font-bold uppercase tracking-wide ${styles.textMain}`}>
              {typeDef.label}
            </span>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 hover:text-blue-500 transition-colors"
          >
            <Edit3 size={12} />
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-right border-collapse">
            <thead className={`sticky top-0 z-10 ${styles.headerBg}`}>
              <tr>
                <th
                  className={`px-3 py-2 text-left ${fontSize.header} font-bold uppercase tracking-wider border-b w-24 sticky left-0 z-20 ${styles.border} ${styles.textMuted} ${styles.headerBg}`}
                >
                  {typeDef.rowType === 'comparison'
                    ? 'Period'
                    : typeDef.rowType === 'channels'
                      ? 'Channel'
                      : typeDef.rowType === 'competitors'
                        ? 'Brand'
                        : typeDef.rowType === 'sentiments'
                          ? 'Sentiment'
                          : 'Category'}
                </th>
                {visibleCols.map((col) => (
                  <th
                    key={col.id}
                    className={`px-2 py-2 ${fontSize.headerSub} font-bold uppercase tracking-wider border-b min-w-[60px] ${styles.border} ${styles.textMuted}`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-slate-100'}`}>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className={`transition-colors ${styles.rowHover} ${
                    row.isGap ? (isDark ? 'bg-white/5' : 'bg-slate-50/80') : ''
                  }`}
                >
                  <td
                    className={`px-3 py-2 text-left ${fontSize.cell} font-bold sticky left-0 z-10 ${
                      styles.textMain
                    } ${styles.stickyBg}`}
                  >
                    {row.label}
                  </td>
                  {visibleCols.map((col) => {
                    const cellData = row[col.id];
                    if (row.isGap) {
                      return (
                        <td
                          key={col.id}
                          className={`px-2 py-2 ${fontSize.cell} font-bold font-mono ${
                            cellData.isPositive ? 'text-emerald-500' : 'text-rose-500'
                          }`}
                        >
                          {cellData.isPositive ? '+' : ''}
                          {cellData.value}
                        </td>
                      );
                    }
                    return (
                      <td
                        key={col.id}
                        className={`px-2 py-2 ${fontSize.cell} font-mono ${styles.textMuted}`}
                      >
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
        {tableState ? (
          renderTable()
        ) : (
          <div onClick={() => setIsModalOpen(true)} className="w-full h-full cursor-pointer">
            <div className="w-full h-full border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center bg-slate-50/50 text-slate-400 transition-all hover:bg-blue-50/50 hover:border-blue-300 hover:text-blue-500 cursor-pointer group">
              <TableIcon
                size={24}
                className="mb-2 opacity-50 group-hover:scale-110 transition-transform"
              />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Configure Data Table
              </span>
            </div>
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
