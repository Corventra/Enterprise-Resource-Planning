import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { useCampaignPermissions } from '../hooks/use-campaign-permissions';
import { CampaignDetailHeader } from '../components/detail/campaign-detail-header';
import { CampaignDetailSpecifications } from '../components/detail/campaign-detail-specifications';
import { CampaignDetailSummaryCards } from '../components/detail/campaign-detail-summary-cards';
import { CampaignDetailVisualPanel } from '../components/detail/campaign-detail-visual-panel';
import { CampaignDetailTabs, type CampaignDetailTab } from '../components/detail/campaign-detail-tabs';
import { FormsTab } from '../components/detail/forms-tab';
import { SubmissionsTab } from '../components/detail/submissions-tab';
import { DeleteCampaignConfirmDialog } from '../components/modals/delete-campaign-confirm-dialog';
import { DeleteFormConfirmDialog } from '../components/modals/delete-form-confirm-dialog';
import { EditCampaignModal } from '../components/modals/edit-campaign-modal';
import { SubmissionDetailModal } from '../components/modals/submission-detail-modal';
import { useCampaignDetail } from '../hooks/use-campaign-detail';
import { campaignsService } from '../services/campaigns-service';
import type { Form, Submission } from '../types/campaign.types';

export const CampaignDetailPage = () => {
  const navigate = useNavigate();
  const { campaignId } = useParams();
  const { canViewCampaignArea, canManageCampaigns, canViewForms, canManageForms } = useCampaignPermissions();
  const { campaign, forms, submissions, bankDataEntries, isLoading, deleteForm, updateForm, refetch } =
    useCampaignDetail(campaignId);

  const [activeTab, setActiveTab] = useState<CampaignDetailTab>(() => (canViewForms ? 'forms' : 'submissions'));
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | undefined>();
  const [deletingForm, setDeletingForm] = useState<Form | undefined>();
  const [showEditCampaign, setShowEditCampaign] = useState(false);
  const [showDeleteCampaign, setShowDeleteCampaign] = useState(false);

  useEffect(() => {
    if (!canViewForms && activeTab === 'forms') {
      setActiveTab('submissions');
    }
  }, [canViewForms, activeTab]);

  const qualifiedSubmissions = useMemo(
    () => submissions.filter((submission) => submission.status === 'Qualified').length,
    [submissions]
  );

  if (!canViewCampaignArea) {
    return <Navigate to="/dashboard" replace />;
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-[#eceef0] bg-white p-4 text-sm text-[#737784] shadow-sm">
        Loading detail...
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="rounded-xl border border-[#eceef0] bg-white p-4 shadow-sm">
        <h1 className="text-base font-semibold text-[#191c1e]">Campaign not found</h1>
        <button
          type="button"
          onClick={() => navigate('/campaigns')}
          className="mt-3 rounded-lg border border-[#c3c6d5] px-3 py-1.5 text-xs font-medium text-[#191c1e] hover:bg-[#eceef0] sm:text-sm"
        >
          Back to Campaigns
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <CampaignDetailHeader
        campaign={campaign}
        canManageCampaigns={canManageCampaigns}
        onBack={() => navigate('/campaigns')}
        onEditCampaign={() => setShowEditCampaign(true)}
        onDeleteCampaign={() => setShowDeleteCampaign(true)}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-stretch lg:gap-6">
        <div className="flex flex-col gap-5 lg:col-span-8">
          <CampaignDetailSpecifications campaign={campaign} />
          <CampaignDetailSummaryCards
            formsCount={forms.length}
            submissionsCount={submissions.length}
            qualifiedSubmissions={qualifiedSubmissions}
            bankEntriesCount={bankDataEntries.length}
          />
        </div>
        <div className="flex min-h-0 lg:col-span-4">
          <CampaignDetailVisualPanel campaign={campaign} />
        </div>
      </div>

      <section className="mt-6 overflow-hidden rounded-xl border border-[#eceef0] bg-white shadow-sm">
        <CampaignDetailTabs
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          showFormsTab={canViewForms}
          formsCount={forms.length}
          submissionsCount={submissions.length}
        />

        <div className="px-4 pb-4 sm:px-5 sm:pb-5">
          {activeTab === 'forms' && canViewForms && (
            <FormsTab
              campaignId={campaign.id}
              campaignName={campaign.name}
              forms={forms}
              canManageForms={canManageForms}
              onCreateForm={() => {
                const campaignNameParam = encodeURIComponent(campaign.name);
                navigate(`/forms?campaignId=${campaign.id}&campaignName=${campaignNameParam}`);
              }}
              onDeleteForm={(form) => setDeletingForm(form)}
              onToggleStatus={async (form) => {
                await updateForm(form.id, { status: form.status === 'Active' ? 'Archived' : 'Active' });
              }}
            />
          )}

          {activeTab === 'submissions' && (
            <SubmissionsTab
              submissions={submissions}
              onViewSubmission={(submission) => setSelectedSubmission(submission)}
            />
          )}
        </div>
      </section>

      <EditCampaignModal
        open={showEditCampaign}
        campaign={campaign}
        onClose={() => setShowEditCampaign(false)}
        onSuccess={async (id, payload) => {
          await campaignsService.update(id, payload);
          await refetch();
          setShowEditCampaign(false);
        }}
      />

      <DeleteCampaignConfirmDialog
        open={showDeleteCampaign}
        campaign={campaign}
        onClose={() => setShowDeleteCampaign(false)}
        onConfirm={async (id) => {
          await campaignsService.delete(id);
          navigate('/campaigns');
        }}
      />

      <SubmissionDetailModal
        open={Boolean(selectedSubmission)}
        submission={selectedSubmission}
        onClose={() => setSelectedSubmission(undefined)}
      />

      <DeleteFormConfirmDialog
        open={Boolean(deletingForm)}
        form={deletingForm}
        onClose={() => setDeletingForm(undefined)}
        onConfirm={async (formId) => {
          await deleteForm(formId);
        }}
      />
    </div>
  );
};
