import { PERMISSIONS } from '../../../../app/permissions';
import { useAuth } from '../../../../app/store/auth-store';
import type { HandoverDbStatus, HandoverStatus } from '../../types/handover.types';
import { isHandoverEditableDbStatus } from '../../utils/handover-editable';

interface HandoverDetailHeaderProps {
  onEdit: () => void;
  status?: HandoverStatus;
  dbStatus?: HandoverDbStatus | string;
  isOperator?: boolean;
  onSubmit?: () => void;
  onAssignPM?: () => void;
}

const SECONDARY =
  'inline-flex items-center gap-2 rounded-lg bg-[#f2f4f6] px-4 py-2.5 text-sm font-semibold text-[#191c1e] transition-colors hover:bg-[#e6e8ea]';
const PRIMARY =
  'inline-flex items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#003c90_0%,#0f52ba_100%)] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-[#003c90]/20 transition-opacity hover:opacity-90';

export const HandoverDetailHeader = ({
  onEdit,
  status,
  dbStatus,
  isOperator = false,
  onSubmit,
  onAssignPM
}: HandoverDetailHeaderProps) => {
  const { can, canAny } = useAuth();

  const canManage = can(PERMISSIONS.HANDOVER_MANAGE);
  const canView = canAny([PERMISSIONS.HANDOVER_MANAGE, PERMISSIONS.HANDOVER_APPROVE]);

  const canEdit = canManage && isOperator && isHandoverEditableDbStatus(dbStatus);
  const canSubmit = canEdit && Boolean(onSubmit);
  const canAssignPM = canView && status === 'Approved' && Boolean(onAssignPM);

  return (
    <header className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-black">Handover Detail</h1>
        <p className="mt-1 text-sm text-[#737784]">Menampilkan memo handover proyek secara lengkap.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {canEdit && (
          <button type="button" onClick={onEdit} className={canSubmit || canAssignPM ? SECONDARY : PRIMARY}>
            <span className="material-symbols-outlined text-[20px]">edit</span>
            Edit Handover
          </button>
        )}
        {canSubmit && (
          <button type="button" onClick={onSubmit} className={PRIMARY}>
            <span className="material-symbols-outlined text-[20px]">send</span>
            Submit Handover
          </button>
        )}
        {canAssignPM && (
          <button type="button" onClick={onAssignPM} className={PRIMARY}>
            <span className="material-symbols-outlined text-[20px]">person_add</span>
            Assign PM
          </button>
        )}
      </div>
    </header>
  );
};
