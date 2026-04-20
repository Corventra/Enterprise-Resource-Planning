import { BadgeCheck, Download, FileBadge2, FileText } from 'lucide-react';
import type { LeadWorkspaceProposalItem } from '../types/lead-workspace.types';

interface ProposalDetailSectionProps {
  proposal?: LeadWorkspaceProposalItem;
}

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

const tierLabelMap = {
  STRATEGIC_RETAINER: 'Strategic Retainer',
  PREMIUM_MODULAR: 'Premium Modular',
  STANDARDIZED_MODULAR: 'Standardized Modular'
} as const;

const statusLabelMap = {
  DRAFT: 'Draft',
  WAITING_CEO_APPROVAL: 'Waiting CEO Approval',
  REVISION: 'Revision',
  APPROVED: 'Approved',
  SENT: 'Sent'
} as const;

export const ProposalDetailSection = ({ proposal }: ProposalDetailSectionProps) => {
  return (
    <aside className="col-span-12 flex flex-col gap-4 lg:col-span-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight text-[#191c1e]">Proposal Detail</h2>
        <button
          type="button"
          aria-hidden="true"
          tabIndex={-1}
          className="pointer-events-none inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold opacity-0 sm:text-sm"
        >
          Placeholder
        </button>
      </div>
      <div className="flex flex-1 flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-[#eceef0]">
        {proposal ? (
          <>
            <div className="bg-gradient-to-r from-[#f2f4f6] to-[#f2f4f6]/40 p-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold leading-tight text-[#191c1e]">{proposal.title}</h3>
                  <p className="mt-1 text-xs text-[#434653]">Proposal ID: #{proposal.id.toUpperCase()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[#006544]/10 px-2.5 py-0.5 text-xs font-bold text-[#006544]">
                    {statusLabelMap[proposal.detail.status]}
                  </span>
                  <div className="rounded-full bg-white p-2 shadow-sm">
                    <FileBadge2 className="h-4 w-4 text-[#003c90]" />
                  </div>
                </div>
              </div>
              <div className="inline-flex flex-wrap items-center gap-2">
                <span className="text-xs text-[#515f74]">{tierLabelMap[proposal.detail.tier]}</span>
                <span className="text-xs text-[#515f74]">-</span>
                <span className="text-xs text-[#515f74]">{proposal.detail.serviceType}</span>
                <span className="text-xs text-[#515f74]">-</span>
                <span className="text-xs text-[#515f74]">{proposal.paymentType}</span>
              </div>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto px-8 pb-8">
              <section className="rounded-xl mt-5 border border-[#c3c6d5]/30 p-6">
                <h4 className="mb-5 text-xs font-black uppercase tracking-widest text-[#434653]">Commercial Overview</h4>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                  <div>
                    <p className="mb-1 text-center text-[10px] font-bold uppercase text-[#737784]">Proposal Fee</p>
                    <p className="text-center text-lg font-bold text-[#191c1e]">{proposal.proposalFee}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-center text-[10px] font-bold uppercase text-[#ba1a1a]">Discount</p>
                    <p className="text-center text-lg font-bold text-[#ba1a1a]">{proposal.detail.discount}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-center text-[10px] font-bold uppercase text-[#004b31]">Harga Deal</p>
                    <p className="text-center text-xl font-black text-[#004b31]">{proposal.dealPrice}</p>
                  </div>
                </div>
              </section>

              <section className="rounded-xl bg-[#f2f4f6] p-6">
                <h4 className="mb-4 flex items-center justify-between text-xs font-black uppercase tracking-widest text-[#434653]">
                  <span>Payment Detail ({proposal.detail.planMode})</span>
                  <span className="text-[10px] font-bold text-[#737784]">
                    {proposal.detail.planMode === 'INSTALLMENTS' ? `${proposal.detail.billingSchedule.length} Terms Total` : 'Summary'}
                  </span>
                </h4>
                {proposal.detail.planMode === 'INSTALLMENTS' ? (
                  <div className="overflow-hidden rounded-lg border border-[#c3c6d5]/20 bg-white">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[#e6e8ea]">
                        <tr>
                          <th className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#737784]">Term</th>
                          <th className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#737784]">Due Date</th>
                          <th className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#737784]">Amount</th>
                          <th className="px-4 py-2 text-right text-[10px] font-black uppercase tracking-widest text-[#737784]">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {proposal.detail.billingSchedule.map((item, idx) => (
                          <tr key={`${item.label}-${idx}`} className="border-t border-[#eceef0]">
                            <td className="px-4 py-3 font-semibold text-[#191c1e]">{item.label} ({item.percentage}%)</td>
                            <td className="px-4 py-3 text-[#434653]">{formatDate(proposal.dealDate)}</td>
                            <td className="px-4 py-3 font-bold text-[#191c1e]">{item.nominal}</td>
                            <td className="px-4 py-3 text-right text-[10px] font-bold uppercase text-[#737784]">
                              {idx === 0 ? 'Paid' : 'Pending'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : proposal.detail.planMode === 'MONTHLY_RETAINER' ? (
                  <div className="space-y-2 text-sm text-[#434653]">
                    <p>
                      <span className="font-semibold text-[#191c1e]">Contract Period:</span> {proposal.detail.contractStart} - {proposal.detail.contractEnd}
                    </p>
                    <p>
                      <span className="font-semibold text-[#191c1e]">Billing Timing:</span>{' '}
                      {proposal.detail.billingTiming === 'START_OF_MONTH' ? 'Awal bulan' : 'Akhir bulan'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm text-[#434653]">
                    <p>
                      <span className="font-semibold text-[#191c1e]">Uang Muka:</span> {proposal.detail.downPayment}
                    </p>
                    <p>
                      <span className="font-semibold text-[#191c1e]">Success Fee:</span> {proposal.detail.successFeePercent}
                    </p>
                    <p>
                      <span className="font-semibold text-[#191c1e]">Basis:</span> {proposal.detail.successFeeBase}
                    </p>
                  </div>
                )}
              </section>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <section className="rounded-xl border border-[#c3c6d5]/30 p-5">
                  <h4 className="mb-4 text-xs font-black uppercase tracking-widest text-[#434653]">Subcontract</h4>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-[#191c1e]">
                      Partner: <span className="font-normal text-[#434653]">{proposal.detail.subconPartner || '-'}</span>
                    </p>
                    <p className="text-xs font-semibold text-[#191c1e]">
                      Payer:{' '}
                      <span className="font-normal text-[#434653]">
                        {proposal.detail.subconPayer === 'PARTNER'
                          ? 'Partner'
                          : proposal.detail.subconPayer === 'CLIENT'
                            ? 'Lead Engine Entity'
                            : '-'}
                      </span>
                    </p>
                    <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#006544]/10 px-2 py-1">
                      <BadgeCheck className="h-3.5 w-3.5 text-[#004b31]" />
                      <span className="text-[10px] font-bold uppercase text-[#004b31]">
                        {proposal.detail.hasSubcon ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                </section>

                <section className="rounded-xl border border-[#c3c6d5]/30 p-5">
                  <h4 className="mb-4 text-xs font-black uppercase tracking-widest text-[#434653]">Timeline</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-[#737784]">Sent At</p>
                      <p className="text-xs font-semibold text-[#191c1e]">{formatDateTime(proposal.sentAt)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-[#737784]">Deal Date</p>
                      <p className="text-xs font-semibold text-[#191c1e]">{formatDateTime(proposal.dealDate)}</p>
                    </div>
                  </div>
                </section>
              </div>

              <section>
                <h4 className="mb-4 text-xs font-black uppercase tracking-widest text-[#434653]">Attachments</h4>
                {proposal.detail.attachments.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {proposal.detail.attachments.map((attachment) => (
                      <button
                        key={attachment}
                        type="button"
                        className="group flex items-center gap-3 rounded-lg bg-[#eceef0] p-3 text-left transition-colors hover:bg-[#e0e3e5]"
                      >
                        <FileText className="h-4 w-4 text-[#515f74]" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-bold text-[#191c1e]">{attachment}</p>
                          <p className="text-[10px] text-[#737784]">Attachment</p>
                        </div>
                        <Download className="h-4 w-4 text-[#737784] group-hover:text-[#003c90]" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#737784]">-</p>
                )}
              </section>

              <section>
                <h4 className="mb-3 text-xs font-black uppercase tracking-widest text-[#434653]">Internal Notes</h4>
                <div className="rounded-xl bg-[#f2f4f6] p-4 text-sm leading-relaxed text-[#434653]">{proposal.notes || '-'}</div>
              </section>
            </div>

          </>
        ) : (
          <div className="p-6 text-sm text-[#737784]">Select a proposal to see details.</div>
        )}
      </div>
    </aside>
  );
};
