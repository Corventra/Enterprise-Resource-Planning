import { useEffect, useMemo, useState } from 'react';
import { getFormSubmissions } from '../../../forms/services/form-submissions-api';
import type { FormSubmissionListItem } from '../../../forms/types/form-submissions.types';
import { formatSubmissionSourceLabel } from '../../../forms/utils/submission-source-label';
import type { Form } from '../../types/campaign.types';
import { SubmissionsTable } from './submissions-table';
import { SubmissionsToolbar } from './submissions-toolbar';

interface SubmissionsTabProps {
  forms: Form[];
  selectedFormId: string | null;
  onSelectedFormChange: (formId: string | null) => void;
  onViewSubmission: (formId: string, submissionId: number) => void;
}

type SortBy = 'submittedAt' | 'responseNumber';
type SortOrder = 'asc' | 'desc';

const formatSubmittedAtExport = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('id-ID');
};

export const SubmissionsTab = ({
  forms,
  selectedFormId,
  onSelectedFormChange,
  onViewSubmission
}: SubmissionsTabProps) => {
  const [submissions, setSubmissions] = useState<FormSubmissionListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('submittedAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const selectedForm = useMemo(
    () => forms.find((form) => form.id === selectedFormId) ?? null,
    [forms, selectedFormId]
  );

  useEffect(() => {
    if (!selectedFormId) {
      setSubmissions([]);
      setLoadError(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);
    void getFormSubmissions(selectedFormId)
      .then((rows) => {
        if (!cancelled) setSubmissions(rows);
      })
      .catch((e) => {
        if (!cancelled) {
          setSubmissions([]);
          setLoadError(e instanceof Error ? e.message : 'Gagal memuat submissions.');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedFormId]);

  const filteredSubmissions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return submissions;

    return submissions.filter((submission) => {
      const source = formatSubmissionSourceLabel(submission).toLowerCase();
      const responseLabel = `respons ke-${submission.response_number}`.toLowerCase();
      return (
        submission.summary_text.toLowerCase().includes(query) ||
        source.includes(query) ||
        responseLabel.includes(query) ||
        String(submission.response_number).includes(query)
      );
    });
  }, [searchQuery, submissions]);

  const sortedSubmissions = useMemo(() => {
    const next = [...filteredSubmissions];
    next.sort((a, b) => {
      if (sortBy === 'submittedAt') {
        const dateDiff = new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime();
        return sortOrder === 'asc' ? dateDiff : -dateDiff;
      }

      const numberDiff = a.response_number - b.response_number;
      return sortOrder === 'asc' ? numberDiff : -numberDiff;
    });
    return next;
  }, [filteredSubmissions, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedSubmissions.length / itemsPerPage));
  const normalizedCurrentPage = Math.min(currentPage, totalPages);
  const pageStart = (normalizedCurrentPage - 1) * itemsPerPage;
  const paginatedSubmissions = sortedSubmissions.slice(pageStart, pageStart + itemsPerPage);

  const showingFrom = sortedSubmissions.length === 0 ? 0 : pageStart + 1;
  const showingTo = sortedSubmissions.length === 0 ? 0 : pageStart + paginatedSubmissions.length;
  const sortValue = `${sortBy}:${sortOrder}`;

  const handleFormChange = (formId: string) => {
    onSelectedFormChange(formId || null);
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleSortChange = (value: string) => {
    const [nextSortBy, nextSortOrder] = value.split(':') as [SortBy, SortOrder];
    setSortBy(nextSortBy);
    setSortOrder(nextSortOrder);
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  const handleExportCSV = () => {
    const header = ['Respons', 'Ringkasan', 'Source', 'Submitted At'];
    const rows = sortedSubmissions.map((submission) => [
      `Respons ke-${submission.response_number}`,
      submission.summary_text,
      formatSubmissionSourceLabel(submission),
      formatSubmittedAtExport(submission.submitted_at)
    ]);

    const csvContent = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const slug = selectedForm?.name?.trim().replace(/\s+/g, '-').toLowerCase() || selectedFormId || 'form';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `submissions-${slug}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <section className="space-y-4 pt-5">
      <SubmissionsToolbar
        forms={forms}
        selectedFormId={selectedFormId}
        onFormChange={handleFormChange}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onExport={handleExportCSV}
        totalItems={sortedSubmissions.length}
        showingFrom={showingFrom}
        showingTo={showingTo}
        sortValue={sortValue}
        onSortChange={handleSortChange}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={handleItemsPerPageChange}
      />

      {selectedForm ? (
        <div>
          <h3 className="text-base font-bold text-[#191c1e] sm:text-lg">
            Submissions — {selectedForm.name}
          </h3>
          <p className="mt-1 text-xs text-[#737784] sm:text-sm">
            {selectedForm.formCategory === 'LEAD_CAPTURE' ? 'Lead capture' : 'General'}
          </p>
        </div>
      ) : null}

      {!selectedFormId ? (
        <div className="rounded-xl border border-dashed border-[#c3c6d5] bg-[#f7f9fb]/50 px-4 py-10 text-center text-sm text-[#737784]">
          Pilih form untuk melihat submissions.
        </div>
      ) : isLoading ? (
        <div className="rounded-xl border border-[#eceef0] bg-white px-4 py-10 text-center text-sm text-[#737784]">
          Memuat submissions…
        </div>
      ) : loadError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-800">{loadError}</div>
      ) : (
        <>
          <SubmissionsTable
            submissions={paginatedSubmissions}
            onViewSubmission={(submissionId) => onViewSubmission(selectedFormId, submissionId)}
          />

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              disabled={normalizedCurrentPage === 1}
              onClick={() => setCurrentPage(normalizedCurrentPage - 1)}
              className="rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-xs text-slate-600">
              Page {normalizedCurrentPage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={normalizedCurrentPage === totalPages}
              onClick={() => setCurrentPage(normalizedCurrentPage + 1)}
              className="rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </>
      )}
    </section>
  );
};
