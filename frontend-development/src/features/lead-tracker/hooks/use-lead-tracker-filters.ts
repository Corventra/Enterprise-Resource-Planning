import { useMemo, useState } from 'react';
import type { LeadTrackerFilters, LeadTrackerItem } from '../types/lead-tracker.types';

const defaultFilters: LeadTrackerFilters = {
  search: '',
  stage: 'All',
  status: 'All'
};

export const useLeadTrackerFilters = (items: LeadTrackerItem[], pageSize = 6) => {
  const [filters, setFilters] = useState<LeadTrackerFilters>(defaultFilters);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const q = filters.search.toLowerCase().trim();
      const matchSearch =
        q === '' ||
        item.company.toLowerCase().includes(q) ||
        item.processedBy.toLowerCase().includes(q) ||
        item.nextAction.toLowerCase().includes(q);
      const matchStage = filters.stage === 'All' || item.currentStage === filters.stage;
      const matchStatus = filters.status === 'All' || item.status === filters.status;
      return matchSearch && matchStage && matchStatus;
    });
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
