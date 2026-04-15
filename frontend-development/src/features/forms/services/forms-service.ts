import type { FormBuilderDocument, FormBuilderField, FormSaveStatus } from '../types/form-builder.types';
import { CORE_FIELDS } from '../utils/core-fields';
import { getEffectivePublicSlug } from '../utils/form-slug';

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const nowIso = () => new Date().toISOString();

const generateId = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;

let formsStore: FormBuilderDocument[] = [
  {
    id: 'frm-builder-001',
    campaignId: 'cmp-001',
    campaignName: 'Q2 SME Acquisition Drive',
    title: 'SME Lead Qualification Form',
    description: 'Please provide your business profile for qualification.',
    successMessage: 'Thank you. Our team will contact you soon.',
    headerImageUrl: '',
    publicSlug: 'sme-lead-qualification-form',
    status: 'published',
    fields: clone(CORE_FIELDS),
    updatedAt: nowIso()
  }
];

export const formsService = {
  async getFormById(formId: string): Promise<FormBuilderDocument | undefined> {
    return clone(formsStore.find((form) => form.id === formId));
  },

  async getFormFields(formId: string): Promise<FormBuilderField[]> {
    const form = formsStore.find((item) => item.id === formId);
    return clone(form?.fields || []);
  },

  async createForm(input: {
    campaignId: string;
    campaignName?: string;
    title: string;
    description: string;
    successMessage: string;
    publicSlug?: string;
    status?: FormSaveStatus;
  }): Promise<FormBuilderDocument> {
    const form: FormBuilderDocument = {
      id: generateId('frm-builder'),
      campaignId: input.campaignId,
      campaignName: input.campaignName,
      title: input.title,
      description: input.description,
      successMessage: input.successMessage,
      headerImageUrl: '',
      publicSlug: getEffectivePublicSlug(input.title, input.publicSlug),
      status: input.status || 'draft',
      fields: clone(CORE_FIELDS),
      updatedAt: nowIso()
    };

    formsStore = [form, ...formsStore];
    return clone(form);
  },

  async updateForm(
    formId: string,
    payload: Partial<Omit<FormBuilderDocument, 'id' | 'fields'>> & { fields?: FormBuilderField[] }
  ): Promise<FormBuilderDocument> {
    const existing = formsStore.find((form) => form.id === formId);
    if (!existing) {
      throw new Error('Form not found');
    }

    const updated: FormBuilderDocument = {
      ...existing,
      ...payload,
      publicSlug: getEffectivePublicSlug(payload.title ?? existing.title, payload.publicSlug ?? existing.publicSlug),
      updatedAt: nowIso()
    };

    formsStore = formsStore.map((item) => (item.id === formId ? updated : item));
    return clone(updated);
  },

  async createFormField(formId: string, field: FormBuilderField): Promise<FormBuilderDocument> {
    const form = formsStore.find((item) => item.id === formId);
    if (!form) {
      throw new Error('Form not found');
    }

    const updatedForm: FormBuilderDocument = {
      ...form,
      fields: [...form.fields, field],
      updatedAt: nowIso()
    };

    formsStore = formsStore.map((item) => (item.id === formId ? updatedForm : item));
    return clone(updatedForm);
  },

  async deleteFormField(formId: string, fieldId: string): Promise<FormBuilderDocument> {
    const form = formsStore.find((item) => item.id === formId);
    if (!form) {
      throw new Error('Form not found');
    }

    const targetField = form.fields.find((field) => field.id === fieldId);
    if (targetField?.isCore) {
      throw new Error('Core field cannot be deleted');
    }

    const updatedForm: FormBuilderDocument = {
      ...form,
      fields: form.fields.filter((field) => field.id !== fieldId),
      updatedAt: nowIso()
    };

    formsStore = formsStore.map((item) => (item.id === formId ? updatedForm : item));
    return clone(updatedForm);
  },

  async uploadFormHeaderImage(formId: string, fileName: string): Promise<string> {
    const form = formsStore.find((item) => item.id === formId);
    if (!form) {
      throw new Error('Form not found');
    }

    const fakeUrl = `https://dummy.erp.local/form-headers/${formId}/${encodeURIComponent(fileName)}`;
    await this.updateForm(formId, { headerImageUrl: fakeUrl });
    return fakeUrl;
  },

  async deleteFormHeaderImage(formId: string): Promise<void> {
    await this.updateForm(formId, { headerImageUrl: '' });
  }
};
