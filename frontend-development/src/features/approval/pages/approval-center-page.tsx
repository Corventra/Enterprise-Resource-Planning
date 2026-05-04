import { useNavigate } from 'react-router';
import { ROLES } from '../../../app/permissions';
import { useAuth } from '../../../app/store/auth-store';
import { ApprovalEmptyState } from '../components/approval-empty-state';
import { ApprovalSearch } from '../components/approval-search';
import { ApprovalSummaryCards } from '../components/approval-summary-cards';
import { ApprovalTable } from '../components/approval-table';
import { ApprovalTabs } from '../components/approval-tabs';
import { useApprovalFilters } from '../hooks/use-approval-filters';
import { useApprovalQueue } from '../hooks/use-approval-queue';
import type { ApprovalItem } from '../types/approval.types';

export const ApprovalCenterPage = () => {
  const navigate = useNavigate();
  const { role } = useAuth();
  const { items, isLoading, summary, approve, requestRevision } = useApprovalQueue();
  const { filters, filteredItems, updateFilter, setKind, resetFilters } = useApprovalFilters(items);

  const isReadOnly = role === ROLES.COO;

  const handleView = (item: ApprovalItem) => {
    navigate(item.detailRoute);
  };

  const handleApprove = (item: ApprovalItem) => {
    void approve(item);
  };

  const handleRequestRevision = (item: ApprovalItem) => {
    void requestRevision(item);
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Approval Center</h1>
          <p className="mt-1 text-sm text-slate-500">
            {isReadOnly
              ? 'Pantau seluruh proposal, engagement letter, dan handover memo yang sedang menunggu approval CEO.'
              : 'Review dan approve proposal, engagement letter, dan handover memo yang menunggu sign-off Anda.'}
          </p>
        </div>
      </header>

      <ApprovalSummaryCards summary={summary} />

      <ApprovalTabs active={filters.kind} summary={summary} onChange={setKind} />

      <ApprovalSearch
        search={filters.search}
        onSearchChange={(value) => updateFilter('search', value)}
        onReset={resetFilters}
      />

      {isLoading ? (
        <div className="rounded-xl border border-[#eceef0] bg-white p-4 text-sm text-[#737784] shadow-sm">
          Loading approval queue...
        </div>
      ) : filteredItems.length === 0 ? (
        <ApprovalEmptyState onReset={filters.search || filters.kind !== 'All' ? resetFilters : undefined} />
      ) : (
        <ApprovalTable
          items={filteredItems}
          onView={handleView}
          onApprove={handleApprove}
          onRequestRevision={handleRequestRevision}
          isReadOnly={isReadOnly}
        />
      )}
    </div>
  );
};
