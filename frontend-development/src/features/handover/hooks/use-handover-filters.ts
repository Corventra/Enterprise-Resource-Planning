import { useMemo, useState } from 'react';
import type { HandoverFilters, HandoverItem } from '../types/handover.types';

const defaultFilters: HandoverFilters = {
  search: '',
  serviceLine: 'All',
  engagementStatus: 'All',
  status: 'All'
};

export const useHandoverFilters = (items: HandoverItem[], pageSize = 6) => {
  const [filters, setFilters] = useState<HandoverFilters>(defaultFilters);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const q = filters.search.toLowerCase().trim();
      const matchSearch =
        q === '' ||
        item.docCode.toLowerCase().includes(q) ||
        item.client.toLowerCase().includes(q) ||
        item.project.toLowerCase().includes(q);
      const matchServiceLine = filters.serviceLine === 'All' || item.serviceLine === filters.serviceLine;
      const matchEngagementStatus =
        filters.engagementStatus === 'All' || item.engagementStatus === filters.engagementStatus;
      const matchStatus = filters.status === 'All' || item.status === filters.status;

      return matchSearch && matchServiceLine && matchEngagementStatus && matchStatus;
    });
  }, [items, filters]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const normalizedPage = Math.min(currentPage, totalPages);

  const paginatedItems = useMemo(() => {
    const start = (normalizedPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, normalizedPage, pageSize]);

  const updateFilter = <K extends keyof HandoverFilters>(key: K, value: HandoverFilters[K]) => {
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
