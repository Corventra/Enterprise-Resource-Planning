import type { ReactNode } from 'react';
import { Eye } from 'lucide-react';
import type { InvoiceItem } from '../../types/invoice.types';
import { isInvoiceListDueOverdue } from '../../utils/invoice-list-due-date';

interface InvoicesTableProps {
  invoices: InvoiceItem[];
  onView: (invoice: InvoiceItem) => void;
  footer?: ReactNode;
}

const thBase =
  'border-none px-4 py-3 align-middle text-[11px] font-bold uppercase tracking-wider text-[#737784] first:pl-5 last:pr-5';

const statusPillClass = (statusDb: string) => {
  switch (statusDb) {
    case 'SETTLED':
      return 'bg-[#6ffbbe]/35 text-[#005236]';
    case 'OVERDUE':
      return 'bg-[#ffdad6] text-[#93000a]';
    case 'AWAITING_PAYMENT':
      return 'bg-[#d9e2ff] text-[#00419c]';
    case 'READY_TO_BILL':
      return 'bg-[#d5e3fc] text-[#3a485b]';
    default:
      return 'bg-[#e0e3e5] text-[#434653]';
  }
};

const formatMoney = (amount: number) => new Intl.NumberFormat('id-ID').format(amount);

const formatDate = (date: string | null) =>
  date
    ? new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(
        new Date(`${date}T00:00:00`)
      )
    : '-';

export const InvoicesTable = ({ invoices, onView, footer }: InvoicesTableProps) => {
  if (invoices.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#c3c6d5] bg-white p-7 text-center shadow-sm">
        <h3 className="text-sm font-semibold text-[#191c1e]">No invoices found</h3>
        <p className="mt-1.5 text-xs text-[#737784] sm:text-sm">Try adjusting your filters or reset filters to show invoice list.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[#eceef0]/80">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-none bg-[#eceef0]">
              <th className={`${thBase} text-left`}>Client</th>
              <th className={`${thBase} text-left`}>Service</th>
              <th className={`${thBase} text-right`}>Contract Value</th>
              <th className={`${thBase} text-right`}>Estimated Net Receipt</th>
              <th className={`${thBase} text-left`}>Tindakan & Tenggat</th>
              <th className={`${thBase} text-center`}>Status</th>
              <th className={`${thBase} text-center`}>Progress</th>
              <th className={`${thBase} text-center`}>Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eceef0]">
            {invoices.map((invoice) => {
              const isOverdue = isInvoiceListDueOverdue(invoice);

              return (
              <tr
                key={invoice.id}
                className={`group transition-colors ${
                  isOverdue ? 'bg-[#ffdad6]/60 hover:bg-[#ffdad6]/80' : 'hover:bg-[#eceef0]/30'
                }`}
              >
                <td className="py-3.5 pl-5 pr-4 text-xs font-medium text-[#434653]">{invoice.clientName}</td>
                <td className="px-4 py-3.5">
                  <span className="inline-flex rounded-full bg-[#d5e3fc] px-2.5 py-0.5 text-[11px] font-bold text-[#57657a]">
                    {invoice.serviceName}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-right text-xs font-medium text-[#434653]">
                  {formatMoney(invoice.contractValue)}
                </td>
                <td className="px-4 py-3.5 text-right text-xs font-medium text-[#434653]">
                  {formatMoney(invoice.estimatedNetReceipt)}
                </td>
                <td className="max-w-[220px] px-4 py-3.5">
                  <p
                    className={`text-xs font-medium leading-snug ${
                      isOverdue ? 'font-bold text-[#ba1a1a]' : 'text-[#434653]'
                    }`}
                  >
                    {invoice.nextAction}
                  </p>
                  <p
                    className={`mt-0.5 text-[11px] ${
                      isOverdue ? 'font-bold text-[#ba1a1a]' : 'text-[#737784]'
                    }`}
                  >
                    Tenggat: {formatDate(invoice.nextDueDate)}
                  </p>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex justify-center">
                    <span
                      className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-[11px] font-bold tracking-tight ${statusPillClass(invoice.statusDb)}`}
                    >
                      {invoice.status}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="flex w-full max-w-[120px] items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#eceef0]">
                        <div
                          className={`h-full ${isOverdue ? 'bg-[#ba1a1a]' : 'bg-[#003c90]'}`}
                          style={{ width: `${invoice.paymentProgress}%` }}
                        />
                      </div>
                      <span
                        className={`text-[11px] font-medium ${
                          isOverdue ? 'text-[#ba1a1a]' : 'text-[#737784]'
                        }`}
                      >
                        {invoice.paymentProgress}%
                      </span>
                    </div>
                    <span className="text-[10px] text-[#737784]">{invoice.progressSummary}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      type="button"
                      onClick={() => onView(invoice)}
                      className="cursor-pointer rounded-md p-1.5 text-[#003c90] transition-colors hover:bg-[#d9e2ff]"
                      aria-label="View invoice"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {footer}
    </div>
  );
};
