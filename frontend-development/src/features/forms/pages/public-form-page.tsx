import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useParams } from 'react-router';
import { ApiError } from '../../../services/api-client';
import { PublicFormFieldInput } from '../components/public/public-form-field';
import { PublicFormHeaderBanner } from '../components/public/public-form-header-banner';
import { PublicFormHtml } from '../components/public/public-form-html';
import { getPublicFormByLinkCode, submitPublicForm } from '../services/public-forms-api';
import type {
  PublicFormAnswerValue,
  PublicFormAvailability,
  PublicFormPayload,
  PublicFormSubmitResult
} from '../types/public-form.types';
import { withPublicFormFieldDisplayDefaults } from '../utils/lead-capture-field-fallbacks';
import { buildSubmitAnswers, validatePublicFormAnswers } from '../utils/public-form-validation';
import { resolvePublicFormHeaderImageUrl } from '../utils/resolve-form-media-url';

type PagePhase = 'loading' | 'ready' | 'success';

const publicFormLayoutClass = 'mx-auto w-full max-w-[772px]';

const availabilityNotice = (availability: PublicFormAvailability, formTitle: string): string | null => {
  switch (availability) {
    case 'PAUSED':
      return `Formulir “${formTitle}” sudah tidak menerima jawaban lagi. Coba hubungi pemilik formulir jika menurut Anda ini keliru.`;
    case 'INACTIVE':
      return 'Formulir ini sudah tidak aktif dan tidak dapat dikirim.';
    case 'DRAFT':
      return 'Formulir ini belum dipublikasikan untuk publik.';
    default:
      return null;
  }
};

