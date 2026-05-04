import { useMemo, useState } from 'react';
import type { Project, ProjectFilters } from '../types/project.types';

const defaultFilters: ProjectFilters = {
  search: '',
  status: 'All',
  serviceLine: 'All'
};

export const useProjectFilters = (items: Project[], pageSize = 6) => {
  const [filters, setFilters] = useState<ProjectFilters>(defaultFilters);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const q = filters.search.toLowerCase().trim();
      const matchSearch =
        q === '' ||
        item.projectCode.toLowerCase().includes(q) ||
        item.client.toLowerCase().includes(q) ||
        item.projectName.toLowerCase().includes(q);
      const matchStatus = filters.status === 'All' || item.status === filters.status;
      const matchServiceLine = filters.serviceLine === 'All' || item.serviceLine === filters.serviceLine;
      return matchSearch && matchStatus && matchServiceLine;
    });
  }, [items, filters]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const normalizedPage = Math.min(currentPage, totalPages);

  const paginatedItems = useMemo(() => {
    const start = (normalizedPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, normalizedPage, pageSize]);

  const updateFilter = <K extends keyof ProjectFilters>(key: K, value: ProjectFilters[K]) => {
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
