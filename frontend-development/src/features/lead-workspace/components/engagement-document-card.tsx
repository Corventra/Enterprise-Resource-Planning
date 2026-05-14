import { Download, FileText, Upload } from 'lucide-react';
import { useOutletContext } from 'react-router';
import { useLeadWorkspacePermissions } from '../hooks/use-lead-workspace-permissions';
import type { LeadWorkspaceEngagementLetterItem } from '../types/lead-engagement-letters.types';
import type { LeadWorkspaceOutletContext } from '../types/lead-workspace.types';

interface EngagementDocumentCardProps {
  engagementLetter?: LeadWorkspaceEngagementLetterItem;
  sectionTitle?: string;
  /** URL lengkap untuk buka/unduh dokumen EL (mis. origin + filePath). */
  documentActionsUrl?: string | null;
  embedded?: boolean;
}

const formatDateTime = (iso?: string) => {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const EngagementDocumentCard = ({
  engagementLetter,
  sectionTitle = 'Engagement document',
  documentActionsUrl = null,
  embedded = false
}: EngagementDocumentCardProps) => {
  const { processedByUserId } = useOutletContext<LeadWorkspaceOutletContext>();
  const { canManageLeadWorkspace } = useLeadWorkspacePermissions({ processedByUserId });
  if (!engagementLetter) return null;

  const hasUploadedDocument = Boolean(engagementLetter.document.uploadedFileName);
  const fileName = engagementLetter.document.uploadedFileName ?? '-';
  const fileSize = engagementLetter.document.uploadedSize ?? '-';
  const versionNo = engagementLetter.document.versionNo;
  const shellClass = embedded
    ? 'rounded-lg bg-transparent p-0 ring-0'
    : 'rounded-xl bg-white p-6 shadow-sm ring-1 ring-[#eceef0]';

  return (
    <section className={shellClass}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-base font-bold text-[#191c1e]">
          <FileText className="h-5 w-5 shrink-0 text-[#003c90]" />
          {sectionTitle}
        </h3>
      </div>

      {!hasUploadedDocument && canManageLeadWorkspace && (
        <div className="rounded-xl border-2 border-dashed border-[#c3c6d5] bg-[#f7f9fb] p-8 text-center">
          <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#003c90]/10">
            <Upload className="h-5 w-5 text-[#003c90]" />
          </div>
          <h4 className="text-sm font-bold text-[#191c1e]">Upload Revised Engagement Letter</h4>
          <p className="mt-1 text-xs text-[#737784]">Drag and drop your document here, or browse</p>
          <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-[#737784]">PDF, DOC, DOCX - Max 10MB</p>
        </div>
      )}

      {!hasUploadedDocument && !canManageLeadWorkspace && (
        <p className="rounded-xl border border-[#eceef0] bg-[#f8fafc] p-6 text-center text-sm text-[#737784]">
          Belum ada dokumen yang diunggah.
        </p>
      )}

      {hasUploadedDocument ? (
        <div className={`rounded-xl border border-[#c3c6d5]/50 p-4 ${embedded ? '' : 'mt-5'}`}>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border border-[#c3c6d5]/70 bg-[#d5e3fc]/20">
              <FileText className="h-10 w-10 text-[#003c90]" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-[#191c1e]">{fileName}</p>
              <p className="mt-1 text-xs text-[#434653]">{fileSize}</p>
              <p className="mt-1 text-[11px] text-[#737784]">
                {versionNo != null ? (
                  <>
                    Version <span className="font-semibold">{versionNo}</span>
                    <span className="mx-1.5 text-[#c3c6d5]">·</span>
                  </>
                ) : null}
                Uploaded at {formatDateTime(engagementLetter.document.uploadedAt)}
              </p>
            </div>
            {documentActionsUrl ? (
              <a
                href={documentActionsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#c3c6d5] bg-white px-3 py-2 text-xs font-bold text-[#003c90] hover:bg-[#f2f4f6]"
              >
                <Download className="h-3.5 w-3.5" />
                Buka / unduh
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
};
