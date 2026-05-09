import { Link, Mail, Phone } from 'lucide-react';
import { useLeadWorkspacePermissions } from '../hooks/use-lead-workspace-permissions';
import type { LeadWorkspace } from '../types/lead-workspace.types';

interface LeadWorkspaceCoreDetailsProps {
  workspace: LeadWorkspace;
}

const formatDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const LeadWorkspaceCoreDetails = ({ workspace }: LeadWorkspaceCoreDetailsProps) => {
  const { canManageLeadWorkspace } = useLeadWorkspacePermissions();
  return (
    <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-[#eceef0] lg:col-span-8">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-lg font-bold text-[#191c1e]">Core Lead Details</h3>
        {canManageLeadWorkspace ? (
          <button type="button" className="text-sm font-semibold text-[#003c90] hover:underline">
            Edit details
          </button>
        ) : null}
      </div>
      <div className="grid grid-cols-1 gap-y-6 gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#737784]">Client Name</p>
          <p className="font-semibold text-[#191c1e]">{workspace.companyName}</p>
        </div>
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#737784]">Industry</p>
          <p className="font-semibold text-[#191c1e]">{workspace.industry}</p>
        </div>
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#737784]">Address</p>
          <p className="font-semibold text-[#191c1e]">{workspace.address}</p>
        </div>
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#737784]">Company PIC</p>
          <p className="font-semibold text-[#191c1e]">{workspace.companyPicName}</p>
        </div>
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#737784]">PIC Phone</p>
          <div className="inline-flex items-center gap-2">
            <Phone className="h-4 w-4 text-[#434653]" />
            <span className="font-semibold text-[#191c1e]">{workspace.companyPicPhone}</span>
          </div>
        </div>
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#737784]">PIC Email</p>
          <div className="inline-flex items-center gap-2">
            <Mail className="h-4 w-4 text-[#434653]" />
            <span className="font-semibold text-[#191c1e]">{workspace.companyPicEmail}</span>
          </div>
        </div>
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#737784]">Lead Source</p>
          <div className="inline-flex items-center gap-2">
            <Link className="h-4 w-4 text-[#004b31]" />
            <span className="font-semibold text-[#191c1e]">{workspace.leadSource}</span>
          </div>
        </div>
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#737784]">Processed By</p>
          <p className="font-semibold text-[#191c1e]">{workspace.processedBy}</p>
        </div>
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#737784]">Processed At</p>
          <p className="font-semibold text-[#191c1e]">{formatDate(workspace.processedAt)}</p>
        </div>
      </div>
    </section>
  );
};
