import { campaignsMock } from '../mocks/campaigns.mock';
import { formsMock } from '../mocks/forms.mock';
import { bankDataEntriesMock, submissionsMock } from '../mocks/submissions.mock';
import type {
  BankDataEntry,
  Campaign,
  CampaignPayload,
  Form,
  Submission
} from '../types/campaign.types';

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

let campaignsStore: Campaign[] = clone(campaignsMock);
let formsStore: Form[] = clone(formsMock);
let submissionsStore: Submission[] = clone(submissionsMock);
let bankDataStore: BankDataEntry[] = clone(bankDataEntriesMock);

const generateId = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;

const recalculateCampaignSubmissions = (campaignId: string) => {
  const totalSubmissions = submissionsStore.filter(
    (submission) => submission.campaignId === campaignId
  ).length;

  campaignsStore = campaignsStore.map((campaign) =>
    campaign.id === campaignId ? { ...campaign, totalSubmissions, updatedAt: new Date().toISOString() } : campaign
  );
};

export const campaignsService = {
  async getAll(): Promise<Campaign[]> {
    return clone(campaignsStore);
  },

  async getById(campaignId: string): Promise<Campaign | undefined> {
    return clone(campaignsStore.find((campaign) => campaign.id === campaignId));
  },

  async create(payload: CampaignPayload): Promise<Campaign> {
    const now = new Date().toISOString();
    const newCampaign: Campaign = {
      id: generateId('cmp'),
      ...payload,
      createdBy: 'Current User',
      totalSubmissions: 0,
      createdAt: now,
      updatedAt: now
    };

    campaignsStore = [newCampaign, ...campaignsStore];
    return clone(newCampaign);
  },

  async update(campaignId: string, payload: CampaignPayload): Promise<Campaign> {
    const target = campaignsStore.find((campaign) => campaign.id === campaignId);
    if (!target) {
      throw new Error('Campaign not found');
    }

    const updatedCampaign: Campaign = {
      ...target,
      ...payload,
      updatedAt: new Date().toISOString()
    };

    campaignsStore = campaignsStore.map((campaign) =>
      campaign.id === campaignId ? updatedCampaign : campaign
    );

    return clone(updatedCampaign);
  },

  async delete(campaignId: string): Promise<void> {
    campaignsStore = campaignsStore.filter((campaign) => campaign.id !== campaignId);
    formsStore = formsStore.filter((form) => form.campaignId !== campaignId);
    submissionsStore = submissionsStore.filter((submission) => submission.campaignId !== campaignId);
    bankDataStore = bankDataStore.filter((entry) => entry.campaignId !== campaignId);
  },

  async getFormsByCampaign(campaignId: string): Promise<Form[]> {
    return clone(formsStore.filter((form) => form.campaignId === campaignId));
  },

  async updateForm(formId: string, payload: Partial<Form>): Promise<Form> {
    const target = formsStore.find((form) => form.id === formId);
    if (!target) {
      throw new Error('Form not found');
    }

    const updatedForm: Form = {
      ...target,
      ...payload
    };

    formsStore = formsStore.map((form) => (form.id === formId ? updatedForm : form));
    return clone(updatedForm);
  },

  async deleteForm(formId: string): Promise<void> {
    const target = formsStore.find((form) => form.id === formId);
    if (!target) {
      return;
    }

    formsStore = formsStore.filter((form) => form.id !== formId);
    submissionsStore = submissionsStore.filter((submission) => submission.formId !== formId);
    recalculateCampaignSubmissions(target.campaignId);
  },

  async getBankDataEntries(campaignId: string): Promise<BankDataEntry[]> {
    return clone(bankDataStore.filter((entry) => entry.campaignId === campaignId));
  },

  async getSubmissionsByCampaign(campaignId: string): Promise<Submission[]> {
    return clone(submissionsStore.filter((submission) => submission.campaignId === campaignId));
  },

  async getSubmissionById(submissionId: string): Promise<Submission | undefined> {
    return clone(submissionsStore.find((submission) => submission.id === submissionId));
  }
};
