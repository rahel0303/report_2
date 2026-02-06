'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Building2,
  Briefcase,
  Target,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  LogOut,
  Home,
  X,
  Check,
} from 'lucide-react';

interface User {
  id: number;
  name: string;
  username: string;
  agency_id: number | null;
  role: string;
  agency_name?: string;
}

interface Agency {
  id: number;
  name: string;
  slug: string;
}

interface Company {
  id: number;
  name: string;
  brand_name_display: string | null;
  slug: string;
  username_instagram: string | null;
  username_tiktok: string | null;
  username_facebook: string | null;
  username_twitter: string | null;
}

interface Brand {
  id: number;
  company_id: number;
  agency_id: number | null;
  company_name: string;
  agency_name: string | null;
  competitors: { id: number; competitor_company_id: number; competitor_name: string }[];
}

type Tab = 'users' | 'agencies' | 'companies' | 'brands';

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<{ name: string; role: string } | null>(null);

  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingItem, setEditingItem] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [activeTab, currentUser]);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();

      if (!data.user || data.user.role !== 'admin') {
        router.push('/');
        return;
      }

      setCurrentUser(data.user);
    } catch {
      router.push('/login');
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    setError('');

    try {
      const endpoint = `/api/admin/${activeTab}`;
      const res = await fetch(endpoint);

      if (!res.ok) throw new Error('Gagal memuat data');

      const data = await res.json();

      switch (activeTab) {
        case 'users':
          setUsers(data);
          break;
        case 'agencies':
          setAgencies(data);
          break;
        case 'companies':
          setCompanies(data);
          break;
        case 'brands':
          setBrands(data);
          break;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const openAddModal = () => {
    setModalMode('add');
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus?')) return;

    try {
      const res = await fetch(`/api/admin/${activeTab}/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal menghapus');
      }
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus');
    }
  };

  const handleSave = async (formData: any) => {
    try {
      const url =
        modalMode === 'add'
          ? `/api/admin/${activeTab}`
          : `/api/admin/${activeTab}/${editingItem.id}`;

      const res = await fetch(url, {
        method: modalMode === 'add' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal menyimpan');
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menyimpan');
    }
  };

  const tabs = [
    { id: 'users' as Tab, label: 'Users', icon: Users },
    { id: 'agencies' as Tab, label: 'Agencies', icon: Building2 },
    { id: 'companies' as Tab, label: 'Companies', icon: Briefcase },
    { id: 'brands' as Tab, label: 'Brands & Competitors', icon: Target },
  ];

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <h1 className="text-xl font-bold text-slate-900">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm"
            >
              <Home size={16} />
              Ke App
            </button>
            <div className="text-sm text-slate-600">
              Halo, <span className="font-medium">{currentUser?.name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white p-2 rounded-xl shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm">
          {/* Toolbar */}
          <div className="p-4 border-b border-slate-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-800 capitalize">{activeTab}</h2>
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
            >
              <Plus size={16} />
              Tambah
            </button>
          </div>

          {/* Table */}
          <div className="p-4">
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
            ) : (
              <>
                {activeTab === 'users' && (
                  <UsersTable
                    users={users}
                    agencies={agencies}
                    onEdit={openEditModal}
                    onDelete={handleDelete}
                  />
                )}
                {activeTab === 'agencies' && (
                  <AgenciesTable
                    agencies={agencies}
                    onEdit={openEditModal}
                    onDelete={handleDelete}
                  />
                )}
                {activeTab === 'companies' && (
                  <CompaniesTable
                    companies={companies}
                    onEdit={openEditModal}
                    onDelete={handleDelete}
                  />
                )}
                {activeTab === 'brands' && (
                  <BrandsTable
                    brands={brands}
                    companies={companies}
                    agencies={agencies}
                    onEdit={openEditModal}
                    onDelete={handleDelete}
                    onRefresh={fetchData}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <Modal
          tab={activeTab}
          mode={modalMode}
          item={editingItem}
          agencies={agencies}
          companies={companies}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

// Users Table Component
function UsersTable({
  users,
  agencies,
  onEdit,
  onDelete,
}: {
  users: User[];
  agencies: Agency[];
  onEdit: (user: User) => void;
  onDelete: (id: number) => void;
}) {
  if (users.length === 0) {
    return <p className="text-center py-8 text-slate-500">Belum ada data</p>;
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-slate-200">
          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">
            Nama
          </th>
          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">
            Username
          </th>
          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">
            Agency
          </th>
          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">
            Role
          </th>
          <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase">
            Aksi
          </th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
            <td className="py-3 px-4 font-medium text-slate-900">{user.name}</td>
            <td className="py-3 px-4 text-slate-900">{user.username}</td>
            <td className="py-3 px-4 text-slate-900">{user.agency_name || '-'}</td>
            <td className="py-3 px-4">
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  user.role === 'admin'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {user.role}
              </span>
            </td>
            <td className="py-3 px-4 text-right">
              <button
                onClick={() => onEdit(user)}
                className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => onDelete(user.id)}
                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded"
              >
                <Trash2 size={16} />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Agencies Table Component
function AgenciesTable({
  agencies,
  onEdit,
  onDelete,
}: {
  agencies: Agency[];
  onEdit: (agency: Agency) => void;
  onDelete: (id: number) => void;
}) {
  if (agencies.length === 0) {
    return <p className="text-center py-8 text-slate-500">Belum ada data</p>;
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-slate-200">
          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">
            Nama
          </th>
          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">
            Slug
          </th>
          <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase">
            Aksi
          </th>
        </tr>
      </thead>
      <tbody>
        {agencies.map((agency) => (
          <tr key={agency.id} className="border-b border-slate-100 hover:bg-slate-50">
            <td className="py-3 px-4 font-medium text-slate-900">{agency.name}</td>
            <td className="py-3 px-4 text-slate-900">{agency.slug}</td>
            <td className="py-3 px-4 text-right">
              <button
                onClick={() => onEdit(agency)}
                className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => onDelete(agency.id)}
                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded"
              >
                <Trash2 size={16} />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Companies Table Component
function CompaniesTable({
  companies,
  onEdit,
  onDelete,
}: {
  companies: Company[];
  onEdit: (company: Company) => void;
  onDelete: (id: number) => void;
}) {
  if (companies.length === 0) {
    return <p className="text-center py-8 text-slate-500">Belum ada data</p>;
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-slate-200">
          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">
            Nama
          </th>
          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">
            Slug
          </th>
          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">
            Instagram
          </th>
          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">
            TikTok
          </th>
          <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase">
            Aksi
          </th>
        </tr>
      </thead>
      <tbody>
        {companies.map((company) => (
          <tr key={company.id} className="border-b border-slate-100 hover:bg-slate-50">
            <td className="py-3 px-4 font-medium text-slate-900">{company.name}</td>
            <td className="py-3 px-4 text-slate-900">{company.slug}</td>
            <td className="py-3 px-4 text-slate-900">{company.username_instagram || '-'}</td>
            <td className="py-3 px-4 text-slate-900">{company.username_tiktok || '-'}</td>
            <td className="py-3 px-4 text-right">
              <button
                onClick={() => onEdit(company)}
                className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => onDelete(company.id)}
                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded"
              >
                <Trash2 size={16} />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Brands Table Component
function BrandsTable({
  brands,
  companies,
  agencies,
  onEdit,
  onDelete,
  onRefresh,
}: {
  brands: Brand[];
  companies: Company[];
  agencies: Agency[];
  onEdit: (brand: Brand) => void;
  onDelete: (id: number) => void;
  onRefresh: () => void;
}) {
  const [addingCompetitorFor, setAddingCompetitorFor] = useState<number | null>(null);
  const [selectedCompetitor, setSelectedCompetitor] = useState<string>('');

  const handleAddCompetitor = async (brandId: number) => {
    if (!selectedCompetitor) return;

    try {
      const res = await fetch(`/api/admin/brands/${brandId}/competitors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competitor_company_id: parseInt(selectedCompetitor) }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      setAddingCompetitorFor(null);
      setSelectedCompetitor('');
      onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menambah competitor');
    }
  };

  const handleRemoveCompetitor = async (brandId: number, competitorId: number) => {
    if (!confirm('Hapus competitor ini?')) return;

    try {
      const res = await fetch(
        `/api/admin/brands/${brandId}/competitors?competitorId=${competitorId}`,
        {
          method: 'DELETE',
        },
      );

      if (!res.ok) throw new Error('Gagal menghapus');

      onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus');
    }
  };

  if (brands.length === 0) {
    return <p className="text-center py-8 text-slate-500">Belum ada data</p>;
  }

  return (
    <div className="space-y-4">
      {brands.map((brand) => (
        <div key={brand.id} className="border border-slate-200 rounded-lg p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-semibold text-slate-900">{brand.company_name}</h3>
              <p className="text-sm text-slate-700">Agency: {brand.agency_name || '-'}</p>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => onEdit(brand)}
                className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => onDelete(brand.id)}
                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          <div className="mt-3">
            <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Competitors</div>
            <div className="flex flex-wrap gap-2">
              {brand.competitors.map((comp) => (
                <span
                  key={comp.id}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded text-sm text-slate-900"
                >
                  {comp.competitor_name}
                  <button
                    onClick={() => handleRemoveCompetitor(brand.id, comp.competitor_company_id)}
                    className="text-slate-400 hover:text-red-500"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}

              {addingCompetitorFor === brand.id ? (
                <div className="inline-flex items-center gap-2">
                  <select
                    value={selectedCompetitor}
                    onChange={(e) => setSelectedCompetitor(e.target.value)}
                    className="text-sm border border-slate-300 rounded px-2 py-1"
                  >
                    <option value="">Pilih...</option>
                    {companies
                      .filter(
                        (c) =>
                          c.id !== brand.company_id &&
                          !brand.competitors.some((comp) => comp.competitor_company_id === c.id),
                      )
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                  <button
                    onClick={() => handleAddCompetitor(brand.id)}
                    className="p-1 text-green-600 hover:bg-green-50 rounded"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => {
                      setAddingCompetitorFor(null);
                      setSelectedCompetitor('');
                    }}
                    className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAddingCompetitorFor(brand.id)}
                  className="inline-flex items-center gap-1 px-2 py-1 text-blue-600 hover:bg-blue-50 rounded text-sm"
                >
                  <Plus size={14} />
                  Tambah
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Modal Component
function Modal({
  tab,
  mode,
  item,
  agencies,
  companies,
  onClose,
  onSave,
}: {
  tab: Tab;
  mode: 'add' | 'edit';
  item: any;
  agencies: Agency[];
  companies: Company[];
  onClose: () => void;
  onSave: (data: any) => void;
}) {
  const [formData, setFormData] = useState<any>(item || {});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await onSave(formData);
    setIsLoading(false);
  };

  const updateField = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-xl font-bold">
            {mode === 'add' ? 'Tambah' : 'Edit'} {tab.slice(0, -1)}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {tab === 'users' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Nama</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Username</label>
                <input
                  type="text"
                  value={formData.username || ''}
                  onChange={(e) => updateField('username', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">
                  Password {mode === 'edit' && '(kosongkan jika tidak diubah)'}
                </label>
                <input
                  type="password"
                  value={formData.password || ''}
                  onChange={(e) => updateField('password', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                  required={mode === 'add'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Agency</label>
                <select
                  value={formData.agency_id || ''}
                  onChange={(e) =>
                    updateField('agency_id', e.target.value ? parseInt(e.target.value) : null)
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                >
                  <option value="">- Tidak ada -</option>
                  {agencies.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Role</label>
                <select
                  value={formData.role || 'user'}
                  onChange={(e) => updateField('role', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </>
          )}

          {tab === 'agencies' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Nama</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Slug</label>
                <input
                  type="text"
                  value={formData.slug || ''}
                  onChange={(e) =>
                    updateField('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                  required
                />
              </div>
            </>
          )}

          {tab === 'companies' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Nama</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={formData.brand_name_display || ''}
                  onChange={(e) => updateField('brand_name_display', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Slug</label>
                <input
                  type="text"
                  value={formData.slug || ''}
                  onChange={(e) =>
                    updateField('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">Instagram</label>
                  <input
                    type="text"
                    value={formData.username_instagram || ''}
                    onChange={(e) => updateField('username_instagram', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                    placeholder="@username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">TikTok</label>
                  <input
                    type="text"
                    value={formData.username_tiktok || ''}
                    onChange={(e) => updateField('username_tiktok', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                    placeholder="@username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">Facebook</label>
                  <input
                    type="text"
                    value={formData.username_facebook || ''}
                    onChange={(e) => updateField('username_facebook', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">Twitter</label>
                  <input
                    type="text"
                    value={formData.username_twitter || ''}
                    onChange={(e) => updateField('username_twitter', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>
            </>
          )}

          {tab === 'brands' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Company</label>
                <select
                  value={formData.company_id || ''}
                  onChange={(e) => updateField('company_id', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                  required
                >
                  <option value="">Pilih company...</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Agency</label>
                <select
                  value={formData.agency_id || ''}
                  onChange={(e) =>
                    updateField('agency_id', e.target.value ? parseInt(e.target.value) : null)
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                >
                  <option value="">- Tidak ada -</option>
                  {agencies.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="flex gap-2 justify-end pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading && <Loader2 size={16} className="animate-spin" />}
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
