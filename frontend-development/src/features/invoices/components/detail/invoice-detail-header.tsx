import { ArrowLeft } from 'lucide-react';
import type { InvoiceDetail } from '../../types/invoice.types';
import { formatDate } from './invoice-detail-formatters';

interface InvoiceDetailHeaderProps {
  detail: InvoiceDetail;
  onBack: () => void;
}

export const InvoiceDetailHeader = ({ detail, onBack }: InvoiceDetailHeaderProps) => {
  return (
    <header className="min-w-0 space-y-2">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1 text-xs font-semibold text-[#003c90] hover:underline sm:text-sm"
      >
        <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        Kembali ke Daftar
      </button>
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
        <h1 className="min-w-0 text-xl font-extrabold tracking-tight text-[#191c1e] sm:text-2xl md:text-3xl">
          {detail.invoice.clientName}
        </h1>
        <span className="w-fit shrink-0 rounded-full bg-[#d5e3fc] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#57657a] sm:px-4 sm:text-xs">
          {detail.invoice.status}
        </span>
      </div>
      <p className="text-xs font-medium text-[#737784] sm:text-sm">
        <span className="break-words">{detail.leadCode}</span>
        <span className="mx-1">·</span>
        <span className="break-words">{detail.invoice.serviceName}</span>
      </p>
      <div className="text-[11px] text-[#737784] sm:text-xs">
        <p>
          Next action: <span className="font-semibold text-[#191c1e]">{detail.nextAction}</span>
        </p>
        <p className="mt-0.5">
          Tenggat: <span className="font-semibold text-[#191c1e]">{formatDate(detail.invoice.nextDueDate ?? '')}</span>
        </p>
      </div>
    </header>
  );
};
