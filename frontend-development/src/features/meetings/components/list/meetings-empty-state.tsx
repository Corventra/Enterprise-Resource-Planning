import { CalendarDays } from 'lucide-react';

interface MeetingsEmptyStateProps {
  showBdHint?: boolean;
  onReset?: () => void;
}

export const MeetingsEmptyState = ({ showBdHint = false, onReset }: MeetingsEmptyStateProps) => (
  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#d0d4d9] bg-white px-6 py-16 text-center shadow-sm">
    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#f2f4f6] text-[#737784]">
      <CalendarDays className="h-7 w-7" />
    </div>
    <h2 className="text-lg font-semibold text-[#191c1e]">Belum ada meeting terjadwal.</h2>
    {showBdHint ? (
      <p className="mt-2 max-w-md text-sm text-[#737784]">
        Jadwalkan meeting dari Lead Workspace pada tab Meeting &amp; Minutes.
      </p>
    ) : (
      <p className="mt-2 max-w-md text-sm text-[#737784]">
        Meeting yang terdaftar akan muncul di sini untuk pemantauan terpusat.
      </p>
    )}
    {onReset ? (
      <button
        type="button"
        onClick={onReset}
        className="mt-6 rounded-lg border border-[#eceef0] bg-white px-4 py-2 text-sm font-semibold text-[#003c90] shadow-sm transition-colors hover:bg-[#f8f9fa]"
      >
        Reset filter
      </button>
    ) : null}
  </div>
);
