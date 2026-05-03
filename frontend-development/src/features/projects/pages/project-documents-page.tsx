import { FileText, FolderOpen } from 'lucide-react';
import { Link, useOutletContext } from 'react-router';
import { ROLES } from '../../../app/permissions';
import { useAuth } from '../../../app/store/auth-store';
import type { ProjectDetailOutletContext } from './project-detail-page';

const sectionClass = 'rounded-2xl bg-white p-6 shadow-sm ring-1 ring-[#eceef0]';
const sectionTitleClass = 'mb-4 text-lg font-bold text-[#003c90]';

export const ProjectDocumentsPage = () => {
  const { project, handover } = useOutletContext<ProjectDetailOutletContext>();
  const { role } = useAuth();

  const canSeeHandover =
    role === ROLES.BD || role === ROLES.CEO || role === ROLES.COO || role === ROLES.STAFF_ADMIN;

  return (
    <div className="space-y-5">
      <section className={sectionClass}>
        <h2 className={sectionTitleClass}>Source Documents</h2>
        {handover && canSeeHandover ? (
          <Link
            to={`/handover/${project.handoverId}`}
            className="flex items-center gap-4 rounded-xl border border-[#eceef0] bg-[#f2f4f6] p-4 transition-colors hover:bg-[#e6e8ea]"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#003c90]/10">
              <FileText className="h-5 w-5 text-[#003c90]" strokeWidth={2} />
            </span>
            <div className="flex-1">
              <p className="text-sm font-bold text-[#191c1e]">Handover Memo</p>
              <p className="text-xs font-medium text-[#737784]">{handover.docCode}</p>
            </div>
            <span className="text-xs font-semibold text-[#003c90]">Open →</span>
          </Link>
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-[#eceef0] bg-[#f2f4f6] px-4 py-3 text-sm text-[#737784]">
            <FileText className="h-5 w-5" />
            <span>Source dokumen handover dikelola oleh BD/CEO/COO/Staff Admin.</span>
          </div>
        )}
      </section>

      <section className={sectionClass}>
        <h2 className={sectionTitleClass}>Project Deliverables</h2>
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[#eceef0] bg-[#f9fafb] px-6 py-10 text-center">
          <span className="rounded-full bg-[#003c90]/10 p-3">
            <FolderOpen className="h-6 w-6 text-[#003c90]" strokeWidth={2} />
          </span>
          <p className="text-sm font-semibold text-[#191c1e]">Belum ada deliverable</p>
          <p className="max-w-md text-xs text-[#737784]">
            Document repository project belum di-build. Deliverable yang di-upload Consultant akan muncul
            di sini setelah Document Center diaktifkan.
          </p>
        </div>
      </section>
    </div>
  );
};
