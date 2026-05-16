import type { ApprovalProposalLeadSummary } from '../types/approval.types';

interface ApprovalLeadCoreSummaryProps {
  summary: ApprovalProposalLeadSummary | null;
  isLoading?: boolean;
}

const displayValue = (value: string | null | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : '-';
};

const formatDateTime = (iso: string | null | undefined) => {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const fields: Array<{ key: keyof ApprovalProposalLeadSummary; label: string; format?: 'datetime' }> = [
  { key: 'companyName', label: 'Company Name' },
  { key: 'picName', label: 'Company PIC' },
  { key: 'email', label: 'PIC Email' },
  { key: 'phoneNumber', label: 'PIC Phone' },
  { key: 'leadSourceLabel', label: 'Lead Source' },
  { key: 'processedByName', label: 'Processed By' },
  { key: 'processedAt', label: 'Processed At', format: 'datetime' },
  { key: 'desiredServices', label: 'Desired Services' }
];

export const ApprovalLeadCoreSummary = ({ summary, isLoading = false }: ApprovalLeadCoreSummaryProps) => {
  return (
    <section className="relative overflow-hidden rounded-xl bg-[linear-gradient(135deg,#001f5c_0%,#003c90_45%,#1e63d6_100%)] p-4 text-white shadow-sm">
      <div className="relative z-10 mb-2">
        <h3 className="text-sm font-bold">Lead Summary</h3>
      </div>
      {isLoading ? (
        <p className="relative z-10 text-xs text-white/80">Memuat ringkasan lead...</p>
      ) : (
        <div className="relative z-10 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
          {fields.map(({ key, label, format }) => (
            <div key={key}>
              <p className="text-[9px] font-bold uppercase tracking-wide text-white/60">{label}</p>
              <p className="text-xs font-medium leading-snug">
                {format === 'datetime' ? formatDateTime(summary?.[key]) : displayValue(summary?.[key])}
              </p>
            </div>
          ))}
        </div>
      )}
      <div className="absolute -right-8 -bottom-8 h-28 w-28 rounded-full bg-white/5 blur-2xl" />
      <div className="absolute -left-4 top-1/2 h-16 w-16 rounded-full bg-white/5 blur-xl" />
    </section>
  );
};
