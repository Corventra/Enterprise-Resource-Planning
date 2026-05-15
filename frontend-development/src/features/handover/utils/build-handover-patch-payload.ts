import type { HandoverDetail } from '../types/handover.types';

const nullIfDash = (v: string) => {
  const t = v.trim();
  return t === '' || t === '-' ? null : t;
};

export interface HandoverPatchExtras {
  deletedDocumentIds: number[];
  newFiles: File[];
}

export const buildHandoverPatchFormData = (form: HandoverDetail, extras: HandoverPatchExtras): FormData => {
  const projectTitle =
    form.projectTitle ??
    form.projectInformation.find((item) => item.label === 'Project Title')?.value ??
    '';
  const companyGroup = form.companyGroup ?? nullIfDash(
    form.projectInformation.find((item) => item.label === 'Company Group')?.value ?? ''
  );

  const payload = {
    project_title: nullIfDash(projectTitle),
    company_group: companyGroup,
    project_start_date: form.projectStartDate?.trim() || null,
    project_end_date: form.projectEndDate?.trim() || null,
    background_summary: nullIfDash(form.backgroundSummary),
    risk_internal_note: nullIfDash(form.confidentialNote),
    scope_included: form.scopeIncluded.map((s) => s.trim()).filter(Boolean),
    scope_excluded: form.scopeExcluded.map((s) => s.trim()).filter(Boolean),
    deliverables: form.deliverables.map((s) => s.trim()).filter(Boolean),
    milestones: form.timelineMilestones
      .map((m) => ({
        milestone_name: m.milestone.trim(),
        target_date: m.targetDateIso?.trim() || null,
        notes: nullIfDash(m.notes)
      }))
      .filter((m) => m.milestone_name.length > 0),
    outstanding_requirements: form.outstandingData.map((s) => s.trim()).filter(Boolean),
    risk_items: form.keyRisks.map((s) => s.trim()).filter(Boolean),
    internal_protocols: form.communicationProtocol.map((s) => s.trim()).filter(Boolean),
    external_protocols: form.communicationContacts
      .map((c) => ({
        role: c.role.trim(),
        name: c.name.trim(),
        contact: c.contact.trim(),
        instruction: nullIfDash(c.instruction)
      }))
      .filter((c) => c.role && c.name && c.contact),
    team_requirements: form.teamAssignments
      .map((t) => ({
        role_name: t.role.trim(),
        needed: t.name.trim(),
        responsibilities: t.responsibilities.trim(),
        notes: t.notes != null ? nullIfDash(t.notes) : null
      }))
      .filter((t) => t.role_name && t.needed && t.responsibilities),
    deleted_document_ids: extras.deletedDocumentIds
  };

  const formData = new FormData();
  formData.append('payload', JSON.stringify(payload));
  for (const file of extras.newFiles) {
    formData.append('client_documents', file);
  }
  return formData;
};
