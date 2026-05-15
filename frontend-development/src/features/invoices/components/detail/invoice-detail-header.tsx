import { ArrowLeft } from 'lucide-react';
import type { InvoiceDetail } from '../../types/invoice.types';

interface InvoiceDetailHeaderProps {
  detail: InvoiceDetail;
  onBack: () => void;
}

export const InvoiceDetailHeader = ({ detail, onBack }: InvoiceDetailHeaderProps) => {
  return (
    <header className="space-y-2">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1 text-sm font-semibold text-[#003c90] hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke Daftar
      </button>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-extrabold tracking-tight text-[#191c1e]">{detail.invoice.clientName}</h1>
        <span className="rounded-full bg-[#d5e3fc] px-4 py-1 text-xs font-bold uppercase tracking-wider text-[#57657a]">
          {detail.invoice.status}
        </span>
      </div>
      <p className="text-sm font-medium text-[#737784]">
        Lead #{detail.leadId} · {detail.invoice.serviceName}
      </p>
      <p className="text-xs text-[#737784]">
        Next action: <span className="font-semibold text-[#191c1e]">{detail.nextAction}</span>
      </p>
    </header>
  );
};
