import { Download, Loader2 } from 'lucide-react';
import {
  SidePanelDialog,
  SidePanelDialogBody,
  SidePanelDialogFooter,
  SidePanelDialogHeader
} from '../../../../components/ui/side-panel-dialog';
import { documentCenterCategoryLabel } from '../../constants/document-center-categories';
import {
  documentTagClass,
  documentTagLabel,
  formatDocumentCenterDateTime,
  formatFileSize
} from '../../utils/document-center-display';
import type { DocumentCenterFileItem, DocumentCenterLeadHeader } from '../../types/document-center.types';

interface DocumentMetadataPanelProps {
  open: boolean;
  item?: DocumentCenterFileItem;
  lead?: DocumentCenterLeadHeader | null;
  downloading?: boolean;
  onClose: () => void;
  onDownload: (item: DocumentCenterFileItem) => void;
}

const Field = ({ label, value }: { label: string; value: string }) => (
  <div>
    <dt className="text-[11px] font-bold uppercase tracking-wider text-[#737784]">{label}</dt>
    <dd className="mt-1 text-sm text-[#191c1e]">{value}</dd>
  </div>
);

export const DocumentMetadataPanel = ({
  open,
  item,
  lead,
  downloading,
  onClose,
  onDownload
}: DocumentMetadataPanelProps) => (
  <SidePanelDialog open={open} onOpenChange={(next) => !next && onClose()} className="max-w-md">
    <SidePanelDialogHeader title="Detail Dokumen" description={item?.documentName} />
    <SidePanelDialogBody>
      {item ? (
        <dl className="grid gap-4">
          <Field label="Nama file" value={item.documentName} />
          <Field label="Kategori" value={documentCenterCategoryLabel[item.category]} />
          <Field label="Modul sumber" value={item.sourceModule} />
          <Field label="Versi" value={`v${item.versionNo}`} />
          <Field label="Diunggah oleh" value={item.uploadedByName ?? '—'} />
          <Field label="Tanggal unggah" value={formatDocumentCenterDateTime(item.uploadedAt)} />
          <Field label="Ukuran" value={formatFileSize(item.fileSizeBytes)} />
          {item.termName ? <Field label="Term invoice" value={item.termName} /> : null}
          {lead ? (
            <>
              <Field label="Perusahaan" value={lead.companyName} />
              <Field label="Lead code" value={lead.leadCode ?? '—'} />
            </>
          ) : null}
          {item.tags.length > 0 ? (
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-wider text-[#737784]">Tag</dt>
              <dd className="mt-2 flex flex-wrap gap-1.5">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${documentTagClass[tag]}`}
                  >
                    {documentTagLabel[tag]}
                  </span>
                ))}
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}
    </SidePanelDialogBody>
    <SidePanelDialogFooter>
      <button
        type="button"
        onClick={onClose}
        className="rounded-lg px-4 py-2 text-sm font-semibold text-[#434653] hover:bg-[#f2f4f6]"
      >
        Tutup
      </button>
      {item ? (
        <button
          type="button"
          disabled={downloading}
          onClick={() => onDownload(item)}
          className="inline-flex items-center gap-2 rounded-lg bg-[#003c90] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f52ba] disabled:opacity-60"
        >
          {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Download
        </button>
      ) : null}
    </SidePanelDialogFooter>
  </SidePanelDialog>
);
