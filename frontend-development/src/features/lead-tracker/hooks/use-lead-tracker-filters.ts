import { useMemo, useState } from 'react';
import type { LeadTrackerFilters, LeadTrackerItem } from '../types/lead-tracker.types';

const defaultFilters: LeadTrackerFilters = {
  search: '',
  stage: 'All',
  status: 'All'
};

/** WON leads always appear last; other rows keep API order among themselves. */
const compareLeadTrackerRows = (a: LeadTrackerItem, b: LeadTrackerItem) => {
  if (a.leadStatus === 'WON' && b.leadStatus !== 'WON') return 1;
  if (b.leadStatus === 'WON' && a.leadStatus !== 'WON') return -1;
  return 0;
};

export const useLeadTrackerFilters = (items: LeadTrackerItem[], pageSize = 6) => {
  const [filters, setFilters] = useState<LeadTrackerFilters>(defaultFilters);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredItems = useMemo(() => {
    const filtered = items.filter((item) => {
      const q = filters.search.toLowerCase().trim();
      const matchSearch =
        q === '' ||
        item.companyName.toLowerCase().includes(q) ||
        item.picName.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q);
      const matchStage = filters.stage === 'All' || item.currentStage === filters.stage;
      const matchStatus = filters.status === 'All' || item.leadStatus === filters.status;
      return matchSearch && matchStage && matchStatus;
    });
    return [...filtered].sort(compareLeadTrackerRows);
  }, [items, filters]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const normalizedPage = Math.min(currentPage, totalPages);

  const paginatedItems = useMemo(() => {
    const start = (normalizedPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, normalizedPage, pageSize]);

  const updateFilter = <K extends keyof LeadTrackerFilters>(key: K, value: LeadTrackerFilters[K]) => {
    setCurrentPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
    setCurrentPage(1);
  };

  return {
    filters,
    filteredItems,
    paginatedItems,
    currentPage: normalizedPage,
    totalPages,
    pageSize,
    setCurrentPage,
    updateFilter,
    resetFilters
  };
};
