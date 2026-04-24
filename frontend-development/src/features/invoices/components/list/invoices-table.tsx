import type { ReactNode } from 'react';
import { Eye } from 'lucide-react';
import type { InvoiceItem, InvoicePaymentStatus } from '../../types/invoice.types';

interface InvoicesTableProps {
  invoices: InvoiceItem[];
  footer?: ReactNode;
}

const thBase =
  'border-none px-4 py-3 align-middle text-[11px] font-bold uppercase tracking-wider text-[#737784] first:pl-5 last:pr-5';

const statusPillClass = (status: InvoicePaymentStatus) => {
  switch (status) {
    case 'Paid':
      return 'bg-[#6ffbbe]/35 text-[#005236]';
    case 'Overdue':
      return 'bg-[#ffdad6] text-[#93000a]';
    case 'Pending Verification':
      return 'bg-[#d9e2ff] text-[#00419c]';
    case 'Partially Paid':
      return 'bg-[#d5e3fc] text-[#3a485b]';
    case 'Sent':
      return 'bg-[#d9e2ff] text-[#00419c]';
    case 'Draft':
      return 'bg-[#e0e3e5] text-[#434653]';
    case 'Ready to Send':
      return 'bg-[#d5e3fc] text-[#3a485b]';
    case 'Closed':
      return 'bg-[#e0e3e5] text-[#434653]';
    default:
      return 'bg-[#e0e3e5] text-[#434653]';
  }
};

const formatMoney = (amount: number) => new Intl.NumberFormat('id-ID').format(amount);

const formatDate = (date: string | null) =>
  date ? new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(date)) : '-';

export const InvoicesTable = ({ invoices, footer }: InvoicesTableProps) => {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[#eceef0]/80">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-none bg-[#eceef0]">
              <th className={`${thBase} text-left`}>Invoice / Project</th>
              <th className={`${thBase} text-left`}>Client</th>
              <th className={`${thBase} text-left`}>Service</th>
              <th className={`${thBase} text-right`}>Contract</th>
              <th className={`${thBase} text-right`}>Total Invoice</th>
              <th className={`${thBase} text-right`}>Settled</th>
              <th className={`${thBase} text-right`}>Outstanding</th>
              <th className={`${thBase} text-left`}>Next Due</th>
              <th className={`${thBase} text-center`}>Status</th>
              <th className={`${thBase} text-center`}>Progress</th>
              <th className={`${thBase} text-center`}>Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eceef0]">
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="group transition-colors hover:bg-[#eceef0]/30">
                <td className="py-3.5 pl-5 pr-4">
                  <p className="text-sm font-bold text-[#191c1e] transition-colors group-hover:text-[#191c1e]">
                    {invoice.invoiceCode}
                  </p>
                </td>
                <td className="px-4 py-3.5 text-xs font-medium text-[#434653]">{invoice.clientName}</td>
                <td className="px-4 py-3.5">
                  <span className="inline-flex rounded-full bg-[#d5e3fc] px-2.5 py-0.5 text-[11px] font-bold text-[#57657a]">
                    {invoice.serviceType}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-right text-xs font-medium text-[#434653]">{formatMoney(invoice.contractValue)}</td>
                <td className="px-4 py-3.5 text-right text-xs font-medium text-[#434653]">{formatMoney(invoice.totalInvoice)}</td>
                <td className="px-4 py-3.5 text-right text-xs font-medium text-[#006544]">{formatMoney(invoice.settledValue)}</td>
                <td
                  className={`px-4 py-3.5 text-right text-xs font-bold ${
                    invoice.paymentStatus === 'Overdue' ? 'text-[#ba1a1a]' : 'text-[#191c1e]'
                  }`}
                >
                  {formatMoney(invoice.outstandingValue)}
                </td>
                <td
                  className={`px-4 py-3.5 text-xs font-medium ${
                    invoice.paymentStatus === 'Overdue' ? 'text-[#ba1a1a]' : 'text-[#434653]'
                  }`}
                >
                  {formatDate(invoice.nextDueDate)}
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex justify-center">
                    <span
                      className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-[11px] font-bold tracking-tight ${statusPillClass(invoice.paymentStatus)}`}
                    >
                      {invoice.paymentStatus}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#eceef0]">
                      <div
                        className={`h-full ${invoice.paymentStatus === 'Overdue' ? 'bg-[#ba1a1a]' : 'bg-[#003c90]'}`}
                        style={{ width: `${invoice.paymentProgress}%` }}
                      />
                    </div>
                    <span
                      className={`text-[11px] font-medium ${
                        invoice.paymentStatus === 'Overdue' ? 'text-[#ba1a1a]' : 'text-[#737784]'
                      }`}
                    >
                      {invoice.paymentProgress}%
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      type="button"
                      className="rounded-md p-1.5 text-[#003c90] transition-colors hover:bg-[#d9e2ff] cursor-pointer"
                      aria-label="View invoice"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {footer}
    </div>
  );
};
