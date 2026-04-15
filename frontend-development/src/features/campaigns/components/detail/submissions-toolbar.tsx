import { ArrowUpDown, Download, Search } from 'lucide-react';

interface SubmissionsToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onExport: () => void;
  totalItems: number;
  showingFrom: number;
  showingTo: number;
  sortValue: string;
  onSortChange: (value: string) => void;
  itemsPerPage: number;
  onItemsPerPageChange: (value: number) => void;
}

export const SubmissionsToolbar = ({
  searchQuery,
  onSearchChange,
  onExport,
  totalItems,
  showingFrom,
  showingTo,
  sortValue,
  onSortChange,
  itemsPerPage,
  onItemsPerPageChange
}: SubmissionsToolbarProps) => {
  return (
    <div>
      <div className="mb-4 flex flex-col items-center gap-3 lg:flex-row">
        <div className="relative w-full flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by company, PIC name, email, or phone..."
            className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={onExport}
          disabled={totalItems === 0}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          Export
        </button>
      </div>

      <div className="flex flex-col gap-3 text-sm text-gray-600 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-sm text-gray-600">
          Showing {showingFrom}-{showingTo} of {totalItems}
          {searchQuery.trim() && (
            <>
              {' '}
              matching "{searchQuery.trim()}"
            </>
          )}
        </p>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-gray-500" />
            <select
              value={sortValue}
              onChange={(event) => onSortChange(event.target.value)}
              className="h-9 w-[180px] rounded-md border border-slate-200 bg-white px-2.5 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
            >
              <option value="submittedAt:desc">Newest First</option>
              <option value="submittedAt:asc">Oldest First</option>
              <option value="customerName:asc">Name A-Z</option>
              <option value="customerName:desc">Name Z-A</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">Per page:</span>
            <select
              value={itemsPerPage}
              onChange={(event) => onItemsPerPageChange(Number(event.target.value))}
              className="h-9 w-[100px] rounded-md border border-slate-200 bg-white px-2.5 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
