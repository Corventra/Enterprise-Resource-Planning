import { Plus } from 'lucide-react';
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
  const { filters, filteredCampaigns, paginatedCampaigns, currentPage, totalPages, setCurrentPage, updateFilter, resetFilters } =
    useCampaignFilters(campaigns);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | undefined>();
  const [deletingCampaign, setDeletingCampaign] = useState<Campaign | undefined>();

  const pageNumbers = useMemo(() => Array.from({ length: totalPages }, (_, index) => index + 1), [totalPages]);

  return (
    <div className="space-y-5">
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
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
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
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading campaigns...</div>
      ) : filteredCampaigns.length === 0 ? (
        <CampaignEmptyState onCreate={() => setShowCreateModal(true)} />
      ) : (
        <>
          <CampaignsTable
            campaigns={paginatedCampaigns}
            onView={(campaign) => navigate(`/campaigns/${campaign.id}`)}
            onEdit={(campaign) => setEditingCampaign(campaign)}
            onDelete={(campaign) => setDeletingCampaign(campaign)}
          />

          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
            <p className="text-slate-500">
              Showing page {currentPage} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
              >
                Previous
              </button>
              {pageNumbers.map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`rounded-md px-3 py-1.5 ${
                    page === currentPage
                      ? 'bg-blue-600 text-white'
                      : 'border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </>
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
