import { Filter, Search } from 'lucide-react';
import { documentCenterCategoryFilterOptions } from '../../constants/document-center-categories';
import type { DocumentCenterDetailFilters } from '../../types/document-center.types';

interface DocumentCenterDetailFiltersSectionProps {
  filters: DocumentCenterDetailFilters;
  uploadedByOptions: string[];
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: DocumentCenterDetailFilters['category']) => void;
  onFileTypeChange: (value: DocumentCenterDetailFilters['fileType']) => void;
  onUploadedByChange: (value: string) => void;
  onDateRangeChange: (value: DocumentCenterDetailFilters['dateRange']) => void;
  latestOnly: boolean;
  onLatestOnlyChange: (value: boolean) => void;
  onSortChange: (value: DocumentCenterDetailFilters['sort']) => void;
  onReset: () => void;
}

const fieldFocus = 'focus:outline-none focus:ring-2 focus:ring-[#1d59c1]/20';
const selectClassName = `rounded-lg border-none bg-white py-2 pl-3 pr-8 text-xs font-semibold text-[#434653] shadow-sm ${fieldFocus}`;

export const DocumentCenterDetailFiltersSection = ({
  filters,
  uploadedByOptions,
  onSearchChange,
  onCategoryChange,
  onFileTypeChange,
  onUploadedByChange,
  onDateRangeChange,
  latestOnly,
  onLatestOnlyChange,
  onSortChange,
  onReset
}: DocumentCenterDetailFiltersSectionProps) => (
  <div className="flex flex-col gap-3 rounded-xl bg-[#f2f4f6] p-4">
    <div className="relative min-w-[200px] flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#737784]" />
      <input
        type="search"
        value={filters.search}
        onChange={(event) => onSearchChange(event.target.value)}
        className={`w-full rounded-lg border-none bg-white py-2 pl-10 pr-3 text-sm text-[#191c1e] shadow-sm placeholder:text-[#737784]/80 ${fieldFocus}`}
        placeholder="Cari nama dokumen..."
      />
    </div>

    <div className="flex flex-wrap items-center gap-2">
      <select
        value={filters.category}
        onChange={(event) => onCategoryChange(event.target.value as DocumentCenterDetailFilters['category'])}
        className={selectClassName}
        aria-label="Filter kategori"
      >
        {documentCenterCategoryFilterOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <select
        value={filters.fileType}
        onChange={(event) => onFileTypeChange(event.target.value as DocumentCenterDetailFilters['fileType'])}
        className={selectClassName}
        aria-label="Filter tipe file"
      >
        <option value="All">Semua Tipe</option>
        <option value="pdf">PDF</option>
        <option value="doc">Word</option>
        <option value="image">Gambar</option>
        <option value="spreadsheet">Spreadsheet</option>
        <option value="other">Lainnya</option>
      </select>

      <select
        value={filters.uploadedBy}
        onChange={(event) => onUploadedByChange(event.target.value)}
        className={selectClassName}
        aria-label="Filter diunggah oleh"
      >
        {uploadedByOptions.map((opt) => (
          <option key={opt} value={opt}>
            {opt === 'All' ? 'Semua pengunggah' : opt}
          </option>
        ))}
      </select>

      <select
        value={filters.dateRange}
        onChange={(event) => onDateRangeChange(event.target.value as DocumentCenterDetailFilters['dateRange'])}
        className={selectClassName}
        aria-label="Filter tanggal"
      >
        <option value="All">Semua tanggal</option>
        <option value="7d">7 hari</option>
        <option value="30d">30 hari</option>
        <option value="90d">90 hari</option>
      </select>

      <select
        value={filters.sort}
        onChange={(event) => onSortChange(event.target.value as DocumentCenterDetailFilters['sort'])}
        className={selectClassName}
        aria-label="Urutkan"
      >
        <option value="newest">Terbaru</option>
        <option value="name">Nama</option>
        <option value="size">Ukuran file</option>
      </select>

      <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-[#434653] shadow-sm">
        <input
          type="checkbox"
          checked={latestOnly}
          onChange={(event) => onLatestOnlyChange(event.target.checked)}
          className="rounded border-[#d5d9de] text-[#003c90] focus:ring-[#1d59c1]/20"
        />
        Hanya versi terbaru
      </label>

      <button
        type="button"
        onClick={onReset}
        title="Reset filter"
        aria-label="Reset filter"
        className="rounded-lg bg-white p-2 text-[#737784] shadow-sm transition-colors hover:text-[#003c90]"
      >
        <Filter className="h-4 w-4" />
      </button>
    </div>
  </div>
);
