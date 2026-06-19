import { AlertCircle, Search, UserPlus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAuth } from '../../../app/store/auth-store';
import { FullscreenConfirmDialog } from '../../../components/ui/fullscreen-confirm-dialog';
import { Toast } from '../../../components/ui/toast';
import { useToast } from '../../../hooks/use-toast';
import { ResetPasswordDialog } from '../components/reset-password-dialog';
import { UserFormDialog } from '../components/user-form-dialog';
import { UserListTable } from '../components/user-list-table';
import { useAdminLookups } from '../hooks/use-admin-lookups';
import { useManagedUsers } from '../hooks/use-managed-users';
import type { ManagedUser, ManagedUserDraft } from '../types/admin.types';

export const UserManagementPage = () => {
  const { user: authUser } = useAuth();
  const { users, isLoading, error, create, update, resetPassword, remove } = useManagedUsers();
  const { roles, departments, isLoading: lookupsLoading, error: lookupsError } = useAdminLookups();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | string>('ALL');

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [activeUser, setActiveUser] = useState<ManagedUser | null>(null);
  const [formError, setFormError] = useState<string | undefined>(undefined);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);

  const [resetOpen, setResetOpen] = useState(false);
  const [resetError, setResetError] = useState<string | undefined>(undefined);
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<ManagedUser | null>(null);
  const { message: toastMessage, variant: toastVariant, dismiss: dismissToast, show: showToast } = useToast();

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== 'ALL' && u.role.code !== roleFilter) return false;
      if (!term) return true;
      return (
        u.email.toLowerCase().includes(term) ||
        u.name.toLowerCase().includes(term) ||
        u.role.name.toLowerCase().includes(term) ||
        u.departments.some((d) => d.code.toLowerCase().includes(term) || d.name.toLowerCase().includes(term))
      );
    });
  }, [users, search, roleFilter]);

  const summary = useMemo(() => {
    return {
      total: users.length,
      active: users.filter((u) => u.isActive).length,
      scoped: users.filter((u) => u.departments.length > 0).length
    };
  }, [users]);

  const openCreate = () => {
    setActiveUser(null);
    setFormMode('create');
    setFormError(undefined);
    setFormOpen(true);
  };

  const openEdit = (user: ManagedUser) => {
    setActiveUser(user);
    setFormMode('edit');
    setFormError(undefined);
    setFormOpen(true);
  };

  const openReset = (user: ManagedUser) => {
    setActiveUser(user);
    setResetError(undefined);
    setResetOpen(true);
  };

  const handleFormSubmit = async (draft: ManagedUserDraft, id?: number) => {
    setIsFormSubmitting(true);
    setFormError(undefined);
    try {
      if (formMode === 'create') {
        await create(draft);
      } else if (id !== undefined) {
        await update(id, draft);
      }
      setFormOpen(false);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Gagal menyimpan user');
    } finally {
      setIsFormSubmitting(false);
    }
  };

  const handleResetSubmit = async (newPassword: string) => {
    if (!activeUser) return;
    setIsResetSubmitting(true);
    setResetError(undefined);
    try {
      await resetPassword(activeUser.id, newPassword);
      setResetOpen(false);
    } catch (e) {
      setResetError(e instanceof Error ? e.message : 'Gagal reset password');
    } finally {
      setIsResetSubmitting(false);
    }
  };

  const handleDeleteRequest = (user: ManagedUser) => {
    setDeleteTarget(user);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    try {
      await remove(target.id);
      showToast(`User ${target.email} berhasil dihapus.`, { variant: 'success' });
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Gagal menghapus user', { variant: 'error' });
    }
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">User Management</h1>
          <p className="mt-1 text-sm text-slate-500">
            CRUD akun pengguna sistem (KF-15). Data tersimpan di MySQL backend. Akses Superadmin saja.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          disabled={lookupsLoading || roles.length === 0}
          className="inline-flex items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#003c90_0%,#0f52ba_100%)] px-4 py-2 text-sm font-bold text-white shadow-md shadow-[#003c90]/20 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <UserPlus className="h-4 w-4" /> Add User
        </button>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[#eceef0] bg-white px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wider text-[#737784]">Total User</p>
          <p className="mt-1 text-2xl font-bold text-[#191c1e]">{summary.total}</p>
        </div>
        <div className="rounded-xl border border-[#eceef0] bg-white px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wider text-[#737784]">Aktif</p>
          <p className="mt-1 text-2xl font-bold text-[#191c1e]">{summary.active}</p>
        </div>
        <div className="rounded-xl border border-[#eceef0] bg-white px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wider text-[#737784]">Punya Department</p>
          <p className="mt-1 text-2xl font-bold text-[#191c1e]">{summary.scoped}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#737784]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari email / nama / role / department..."
            className="w-full rounded-lg border border-[#eceef0] bg-white py-2 pl-9 pr-3 text-sm text-[#191c1e] shadow-sm focus:border-[#003c90]/40 focus:outline-none focus:ring-2 focus:ring-[#1d59c1]/20"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-lg border border-[#eceef0] bg-white px-3 py-2 text-sm text-[#191c1e] shadow-sm focus:border-[#003c90]/40 focus:outline-none focus:ring-2 focus:ring-[#1d59c1]/20"
        >
          <option value="ALL">Semua Role</option>
          {roles.map((r) => (
            <option key={r.code} value={r.code}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      {(error || lookupsError) && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {error ?? lookupsError}
        </div>
      )}

      <UserListTable
        users={filteredUsers}
        isLoading={isLoading}
        currentUserId={authUser?.id}
        onEdit={openEdit}
        onResetPassword={openReset}
        onDelete={handleDeleteRequest}
      />

      <UserFormDialog
        open={formOpen}
        mode={formMode}
        initialUser={activeUser}
        roles={roles}
        departments={departments}
        isSubmitting={isFormSubmitting}
        errorMessage={formError}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <ResetPasswordDialog
        open={resetOpen}
        user={activeUser}
        isSubmitting={isResetSubmitting}
        errorMessage={resetError}
        onClose={() => setResetOpen(false)}
        onSubmit={handleResetSubmit}
      />

      <FullscreenConfirmDialog open={deleteTarget !== null}>
        <div className="w-full max-w-md rounded-xl border border-[#eceef0] border-l-4 border-l-red-600 bg-white p-5 shadow-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden />
            <div className="flex-1">
              <h2 className="text-base font-semibold text-[#191c1e]">
                Hapus user {deleteTarget?.email}?
              </h2>
              <p className="mt-2 text-sm text-[#737784]">
                Tindakan ini tidak bisa dibatalkan.
              </p>
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className="rounded-lg border border-[#c3c6d5] px-4 py-2 text-sm font-medium text-[#434653] hover:bg-[#eceef0]"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              Ya, hapus
            </button>
          </div>
        </div>
      </FullscreenConfirmDialog>

      <Toast
        open={toastMessage !== null}
        message={toastMessage ?? ''}
        variant={toastVariant}
        onClose={dismissToast}
      />
    </div>
  );
};
