import { useMemo, useState } from 'react';
import type { BankDataEntry, BankDataFilters } from '../types/bank-data.types';

const defaultFilters: BankDataFilters = {
  search: '',
  source: 'All',
  status: 'All'
};

const statusRank: Record<BankDataEntry['status'], number> = {
  New: 0,
  Processed: 1,
  Archived: 2
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
        entry.contactEmail.toLowerCase().includes(q) ||
        entry.contactPhone.toLowerCase().includes(q) ||
        entry.campaignName.toLowerCase().includes(q) ||
        entry.formName.toLowerCase().includes(q) ||
        (entry.handledBy ?? '').toLowerCase().includes(q);

      const matchSource = filters.source === 'All' || entry.source === filters.source;
      const matchStatus = filters.status === 'All' || entry.status === filters.status;
      return matchSearch && matchSource && matchStatus;
    });
  }, [entries, filters]);

  const sortedEntries = useMemo(() => {
    return [...filteredEntries].sort((a, b) => {
      const rankDiff = statusRank[a.status] - statusRank[b.status];
      if (rankDiff !== 0) return rankDiff;
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    });
  }, [filteredEntries]);

  const totalPages = Math.max(1, Math.ceil(sortedEntries.length / pageSize));
  const normalizedPage = Math.min(currentPage, totalPages);

  const paginatedEntries = useMemo(() => {
    const start = (normalizedPage - 1) * pageSize;
    return sortedEntries.slice(start, start + pageSize);
  }, [sortedEntries, normalizedPage, pageSize]);

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
    filteredEntries: sortedEntries,
    paginatedEntries,
    currentPage: normalizedPage,
    totalPages,
    pageSize,
    setCurrentPage,
    updateFilter,
    resetFilters
  };
};
