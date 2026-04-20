import { useState } from 'react';
import {
  SidePanelDialog,
  SidePanelDialogBody,
  SidePanelDialogFooter,
  SidePanelDialogHeader
} from '../../../../components/ui/side-panel-dialog';
import { CampaignForm } from '../forms/campaign-form';
import { useCampaignForm } from '../../hooks/use-campaign-form';
import type { CampaignPayload } from '../../types/campaign.types';
import { validateCampaignPayload } from '../../utils/campaign-validation';

interface CreateCampaignModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (payload: CampaignPayload) => Promise<void> | void;
}

export const CreateCampaignModal = ({ open, onClose, onSuccess }: CreateCampaignModalProps) => {
  const { formData, setField, errors, setErrors, noEndDate, setNoEndDate, availableChannels, resetForm } =
    useCampaignForm({});
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
    await onSuccess(payload);
    setIsSubmitting(false);
    resetForm();
    onClose();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <SidePanelDialog open={open} onOpenChange={(nextOpen) => !nextOpen && handleClose()}>
      <SidePanelDialogHeader
        title="Create Campaign"
        description="Fill campaign details and save as draft or active."
      />
      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <SidePanelDialogBody>
          <CampaignForm
            mode="create"
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
              className="rounded-lg border border-[#c3c6d5] px-4 py-2 text-sm font-semibold text-[#434653] hover:bg-[#eceef0]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-[linear-gradient(135deg,#003c90_0%,#0f52ba_100%)] px-4 py-2 text-sm font-bold text-white shadow-md shadow-[#003c90]/20 transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {isSubmitting ? 'Saving...' : 'Create Campaign'}
            </button>
          </div>
        </SidePanelDialogFooter>
      </form>
    </SidePanelDialog>
  );
};
