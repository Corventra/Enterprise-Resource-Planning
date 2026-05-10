import { formsMock } from '../mocks/forms.mock';
import { bankDataEntriesMock, submissionsMock } from '../mocks/submissions.mock';
import type { BankDataEntry, Campaign, Form, Submission } from '../types/campaign.types';
import {
  archiveCampaignApi,
  createCampaignApi,
  getCampaignById,
  getCampaigns,
  updateCampaignApi
} from './campaigns-api';

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

let formsStore: Form[] = clone(formsMock);
let submissionsStore: Submission[] = clone(submissionsMock);
const bankDataStore: BankDataEntry[] = clone(bankDataEntriesMock);

export const campaignsService = {
  async getAll(): Promise<Campaign[]> {
    return getCampaigns();
  },

  async getById(campaignId: string): Promise<Campaign | undefined> {
    const c = await getCampaignById(campaignId);
    return c ?? undefined;
  },

  async create(input: {
    name: string;
    campaignTypeId: number;
    topicId: number;
    startDate: string;
    endDate: string | null;
    notes: string;
    imageFile: File | null;
  }): Promise<Campaign> {
    return createCampaignApi(input);
  },

  async update(
    campaignId: string,
    input: {
      name: string;
      campaignTypeId: number;
      topicId: number;
      startDate: string;
      endDate: string | null;
      notes: string;
      imageFile: File | null;
    }
  ): Promise<Campaign> {
    return updateCampaignApi(campaignId, input);
  },

  async archiveCampaign(campaignId: string): Promise<void> {
    await archiveCampaignApi(campaignId);
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
