import type { ReactNode } from 'react';

export const modalSecondaryBtnClass =
  'rounded-lg border border-[#eceef0] bg-white px-4 py-2 text-sm font-semibold text-[#434653] transition-colors hover:bg-[#f2f4f6] disabled:cursor-not-allowed disabled:opacity-50';

export const modalPrimaryBtnClass =
  'rounded-lg bg-[linear-gradient(135deg,#003c90_0%,#0f52ba_100%)] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-[#003c90]/20 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60';

export const modalOutlinePrimaryBtnClass =
  'rounded-lg border border-[#b0c6ff] bg-white px-4 py-2 text-sm font-semibold text-[#003c90] transition-colors hover:bg-[#d9e2ff]/40 disabled:cursor-not-allowed disabled:opacity-50';

export const MeetingModalSection = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="overflow-hidden rounded-xl border border-[#eceef0] bg-white">
    <div className="border-b border-[#eceef0] bg-[#f2f4f6]/60 px-4 py-2.5">
      <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#737784]">{title}</h3>
    </div>
    <div className="px-4 py-4">{children}</div>
  </section>
);

export const MeetingDetailField = ({ label, children }: { label: string; children: ReactNode }) => (
  <div>
    <p className="text-[10px] font-bold uppercase tracking-wide text-[#737784]">{label}</p>
    <div className="mt-1 text-sm text-[#191c1e]">{children}</div>
  </div>
);

interface MeetingConfirmDialogShellProps {
  open: boolean;
  title: string;
  busy?: boolean;
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
}

export const MeetingConfirmDialogShell = ({
  open,
  title,
  busy = false,
  onClose,
  children,
  footer
}: MeetingConfirmDialogShellProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-slate-900/40"
        onClick={() => !busy && onClose()}
        aria-label="Tutup dialog"
        disabled={busy}
      />
      <div
        className="relative w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-[#eceef0]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="meeting-confirm-dialog-title"
      >
        <div className="border-b border-[#eceef0] px-5 py-4">
          <h2 id="meeting-confirm-dialog-title" className="text-base font-semibold text-[#191c1e]">
            {title}
          </h2>
        </div>
        <div className="px-5 py-4">{children}</div>
        <div className="flex flex-wrap justify-end gap-2 border-t border-[#eceef0] bg-[#f8f9fa] px-5 py-4">
          {footer}
        </div>
      </div>
    </div>
  );
};

export const MeetingConfirmSummaryCard = ({ children }: { children: ReactNode }) => (
  <div className="rounded-lg border border-[#eceef0] bg-[#f8f9fa] px-4 py-3 text-sm text-[#434653]">{children}</div>
);
