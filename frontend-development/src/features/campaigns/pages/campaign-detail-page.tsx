import { ArrowLeft } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { CampaignDetailHeader } from '../components/detail/campaign-detail-header';
import { CampaignDetailSummaryCards } from '../components/detail/campaign-detail-summary-cards';
import { CampaignDetailTabs, type CampaignDetailTab } from '../components/detail/campaign-detail-tabs';
import { FormsTab } from '../components/detail/forms-tab';
import { SubmissionsTab } from '../components/detail/submissions-tab';
import { DeleteFormConfirmDialog } from '../components/modals/delete-form-confirm-dialog';
import { SubmissionDetailModal } from '../components/modals/submission-detail-modal';
import { useCampaignDetail } from '../hooks/use-campaign-detail';
import type { Form, Submission } from '../types/campaign.types';

export const CampaignDetailPage = () => {
  const navigate = useNavigate();
  const { campaignId } = useParams();
  const { campaign, forms, submissions, bankDataEntries, isLoading, deleteForm, updateForm } =
    useCampaignDetail(campaignId);

  const [activeTab, setActiveTab] = useState<CampaignDetailTab>('forms');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | undefined>();
  const [deletingForm, setDeletingForm] = useState<Form | undefined>();

  const qualifiedSubmissions = useMemo(
    () => submissions.filter((submission) => submission.status === 'Qualified').length,
    [submissions]
  );

  if (isLoading) {
    return <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading detail...</div>;
  }

  if (!campaign) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h1 className="text-lg font-semibold text-slate-900">Campaign not found</h1>
        <button
          type="button"
          onClick={() => navigate('/campaigns')}
          className="mt-4 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
        >
          Back to Campaigns
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={() => navigate('/campaigns')}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Campaigns
      </button>

      <CampaignDetailHeader campaign={campaign} />

      <CampaignDetailSummaryCards
        formsCount={forms.length}
        submissionsCount={submissions.length}
        qualifiedSubmissions={qualifiedSubmissions}
        bankEntriesCount={bankDataEntries.length}
      />

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <CampaignDetailTabs
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          formsCount={forms.length}
          submissionsCount={submissions.length}
        />

        {/* Tab Content */}
        <div className="px-6 pb-6">
          {activeTab === 'forms' && (
            <FormsTab
              forms={forms}
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
