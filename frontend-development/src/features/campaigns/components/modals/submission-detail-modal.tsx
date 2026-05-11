import { useEffect, useState } from 'react';
import {
  SidePanelDialog,
  SidePanelDialogBody,
  SidePanelDialogHeader
} from '../../../../components/ui/side-panel-dialog';
import { getFormSubmissionDetail } from '../../../forms/services/form-submissions-api';
import type { FormSubmissionDetail } from '../../../forms/types/form-submissions.types';
import { formatSubmissionSourceLabel } from '../../../forms/utils/submission-source-label';
import { resolveFormMediaUrl } from '../../../forms/utils/resolve-form-media-url';

interface SubmissionDetailModalProps {
  open: boolean;
  formId?: string;
  submissionId?: string;
  onClose: () => void;
}

const formatSubmittedAt = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formCategoryLabel = (category: 'LEAD_CAPTURE' | 'GENERAL') =>
  category === 'LEAD_CAPTURE' ? 'Lead capture' : 'General';

export const SubmissionDetailModal = ({
  open,
  formId,
  submissionId,
  onClose
}: SubmissionDetailModalProps) => {
  const [detail, setDetail] = useState<FormSubmissionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !formId || !submissionId) {
      setDetail(null);
      setLoadError(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);
    void getFormSubmissionDetail(formId, submissionId)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch((e) => {
        if (!cancelled) {
          setDetail(null);
          setLoadError(e instanceof Error ? e.message : 'Gagal memuat detail submission.');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, formId, submissionId]);

  if (!open) {
    return null;
  }

  const source = detail
    ? formatSubmissionSourceLabel(detail.submission)
    : null;

  return (
    <SidePanelDialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <SidePanelDialogHeader
        title="Detail Submission"
        description="Informasi respons formulir yang dikirim melalui link distribusi."
      />
      <SidePanelDialogBody>
        {isLoading ? (
          <p className="text-sm text-slate-600">Memuat detail…</p>
        ) : loadError ? (
          <p className="text-sm text-red-700">{loadError}</p>
        ) : detail ? (
          <div className="space-y-5 text-sm">
            <section className="rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-4 py-3">
                <h3 className="text-sm font-semibold text-slate-900">Ringkasan</h3>
              </div>
              <div className="grid gap-3 px-4 py-4 md:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Form</p>
                  <p className="mt-1 font-medium text-slate-800">{detail.form.title}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Kategori</p>
                  <p className="mt-1 font-medium text-slate-800">
                    {formCategoryLabel(detail.form.form_category)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Respons</p>
                  <p className="mt-1 font-medium text-slate-800">
                    Respons ke-{detail.submission.response_number}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Submitted at</p>
                  <p className="mt-1 font-medium text-slate-800">
                    {formatSubmittedAt(detail.submission.submitted_at)}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Source / link</p>
                  <p className="mt-1 font-medium text-slate-800">{source}</p>
                  <p className="mt-1 font-mono text-xs text-slate-500">{detail.submission.link_code}</p>
                </div>
              </div>
            </section>

            <div className="rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-4 py-3">
                <h3 className="text-sm font-semibold text-slate-900">Jawaban</h3>
              </div>
              <ul className="divide-y divide-slate-100">
                {detail.answers.map((answer) => {
                  const fileUrl = resolveFormMediaUrl(answer.answer_file_path);
                  const hasFile = Boolean(fileUrl);
                  const displayValue =
                    answer.field_type === 'file'
                      ? null
                      : answer.answer_display_value ?? answer.answer_value;
                  const isEmpty = !hasFile && (!displayValue || !String(displayValue).trim());

                  return (
                    <li key={answer.field_id} className="px-4 py-3">
                      <p className="text-xs uppercase tracking-wide text-slate-500">{answer.label}</p>
                      {hasFile ? (
                        <a
                          href={fileUrl ?? undefined}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-flex font-medium text-[#003c90] underline"
                        >
                          Buka file unggahan
                        </a>
                      ) : isEmpty ? (
                        <p className="mt-1 text-slate-500">—</p>
                      ) : (
                        <p className="mt-1 font-medium whitespace-pre-wrap text-slate-800">{displayValue}</p>
                      )}
                    </li>
                  );
                })}
                {detail.answers.length === 0 ? (
                  <li className="px-4 py-4 text-sm text-slate-500">Tidak ada jawaban tercatat.</li>
                ) : null}
              </ul>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-600">Submission tidak tersedia.</p>
        )}
      </SidePanelDialogBody>
    </SidePanelDialog>
  );
};
