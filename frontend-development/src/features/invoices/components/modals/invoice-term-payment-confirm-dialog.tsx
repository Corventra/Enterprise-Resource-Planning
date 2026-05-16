import { FullscreenConfirmDialog } from '../../../../components/ui/fullscreen-confirm-dialog';

interface InvoiceTermPaymentConfirmDialogProps {
  open: boolean;
  busy?: boolean;
  termName?: string;
  amountLabel?: string;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

export const InvoiceTermPaymentConfirmDialog = ({
  open,
  busy = false,
  termName,
  amountLabel,
  onClose,
  onConfirm
}: InvoiceTermPaymentConfirmDialogProps) => {
  return (
    <FullscreenConfirmDialog open={open}>
      <div className="w-full max-w-md rounded-xl border border-[#eceef0] bg-white p-5 shadow-lg">
        <h2 className="text-base font-semibold text-[#191c1e]">Catat bukti pembayaran?</h2>
        {termName ? <p className="mt-1 text-sm font-medium text-[#434653]">{termName}</p> : null}
        {amountLabel ? (
          <p className="mt-1 text-sm font-semibold text-[#004b31]">Jumlah diterima: {amountLabel}</p>
        ) : null}
        <p className="mt-2 text-sm text-[#737784]">
          Pembayaran akan langsung tercatat sebagai terverifikasi. Jika total pembayaran termin sudah mencukupi,
          status termin menjadi Paid.
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
            className="rounded-lg bg-[#004b31] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {busy ? 'Memproses…' : 'Ya, catat pembayaran'}
          </button>
        </div>
      </div>
    </FullscreenConfirmDialog>
  );
};
