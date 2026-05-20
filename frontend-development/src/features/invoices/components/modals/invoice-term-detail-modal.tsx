import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { FileText } from 'lucide-react';
import {
  SidePanelDialog,
  SidePanelDialogBody,
  SidePanelDialogFooter,
  SidePanelDialogHeader
} from '../../../../components/ui/side-panel-dialog';
import type { InvoiceDetail, InvoicePaymentMethodDb } from '../../types/invoice.types';
import { invoicesService } from '../../services/invoices-service';
import { InvoicePaymentProofField } from './invoice-payment-proof-field';
import { formatCurrency, formatDate, shouldShowTermDueDate } from '../detail/invoice-detail-formatters';

interface InvoiceTermDetailModalProps {
  open: boolean;
  invoiceDetail: InvoiceDetail;
  termId: string;
  busy: boolean;
  onBusyChange: (busy: boolean) => void;
  onClose: () => void;
  onDetailUpdated: (detail: InvoiceDetail) => void;
  onRequestSentToClient?: () => void;
  onRequestGenerateConfirm?: () => void;
  onRequestPaymentConfirm?: (draft: {
    termId: string;
    termName: string;
    amountLabel: string;
    buildFormData: () => FormData;
  }) => void;
}

const termStatusClass = (statusDb: string) => {
  if (statusDb === 'PAID') return 'bg-[#6ffbbe]/25 text-[#004b31]';
  if (statusDb === 'OVERDUE') return 'bg-[#ffdad6] text-[#93000a]';
  if (statusDb === 'READY_TO_ISSUE') return 'bg-[#d5e3fc] text-[#3a485b]';
  if (statusDb === 'ISSUED' || statusDb === 'SENT') return 'bg-[#d9e2ff] text-[#00419c]';
  return 'bg-slate-100 text-slate-600';
};

const formatDateTimeId = (iso?: string | null) => {
  if (!iso) return 'â€”';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'â€”';
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const PAYMENT_METHOD_OPTIONS: { value: InvoicePaymentMethodDb; label: string }[] = [
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'CASH', label: 'Cash' },
  { value: 'GIRO', label: 'Giro' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'OTHER', label: 'Other' }
];

const labelClass = 'mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500';
const requiredMark = <span className="text-red-600"> *</span>;
const inputClass =
  'h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 focus:border-[#003c90] focus:outline-none disabled:bg-slate-50';

const primaryBtnClass =
  'rounded-lg bg-[linear-gradient(135deg,#003c90_0%,#0f52ba_100%)] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-[#003c90]/20 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50';

const successBtnClass =
  'rounded-lg bg-[#004b31] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50';

const proofLinkClass =
  'rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#003c90] hover:bg-slate-50';

const SectionCard = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
    <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-2.5">
      <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{title}</h3>
    </div>
    <div className="p-4">{children}</div>
  </section>
);

const MetaItem = ({ label, value }: { label: string; value: ReactNode }) => (
  <div>
    <p className={labelClass}>{label}</p>
    <div className="text-sm font-semibold text-slate-900">{value}</div>
  </div>
);

