import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { TableSelectionModalProps, TableType } from '@/app/types';
import { TABLE_TYPES } from '@/app/data/tableTypes';

export const TableSelectionModal: React.FC<TableSelectionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  config,
}) => {
  if (!isOpen) return null;
  const isDark = config.theme.type === 'dark';
  const [selectedType, setSelectedType] = useState('performance');
  const [selectedColumns, setSelectedColumns] = useState(
    TABLE_TYPES['performance'].columns.map((c) => c.id)
  );

  const handleTypeChange = (typeId: string) => {
    setSelectedType(typeId);
    setSelectedColumns(TABLE_TYPES[typeId].columns.map((c) => c.id));
  };

  const toggleColumn = (colId: string) => {
    setSelectedColumns((prev) =>
      prev.includes(colId) ? prev.filter((id) => id !== colId) : [...prev, colId]
    );
  };

  const handleConfirm = () => {
    onConfirm({
      type: selectedType,
      columns: selectedColumns,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-2xl h-[32rem] rounded-2xl shadow-2xl flex flex-col overflow-hidden ${
          isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white'
        }`}
      >
        <div
          className={`p-4 border-b flex justify-between items-center ${
            isDark ? 'border-slate-700' : 'border-slate-100'
          }`}
        >
          <div>
            <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Configure Data Table
            </h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Select a template and customize metrics.
            </p>
          </div>
          <button onClick={onClose}>
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="flex-1 flex min-h-0">
          <div
            className={`w-1/3 border-r overflow-y-auto p-2 space-y-2 ${
              isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-100 bg-slate-50'
            }`}
          >
            {Object.values(TABLE_TYPES).map((type) => (
              <button
                key={type.id}
                onClick={() => handleTypeChange(type.id)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedType === type.id
                    ? 'bg-blue-50 border-blue-400 ring-1 ring-blue-400 dark:bg-blue-900/20 dark:border-blue-500'
                    : 'border-transparent hover:bg-white dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <type.icon
                    size={16}
                    className={
                      selectedType === type.id
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-slate-400'
                    }
                  />
                  <span
                    className={`text-sm font-bold ${
                      selectedType === type.id
                        ? 'text-blue-700 dark:text-blue-300'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {type.label}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">{type.description}</p>
              </button>
            ))}
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h4
                className={`text-xs font-bold uppercase tracking-wider ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Visible Columns
              </h4>
              <button
                onClick={() =>
                  setSelectedColumns(TABLE_TYPES[selectedType].columns.map((c) => c.id))
                }
                className="text-[10px] text-blue-500 hover:underline"
              >
                Reset to Default
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {TABLE_TYPES[selectedType].columns.map((col) => (
                <label
                  key={col.id}
                  className={`flex items-center gap-2 p-2 rounded border cursor-pointer select-none transition-all ${
                    selectedColumns.includes(col.id)
                      ? 'bg-blue-50/50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-700'
                      : 'border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      selectedColumns.includes(col.id)
                        ? 'bg-blue-500 border-blue-500'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {selectedColumns.includes(col.id) && <Check size={10} className="text-white" />}
                  </div>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={selectedColumns.includes(col.id)}
                    onChange={() => toggleColumn(col.id)}
                  />
                  <span
                    className={`text-xs font-medium ${
                      selectedColumns.includes(col.id)
                        ? 'text-blue-700 dark:text-blue-300'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {col.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div
          className={`p-4 border-t flex justify-end gap-2 ${
            isDark ? 'border-slate-700' : 'border-slate-100'
          }`}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded-lg"
          >
            Cancel
          </button>
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
