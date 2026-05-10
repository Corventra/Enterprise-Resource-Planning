import type { Campaign } from '../../types/campaign.types';

interface DeleteCampaignConfirmDialogProps {
  open: boolean;
  campaign?: Campaign;
  onClose: () => void;
  onConfirm: (campaignId: string) => Promise<void> | void;
}

export const DeleteCampaignConfirmDialog = ({
  open,
  campaign,
  onClose,
  onConfirm
}: DeleteCampaignConfirmDialogProps) => {
  if (!open || !campaign) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-900">Archive campaign</h2>
        <p className="mt-2 text-sm text-slate-600">
          Archive <span className="font-semibold">{campaign.name}</span>? It will be marked archived and hidden from active
          lists where applicable.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={async () => {
              await onConfirm(campaign.id);
              onClose();
            }}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Archive campaign
          </button>
        </div>
      </div>
    </div>
  );
};
