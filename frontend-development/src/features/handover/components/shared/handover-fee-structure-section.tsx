import type {
  HandoverBillingScheduleRow,
  HandoverPaymentMethod,
  HandoverRetainerSummary
} from '../../types/handover.types';

const feeTableWrapClass = 'overflow-hidden rounded-lg border border-[#c3c6d5]/30';
const feeTableClass = 'w-full text-left text-sm';
const feeTableHeadClass = 'bg-[#e6e8ea]';
const feeThClass = 'p-3 font-bold';
const feeTdClass = 'p-3';
const subsectionLabelClass = 'mb-3 text-xs font-bold uppercase text-[#737784]';

interface HandoverFeeStructureSectionProps {
  agreedFee: string;
  paymentMethod: HandoverPaymentMethod;
  paymentTerms: string;
  billingSchedule: HandoverBillingScheduleRow[];
  retainerSummary?: HandoverRetainerSummary | null;
}

const EmptyRow = ({ colSpan, message }: { colSpan: number; message: string }) => (
  <tr>
    <td colSpan={colSpan} className={`${feeTdClass} text-center text-[#737784]`}>
      {message}
    </td>
  </tr>
);

const terminColSpan = 6;
const retainerColSpan = 4;

export const HandoverFeeStructureSection = ({
  agreedFee,
  paymentMethod,
  paymentTerms,
  billingSchedule,
  retainerSummary
}: HandoverFeeStructureSectionProps) => (
  <div className="space-y-5">
    <div>
      <p className={subsectionLabelClass}>Fee structure</p>
      <div className="mb-4 rounded-lg border border-slate-200 bg-white px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#737784]">Agreed fee (IDR)</p>
        <p className="mt-1 text-sm font-bold text-[#004b31]">{agreedFee}</p>
      </div>
      <div className={feeTableWrapClass}>
        <table className={feeTableClass}>
          <thead className={feeTableHeadClass}>
            <tr>
              <th className={feeThClass}>{paymentMethod === 'TERMIN' ? 'Term name' : 'Period'}</th>
              {paymentMethod === 'TERMIN' ? (
                <>
                  <th className={feeThClass}>Term type</th>
                  <th className={feeThClass}>Percentage</th>
                </>
              ) : null}
              <th className={feeThClass}>Amount (IDR)</th>
              <th className={feeThClass}>Billing schedule</th>
              <th className={feeThClass}>Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eceef0]">
            {billingSchedule.length === 0 ? (
              <EmptyRow
                colSpan={paymentMethod === 'TERMIN' ? terminColSpan : retainerColSpan}
                message="Belum ada struktur fee dari engagement letter."
              />
            ) : (
              billingSchedule.map((row, index) => (
                <tr key={`${row.label}-${index}`}>
                  <td className={`${feeTdClass} font-semibold text-[#191c1e]`}>{row.label}</td>
                  {paymentMethod === 'TERMIN' ? (
                    <>
                      <td className={`${feeTdClass} text-[#434653]`}>{row.termTypeLabel ?? '-'}</td>
                      <td className={`${feeTdClass} text-[#434653]`}>{row.percentage ?? '-'}</td>
                    </>
                  ) : null}
                  <td className={`${feeTdClass} text-[#434653]`}>{row.amount}</td>
                  <td className={`${feeTdClass} text-[#434653]`}>{row.billingDate}</td>
                  <td className={`${feeTdClass} text-[#737784]`}>{row.description}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>

    <div>
      <p className={subsectionLabelClass}>Payment terms</p>
      <p className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-[#191c1e]">{paymentTerms}</p>
    </div>

    {paymentMethod === 'RETAINER' && retainerSummary ? (
      <div>
        <p className={subsectionLabelClass}>Retainer configuration</p>
        <div className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-[10px] font-bold uppercase text-[#737784]">Contract start</p>
            <p className="mt-0.5 text-sm font-semibold text-[#191c1e]">{retainerSummary.contractStartDate}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-[#737784]">Contract end</p>
            <p className="mt-0.5 text-sm font-semibold text-[#191c1e]">{retainerSummary.contractEndDate}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-[#737784]">Billing timing</p>
            <p className="mt-0.5 text-sm font-semibold text-[#191c1e]">{retainerSummary.billingTimingLabel}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-[#737784]">Estimasi per bulan</p>
            <p className="mt-0.5 text-sm font-semibold text-[#191c1e]">{retainerSummary.monthlyAmount}</p>
          </div>
        </div>
      </div>
    ) : null}
  </div>
);
