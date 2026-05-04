import { Eye } from 'lucide-react';
import type { ReactNode } from 'react';
import { handoverStatusStyleMap, type HandoverItem } from '../../types/handover.types';

interface HandoverTableProps {
  items: HandoverItem[];
  onView: (item: HandoverItem) => void;
  footer?: ReactNode;
}

const thBase =
  'border-none px-4 py-3 align-middle text-[11px] font-bold uppercase tracking-wider text-[#737784] first:pl-5 last:pr-5';

export const HandoverTable = ({ items, onView, footer }: HandoverTableProps) => {
  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-[#eceef0]/80">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-none bg-[#eceef0]">
              <th className={`${thBase} text-left`}>Doc Code</th>
              <th className={`${thBase} text-left`}>Client &amp; Project</th>
              <th className={`${thBase} text-left`}>Service Line</th>
              <th className={`${thBase} text-left`}>Period</th>
              <th className={`${thBase} text-left`}>Engagement Status</th>
              <th className={`${thBase} text-left`}>Status</th>
              <th className={`${thBase} text-center`}>Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eceef0]">
            {items.map((item) => (
              <tr key={item.id} className="group transition-colors hover:bg-[#eceef0]/30">
                <td className="py-3.5 pl-5 pr-4">
                  <p className="font-mono text-xs font-bold text-[#003c90]">{item.docCode}</p>
                </td>
                <td className="px-4 py-3.5">
                  <p className="text-sm font-bold text-[#191c1e] transition-colors group-hover:text-[#003c90]">{item.client}</p>
                  <p className="mt-1 text-xs text-[#737784]">{item.project}</p>
                </td>
                <td className="px-4 py-3.5">
                  <span className="inline-flex rounded-full bg-[#d5e3fc] px-2.5 py-1 text-[10px] font-bold text-[#57657a]">
                    {item.serviceLine}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-xs font-medium text-[#434653]">{item.period}</td>
                <td className="px-4 py-3.5">
                  <p
                    className={
                      item.engagementStatus === 'Signed'
                        ? 'text-xs font-bold text-[#006544]'
                        : 'text-xs font-bold text-[#515f74]'
                    }
                  >
                    {item.engagementStatus}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#737784]">{item.engagementStatusDate}</p>
                </td>
                <td className="px-4 py-3.5">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${handoverStatusStyleMap[item.status]}`}
                  >
                    {item.status}
                  </span>
                </td>
                <td className="py-3.5 pl-4 pr-5 align-middle">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => onView(item)}
                      className="inline-flex cursor-pointer text-[#737784] transition-colors hover:text-[#003c90] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d59c1]/40"
                      aria-label="View handover"
                    >
                      <Eye className="h-4 w-4" strokeWidth={2} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {footer}
    </div>
  );
};
