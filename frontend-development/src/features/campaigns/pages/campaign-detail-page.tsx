import { useCallback, useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router';
import { useAuth } from '../../../app/store/auth-store';
import { Toast } from '../../../components/ui/toast';
import { useCampaignPermissions } from '../hooks/use-campaign-permissions';
import { CampaignDetailHeader } from '../components/detail/campaign-detail-header';
import { CampaignDetailSpecifications } from '../components/detail/campaign-detail-specifications';
import { CampaignDetailSummaryCards } from '../components/detail/campaign-detail-summary-cards';
import { CampaignDetailVisualPanel } from '../components/detail/campaign-detail-visual-panel';
import { CampaignDetailTabs, type CampaignDetailTab } from '../components/detail/campaign-detail-tabs';
import { FormsTab } from '../components/detail/forms-tab';
import { SubmissionsTab } from '../components/detail/submissions-tab';
import { DeleteCampaignConfirmDialog } from '../components/modals/delete-campaign-confirm-dialog';
import { EditCampaignModal } from '../components/modals/edit-campaign-modal';
import { SubmissionDetailModal } from '../components/modals/submission-detail-modal';
import type { FormBuilderNavigationState } from '../../forms/types/form-navigation-state';
import { CAMPAIGN_TOAST, useCampaignActionToast } from '../hooks/use-campaign-action-toast';
import { useCampaignDetail } from '../hooks/use-campaign-detail';
import type { CampaignSubmitInput } from '../types/campaign.types';
import { getCampaignTopics, getCampaignTypes } from '../services/campaigns-api';
import type { CampaignLookupTopic, CampaignLookupType } from '../types/campaign.types';

export const CampaignDetailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { campaignId } = useParams();
  const { user } = useAuth();
  const { canViewCampaignArea, canManageCampaigns, canViewForms, canManageForms } = useCampaignPermissions();
  const {
    campaign,
    forms,
    submissionsCount,
    isLoading,
    updateCampaign,
    archiveCampaign,
    refetch
  } = useCampaignDetail(campaignId);

  const [searchParams, setSearchParams] = useSearchParams();

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

  const [activeTab, setActiveTab] = useState<CampaignDetailTab>(() => (canViewForms ? 'forms' : 'submissions'));
  const [highlightFormId, setHighlightFormId] = useState<string | null>(null);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'forms' && canViewForms) {
      setActiveTab('forms');
    }
    const focus = searchParams.get('focusForm');
    if (focus) {
      if (canViewForms) setActiveTab('forms');
      void refetch().finally(() => {
        setHighlightFormId(focus);
      });
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete('focusForm');
          return next;
        },
        { replace: true }
      );
    }
  }, [searchParams, canViewForms, refetch, setSearchParams]);
  const [selectedFormIdForSubmissions, setSelectedFormIdForSubmissions] = useState<string | null>(null);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const { message: successToastMessage, dismiss: dismissSuccessToast, show: showSuccessToast } =
    useCampaignActionToast();

  const [showEditCampaign, setShowEditCampaign] = useState(false);
  const [showArchiveCampaign, setShowArchiveCampaign] = useState(false);

  useEffect(() => {
    const pendingToast = (location.state as FormBuilderNavigationState | null)?.formActionToast;
    if (!pendingToast) return;
    showSuccessToast(pendingToast);
    navigate({ pathname: location.pathname, search: location.search }, { replace: true, state: null });
  }, [location.pathname, location.search, location.state, navigate, showSuccessToast]);

  const handleUpdateCampaignSuccess = useCallback(
    async (_campaignId: string, input: CampaignSubmitInput) => {
      await updateCampaign(input);
      setShowEditCampaign(false);
      showSuccessToast(CAMPAIGN_TOAST.updated);
    },
    [updateCampaign, showSuccessToast]
  );

  const handleArchiveCampaignConfirm = useCallback(
    async (_campaignId: string) => {
      void _campaignId;
      await archiveCampaign();
      setShowArchiveCampaign(false);
      showSuccessToast(CAMPAIGN_TOAST.archived);
    },
    [archiveCampaign, showSuccessToast]
  );

  useEffect(() => {
    if (!canViewForms && activeTab === 'forms') {
      setActiveTab('submissions');
    }
  }, [canViewForms, activeTab]);

  const canOwnerManage =
    Boolean(campaign) &&
    canManageCampaigns &&
    user?.id != null &&
    Number(user.id) === Number(campaign!.createdById);

  const canManageCampaignForms = canOwnerManage && canManageForms;

  const handleChangeTab = (tab: CampaignDetailTab) => {
    if (tab === 'submissions') {
      setSelectedFormIdForSubmissions(null);
    }
    setActiveTab(tab);
  };

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
        canOwnerManage={canOwnerManage}
        onBack={() => navigate('/campaigns')}
        onEditCampaign={() => setShowEditCampaign(true)}
        onArchiveCampaign={() => setShowArchiveCampaign(true)}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-stretch lg:gap-6">
        <div className="flex flex-col gap-5 lg:col-span-8">
          <CampaignDetailSpecifications campaign={campaign} />
          <CampaignDetailSummaryCards
            formsCount={forms.length}
            submissionsCount={submissionsCount}
          />
        </div>
        <div className="flex min-h-0 lg:col-span-4">
          <CampaignDetailVisualPanel campaign={campaign} />
        </div>
      </div>

      <section className="mt-6 overflow-hidden rounded-xl border border-[#eceef0] bg-white shadow-sm">
        <CampaignDetailTabs
          activeTab={activeTab}
          onChangeTab={handleChangeTab}
          showFormsTab={canViewForms}
          formsCount={forms.length}
        />

        <div className="px-4 pb-4 sm:px-5 sm:pb-5">
          {activeTab === 'forms' && canViewForms && (
            <FormsTab
              campaignId={campaign.id}
              forms={forms}
              canManageCampaignForms={canManageCampaignForms}
              highlightFormId={highlightFormId}
              onHighlightConsumed={() => setHighlightFormId(null)}
              onRefetchForms={() => void refetch()}
              onCreateForm={() => {
                navigate(`/campaigns/${campaign.id}/forms/new`);
              }}
              onViewSubmissions={(formId) => {
                setSelectedFormIdForSubmissions(formId);
                setActiveTab('submissions');
              }}
            />
          )}

          {activeTab === 'submissions' && (
            <SubmissionsTab
              forms={forms}
              selectedFormId={selectedFormIdForSubmissions}
              onSelectedFormChange={setSelectedFormIdForSubmissions}
              onViewSubmission={(formId, submissionId) => {
                setSelectedFormIdForSubmissions(formId);
                setSelectedSubmissionId(String(submissionId));
              }}
            />
          )}
        </div>
      </section>

      <EditCampaignModal
        key={campaign.id}
        open={showEditCampaign}
        campaign={campaign}
        typeOptions={lookups.types}
        topicOptions={lookups.topics}
        onClose={() => setShowEditCampaign(false)}
        onSuccess={handleUpdateCampaignSuccess}
      />

      <DeleteCampaignConfirmDialog
        open={showArchiveCampaign}
        campaign={campaign}
        onClose={() => setShowArchiveCampaign(false)}
        onConfirm={handleArchiveCampaignConfirm}
      />

      <Toast
        open={successToastMessage != null}
        message={successToastMessage ?? ''}
        onClose={dismissSuccessToast}
      />

      <SubmissionDetailModal
        open={Boolean(selectedSubmissionId)}
        formId={selectedFormIdForSubmissions ?? undefined}
        submissionId={selectedSubmissionId ?? undefined}
        onClose={() => setSelectedSubmissionId(null)}
      />

    </div>
  );
};
