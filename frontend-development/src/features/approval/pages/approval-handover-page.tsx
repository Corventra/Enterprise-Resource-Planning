import { useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router';
import { ApprovalEmptyState } from '../components/approval-empty-state';
import { ApprovalSearch } from '../components/approval-search';
import { ApprovalTable } from '../components/approval-table';
import type { ApprovalItem, ApprovalOutletContext } from '../types/approval.types';

export const ApprovalHandoverPage = () => {
  const navigate = useNavigate();
  const { pendingItems, queueLoading, isReadOnly, approve, requestRevision } = useOutletContext<ApprovalOutletContext>();
  const [search, setSearch] = useState('');

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return pendingItems;

    return pendingItems.filter((item) => {
      const haystack = [item.docCode, item.client, item.title, item.serviceLine, item.submittedBy]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [pendingItems, search]);

  const handleView = (item: ApprovalItem) => {
    navigate(item.detailRoute);
  };

  const handleApprove = (item: ApprovalItem) => {
    void approve(item);
  };

  const handleRequestRevision = (item: ApprovalItem) => {
    void requestRevision(item);
  };

  if (queueLoading) {
    return (
      <div className="rounded-xl border border-[#eceef0] bg-white p-4 text-sm text-[#737784] shadow-sm">
        Loading approval queue...
      </div>
    );
  }

  if (pendingItems.length === 0) {
    return <ApprovalEmptyState />;
  }

  return (
    <div className="space-y-4">
      <ApprovalSearch search={search} onSearchChange={setSearch} onReset={() => setSearch('')} />

      {filteredItems.length === 0 ? (
        <ApprovalEmptyState onReset={search ? () => setSearch('') : undefined} />
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
