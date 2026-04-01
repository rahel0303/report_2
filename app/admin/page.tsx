'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { AppSidebar } from '@/app/components/ui/AppSidebar';
import {
  Building2,
  Users,
  BarChart2,
  Plus,
  Pencil,
  Trash2,
  X,
  ChevronRight,
  LogOut,
  Check,
  FileText,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Company {
  id: number;
  name: string;
  slug: string;
  created_at: string;
}

interface User {
  id: number;
  name: string;
  username: string;
  role: string;
  is_verified: boolean;
  company_id: number | null;
  company_name: string | null;
  created_at: string;
}

interface Brand {
  id: number;
  brand_name_identifier: string;
  brand_name_display: string;
}

interface ActiveBrand {
  id: number;
  company_id: number | null;
  brand_id: number;
  month_year: string;
  brand_name_display: string;
  brand_name_identifier: string;
  company_name: string | null;
}

type TabType = 'companies' | 'users' | 'active-brands' | 'export-history';

interface ExportHistoryRecord {
  id: number;
  user_id: number;
  user_name: string;
  name: string;
  brand_name: string;
  period: string;
  slide_count: number;
  is_partial: boolean;
  gcs_object_name: string | null;
  cover_image_url: string | null;
  exported_at: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function currentMonthYear() {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  return `${mm}-${yyyy}`;
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// Generate last N months as MM-YYYY options (newest first)
function getMonthOptions(count = 12): { value: string; label: string }[] {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return { value: `${mm}-${yyyy}`, label: `${MONTH_NAMES[d.getMonth()]} ${yyyy}` };
  });
}

function getPrevMonth(monthYear: string): string {
  const [mm, yyyy] = monthYear.split('-').map(Number);
  const d = new Date(yyyy, mm - 2, 1); // -2 karena 0-indexed
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('companies');

  // Data
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [activeBrands, setActiveBrands] = useState<ActiveBrand[]>([]);
  const [exportHistory, setExportHistory] = useState<ExportHistoryRecord[]>([]);
  const [historySearch, setHistorySearch] = useState('');

  // Active Brands - new mechanism
  const [abSelCompany, setAbSelCompany] = useState('');
  const [abSelMonth, setAbSelMonth] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return `${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
  });
  const [abChecked, setAbChecked] = useState<Set<number>>(new Set());
  const [abLoading, setAbLoading] = useState(false);
  const [abSyncing, setAbSyncing] = useState(false);
  const [abBrandSearch, setAbBrandSearch] = useState('');

  // Filters
  const [abFilterCompany, setAbFilterCompany] = useState('');
  const [abFilterMonth, setAbFilterMonth] = useState('');


  // Company modal
  const [companyModal, setCompanyModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [companyForm, setCompanyForm] = useState({ name: '' });

  // User modal
  const [userModal, setUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({
    name: '',
    username: '',
    password: '',
    role: 'user',
    company_id: '',
  });

  // Active brand modal
  const [abModal, setAbModal] = useState(false);
  const [abForm, setAbForm] = useState({
    company_id: '',
    brand_id: '',
    month_year: currentMonthYear(),
  });

  // ─── Auth guard ────────────────────────────────────────────────────────────

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (!data?.user || data.user.role !== 'admin') {
          router.replace('/home');
        } else {
          setCurrentUserId(data.user.id);
        }
      })
      .catch(() => router.replace('/home'));
  }, [router]);

  // ─── Fetch data ────────────────────────────────────────────────────────────

  const fetchCompanies = useCallback(async () => {
    const res = await fetch('/api/admin/companies');
    if (res.ok) setCompanies(await res.json());
  }, []);

  const fetchUsers = useCallback(async () => {
    const res = await fetch('/api/admin/users');
    if (res.ok) setUsers(await res.json());
  }, []);

  const fetchBrands = useCallback(async () => {
    const res = await fetch('/api/admin/brands');
    if (res.ok) setBrands(await res.json());
  }, []);

  const fetchActiveBrands = useCallback(async () => {
    const params = new URLSearchParams();
    if (abFilterCompany) params.set('company_id', abFilterCompany);
    if (abFilterMonth) params.set('month_year', abFilterMonth);
    const res = await fetch(`/api/admin/active-brands?${params.toString()}`);
    if (res.ok) setActiveBrands(await res.json());
  }, [abFilterCompany, abFilterMonth]);

  const fetchExportHistory = useCallback(async () => {
    const res = await fetch('/api/admin/export-history');
    if (res.ok) {
      const data = await res.json();
      setExportHistory(data.history ?? []);
    }
  }, []);

  const handleDeleteHistory = async (r: ExportHistoryRecord) => {
    const result = await Swal.fire({ icon: 'warning', title: 'Hapus export ini?', text: `"${r.name}" akan dihapus permanen.`, showCancelButton: true, confirmButtonText: 'Hapus', cancelButtonText: 'Batal', confirmButtonColor: '#dc2626', cancelButtonColor: '#6b7280' });
    if (!result.isConfirmed) return;
    const res = await fetch(`/api/admin/export-history/${r.id}`, { method: 'DELETE' });
    if (res.ok) {
      setExportHistory((prev) => prev.filter((h) => h.id !== r.id));
      showAlert('success', `"${r.name}" deleted.`);
    } else {
      showAlert('error', 'Failed to delete.');
    }
  };

  useEffect(() => {
    fetchCompanies();
    fetchUsers();
    fetchBrands();
    fetchExportHistory();
  }, [fetchCompanies, fetchUsers, fetchBrands, fetchExportHistory]);

  useEffect(() => {
    fetchActiveBrands();
  }, [fetchActiveBrands]);

  // Fetch active brands untuk company + month yang dipilih → pre-check
  useEffect(() => {
    if (!abSelCompany || !abSelMonth) { setAbChecked(new Set()); return; }
    setAbLoading(true);
    fetch(`/api/admin/active-brands?company_id=${abSelCompany}&month_year=${abSelMonth}`)
      .then((r) => r.json())
      .then((data: ActiveBrand[]) => {
        setAbChecked(new Set((data as ActiveBrand[]).map((ab) => ab.brand_id)));
      })
      .catch(() => setAbChecked(new Set()))
      .finally(() => setAbLoading(false));
  }, [abSelCompany, abSelMonth]);

  // ─── Alert helper ──────────────────────────────────────────────────────────

  const showAlert = (type: 'success' | 'error', message: string) => {
    Swal.fire({
      icon: type,
      title: type === 'success' ? 'Berhasil' : 'Gagal',
      text: message,
      confirmButtonColor: '#4f46e5',
      timer: type === 'success' ? 2000 : undefined,
      timerProgressBar: type === 'success',
      showConfirmButton: type === 'error',
    });
  };

  // ─── Company CRUD ──────────────────────────────────────────────────────────

  const openAddCompany = () => {
    setEditingCompany(null);
    setCompanyForm({ name: '' });
    setCompanyModal(true);
  };

  const openEditCompany = (c: Company) => {
    setEditingCompany(c);
    setCompanyForm({ name: c.name });
    setCompanyModal(true);
  };

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingCompany
      ? `/api/admin/companies/${editingCompany.id}`
      : '/api/admin/companies';
    const method = editingCompany ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(companyForm),
    });

    if (res.ok) {
      setCompanyModal(false);
      fetchCompanies();
      showAlert('success', editingCompany ? 'Company updated.' : 'Company created.');
    } else {
      const err = await res.json();
      showAlert('error', err.error || 'Something went wrong.');
    }
  };

  const handleDeleteCompany = async (id: number) => {
    const result = await Swal.fire({ icon: 'warning', title: 'Hapus company?', text: 'Company ini akan dihapus permanen.', showCancelButton: true, confirmButtonText: 'Hapus', cancelButtonText: 'Batal', confirmButtonColor: '#dc2626', cancelButtonColor: '#6b7280' });
    if (!result.isConfirmed) return;
    const res = await fetch(`/api/admin/companies/${id}`, { method: 'DELETE' });
    if (res.ok) {
      fetchCompanies();
      showAlert('success', 'Company deleted.');
    } else {
      showAlert('error', 'Failed to delete company.');
    }
  };

  // ─── User CRUD ─────────────────────────────────────────────────────────────

  const openAddUser = () => {
    setEditingUser(null);
    setUserForm({ name: '', username: '', password: '', role: 'user', company_id: '' });
    setUserModal(true);
  };

  const openEditUser = (u: User) => {
    setEditingUser(u);
    setUserForm({
      name: u.name,
      username: u.username,
      password: '',
      role: u.role,
      company_id: u.company_id ? String(u.company_id) : '',
    });
    setUserModal(true);
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingUser ? `/api/admin/users/${editingUser.id}` : '/api/admin/users';
    const method = editingUser ? 'PUT' : 'POST';

    const payload: Record<string, unknown> = {
      name: userForm.name,
      username: userForm.username,
      role: userForm.role,
      company_id: userForm.company_id ? Number(userForm.company_id) : null,
    };

    if (!editingUser || userForm.password) {
      payload.password = userForm.password;
    }

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setUserModal(false);
      fetchUsers();
      showAlert('success', editingUser ? 'User updated.' : 'User created.');
    } else {
      const err = await res.json();
      showAlert('error', err.error || 'Something went wrong.');
    }
  };

  const handleDeleteUser = async (u: User) => {
    if (currentUserId === u.id) {
      showAlert('error', 'You cannot delete your own account.');
      return;
    }
    const result = await Swal.fire({ icon: 'warning', title: `Hapus user "${u.name}"?`, text: 'User ini akan dihapus permanen.', showCancelButton: true, confirmButtonText: 'Hapus', cancelButtonText: 'Batal', confirmButtonColor: '#dc2626', cancelButtonColor: '#6b7280' });
    if (!result.isConfirmed) return;
    const res = await fetch(`/api/admin/users/${u.id}`, { method: 'DELETE' });
    if (res.ok) {
      fetchUsers();
      showAlert('success', 'User deleted.');
    } else {
      showAlert('error', 'Failed to delete user.');
    }
  };

  const handleSetVerified = async (u: User, verified: boolean) => {
    const res = await fetch(`/api/admin/users/${u.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: u.name,
        username: u.username,
        role: u.role,
        company_id: u.company_id,
        is_verified: verified,
      }),
    });
    if (res.ok) {
      setUsers((prev) => prev.map((user) => user.id === u.id ? { ...user, is_verified: verified } : user));
      showAlert('success', `User "${u.name}" ${verified ? 'verified' : 'unverified'}.`);
    } else {
      showAlert('error', `Failed to ${verified ? 'verify' : 'unverify'} user.`);
    }
  };

  // ─── Active Brand CRUD ─────────────────────────────────────────────────────

  const openAddActiveBrand = () => {
    setAbBrandSearch('');
    setAbChecked(new Set());
    setAbModal(true);
  };

  const handleAbSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/active-brands', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_id: abForm.company_id ? Number(abForm.company_id) : null,
        brand_id: Number(abForm.brand_id),
        month_year: abForm.month_year,
      }),
    });

    if (res.ok) {
      setAbModal(false);
      fetchActiveBrands();
      showAlert('success', 'Active brand entry created.');
    } else {
      const err = await res.json();
      showAlert('error', err.error || 'Something went wrong.');
    }
  };

  const handleDeleteActiveBrand = async (id: number) => {
    const result = await Swal.fire({ icon: 'warning', title: 'Hapus active brand?', text: 'Entry ini akan dihapus permanen.', showCancelButton: true, confirmButtonText: 'Hapus', cancelButtonText: 'Batal', confirmButtonColor: '#dc2626', cancelButtonColor: '#6b7280' });
    if (!result.isConfirmed) return;
    const res = await fetch(`/api/admin/active-brands/${id}`, { method: 'DELETE' });
    if (res.ok) {
      fetchActiveBrands();
      showAlert('success', 'Entry deleted.');
    } else {
      showAlert('error', 'Failed to delete entry.');
    }
  };

  const handleSyncActiveBrands = async () => {
    if (!abSelCompany || !abSelMonth) return;
    setAbSyncing(true);
    const res = await fetch('/api/admin/active-brands/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_id: Number(abSelCompany),
        month_year: abSelMonth,
        brand_ids: Array.from(abChecked),
      }),
    });
    if (res.ok) {
      showAlert('success', `Saved ${abChecked.size} active brand(s) for ${abSelMonth}.`);
      setAbModal(false);
      fetchActiveBrands();
    } else {
      showAlert('error', 'Failed to save.');
    }
    setAbSyncing(false);
  };

  const handleCopyPrevMonth = async () => {
    if (!abSelCompany || !abSelMonth) return;
    const prev = getPrevMonth(abSelMonth);
    const res = await fetch(`/api/admin/active-brands?company_id=${abSelCompany}&month_year=${prev}`);
    if (res.ok) {
      const data: ActiveBrand[] = await res.json();
      setAbChecked(new Set(data.map((ab) => ab.brand_id)));
      showAlert('success', `Copied ${data.length} brand(s) from ${prev}`);
    } else {
      showAlert('error', 'Gagal mengambil data bulan sebelumnya.');
    }
  };

  // ─── Shared input style ────────────────────────────────────────────────────

  const inputCls =
    'w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all';
  const labelCls = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500';

  // ─── Render ────────────────────────────────────────────────────────────────

  const navItems: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'companies', label: 'Companies', icon: <Building2 size={18} /> },
    { id: 'users', label: 'Users', icon: <Users size={18} /> },
    { id: 'active-brands', label: 'Active Brands', icon: <BarChart2 size={18} /> },
    { id: 'export-history', label: 'Export History', icon: <FileText size={18} /> },
  ];

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <AppSidebar mode="overlay" />
      {/* ── Sidebar ── */}
      <aside className="flex w-60 flex-col bg-white border-r border-gray-100 shadow-sm">
        <div className="px-6 py-5 border-b border-gray-100">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-500">Admin</p>
          <h1 className="mt-0.5 text-xl font-bold text-gray-800">Panel</h1>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                activeTab === item.id
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              <span
                className={activeTab === item.id ? 'text-indigo-500' : 'text-gray-400'}
              >
                {item.icon}
              </span>
              {item.label}
              {activeTab === item.id && (
                <ChevronRight size={14} className="ml-auto text-indigo-400" />
              )}
            </button>
          ))}
        </nav>

        <div className="border-t border-gray-100 px-3 py-4 space-y-1">
          <a
            href="/"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-green-700 hover:bg-green-50 transition-all"
          >
            <Plus size={18} className="text-green-600" />
            Generate Report
          </a>
          <button
            onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/login'); }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <LogOut size={18} className="text-gray-400" />
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl px-8 py-8">

          {/* ── Companies Tab ── */}
          {activeTab === 'companies' && (
            <section>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Companies</h2>
                  <p className="text-sm text-gray-500 mt-0.5">{companies.length} total</p>
                </div>
                <button
                  onClick={openAddCompany}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
                >
                  <Plus size={16} />
                  Add Company
                </button>
              </div>

              <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Name</th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Slug</th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Created</th>
                      <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {companies.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-10 text-center text-gray-400">
                          No companies found
                        </td>
                      </tr>
                    ) : (
                      companies.map((c) => (
                        <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-3.5 font-medium text-gray-800">{c.name}</td>
                          <td className="px-5 py-3.5 font-mono text-xs text-gray-500">{c.slug}</td>
                          <td className="px-5 py-3.5 text-gray-500">{formatDate(c.created_at)}</td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openEditCompany(c)}
                                className="rounded-lg p-1.5 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                                title="Edit"
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                onClick={() => handleDeleteCompany(c.id)}
                                className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* ── Users Tab ── */}
          {activeTab === 'users' && (
            <section>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Users</h2>
                  <p className="text-sm text-gray-500 mt-0.5">{users.length} total</p>
                </div>
                <button
                  onClick={openAddUser}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
                >
                  <Plus size={16} />
                  Add User
                </button>
              </div>

              <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Name</th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Username</th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Role</th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Company</th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Created</th>
                      <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-5 py-10 text-center text-gray-400">
                          No users found
                        </td>
                      </tr>
                    ) : (
                      users.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-3.5 font-medium text-gray-800">
                            {u.name}
                            {currentUserId === u.id && (
                              <span className="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-600">
                                You
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 font-mono text-xs text-gray-600">{u.username}</td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                u.role === 'admin'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            {u.is_verified ? (
                              <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-700">
                                Verified
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold bg-amber-100 text-amber-700">
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-gray-500">{u.company_name || '-'}</td>
                          <td className="px-5 py-3.5 text-gray-500">{formatDate(u.created_at)}</td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center justify-end gap-2">
                              {!u.is_verified && u.company_id && (
                                <button
                                  onClick={() => handleSetVerified(u, true)}
                                  className="rounded-lg p-1.5 text-gray-400 hover:bg-green-50 hover:text-green-600 transition-colors"
                                  title="Verify"
                                >
                                  <Check size={15} />
                                </button>
                              )}
                              {!u.is_verified && !u.company_id && (
                                <span className="text-[10px] text-amber-500 font-medium" title="Assign company first">No company</span>
                              )}
                              {u.is_verified && (
                                <button
                                  onClick={() => handleSetVerified(u, false)}
                                  className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                                  title="Unverify"
                                >
                                  <X size={15} />
                                </button>
                              )}
                              <button
                                onClick={() => openEditUser(u)}
                                className="rounded-lg p-1.5 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                                title="Edit"
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u)}
                                disabled={currentUserId === u.id}
                                className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:cursor-not-allowed disabled:opacity-30"
                                title="Delete"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* ── Active Brands Tab ── */}
          {activeTab === 'active-brands' && (
            <section>
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Active Brands</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Kelola brand aktif per company per bulan</p>
                </div>
                <button
                  onClick={openAddActiveBrand}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
                >
                  <Plus size={16} />
                  Manage Active Brands
                </button>
              </div>

              {/* Filters */}
              <div className="mb-4 flex flex-wrap gap-3">
                <select
                  value={abFilterCompany}
                  onChange={(e) => setAbFilterCompany(e.target.value)}
                  className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-indigo-400 focus:outline-none"
                >
                  <option value="">All Companies</option>
                  {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input
                  type="text"
                  placeholder="Filter bulan (MM-YYYY)"
                  value={abFilterMonth}
                  onChange={(e) => setAbFilterMonth(e.target.value)}
                  className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-indigo-400 focus:outline-none w-44"
                />
                {(abFilterCompany || abFilterMonth) && (
                  <button onClick={() => { setAbFilterCompany(''); setAbFilterMonth(''); }} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500 hover:bg-gray-50">Clear</button>
                )}
              </div>

              {/* Table */}
              <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <th className="px-5 py-3.5">Company</th>
                      <th className="px-5 py-3.5">Brand</th>
                      <th className="px-5 py-3.5">Month</th>
                      <th className="px-5 py-3.5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {activeBrands.length === 0 ? (
                      <tr><td colSpan={4} className="px-5 py-10 text-center text-gray-400 text-sm">No active brand entries found</td></tr>
                    ) : (
                      activeBrands.map((ab) => (
                        <tr key={ab.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-3.5 text-gray-600">{ab.company_name || '-'}</td>
                          <td className="px-5 py-3.5 font-medium text-gray-800">{ab.brand_name_display}</td>
                          <td className="px-5 py-3.5 font-mono text-xs text-gray-500">{ab.month_year}</td>
                          <td className="px-5 py-3.5 text-right">
                            <button onClick={() => handleDeleteActiveBrand(ab.id)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"><Trash2 size={15} /></button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* ── Export History Tab ── */}
          {activeTab === 'export-history' && (
            <section>
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Export History</h2>
                  <p className="text-xs text-gray-400 mt-0.5">All reports exported by all users</p>
                </div>
                <input
                  type="text"
                  placeholder="Search by name, brand, user..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 w-64"
                />
              </div>
              <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <th className="px-5 py-3.5">Report Name</th>
                      <th className="px-5 py-3.5">User</th>
                      <th className="px-5 py-3.5">Brand</th>
                      <th className="px-5 py-3.5">Period</th>
                      <th className="px-5 py-3.5">Slides</th>
                      <th className="px-5 py-3.5">Exported At</th>
                      <th className="px-5 py-3.5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {exportHistory
                      .filter((r) => {
                        const q = historySearch.toLowerCase();
                        return !q || r.name.toLowerCase().includes(q) || r.brand_name.toLowerCase().includes(q) || (r.user_name ?? '').toLowerCase().includes(q);
                      })
                      .map((r) => (
                        <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-3.5 font-medium text-gray-800 max-w-xs truncate">
                            <div className="flex items-center gap-2">
                              {r.name}
                              {r.is_partial && (
                                <span className="inline-block bg-amber-50 text-amber-600 text-[10px] font-medium px-1.5 py-0.5 rounded border border-amber-200">partial</span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-gray-500">{r.user_name || '-'}</td>
                          <td className="px-5 py-3.5 text-gray-500">{r.brand_name}</td>
                          <td className="px-5 py-3.5 text-gray-500">{r.period}</td>
                          <td className="px-5 py-3.5 text-gray-500">{r.slide_count}</td>
                          <td className="px-5 py-3.5 text-gray-400 text-xs">{new Date(r.exported_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                          <td className="px-5 py-3.5">
                            <button
                              onClick={() => handleDeleteHistory(r)}
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    {exportHistory.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-5 py-10 text-center text-gray-400 text-sm">No export history found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      </main>

      {/* ── Company Modal ── */}
      {companyModal && (
        <Modal
          title={editingCompany ? 'Edit Company' : 'Add Company'}
          onClose={() => setCompanyModal(false)}
        >
          <form onSubmit={handleCompanySubmit} className="space-y-4">
            <div>
              <label className={labelCls}>Company Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Acme Corp"
                value={companyForm.name}
                onChange={(e) => setCompanyForm({ name: e.target.value })}
                className={inputCls}
                autoFocus
              />
              {companyForm.name && (
                <p className="mt-1.5 text-xs text-gray-400">
                  Slug:{' '}
                  <span className="font-mono text-gray-600">
                    {companyForm.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}
                  </span>
                </p>
              )}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCompanyModal(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
              >
                {editingCompany ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── User Modal ── */}
      {userModal && (
        <Modal
          title={editingUser ? 'Edit User' : 'Add User'}
          onClose={() => setUserModal(false)}
        >
          <form onSubmit={handleUserSubmit} className="space-y-4">
            <div>
              <label className={labelCls}>Full Name</label>
              <input
                type="text"
                required
                placeholder="Jane Smith"
                value={userForm.name}
                onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                className={inputCls}
                autoFocus
              />
            </div>
            <div>
              <label className={labelCls}>Username</label>
              <input
                type="text"
                required
                placeholder="janesmith"
                value={userForm.username}
                onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>
                Password{editingUser && <span className="ml-1 font-normal normal-case text-gray-400">(leave blank to keep)</span>}
              </label>
              <input
                type="password"
                required={!editingUser}
                placeholder={editingUser ? 'Leave blank to keep current' : 'Enter password'}
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Role</label>
              <select
                value={userForm.role}
                onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                className={inputCls}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Company</label>
              <select
                value={userForm.company_id}
                onChange={(e) => setUserForm({ ...userForm, company_id: e.target.value })}
                className={inputCls}
              >
                <option value="">No company</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setUserModal(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
              >
                {editingUser ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Active Brand Modal ── */}
      {abModal && (
        <Modal title="Manage Active Brands" onClose={() => setAbModal(false)}>
          <div className="space-y-4">
            {/* Company + Month selector */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className={labelCls}>Company</label>
                <select
                  value={abSelCompany}
                  onChange={(e) => setAbSelCompany(e.target.value)}
                  className={inputCls}
                >
                  <option value="">— Pilih Company —</option>
                  {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Bulan</label>
                <select
                  value={abSelMonth}
                  onChange={(e) => setAbSelMonth(e.target.value)}
                  className={inputCls}
                >
                  {getMonthOptions(12).map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Brand checklist */}
            {!abSelCompany ? (
              <p className="text-sm text-gray-400 text-center py-6">Pilih company terlebih dahulu</p>
            ) : abLoading ? (
              <p className="text-sm text-gray-400 text-center py-6">Loading...</p>
            ) : (
              <>
                {/* Copy from prev month */}
                <button
                  type="button"
                  onClick={handleCopyPrevMonth}
                  className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-indigo-300 bg-indigo-50 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-100 transition-colors"
                >
                  Gunakan brand yang sama seperti bulan sebelumnya ({getPrevMonth(abSelMonth)})
                </button>

                {/* Search */}
                <input
                  type="text"
                  placeholder="Cari brand..."
                  value={abBrandSearch}
                  onChange={(e) => setAbBrandSearch(e.target.value)}
                  className={inputCls}
                />

                {/* List */}
                <div className="border border-gray-100 rounded-lg overflow-hidden">
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-500">{abChecked.size} dipilih dari {brands.length} brand</span>
                    <div className="flex gap-3">
                      <button onClick={() => setAbChecked(new Set(brands.map((b) => b.id)))} className="text-xs text-indigo-600 hover:underline">Pilih semua</button>
                      <button onClick={() => setAbChecked(new Set())} className="text-xs text-gray-400 hover:underline">Hapus semua</button>
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
                    {brands
                      .filter((b) => b.brand_name_display.toLowerCase().includes(abBrandSearch.toLowerCase()))
                      .map((b) => (
                        <label key={b.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-indigo-50/40 cursor-pointer transition-colors">
                          <input
                            type="checkbox"
                            checked={abChecked.has(b.id)}
                            onChange={(e) => {
                              const next = new Set(abChecked);
                              e.target.checked ? next.add(b.id) : next.delete(b.id);
                              setAbChecked(next);
                            }}
                            className="w-4 h-4 accent-indigo-600"
                          />
                          <span className="text-sm text-gray-800">{b.brand_name_display}</span>
                          <span className="text-xs text-gray-400 ml-auto">{b.brand_name_identifier}</span>
                        </label>
                      ))}
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-end gap-3 pt-1">
              <button onClick={() => setAbModal(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSyncActiveBrands}
                disabled={abSyncing || !abSelCompany || !abSelMonth}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors"
              >
                {abSyncing ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
