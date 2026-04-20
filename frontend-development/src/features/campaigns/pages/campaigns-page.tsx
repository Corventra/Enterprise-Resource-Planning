import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { CampaignEmptyState } from '../components/list/campaign-empty-state';
import { CampaignFiltersSection } from '../components/list/campaign-filters';
import { CampaignsSummaryCards } from '../components/list/campaigns-summary-cards';
import { CampaignsTable } from '../components/list/campaigns-table';
import { CreateCampaignModal } from '../components/modals/create-campaign-modal';
import { DeleteCampaignConfirmDialog } from '../components/modals/delete-campaign-confirm-dialog';
import { EditCampaignModal } from '../components/modals/edit-campaign-modal';
import { useCampaignFilters } from '../hooks/use-campaign-filters';
import { useCampaignsList } from '../hooks/use-campaigns-list';
import type { Campaign } from '../types/campaign.types';

export const CampaignsPage = () => {
  const navigate = useNavigate();
  const { campaigns, isLoading, summary, createCampaign, updateCampaign, deleteCampaign } = useCampaignsList();
  const {
    filters,
    filteredCampaigns,
    paginatedCampaigns,
    currentPage,
    totalPages,
    pageSize,
    setCurrentPage,
    updateFilter,
    resetFilters
  } = useCampaignFilters(campaigns);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | undefined>();
  const [deletingCampaign, setDeletingCampaign] = useState<Campaign | undefined>();

  const pageNumbers = useMemo(() => Array.from({ length: totalPages }, (_, index) => index + 1), [totalPages]);

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
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[linear-gradient(135deg,#003c90_0%,#0f52ba_100%)] px-5 py-2 text-sm font-bold text-white shadow-md shadow-[#003c90]/20 transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Create Campaign
        </button>
      </header>

      <CampaignsSummaryCards summary={summary} />

      <CampaignFiltersSection
        filters={filters}
        onSearchChange={(value) => updateFilter('search', value)}
        onTypeChange={(value) => updateFilter('type', value)}
        onChannelChange={(value) => updateFilter('channel', value)}
        onStatusChange={(value) => updateFilter('status', value)}
        onReset={resetFilters}
      />

      {isLoading ? (
        <div className="rounded-xl border border-[#eceef0] bg-white p-4 text-sm text-[#737784] shadow-sm">
          Loading campaigns...
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <CampaignEmptyState onCreate={() => setShowCreateModal(true)} />
      ) : (
        <CampaignsTable
          campaigns={paginatedCampaigns}
          onView={(campaign) => navigate(`/campaigns/${campaign.id}`)}
          onEdit={(campaign) => setEditingCampaign(campaign)}
          onDelete={(campaign) => setDeletingCampaign(campaign)}
          footer={paginationFooter}
        />
      )}

      <CreateCampaignModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={async (payload) => {
          await createCampaign(payload);
        }}
      />

      <EditCampaignModal
        open={Boolean(editingCampaign)}
        campaign={editingCampaign}
        onClose={() => setEditingCampaign(undefined)}
        onSuccess={async (campaignId, payload) => {
          await updateCampaign(campaignId, payload);
        }}
      />

      <DeleteCampaignConfirmDialog
        open={Boolean(deletingCampaign)}
        campaign={deletingCampaign}
        onClose={() => setDeletingCampaign(undefined)}
        onConfirm={async (campaignId) => {
          await deleteCampaign(campaignId);
        }}
      />
    </div>
  );
};
