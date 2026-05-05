import { useCallback, useEffect, useState } from 'react';
import { systemConfigService } from '../services/system-config-service';
import type { SystemConfig } from '../types/admin.types';

export const useSystemConfig = () => {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const next = await systemConfigService.get();
      setConfig(next);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat konfigurasi');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const save = useCallback(
    async (patch: Partial<Omit<SystemConfig, 'updatedAt'>>) => {
      const next = await systemConfigService.update(patch);
      setConfig(next);
      return next;
    },
    []
  );

  const reset = useCallback(async () => {
    const next = await systemConfigService.resetToMock();
    setConfig(next);
    return next;
  }, []);

  return { config, isLoading, error, refresh, save, reset };
};
