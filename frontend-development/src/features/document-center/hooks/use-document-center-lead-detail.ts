import { useCallback, useEffect, useMemo, useState } from 'react';
import { getDocumentCenterLeadDetail } from '../services/document-center-api';
import { mapFileItem, mapLeadHeader } from '../utils/document-center-mappers';
import type {
  DocumentCenterCategory,
  DocumentCenterFileItem,
  DocumentCenterLeadHeader
} from '../types/document-center.types';
import { DOCUMENT_CENTER_CATEGORY_ORDER } from '../constants/document-center-categories';

export const useDocumentCenterLeadDetail = (leadId: number | undefined) => {
  const [header, setHeader] = useState<DocumentCenterLeadHeader | null>(null);
  const [filesByCategory, setFilesByCategory] = useState<Record<DocumentCenterCategory, DocumentCenterFileItem[]>>(
    () =>
      DOCUMENT_CENTER_CATEGORY_ORDER.reduce(
        (acc, key) => {
          acc[key] = [];
          return acc;
        },
        {} as Record<DocumentCenterCategory, DocumentCenterFileItem[]>
      )
  );
  const [categorySummary, setCategorySummary] = useState<Record<DocumentCenterCategory, number>>(
    () =>
      DOCUMENT_CENTER_CATEGORY_ORDER.reduce(
        (acc, key) => {
          acc[key] = 0;
          return acc;
        },
        {} as Record<DocumentCenterCategory, number>
      )
  );
  const [latestOnly, setLatestOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (leadId == null || !Number.isFinite(leadId)) return;
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await getDocumentCenterLeadDetail(leadId, latestOnly);
      setHeader(mapLeadHeader(data.lead));
      const mapped: Record<DocumentCenterCategory, DocumentCenterFileItem[]> = DOCUMENT_CENTER_CATEGORY_ORDER.reduce(
        (acc, key) => {
          const rows = data.categories[key] ?? [];
          acc[key] = rows.map(mapFileItem);
          return acc;
        },
        {} as Record<DocumentCenterCategory, DocumentCenterFileItem[]>
      );
      setFilesByCategory(mapped);
      setCategorySummary(
        DOCUMENT_CENTER_CATEGORY_ORDER.reduce(
          (acc, key) => {
            acc[key] = data.category_summary?.[key] ?? 0;
            return acc;
          },
          {} as Record<DocumentCenterCategory, number>
        )
      );
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Gagal memuat dokumen lead.');
      setHeader(null);
    } finally {
      setIsLoading(false);
    }
  }, [leadId, latestOnly]);

  useEffect(() => {
    void load();
  }, [load]);

  const allFiles = useMemo(() => {
    const flat: DocumentCenterFileItem[] = [];
    for (const key of DOCUMENT_CENTER_CATEGORY_ORDER) {
      flat.push(...(filesByCategory[key] ?? []));
    }
    return flat;
  }, [filesByCategory]);

  return {
    header,
    filesByCategory,
    categorySummary,
    allFiles,
    latestOnly,
    setLatestOnly,
    isLoading,
    loadError,
    reload: load
  };
};
