import { Save, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  SidePanelDialog,
  SidePanelDialogBody,
  SidePanelDialogFooter,
  SidePanelDialogHeader
} from '../../../components/ui/side-panel-dialog';
import type { ManagedDepartment } from '../types/admin.types';

interface DepartmentFormDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  initialDepartment?: ManagedDepartment | null;
  isSubmitting?: boolean;
  errorMessage?: string;
  onClose: () => void;
  onSubmit: (
    data: { code?: string; name: string; isActive?: boolean },
    id?: number
  ) => Promise<void> | void;
}

interface DraftState {
  code: string;
  name: string;
  isActive: boolean;
}

const buildInitialDraft = (dept?: ManagedDepartment | null): DraftState => ({
  code: dept?.code ?? '',
  name: dept?.name ?? '',
  isActive: dept?.isActive ?? true
});

const CODE_RE = /^[A-Z][A-Z0-9_]{1,31}$/;

export const DepartmentFormDialog = ({
  open,
  mode,
  initialDepartment,
  isSubmitting = false,
  errorMessage,
  onClose,
  onSubmit
}: DepartmentFormDialogProps) => {
  const [draft, setDraft] = useState<DraftState>(() => buildInitialDraft(initialDepartment));
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDraft(buildInitialDraft(initialDepartment));
      setLocalError(null);
    }
  }, [open, initialDepartment]);

  const isEdit = mode === 'edit';
  const title = isEdit ? 'Edit Department' : 'Add Department';
  const description = isEdit
    ? `Ubah department "${initialDepartment?.code}". Code tidak bisa diubah — hanya nama & status.`
    : 'Tambah service line / unit baru. Code akan auto-uppercase, immutable setelah dibuat.';

  const handleCodeChange = (raw: string) => {
    setDraft((prev) => ({ ...prev, code: raw.toUpperCase() }));
  };

  const handleSubmit = async () => {
    setLocalError(null);
    if (!draft.name.trim()) {
      setLocalError('Nama department wajib diisi.');
      return;
    }
    if (!isEdit) {
      if (!draft.code.trim()) {
        setLocalError('Code wajib diisi.');
        return;
      }
      if (!CODE_RE.test(draft.code)) {
        setLocalError('Code harus mulai huruf besar, alphanum + underscore, 2-32 karakter.');
        return;
      }
    }

    if (isEdit) {
      await onSubmit(
        { name: draft.name.trim(), isActive: draft.isActive },
        initialDepartment?.id
      );
    } else {
      await onSubmit({ code: draft.code, name: draft.name.trim() });
    }
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
            <label className={labelClass}>
              Code {!isEdit && <span className="text-rose-600">*</span>}
            </label>
            <input
              type="text"
              value={draft.code}
              onChange={(e) => handleCodeChange(e.target.value)}
              placeholder="Mis. RESEARCH, MARKETING, IT_SUPPORT"
              className={`${inputClass} font-mono ${isEdit ? 'bg-[#f8fafc] cursor-not-allowed text-[#737784]' : ''}`}
              disabled={isEdit}
              autoComplete="off"
            />
            <p className="mt-1 text-[11px] text-[#737784]">
              {isEdit
                ? 'Code immutable — referenced di JWT, permission, dan project service line.'
                : 'Auto-uppercase. Mulai dengan huruf, boleh alphanum + underscore.'}
            </p>
          </div>

          <div>
            <label className={labelClass}>Nama Lengkap</label>
            <input
              type="text"
              value={draft.name}
              onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Mis. Research & Development"
              className={inputClass}
              autoComplete="off"
            />
          </div>

          {isEdit && (
            <div>
              <label className="flex items-start gap-3 rounded-lg border border-[#eceef0] bg-white p-3 hover:bg-[#f8fafc]">
                <input
                  type="checkbox"
                  checked={draft.isActive}
                  onChange={(e) => setDraft((prev) => ({ ...prev, isActive: e.target.checked }))}
                  className="mt-1 h-4 w-4"
                />
                <div className="flex-1">
                  <p className="text-sm font-bold text-[#191c1e]">Department Aktif</p>
                  <p className="text-xs text-[#737784]">
                    Department inaktif tidak muncul di dropdown saat add/edit user. User existing
                    yang sudah ter-assign tetap valid sampai di-reassign manual.
                  </p>
                </div>
              </label>
            </div>
          )}

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
            {isEdit ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {isSubmitting ? 'Menyimpan...' : isEdit ? 'Save Changes' : 'Create Department'}
          </button>
        </div>
      </SidePanelDialogFooter>
    </SidePanelDialog>
  );
};
