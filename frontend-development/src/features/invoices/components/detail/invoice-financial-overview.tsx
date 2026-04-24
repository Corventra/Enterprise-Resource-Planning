import { Building2, FileText, Mail, MapPin, Phone, User, Wallet } from 'lucide-react';
import type { InvoiceDetail } from '../../types/invoice.types';
import { formatCurrency, formatDate } from './invoice-detail-formatters';

interface InvoiceFinancialOverviewProps {
  detail: InvoiceDetail;
}

export const InvoiceFinancialOverview = ({ detail }: InvoiceFinancialOverviewProps) => {
  const VAT_RATE = 0.11;
  const PPH23_RATE = 0.02;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-[#eceef0] lg:col-span-4">
          <div className="mb-4 flex items-start justify-between">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Ringkasan Kontrak</h3>
            <FileText className="h-4 w-4 text-[#003c90]/40" />
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-[#737784]">Nilai Kontrak</p>
              <p className="text-2xl font-extrabold text-[#191c1e]">{formatCurrency(detail.contractSummary.contractValue)}</p>
              <p className="mt-1 text-[10px] italic text-slate-400">Nilai dasar project sebelum pajak</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-slate-400">Skema Termin</p>
                <p className="font-semibold text-[#191c1e]">{detail.contractSummary.installmentScheme}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Referensi EL</p>
                <p className="font-semibold text-[#191c1e]">{detail.contractSummary.engagementLetterReference}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Tanggal EL</p>
                <p className="font-semibold text-[#191c1e]">{formatDate(detail.contractSummary.engagementLetterDate)}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-[#eceef0] lg:col-span-8">
          <div className="mb-6 flex items-start justify-between">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Rekap Tagihan & Pembayaran</h3>
            <Wallet className="h-4 w-4 text-[#003c90]/40" />
          </div>

          <div className="grid grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-sm font-bold text-[#191c1e]">DPP Kontrak</span>
                <span className="text-sm font-bold text-[#191c1e]">{formatCurrency(detail.financialSummary.dppContract)}</span>
              </div>

              {detail.installments.map((item) => {
                const vatAmount = Math.round(item.baseAmount * VAT_RATE);
                const pph23Amount = Math.round(item.baseAmount * PPH23_RATE);
                const netInstallment = item.baseAmount + vatAmount - pph23Amount;

                return (
                  <div key={item.id} className="space-y-1.5 pt-1">
                    <p className="text-[10px] font-bold uppercase tracking-tight text-[#003c90]">{item.termName}</p>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Dasar Tagihan</span>
                      <span className="font-medium text-[#191c1e]">{formatCurrency(item.baseAmount)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">PPN 11%</span>
                      <span className="font-medium text-[#004b31]">+ {formatCurrency(vatAmount)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">PPh 23 2%</span>
                      <span className="font-medium text-[#ba1a1a]">- {formatCurrency(pph23Amount)}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-50 pt-1 text-xs italic">
                      <span className="font-bold text-slate-600">Total Bersih Termin</span>
                      <span className="font-bold text-[#191c1e]">{formatCurrency(netInstallment)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col justify-between rounded-lg bg-slate-50/50 p-4">
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Total Tagihan Bruto</p>
                  <p className="text-lg font-extrabold text-[#191c1e]">{formatCurrency(detail.financialSummary.grossInvoiceTotal)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Total Pembayaran Bersih</p>
                  <p className="text-xl font-extrabold text-[#004b31]">{formatCurrency(detail.financialSummary.netPaymentTotal)}</p>
                </div>
              </div>

              <div className="mt-6">
                <div className="mb-2 flex justify-between text-xs">
                  <span className="font-bold text-[#191c1e]">Progress Pembayaran</span>
                  <span className="font-extrabold text-[#004b31]">{detail.financialSummary.paymentProgress}%</span>
                </div>
                <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-[#004b31]" style={{ width: `${detail.financialSummary.paymentProgress}%` }} />
                </div>
                <div className="flex items-center justify-between rounded border border-slate-100 bg-white px-3 py-2">
                  <span className="text-xs font-bold uppercase text-slate-400">Sisa Tagihan</span>
                  <span className="text-sm font-extrabold text-[#191c1e]">{formatCurrency(detail.financialSummary.outstandingTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-[#eceef0]">
        <div className="flex flex-col gap-8 md:flex-row">
          <div className="flex min-w-[240px] items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#003c90]/10 text-[#003c90]">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-[#191c1e]">{detail.invoice.clientName}</h3>
              <p className="text-xs text-slate-500">ID Klien: {detail.clientInfo.clientId}</p>
            </div>
          </div>

          <div className="grid flex-1 grid-cols-1 gap-6 md:grid-cols-4">
            <div className="flex items-start gap-3">
              <User className="mt-0.5 h-4 w-4 text-slate-400" />
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">PIC Project</p>
                <p className="text-sm font-semibold text-[#191c1e]">{detail.clientInfo.picName}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-4 w-4 text-slate-400" />
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">Email</p>
                <p className="text-sm font-semibold text-[#191c1e]">{detail.clientInfo.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="mt-0.5 h-4 w-4 text-slate-400" />
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">Telepon</p>
                <p className="text-sm font-semibold text-[#191c1e]">{detail.clientInfo.phone}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 text-slate-400" />
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">Alamat</p>
                <p className="text-sm font-medium leading-tight text-[#191c1e]">{detail.clientInfo.address}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
