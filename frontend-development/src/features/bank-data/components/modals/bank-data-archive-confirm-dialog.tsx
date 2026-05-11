import type { BankDataEntry } from '../../types/bank-data.types';

interface BankDataArchiveConfirmDialogProps {
  open: boolean;
  entry?: BankDataEntry;
  busy?: boolean;
  onClose: () => void;
  onConfirm: (entry: BankDataEntry) => Promise<void> | void;
}

export const BankDataArchiveConfirmDialog = ({
  open,
  entry,
  busy = false,
  onClose,
  onConfirm
}: BankDataArchiveConfirmDialogProps) => {
  if (!open || !entry) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-900">Arsipkan lead ini?</h2>
        <p className="mt-2 text-sm text-slate-600">
          Lead yang diarsipkan akan tetap tersimpan di Bank Data, tetapi tidak akan diproses ke Lead Tracker.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              await onConfirm(entry);
            }}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            Ya, arsipkan
          </button>
        </div>
      </div>
    </div>
  );
};
