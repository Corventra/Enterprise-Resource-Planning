import { useEffect, useState } from 'react';

interface RejectProposalDialogProps {
  open: boolean;
  busy?: boolean;
  onClose: () => void;
  onConfirm: (note: string) => Promise<void> | void;
}

export const RejectProposalDialog = ({ open, busy = false, onClose, onConfirm }: RejectProposalDialogProps) => {
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!open) {
      setNote('');
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const handleClose = () => {
    if (busy) return;
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
      <div className="w-full max-w-md rounded-xl border border-[#eceef0] bg-white p-5 shadow-lg">
        <h2 className="text-base font-semibold text-[#191c1e]">Tolak proposal ini?</h2>
        <p className="mt-2 text-sm text-[#737784]">Proposal akan dikembalikan ke BD untuk direvisi.</p>
        <label className="mt-4 block text-sm font-medium text-[#191c1e]">
          Revision Note
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={4}
            className="mt-2 w-full rounded-lg border border-[#c3c6d5] px-3 py-2 text-sm text-[#191c1e] outline-none focus:border-[#003c90]"
            placeholder="Jelaskan revisi yang dibutuhkan"
          />
        </label>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={busy}
            className="rounded-lg border border-[#c3c6d5] px-4 py-2 text-sm font-medium text-[#434653] hover:bg-[#eceef0] disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={busy || note.trim().length === 0}
            onClick={async () => {
              await onConfirm(note.trim());
            }}
            className="rounded-lg bg-[#003c90] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            Kirim revisi
          </button>
        </div>
      </div>
    </div>
  );
};
