import { Eye } from 'lucide-react';
import type { ReactNode } from 'react';
import { KPI_DIMENSION_LABELS, type KpiSnapshot } from '../types/kpi.types';

interface KpiConsultantsTableProps {
  rows: KpiSnapshot[];
  onView: (consultantId: string) => void;
  footer?: ReactNode;
}

const thBase =
  'border-none px-4 py-3 align-middle text-[11px] font-bold uppercase tracking-wider text-[#737784] first:pl-5 last:pr-5';

const totalToneClass = (total: number): string => {
  if (total >= 80) return 'bg-[#006544]/15 text-[#006544]';
  if (total >= 65) return 'bg-[#d5e3fc] text-[#003c90]';
  if (total >= 50) return 'bg-amber-100 text-[#a16207]';
  return 'bg-orange-100 text-[#c2410c]';
};

const dimToneClass = (capaian: number): string => {
  if (capaian >= 80) return 'text-[#006544]';
  if (capaian >= 60) return 'text-[#003c90]';
  if (capaian >= 40) return 'text-[#a16207]';
  return 'text-[#c2410c]';
};

export const KpiConsultantsTable = ({ rows, onView, footer }: KpiConsultantsTableProps) => {
  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-[#eceef0]/80">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-none bg-[#eceef0]">
              <th className={`${thBase} text-left`}>Consultant</th>
              <th className={`${thBase} text-left`}>Period</th>
              <th className={`${thBase} text-center`}>Task Completion</th>
              <th className={`${thBase} text-center`}>Timeliness</th>
              <th className={`${thBase} text-center`}>Update Compliance</th>
              <th className={`${thBase} text-center`}>Output Quality</th>
              <th className={`${thBase} text-center`}>KPI Total</th>
              <th className={`${thBase} text-center`}>Status</th>
              <th className={`${thBase} text-center`}>Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eceef0]">
            {rows.map((row) => (
              <tr key={row.consultantId} className="group transition-colors hover:bg-[#eceef0]/30">
                <td className="py-3.5 pl-5 pr-4">
                  <p className="text-sm font-bold text-[#191c1e] transition-colors group-hover:text-[#003c90]">
                    {row.consultantName}
                  </p>
                  <p className="mt-0.5 text-xs text-[#737784]">{row.consultantId}</p>
                </td>
                <td className="px-4 py-3.5">
                  <span className="inline-flex rounded-full bg-[#eceef0] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#434653]">
                    {row.period}
                  </span>
                </td>
                {(['taskCompletion', 'timeliness', 'updateCompliance', 'outputQuality'] as const).map((key) => (
                  <td key={key} className="px-4 py-3.5 text-center">
                    <p className={`text-sm font-bold ${dimToneClass(row.dimensions[key].capaian)}`}>
                      {row.dimensions[key].capaian.toFixed(1)}%
                    </p>
                    <p className="mt-0.5 text-[10px] text-[#737784]">
                      w {Math.round(row.dimensions[key].weight * 100)}%
                    </p>
                  </td>
                ))}
                <td className="px-4 py-3.5 text-center">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-sm font-bold ${totalToneClass(row.total)}`}
                  >
                    {row.total.toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-3.5 text-center">
                  {row.finalizedAt ? (
                    <span className="inline-flex rounded-full bg-[#006544]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#006544]">
                      Finalized
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#a16207]">
                      Preliminary
                    </span>
                  )}
                </td>
                <td className="py-3.5 pl-4 pr-5 text-center">
                  <button
                    type="button"
                    onClick={() => onView(row.consultantId)}
                    className="inline-flex cursor-pointer text-[#737784] transition-colors hover:text-[#003c90] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d59c1]/40"
                    aria-label={`View ${row.consultantName} KPI detail`}
                    title="View detail"
                  >
                    <Eye className="h-4 w-4" strokeWidth={2} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {footer}
      {/* Aria-live for dimension labels */}
      <span className="sr-only">
        {Object.values(KPI_DIMENSION_LABELS).join(', ')}
      </span>
    </div>
  );
};
