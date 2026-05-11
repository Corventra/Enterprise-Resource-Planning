import { apiGet, apiPost, apiPostFormData } from '../../../services/api-client';
import type {
  PublicFormPayload,
  PublicFormSubmitAnswer,
  PublicFormSubmitResult
} from '../types/public-form.types';

interface ApiPublicFormEnvelope {
  success: boolean;
  data: PublicFormPayload;
}

interface ApiSubmitEnvelope {
  success: boolean;
  message?: string;
  data: PublicFormSubmitResult;
}

const encodeLinkCode = (linkCode: string) => encodeURIComponent(linkCode.trim());

export const getPublicFormByLinkCode = async (linkCode: string): Promise<PublicFormPayload> => {
  const res = await apiGet<ApiPublicFormEnvelope>(`/public/forms/${encodeLinkCode(linkCode)}`, {
    withAuth: false
  });
  return res.data;
};

export const submitPublicForm = async (
  linkCode: string,
  answers: PublicFormSubmitAnswer[],
  files: Record<number, File>
): Promise<PublicFormSubmitResult> => {
  const fileEntries = Object.entries(files).filter((entry): entry is [string, File] => Boolean(entry[1]));
  if (fileEntries.length > 0) {
    const formData = new FormData();
    formData.append('answers_json', JSON.stringify(answers));
    for (const [fieldId, file] of fileEntries) {
      formData.append(`file_${fieldId}`, file);
    }
    const res = await apiPostFormData<ApiSubmitEnvelope>(
      `/public/forms/${encodeLinkCode(linkCode)}/submit`,
      formData,
      { withAuth: false }
    );
    return res.data;
  }

  const res = await apiPost<ApiSubmitEnvelope>(
    `/public/forms/${encodeLinkCode(linkCode)}/submit`,
    { answers },
    { withAuth: false }
  );
  return res.data;
};
