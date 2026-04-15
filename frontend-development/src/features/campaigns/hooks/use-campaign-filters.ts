import { useMemo, useState } from 'react';
import type { Campaign, CampaignFilters } from '../types/campaign.types';

const defaultFilters: CampaignFilters = {
  search: '',
  type: 'All',
  channel: 'All',
  status: 'All'
};

export const useCampaignFilters = (campaigns: Campaign[], pageSize = 5) => {
  const [filters, setFilters] = useState<CampaignFilters>(defaultFilters);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((campaign) => {
      const matchSearch = campaign.name.toLowerCase().includes(filters.search.toLowerCase());
      const matchType = filters.type === 'All' || campaign.type === filters.type;
      const matchChannel = filters.channel === 'All' || campaign.channel === filters.channel;
      const matchStatus = filters.status === 'All' || campaign.status === filters.status;

      return matchSearch && matchType && matchChannel && matchStatus;
    });
  }, [campaigns, filters]);

  const totalPages = Math.max(1, Math.ceil(filteredCampaigns.length / pageSize));
  const normalizedPage = Math.min(currentPage, totalPages);

  const paginatedCampaigns = useMemo(() => {
    const start = (normalizedPage - 1) * pageSize;
    return filteredCampaigns.slice(start, start + pageSize);
  }, [filteredCampaigns, normalizedPage, pageSize]);

  const updateFilter = <K extends keyof CampaignFilters>(key: K, value: CampaignFilters[K]) => {
    setCurrentPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
    setCurrentPage(1);
  };

  return {
    filters,
    filteredCampaigns,
    paginatedCampaigns,
    currentPage: normalizedPage,
    totalPages,
    setCurrentPage,
    updateFilter,
    resetFilters
  };
};
