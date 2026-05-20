import { CheckCircle2 } from 'lucide-react';
import type { InvoiceActivityLogItem, InvoicePaymentHistoryItem } from '../../types/invoice.types';
import { formatCurrency, formatDate } from './invoice-detail-formatters';

interface InvoicePaymentHistoryTableProps {
  paymentHistory: InvoicePaymentHistoryItem[];
  activityLogs: InvoiceActivityLogItem[];
}

const formatDateTime = (iso?: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const InvoicePaymentHistoryTable = ({ paymentHistory, activityLogs }: InvoicePaymentHistoryTableProps) => {
  return (
    <section className="h-fit min-w-0 overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-[#eceef0] md:col-span-8">
      <div className="border-b border-[#eceef0] px-4 py-3 sm:px-6 sm:py-4">
        <h3 className="text-sm font-bold text-[#191c1e] sm:text-base">Riwayat Pembayaran</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-xs">
          <thead className="bg-[#f2f4f6] text-[10px] font-bold uppercase tracking-widest text-[#737784]">
            <tr>
              <th className="px-3 py-3 sm:px-6 sm:py-4">Tgl Transaksi</th>
              <th className="px-3 py-3 sm:px-6 sm:py-4">Termin</th>
              <th className="px-3 py-3 sm:px-6 sm:py-4">Uang Masuk</th>
              <th className="px-3 py-3 sm:px-6 sm:py-4">Metode</th>
              <th className="px-3 py-3 sm:px-6 sm:py-4">Diverifikasi Oleh</th>
              <th className="px-3 py-3 text-right sm:px-6 sm:py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eceef0]">
            {paymentHistory.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-[#737784] sm:px-6">
                  Belum ada riwayat pembayaran.
                </td>
              </tr>
            ) : (
              paymentHistory.map((history) => (
                <tr key={history.id}>
                  <td className="px-3 py-3 text-[#737784] sm:px-6 sm:py-4">{formatDate(history.transactionDate)}</td>
                  <td className="px-3 py-3 sm:px-6 sm:py-4">{history.installmentName}</td>
                  <td className="px-3 py-3 font-semibold text-[#004b31] sm:px-6 sm:py-4">{formatCurrency(history.amountReceived)}</td>
                  <td className="px-3 py-3 sm:px-6 sm:py-4">{history.method}</td>
                  <td className="px-3 py-3 sm:px-6 sm:py-4">{history.verifiedBy}</td>
                  <td className="px-3 py-3 text-right sm:px-6 sm:py-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        history.status === 'Verified'
                          ? 'bg-[#6ffbbe]/25 text-[#004b31]'
                          : 'bg-[#d9e2ff] text-[#00419c]'
                      }`}
                    >
                      {history.status === 'Verified' ? (
                        <CheckCircle2 className="h-3 w-3" aria-hidden />
                      ) : null}
                      {history.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t border-[#eceef0] bg-[#f7f9fb] p-4 sm:p-6">
        <h4 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-[#737784]">Activity Log</h4>
        {activityLogs.length === 0 ? (
          <p className="text-sm text-[#737784]">Belum ada aktivitas tercatat.</p>
        ) : (
          <div className="relative space-y-5 before:absolute before:bottom-2 before:left-[11px] before:top-2 before:w-[2px] before:bg-[#e0e3e5]">
            {activityLogs.map((log) => {
              const meta = [log.createdByName, formatDateTime(log.createdAt)].filter(Boolean).join(' · ');
              return (
                <div key={log.id} className="relative pl-10">
                  <div className="absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#003c90] text-white ring-4 ring-white">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                  </div>
                  <p className="text-sm font-bold text-[#191c1e]">{log.title}</p>
                  {log.description ? <p className="text-xs text-[#737784]">{log.description}</p> : null}
                  {meta ? <p className="mt-1 text-[10px] font-medium text-[#737784]">{meta}</p> : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
