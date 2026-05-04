import { Eye, UserPlus, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { projectStatusStyleMap, type Project } from '../../types/project.types';

interface ProjectTableProps {
  items: Project[];
  onView: (item: Project) => void;
  footer?: ReactNode;
}

const thBase =
  'border-none px-4 py-3 align-middle text-[11px] font-bold uppercase tracking-wider text-[#737784] first:pl-5 last:pr-5';

const formatPeriod = (start: string, end: string) => {
  const fmt = (iso: string) => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };
  return `${fmt(start)} – ${fmt(end)}`;
};

export const ProjectTable = ({ items, onView, footer }: ProjectTableProps) => {
  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-[#eceef0]/80">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-none bg-[#eceef0]">
              <th className={`${thBase} text-left`}>Project Code</th>
              <th className={`${thBase} text-left`}>Client &amp; Project</th>
              <th className={`${thBase} text-left`}>Service Line</th>
              <th className={`${thBase} text-left`}>PM</th>
              <th className={`${thBase} text-left`}>Consultants</th>
              <th className={`${thBase} text-left`}>Period</th>
              <th className={`${thBase} text-left`}>Status</th>
              <th className={`${thBase} text-center`}>Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eceef0]">
            {items.map((item) => (
              <tr key={item.id} className="group transition-colors hover:bg-[#eceef0]/30">
                <td className="py-3.5 pl-5 pr-4">
                  <p className="font-mono text-xs font-bold text-[#003c90]">{item.projectCode}</p>
                </td>
                <td className="px-4 py-3.5">
                  <p className="text-sm font-bold text-[#191c1e] transition-colors group-hover:text-[#003c90]">
                    {item.client}
                  </p>
                  <p className="mt-1 text-xs text-[#737784]">{item.projectName}</p>
                </td>
                <td className="px-4 py-3.5">
                  <span className="inline-flex rounded-full bg-[#d5e3fc] px-2.5 py-1 text-[10px] font-bold text-[#57657a]">
                    {item.serviceLine}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  {item.pm ? (
                    <p className="text-xs font-semibold text-[#191c1e]">{item.pm.name}</p>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-[#a16207]">
                      <UserPlus className="h-3 w-3" />
                      Unassigned
                    </span>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  {item.consultants.length === 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-[#a16207]">
                      <UserPlus className="h-3 w-3" />
                      Awaiting
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#434653]">
                      <Users className="h-3.5 w-3.5 text-[#737784]" />
                      {item.consultants.length}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-xs font-medium text-[#434653]">
                  {formatPeriod(item.startDate, item.endDate)}
                </td>
                <td className="px-4 py-3.5">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${projectStatusStyleMap[item.status]}`}
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
                      aria-label="View project"
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
