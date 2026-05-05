import { Save, UserPlus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  SidePanelDialog,
  SidePanelDialogBody,
  SidePanelDialogFooter,
  SidePanelDialogHeader
} from '../../../components/ui/side-panel-dialog';
import type { Role } from '../../../app/permissions';
import type {
  DepartmentOption,
  ManagedUser,
  ManagedUserDraft,
  RoleOption
} from '../types/admin.types';

interface UserFormDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  initialUser?: ManagedUser | null;
  roles: RoleOption[];
  departments: DepartmentOption[];
  isSubmitting?: boolean;
  errorMessage?: string;
  onClose: () => void;
  onSubmit: (draft: ManagedUserDraft, id?: number) => Promise<void> | void;
}

const buildInitialDraft = (user?: ManagedUser | null, roles?: RoleOption[]): ManagedUserDraft => {
  const fallbackRole = (roles?.[0]?.code ?? 'CONSULTANT') as Role;
  return {
    email: user?.email ?? '',
    name: user?.name ?? '',
    password: '',
    roleCode: (user?.role.code ?? fallbackRole) as Role,
    departmentCodes: user?.departments.map((d) => d.code) ?? []
  };
};

export const UserFormDialog = ({
  open,
  mode,
  initialUser,
  roles,
  departments,
  isSubmitting = false,
  errorMessage,
  onClose,
  onSubmit
}: UserFormDialogProps) => {
  const [draft, setDraft] = useState<ManagedUserDraft>(() => buildInitialDraft(initialUser, roles));
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDraft(buildInitialDraft(initialUser, roles));
      setLocalError(null);
    }
  }, [open, initialUser, roles]);

  const isEdit = mode === 'edit';
  const title = isEdit ? 'Edit User' : 'Add User';
  const description = isEdit
    ? `Ubah data user ${initialUser?.email ?? ''}. Kosongkan password jika tidak ingin mengganti.`
    : 'Buat akun user baru di backend. User langsung bisa login setelah disimpan.';

  const selectedRole = useMemo(
    () => roles.find((r) => r.code === draft.roleCode) ?? null,
    [roles, draft.roleCode]
  );

  const handleChange = <K extends keyof ManagedUserDraft>(key: K, value: ManagedUserDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const toggleDepartment = (code: string) => {
    setDraft((prev) => {
      const exists = prev.departmentCodes.includes(code);
      return {
        ...prev,
        departmentCodes: exists
          ? prev.departmentCodes.filter((c) => c !== code)
          : [...prev.departmentCodes, code]
      };
    });
  };

  const handleSubmit = async () => {
    setLocalError(null);
    if (!draft.email.trim() || !draft.name.trim()) {
      setLocalError('Email dan nama wajib diisi.');
      return;
    }
    if (!isEdit && !(draft.password ?? '').trim()) {
      setLocalError('Password wajib diisi saat membuat user baru.');
      return;
    }
    if (selectedRole?.isDepartmentScoped && draft.departmentCodes.length === 0) {
      setLocalError(`Role ${selectedRole.code} wajib punya minimal 1 department.`);
      return;
    }
    const payload: ManagedUserDraft = {
      email: draft.email.trim(),
      name: draft.name.trim(),
      password: (draft.password ?? '').trim() || undefined,
      roleCode: draft.roleCode,
      departmentCodes: draft.departmentCodes
    };
    await onSubmit(payload, initialUser?.id);
  };

  const inputClass =
    'w-full rounded-lg border border-[#eceef0] bg-white px-3 py-2 text-sm text-[#191c1e] shadow-sm placeholder:text-[#737784]/70 focus:border-[#003c90]/40 focus:outline-none focus:ring-2 focus:ring-[#1d59c1]/20';
  const labelClass = 'mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#737784]';

  return (
    <SidePanelDialog open={open} onOpenChange={(next) => !next && onClose()}>
      <SidePanelDialogHeader title={title} description={description} />
      <SidePanelDialogBody>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              value={draft.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="user@dsk-global.id"
              className={inputClass}
              autoComplete="off"
            />
          </div>

          <div>
            <label className={labelClass}>Nama Lengkap</label>
            <input
              type="text"
              value={draft.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Mis. Andi Pratama"
              className={inputClass}
              autoComplete="off"
            />
          </div>

          <div>
            <label className={labelClass}>Role</label>
            <select
              value={draft.roleCode}
              onChange={(e) => handleChange('roleCode', e.target.value as Role)}
              className={inputClass}
            >
              {roles.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.name} ({r.code}){r.isDepartmentScoped ? ' — wajib pilih department' : ''}
                </option>
              ))}
            </select>
            {selectedRole && (
              <p className="mt-1 text-[11px] text-[#737784]">
                {selectedRole.isDepartmentScoped
                  ? 'Role ini terikat ke department. Pilih minimal 1 di bawah.'
                  : 'Role all-spanning — tidak terikat department.'}
              </p>
            )}
          </div>

          <div>
            <label className={labelClass}>
              Department {selectedRole?.isDepartmentScoped && <span className="text-rose-600">*</span>}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {departments.map((d) => {
                const checked = draft.departmentCodes.includes(d.code);
                return (
                  <label
                    key={d.code}
                    className={
                      checked
                        ? 'flex items-center gap-2 rounded-md border border-[#003c90] bg-[#d5e3fc]/40 px-2.5 py-2 text-xs font-medium text-[#003c90] cursor-pointer'
                        : 'flex items-center gap-2 rounded-md border border-[#eceef0] bg-white px-2.5 py-2 text-xs text-[#191c1e] cursor-pointer hover:bg-[#f8fafc]'
                    }
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleDepartment(d.code)}
                      className="h-3.5 w-3.5"
                    />
                    <span className="flex-1">
                      <span className="font-mono text-[10px] text-[#737784]">{d.code}</span>
                      <br />
                      <span className="text-[11px]">{d.name}</span>
                    </span>
                  </label>
                );
              })}
            </div>
            {draft.departmentCodes.length > 0 && (
              <p className="mt-1.5 text-[11px] text-[#737784]">
                Primary department: <span className="font-bold text-[#003c90]">{draft.departmentCodes[0]}</span>{' '}
                (urut pilih = urut primary)
              </p>
            )}
          </div>

          <div>
            <label className={labelClass}>
              Password {isEdit && <span className="font-normal lowercase text-[#737784]">(opsional saat edit)</span>}
            </label>
            <input
              type="text"
              value={draft.password ?? ''}
              onChange={(e) => handleChange('password', e.target.value)}
              placeholder={isEdit ? 'Kosongkan untuk tidak mengubah' : 'Minimal 6 karakter'}
              className={inputClass}
              autoComplete="new-password"
            />
            {isEdit && (
              <p className="mt-1 text-[11px] text-[#737784]">
                Untuk reset password, gunakan tombol Reset di tabel — bukan field ini.
              </p>
            )}
          </div>

          {(localError || errorMessage) && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {localError ?? errorMessage}
            </div>
          )}
        </div>
      </SidePanelDialogBody>
      <SidePanelDialogFooter>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg border border-[#c3c6d5] bg-white px-4 py-2 text-sm font-semibold text-[#191c1e] transition-colors hover:bg-[#f2f4f6] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#003c90_0%,#0f52ba_100%)] px-5 py-2 text-sm font-bold text-white shadow-md shadow-[#003c90]/20 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isEdit ? <Save className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            {isSubmitting ? 'Menyimpan...' : isEdit ? 'Save Changes' : 'Create User'}
          </button>
        </div>
      </SidePanelDialogFooter>
    </SidePanelDialog>
  );
};
