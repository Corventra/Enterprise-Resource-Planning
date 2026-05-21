import { Loader2 } from 'lucide-react';
import type { DocumentCenterFileItem } from '../../types/document-center.types';
import {
  documentTagClass,
  documentTagLabel,
  fileIconForExtension,
  fileIconToneForExtension,
  fileRowSubtitle,
  fileTypeLabel,
  formatDocumentCenterDate,
  formatFileSize,
  formatUploaderShortName,
  uploaderInitials
} from '../../utils/document-center-display';
import { DOCUMENT_FILE_LIST_ROW_GRID_CLASS } from './document-center-file-list-grid';

interface DocumentCenterFileRowProps {
  item: DocumentCenterFileItem;
  downloading?: boolean;
  onDownload: (item: DocumentCenterFileItem) => void;
  onViewMeta?: (item: DocumentCenterFileItem) => void;
}

const metaCellClass = 'text-sm text-[#737784]';

export const DocumentCenterFileRow = ({
  item,
  downloading,
  onDownload,
  onViewMeta
}: DocumentCenterFileRowProps) => {
  const Icon = fileIconForExtension(item.fileExtension);
  const tone = fileIconToneForExtension(item.fileExtension);
  const primaryTag = item.tags.find((t) => t === 'LATEST') ?? item.tags[0];
  const subtitle = fileRowSubtitle(item);

  return (
    <div className={`group ${DOCUMENT_FILE_LIST_ROW_GRID_CLASS}`}>
      <button
        type="button"
        className="flex min-w-0 items-center gap-3 pr-4 text-left"
        onClick={() => onViewMeta?.(item)}
        disabled={!onViewMeta}
      >
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${tone.wrapClass}`}
        >
          <Icon className={`h-5 w-5 ${tone.iconClass}`} strokeWidth={2} />
        </span>
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-bold text-[#191c1e] group-hover:text-[#003c90]">
              {item.documentName}
            </span>
            {primaryTag ? (
              <span
                className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${documentTagClass[primaryTag]}`}
              >
                {documentTagLabel[primaryTag]}
              </span>
            ) : null}
          </span>
          <span className="mt-0.5 block truncate text-xs text-[#737784]">{subtitle}</span>
        </span>
      </button>

      <span className={`${metaCellClass} tabular-nums`}>v{item.versionNo}</span>

      <span className={`${metaCellClass} truncate`}>{fileTypeLabel(item.fileExtension, item.mimeType)}</span>

      <span className={`${metaCellClass} tabular-nums`}>{formatFileSize(item.fileSizeBytes)}</span>

      <div className={`flex min-w-0 items-center gap-2`}>
        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#d9e2ff] text-[10px] font-bold text-[#00419c]">
          {uploaderInitials(item.uploadedByName)}
        </span>
        <span className="truncate text-sm font-medium text-[#191c1e]">
          {formatUploaderShortName(item.uploadedByName)}
        </span>
      </div>

      <span className={metaCellClass}>{formatDocumentCenterDate(item.uploadedAt)}</span>

      <button
        type="button"
        disabled={downloading}
        onClick={() => onDownload(item)}
        className="justify-self-end text-sm font-bold text-[#003c90] transition-colors hover:text-[#0f52ba] hover:underline disabled:opacity-50"
      >
        {downloading ? (
          <span className="inline-flex items-center gap-1.5">
            <Loader2 className="h-4 w-4 animate-spin" />
            ...
          </span>
        ) : (
          'Download'
        )}
      </button>
    </div>
  );
};
