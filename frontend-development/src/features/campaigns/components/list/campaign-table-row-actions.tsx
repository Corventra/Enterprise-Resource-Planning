import { Eye, Pencil, Trash2 } from 'lucide-react';

interface CampaignTableRowActionsProps {
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const CampaignTableRowActions = ({
  onView,
  onEdit,
  onDelete
}: CampaignTableRowActionsProps) => {
  const baseClassName =
    'inline-flex items-center justify-center rounded-md border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-800';

  return (
    <div className="flex items-center gap-2">
      <button type="button" className={baseClassName} onClick={onView} aria-label="View campaign">
        <Eye className="h-4 w-4" />
      </button>
      <button type="button" className={baseClassName} onClick={onEdit} aria-label="Edit campaign">
        <Pencil className="h-4 w-4" />
      </button>
      <button
        type="button"
        className="inline-flex items-center justify-center rounded-md border border-red-200 bg-white p-2 text-red-600 hover:bg-red-50 hover:text-red-700"
        onClick={onDelete}
        aria-label="Delete campaign"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
};
