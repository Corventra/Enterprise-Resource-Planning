import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { ROLES } from '../../../app/permissions';
import { useAuth } from '../../../app/store/auth-store';
import { Toast } from '../../../components/ui/toast';
import { useToast } from '../../../hooks/use-toast';
import { MeetingsEmptyState } from '../components/list/meetings-empty-state';
import { MeetingsFiltersSection } from '../components/list/meetings-filters';
import { MeetingsSummaryCards } from '../components/list/meetings-summary-cards';
import { MeetingsTable } from '../components/list/meetings-table';
import { MarkMeetingCompleteDialog } from '../components/modals/mark-meeting-complete-dialog';
import { MeetingDetailPanel } from '../components/modals/meeting-detail-panel';
import { useMeetingsFilters } from '../hooks/use-meetings-filters';
import { useMeetingsList } from '../hooks/use-meetings-list';
import type { MeetingMonitorItem } from '../types/meetings.types';

export const MeetingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isBd = user?.role === ROLES.BD;
  const canMarkComplete = isBd;
  const showHandledByFilter = user?.role === ROLES.CEO;

  const { items, isLoading, loadError, summary, refetchSummary, completeMeeting } = useMeetingsList();
  const {
    filters,
    filteredItems,
    paginatedItems,
    currentPage,
    totalPages,
    pageSize,
    handledByFilterOptions,
    summaryHandledByTarget,
    setCurrentPage,
    updateFilter,
    resetFilters
  } = useMeetingsFilters(items);

  const [detailTarget, setDetailTarget] = useState<MeetingMonitorItem | undefined>();
  const selectedMeetingId = detailTarget?.id;
  const [completeTarget, setCompleteTarget] = useState<MeetingMonitorItem | undefined>();
  const [mutationBusy, setMutationBusy] = useState(false);
  const { message: toastMessage, variant: toastVariant, dismiss: dismissToast, show: showToast } = useToast();

  const skipInitialOrgSummarySync = useRef(true);

  useEffect(() => {
    if (!showHandledByFilter || isLoading) return;
    if (skipInitialOrgSummarySync.current) {
      skipInitialOrgSummarySync.current = false;
      if (summaryHandledByTarget == null) return;
    }
    void refetchSummary(summaryHandledByTarget);
  }, [showHandledByFilter, isLoading, summaryHandledByTarget, refetchSummary]);

  const pageNumbers = useMemo(() => Array.from({ length: totalPages }, (_, index) => index + 1), [totalPages]);
  const rangeStart = filteredItems.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, filteredItems.length);

  const openWorkspace = (item: MeetingMonitorItem) => {
    navigate(`/lead-workspace/${item.leadId}/meeting`);
  };

  const runMarkComplete = async (item: MeetingMonitorItem) => {
    setMutationBusy(true);
    try {
      await completeMeeting(item.leadId, item.id, summaryHandledByTarget);
      setCompleteTarget(undefined);
      setDetailTarget(undefined);
      showToast('Meeting ditandai selesai.');
    } catch {
      showToast('Gagal menandai meeting selesai.', { variant: 'error' });
    } finally {
      setMutationBusy(false);
    }
  };

  const paginationFooter =
    totalPages > 0 ? (
      <div className="flex flex-col gap-3 border-none bg-[#eceef0] px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-medium text-[#737784] sm:text-sm">
          Menampilkan{' '}
          <span className="font-bold text-[#191c1e]">
            {rangeStart} - {rangeEnd}
          </span>{' '}
          dari {filteredItems.length.toLocaleString('id-ID')} meeting
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            className="rounded-lg p-1.5 text-[#737784] transition-colors hover:bg-[#e0e3e5] disabled:opacity-30"
            aria-label="Halaman sebelumnya"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {pageNumbers.map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => setCurrentPage(page)}
              className={
                page === currentPage
                  ? 'flex h-7 w-7 items-center justify-center rounded-md bg-[#003c90] text-xs font-bold text-white shadow-sm shadow-[#003c90]/20'
                  : 'flex h-7 w-7 items-center justify-center rounded-md text-xs font-medium text-[#737784] transition-colors hover:bg-[#e0e3e5]'
              }
            >
              {page}
            </button>
          ))}
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
            className="rounded-lg p-1.5 text-[#737784] transition-colors hover:bg-[#e0e3e5] disabled:opacity-30"
            aria-label="Halaman berikutnya"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    ) : null;

  const hasActiveFilters =
    filters.search !== '' ||
    filters.status !== 'All' ||
    filters.mode !== 'All' ||
    filters.minutes !== 'All' ||
    filters.handledBy !== 'All';

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Meeting</h1>
        <p className="mt-1 text-sm text-slate-500">
          Monitoring jadwal meeting dan akses cepat ke lead terkait.
        </p>
      </header>

      <MeetingsSummaryCards summary={summary} />

      <MeetingsFiltersSection
        filters={filters}
        handledByFilterOptions={handledByFilterOptions}
        showHandledByFilter={showHandledByFilter}
        onSearchChange={(value) => updateFilter('search', value)}
        onStatusChange={(value) => updateFilter('status', value)}
        onModeChange={(value) => updateFilter('mode', value)}
        onMinutesChange={(value) => updateFilter('minutes', value)}
        onHandledByChange={(value) => updateFilter('handledBy', value)}
        onReset={resetFilters}
      />

      {isLoading ? (
        <div className="rounded-xl border border-[#eceef0] bg-white p-4 text-sm text-[#737784] shadow-sm">
          Memuat daftar meeting...
        </div>
      ) : loadError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">{loadError}</div>
      ) : filteredItems.length === 0 ? (
        <MeetingsEmptyState showBdHint={isBd && !hasActiveFilters} onReset={hasActiveFilters ? resetFilters : undefined} />
      ) : (
        <MeetingsTable
          items={paginatedItems}
          selectedMeetingId={selectedMeetingId}
          canMarkComplete={canMarkComplete}
          onView={setDetailTarget}
          onMarkComplete={setCompleteTarget}
          footer={paginationFooter}
        />
      )}

      <MeetingDetailPanel
        open={Boolean(detailTarget)}
        item={detailTarget}
        canMarkComplete={canMarkComplete}
        busy={mutationBusy}
        onClose={() => setDetailTarget(undefined)}
        onOpenWorkspace={openWorkspace}
        onMarkComplete={setCompleteTarget}
      />

      <MarkMeetingCompleteDialog
        open={Boolean(completeTarget)}
        item={completeTarget}
        busy={mutationBusy}
        onClose={() => setCompleteTarget(undefined)}
        onConfirm={runMarkComplete}
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
