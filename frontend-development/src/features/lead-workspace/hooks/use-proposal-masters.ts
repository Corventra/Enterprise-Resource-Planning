import { useCallback, useEffect, useState } from 'react';
import { proposalMastersService } from '../services/proposal-masters-service';
import type { ProposalMasterService, ProposalMasterServiceClass } from '../types/lead-proposals.types';

export const useProposalMasters = () => {
  const [serviceClasses, setServiceClasses] = useState<ProposalMasterServiceClass[]>([]);
  const [services, setServices] = useState<ProposalMasterService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchMasters = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [nextServiceClasses, nextServices] = await Promise.all([
        proposalMastersService.listServiceClasses(),
        proposalMastersService.listServices()
      ]);
      setServiceClasses(nextServiceClasses);
      setServices(nextServices);
    } catch (e) {
      setServiceClasses([]);
      setServices([]);
      setLoadError(e instanceof Error ? e.message : 'Gagal memuat master service proposal.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchMasters();
  }, [fetchMasters]);

  return {
    serviceClasses,
    services,
    isLoading,
    loadError,
    refetch: fetchMasters
  };
};
