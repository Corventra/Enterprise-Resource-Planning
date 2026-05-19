import { useCallback, useEffect, useMemo, useState } from 'react';
import { bankDataService } from '../services/bank-data-service';
import type { BankDataEntry } from '../types/bank-data.types';

export const useBankDataList = () => {
  const [entries, setEntries] = useState<BankDataEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchEntries = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setIsLoading(true);
    }
    setLoadError(null);
    try {
      const data = await bankDataService.getAll();
      setEntries(data);
    } catch (e) {
      setEntries([]);
      setLoadError(e instanceof Error ? e.message : 'Gagal memuat Bank Data.');
    } finally {
      if (!options?.silent) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void fetchEntries();
  }, [fetchEntries]);

  const processEntry = async (entryId: string) => {
    await bankDataService.process(entryId);
    await fetchEntries({ silent: true });
  };

  const archiveEntry = async (entryId: string) => {
    await bankDataService.archive(entryId);
    await fetchEntries({ silent: true });
  };

  const summary = useMemo(() => {
    const totalEntries = entries.length;
    const newEntries = entries.filter((entry) => entry.status === 'New').length;
    const processedEntries = entries.filter((entry) => entry.status === 'Processed').length;
    const archivedEntries = entries.filter((entry) => entry.status === 'Archived').length;

    return {
      totalEntries,
      newEntries,
      processedEntries,
      archivedEntries
    };
  }, [entries]);

  return {
    entries,
    isLoading,
    loadError,
    summary,
    refetch: () => fetchEntries({ silent: true }),
    processEntry,
    archiveEntry
  };
};
