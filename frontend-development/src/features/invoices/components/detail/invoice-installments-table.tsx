import { useMemo, useRef, useState, type MouseEvent } from 'react';
import { Download, Eye } from 'lucide-react';
import { Toast } from '../../../../components/ui/toast';
import { useToast } from '../../../../hooks/use-toast';
import { INVOICE_TOAST } from '../../constants/invoice-toast';
import type { InvoiceDetail, InvoiceInstallment } from '../../types/invoice.types';
import { buildInvoicePdfModel, downloadInvoiceTermPdf } from '../../pdf/invoice-pdf-service';
import type { InvoicePdfViewModel } from '../../pdf/invoice-pdf-types';
import { InvoicePdfHiddenHost } from '../invoice-pdf-hidden-host';
import { InvoiceTermDetailModal } from '../modals/invoice-term-detail-modal';
import { InvoiceTermGenerateConfirmDialog } from '../modals/invoice-term-generate-confirm-dialog';
import { InvoiceTermPaymentConfirmDialog } from '../modals/invoice-term-payment-confirm-dialog';
import { InvoiceTermSentConfirmDialog } from '../modals/invoice-term-sent-confirm-dialog';
import { useInvoicePermissions } from '../../hooks/use-invoice-permissions';
import { invoicesService } from '../../services/invoices-service';
import { formatCurrency, formatDate, shouldShowTermDueDate } from './invoice-detail-formatters';

interface InvoiceInstallmentsTableProps {
  invoiceDetail: InvoiceDetail;
  installments: InvoiceInstallment[];
  onDetailUpdated: (detail: InvoiceDetail) => void;
}

const termStatusClass = (statusDb: string) => {
  if (statusDb === 'PAID') return 'bg-[#6ffbbe]/25 text-[#004b31]';
  if (statusDb === 'OVERDUE') return 'bg-[#ffdad6] text-[#93000a]';
  if (statusDb === 'READY_TO_ISSUE') return 'bg-[#d5e3fc] text-[#3a485b]';
  if (statusDb === 'ISSUED' || statusDb === 'SENT') return 'bg-[#d9e2ff] text-[#00419c]';
  return 'bg-[#e0e3e5] text-[#434653]';
};

const canDownloadPdf = (statusDb: string) =>
  statusDb === 'ISSUED' || statusDb === 'SENT' || statusDb === 'PAID' || statusDb === 'OVERDUE';

