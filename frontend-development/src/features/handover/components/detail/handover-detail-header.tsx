import { ROLES } from '../../../../app/permissions';
import { useAuth } from '../../../../app/store/auth-store';
import type { HandoverStatus } from '../../types/handover.types';

interface HandoverDetailHeaderProps {
  onBack: () => void;
  onEdit: () => void;
  /** Current handover status, drives which action button is shown. Optional for backward compat. */
  status?: HandoverStatus;
  /** Called when COO clicks "Assign PM" (only rendered when status==='Approved' and role===COO). */
  onAssignPM?: () => void;
}

const SECONDARY = 'inline-flex items-center gap-2 rounded-lg bg-[#f2f4f6] px-4 py-2.5 text-sm font-semibold text-[#191c1e] transition-colors hover:bg-[#e6e8ea]';
const PRIMARY = 'inline-flex items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#003c90_0%,#0f52ba_100%)] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-[#003c90]/20 transition-opacity hover:opacity-90';

export const HandoverDetailHeader = ({ onBack, onEdit, status, onAssignPM }: HandoverDetailHeaderProps) => {
  const { role } = useAuth();

  const isEditor = role === ROLES.BD || role === ROLES.STAFF_ADMIN;
  const isAssigner = role === ROLES.COO;

  const canEdit = !status || (isEditor && (status === 'Draft' || status === 'Revision Needed'));
  const canAssignPM = isAssigner && status === 'Approved' && Boolean(onAssignPM);

  return (
    <header className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-black">Handover Detail</h1>
        <p className="mt-1 text-sm text-[#737784]">Menampilkan memo handover proyek secara lengkap.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onBack} className={SECONDARY}>
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          Back
        </button>
        {canEdit && (
          <button type="button" onClick={onEdit} className={canAssignPM ? SECONDARY : PRIMARY}>
            <span className="material-symbols-outlined text-[20px]">edit</span>
            Edit Handover
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
