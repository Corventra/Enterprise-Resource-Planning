import type { CampaignFormErrors, CampaignPayload, CampaignStatus, CampaignType, Channel } from '../../types/campaign.types';
import { campaignStatusOptions, campaignTypeOptions } from '../../utils/campaign-form-options';

interface CampaignFormProps {
  value: CampaignPayload;
  onChange: <K extends keyof CampaignPayload>(key: K, value: CampaignPayload[K]) => void;
  errors: CampaignFormErrors;
  noEndDate: boolean;
  onNoEndDateChange: (value: boolean) => void;
  availableChannels: Channel[];
  mode: 'create' | 'edit';
}

const inputClassName = 'h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 focus:border-blue-500 focus:outline-none';
const labelClassName = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500';

export const CampaignForm = ({
  value,
  onChange,
  errors,
  noEndDate,
  onNoEndDateChange,
  availableChannels,
  mode
}: CampaignFormProps) => {
  return (
    <div className="space-y-4">
      <div>
        <label className={labelClassName}>Campaign Name</label>
        <input
          value={value.name}
          onChange={(event) => onChange('name', event.target.value)}
          placeholder="e.g. Q3 SME Lead Push"
          className={inputClassName}
        />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
      </div>

      <div>
        <label className={labelClassName}>Topic Tag</label>
        <input
          value={value.topic}
          onChange={(event) => onChange('topic', event.target.value)}
          placeholder="e.g. SME Financing"
          className={inputClassName}
        />
        {errors.topic && <p className="mt-1 text-xs text-red-600">{errors.topic}</p>}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div>
          <label className={labelClassName}>Campaign Type</label>
          <select
            value={value.type}
            onChange={(event) => onChange('type', event.target.value as CampaignType)}
            className={inputClassName}
          >
            {campaignTypeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {errors.type && <p className="mt-1 text-xs text-red-600">{errors.type}</p>}
        </div>

        <div>
          <label className={labelClassName}>Channel</label>
          <select
            value={value.channel}
            onChange={(event) => onChange('channel', event.target.value as Channel)}
            className={inputClassName}
          >
            {availableChannels.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {errors.channel && <p className="mt-1 text-xs text-red-600">{errors.channel}</p>}
        </div>

        <div>
          <label className={labelClassName}>Status</label>
          <select
            value={value.status}
            onChange={(event) => onChange('status', event.target.value as CampaignStatus)}
            className={inputClassName}
          >
            {campaignStatusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {errors.status && <p className="mt-1 text-xs text-red-600">{errors.status}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className={labelClassName}>Start Date</label>
          <input
            type="date"
            value={value.startDate}
            onChange={(event) => onChange('startDate', event.target.value)}
            className={inputClassName}
          />
          {errors.startDate && <p className="mt-1 text-xs text-red-600">{errors.startDate}</p>}
        </div>
        <div>
          <label className={labelClassName}>End Date</label>
          <input
            type="date"
            value={value.endDate}
            disabled={noEndDate}
            onChange={(event) => onChange('endDate', event.target.value)}
            className={`${inputClassName} disabled:bg-slate-100 disabled:text-slate-400`}
          />
          {errors.endDate && <p className="mt-1 text-xs text-red-600">{errors.endDate}</p>}
        </div>
      </div>

      <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={noEndDate}
          onChange={(event) => onNoEndDateChange(event.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
        Ongoing campaign (no end date / present)
      </label>

      <div>
        <label className={labelClassName}>Notes (Optional)</label>
        <textarea
          value={value.notes}
          onChange={(event) => onChange('notes', event.target.value)}
          rows={5}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
          placeholder={
            mode === 'create'
              ? 'Add operational notes for this campaign...'
              : 'Update operational notes for this campaign...'
          }
        />
      </div>
    </div>
  );
};