export const InvoiceTermDetailModal = ({
  open,
  invoiceDetail,
  termId,
  busy,
  onBusyChange,
  onClose,
  onDetailUpdated,
  onRequestSentToClient,
  onRequestGenerateConfirm,
  onRequestPaymentConfirm
}: InvoiceTermDetailModalProps) => {
  const term = useMemo(
    () => invoiceDetail.installments.find((row) => row.id === termId) ?? null,
    [invoiceDetail.installments, termId]
  );

  const termPayments = useMemo(
    () => invoiceDetail.paymentHistory.filter((p) => p.invoiceTermId === termId),
    [invoiceDetail.paymentHistory, termId]
  );

  const termProofPayments = useMemo(
    () => termPayments.filter((p) => Boolean(p.proofFileUrl)),
    [termPayments]
  );

  const showUploadedProofSection =
    termPayments.length > 0 ||
    term?.statusDb === 'PAID' ||
    term?.statusDb === 'SENT' ||
    term?.statusDb === 'OVERDUE';

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<InvoicePaymentMethodDb>('BANK_TRANSFER');
  const [transactionDate, setTransactionDate] = useState('');
  const [paymentChannel, setPaymentChannel] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);

  useEffect(() => {
    if (!open || !term) return;
    setActionError(null);
    setActionSuccess(null);
    const now = new Date();
    const ymd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    setTransactionDate(ymd);
    setPaymentMethod('BANK_TRANSFER');
    setPaymentChannel('');
    setProofFile(null);
  }, [open, term?.id]);

  const canSubmitPayment =
    Boolean(paymentMethod) &&
    Boolean(transactionDate.trim()) &&
    (term?.totalInvoice ?? 0) > 0 &&
    proofFile != null;

  const handlePanelOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && !busy) onClose();
  };

  const canConfirmProjectCompletion =
    term?.statusDb === 'DRAFT' &&
    (term.termType === 'FINAL' || term.billingTriggerType === 'PROJECT_COMPLETION');

  const showFooter =
    term?.statusDb === 'READY_TO_ISSUE' ||
    term?.statusDb === 'ISSUED' ||
    term?.statusDb === 'SENT' ||
    term?.statusDb === 'OVERDUE' ||
    canConfirmProjectCompletion;

  const handleConfirmProjectCompletion = async () => {
    if (!term) return;
    if (
      !window.confirm(
        'Konfirmasi project selesai untuk termin pelunasan? Setelah dikonfirmasi, termin menjadi Ready to Issue dan dapat digenerate.'
      )
    ) {
      return;
    }
    onBusyChange(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const updated = await invoicesService.confirmTermTrigger(term.id);
      onDetailUpdated(updated);
      setActionSuccess('Project completion dikonfirmasi. Termin siap digenerate.');
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Gagal mengonfirmasi project completion.');
    } finally {
      onBusyChange(false);
    }
  };

  const buildPaymentFormData = () => {
    const fd = new FormData();
    fd.append('payment_method', paymentMethod);
    fd.append('transaction_date', transactionDate);
    fd.append('amount_received_net', String(term?.totalInvoice ?? ''));
    if (paymentChannel.trim()) fd.append('payment_channel', paymentChannel.trim());
    if (proofFile) fd.append('proof_file', proofFile);
    return fd;
  };

  const tryRequestPaymentConfirm = () => {
    if (!term) return;
    const missing: string[] = [];
    if (!paymentMethod) missing.push('metode pembayaran');
    if (!transactionDate.trim()) missing.push('tanggal transaksi');
    if (!term.totalInvoice || term.totalInvoice <= 0) missing.push('jumlah diterima');
    if (!proofFile) missing.push('upload bukti pembayaran');
    if (missing.length > 0) {
      setActionError(`Lengkapi ${missing.join(', ')}.`);
      return;
    }
    setActionError(null);
    onRequestPaymentConfirm?.({
      termId: term.id,
      termName: term.termName,
      amountLabel: formatCurrency(term.totalInvoice),
      buildFormData: buildPaymentFormData
    });
  };

  return (
    <>
      <SidePanelDialog open={open && term != null} onOpenChange={handlePanelOpenChange} className="max-w-3xl">
        {term ? (
          <>
            <SidePanelDialogHeader
              title="Detail Termin Invoice"
              description="Kelola termin ini: generate invoice, kirim ke klien, atau catat bukti pembayaran."
            />

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-50/50">
              <SidePanelDialogBody className="min-h-0 flex-1 basis-0 space-y-4">
              {actionError ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">{actionError}</p>
              ) : null}
              {actionSuccess ? (
                <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900">
                  {actionSuccess}
                </p>
              ) : null}

              <SectionCard title="Informasi Termin">
                <div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
                  <MetaItem
                    label="Status"
                    value={
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${termStatusClass(term.statusDb)}`}
                      >
                        {term.status}
                      </span>
                    }
                  />
                  <MetaItem label="Invoice No" value={term.invoiceNumber} />
                  <MetaItem label="Billing Schedule" value={formatDate(term.billingScheduleDate)} />
                  <MetaItem label="Issue Date" value={formatDate(term.issuedDate)} />
                  {shouldShowTermDueDate(term.statusDb) ? (
                    <MetaItem label="Tenggat" value={formatDate(term.dueDate)} />
                  ) : null}
                  {term.sentToClientAt ? (
                    <MetaItem label="Sent to Client" value={formatDateTimeId(term.sentToClientAt)} />
                  ) : null}
                  <MetaItem label="Tax" value={term.taxScheme} />
                </div>
              </SectionCard>

              <SectionCard title="Rincian Nilai">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[320px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                        <th className="pb-2 pr-3">DPP</th>
                        <th className="pb-2 pr-3">PPN</th>
                        <th className="pb-2 pr-3">PPh23</th>
                        <th className="pb-2 pr-3">Gross</th>
                        <th className="pb-2">Net</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="font-semibold text-slate-900">
                        <td className="pt-1 pr-3">{formatCurrency(term.baseAmount)}</td>
                        <td className="pt-1 pr-3">{formatCurrency(term.ppnAmount)}</td>
                        <td className="pt-1 pr-3">{formatCurrency(term.pph23Amount)}</td>
                        <td className="pt-1 pr-3">{formatCurrency(term.grossAmount)}</td>
                        <td className="pt-1 font-bold text-[#004b31]">{formatCurrency(term.totalInvoice)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </SectionCard>

              {showUploadedProofSection ? (
                <SectionCard title="Bukti Pembayaran Terupload">
                  {termProofPayments.length === 0 ? (
                    <p className="text-sm text-slate-500">Belum ada bukti pembayaran.</p>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {termProofPayments.map((payment) => (
                        <li
                          key={payment.id}
                          className="flex flex-wrap items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
                        >
                          <div className="flex min-w-0 flex-1 items-start gap-3">
                            <div className="rounded-md bg-slate-100 p-2">
                              <FileText className="h-5 w-5 text-[#003c90]" strokeWidth={1.75} />
                            </div>
                            <div className="min-w-0">
                              <p
                                className="truncate text-sm font-semibold text-slate-900"
                                title={payment.proofFileName ?? undefined}
                              >
                                {payment.proofFileName ?? 'Bukti pembayaran'}
                              </p>
                              <p className="mt-0.5 text-xs text-slate-500">
                                Tgl transaksi {formatDate(payment.transactionDate)} ·{' '}
                                {formatCurrency(payment.amountReceived)} · {payment.method}
                                {payment.verifiedBy !== '—' ? ` · ${payment.verifiedBy}` : ''}
                              </p>
                            </div>
                          </div>
                          {payment.proofFileUrl ? (
                            <div className="flex shrink-0 gap-2">
                              <a
                                href={payment.proofFileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={proofLinkClass}
                              >
                                Lihat
                              </a>
                              <a
                                href={payment.proofFileUrl}
                                download={payment.proofFileName ?? true}
                                className={proofLinkClass}
                              >
                                Download
                              </a>
                            </div>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </SectionCard>
              ) : null}

              {canConfirmProjectCompletion ? (
                <p className="rounded-lg border border-amber-100 bg-amber-50/80 px-4 py-3 text-sm text-slate-700">
                  Termin pelunasan menunggu konfirmasi project completion. Setelah dikonfirmasi, status menjadi{' '}
                  <span className="font-semibold">Ready to Issue</span>.
                </p>
              ) : null}

              {term.statusDb === 'DRAFT' && term.termType === 'INSTALLMENT' ? (
                <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  Termin installment aktif otomatis saat{' '}
                  <span className="font-semibold">billing schedule date</span> tercapai (
                  {formatDate(term.billingScheduleDate)}).
                </p>
              ) : null}

              {term.statusDb === 'READY_TO_ISSUE' ? (
                <p className="rounded-lg border border-blue-100 bg-blue-50/80 px-4 py-3 text-sm text-slate-700">
                  Termin siap diterbitkan. Generate invoice paling lambat{' '}
                  <span className="font-semibold">{formatDate(term.dueDate)}</span>. Klik{' '}
                  <span className="font-semibold">Generate Invoice</span> di bawah untuk membuat nomor invoice.
                </p>
              ) : null}

              {term.statusDb === 'ISSUED' ? (
                <p className="rounded-lg border border-blue-100 bg-blue-50/80 px-4 py-3 text-sm text-slate-700">
                  Invoice telah diterbitkan. Kirim ke klien paling lambat{' '}
                  <span className="font-semibold">{formatDate(term.dueDate)}</span> (1 hari sejak diterbitkan).
                </p>
              ) : null}

              {term.statusDb === 'SENT' || term.statusDb === 'OVERDUE' ? (
                <SectionCard title="Upload Bukti Pembayaran">
                  <p className="mb-4 text-xs leading-relaxed text-slate-500">
                    Upload bukti setelah klien membayar. Pembayaran langsung tercatat sebagai terverifikasi oleh admin
                    yang mengunggah. Jika total pembayaran termin sudah mencukupi, status termin menjadi Paid.
                  </p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelClass} htmlFor="inv-pay-method">
                        Metode Pembayaran
                        {requiredMark}
                      </label>
                      <select
                        id="inv-pay-method"
                        value={paymentMethod}
                        disabled={busy}
                        onChange={(e) => setPaymentMethod(e.target.value as InvoicePaymentMethodDb)}
                        className={inputClass}
                      >
                        {PAYMENT_METHOD_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="inv-pay-date">
                        Tanggal Transaksi
                        {requiredMark}
                      </label>
                      <input
                        id="inv-pay-date"
                        type="date"
                        value={transactionDate}
                        disabled={busy}
                        onChange={(e) => setTransactionDate(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="inv-pay-amount">
                        Jumlah Diterima (Rp)
                        {requiredMark}
                      </label>
                      <input
                        id="inv-pay-amount"
                        type="text"
                        readOnly
                        value={formatCurrency(term.totalInvoice)}
                        tabIndex={-1}
                        aria-readonly="true"
                        className={`${inputClass} cursor-default bg-slate-50 text-slate-700`}
                      />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="inv-pay-channel">
                        Channel (opsional)
                      </label>
                      <input
                        id="inv-pay-channel"
                        type="text"
                        value={paymentChannel}
                        disabled={busy}
                        onChange={(e) => setPaymentChannel(e.target.value)}
                        placeholder="BCA 1234567890"
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div className="mt-4 sm:col-span-2">
                    <label className={labelClass}>
                      Upload Bukti Pembayaran
                      {requiredMark}
                    </label>
                    <div className="mt-2">
                      <InvoicePaymentProofField
                        pendingFile={proofFile}
                        disabled={busy}
                        onSelectFile={setProofFile}
                        onClearPending={() => setProofFile(null)}
                      />
                    </div>
                  </div>
                </SectionCard>
              ) : null}

              </SidePanelDialogBody>

              {showFooter ? (
                <SidePanelDialogFooter className="bg-white">
                  <div className="flex justify-end gap-2">
                  {canConfirmProjectCompletion ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleConfirmProjectCompletion()}
                      className={primaryBtnClass}
                    >
                      {busy ? 'Memproses…' : 'Konfirmasi Project Selesai'}
                    </button>
                  ) : null}
                  {term.statusDb === 'READY_TO_ISSUE' ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onRequestGenerateConfirm?.()}
                      className={primaryBtnClass}
                    >
                      Generate Invoice
                    </button>
                  ) : null}
                  {term.statusDb === 'ISSUED' ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onRequestSentToClient?.()}
                      className={primaryBtnClass}
                    >
                      Sent to Client
                    </button>
                  ) : null}
                  {term.statusDb === 'SENT' || term.statusDb === 'OVERDUE' ? (
                    <button
                      type="button"
                      disabled={busy || !canSubmitPayment}
                      onClick={() => tryRequestPaymentConfirm()}
                      className={successBtnClass}
                    >
                      Upload Bukti Pembayaran
                    </button>
                  ) : null}
                </div>
              </SidePanelDialogFooter>
              ) : null}
            </div>
          </>
        ) : null}
      </SidePanelDialog>
    </>
  );
};
