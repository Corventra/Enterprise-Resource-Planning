import { CheckCircle2 } from 'lucide-react';
import type { InvoicePaymentHistoryItem, InvoiceTimelineItem } from '../../types/invoice.types';
import { formatCurrency, formatDate } from './invoice-detail-formatters';

interface InvoicePaymentHistoryTableProps {
  paymentHistory: InvoicePaymentHistoryItem[];
  timeline: InvoiceTimelineItem[];
}

export const InvoicePaymentHistoryTable = ({ paymentHistory, timeline }: InvoicePaymentHistoryTableProps) => {
  return (
    <section className="h-fit overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-[#eceef0] lg:col-span-8">
      <div className="border-b border-[#eceef0] px-6 py-4">
        <h3 className="font-bold text-[#191c1e]">Riwayat Pembayaran</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#f2f4f6] text-[10px] font-bold uppercase tracking-widest text-[#737784]">
            <tr>
              <th className="px-6 py-4">Tgl Transaksi</th>
              <th className="px-6 py-4">Termin</th>
              <th className="px-6 py-4">Uang Masuk</th>
              <th className="px-6 py-4">Pajak</th>
              <th className="px-6 py-4">Metode</th>
              <th className="px-6 py-4">Diverifikasi Oleh</th>
              <th className="px-6 py-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eceef0]">
            {paymentHistory.map((history) => (
              <tr key={history.id}>
                <td className="px-6 py-4 text-[#737784]">{formatDate(history.transactionDate)}</td>
                <td className="px-6 py-4">{history.installmentName}</td>
                <td className="px-6 py-4 font-semibold text-[#004b31]">{formatCurrency(history.amountReceived)}</td>
                <td className="px-6 py-4">{history.taxScheme}</td>
                <td className="px-6 py-4">{history.method}</td>
                <td className="px-6 py-4">{history.verifiedBy}</td>
                <td className="px-6 py-4 text-right">
                  <CheckCircle2 className="ml-auto h-4 w-4 text-[#004b31]" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-[#f7f9fb] p-6">
        <h4 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-[#737784]">Timeline Aktivitas</h4>
        <div className="relative space-y-5 before:absolute before:bottom-2 before:left-[11px] before:top-2 before:w-[2px] before:bg-[#e0e3e5]">
          {timeline.map((item) => (
            <div key={item.id} className="relative pl-10">
              <div className="absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#003c90] text-white ring-4 ring-white">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </div>
              <p className="text-sm font-bold text-[#191c1e]">{item.title}</p>
              <p className="text-xs text-[#737784]">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
