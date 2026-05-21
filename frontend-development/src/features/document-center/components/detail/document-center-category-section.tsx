import { documentCenterCategoryHint, documentCenterCategoryLabel } from '../../constants/document-center-categories';
import type { DocumentCenterCategory, DocumentCenterFileItem } from '../../types/document-center.types';
import { DocumentCenterFileRow } from './document-center-file-row';
import { DOCUMENT_FILE_LIST_HEADER_GRID_CLASS } from './document-center-file-list-grid';

interface DocumentCenterCategorySectionProps {
  category: DocumentCenterCategory;
  items: DocumentCenterFileItem[];
  downloadingId: string | null;
  onDownload: (item: DocumentCenterFileItem) => void;
  onViewMeta?: (item: DocumentCenterFileItem) => void;
}

export const DocumentCenterCategorySection = ({
  category,
  items,
  downloadingId,
  onDownload,
  onViewMeta
}: DocumentCenterCategorySectionProps) => (
  <section className="space-y-3">
    <div className="flex flex-wrap items-end justify-between gap-2 border-b border-[#eceef0] pb-3">
      <div>
        <h2 className="text-base font-semibold text-[#191c1e]">{documentCenterCategoryLabel[category]}</h2>
        <p className="mt-0.5 text-xs text-[#737784]">{documentCenterCategoryHint[category]}</p>
      </div>
      <span className="rounded-full bg-[#f2f4f6] px-3 py-1 text-xs font-semibold text-[#434653]">
        {items.length} file
      </span>
    </div>

    {items.length === 0 ? (
      <div className="rounded-xl border border-dashed border-[#d5d9de] bg-[#fafbfc] px-5 py-10 text-center">
        <p className="text-sm font-medium text-[#434653]">Belum ada dokumen di kategori ini</p>
        <p className="mt-1 text-xs text-[#737784]">
          Upload dilakukan dari modul asal. Repository akan menampilkan file setelah diunggah.
        </p>
      </div>
    ) : (
      <div className="w-full overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-[#eceef0]/80">
        <div className="min-w-[880px] w-full lg:min-w-0">
          <div
            className={`${DOCUMENT_FILE_LIST_HEADER_GRID_CLASS} border-b border-[#eceef0] bg-[#fafbfc] text-[10px] font-bold uppercase tracking-wider text-[#737784]`}
          >
            <span>Dokumen</span>
            <span>Versi</span>
            <span>Tipe</span>
            <span>Ukuran</span>
            <span>Diunggah oleh</span>
            <span>Tanggal</span>
            <span className="justify-self-end text-right">Aksi</span>
          </div>
          {items.map((item) => (
            <DocumentCenterFileRow
              key={item.id}
              item={item}
              downloading={downloadingId === item.id}
              onDownload={onDownload}
              onViewMeta={onViewMeta}
            />
          ))}
        </div>
      </div>
    )}
  </section>
);
