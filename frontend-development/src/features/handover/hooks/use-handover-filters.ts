import { useMemo, useState } from 'react';
import type {
  HandoverFilters,
  HandoverItem,
  HandoverSummaryCreatedByTarget
} from '../types/handover.types';

const defaultFilters: HandoverFilters = {
  search: '',
  serviceLine: 'All',
  createdBy: 'All',
  status: 'All'
};

export const useHandoverFilters = (items: HandoverItem[], pageSize = 6) => {
  const [filters, setFilters] = useState<HandoverFilters>(defaultFilters);
  const [currentPage, setCurrentPage] = useState(1);

  const summaryCreatedByTarget = useMemo((): HandoverSummaryCreatedByTarget => {
    if (filters.createdBy === 'All') return null;
    const match = items.find((item) => item.createdBy === filters.createdBy);
    return match?.createdById ?? null;
  }, [filters.createdBy, items]);

  const serviceLineOptions = useMemo(() => {
    const names = new Set<string>();
    for (const item of items) {
      if (item.serviceLine && item.serviceLine !== '-') {
        names.add(item.serviceLine);
      }
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const createdByFilterOptions = useMemo(() => {
    const names = new Set<string>();
    for (const item of items) {
      const name = item.createdBy?.trim();
      if (name && name !== '-') names.add(name);
    }
    return ['All', ...Array.from(names).sort((a, b) => a.localeCompare(b, 'id'))];
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const q = filters.search.toLowerCase().trim();
      const matchSearch =
        q === '' ||
        item.docCode.toLowerCase().includes(q) ||
        item.client.toLowerCase().includes(q) ||
        item.project.toLowerCase().includes(q);
      const matchServiceLine = filters.serviceLine === 'All' || item.serviceLine === filters.serviceLine;
      const matchCreatedBy = filters.createdBy === 'All' || item.createdBy === filters.createdBy;
      const matchStatus = filters.status === 'All' || item.status === filters.status;

      return matchSearch && matchServiceLine && matchCreatedBy && matchStatus;
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
    serviceLineOptions,
    createdByFilterOptions,
    summaryCreatedByTarget,
    setCurrentPage,
    updateFilter,
    resetFilters
  };
};
