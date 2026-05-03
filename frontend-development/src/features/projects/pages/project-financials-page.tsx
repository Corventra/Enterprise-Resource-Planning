import { Lock } from 'lucide-react';
import { useOutletContext } from 'react-router';
import { PERMISSIONS } from '../../../app/permissions';
import { RoleGate } from '../../../components/shared/access/role-gate';
import type { ProjectDetailOutletContext } from './project-detail-page';

const sectionClass = 'rounded-2xl bg-white p-6 shadow-sm ring-1 ring-[#eceef0]';
const sectionTitleClass = 'mb-4 text-lg font-bold text-[#003c90]';
const labelClass = 'text-xs font-bold uppercase tracking-wider text-[#737784]';

const lockedFallback = (
  <div className="flex items-center gap-3 rounded-xl border border-[#eceef0] bg-[#f2f4f6] px-4 py-4 text-sm text-[#737784]">
    <Lock className="h-5 w-5" />
    <span>Anda tidak memiliki akses untuk melihat data financial project.</span>
  </div>
);

export const ProjectFinancialsPage = () => {
  const { handover } = useOutletContext<ProjectDetailOutletContext>();

  return (
    <RoleGate permissions={[PERMISSIONS.PROJECT_VIEW_FINANCIALS]} fallback={lockedFallback}>
      {!handover ? (
        <div className="rounded-xl border border-[#eceef0] bg-white p-4 text-sm text-[#737784] shadow-sm">
          Data financial belum tersedia — handover memo belum ter-link.
        </div>
      ) : (
        <div className="space-y-5">
          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>Fee Structure</h2>
            <div className="overflow-hidden rounded-xl border border-[#eceef0]">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-[#eceef0]">
                    <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-[#737784]">
                      Item
                    </th>
                    <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-[#737784]">
                      Amount
                    </th>
                    <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-[#737784]">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eceef0] bg-white">
                  {handover.feeItems.map((fee) => (
                    <tr key={fee.item}>
                      <td className="px-4 py-3 text-sm font-semibold text-[#191c1e]">{fee.item}</td>
                      <td className="px-4 py-3 text-sm font-bold text-[#003c90]">{fee.amount}</td>
                      <td className="px-4 py-3 text-xs text-[#434653]">{fee.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>Payment Terms</h2>
            <p className={labelClass}>Terms</p>
            <p className="mt-1 text-sm font-semibold leading-relaxed text-[#191c1e]">
              {handover.paymentTerms}
            </p>
          </section>
        </div>
      )}
    </RoleGate>
  );
};
