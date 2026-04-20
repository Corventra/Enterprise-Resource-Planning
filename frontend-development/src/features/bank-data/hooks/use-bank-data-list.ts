import { useCallback, useEffect, useMemo, useState } from 'react';
import { bankDataService } from '../services/bank-data-service';
import type { BankDataEntry } from '../types/bank-data.types';

export const useBankDataList = () => {
  const [entries, setEntries] = useState<BankDataEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    setIsLoading(true);
    const data = await bankDataService.getAll();
    setEntries(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void fetchEntries();
  }, [fetchEntries]);

  const processEntry = async (entryId: string) => {
    await bankDataService.updateStatus(entryId, 'Processed');
    await fetchEntries();
  };

  const archiveEntry = async (entryId: string) => {
    await bankDataService.updateStatus(entryId, 'Archived');
    await fetchEntries();
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
    summary,
    refetch: fetchEntries,
    processEntry,
    archiveEntry
  };
};
