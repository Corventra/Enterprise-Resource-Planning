import { FileText, Mail, Phone } from 'lucide-react';
import type { InvoiceDetail } from '../../types/invoice.types';
import { formatCurrency, formatDate } from './invoice-detail-formatters';

interface InvoiceFinancialOverviewProps {
  detail: InvoiceDetail;
}

const displayValue = (value: string | null | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : '-';
};

export const InvoiceFinancialOverview = ({ detail }: InvoiceFinancialOverviewProps) => {
  const { financialSummary } = detail;
  const net = financialSummary.netPaymentTotal;
  const progress = Math.min(100, Math.max(0, financialSummary.paymentProgress));
  const paidNet = Math.round((net * progress) / 100);
  const remainingNet = Math.max(0, net - paidNet);

  return (
    <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12 lg:gap-8">
      <section className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-xl bg-[linear-gradient(135deg,#001f5c_0%,#003c90_45%,#1e63d6_100%)] p-4 text-sm text-white shadow-sm sm:p-5 lg:col-span-8">
        <div className="relative z-10 mb-3 flex items-center justify-between">
          <h3 className="text-base font-bold leading-tight">Invoice Core Details</h3>
        </div>
        <div className="relative z-10 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 sm:gap-x-5 lg:grid-cols-3 lg:gap-x-6">
          <div>
            <p className="mb-0.5 text-[9px] font-bold uppercase tracking-widest text-white/60">Company Name</p>
            <p className="text-sm font-semibold leading-snug">{displayValue(detail.invoice.clientName)}</p>
            <p className="mt-0.5 text-[11px] leading-snug text-white/70">{displayValue(detail.clientInfo.address)}</p>
          </div>
          <div>
            <p className="mb-0.5 text-[9px] font-bold uppercase tracking-widest text-white/60">Lead ID</p>
            <p className="text-sm font-semibold leading-snug">{displayValue(detail.leadId)}</p>
          </div>
          <div>
            <p className="mb-0.5 text-[9px] font-bold uppercase tracking-widest text-white/60">Company PIC</p>
            <p className="text-sm font-semibold leading-snug">{displayValue(detail.clientInfo.picName)}</p>
          </div>
          <div>
            <p className="mb-0.5 text-[9px] font-bold uppercase tracking-widest text-white/60">PIC Phone</p>
            <div className="inline-flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 shrink-0 text-white/80" />
              <span className="text-sm font-semibold leading-snug">{displayValue(detail.clientInfo.phone)}</span>
            </div>
          </div>
          <div>
            <p className="mb-0.5 text-[9px] font-bold uppercase tracking-widest text-white/60">PIC Email</p>
            <div className="inline-flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 shrink-0 text-white/80" />
              <span className="break-words text-sm font-semibold leading-snug">{displayValue(detail.clientInfo.email)}</span>
            </div>
          </div>
          <div>
            <p className="mb-0.5 text-[9px] font-bold uppercase tracking-widest text-white/60">Contract Value</p>
            <p className="text-sm font-semibold leading-snug">{formatCurrency(detail.contractSummary.contractValue)}</p>
          </div>
          <div>
            <p className="mb-0.5 text-[9px] font-bold uppercase tracking-widest text-white/60">Payment Method</p>
            <p className="text-sm font-semibold leading-snug">{displayValue(detail.contractSummary.paymentMethod)}</p>
          </div>
          <div>
            <p className="mb-0.5 text-[9px] font-bold uppercase tracking-widest text-white/60">EL Reference</p>
            <div className="inline-flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 shrink-0 text-white/80" />
              <span className="text-sm font-semibold leading-snug">{displayValue(detail.contractSummary.engagementLetterReference)}</span>
            </div>
          </div>
          <div>
            <p className="mb-0.5 text-[9px] font-bold uppercase tracking-widest text-white/60">EL Date</p>
            <p className="text-sm font-semibold leading-snug">{formatDate(detail.contractSummary.engagementLetterDate)}</p>
          </div>
          <div>
            <p className="mb-0.5 text-[9px] font-bold uppercase tracking-widest text-white/60">Issuer Company</p>
            <p className="text-sm font-semibold leading-snug">{displayValue(detail.issuerCompany)}</p>
          </div>
          <div>
            <p className="mb-0.5 text-[9px] font-bold uppercase tracking-widest text-white/60">Subcontract</p>
            <p className="text-sm font-semibold leading-snug">{displayValue(detail.subcontract?.partnerName)}</p>
          </div>
          <div>
            <p className="mb-0.5 text-[9px] font-bold uppercase tracking-widest text-white/60">Payer party</p>
            <p className="text-sm font-semibold leading-snug">{displayValue(detail.subcontract?.payerParty)}</p>
          </div>
        </div>
        <div className="absolute -right-8 -bottom-8 h-32 w-32 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -left-4 top-1/2 h-20 w-20 rounded-full bg-white/5 blur-2xl" />
      </section>

      <div className="flex h-full min-h-0 lg:col-span-4">
        <div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl border border-[#eceef0] border-l-4 border-l-[#004b31] bg-white p-6 text-[#191c1e] shadow-sm">
          <div className="relative z-10 flex min-h-0 flex-1 flex-col">
            <div>
              <div className="relative z-10 mb-5 flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#191c1e]">Estimasi Bersih Diterima</h3>
              </div>
              <h4 className="text-2xl font-bold tracking-tight text-[#191c1e]">{formatCurrency(net)}</h4>
              <div className="mt-2 flex items-center gap-2 text-xs font-medium text-[#004b31]">
                <span
                  className="material-symbols-outlined text-base leading-none text-[#004b31]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  verified
                </span>
                <span>Sudah termasuk PPN 11% dan PPh 23</span>
              </div>
            </div>
            <div className="mt-auto border-t border-[#eceef0] pt-6">
              <p className="mb-3 text-xs font-medium text-slate-600">Progress Pembayaran ({progress}%)</p>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-[#003c90]" style={{ width: `${progress}%` }} />
              </div>
              <div className="mt-2 flex flex-col gap-1.5 text-[10px] font-bold uppercase tracking-tight text-slate-700 sm:flex-row sm:justify-between sm:gap-2">
                <span>Terbayar: {formatCurrency(paidNet)}</span>
                <span>Sisa: {formatCurrency(remainingNet)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
