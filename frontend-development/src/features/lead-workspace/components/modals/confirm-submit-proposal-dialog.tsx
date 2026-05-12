import {
  SidePanelDialog,
  SidePanelDialogBody,
  SidePanelDialogFooter,
  SidePanelDialogHeader
} from '../../../../components/ui/side-panel-dialog';

interface ConfirmSubmitProposalDialogProps {
  open: boolean;
  busy?: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

export const ConfirmSubmitProposalDialog = ({
  open,
  busy = false,
  onClose,
  onConfirm
}: ConfirmSubmitProposalDialogProps) => {
  if (!open) {
    return null;
  }

  const handleClose = () => {
    if (busy) return;
    onClose();
  };

  return (
    <SidePanelDialog open={open} onOpenChange={(nextOpen) => !nextOpen && handleClose()}>
      <SidePanelDialogHeader
        title="Submit Proposal"
        description="Proposal akan diajukan ke CEO dan tidak bisa diedit lagi sampai ada keputusan review."
      />
      <SidePanelDialogBody>
        <p className="text-sm text-slate-600">
          Pastikan data proposal dan dokumen sudah benar. Setelah submit, status proposal menjadi Waiting CEO Approval.
        </p>
      </SidePanelDialogBody>
      <SidePanelDialogFooter>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={busy}
            className="rounded-lg border border-[#c3c6d5] px-4 py-2 text-sm font-semibold text-[#434653] hover:bg-[#eceef0] disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void onConfirm()}
            className="rounded-lg bg-[linear-gradient(135deg,#003c90_0%,#0f52ba_100%)] px-4 py-2 text-sm font-bold text-white shadow-md shadow-[#003c90]/20 transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {busy ? 'Submitting...' : 'Submit Proposal'}
          </button>
        </div>
      </SidePanelDialogFooter>
    </SidePanelDialog>
  );
};
