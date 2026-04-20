import { useMemo, useState } from 'react';
import type { BankDataEntry, BankDataFilters } from '../types/bank-data.types';

const defaultFilters: BankDataFilters = {
  search: '',
  source: 'All',
  status: 'All'
};

export const useBankDataFilters = (entries: BankDataEntry[], pageSize = 6) => {
  const [filters, setFilters] = useState<BankDataFilters>(defaultFilters);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const q = filters.search.toLowerCase().trim();
      const matchSearch =
        q === '' ||
        entry.companyName.toLowerCase().includes(q) ||
        entry.contactName.toLowerCase().includes(q) ||
        entry.entrySlug.toLowerCase().includes(q) ||
        entry.campaignName.toLowerCase().includes(q) ||
        entry.formName.toLowerCase().includes(q);

      const matchSource = filters.source === 'All' || entry.source === filters.source;
      const matchStatus = filters.status === 'All' || entry.status === filters.status;
      return matchSearch && matchSource && matchStatus;
    });
  }, [entries, filters]);

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / pageSize));
  const normalizedPage = Math.min(currentPage, totalPages);

  const paginatedEntries = useMemo(() => {
    const start = (normalizedPage - 1) * pageSize;
    return filteredEntries.slice(start, start + pageSize);
  }, [filteredEntries, normalizedPage, pageSize]);

  const updateFilter = <K extends keyof BankDataFilters>(key: K, value: BankDataFilters[K]) => {
    setCurrentPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
    setCurrentPage(1);
  };

  return {
    filters,
    filteredEntries,
    paginatedEntries,
    currentPage: normalizedPage,
    totalPages,
    pageSize,
    setCurrentPage,
    updateFilter,
    resetFilters
  };
};
