import { FullscreenConfirmDialog } from '../../../../components/ui/fullscreen-confirm-dialog';

interface InvoiceTermSentConfirmDialogProps {
  open: boolean;
  busy?: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

export const InvoiceTermSentConfirmDialog = ({
  open,
  busy = false,
  onClose,
  onConfirm
}: InvoiceTermSentConfirmDialogProps) => {
  return (
    <FullscreenConfirmDialog open={open}>
      <div className="w-full max-w-md rounded-xl border border-[#eceef0] bg-white p-5 shadow-lg">
        <h2 className="text-base font-semibold text-[#191c1e]">Kirim invoice ke klien?</h2>
        <p className="mt-2 text-sm text-[#737784]">
          Status termin akan menjadi SENT. Due date diisi otomatis 14 hari dari tanggal kirim.
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
            {busy ? 'Memproses…' : 'Ya, kirim'}
          </button>
        </div>
      </div>
    </FullscreenConfirmDialog>
  );
};
