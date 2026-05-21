import { useCallback, useEffect, useState } from 'react';
import { getDocumentCenterList } from '../services/document-center-api';
import { mapListItem, mapListSummary } from '../utils/document-center-mappers';
import type { DocumentCenterListItem, DocumentCenterListSummary } from '../types/document-center.types';

export const useDocumentCenterList = () => {
  const [items, setItems] = useState<DocumentCenterListItem[]>([]);
  const [summary, setSummary] = useState<DocumentCenterListSummary>({
    totalDocuments: 0,
    proposal: 0,
    engagementLetter: 0,
    clientDocuments: 0,
    invoiceProof: 0,
    project: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await getDocumentCenterList();
      setItems(data.items.map(mapListItem));
      setSummary(mapListSummary(data.summary));
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Gagal memuat Document Center.');
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { items, summary, isLoading, loadError, reload: load };
};
