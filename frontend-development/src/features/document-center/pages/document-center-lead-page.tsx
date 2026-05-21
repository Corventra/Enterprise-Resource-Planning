import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { Toast } from '../../../components/ui/toast';
import { useToast } from '../../../hooks/use-toast';
import { DOCUMENT_CENTER_CATEGORY_ORDER } from '../constants/document-center-categories';
import { DocumentCenterCategorySection } from '../components/detail/document-center-category-section';
import { DocumentCenterCoreLeadDetails } from '../components/detail/document-center-core-lead-details';
import { DocumentCenterDetailFiltersSection } from '../components/detail/document-center-detail-filters';
import { DocumentCenterDetailSummaryCards } from '../components/detail/document-center-detail-summary-cards';
import { DocumentCenterLeadPageHeader } from '../components/detail/document-center-lead-page-header';
import { DocumentMetadataPanel } from '../components/modals/document-metadata-panel';
import { useDocumentCenterDetailFilters } from '../hooks/use-document-center-detail-filters';
import { useDocumentCenterDownload } from '../hooks/use-document-center-download';
import { useDocumentCenterLeadDetail } from '../hooks/use-document-center-lead-detail';
import type { DocumentCenterFileItem } from '../types/document-center.types';

export const DocumentCenterLeadPage = () => {
  const { leadId: leadIdParam } = useParams();
  const leadId = Number(leadIdParam);
  const validLeadId = Number.isInteger(leadId) && leadId > 0 ? leadId : undefined;

  const { message: toastMessage, variant: toastVariant, dismiss: dismissToast, show: showToast } = useToast();
  const { download, downloadingId } = useDocumentCenterDownload((msg) => showToast(msg, { variant: 'error' }));

  const {
    header,
    filesByCategory,
    categorySummary,
    latestOnly,
    setLatestOnly,
    isLoading,
    loadError
  } = useDocumentCenterLeadDetail(validLeadId);

  const { filters, filteredByCategory, visibleTotal, uploadedByOptions, updateFilter, resetFilters } =
    useDocumentCenterDetailFilters(filesByCategory);

  const [metaTarget, setMetaTarget] = useState<DocumentCenterFileItem | undefined>();

  if (!validLeadId) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        Lead tidak valid.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="rounded-xl border border-[#eceef0] bg-white p-4 text-sm text-[#737784] shadow-sm">
          Memuat repository dokumen...
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-5">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm">
          <h1 className="text-base font-semibold text-red-800">Gagal memuat dokumen</h1>
          <p className="mt-1 text-sm text-red-700">{loadError}</p>
          <Link
            to="/document-center"
            className="mt-3 inline-flex items-center rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-800 hover:bg-red-100 sm:text-sm"
          >
            <ArrowLeft className="mr-1 h-3.5 w-3.5" />
            Back to Document Center List
          </Link>
        </div>
      </div>
    );
  }

  if (!header) {
    return (
      <div className="space-y-5">
        <div className="rounded-xl border border-[#eceef0] bg-white p-4 shadow-sm">
          <h1 className="text-base font-semibold text-[#191c1e]">Lead tidak ditemukan</h1>
          <p className="mt-1 text-sm text-[#737784]">Lead tidak tersedia di Document Center.</p>
          <Link
            to="/document-center"
            className="mt-3 inline-flex items-center rounded-lg border border-[#c3c6d5] px-3 py-1.5 text-xs font-medium text-[#191c1e] hover:bg-[#eceef0] sm:text-sm"
          >
            <ArrowLeft className="mr-1 h-3.5 w-3.5" />
            Back to Document Center List
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <DocumentCenterLeadPageHeader header={header} />

      <p className="text-xs text-[#737784]">
        Mode baca saja — unggah dan kelola dokumen dari modul asal (Lead Workspace, Handover, Invoice).
      </p>

      <DocumentCenterCoreLeadDetails header={header} />

      <DocumentCenterDetailSummaryCards
        totalDocuments={header.totalDocuments}
        categorySummary={categorySummary}
      />

      <DocumentCenterDetailFiltersSection
        filters={filters}
        uploadedByOptions={uploadedByOptions}
        latestOnly={latestOnly}
        onSearchChange={(v) => updateFilter('search', v)}
        onCategoryChange={(v) => updateFilter('category', v)}
        onFileTypeChange={(v) => updateFilter('fileType', v)}
        onUploadedByChange={(v) => updateFilter('uploadedBy', v)}
        onDateRangeChange={(v) => updateFilter('dateRange', v)}
        onLatestOnlyChange={setLatestOnly}
        onSortChange={(v) => updateFilter('sort', v)}
        onReset={resetFilters}
      />

      {filters.category !== 'All' ? (
        <p className="text-xs text-[#737784]">
          Menampilkan {visibleTotal} file setelah filter
          {latestOnly ? ' · hanya versi terbaru dari server' : ''}.
        </p>
      ) : null}

      <div className="space-y-10">
        {(filters.category === 'All' ? DOCUMENT_CENTER_CATEGORY_ORDER : [filters.category]).map((cat) => (
          <DocumentCenterCategorySection
            key={cat}
            category={cat}
            items={filteredByCategory[cat] ?? []}
            downloadingId={downloadingId}
            onDownload={download}
            onViewMeta={setMetaTarget}
          />
        ))}
      </div>

      <DocumentMetadataPanel
        open={metaTarget != null}
        item={metaTarget}
        lead={header}
        downloading={metaTarget != null && downloadingId === metaTarget.id}
        onClose={() => setMetaTarget(undefined)}
        onDownload={download}
      />

      <Toast
        open={toastMessage != null}
        message={toastMessage ?? ''}
        variant={toastVariant}
        onClose={dismissToast}
      />
    </div>
  );
};
