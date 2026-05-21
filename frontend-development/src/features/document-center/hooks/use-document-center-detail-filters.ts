import { useMemo, useState } from 'react';
import { DOCUMENT_CENTER_CATEGORY_ORDER } from '../constants/document-center-categories';
import type {
  DocumentCenterCategory,
  DocumentCenterDetailFilters,
  DocumentCenterFileItem
} from '../types/document-center.types';
import { matchesFileTypeFilter, matchesLastUpdatedFilter } from '../utils/document-center-display';

const defaultFilters: DocumentCenterDetailFilters = {
  search: '',
  category: 'All',
  fileType: 'All',
  uploadedBy: 'All',
  dateRange: 'All',
  sort: 'newest'
};

const sortFiles = (items: DocumentCenterFileItem[], sort: DocumentCenterDetailFilters['sort']) => {
  const copy = [...items];
  if (sort === 'name') {
    copy.sort((a, b) => a.documentName.localeCompare(b.documentName, 'id'));
  } else if (sort === 'size') {
    copy.sort((a, b) => (b.fileSizeBytes ?? 0) - (a.fileSizeBytes ?? 0));
  } else {
    copy.sort((a, b) => {
      const ta = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
      const tb = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
      return tb - ta;
    });
  }
  return copy;
};

export const useDocumentCenterDetailFilters = (
  filesByCategory: Record<DocumentCenterCategory, DocumentCenterFileItem[]>
) => {
  const [filters, setFilters] = useState<DocumentCenterDetailFilters>(defaultFilters);

  const uploadedByOptions = useMemo(() => {
    const names = new Set<string>();
    for (const key of DOCUMENT_CENTER_CATEGORY_ORDER) {
      for (const f of filesByCategory[key] ?? []) {
        if (f.uploadedByName) names.add(f.uploadedByName);
      }
    }
    return ['All', ...Array.from(names).sort((a, b) => a.localeCompare(b, 'id'))];
  }, [filesByCategory]);

  const filterOne = (item: DocumentCenterFileItem): boolean => {
    const q = filters.search.trim().toLowerCase();
    if (q && !item.documentName.toLowerCase().includes(q)) return false;
    if (filters.category !== 'All' && item.category !== filters.category) return false;
    if (!matchesFileTypeFilter(item.fileExtension, item.mimeType, filters.fileType)) return false;
    if (filters.uploadedBy !== 'All' && item.uploadedByName !== filters.uploadedBy) return false;
    if (!matchesLastUpdatedFilter(item.uploadedAt, filters.dateRange)) return false;
    return true;
  };

  const filteredByCategory = useMemo(() => {
    const result = {} as Record<DocumentCenterCategory, DocumentCenterFileItem[]>;
    for (const key of DOCUMENT_CENTER_CATEGORY_ORDER) {
      const filtered = (filesByCategory[key] ?? []).filter(filterOne);
      result[key] = sortFiles(filtered, filters.sort);
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- filterOne closes over filters
  }, [filesByCategory, filters]);

  const visibleTotal = useMemo(
    () => DOCUMENT_CENTER_CATEGORY_ORDER.reduce((sum, key) => sum + (filteredByCategory[key]?.length ?? 0), 0),
    [filteredByCategory]
  );

  const updateFilter = <K extends keyof DocumentCenterDetailFilters>(
    key: K,
    value: DocumentCenterDetailFilters[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => setFilters(defaultFilters);

  return {
    filters,
    filteredByCategory,
    visibleTotal,
    uploadedByOptions,
    updateFilter,
    resetFilters
  };
};
