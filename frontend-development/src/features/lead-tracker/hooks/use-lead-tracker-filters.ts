import { useMemo, useState } from 'react';
import type {
  LeadTrackerFilters,
  LeadTrackerItem,
  LeadTrackerSummaryProcessedByTarget
} from '../types/lead-tracker.types';

const PROCESSED_BY_UNASSIGNED = 'Unassigned';

const defaultFilters: LeadTrackerFilters = {
  search: '',
  stage: 'All',
  status: 'All',
  processedBy: 'All'
};

/** ACTIVE first, then WON, then LOST at the bottom; same-status rows keep API order. */
const leadStatusSortRank = (status: LeadTrackerItem['leadStatus']) => {
  switch (status) {
    case 'ACTIVE':
      return 0;
    case 'WON':
      return 1;
    case 'LOST':
      return 2;
    default:
      return 0;
  }
};

const compareLeadTrackerRows = (a: LeadTrackerItem, b: LeadTrackerItem) =>
  leadStatusSortRank(a.leadStatus) - leadStatusSortRank(b.leadStatus);

export const useLeadTrackerFilters = (items: LeadTrackerItem[], pageSize = 6) => {
  const [filters, setFilters] = useState<LeadTrackerFilters>(defaultFilters);
  const [currentPage, setCurrentPage] = useState(1);

  const summaryProcessedByTarget = useMemo((): LeadTrackerSummaryProcessedByTarget => {
    if (filters.processedBy === 'All') return null;
    if (filters.processedBy === PROCESSED_BY_UNASSIGNED) return 'unassigned';
    const match = items.find((item) => item.processedBy === filters.processedBy);
    return match?.processedByUserId ?? null;
  }, [filters.processedBy, items]);

  const processedByFilterOptions = useMemo(() => {
    const names = new Set<string>();
    let hasUnassigned = false;
    for (const item of items) {
      const name = item.processedBy?.trim();
      if (name) names.add(name);
      else hasUnassigned = true;
    }
    const sorted = Array.from(names).sort((a, b) => a.localeCompare(b, 'id'));
    const options = ['All', ...sorted];
    if (hasUnassigned) options.push(PROCESSED_BY_UNASSIGNED);
    return options;
  }, [items]);

  const filteredItems = useMemo(() => {
    const filtered = items.filter((item) => {
      const q = filters.search.toLowerCase().trim();
      const matchSearch =
        q === '' ||
        item.leadCode.toLowerCase().includes(q) ||
        item.companyName.toLowerCase().includes(q) ||
        item.picName.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q);
      const matchStage = filters.stage === 'All' || item.currentStage === filters.stage;
      const matchStatus = filters.status === 'All' || item.leadStatus === filters.status;
      const matchProcessedBy =
        filters.processedBy === 'All' ||
        (filters.processedBy === PROCESSED_BY_UNASSIGNED && !item.processedBy?.trim()) ||
        item.processedBy === filters.processedBy;

      return matchSearch && matchStage && matchStatus && matchProcessedBy;
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
    processedByFilterOptions,
    summaryProcessedByTarget,
    setCurrentPage,
    updateFilter,
    resetFilters
  };
};
