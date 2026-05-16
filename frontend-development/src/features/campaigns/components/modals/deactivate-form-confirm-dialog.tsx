import type { Form } from '../../types/campaign.types';

interface DeactivateFormConfirmDialogProps {
  open: boolean;
  form?: Form;
  busy?: boolean;
  onClose: () => void;
  onConfirm: (formId: string) => Promise<void> | void;
}

export const DeactivateFormConfirmDialog = ({
  open,
  form,
  busy = false,
  onClose,
  onConfirm
}: DeactivateFormConfirmDialogProps) => {
  if (!open || !form) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-lg">
        <h2 className="text-base font-semibold text-slate-900">Nonaktifkan form permanen</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Anda akan menonaktifkan form <span className="font-semibold text-slate-900">{form.name}</span> secara
          permanen.
        </p>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-slate-600">
          <li>Form tidak dapat dikembalikan ke status Published.</li>
          <li>Form tidak akan menerima respons baru melalui link distribusi.</li>
          <li>Anda tetap dapat melihat pratinjau dan riwayat link di tab Forms.</li>
        </ul>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void onConfirm(form.id)}
            className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800 disabled:opacity-50"
          >
            {busy ? 'Memproses…' : 'Ya, nonaktifkan permanen'}
          </button>
        </div>
      </div>
    </div>
  );
};
