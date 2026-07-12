import { useEffect, useState } from 'react';
import {
  SidePanelDialog,
  SidePanelDialogBody,
  SidePanelDialogFooter,
  SidePanelDialogHeader
} from '../../../../components/ui/side-panel-dialog';
import { ApiError } from '../../../../services/api-client';
import { CampaignForm } from '../forms/campaign-form';
import { useCampaignForm } from '../../hooks/use-campaign-form';
import type { Campaign, CampaignLookupTopic, CampaignLookupType, CampaignSubmitInput } from '../../types/campaign.types';
import { validateCampaignFormValues } from '../../utils/campaign-validation';

interface EditCampaignModalProps {
  open: boolean;
  campaign?: Campaign;
  typeOptions: CampaignLookupType[];
  topicOptions: CampaignLookupTopic[];
  onClose: () => void;
  onSuccess: (campaignId: string, input: CampaignSubmitInput) => Promise<void> | void;
}

export const EditCampaignModal = ({
  open,
  campaign,
  typeOptions,
  topicOptions,
  onClose,
  onSuccess
}: EditCampaignModalProps) => {
  const { formData, setField, errors, setErrors, noEndDate, setNoEndDate, resetForm } = useCampaignForm({
    initialCampaign: campaign
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (open && campaign?.id) {
      setImageFile(null);
      setSubmitError(null);
    }
  }, [open, campaign?.id]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    const validationErrors = validateCampaignFormValues({
      values: formData,
      noEndDate,
      disallowPastStartDate: true
    });
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (!campaign) {
      return;
    }

    const input: CampaignSubmitInput = {
      values: formData,
      noEndDate,
      imageFile
    };

    setIsSubmitting(true);
    try {
      await onSuccess(campaign.id, input);
      resetForm();
      setImageFile(null);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Failed to update campaign.';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    setImageFile(null);
    setSubmitError(null);
    onClose();
  };

  if (!campaign) {
    return null;
  }

  return (
    <SidePanelDialog open={open} onOpenChange={(nextOpen) => !nextOpen && handleClose()}>
      <SidePanelDialogHeader title="Edit Campaign" description="Update campaign data and timeline." />
      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <SidePanelDialogBody>
          {submitError ? (
            <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{submitError}</p>
          ) : null}
          <CampaignForm
            mode="edit"
            value={formData}
            onChange={setField}
            errors={errors}
            noEndDate={noEndDate}
            onNoEndDateChange={setNoEndDate}
            typeOptions={typeOptions}
            topicOptions={topicOptions}
            imageFile={imageFile}
            onImageChange={setImageFile}
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
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </SidePanelDialogFooter>
      </form>
    </SidePanelDialog>
  );
};
