import { useMemo, useState } from 'react';
import type { Submission } from '../../types/campaign.types';
import { SubmissionsTable } from './submissions-table';
import { SubmissionsToolbar } from './submissions-toolbar';

interface SubmissionsTabProps {
  submissions: Submission[];
  onViewSubmission: (submission: Submission) => void;
}

type SortBy = 'submittedAt' | 'customerName';
type SortOrder = 'asc' | 'desc';

export const SubmissionsTab = ({ submissions, onViewSubmission }: SubmissionsTabProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('submittedAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredSubmissions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return submissions;
    }

    return submissions.filter((submission) => {
      return (
        submission.customerName.toLowerCase().includes(query) ||
        submission.email.toLowerCase().includes(query) ||
        submission.company.toLowerCase().includes(query)
      );
    });
  }, [searchQuery, submissions]);

  const sortedSubmissions = useMemo(() => {
    const next = [...filteredSubmissions];
    next.sort((a, b) => {
      if (sortBy === 'submittedAt') {
        const dateDiff = new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
        return sortOrder === 'asc' ? dateDiff : -dateDiff;
      }

      const nameDiff = a.customerName.localeCompare(b.customerName);
      return sortOrder === 'asc' ? nameDiff : -nameDiff;
    });
    return next;
  }, [filteredSubmissions, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedSubmissions.length / itemsPerPage));
  const normalizedCurrentPage = Math.min(currentPage, totalPages);
  const pageStart = (normalizedCurrentPage - 1) * itemsPerPage;
  const paginatedSubmissions = sortedSubmissions.slice(pageStart, pageStart + itemsPerPage);

  const showingFrom = sortedSubmissions.length === 0 ? 0 : pageStart + 1;
  const showingTo = sortedSubmissions.length === 0 ? 0 : pageStart + paginatedSubmissions.length;

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
    const header = ['Name', 'Company', 'Email', 'Phone', 'Status', 'Submitted At'];
    const rows = sortedSubmissions.map((submission) => [
      submission.customerName,
      submission.company,
      submission.email,
      submission.phone,
      submission.status,
      new Date(submission.submittedAt).toISOString()
    ]);

    const csvContent = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'campaign-submissions.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const sortValue = `${sortBy}:${sortOrder}`;

  return (
    <section className="space-y-4 pt-5">
      <SubmissionsToolbar
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

      <SubmissionsTable submissions={paginatedSubmissions} onViewSubmission={onViewSubmission} />

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
    </section>
  );
};
