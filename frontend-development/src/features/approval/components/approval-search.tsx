import { Filter, Search } from 'lucide-react';

export type ApprovalQueueSortOrder = 'newest' | 'oldest';

interface ApprovalSearchProps {
  search: string;
  onSearchChange: (value: string) => void;
  onReset: () => void;
  sortOrder?: ApprovalQueueSortOrder;
  onSortOrderChange?: (value: ApprovalQueueSortOrder) => void;
}

const fieldFocus = 'focus:outline-none focus:ring-2 focus:ring-[#1d59c1]/20';
const selectClassName = `rounded-lg border-none bg-white py-2 pl-3 pr-8 text-xs font-semibold text-[#434653] shadow-sm ${fieldFocus}`;

export const ApprovalSearch = ({
  search,
  onSearchChange,
  onReset,
  sortOrder,
  onSortOrderChange
}: ApprovalSearchProps) => {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl bg-[#f2f4f6] p-4">
      <div className="relative min-w-[260px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#737784]" />
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className={`w-full rounded-lg border-none bg-white py-2 pl-10 pr-3 text-sm text-[#191c1e] shadow-sm placeholder:text-[#737784]/80 ${fieldFocus}`}
          placeholder="Search doc code, client, title, submitter..."
        />
      </div>
      {sortOrder && onSortOrderChange ? (
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={sortOrder}
            onChange={(event) => onSortOrderChange(event.target.value as ApprovalQueueSortOrder)}
            className={selectClassName}
            aria-label="Sort approval queue"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>
      ) : null}
      <button
        type="button"
        onClick={onReset}
        title="Reset filters"
        aria-label="Reset filters"
        className="rounded-lg bg-white p-2 text-[#737784] shadow-sm transition-colors hover:text-[#003c90]"
      >
        <Filter className="h-4 w-4" />
      </button>
    </div>
  );
};
