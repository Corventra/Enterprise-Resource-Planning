interface MarkProposalRespondedDialogProps {
  open: boolean;
  busy?: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

export const MarkProposalRespondedDialog = ({
  open,
  busy = false,
  onClose,
  onConfirm
}: MarkProposalRespondedDialogProps) => {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
      <div className="w-full max-w-md rounded-xl border border-[#eceef0] bg-white p-5 shadow-lg">
        <h2 className="text-base font-semibold text-[#191c1e]">Proposal sudah direspons client?</h2>
        <p className="mt-2 text-sm text-[#737784]">
          Setelah ditandai direspons, lead akan lanjut ke tahap Engagement Letter.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg border border-[#c3c6d5] px-4 py-2 text-sm font-medium text-[#434653] hover:bg-[#eceef0] disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              await onConfirm();
            }}
            className="rounded-lg bg-[#003c90] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            Ya, tandai direspons
          </button>
        </div>
      </div>
    </div>
  );
};
