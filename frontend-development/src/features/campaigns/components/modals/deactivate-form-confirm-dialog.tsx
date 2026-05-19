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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-900">Deactivate form permanently</h2>
        <p className="mt-2 text-sm text-slate-600">
          Deactivate <span className="font-semibold">{form.name}</span>? It will be marked inactive, will no longer
          accept new responses, and cannot be restored to Published.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              await onConfirm(form.id);
              onClose();
            }}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {busy ? 'Processing…' : 'Deactivate form'}
          </button>
        </div>
      </div>
    </div>
  );
};
