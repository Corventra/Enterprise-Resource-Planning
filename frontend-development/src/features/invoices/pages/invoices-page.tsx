import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { InvoiceFiltersSection } from '../components/list/invoice-filters';
import { InvoicesSummaryCards } from '../components/list/invoices-summary-cards';
import { InvoicesTable } from '../components/list/invoices-table';
import { useInvoiceFilters } from '../hooks/use-invoice-filters';
import { useInvoicesList } from '../hooks/use-invoices-list';

export const InvoicesPage = () => {
  const navigate = useNavigate();
  const { invoices, isLoading, loadError, summary } = useInvoicesList();
  const {
    filters,
    filteredInvoices,
    paginatedInvoices,
    currentPage,
    totalPages,
    pageSize,
    setCurrentPage,
    updateFilter,
    resetFilters
  } = useInvoiceFilters(invoices);

  const pageNumbers = useMemo(() => Array.from({ length: totalPages }, (_, index) => index + 1), [totalPages]);
  const rangeStart = filteredInvoices.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, filteredInvoices.length);

  const paginationFooter =
    totalPages > 0 && filteredInvoices.length > 0 ? (
      <div className="flex flex-col gap-3 border-none bg-[#eceef0] px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-medium text-[#737784] sm:text-sm">
          Menampilkan{' '}
          <span className="font-bold text-[#191c1e]">
            {rangeStart} - {rangeEnd}
          </span>{' '}
          dari {filteredInvoices.length.toLocaleString()} invoice
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            className="rounded-lg p-1.5 text-[#737784] transition-colors hover:bg-[#e0e3e5] disabled:opacity-30"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {pageNumbers.map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => setCurrentPage(page)}
              className={
                page === currentPage
                  ? 'flex h-7 w-7 items-center justify-center rounded-md bg-[#003c90] text-xs font-bold text-white shadow-sm shadow-[#003c90]/20'
                  : 'flex h-7 w-7 items-center justify-center rounded-md text-xs font-medium text-[#737784] transition-colors hover:bg-[#e0e3e5]'
              }
            >
              {page}
            </button>
          ))}
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
            className="rounded-lg p-1.5 text-[#737784] transition-colors hover:bg-[#e0e3e5] disabled:opacity-30"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    ) : null;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Invoice Management</h1>
          <p className="mt-1 text-sm text-slate-500">
            Kelola invoice, termin pembayaran, dan tindak lanjut administrasi seluruh client.
          </p>
        </div>
      </header>

      <InvoicesSummaryCards summary={summary} />

      <InvoiceFiltersSection
        filters={filters}
        onSearchChange={(value) => updateFilter('search', value)}
        onStatusChange={(value) => updateFilter('status', value)}
        onDueStatusChange={(value) => updateFilter('dueStatus', value)}
        onReset={resetFilters}
      />

      {loadError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 shadow-sm">{loadError}</div>
      ) : isLoading ? (
        <div className="rounded-xl border border-[#eceef0] bg-white p-4 text-sm text-[#737784] shadow-sm">
          Loading invoices...
        </div>
      ) : (
        <InvoicesTable
          invoices={paginatedInvoices}
          onView={(invoice) => navigate(`/invoice/${invoice.id}`)}
          footer={paginationFooter}
        />
      )}
    </div>
  );
};
