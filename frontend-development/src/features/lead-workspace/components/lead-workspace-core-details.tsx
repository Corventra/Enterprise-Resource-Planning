import { Link, Mail, Phone } from 'lucide-react';
import { useLeadWorkspacePermissions } from '../hooks/use-lead-workspace-permissions';
import type { LeadWorkspaceDetail } from '../types/lead-workspace.types';

interface LeadWorkspaceCoreDetailsProps {
  workspace: LeadWorkspaceDetail;
  onEdit?: () => void;
}

const displayValue = (value: string | null | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : '-';
};

const formatDate = (iso: string | null) => {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const LeadWorkspaceCoreDetails = ({ workspace, onEdit }: LeadWorkspaceCoreDetailsProps) => {
  const { canManageLeadWorkspace } = useLeadWorkspacePermissions({
    processedByUserId: workspace.processedByUserId
  });

  return (
    <section className="relative overflow-hidden rounded-xl bg-[linear-gradient(135deg,#001f5c_0%,#003c90_45%,#1e63d6_100%)] p-6 text-white shadow-sm lg:col-span-8">
      <div className="relative z-10 mb-5 flex items-center justify-between">
        <h3 className="text-lg font-bold">Core Lead Details</h3>
        {canManageLeadWorkspace ? (
          <button
            type="button"
            onClick={onEdit}
            className="text-sm font-semibold text-white/90 transition-colors hover:text-white hover:underline"
          >
            Edit details
          </button>
        ) : null}
      </div>
      <div className="relative z-10 grid grid-cols-1 gap-y-6 gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-white/60">Company Name</p>
          <p className="font-semibold">{displayValue(workspace.companyName)}</p>
          <p className="mt-1 text-xs text-white/70">{displayValue(workspace.address)}</p>
        </div>
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-white/60">Desired Services</p>
          <p className="font-semibold">{displayValue(workspace.desiredServices)}</p>
        </div>
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-white/60">Company PIC</p>
          <p className="font-semibold">{displayValue(workspace.companyPicName)}</p>
        </div>
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-white/60">PIC Phone</p>
          <div className="inline-flex items-center gap-2">
            <Phone className="h-4 w-4 text-white/80" />
            <span className="font-semibold">{displayValue(workspace.companyPicPhone)}</span>
          </div>
        </div>
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-white/60">PIC Email</p>
          <div className="inline-flex items-center gap-2">
            <Mail className="h-4 w-4 text-white/80" />
            <span className="font-semibold">{displayValue(workspace.companyPicEmail)}</span>
          </div>
        </div>
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-white/60">Lead Source</p>
          <div className="inline-flex items-center gap-2">
            <Link className="h-4 w-4 text-white/80" />
            <span className="font-semibold">{displayValue(workspace.leadSource)}</span>
          </div>
        </div>
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-white/60">Processed By</p>
          <p className="font-semibold">{displayValue(workspace.processedBy)}</p>
        </div>
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-white/60">Processed At</p>
          <p className="font-semibold">{formatDate(workspace.processedAt)}</p>
        </div>
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-white/60">Updated At</p>
          <p className="font-semibold">{formatDate(workspace.updatedAt)}</p>
        </div>
      </div>
      <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-white/5 blur-3xl" />
      <div className="absolute -left-5 top-1/2 h-24 w-24 rounded-full bg-white/5 blur-2xl" />
    </section>
  );
};
