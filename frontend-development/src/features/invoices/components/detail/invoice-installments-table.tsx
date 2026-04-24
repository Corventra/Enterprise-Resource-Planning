import type { InvoiceInstallment } from '../../types/invoice.types';
import { formatCurrency, formatDate } from './invoice-detail-formatters';

interface InvoiceInstallmentsTableProps {
  installments: InvoiceInstallment[];
}

export const InvoiceInstallmentsTable = ({ installments }: InvoiceInstallmentsTableProps) => {
  return (
    <section className="overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-[#eceef0]">
      <div className="border-b border-[#eceef0] px-6 py-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-[#191c1e]">Daftar Termin Pembayaran</h3>
          <button type="button" className="text-sm font-semibold text-[#003c90] hover:underline">
            Kelola Termin
          </button>
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
                  <button type="button" className="font-semibold text-[#003c90] hover:underline">
                    Detail
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
