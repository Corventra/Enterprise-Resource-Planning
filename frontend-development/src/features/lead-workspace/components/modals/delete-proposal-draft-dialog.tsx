import type { LeadWorkspaceProposalView } from '../../types/lead-proposals.types';

interface DeleteProposalDraftDialogProps {
  open: boolean;
  proposal?: LeadWorkspaceProposalView | null;
  busy?: boolean;
  onClose: () => void;
  onConfirm: (proposalId: string) => Promise<void> | void;
}

export const DeleteProposalDraftDialog = ({
  open,
  proposal,
  busy = false,
  onClose,
  onConfirm
}: DeleteProposalDraftDialogProps) => {
  if (!open || !proposal) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-900">Hapus draft proposal</h2>
        <p className="mt-2 text-sm text-slate-600">
          Hapus draft untuk <span className="font-semibold">{proposal.serviceName}</span>? Draft beserta dokumennya akan
          dihapus permanen.
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
              await onConfirm(proposal.id);
              onClose();
            }}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {busy ? 'Menghapus…' : 'Hapus draft'}
          </button>
        </div>
      </div>
    </div>
  );
};
