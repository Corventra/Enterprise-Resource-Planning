import { Filter, Search } from 'lucide-react';
import type {
  InvoiceDueStatus,
  InvoiceFilters,
  InvoicePaymentStatus,
  InvoiceServiceType
} from '../../types/invoice.types';

interface InvoiceFiltersSectionProps {
  filters: InvoiceFilters;
  onSearchChange: (value: string) => void;
  onPaymentStatusChange: (value: InvoicePaymentStatus | 'All') => void;
  onDueStatusChange: (value: InvoiceDueStatus | 'All') => void;
  onServiceTypeChange: (value: InvoiceServiceType | 'All') => void;
  onReset: () => void;
}

const fieldFocus = 'focus:outline-none focus:ring-2 focus:ring-[#1d59c1]/20';
const selectClassName = `rounded-lg border-none bg-white py-2 pl-3 pr-8 text-xs font-semibold text-[#434653] shadow-sm ${fieldFocus}`;

export const InvoiceFiltersSection = ({
  filters,
  onSearchChange,
  onPaymentStatusChange,
  onDueStatusChange,
  onServiceTypeChange,
  onReset
}: InvoiceFiltersSectionProps) => {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl bg-[#f2f4f6] p-4">
      <div className="relative min-w-[260px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#737784]" />
        <input
          type="search"
          value={filters.search}
          onChange={(event) => onSearchChange(event.target.value)}
          className={`w-full rounded-lg border-none bg-white py-2 pl-10 pr-3 text-sm text-[#191c1e] shadow-sm placeholder:text-[#737784]/80 ${fieldFocus}`}
          placeholder="Cari invoice, client, atau proyek..."
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={filters.paymentStatus}
          onChange={(event) => onPaymentStatusChange(event.target.value as InvoicePaymentStatus | 'All')}
          className={selectClassName}
          aria-label="Filter by payment status"
        >
          <option value="All">Status: Semua</option>
          <option value="Draft">Draft</option>
          <option value="Ready to Send">Ready to Send</option>
          <option value="Sent">Sent</option>
          <option value="Partially Paid">Partially Paid</option>
          <option value="Pending Verification">Pending Verification</option>
          <option value="Paid">Paid</option>
          <option value="Overdue">Overdue</option>
          <option value="Closed">Closed</option>
        </select>

        <select
          value={filters.dueStatus}
          onChange={(event) => onDueStatusChange(event.target.value as InvoiceDueStatus | 'All')}
          className={selectClassName}
          aria-label="Filter by due status"
        >
          <option value="All">Jatuh Tempo: Semua</option>
          <option value="Safe">Safe</option>
          <option value="Due Soon">Due Soon</option>
          <option value="Overdue">Overdue</option>
        </select>

        <select
          value={filters.serviceType}
          onChange={(event) => onServiceTypeChange(event.target.value as InvoiceServiceType | 'All')}
          className={selectClassName}
          aria-label="Filter by service type"
        >
          <option value="All">Layanan: Semua</option>
          <option value="Web Dev">Web Dev</option>
          <option value="Tax">Tax</option>
          <option value="Audit">Audit</option>
          <option value="App Dev">App Dev</option>
          <option value="Maintenance">Maintenance</option>
          <option value="Consulting">Consulting</option>
          <option value="Security">Security</option>
        </select>
      </div>

      <button
        type="button"
        onClick={onReset}
        title="Reset filters"
        aria-label="Reset filters"
        className="rounded-lg bg-white p-2 text-[#737784] shadow-sm transition-colors hover:text-[#003c90]"
      >
        <Filter className="h-4 w-4" />
      </button>
    </div>
  );
};