export const PublicFormPage = () => {
  const { linkCode = '' } = useParams<{ linkCode: string }>();
  const [phase, setPhase] = useState<PagePhase>('loading');
  const [payload, setPayload] = useState<PublicFormPayload | null>(null);
  const [availability, setAvailability] = useState<PublicFormAvailability>('NOT_FOUND');
  const [answers, setAnswers] = useState<Record<number, PublicFormAnswerValue>>({});
  const [files, setFiles] = useState<Record<number, File>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<number, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState<PublicFormSubmitResult | null>(null);
  const [allowAnotherResponse, setAllowAnotherResponse] = useState(false);

  const loadForm = useCallback(async () => {
    if (!linkCode.trim()) {
      setAvailability('NOT_FOUND');
      setPayload(null);
      setPhase('ready');
      return;
    }
    setPhase('loading');
    setSubmitError(null);
    setFieldErrors({});
    try {
      const data = await getPublicFormByLinkCode(linkCode);
      setPayload(data);
      setAvailability(data.availability);
      setAnswers({});
      setFiles({});
      setPhase('ready');
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        setAvailability('NOT_FOUND');
        setPayload(null);
        setPhase('ready');
        return;
      }
      setSubmitError(e instanceof Error ? e.message : 'Gagal memuat formulir.');
      setPayload(null);
      setPhase('ready');
    }
  }, [linkCode]);

  useEffect(() => {
    void loadForm();
  }, [loadForm]);

  const canSubmit = availability === 'AVAILABLE' && phase === 'ready';
  const fieldsDisabled = availability !== 'AVAILABLE' || isSubmitting;
  const notice = payload ? availabilityNotice(availability, payload.form.title) : null;
  const headerImageUrl = useMemo(
    () => resolvePublicFormHeaderImageUrl(payload?.form.header_image_path),
    [payload?.form.header_image_path]
  );
  const usesDefaultHeader = !payload?.form.header_image_path?.trim();

  const displayFields = useMemo(
    () => (payload?.fields ?? []).map((field) => withPublicFormFieldDisplayDefaults(field)),
    [payload?.fields]
  );

  const setAnswer = (fieldId: number, value: PublicFormAnswerValue) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
    setFieldErrors((prev) => {
      if (!prev[fieldId]) return prev;
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
  };

  const setFile = (fieldId: number, file: File | null) => {
    setFiles((prev) => {
      const next = { ...prev };
      if (file) next[fieldId] = file;
      else delete next[fieldId];
      return next;
    });
    setFieldErrors((prev) => {
      if (!prev[fieldId]) return prev;
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!payload || !canSubmit) return;

    const validationErrors = validatePublicFormAnswers(displayFields, answers, files);
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setSubmitError('Periksa kembali isian yang wajib atau tidak valid.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setFieldErrors({});

    try {
      const result = await submitPublicForm(
        linkCode,
        buildSubmitAnswers(payload.fields, answers),
        files
      );
      setSuccessResult(result);
      setAllowAnotherResponse(availability === 'AVAILABLE');
      setPhase('success');
    } catch (e) {
      if (e instanceof ApiError) {
        setSubmitError(e.message);
        const detail = e.detail as { data?: { availability?: PublicFormAvailability } } | undefined;
        if (detail?.data?.availability) {
          setAvailability(detail.data.availability);
        }
      } else {
        setSubmitError(e instanceof Error ? e.message : 'Gagal mengirim formulir.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (phase === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0f4f8] px-4">
        <p className="text-sm text-[#737784]">Memuat formulir…</p>
      </div>
    );
  }

  if (availability === 'NOT_FOUND') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0f4f8] px-4">
        <div className="w-full max-w-xl rounded-2xl border border-[#eceef0] bg-white p-8 text-center shadow-sm">
          <h1 className="text-lg font-bold text-[#191c1e]">Formulir tidak ditemukan</h1>
          <p className="mt-2 text-sm text-[#737784]">
            Tautan yang Anda buka tidak valid atau sudah tidak tersedia.
          </p>
        </div>
      </div>
    );
  }

  if (!payload) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0f4f8] px-4">
        <div className="w-full max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950">
          {submitError ?? 'Gagal memuat formulir.'}
          <button
            type="button"
            className="mt-3 font-semibold text-[#003c90] underline"
            onClick={() => void loadForm()}
          >
            Coba lagi
          </button>
        </div>
      </div>
    );
  }

  const handleSubmitAnother = () => {
    setPhase('ready');
    setSuccessResult(null);
    setAnswers({});
    setFiles({});
    setFieldErrors({});
    setSubmitError(null);
    setIsSubmitting(false);
  };

  if (phase === 'success' && successResult) {
    const successLink = successResult.success_link_url?.trim();
    const successLabel = successResult.success_link_label?.trim() || 'Lanjutkan';
    return (
      <div className="min-h-screen bg-[#f0f4f8] px-4 py-8 sm:py-12">
        <div className={`${publicFormLayoutClass} space-y-4`}>
          <PublicFormHeaderBanner imageUrl={headerImageUrl} usesDefaultImage={usesDefaultHeader} />
          <article className="overflow-hidden rounded-2xl border border-[#eceef0] bg-white shadow-sm">
            <div className="h-2 bg-[#003c90]" aria-hidden />
            <div className="px-6 py-6 sm:px-8 sm:py-8">
              <h1 className="text-xl font-bold text-[#191c1e] sm:text-2xl">Respons Anda telah direkam</h1>
              <PublicFormHtml html={successResult.success_message} className="mt-3" />
              {successLink ? (
                <p className="mt-6 text-sm text-[#434653]">
                  <a
                    href={successLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-[#003c90] underline underline-offset-2 hover:text-[#002f73]"
                  >
                    {successLabel}
                  </a>
                </p>
              ) : null}
              {allowAnotherResponse ? (
                <button
                  type="button"
                  onClick={handleSubmitAnother}
                  className="mt-6 inline-flex items-center justify-center rounded-lg bg-[#003c90] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#002f73]"
                >
                  Kirim respons lain
                </button>
              ) : null}
            </div>
          </article>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f4f8] px-4 py-8 sm:py-12">
      <div className={`${publicFormLayoutClass} space-y-4`}>
        <PublicFormHeaderBanner imageUrl={headerImageUrl} usesDefaultImage={usesDefaultHeader} />
        <article className="overflow-hidden rounded-2xl border border-[#eceef0] bg-white shadow-sm">
          <div className="h-2 bg-[#003c90]" aria-hidden />
          <div className="px-6 py-6 sm:px-8 sm:py-8">
            <h1 className="text-2xl font-bold text-[#191c1e] sm:text-3xl">{payload.form.title}</h1>
            {canSubmit ? (
              <PublicFormHtml html={payload.form.description} className="mt-3" />
            ) : notice ? (
              <p className="mt-3 text-sm leading-relaxed text-[#434653]">{notice}</p>
            ) : null}
          </div>
        </article>

        {submitError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
            {submitError}
          </div>
        ) : null}

        {canSubmit ? (
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4" noValidate>
            {displayFields.map((field) => (
              <PublicFormFieldInput
                key={field.field_id}
                field={field}
                value={answers[field.field_id]}
                fileValue={files[field.field_id]}
                disabled={fieldsDisabled}
                error={fieldErrors[field.field_id]}
                onChange={(value) => setAnswer(field.field_id, value)}
                onFileChange={(file) => setFile(field.field_id, file)}
              />
            ))}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex min-w-[8rem] items-center justify-center rounded-lg bg-[#003c90] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#002f73] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Mengirim…' : 'Kirim'}
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </div>
  );
};
