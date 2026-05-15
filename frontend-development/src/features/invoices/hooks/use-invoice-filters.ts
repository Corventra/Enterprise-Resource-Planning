import { useMemo, useState } from 'react';
import type { InvoiceDueStatus, InvoiceFilters, InvoiceItem } from '../types/invoice.types';

const defaultFilters: InvoiceFilters = {
  search: '',
  status: 'All',
  dueStatus: 'All'
};

const getDueStatus = (invoice: InvoiceItem): InvoiceDueStatus => {
  if (invoice.statusDb === 'OVERDUE') {
    return 'Overdue';
  }
  if (invoice.nextDueDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(`${invoice.nextDueDate}T00:00:00`);
    const inSeven = new Date(today);
    inSeven.setDate(inSeven.getDate() + 7);
    if (due >= today && due <= inSeven) {
      return 'Due Soon';
    }
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
        invoice.clientName.toLowerCase().includes(q) ||
        invoice.serviceName.toLowerCase().includes(q) ||
        invoice.nextAction.toLowerCase().includes(q);

      const matchStatus = filters.status === 'All' || invoice.status === filters.status;
      const matchDueStatus = filters.dueStatus === 'All' || getDueStatus(invoice) === filters.dueStatus;

      return matchSearch && matchStatus && matchDueStatus;
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
