import React, { useEffect, useState } from 'react';
import { X, ChevronRight, Loader2, FileText } from 'lucide-react';

interface ReportItem {
  id: string;
  name: string;
  slides: unknown[];
  config: {
    reportTitle?: string;
    clientName?: string;
    period?: string;
  };
  savedAt: string;
}

interface LoadReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoad: (report: ReportItem) => void;
}

export const LoadReportsModal: React.FC<LoadReportsModalProps> = ({ isOpen, onClose, onLoad }) => {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchReports();
    }
  }, [isOpen]);

  const fetchReports = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/reports?type=report');
      if (!response.ok) throw new Error('Gagal memuat data');
      const data = await response.json();
      setReports(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl border border-slate-200 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Muat Report Tersimpan</h3>
            <p className="text-sm text-slate-500">Pilih report untuk dimuat</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-500"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-2">
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 size={32} className="mx-auto mb-3 animate-spin text-blue-500" />
              <p className="text-slate-500">Memuat...</p>
            </div>
          ) : reports.length > 0 ? (
            reports.map((report) => (
              <button
                key={report.id}
                onClick={() => onLoad(report)}
                className="w-full p-4 border-2 border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-bold text-slate-900 mb-1">
                      {report.name || report.config?.reportTitle || 'Untitled Report'}
                    </div>
                    <div className="text-sm text-slate-600">
                      Client: {report.config?.clientName || '-'}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {Array.isArray(report.slides) ? report.slides.length : 0} slides • Period:{' '}
                      {report.config?.period || '-'}
                    </div>
                    <div className="text-xs text-slate-400">
                      Disimpan: {new Date(report.savedAt).toLocaleString('id-ID')}
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
              <FileText size={48} className="mx-auto mb-4 text-slate-300" />
              <h4 className="font-bold text-slate-700 mb-1">Belum Ada Report</h4>
              <p className="text-sm text-slate-500">Buat dan simpan report terlebih dahulu</p>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition"
        >
          Tutup
        </button>
      </div>
    </div>
  );
};
