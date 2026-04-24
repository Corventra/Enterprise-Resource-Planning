import { useMemo, useState } from 'react';
import type { InvoiceDueStatus, InvoiceFilters, InvoiceItem } from '../types/invoice.types';

const defaultFilters: InvoiceFilters = {
  search: '',
  paymentStatus: 'All',
  dueStatus: 'All',
  serviceType: 'All'
};

const getDueStatus = (invoice: InvoiceItem): InvoiceDueStatus => {
  if (invoice.paymentStatus === 'Overdue') {
    return 'Overdue';
  }
  if (invoice.nextDueDate) {
    return 'Due Soon';
  }
  return 'Safe';
};

export const useInvoiceFilters = (invoices: InvoiceItem[], pageSize = 6) => {
  const [filters, setFilters] = useState<InvoiceFilters>(defaultFilters);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const q = filters.search.toLowerCase().trim();
      const matchSearch =
        q === '' ||
        invoice.invoiceCode.toLowerCase().includes(q) ||
        invoice.projectCode.toLowerCase().includes(q) ||
        invoice.clientName.toLowerCase().includes(q);

      const matchPaymentStatus =
        filters.paymentStatus === 'All' || invoice.paymentStatus === filters.paymentStatus;

      const matchServiceType = filters.serviceType === 'All' || invoice.serviceType === filters.serviceType;
      const matchDueStatus = filters.dueStatus === 'All' || getDueStatus(invoice) === filters.dueStatus;

      return matchSearch && matchPaymentStatus && matchServiceType && matchDueStatus;
    });
  }, [invoices, filters]);

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / pageSize));
  const normalizedPage = Math.min(currentPage, totalPages);

  const paginatedInvoices = useMemo(() => {
    const start = (normalizedPage - 1) * pageSize;
    return filteredInvoices.slice(start, start + pageSize);
  }, [filteredInvoices, normalizedPage, pageSize]);

  const updateFilter = <K extends keyof InvoiceFilters>(key: K, value: InvoiceFilters[K]) => {
    setCurrentPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setCurrentPage(1);
    setFilters(defaultFilters);
  };

  return {
    filters,
    filteredInvoices,
    paginatedInvoices,
    currentPage: normalizedPage,
    totalPages,
    pageSize,
    setCurrentPage,
    updateFilter,
    resetFilters
  };
};
