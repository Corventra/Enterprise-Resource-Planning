import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { useAuth } from '../../../app/store/auth-store';
import { useCampaignPermissions } from '../hooks/use-campaign-permissions';
import { CampaignEmptyState } from '../components/list/campaign-empty-state';
import { CampaignFiltersSection } from '../components/list/campaign-filters';
import { CampaignsSummaryCards } from '../components/list/campaigns-summary-cards';
import { CampaignsTable } from '../components/list/campaigns-table';
import { CreateCampaignModal } from '../components/modals/create-campaign-modal';
import { DeleteCampaignConfirmDialog } from '../components/modals/delete-campaign-confirm-dialog';
import { EditCampaignModal } from '../components/modals/edit-campaign-modal';
import { useCampaignFilters } from '../hooks/use-campaign-filters';
import { useCampaignsList } from '../hooks/use-campaigns-list';
import { getCampaignTopics, getCampaignTypes } from '../services/campaigns-api';
import type { Campaign, CampaignLookupTopic, CampaignLookupType } from '../types/campaign.types';

export const CampaignsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canViewCampaignArea, canManageCampaigns } = useCampaignPermissions();
  const { campaigns, isLoading, summary, createCampaign, updateCampaign, archiveCampaign } = useCampaignsList();
  const {
    filters,
    filteredCampaigns,
    paginatedCampaigns,
    currentPage,
    totalPages,
    pageSize,
    typeFilterOptions,
    setCurrentPage,
    updateFilter,
    resetFilters
  } = useCampaignFilters(campaigns);

  const [lookups, setLookups] = useState<{
    types: CampaignLookupType[];
    topics: CampaignLookupTopic[];
  }>({ types: [], topics: [] });

  useEffect(() => {
    if (!canViewCampaignArea) return;
    let cancelled = false;
    void Promise.all([getCampaignTypes(), getCampaignTopics()])
      .then(([types, topics]) => {
        if (!cancelled) setLookups({ types, topics });
      })
      .catch(() => {
        if (!cancelled) setLookups({ types: [], topics: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [canViewCampaignArea]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | undefined>();
  const [archivingCampaign, setArchivingCampaign] = useState<Campaign | undefined>();

  const pageNumbers = useMemo(() => Array.from({ length: totalPages }, (_, index) => index + 1), [totalPages]);

  const canOwnerManageCampaign = (campaign: Campaign) =>
    canManageCampaigns && user?.id != null && Number(user.id) === Number(campaign.createdById);

  if (!canViewCampaignArea) {
    return <Navigate to="/dashboard" replace />;
  }

  const rangeStart = filteredCampaigns.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, filteredCampaigns.length);

  const paginationFooter =
    totalPages > 0 ? (
      <div className="flex flex-col gap-3 border-none bg-[#eceef0] px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-medium text-[#737784] sm:text-sm">
          Showing{' '}
          <span className="font-bold text-[#191c1e]">
            {rangeStart} - {rangeEnd}
          </span>{' '}
          of {filteredCampaigns.length.toLocaleString()} campaigns
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            className="rounded-lg p-1.5 text-[#737784] transition-colors hover:bg-[#e0e3e5] disabled:opacity-30"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {pageNumbers.map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => setCurrentPage(page)}
              className={
                page === currentPage
                  ? 'flex h-7 w-7 items-center justify-center rounded-md bg-[#003c90] text-xs font-bold text-white shadow-sm shadow-[#003c90]/20'
                  : 'flex h-7 w-7 items-center justify-center rounded-md text-xs font-medium text-[#737784] transition-colors hover:bg-[#e0e3e5]'
              }
            >
              {page}
            </button>
          ))}
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
            className="rounded-lg p-1.5 text-[#737784] transition-colors hover:bg-[#e0e3e5] disabled:opacity-30"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    ) : null;

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Campaigns</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage campaign initiatives, monitor submissions, and update campaign lifecycle.
          </p>
        </div>
        {canManageCampaigns ? (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[linear-gradient(135deg,#003c90_0%,#0f52ba_100%)] px-5 py-2 text-sm font-bold text-white shadow-md shadow-[#003c90]/20 transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Create Campaign
          </button>
        ) : null}
      </header>

      <CampaignsSummaryCards summary={summary} />

      <CampaignFiltersSection
        filters={filters}
        typeFilterOptions={typeFilterOptions}
        onSearchChange={(value) => updateFilter('search', value)}
        onTypeChange={(value) => updateFilter('type', value)}
        onStatusChange={(value) => updateFilter('status', value)}
        onReset={resetFilters}
      />

      {isLoading ? (
        <div className="rounded-xl border border-[#eceef0] bg-white p-4 text-sm text-[#737784] shadow-sm">
          Loading campaigns...
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <CampaignEmptyState onCreate={canManageCampaigns ? () => setShowCreateModal(true) : undefined} />
      ) : (
        <CampaignsTable
          campaigns={paginatedCampaigns}
          canOwnerManageCampaign={canOwnerManageCampaign}
          onView={(campaign) => navigate(`/campaigns/${campaign.id}`)}
          onEdit={(campaign) => setEditingCampaign(campaign)}
          onArchive={(campaign) => setArchivingCampaign(campaign)}
          footer={paginationFooter}
        />
      )}

      <CreateCampaignModal
        open={showCreateModal}
        typeOptions={lookups.types}
        topicOptions={lookups.topics}
        onClose={() => setShowCreateModal(false)}
        onSuccess={async (input) => {
          await createCampaign(input);
        }}
      />

      <EditCampaignModal
        key={editingCampaign?.id ?? 'closed'}
        open={Boolean(editingCampaign)}
        campaign={editingCampaign}
        typeOptions={lookups.types}
        topicOptions={lookups.topics}
        onClose={() => setEditingCampaign(undefined)}
        onSuccess={async (campaignId, input) => {
          await updateCampaign(campaignId, input);
        }}
      />

      <DeleteCampaignConfirmDialog
        open={Boolean(archivingCampaign)}
        campaign={archivingCampaign}
        onClose={() => setArchivingCampaign(undefined)}
        onConfirm={async (campaignId) => {
          await archiveCampaign(campaignId);
        }}
      />
    </div>
  );
};
