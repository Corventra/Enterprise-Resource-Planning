import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router';
import { PERMISSIONS } from '../../../app/permissions';
import { useAuth } from '../../../app/store/auth-store';
import { getCampaignById } from '../../campaigns/services/campaigns-api';
import { FormBuilderCanvas } from '../components/builder/form-builder-canvas';
import { FormBuilderSettingsPanel } from '../components/builder/form-builder-settings-panel';
import { FormBuilderTopBar } from '../components/builder/form-builder-top-bar';
import { useFormBuilder } from '../hooks/use-form-builder';
import { useFormBuilderDnd } from '../hooks/use-form-builder-dnd';
import { getFormById } from '../services/forms-api';

export const FormBuilderPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ campaignId?: string; formId?: string }>();
  const campaignIdParam = params.campaignId;
  const [searchParams] = useSearchParams();

  const pathFormId = params.formId;
  const isCreateMode = /\/forms\/new$/.test(location.pathname);

  const [resolvedCampaignId, setResolvedCampaignId] = useState<string>(campaignIdParam ?? '');
  const [resolvedCampaignName, setResolvedCampaignName] = useState<string | undefined>(undefined);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [bannerSuccess, setBannerSuccess] = useState<string | null>(null);

  const { can } = useAuth();
  const canViewForms = can(PERMISSIONS.FORM_VIEW) || can(PERMISSIONS.FORM_MANAGE);
  const hasManagePermission = can(PERMISSIONS.FORM_MANAGE);

  const campaignIdFromQuery = searchParams.get('campaignId') || undefined;
  const campaignNameFromQuery = searchParams.get('campaignName')
    ? decodeURIComponent(searchParams.get('campaignName')!)
    : undefined;

  useEffect(() => {
    if (campaignIdParam) {
      setResolvedCampaignId(campaignIdParam);
      return;
    }
    if (campaignIdFromQuery) {
      setResolvedCampaignId(campaignIdFromQuery);
      return;
    }
    if (!pathFormId || isCreateMode) {
      setResolvedCampaignId('');
      return;
    }
    let cancelled = false;
    void getFormById(pathFormId)
      .then((doc) => {
        if (!cancelled) setResolvedCampaignId(doc.campaignId);
      })
      .catch(() => {
        if (!cancelled) setResolvedCampaignId('');
      });
    return () => {
      cancelled = true;
    };
  }, [campaignIdParam, campaignIdFromQuery, pathFormId, isCreateMode]);

  useEffect(() => {
    if (!resolvedCampaignId) return;
    let cancelled = false;
    void getCampaignById(resolvedCampaignId)
      .then((c) => {
        if (!cancelled && c) setResolvedCampaignName(c.name);
      })
      .catch(() => {
        if (!cancelled) setResolvedCampaignName(undefined);
      });
    return () => {
      cancelled = true;
    };
  }, [resolvedCampaignId]);

  const [ownerId, setOwnerId] = useState<number | null>(null);
  useEffect(() => {
    if (!resolvedCampaignId) {
      setOwnerId(null);
      return;
    }
    let cancelled = false;
    void getCampaignById(resolvedCampaignId)
      .then((c) => {
        if (!cancelled) setOwnerId(c?.createdById ?? null);
      })
      .catch(() => {
        if (!cancelled) setOwnerId(null);
      });
    return () => {
      cancelled = true;
    };
  }, [resolvedCampaignId]);

  const { user } = useAuth();
  const canManageBuilder = useMemo(() => {
    if (!hasManagePermission || user?.id == null || ownerId == null) return false;
    return Number(user.id) === Number(ownerId);
  }, [hasManagePermission, user?.id, ownerId]);

  const campaignNameDisplay = resolvedCampaignName ?? campaignNameFromQuery;

  const onError = useCallback((message: string) => {
    setBannerError(message);
    setBannerSuccess(null);
  }, []);

  const initialFormId = isCreateMode ? undefined : pathFormId;

  const {
    form,
    isLoading,
    isSaving,
    selectedField,
    selectedFieldId,
    formPersisted,
    sortableFieldIds,
    phaseBBusy,
    setSelectedFieldId,
    setMetadata,
    headerImageFile,
    setHeaderImageFile,
    clearHeaderImage,
    addField,
    deleteField,
    reorderFields,
    saveDraft,
    saveAndPublish,
    applyFieldSettings,
    addOption,
    updateOptionRow,
    removeOption
  } = useFormBuilder({
    campaignId: resolvedCampaignId,
    campaignName: campaignNameDisplay,
    initialFormId,
    isCreateMode,
    canManageBuilder,
    onError
  });

  const readOnly = !canManageBuilder;
  /** Hanya DRAFT yang boleh diedit; PUBLISHED / INACTIVE = read-only di canvas & settings. */
  const builderContentLocked = useMemo(() => {
    if (!form) return true;
    if (isCreateMode && !form.id) return false;
    if (!form.id) return false;
    return form.backendStatus !== 'DRAFT';
  }, [form, isCreateMode]);

  const settingsReadOnly = readOnly || builderContentLocked;

  const dndDisabled =
    !canManageBuilder || sortableFieldIds.length < 2 || form?.backendStatus !== 'DRAFT';

  const { sensors, collisionDetection, activeFieldId, handleDragStart, handleDragOver, handleDragEnd } =
    useFormBuilderDnd({
      fieldIds: sortableFieldIds,
      onReorder: (ids) => void reorderFields(ids),
      disabled: dndDisabled
    });

  const previewHref = useMemo(() => {
    if (!form?.id) return null;
    if (resolvedCampaignId) {
      return `/campaigns/${resolvedCampaignId}/forms/${form.id}/preview`;
    }
    return `/forms/${form.id}/preview`;
  }, [form?.id, resolvedCampaignId]);

  /** Save Draft / Publish hanya untuk draft (termasuk create sebelum id). */
  const canManagePhaseB = canManageBuilder && (!form?.id || form.backendStatus === 'DRAFT');

  const publishButtonLabel = formPersisted ? 'Publish' : 'Save & Publish';

  useEffect(() => {
    if (!bannerSuccess) return;
    const t = window.setTimeout(() => setBannerSuccess(null), 4000);
    return () => window.clearTimeout(t);
  }, [bannerSuccess]);

  if (!canViewForms) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!resolvedCampaignId && !isLoading && !isCreateMode && pathFormId) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
        Memuat konteks campaign…
      </div>
    );
  }

  if (!resolvedCampaignId && isCreateMode) {
    return <Navigate to="/campaigns" replace />;
  }

  if (isLoading || !form) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">
        Loading form builder…
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg">
      {bannerError ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
          {bannerError}
          <button
            type="button"
            className="ml-2 font-medium underline"
            onClick={() => setBannerError(null)}
          >
            Tutup
          </button>
        </div>
      ) : null}
      {bannerSuccess ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-900">
          {bannerSuccess}
        </div>
      ) : null}

      <FormBuilderTopBar
        title={form.title}
        campaignName={form.campaignName ?? campaignNameDisplay}
        isSaving={isSaving}
        canManageBuilder={canManageBuilder}
        canManageLifecycle={canManagePhaseB}
        previewHref={previewHref}
        formPersisted={formPersisted}
        backendStatus={form.backendStatus}
        phaseBBusy={phaseBBusy}
        publishButtonLabel={publishButtonLabel}
        onBack={() => {
          if (resolvedCampaignId) navigate(`/campaigns/${resolvedCampaignId}`);
          else navigate(-1);
        }}
        onSaveDraft={() =>
          void saveDraft().then((ok) => {
            if (ok) setBannerSuccess('Draft disimpan.');
          })
        }
        onPublish={() =>
          void saveAndPublish().then((ok) => {
            if (ok) setBannerSuccess('Form berhasil dipublish.');
          })
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <FormBuilderCanvas
            form={form}
            readOnly={readOnly}
            canvasLocked={builderContentLocked}
            isCreateMode={isCreateMode}
            formPersisted={formPersisted}
            sortableFieldIds={sortableFieldIds}
            selectedFieldId={selectedFieldId}
            activeFieldId={activeFieldId}
            sensors={sensors}
            collisionDetection={collisionDetection}
            onSetMetadata={setMetadata}
            headerImageFile={headerImageFile}
            onHeaderImageSelect={setHeaderImageFile}
            onHeaderImageClear={clearHeaderImage}
            onSelectField={setSelectedFieldId}
            onAddField={(t) => void addField(t)}
            onDeleteField={(id) => void deleteField(id)}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          />
        </div>

        <FormBuilderSettingsPanel
          selectedField={selectedField}
          readOnly={settingsReadOnly}
          canManageBuilder={canManageBuilder}
          onCommitFieldSettings={(fieldId, payload) => void applyFieldSettings(fieldId, payload)}
          onAddOption={(fieldId) => void addOption(fieldId)}
          onUpdateOption={(fieldId, optionId, patch) => void updateOptionRow(fieldId, optionId, patch)}
          onRemoveOption={(fieldId, optionId) => void removeOption(fieldId, optionId)}
        />
      </div>
    </div>
  );
};
