import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import { PERMISSIONS } from '../../../app/permissions';
import { useAuth } from '../../../app/store/auth-store';
import { getCampaignById } from '../../campaigns/services/campaigns-api';
import { PublicFormFieldInput } from '../components/public/public-form-field';
import { PublicFormHeaderBanner } from '../components/public/public-form-header-banner';
import { PublicFormHtml } from '../components/public/public-form-html';
import { getFormById } from '../services/forms-api';
import type { FormBuilderDocument } from '../types/form-builder.types';
import { withPublicFormFieldDisplayDefaults } from '../utils/lead-capture-field-fallbacks';
import { mapBuilderFieldsToPublicFields } from '../utils/map-builder-field-to-public-field';
import { resolvePublicFormHeaderImageUrl } from '../utils/resolve-form-media-url';

const publicFormLayoutClass = 'mx-auto w-full max-w-[772px]';

export const FormPreviewPage = () => {
  const navigate = useNavigate();
  const params = useParams<{ campaignId?: string; formId?: string }>();
  const formId = params.formId;
  const campaignIdParam = params.campaignId;

  const { can, user } = useAuth();
  const canViewForms = can(PERMISSIONS.FORM_VIEW) || can(PERMISSIONS.FORM_MANAGE);

  const [doc, setDoc] = useState<FormBuilderDocument | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [ownerId, setOwnerId] = useState<number | null>(null);

  const onError = useCallback((message: string) => {
    setLoadError(message);
  }, []);

  useEffect(() => {
    if (!formId) {
      setIsLoading(false);
      setDoc(null);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    void getFormById(formId)
      .then((d) => {
        if (!cancelled) {
          setDoc(d);
          setLoadError(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDoc(null);
          onError('Gagal memuat form');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [formId, onError]);

  const resolvedCampaignId = campaignIdParam ?? doc?.campaignId ?? '';

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

  const hasManagePermission = can(PERMISSIONS.FORM_MANAGE);
  const canManageBuilder =
    hasManagePermission && user?.id != null && ownerId != null && Number(user.id) === Number(ownerId);

  const builderHref =
    resolvedCampaignId && formId
      ? `/campaigns/${resolvedCampaignId}/forms/${formId}`
      : formId
        ? `/forms/${formId}`
        : '/campaigns';

  const headerImageUrl = useMemo(
    () => resolvePublicFormHeaderImageUrl(doc?.headerImageUrl),
    [doc?.headerImageUrl]
  );
  const usesDefaultHeader = !doc?.headerImageUrl?.trim();

  const displayFields = useMemo(() => {
    if (!doc) return [];
    return mapBuilderFieldsToPublicFields(doc.fields).map((field) => withPublicFormFieldDisplayDefaults(field));
  }, [doc]);

  if (!canViewForms) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!formId) {
    return <Navigate to="/campaigns" replace />;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center rounded-lg bg-[#f0f4f8] px-4">
        <p className="text-sm text-[#737784]">Memuat preview…</p>
      </div>
    );
  }

  if (loadError || !doc) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        {loadError ?? 'Form tidak ditemukan.'}
        <button type="button" className="ml-2 font-medium underline" onClick={() => navigate(-1)}>
          Kembali
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#eceef0] bg-white px-4 py-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </button>
        <Link
          to={builderHref}
          className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
        >
          {canManageBuilder && doc.backendStatus === 'DRAFT' ? 'Edit form' : 'Buka builder'}
        </Link>
      </div>

      <div className="rounded-lg bg-[#f0f4f8] px-4 py-8 sm:py-12">
        <div className={`${publicFormLayoutClass} space-y-4`}>
          <PublicFormHeaderBanner imageUrl={headerImageUrl} usesDefaultImage={usesDefaultHeader} />
          <article className="overflow-hidden rounded-2xl border border-[#eceef0] bg-white shadow-sm">
            <div className="h-2 bg-[#003c90]" aria-hidden />
            <div className="px-6 py-6 sm:px-8 sm:py-8">
              <h1 className="text-2xl font-bold text-[#191c1e] sm:text-3xl">{doc.title}</h1>
              <PublicFormHtml html={doc.description} className="mt-3" />
            </div>
          </article>

          <div className="space-y-4">
            {displayFields.map((field) => (
              <PublicFormFieldInput
                key={field.field_id}
                field={field}
                value={undefined}
                fileValue={null}
                disabled
                onChange={() => undefined}
                onFileChange={() => undefined}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
