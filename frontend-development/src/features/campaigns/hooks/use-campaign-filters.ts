import { useMemo, useState } from 'react';
import type { Campaign, CampaignFilters } from '../types/campaign.types';

const defaultFilters: CampaignFilters = {
  search: '',
  type: 'All',
  status: 'All',
  createdBy: 'All'
};

export const useCampaignFilters = (campaigns: Campaign[], pageSize = 5) => {
  const [filters, setFilters] = useState<CampaignFilters>(defaultFilters);
  const [currentPage, setCurrentPage] = useState(1);

  const typeFilterOptions = useMemo(() => {
    const uniq = Array.from(new Set(campaigns.map((c) => c.campaignTypeName)))
      .filter(Boolean)
      .sort();
    return ['All', ...uniq];
  }, [campaigns]);

  const createdByFilterOptions = useMemo(() => {
    const uniq = Array.from(new Set(campaigns.map((c) => c.createdBy)))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, 'id'));
    return ['All', ...uniq];
  }, [campaigns]);

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((campaign) => {
      const q = filters.search.toLowerCase().trim();
      const matchSearch =
        q === '' ||
        campaign.name.toLowerCase().includes(q) ||
        campaign.topicName.toLowerCase().includes(q) ||
        campaign.campaignCode.toLowerCase().includes(q) ||
        campaign.id.toLowerCase().includes(q);
      const matchType = filters.type === 'All' || campaign.campaignTypeName === filters.type;
      const matchStatus = filters.status === 'All' || campaign.status === filters.status;
      const matchCreatedBy = filters.createdBy === 'All' || campaign.createdBy === filters.createdBy;

      return matchSearch && matchType && matchStatus && matchCreatedBy;
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
    pageSize,
    typeFilterOptions,
    createdByFilterOptions,
    setCurrentPage,
    updateFilter,
    resetFilters
  };
};
