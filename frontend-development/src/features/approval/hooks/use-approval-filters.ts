import { useMemo, useState } from 'react';
import type { ApprovalFilters, ApprovalItem, ApprovalKind } from '../types/approval.types';

const initialFilters: ApprovalFilters = {
  search: '',
  kind: 'All'
};

export const useApprovalFilters = (items: ApprovalItem[]) => {
  const [filters, setFilters] = useState<ApprovalFilters>(initialFilters);

  const updateFilter = <K extends keyof ApprovalFilters>(key: K, value: ApprovalFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const setKind = (kind: ApprovalKind | 'All') => updateFilter('kind', kind);

  const resetFilters = () => setFilters(initialFilters);

  const filteredItems = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    return items.filter((item) => {
      if (filters.kind !== 'All' && item.kind !== filters.kind) return false;
      if (!search) return true;
      const haystack = [
        item.docCode,
        item.client,
        item.title,
        item.serviceLine,
        item.submittedBy
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(search);
    });
  }, [items, filters]);

  return {
    filters,
    filteredItems,
    updateFilter,
    setKind,
    resetFilters
  };
};
