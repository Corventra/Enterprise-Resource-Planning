import { useMemo, useState } from 'react';
import type { MeetingMonitorFilters, MeetingMonitorItem, MeetingSummaryHandledByTarget } from '../types/meetings.types';
const defaultFilters: MeetingMonitorFilters = {
  search: '',
  status: 'All',
  mode: 'All',
  minutes: 'All',
  handledBy: 'All'
};

export const useMeetingsFilters = (items: MeetingMonitorItem[], pageSize = 8) => {
  const [filters, setFilters] = useState<MeetingMonitorFilters>(defaultFilters);
  const [currentPage, setCurrentPage] = useState(1);

  const summaryHandledByTarget = useMemo((): MeetingSummaryHandledByTarget => {
    if (filters.handledBy === 'All') return null;
    const match = items.find((item) => item.handledByName === filters.handledBy);
    return match?.handledById ?? null;
  }, [filters.handledBy, items]);

  const handledByFilterOptions = useMemo(() => {
    const names = new Set<string>();
    for (const item of items) {
      const name = item.handledByName?.trim();
      if (name && name !== '—') names.add(name);
    }
    return ['All', ...Array.from(names).sort((a, b) => a.localeCompare(b, 'id'))];
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = filters.search.toLowerCase().trim();
    return items.filter((item) => {
      const matchSearch =
        q === '' ||
        item.companyName.toLowerCase().includes(q) ||
        item.picName.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q);
      const matchStatus = filters.status === 'All' || item.status === filters.status;
      const matchMode = filters.mode === 'All' || item.mode === filters.mode;
      const matchMinutes =
        filters.minutes === 'All' ||
        (filters.minutes === 'HAS_MINUTES' && item.hasMinutes) ||
        (filters.minutes === 'NO_MINUTES' && !item.hasMinutes);
      const matchHandledBy = filters.handledBy === 'All' || item.handledByName === filters.handledBy;
      return matchSearch && matchStatus && matchMode && matchMinutes && matchHandledBy;
    });
  }, [items, filters]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const normalizedPage = Math.min(currentPage, totalPages);

  const paginatedItems = useMemo(() => {
    const start = (normalizedPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, normalizedPage, pageSize]);

  const updateFilter = <K extends keyof MeetingMonitorFilters>(key: K, value: MeetingMonitorFilters[K]) => {
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
    handledByFilterOptions,
    summaryHandledByTarget,
    setCurrentPage,
    updateFilter,
    resetFilters
  };
};
