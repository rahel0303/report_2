import React, { useEffect, useState } from 'react';
import { X, FileText, Loader2 } from 'lucide-react';

interface ReportItem {
  id: string;
  name: string;
  slides: unknown[];
  config: unknown;
  savedAt: string;
}

interface LoadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoad: (item: ReportItem) => void;
  onDelete: (id: string, type: 'template' | 'report') => Promise<void>;
  mode: 'template' | 'report';
}

export const LoadModal: React.FC<LoadModalProps> = ({ isOpen, onClose, onLoad, onDelete, mode }) => {
  const [items, setItems] = useState<ReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchItems();
    }
  }, [isOpen, mode]);

  const fetchItems = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/reports?type=${mode}`);
      if (!response.ok) {
        throw new Error('Gagal memuat data');
      }
      const data = await response.json();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus?')) return;

    setDeletingId(id);
    try {
      await onDelete(id, mode);
      setItems(items.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus');
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-xl font-bold">
            {mode === 'template' ? 'Muat Template' : 'Muat Report Tersimpan'}
          </h3>
          <p className="text-sm text-slate-600 mt-1">
            {mode === 'template'
              ? 'Pilih template untuk memuat strukturnya'
              : 'Pilih report tersimpan untuk melanjutkan editing'}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 size={32} className="mx-auto mb-3 animate-spin text-blue-500" />
              <p className="text-slate-500">Memuat...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <FileText size={48} className="mx-auto mb-3 opacity-50" />
              <p>Belum ada {mode === 'template' ? 'template' : 'report tersimpan'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="border border-slate-200 rounded-lg p-4 hover:border-blue-400 hover:bg-blue-50/50 transition-all group"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900">{item.name}</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Disimpan: {new Date(item.savedAt).toLocaleString('id-ID')}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        {Array.isArray(item.slides) ? item.slides.length : 0} slides
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onLoad(item)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium"
                      >
                        Muat
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="px-2 py-1.5 text-red-500 hover:bg-red-50 rounded disabled:opacity-50"
                        title="Hapus"
                      >
                        {deletingId === item.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <X size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
