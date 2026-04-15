import { useState } from 'react';
import {
  SidePanelDialog,
  SidePanelDialogBody,
  SidePanelDialogFooter,
  SidePanelDialogHeader
} from '../../../../components/ui/side-panel-dialog';
import { CampaignForm } from '../forms/campaign-form';
import { useCampaignForm } from '../../hooks/use-campaign-form';
import type { Campaign, CampaignPayload } from '../../types/campaign.types';
import { validateCampaignPayload } from '../../utils/campaign-validation';

interface EditCampaignModalProps {
  open: boolean;
  campaign?: Campaign;
  onClose: () => void;
  onSuccess: (campaignId: string, payload: CampaignPayload) => Promise<void> | void;
}

export const EditCampaignModal = ({ open, campaign, onClose, onSuccess }: EditCampaignModalProps) => {
  const { formData, setField, errors, setErrors, noEndDate, setNoEndDate, availableChannels, resetForm } =
    useCampaignForm({ initialCampaign: campaign });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationErrors = validateCampaignPayload({ payload: formData, noEndDate });
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const payload: CampaignPayload = {
      ...formData,
      endDate: noEndDate ? '' : formData.endDate
    };

    setIsSubmitting(true);
    await onSuccess(campaign.id, payload);
    setIsSubmitting(false);
    resetForm();
    onClose();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!campaign) {
    return null;
  }

  return (
    <SidePanelDialog open={open} onOpenChange={(nextOpen) => !nextOpen && handleClose()}>
      <SidePanelDialogHeader
        title="Edit Campaign"
        description="Update campaign data and keep timeline accurate."
      />
      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <SidePanelDialogBody>
          <CampaignForm
            mode="edit"
            value={formData}
            onChange={setField}
            errors={errors}
            noEndDate={noEndDate}
            onNoEndDateChange={setNoEndDate}
            availableChannels={availableChannels}
          />
        </SidePanelDialogBody>

        <SidePanelDialogFooter>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </SidePanelDialogFooter>
      </form>
    </SidePanelDialog>
  );
};
