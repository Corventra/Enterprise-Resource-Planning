import { useState } from 'react';
import { Download } from 'lucide-react';
import type { InvoiceDetail, InvoiceInstallment } from '../../types/invoice.types';
import { downloadInvoiceTermPdf } from '../../pdf/invoice-pdf-service';
import { formatCurrency, formatDate } from './invoice-detail-formatters';

interface InvoiceInstallmentsTableProps {
  invoiceDetail: InvoiceDetail;
  installments: InvoiceInstallment[];
}

export const InvoiceInstallmentsTable = ({ invoiceDetail, installments }: InvoiceInstallmentsTableProps) => {
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleDownload = async (id: string) => {
    try {
      setBusyId(id);
      await downloadInvoiceTermPdf(invoiceDetail, id);
    } catch (e) {
      console.error(e);
      window.alert('Gagal mengunduh PDF invoice. Silakan coba lagi.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-[#eceef0]">
      <div className="border-b border-[#eceef0] px-6 py-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-[#191c1e]">Daftar Termin Pembayaran</h3>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#f2f4f6] text-[10px] font-bold uppercase tracking-widest text-[#737784]">
            <tr>
              <th className="px-6 py-4">No</th>
              <th className="px-6 py-4">Nomor Invoice Termin</th>
              <th className="px-6 py-4">Nama Termin</th>
              <th className="px-6 py-4">Persentase</th>
              <th className="px-6 py-4">Pajak</th>
              <th className="px-6 py-4">DPP</th>
              <th className="px-6 py-4">Total Bersih Termin</th>
              <th className="px-6 py-4">Tgl Terbit</th>
              <th className="px-6 py-4">Jatuh Tempo</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eceef0]">
            {installments.map((item) => (
              <tr key={item.id} className="hover:bg-[#f7f9fb]">
                <td className="px-6 py-4 text-[#737784]">{item.number}</td>
                <td className="px-6 py-4 font-bold text-[#191c1e]">{item.invoiceNumber}</td>
                <td className="px-6 py-4">{item.termName}</td>
                <td className="px-6 py-4">{item.percentage}%</td>
                <td className="px-6 py-4">{item.taxScheme}</td>
                <td className="px-6 py-4 font-semibold">{formatCurrency(item.baseAmount)}</td>
                <td className="px-6 py-4 font-semibold text-[#004b31]">
                  {formatCurrency(item.totalInvoice - Math.round(item.baseAmount * 0.02))}
                </td>
                <td className="px-6 py-4">{formatDate(item.issuedDate)}</td>
                <td className="px-6 py-4">{formatDate(item.dueDate)}</td>
                <td className="px-6 py-4">
                  <span className="rounded-full bg-[#6ffbbe]/25 px-3 py-1 text-[10px] font-bold uppercase text-[#004b31]">
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    type="button"
                    disabled={busyId === item.id}
                    onClick={() => handleDownload(item.id)}
                    className="inline-flex items-center gap-1.5 font-semibold text-[#003c90] hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Download className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {busyId === item.id ? 'Memuat…' : 'Download Invoice'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
