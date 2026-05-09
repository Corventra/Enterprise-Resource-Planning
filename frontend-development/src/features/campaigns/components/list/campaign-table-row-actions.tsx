import { Eye, Pencil, Trash2 } from 'lucide-react';

interface CampaignTableRowActionsProps {
  canManageCampaigns: boolean;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const CampaignTableRowActions = ({
  canManageCampaigns,
  onView,
  onEdit,
  onDelete
}: CampaignTableRowActionsProps) => {
  const iconBtn =
    'inline-flex text-[#737784] transition-colors hover:text-[#003c90] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d59c1]/40';

  return (
    <div className="flex items-center justify-center gap-2">
      <button type="button" className={iconBtn} onClick={onView} aria-label="View campaign">
        <Eye className="h-4 w-4" strokeWidth={2} />
      </button>
      {canManageCampaigns ? (
        <>
          <button type="button" className={iconBtn} onClick={onEdit} aria-label="Edit campaign">
            <Pencil className="h-4 w-4" strokeWidth={2} />
          </button>
          <button
            type="button"
            className="inline-flex text-[#737784] transition-colors hover:text-[#ba1a1a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-200"
            onClick={onDelete}
            aria-label="Delete campaign"
          >
            <Trash2 className="h-4 w-4" strokeWidth={2} />
          </button>
        </>
      ) : null}
    </div>
  );
};
