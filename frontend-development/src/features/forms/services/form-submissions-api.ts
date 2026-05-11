import { apiGet } from '../../../services/api-client';
import type { FormSubmissionDetail, FormSubmissionListItem } from '../types/form-submissions.types';

interface ApiListResponse {
  success: boolean;
  data: { submissions: FormSubmissionListItem[] };
}

interface ApiDetailResponse {
  success: boolean;
  data: FormSubmissionDetail;
}

interface ApiCampaignSubmissionsCountResponse {
  success: boolean;
  data: { total_submissions: number };
}

export const getCampaignSubmissionsCount = async (campaignId: string): Promise<number> => {
  const res = await apiGet<ApiCampaignSubmissionsCountResponse>(
    `/campaigns/${campaignId}/submissions/count`
  );
  return res.data.total_submissions;
};

export const getFormSubmissions = async (formId: string): Promise<FormSubmissionListItem[]> => {
  const res = await apiGet<ApiListResponse>(`/forms/${formId}/submissions`);
  return res.data.submissions;
};

export const getFormSubmissionDetail = async (
  formId: string,
  submissionId: string
): Promise<FormSubmissionDetail> => {
  const res = await apiGet<ApiDetailResponse>(`/forms/${formId}/submissions/${submissionId}`);
  return res.data;
};
