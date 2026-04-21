import { FileText, Upload } from 'lucide-react';
import type { LeadWorkspaceEngagementLetterItem } from '../types/lead-workspace.types';

interface EngagementDocumentCardProps {
  engagementLetter?: LeadWorkspaceEngagementLetterItem;
}

const formatDateTime = (iso?: string) => {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const EngagementDocumentCard = ({ engagementLetter }: EngagementDocumentCardProps) => {
  if (!engagementLetter) return null;

  const hasUploadedDocument = Boolean(engagementLetter.document.uploadedFileName);
  const fileName = engagementLetter.document.uploadedFileName ?? '-';
  const fileSize = engagementLetter.document.uploadedSize ?? '-';

  return (
    <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-[#eceef0]">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-bold text-[#191c1e]">
          <FileText className="h-5 w-5 text-[#003c90]" />
          Engagement Document
        </h3>
      </div>

      {!hasUploadedDocument && (
        <div className="rounded-xl border-2 border-dashed border-[#c3c6d5] bg-[#f7f9fb] p-8 text-center">
          <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#003c90]/10">
            <Upload className="h-5 w-5 text-[#003c90]" />
          </div>
          <h4 className="text-sm font-bold text-[#191c1e]">Upload Revised Engagement Letter</h4>
          <p className="mt-1 text-xs text-[#737784]">Drag and drop your document here, or browse</p>
          <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-[#737784]">PDF, DOC, DOCX - Max 10MB</p>
        </div>
      )}

      {hasUploadedDocument ? (
        <div className="mt-5 rounded-xl border border-[#c3c6d5]/50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border border-[#c3c6d5]/70 bg-[#d5e3fc]/20">
              <FileText className="h-10 w-10 text-[#003c90]" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-[#191c1e]">{fileName}</p>
              <p className="mt-1 text-xs text-[#434653]">{fileSize}</p>
              <p className="mt-1 text-[11px] text-[#737784]">Uploaded at {formatDateTime(engagementLetter.document.uploadedAt)}</p>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};
