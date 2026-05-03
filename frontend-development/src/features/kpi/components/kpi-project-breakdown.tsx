import { Briefcase } from 'lucide-react';
import { Link } from 'react-router';
import type { ProjectKpiBreakdown } from '../types/kpi.types';

interface KpiProjectBreakdownProps {
  rows: ProjectKpiBreakdown[];
}

const thBase =
  'border-none px-4 py-3 align-middle text-[11px] font-bold uppercase tracking-wider text-[#737784] first:pl-5 last:pr-5';

const dimToneClass = (capaian: number): string => {
  if (capaian >= 80) return 'text-[#006544]';
  if (capaian >= 60) return 'text-[#003c90]';
  if (capaian >= 40) return 'text-[#a16207]';
  return 'text-[#c2410c]';
};

export const KpiProjectBreakdown = ({ rows }: KpiProjectBreakdownProps) => {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-[#eceef0] bg-[#f9fafb] px-6 py-10 text-center">
        <span className="rounded-full bg-[#eceef0] p-2">
          <Briefcase className="h-5 w-5 text-[#737784]" />
        </span>
        <p className="text-sm font-semibold text-[#191c1e]">Belum ada project</p>
        <p className="max-w-md text-xs text-[#737784]">
          Consultant ini belum memiliki task milestone yang ter-assign di project manapun.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-[#eceef0]/80">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-none bg-[#eceef0]">
              <th className={`${thBase} text-left`}>Project</th>
              <th className={`${thBase} text-center`}>Tasks</th>
              <th className={`${thBase} text-center`}>Task Completion</th>
              <th className={`${thBase} text-center`}>Timeliness</th>
              <th className={`${thBase} text-center`}>Update Compliance</th>
              <th className={`${thBase} text-center`}>Output Quality</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eceef0]">
            {rows.map((row) => (
              <tr key={row.projectId} className="group transition-colors hover:bg-[#eceef0]/30">
                <td className="py-3.5 pl-5 pr-4">
                  <Link
                    to={`/projects/${row.projectId}/timeline`}
                    className="text-sm font-bold text-[#191c1e] transition-colors hover:text-[#003c90]"
                  >
                    {row.projectCode}
                  </Link>
                  <p className="mt-0.5 text-xs text-[#737784]">{row.projectName}</p>
                </td>
                <td className="px-4 py-3.5 text-center text-sm font-bold text-[#191c1e]">{row.taskCount}</td>
                {(['taskCompletion', 'timeliness', 'updateCompliance', 'outputQuality'] as const).map((key) => (
                  <td key={key} className="px-4 py-3.5 text-center">
                    <p className={`text-sm font-bold ${dimToneClass(row.dimensions[key])}`}>
                      {row.dimensions[key].toFixed(1)}%
                    </p>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
