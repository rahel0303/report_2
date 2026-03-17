'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MonitorPlay, LogOut, Plus, Download, FileText, BarChart2, Layers, Trash2, Settings } from 'lucide-react';
import Swal from 'sweetalert2';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Brand {
  id: number;
  brand_name_display: string;
  brand_name_identifier: string;
  username_instagram: string | null;
  username_tiktok: string | null;
  username_facebook: string | null;
  username_twitter: string | null;
}

interface ExportRecord {
  id: number;
  name: string;
  brand_name: string;
  period: string;        // MM-YYYY
  slide_count: number;
  is_partial: boolean;
  config: {
    reportTitle?: string;
    coverDesign?: { colors?: { primary?: string; secondary?: string; accent?: string } };
    theme?: { colors?: string[]; brandColor?: string };
  };
  gcs_object_name: string | null;
  cover_image_url: string | null;
  exported_at: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function getLast3MonthLabels(): string[] {
  const now = new Date();
  return [3, 2, 1].map((i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  });
}

// "February 2026" → "02-2026"
function labelToMonthYear(label: string): string {
  const [monthName, year] = label.split(' ');
  const mm = String(MONTHS.indexOf(monthName) + 1).padStart(2, '0');
  return `${mm}-${year}`;
}

// "02-2026" → "February 2026"
function monthYearToLabel(my: string): string {
  const [mm, yyyy] = my.split('-');
  return `${MONTHS[parseInt(mm, 10) - 1]} ${yyyy}`;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(d: Date) {
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function formatExportedAt(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/** Derive cover thumbnail style from saved config */
function getCoverStyle(config: ExportRecord['config']): { bg: string; accent: string } {
  const primary = config?.coverDesign?.colors?.primary
    || config?.theme?.colors?.[0]
    || '#0f172a';
  const secondary = config?.coverDesign?.colors?.secondary
    || config?.theme?.colors?.[1]
    || '#1e3a5f';
  const accent = config?.coverDesign?.colors?.accent
    || config?.theme?.brandColor
    || config?.theme?.colors?.[2]
    || '#3b82f6';
  return {
    bg: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
    accent,
  };
}

const CHANNELS: { key: keyof Brand; label: string }[] = [
  { key: 'username_instagram', label: 'IG' },
  { key: 'username_tiktok',   label: 'TT' },
  { key: 'username_facebook', label: 'FB' },
  { key: 'username_twitter',  label: 'TW' },
];

// ── Mini Cover Thumbnail ──────────────────────────────────────────────────────

function CoverThumbnail({ bg, accent, brand, period }: { bg: string; accent: string; brand: string; period: string }) {
  return (
    <div
      className="w-full aspect-video rounded-t-lg overflow-hidden relative flex flex-col justify-between p-3"
      style={{ background: bg }}
    >
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: accent, opacity: 0.9 }} />
        <div className="h-1.5 w-12 rounded-full bg-white/20" />
      </div>
      <div>
        <div className="h-1.5 w-20 rounded-full bg-white/60 mb-1.5" />
        <div className="h-1 w-14 rounded-full bg-white/30 mb-0.5" />
        <div className="h-1 w-10 rounded-full bg-white/20" />
      </div>
      <div className="flex items-center gap-2">
        <div className="h-0.5 flex-1 rounded-full" style={{ backgroundColor: accent, opacity: 0.6 }} />
        <div className="text-[7px] font-bold tracking-widest" style={{ color: accent }}>
          {period.split(' ')[1]}
        </div>
      </div>
      <div className="absolute bottom-2 right-3 text-[7px] font-semibold text-white/30 uppercase tracking-widest">
        {brand.split(' ').slice(-1)[0]}
      </div>
      <div className="absolute top-1/2 right-3 -translate-y-1/2 opacity-10">
        <BarChart2 size={28} color="white" />
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

interface SessionUser {
  id: number;
  name: string;
  role: string;
  is_verified: boolean;
}

export default function HomePage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const today = new Date();
  const last3 = getLast3MonthLabels();
  const [activePeriod, setActivePeriod] = useState(last3[last3.length - 1]);
  const [historyPeriod, setHistoryPeriod] = useState('all');

  // Session user
  const [user, setUser] = useState<SessionUser | null>(null);

  // Active brands
  const [activeBrands, setActiveBrands] = useState<Brand[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(false);

  // Export history
  const [history, setHistory] = useState<ExportRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => { if (data?.user) setUser(data.user); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setBrandsLoading(true);
    fetch(`/api/brands?month_year=${labelToMonthYear(activePeriod)}`)
      .then((r) => r.json())
      .then((data) => setActiveBrands(data.brands ?? []))
      .catch(() => setActiveBrands([]))
      .finally(() => setBrandsLoading(false));
  }, [activePeriod]);

  useEffect(() => {
    setHistoryLoading(true);
    fetch('/api/export-history')
      .then((r) => r.json())
      .then((data) => setHistory(data.history ?? []))
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false));
  }, []);

  const handleDownloadHistory = async (id: number, name: string) => {
    setDownloadingId(id);
    try {
      const res = await fetch(`/api/export-history/${id}/download`);
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${name}.pptx`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download history failed:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Hapus Export History?',
      text: 'Data ini tidak dapat dikembalikan.',
      showCancelButton: true,
      confirmButtonText: 'Hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#94a3b8',
    });
    if (!result.isConfirmed) return;
    setDeletingId(id);
    try {
      await fetch(`/api/export-history/${id}`, { method: 'DELETE' });
      setHistory((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
      Swal.fire({ icon: 'error', title: 'Gagal!', text: 'Gagal menghapus export history.', confirmButtonColor: '#1e293b' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  // Unique periods from history, sorted newest first
  const historyPeriodOptions = Array.from(new Set(history.map((r) => monthYearToLabel(r.period)))).sort((a, b) => {
    const toDate = (label: string) => { const [m, y] = label.split(' '); return parseInt(y) * 100 + MONTHS.indexOf(m); };
    return toDate(b) - toDate(a);
  });

  const filtered = history.filter((r) => {
    const periodLabel = monthYearToLabel(r.period);
    const matchPeriod = historyPeriod === 'all' || periodLabel === historyPeriod;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      r.name.toLowerCase().includes(q) ||
      r.brand_name.toLowerCase().includes(q) ||
      periodLabel.toLowerCase().includes(q);
    return matchPeriod && matchSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Header ── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm h-16">
        <div className="max-w-7xl mx-auto px-6 h-full flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-slate-900 text-white p-1.5 rounded-lg">
              <MonitorPlay size={20} />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              AutoMetric
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {user?.role === 'admin' && (
              <button
                onClick={() => router.push('/admin')}
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <Settings size={15} />
                Admin Panel
              </button>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <LogOut size={15} />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">

        {/* ── Verification Banner ── */}
        {user && user.is_verified === false && (
          <div className="flex items-center gap-3 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
            <svg className="w-5 h-5 shrink-0 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <span>Your account is pending verification. Please wait for admin approval before creating reports.</span>
          </div>
        )}

        {/* ── Greeting ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400 mb-1">{formatDate(today)}</p>
            <h2 className="text-2xl font-bold text-slate-900">
              {getGreeting()}, <span className="text-green-700">{user?.name ?? 'Admin'}</span>
            </h2>
          </div>
          {(!user || user.is_verified !== false) && (
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 bg-green-800 hover:bg-green-900 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors cursor-pointer shadow-sm text-sm whitespace-nowrap"
            >
              <Plus size={16} />
              Create New Report
            </button>
          )}
        </div>

        {/* ── Main content ── */}
        <div className="flex gap-6 items-start">

          {/* ── Left column ── */}
          <div className="w-72 shrink-0 flex flex-col gap-4">

            {/* Total Exports card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                <FileText size={22} />
              </div>
              <div>
                <p className="text-3xl font-bold text-slate-900">{history.length}</p>
                <p className="text-xs text-slate-500 mt-0.5">Total Exports</p>
              </div>
            </div>

            {/* Active Brands */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-3 py-2.5 border-b border-slate-100 flex items-center gap-2">
                <Layers size={13} className="text-slate-400 shrink-0" />
                <h3 className="text-xs font-semibold text-slate-700 shrink-0">Active Brands</h3>
                <select
                  value={activePeriod}
                  onChange={(e) => setActivePeriod(e.target.value)}
                  className="ml-auto text-[11px] border border-slate-200 rounded px-1.5 py-1 bg-white text-slate-600 focus:outline-none focus:ring-1 focus:ring-green-500 cursor-pointer"
                >
                  {last3.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div className="overflow-y-auto max-h-96">
                {brandsLoading ? (
                  <p className="px-3 py-3 text-[11px] text-slate-400 italic">Loading...</p>
                ) : activeBrands.length === 0 ? (
                  <p className="px-3 py-3 text-[11px] text-slate-400 italic">No active brands</p>
                ) : (
                  activeBrands.map((brand) => (
                    <div key={brand.id} className="px-3 py-2 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                        <p className="text-xs font-medium text-slate-800 truncate">{brand.brand_name_display}</p>
                      </div>
                      <div className="flex gap-1 pl-3.5">
                        {CHANNELS.map(({ key, label }) => {
                          const username = brand[key] as string | null;
                          if (!username) return null;
                          return (
                            <div
                              key={label}
                              title={`${label}: @${username}`}
                              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold border bg-green-50 text-green-700 border-green-200"
                            >
                              <span className="w-1 h-1 rounded-full bg-green-500" />
                              {label}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100">
                <span className="text-[10px] text-slate-400">
                  {activeBrands.length} brand active
                </span>
              </div>
            </div>

          </div>

          {/* ── Right column: Export History ── */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Export History</h3>
                <p className="text-xs text-slate-400 mt-0.5">Previously exported report presentations</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={historyPeriod}
                  onChange={(e) => setHistoryPeriod(e.target.value)}
                  className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-green-600/30 focus:border-green-600 transition cursor-pointer"
                >
                  <option value="all">All Periods</option>
                  {historyPeriodOptions.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                <input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-white text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-600/30 focus:border-green-600 w-36 transition"
                />
              </div>
            </div>

            {historyLoading ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <p className="text-slate-400 text-sm">Loading history...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <FileText size={32} className="text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No exports found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map((record) => {
                  const { bg, accent } = getCoverStyle(record.config);
                  const periodLabel = monthYearToLabel(record.period);
                  return (
                    <div
                      key={record.id}
                      className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col"
                    >
                      {record.cover_image_url ? (
                        <img
                          src={record.cover_image_url}
                          alt={record.brand_name}
                          className="w-full aspect-video rounded-t-lg object-cover"
                        />
                      ) : (
                        <CoverThumbnail bg={bg} accent={accent} brand={record.brand_name} period={periodLabel} />
                      )}
                      <div className="p-3 flex flex-col gap-1.5 flex-1">
                        <p className="text-xs font-semibold text-slate-800 leading-tight line-clamp-2">
                          {record.name}
                        </p>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-block bg-slate-100 text-slate-600 text-[10px] font-medium px-1.5 py-0.5 rounded">{record.brand_name}</span>
                          {record.is_partial && (
                            <span className="inline-block bg-amber-50 text-amber-600 text-[10px] font-medium px-1.5 py-0.5 rounded border border-amber-200">partial</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400">{periodLabel}</p>
                        <p className="text-[10px] text-slate-400">{record.slide_count} slides</p>
                        <p className="text-[10px] text-slate-300 mt-auto">{formatExportedAt(record.exported_at)}</p>
                      </div>
                      <div className="px-3 pb-3 flex gap-1.5">
                        <button
                          onClick={() => handleDownloadHistory(record.id, record.name)}
                          disabled={downloadingId === record.id || !record.gcs_object_name}
                          className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-white bg-green-700 hover:bg-green-800 disabled:bg-slate-200 disabled:text-slate-400 rounded-md py-1.5 transition-colors cursor-pointer disabled:cursor-not-allowed"
                        >
                          <Download size={11} />
                          {downloadingId === record.id ? 'Loading...' : 'Download .pptx'}
                        </button>
                        <button
                          onClick={() => handleDelete(record.id)}
                          disabled={deletingId === record.id}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors cursor-pointer disabled:cursor-not-allowed"
                          title="Hapus"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
