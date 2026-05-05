import { Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DepartmentFormDialog } from '../components/department-form-dialog';
import { DepartmentListTable } from '../components/department-list-table';
import { useManagedDepartments } from '../hooks/use-managed-departments';
import type { ManagedDepartment } from '../types/admin.types';

export const DepartmentManagementPage = () => {
  const { departments, isLoading, error, create, update, setActive, remove } = useManagedDepartments();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [activeDept, setActiveDept] = useState<ManagedDepartment | null>(null);
  const [formError, setFormError] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return departments.filter((d) => {
      if (statusFilter === 'ACTIVE' && !d.isActive) return false;
      if (statusFilter === 'INACTIVE' && d.isActive) return false;
      if (!term) return true;
      return d.code.toLowerCase().includes(term) || d.name.toLowerCase().includes(term);
    });
  }, [departments, search, statusFilter]);

  const summary = useMemo(() => {
    return {
      total: departments.length,
      active: departments.filter((d) => d.isActive).length,
      assigned: departments.filter((d) => d.userCount > 0).length
    };
  }, [departments]);

  const openCreate = () => {
    setActiveDept(null);
    setFormMode('create');
    setFormError(undefined);
    setFormOpen(true);
  };

  const openEdit = (dept: ManagedDepartment) => {
    setActiveDept(dept);
    setFormMode('edit');
    setFormError(undefined);
    setFormOpen(true);
  };

  const handleFormSubmit = async (
    data: { code?: string; name: string; isActive?: boolean },
    id?: number
  ) => {
    setIsSubmitting(true);
    setFormError(undefined);
    try {
      if (formMode === 'create' && data.code) {
        await create({ code: data.code, name: data.name });
      } else if (id !== undefined) {
        await update(id, { name: data.name, isActive: data.isActive });
      }
      setFormOpen(false);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Gagal menyimpan department');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (dept: ManagedDepartment) => {
    try {
      await setActive(dept.id, !dept.isActive);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Gagal mengubah status');
    }
  };

  const handleDelete = async (dept: ManagedDepartment) => {
    const ok = window.confirm(
      `Hapus department "${dept.code} — ${dept.name}"? Tindakan ini tidak bisa dibatalkan.`
    );
    if (!ok) return;
    try {
      await remove(dept.id);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Gagal menghapus department');
    }
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Department Management</h1>
          <p className="mt-1 text-sm text-slate-500">
            Kelola service line & sub-unit organisasi (Tax, Audit, Transfer Pricing, dll). Akses
            Superadmin saja.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#003c90_0%,#0f52ba_100%)] px-4 py-2 text-sm font-bold text-white shadow-md shadow-[#003c90]/20 transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Add Department
        </button>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[#eceef0] bg-white px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wider text-[#737784]">Total</p>
          <p className="mt-1 text-2xl font-bold text-[#191c1e]">{summary.total}</p>
        </div>
        <div className="rounded-xl border border-[#eceef0] bg-white px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wider text-[#737784]">Aktif</p>
          <p className="mt-1 text-2xl font-bold text-[#191c1e]">{summary.active}</p>
        </div>
        <div className="rounded-xl border border-[#eceef0] bg-white px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wider text-[#737784]">Punya User</p>
          <p className="mt-1 text-2xl font-bold text-[#191c1e]">{summary.assigned}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#737784]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari code atau nama department..."
            className="w-full rounded-lg border border-[#eceef0] bg-white py-2 pl-9 pr-3 text-sm text-[#191c1e] shadow-sm focus:border-[#003c90]/40 focus:outline-none focus:ring-2 focus:ring-[#1d59c1]/20"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')}
          className="rounded-lg border border-[#eceef0] bg-white px-3 py-2 text-sm text-[#191c1e] shadow-sm focus:border-[#003c90]/40 focus:outline-none focus:ring-2 focus:ring-[#1d59c1]/20"
        >
          <option value="ALL">Semua Status</option>
          <option value="ACTIVE">Aktif Saja</option>
          <option value="INACTIVE">Inaktif Saja</option>
        </select>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {error}
        </div>
      )}

      <DepartmentListTable
        departments={filtered}
        isLoading={isLoading}
        onEdit={openEdit}
        onToggleActive={handleToggleActive}
        onDelete={handleDelete}
      />

      <DepartmentFormDialog
        open={formOpen}
        mode={formMode}
        initialDepartment={activeDept}
        isSubmitting={isSubmitting}
        errorMessage={formError}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
};