export const InvoiceInstallmentsTable = ({
  invoiceDetail,
  installments,
  onDetailUpdated
}: InvoiceInstallmentsTableProps) => {
  const { canManageInvoices } = useInvoicePermissions();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [viewTermId, setViewTermId] = useState<string | null>(null);
  const [sentConfirmTermId, setSentConfirmTermId] = useState<string | null>(null);
  const [generateConfirmTermId, setGenerateConfirmTermId] = useState<string | null>(null);
  const [paymentConfirmTermId, setPaymentConfirmTermId] = useState<string | null>(null);
  const [paymentConfirmMeta, setPaymentConfirmMeta] = useState<{
    termName: string;
    amountLabel: string;
  } | null>(null);
  const [pendingAutoPdf, setPendingAutoPdf] = useState<InvoicePdfViewModel | null>(null);
  const pendingPaymentFormRef = useRef<FormData | null>(null);
  const { message: toastMessage, variant: toastVariant, dismiss: dismissToast, show: showToast } = useToast();

  const sentConfirmBusy = busyId != null && sentConfirmTermId != null && busyId === sentConfirmTermId;
  const generateConfirmBusy =
    busyId != null && generateConfirmTermId != null && busyId === generateConfirmTermId;
  const paymentConfirmBusy =
    busyId != null && paymentConfirmTermId != null && busyId === paymentConfirmTermId;

  const generateConfirmTermName = useMemo(
    () => installments.find((row) => row.id === generateConfirmTermId)?.termName,
    [installments, generateConfirmTermId]
  );

  const sentConfirmTermName = useMemo(
    () => installments.find((row) => row.id === sentConfirmTermId)?.termName,
    [installments, sentConfirmTermId]
  );

  const paymentConfirmTermName = useMemo(
    () => installments.find((row) => row.id === paymentConfirmTermId)?.termName,
    [installments, paymentConfirmTermId]
  );

  const handleDownload = async (id: string, e: MouseEvent) => {
    e.stopPropagation();
    try {
      setBusyId(id);
      await downloadInvoiceTermPdf(invoiceDetail, id);
    } catch (err) {
      console.error(err);
      window.alert('Gagal mengunduh PDF invoice. Silakan coba lagi.');
    } finally {
      setBusyId(null);
    }
  };

  const modalBusy = busyId != null && viewTermId != null && busyId === viewTermId;

  const handleGenerateConfirm = async () => {
    if (!generateConfirmTermId) return;
    try {
      setBusyId(generateConfirmTermId);
      const updated = await invoicesService.generateTerm(generateConfirmTermId);
      onDetailUpdated(updated);
      setGenerateConfirmTermId(null);
      setPendingAutoPdf(buildInvoicePdfModel(updated, generateConfirmTermId));
      const termLabel = generateConfirmTermName?.trim();
      showToast(
        termLabel ? `Invoice untuk ${termLabel} berhasil diterbitkan.` : INVOICE_TOAST.termGenerated,
        { immediate: true }
      );
    } catch (e) {
      showToast(e instanceof Error ? e.message : INVOICE_TOAST.termGenerateFailed, { variant: 'error' });
      setBusyId(null);
    }
  };

  const handlePaymentConfirm = async () => {
    const fd = pendingPaymentFormRef.current;
    if (!paymentConfirmTermId || !fd) return;
    try {
      setBusyId(paymentConfirmTermId);
      const updated = await invoicesService.recordTermPayment(paymentConfirmTermId, fd);
      onDetailUpdated(updated);
      setPaymentConfirmTermId(null);
      setPaymentConfirmMeta(null);
      pendingPaymentFormRef.current = null;
      const termLabel = paymentConfirmTermName?.trim();
      showToast(
        termLabel ? `Bukti pembayaran untuk ${termLabel} berhasil dicatat.` : INVOICE_TOAST.termPaymentRecorded,
        { immediate: true }
      );
    } catch (e) {
      showToast(e instanceof Error ? e.message : INVOICE_TOAST.termPaymentFailed, { variant: 'error' });
      setBusyId(null);
    }
  };

  const handleSentToClientConfirm = async () => {
    if (!sentConfirmTermId) return;
    try {
      setBusyId(sentConfirmTermId);
      const updated = await invoicesService.markTermSent(sentConfirmTermId);
      onDetailUpdated(updated);
      setSentConfirmTermId(null);
      const termLabel = sentConfirmTermName?.trim();
      showToast(
        termLabel
          ? `Invoice untuk ${termLabel} berhasil dikirim ke klien.`
          : INVOICE_TOAST.termSentToClient,
        { immediate: true }
      );
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : INVOICE_TOAST.termSentToClientFailed,
        { variant: 'error' }
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <section className="min-w-0 overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-[#eceef0]">
        <div className="border-b border-[#eceef0] px-4 py-3 sm:px-6 sm:py-4">
          <h3 className="text-sm font-bold text-[#191c1e] sm:text-base">Daftar Termin Pembayaran</h3>
          <p className="mt-1 text-xs text-[#737784]">
            {canManageInvoices
              ? 'Gunakan ikon View untuk aksi termin (kirim ke klien, upload pembayaran). Download untuk PDF.'
              : 'Mode baca saja: gunakan ikon View untuk detail termin. Download untuk PDF yang sudah diterbitkan.'}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-xs">
            <thead className="bg-[#f2f4f6] text-[10px] font-bold uppercase tracking-widest text-[#737784]">
              <tr>
                <th className="px-3 py-3 sm:px-6 sm:py-4">Invoice No</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4">Term Name</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4">Percentage</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4">Tax</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4">DPP</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4">Net Amount</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4">Billing Schedule</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4">Issue Date</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4">Due Date</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4">Status</th>
                <th className="px-3 py-3 text-right sm:px-6 sm:py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eceef0]">
              {installments.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-sm text-[#737784] sm:px-6">
                    Belum ada termin pembayaran.
                  </td>
                </tr>
              ) : (
                installments.map((item) => (
                  <tr key={item.id} className="hover:bg-[#f7f9fb]">
                    <td className="px-3 py-3 font-bold text-[#191c1e] sm:px-6 sm:py-4">{item.invoiceNumber}</td>
                    <td className="px-3 py-3 sm:px-6 sm:py-4">{item.termName}</td>
                    <td className="px-3 py-3 sm:px-6 sm:py-4">{item.percentage}%</td>
                    <td className="px-3 py-3 sm:px-6 sm:py-4">{item.taxScheme}</td>
                    <td className="px-3 py-3 font-semibold sm:px-6 sm:py-4">{formatCurrency(item.baseAmount)}</td>
                    <td className="px-3 py-3 font-semibold text-[#004b31] sm:px-6 sm:py-4">{formatCurrency(item.totalInvoice)}</td>
                    <td className="px-3 py-3 sm:px-6 sm:py-4">{formatDate(item.billingScheduleDate)}</td>
                    <td className="px-3 py-3 sm:px-6 sm:py-4">{formatDate(item.issuedDate)}</td>
                    <td className="px-3 py-3 sm:px-6 sm:py-4">
                      {shouldShowTermDueDate(item.statusDb) ? formatDate(item.dueDate) : '—'}
                    </td>
                    <td className="px-3 py-3 sm:px-6 sm:py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${termStatusClass(item.statusDb)}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right sm:px-6 sm:py-4">
                      <div className="inline-flex items-center justify-end gap-1">
                        <button
                          type="button"
                          title="View detail termin"
                          aria-label={`View ${item.termName}`}
                          onClick={() => setViewTermId(item.id)}
                          className="rounded-lg p-2 text-[#003c90] transition-colors hover:bg-[#d9e2ff]/60"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {canDownloadPdf(item.statusDb) ? (
                          <button
                            type="button"
                            title="Download invoice PDF"
                            aria-label={`Download ${item.termName}`}
                            disabled={busyId === item.id}
                            onClick={(e) => handleDownload(item.id, e)}
                            className="rounded-lg p-2 text-[#003c90] transition-colors hover:bg-[#d9e2ff]/60 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        ) : (
                          <span
                            className="inline-block w-9 p-2"
                            title="Download tersedia setelah invoice diterbitkan"
                            aria-hidden
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <InvoiceTermDetailModal
        open={viewTermId != null}
        invoiceDetail={invoiceDetail}
        termId={viewTermId ?? ''}
        canManageInvoices={canManageInvoices}
        busy={modalBusy}
        onBusyChange={(isBusy) => setBusyId(isBusy ? viewTermId : null)}
        onClose={() => {
          if (!modalBusy) setViewTermId(null);
        }}
        onDetailUpdated={onDetailUpdated}
        onRequestSentToClient={
          canManageInvoices
            ? () => {
                if (!viewTermId || modalBusy) return;
                const termId = viewTermId;
                setViewTermId(null);
                setSentConfirmTermId(termId);
              }
            : undefined
        }
        onRequestGenerateConfirm={
          canManageInvoices
            ? () => {
                if (!viewTermId || modalBusy) return;
                const termId = viewTermId;
                setViewTermId(null);
                setGenerateConfirmTermId(termId);
              }
            : undefined
        }
        onRequestPaymentConfirm={
          canManageInvoices
            ? (draft) => {
                if (!viewTermId || modalBusy) return;
                pendingPaymentFormRef.current = draft.buildFormData();
                setPaymentConfirmMeta({ termName: draft.termName, amountLabel: draft.amountLabel });
                setViewTermId(null);
                setPaymentConfirmTermId(draft.termId);
              }
            : undefined
        }
      />

      {canManageInvoices ? (
        <>
      <InvoiceTermGenerateConfirmDialog
        open={generateConfirmTermId != null}
        busy={generateConfirmBusy}
        termName={generateConfirmTermName}
        onClose={() => {
          if (!generateConfirmBusy) setGenerateConfirmTermId(null);
        }}
        onConfirm={handleGenerateConfirm}
      />

      <InvoiceTermPaymentConfirmDialog
        open={paymentConfirmTermId != null}
        busy={paymentConfirmBusy}
        termName={paymentConfirmMeta?.termName}
        amountLabel={paymentConfirmMeta?.amountLabel}
        onClose={() => {
          if (!paymentConfirmBusy) {
            setPaymentConfirmTermId(null);
            setPaymentConfirmMeta(null);
            pendingPaymentFormRef.current = null;
          }
        }}
        onConfirm={handlePaymentConfirm}
      />

      <InvoiceTermSentConfirmDialog
        open={sentConfirmTermId != null}
        busy={sentConfirmBusy}
        onClose={() => {
          if (!sentConfirmBusy) setSentConfirmTermId(null);
        }}
        onConfirm={handleSentToClientConfirm}
      />

      <InvoicePdfHiddenHost
        model={pendingAutoPdf}
        onComplete={() => setBusyId(null)}
        onError={() => setBusyId(null)}
      />
        </>
      ) : null}

      <Toast
        open={toastMessage != null}
        message={toastMessage ?? ''}
        variant={toastVariant}
        onClose={dismissToast}
      />
    </>
  );
};
