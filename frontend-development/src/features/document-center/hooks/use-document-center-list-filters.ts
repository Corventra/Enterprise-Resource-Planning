import { useMemo, useState } from 'react';
import type {
  DocumentCenterCategory,
  DocumentCenterListFilters,
  DocumentCenterListItem
} from '../types/document-center.types';
import { matchesLastUpdatedFilter } from '../utils/document-center-display';

const PAGE_SIZE = 12;

const defaultFilters: DocumentCenterListFilters = {
  search: '',
  stage: 'All',
  handledBy: 'All',
  hasCategory: 'All',
  lastUpdated: 'All'
};

export const useDocumentCenterListFilters = (items: DocumentCenterListItem[]) => {
  const [filters, setFilters] = useState<DocumentCenterListFilters>(defaultFilters);
  const [currentPage, setCurrentPage] = useState(1);

  const handledByFilterOptions = useMemo(() => {
    const names = new Set<string>();
    for (const item of items) {
      if (item.handledByName) names.add(item.handledByName);
    }
    return ['All', ...Array.from(names).sort((a, b) => a.localeCompare(b, 'id'))];
  }, [items]);

  const stageFilterOptions = useMemo(() => {
    const stages = new Set<string>();
    for (const item of items) stages.add(item.currentStage);
    return ['All', ...Array.from(stages).sort()];
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return items.filter((item) => {
      if (q) {
        const hay = `${item.companyName} ${item.leadCode ?? ''} ${item.serviceName ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.stage !== 'All' && item.currentStage !== filters.stage) return false;
      if (filters.handledBy !== 'All' && item.handledByName !== filters.handledBy) return false;
      if (filters.hasCategory !== 'All') {
        const count = item.categoryCounts[filters.hasCategory as DocumentCenterCategory] ?? 0;
        if (count <= 0) return false;
      }
      if (!matchesLastUpdatedFilter(item.lastUpdatedAt, filters.lastUpdated)) return false;
      return true;
    });
  }, [items, filters]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));

  const paginatedItems = useMemo(() => {
    const page = Math.min(currentPage, totalPages);
    const start = (page - 1) * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [filteredItems, currentPage, totalPages]);

  const updateFilter = <K extends keyof DocumentCenterListFilters>(key: K, value: DocumentCenterListFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
    setCurrentPage(1);
  };

  return {
    filters,
    filteredItems,
    paginatedItems,
    currentPage,
    totalPages,
    pageSize: PAGE_SIZE,
    handledByFilterOptions,
    stageFilterOptions,
    setCurrentPage,
    updateFilter,
    resetFilters
  };
};
