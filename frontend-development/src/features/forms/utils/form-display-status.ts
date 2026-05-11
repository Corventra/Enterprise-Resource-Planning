import type { FormBackendStatus } from '../types/form-builder.types';

export type FormDisplayBadgeTone = 'draft' | 'published' | 'paused' | 'inactive';

export interface FormDisplayBadge {
  label: string;
  tone: FormDisplayBadgeTone;
}

/**
 * Badge tab Forms / builder:
 * - Dijeda = PUBLISHED + is_accepting_responses false (bukan status DB terpisah).
 */
export function getFormDisplayBadge(
  backendStatus: FormBackendStatus,
  isAcceptingResponses?: boolean
): FormDisplayBadge {
  if (backendStatus === 'INACTIVE') {
    return { label: 'Inactive', tone: 'inactive' };
  }
  if (backendStatus === 'DRAFT') {
    return { label: 'Draft', tone: 'draft' };
  }
  if (backendStatus === 'PUBLISHED' && isAcceptingResponses === false) {
    return { label: 'Dijeda', tone: 'paused' };
  }
  return { label: 'Published', tone: 'published' };
}
