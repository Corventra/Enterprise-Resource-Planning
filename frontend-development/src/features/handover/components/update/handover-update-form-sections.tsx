import {
  leadCoreInputClassName,
  leadCoreTextareaClassName
} from '../../../lead-tracker/components/forms/lead-core-form-field';
import type { HandoverContact, HandoverDetail } from '../../types/handover.types';
import {
  getLocalTodayIsoDate,
  type HandoverSubmitErrors
} from '../../utils/handover-submit-validation';
import { HandoverFeeStructureSection } from '../shared/handover-fee-structure-section';
import { HandoverClientDocumentsField } from './handover-client-documents-field';

interface HandoverUpdateFormSectionsProps {
  form: HandoverDetail;
  onChange: (next: HandoverDetail) => void;
  onDeleteDocument: (documentId: number) => void;
  submitErrors?: HandoverSubmitErrors;
  showSubmitErrors?: boolean;
}

const HandoverFieldError = ({ message, show }: { message?: string; show: boolean }) =>
  show && message ? <p className="mt-1 text-xs font-medium text-red-600">{message}</p> : null;

const HandoverRemoveRowButton = ({
  onClick,
  label,
  visible
}: {
  onClick: () => void;
  label: string;
  visible: boolean;
}) =>
  visible ? (
    <button type="button" onClick={onClick} className="text-[#ba1a1a]" aria-label={label}>
      <span className="material-symbols-outlined">delete</span>
    </button>
  ) : (
    <span className="inline-block w-6 shrink-0" aria-hidden />
  );

const cardClass = 'mb-8 rounded-xl bg-white p-8 shadow-sm';
const readOnlyBoxClass = 'rounded bg-[#f2f4f6] px-4 py-3 text-sm font-medium text-[#191c1e]';
const scopeListInputClassName = `${leadCoreInputClassName} bg-white`;
const scopeListBlockClassName =
  'space-y-2 rounded-lg border border-slate-200 border-l-4 border-l-[#003c90] bg-white p-4';
const sectionTitleClass = 'mb-6 flex items-center gap-2 text-lg font-bold uppercase tracking-wider text-[#003c90]';
const labelClass = 'text-xs font-bold uppercase text-[#737784]';

const READ_ONLY_LABELS = new Set([
  'Client Name',
  'Service Line',
  'PIC Client',
  'Client Contact',
  'Engagement Status',
  'EL Reference',
  'Proposal Reference',
  'Created By'
]);

const HANDOVER_UPDATE_PLACEHOLDERS = {
  projectTitle: 'e.g. Tax Compliance FY 2025',
  companyGroup: 'e.g. ABC Holdings Group',
  projectStartDate: 'Select start date',
  projectEndDate: 'Select end date',
  backgroundSummary: 'e.g. Client background, engagement context, and key expectations from BD...',
  scopeIncluded: 'e.g. Annual corporate tax return preparation',
  scopeExcluded: 'e.g. External audit by third party',
  deliverables: 'e.g. Final tax report (PDF)',
  milestone: 'e.g. Kick-off meeting',
  milestoneTargetDate: 'Select target date',
  milestoneNotes: 'e.g. Client confirms scope and timeline',
  outstandingData: 'e.g. Q4 trial balance not yet received from client',
  keyRisk: 'e.g. Tight deadline vs client data availability',
  confidentialNote: 'e.g. Internal-only notes (not shared with client)',
  communicationProtocol: 'e.g. Weekly internal sync via Teams, Mondays 09:00',
  contactRole: 'e.g. CFO',
  contactName: 'e.g. Budi Santoso',
  contactInfo: 'e.g. budi@company.com / +62 812-0000-0000',
  contactInstruction: 'e.g. CC on weekly status updates',
  teamRole: 'e.g. Partner / Manager',
  teamName: 'e.g. Jane Doe',
  teamResponsibilities: 'e.g. Report review and client coordination'
} as const;

export const HandoverUpdateFormSections = ({
  form,
  onChange,
  onDeleteDocument,
  submitErrors = {},
  showSubmitErrors = false
}: HandoverUpdateFormSectionsProps) => {
  const showErr = showSubmitErrors;
  const todayIso = getLocalTodayIsoDate();
  const projectEndDateMin = form.projectStartDate || todayIso;
  const updateField = <K extends keyof HandoverDetail>(key: K, value: HandoverDetail[K]) => {
    onChange({ ...form, [key]: value });
  };

  const addStringItem = (
    key: 'scopeIncluded' | 'scopeExcluded' | 'deliverables' | 'outstandingData' | 'keyRisks' | 'communicationProtocol'
  ) => {
    onChange({ ...form, [key]: [...form[key], ''] });
  };

  const removeStringItem = (
    key: 'scopeIncluded' | 'scopeExcluded' | 'deliverables' | 'outstandingData' | 'keyRisks' | 'communicationProtocol',
    index: number
  ) => {
    if (form[key].length <= 1) return;
    const next = [...form[key]];
    next.splice(index, 1);
    onChange({ ...form, [key]: next });
  };

  const canRemoveStringItem = (
    key: 'scopeIncluded' | 'scopeExcluded' | 'deliverables' | 'outstandingData' | 'keyRisks' | 'communicationProtocol'
  ) => form[key].length > 1;

  const addExternalContact = () => {
    onChange({
      ...form,
      communicationContacts: [...form.communicationContacts, { role: '', name: '', contact: '', instruction: '' }]
    });
  };

  const updateExternalContact = (index: number, patch: Partial<HandoverContact>) => {
    const next = [...form.communicationContacts];
    next[index] = { ...next[index], ...patch };
    onChange({ ...form, communicationContacts: next });
  };

  const removeExternalContact = (index: number) => {
    if (form.communicationContacts.length <= 1) return;
    const next = [...form.communicationContacts];
    next.splice(index, 1);
    onChange({ ...form, communicationContacts: next });
  };

  const addMilestoneRow = () => {
    onChange({
      ...form,
      timelineMilestones: [
        ...form.timelineMilestones,
        { milestone: '', targetDate: '', targetDateIso: '', notes: '' }
      ]
    });
  };

  const removeMilestoneRow = (index: number) => {
    if (form.timelineMilestones.length <= 1) return;
    const next = [...form.timelineMilestones];
    next.splice(index, 1);
    onChange({ ...form, timelineMilestones: next });
  };

  const addClientDocuments = (files: File[]) => {
    if (!files.length) return;
    const additions = files.map((file, index) => ({
      id: `pending-${Date.now()}-${index}-${file.name}`,
      name: file.name,
      filePath: '',
      downloadUrl: null,
      uploadedAt: '-',
      pendingFile: file
    }));
    onChange({ ...form, clientDocuments: [...form.clientDocuments, ...additions] });
  };

  const removeClientDocument = (index: number) => {
    const doc = form.clientDocuments[index];
    if (doc && !doc.pendingFile && /^\d+$/.test(doc.id)) {
      onDeleteDocument(Number(doc.id));
    }
    const next = [...form.clientDocuments];
    next.splice(index, 1);
    onChange({ ...form, clientDocuments: next });
  };

  return (
    <div className="md:col-span-10">
      <section id="project-info" className={`${cardClass} scroll-mt-24`}>
        <h3 className={sectionTitleClass}>
          <span className="material-symbols-outlined">info</span>1. Project Information
        </h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-1">
            <label className={labelClass}>Project Title</label>
            <input
              className={leadCoreInputClassName}
              placeholder={HANDOVER_UPDATE_PLACEHOLDERS.projectTitle}
              value={form.projectTitle ?? ''}
              onChange={(event) => updateField('projectTitle', event.target.value)}
            />
            <HandoverFieldError message={submitErrors.projectTitle} show={showErr} />
          </div>
          <div className="space-y-1">
            <label className={labelClass}>Company Group</label>
            <input
              className={leadCoreInputClassName}
              placeholder={HANDOVER_UPDATE_PLACEHOLDERS.companyGroup}
              value={form.companyGroup ?? ''}
              onChange={(event) => updateField('companyGroup', event.target.value)}
            />
            <HandoverFieldError message={submitErrors.companyGroup} show={showErr} />
          </div>
          <div className="space-y-1">
            <label className={labelClass}>Project Start Date</label>
            <input
              type="date"
              className={leadCoreInputClassName}
              placeholder={HANDOVER_UPDATE_PLACEHOLDERS.projectStartDate}
              value={form.projectStartDate ?? ''}
              min={todayIso}
              onChange={(event) => updateField('projectStartDate', event.target.value)}
            />
            <HandoverFieldError message={submitErrors.projectStartDate} show={showErr} />
          </div>
          <div className="space-y-1">
            <label className={labelClass}>Project End Date</label>
            <input
              type="date"
              className={leadCoreInputClassName}
              placeholder={HANDOVER_UPDATE_PLACEHOLDERS.projectEndDate}
              value={form.projectEndDate ?? ''}
              min={projectEndDateMin}
              onChange={(event) => updateField('projectEndDate', event.target.value)}
            />
            <HandoverFieldError message={submitErrors.projectEndDate} show={showErr} />
          </div>
          {form.projectInformation
            .filter((item) => READ_ONLY_LABELS.has(item.label))
            .map((item) => (
              <div key={item.label} className="space-y-1">
                <label className={labelClass}>{item.label}</label>
                <p className={readOnlyBoxClass}>{item.value}</p>
              </div>
            ))}
        </div>
      </section>

      <section id="background" className={`${cardClass} scroll-mt-24`}>
        <h3 className={sectionTitleClass}>
          <span className="material-symbols-outlined">article</span>2. Background Summary
        </h3>
        <div className="space-y-1">
          <label className={labelClass}>Summary Narrative</label>
          <textarea
            className={leadCoreTextareaClassName}
            rows={5}
            placeholder={HANDOVER_UPDATE_PLACEHOLDERS.backgroundSummary}
            value={form.backgroundSummary}
            onChange={(event) => updateField('backgroundSummary', event.target.value)}
          />
          <HandoverFieldError message={submitErrors.backgroundSummary} show={showErr} />
        </div>
      </section>

      <section id="scope" className={`${cardClass} scroll-mt-24`}>
        <h3 className={sectionTitleClass}>
          <span className="material-symbols-outlined">view_agenda</span>3. Finalized Scope of Work
        </h3>
        <div className="space-y-4">
          <div className={scopeListBlockClassName}>
            <p className="text-xs font-bold uppercase text-[#003c90]">3.1 Scope Included</p>
            <HandoverFieldError message={submitErrors.scopeIncluded} show={showErr} />
            {form.scopeIncluded.map((item, index) => (
              <div key={`inc-${index}`} className="flex items-center gap-2">
                <input
                  className={scopeListInputClassName}
                  placeholder={HANDOVER_UPDATE_PLACEHOLDERS.scopeIncluded}
                  value={item}
                  onChange={(event) => {
                    const next = [...form.scopeIncluded];
                    next[index] = event.target.value;
                    onChange({ ...form, scopeIncluded: next });
                  }}
                />
                <HandoverRemoveRowButton
                  visible={canRemoveStringItem('scopeIncluded')}
                  onClick={() => removeStringItem('scopeIncluded', index)}
                  label="Remove scope included"
                />
              </div>
            ))}
            <button type="button" onClick={() => addStringItem('scopeIncluded')} className="flex items-center gap-1 text-sm font-bold text-[#003c90]">
              <span className="material-symbols-outlined text-base">add_circle</span> Add Item
            </button>
          </div>
          <div className={scopeListBlockClassName}>
            <p className="text-xs font-bold uppercase text-[#003c90]">3.2 Exclusions</p>
            <HandoverFieldError message={submitErrors.scopeExcluded} show={showErr} />
            {form.scopeExcluded.map((item, index) => (
              <div key={`exc-${index}`} className="flex items-center gap-2">
                <input
                  className={scopeListInputClassName}
                  placeholder={HANDOVER_UPDATE_PLACEHOLDERS.scopeExcluded}
                  value={item}
                  onChange={(event) => {
                    const next = [...form.scopeExcluded];
                    next[index] = event.target.value;
                    onChange({ ...form, scopeExcluded: next });
                  }}
                />
                <HandoverRemoveRowButton
                  visible={canRemoveStringItem('scopeExcluded')}
                  onClick={() => removeStringItem('scopeExcluded', index)}
                  label="Remove scope exclusion"
                />
              </div>
            ))}
            <button type="button" onClick={() => addStringItem('scopeExcluded')} className="flex items-center gap-1 text-sm font-bold text-[#003c90]">
              <span className="material-symbols-outlined text-base">add_circle</span> Add Item
            </button>
          </div>
          <div className={scopeListBlockClassName}>
            <p className="text-xs font-bold uppercase text-[#003c90]">3.3 Deliverables</p>
            <HandoverFieldError message={submitErrors.deliverables} show={showErr} />
            {form.deliverables.map((item, index) => (
              <div key={`del-${index}`} className="flex items-center gap-2">
                <input
                  className={scopeListInputClassName}
                  placeholder={HANDOVER_UPDATE_PLACEHOLDERS.deliverables}
                  value={item}
                  onChange={(event) => {
                    const next = [...form.deliverables];
                    next[index] = event.target.value;
                    onChange({ ...form, deliverables: next });
                  }}
                />
                <HandoverRemoveRowButton
                  visible={canRemoveStringItem('deliverables')}
                  onClick={() => removeStringItem('deliverables', index)}
                  label="Remove deliverable"
                />
              </div>
            ))}
            <button type="button" onClick={() => addStringItem('deliverables')} className="flex items-center gap-1 text-sm font-bold text-[#003c90]">
              <span className="material-symbols-outlined text-base">add_circle</span> Add Item
            </button>
          </div>
          <div className="space-y-2">
            <p className={labelClass}>3.4 Milestone Breakdown</p>
            <HandoverFieldError message={submitErrors.timelineMilestones} show={showErr} />
            <div className="overflow-hidden rounded-lg border border-[#c3c6d5]/30">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#e6e8ea]">
                  <tr>
                    <th className="p-3 font-bold">Milestone</th>
                    <th className="p-3 font-bold">Target Date</th>
                    <th className="p-3 font-bold">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eceef0]">
            {form.timelineMilestones.map((item, index) => (
              <tr key={`milestone-${index}`}>
                <td className="p-3">
                <input
                  className={leadCoreInputClassName}
                  placeholder={HANDOVER_UPDATE_PLACEHOLDERS.milestone}
                  value={item.milestone}
                  onChange={(event) => {
                    const next = [...form.timelineMilestones];
                    next[index] = { ...next[index], milestone: event.target.value };
                    onChange({ ...form, timelineMilestones: next });
                  }}
                />
                      </td>
                      <td className="p-3">
                        <input
                          type="date"
                          className={leadCoreInputClassName}
                          placeholder={HANDOVER_UPDATE_PLACEHOLDERS.milestoneTargetDate}
                  value={item.targetDateIso ?? ''}
                  min={todayIso}
                  onChange={(event) => {
                    const next = [...form.timelineMilestones];
                    next[index] = { ...next[index], targetDateIso: event.target.value, targetDate: event.target.value };
                    onChange({ ...form, timelineMilestones: next });
                  }}
                        />
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <input
                            className={leadCoreInputClassName}
                            placeholder={HANDOVER_UPDATE_PLACEHOLDERS.milestoneNotes}
                    value={item.notes}
                    onChange={(event) => {
                      const next = [...form.timelineMilestones];
                      next[index] = { ...next[index], notes: event.target.value };
                      onChange({ ...form, timelineMilestones: next });
                    }}
                  />
                  <HandoverRemoveRowButton
                    visible={form.timelineMilestones.length > 1}
                    onClick={() => removeMilestoneRow(index)}
                    label="Remove milestone row"
                  />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              onClick={addMilestoneRow}
              className="mt-4 flex items-center gap-1 text-sm font-bold text-[#003c90]"
            >
              <span className="material-symbols-outlined text-base">add_circle</span> Add Milestone
            </button>
          </div>
        </div>
      </section>

      <section id="fees" className={`${cardClass} scroll-mt-24`}>
        <h3 className={sectionTitleClass}>
          <span className="material-symbols-outlined">payments</span>4. Fee Structure &amp; Payment Terms
        </h3>
        <HandoverFeeStructureSection
          agreedFee={form.agreedFee}
          paymentMethod={form.paymentMethod}
          paymentTerms={form.paymentTerms}
          billingSchedule={form.billingSchedule}
          retainerSummary={form.retainerSummary}
        />
      </section>

      <section id="docs" className={`${cardClass} scroll-mt-24`}>
        <h3 className={sectionTitleClass}>
          <span className="material-symbols-outlined">folder_shared</span>5. Client-Provided Documents
        </h3>
        <HandoverClientDocumentsField
          documents={form.clientDocuments}
          onAddFiles={addClientDocuments}
          onRemove={removeClientDocument}
        />
      </section>

      <section id="outstanding-data" className={`${cardClass} scroll-mt-24`}>
        <h3 className={sectionTitleClass}>
          <span className="material-symbols-outlined">pending</span>6. Outstanding Data
        </h3>
        <div className={scopeListBlockClassName}>
          {form.outstandingData.map((item, index) => (
            <div key={`out-${index}`} className="flex items-center gap-2">
              <input
                className={scopeListInputClassName}
                placeholder={HANDOVER_UPDATE_PLACEHOLDERS.outstandingData}
                value={item}
                onChange={(event) => {
                  const next = [...form.outstandingData];
                  next[index] = event.target.value;
                  onChange({ ...form, outstandingData: next });
                }}
              />
              <HandoverRemoveRowButton
                visible={canRemoveStringItem('outstandingData')}
                onClick={() => removeStringItem('outstandingData', index)}
                label="Remove outstanding data item"
              />
            </div>
          ))}
          <button type="button" onClick={() => addStringItem('outstandingData')} className="flex items-center gap-1 text-sm font-bold text-[#003c90]">
            <span className="material-symbols-outlined text-base">add_circle</span> Add Item
          </button>
        </div>
      </section>

      <section id="risks" className={`${cardClass} scroll-mt-24`}>
        <h3 className={sectionTitleClass}>
          <span className="material-symbols-outlined">gpp_maybe</span>7. Key Risks / Red Flags
        </h3>
        <div className={scopeListBlockClassName}>
          <HandoverFieldError message={submitErrors.keyRisks} show={showErr} />
          {form.keyRisks.map((item, index) => (
            <div key={`risk-${index}`} className="flex items-center gap-2">
              <input
                className={scopeListInputClassName}
                placeholder={HANDOVER_UPDATE_PLACEHOLDERS.keyRisk}
                value={item}
                onChange={(event) => {
                  const next = [...form.keyRisks];
                  next[index] = event.target.value;
                  onChange({ ...form, keyRisks: next });
                }}
              />
              <HandoverRemoveRowButton
                visible={canRemoveStringItem('keyRisks')}
                onClick={() => removeStringItem('keyRisks', index)}
                label="Remove key risk"
              />
            </div>
          ))}
          <button type="button" onClick={() => addStringItem('keyRisks')} className="flex items-center gap-1 text-sm font-bold text-[#003c90]">
            <span className="material-symbols-outlined text-base">add_circle</span> Add Item
          </button>
        </div>
        <div className="mt-4 space-y-1">
          <label className={labelClass}>Internal Confidential Note</label>
          <textarea
            className={leadCoreTextareaClassName}
            rows={3}
            placeholder={HANDOVER_UPDATE_PLACEHOLDERS.confidentialNote}
            value={form.confidentialNote}
            onChange={(event) => updateField('confidentialNote', event.target.value)}
          />
        </div>
      </section>

      <section id="communication" className={`${cardClass} scroll-mt-24`}>
        <h3 className={sectionTitleClass}>
          <span className="material-symbols-outlined">connect_without_contact</span>8. Communication Protocol
        </h3>
        <div className={scopeListBlockClassName}>
          <p className="text-xs font-bold uppercase text-[#003c90]">Internal</p>
          <HandoverFieldError message={submitErrors.communicationProtocol} show={showErr} />
          {form.communicationProtocol.map((item, index) => (
            <div key={`com-${index}`} className="flex items-center gap-2">
              <input
                className={scopeListInputClassName}
                placeholder={HANDOVER_UPDATE_PLACEHOLDERS.communicationProtocol}
                value={item}
                onChange={(event) => {
                  const next = [...form.communicationProtocol];
                  next[index] = event.target.value;
                  onChange({ ...form, communicationProtocol: next });
                }}
              />
              <HandoverRemoveRowButton
                visible={canRemoveStringItem('communicationProtocol')}
                onClick={() => removeStringItem('communicationProtocol', index)}
                label="Remove internal protocol item"
              />
            </div>
          ))}
          <button type="button" onClick={() => addStringItem('communicationProtocol')} className="flex items-center gap-1 text-sm font-bold text-[#003c90]">
            <span className="material-symbols-outlined text-base">add_circle</span> Add Item
          </button>
        </div>

        <p className="mb-3 mt-6 text-xs font-bold uppercase text-[#737784]">External</p>
        <HandoverFieldError message={submitErrors.communicationContacts} show={showErr} />
        <div className="overflow-hidden rounded-lg border border-[#c3c6d5]/30">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#e6e8ea]">
              <tr>
                <th className="p-3 font-bold">Role</th>
                <th className="p-3 font-bold">Name</th>
                <th className="p-3 font-bold">Contact</th>
                <th className="p-3 font-bold">Instruction</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eceef0]">
              {form.communicationContacts.map((contact, index) => (
                <tr key={`ext-${index}`}>
                  <td className="p-3">
                    <input
                      className={leadCoreInputClassName}
                      placeholder={HANDOVER_UPDATE_PLACEHOLDERS.contactRole}
                      value={contact.role}
                      onChange={(event) => updateExternalContact(index, { role: event.target.value })}
                    />
                  </td>
                  <td className="p-3">
                    <input
                      className={leadCoreInputClassName}
                      placeholder={HANDOVER_UPDATE_PLACEHOLDERS.contactName}
                      value={contact.name}
                      onChange={(event) => updateExternalContact(index, { name: event.target.value })}
                    />
                  </td>
                  <td className="p-3">
                    <input
                      className={leadCoreInputClassName}
                      placeholder={HANDOVER_UPDATE_PLACEHOLDERS.contactInfo}
                      value={contact.contact}
                      onChange={(event) => updateExternalContact(index, { contact: event.target.value })}
                    />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <input
                        className={leadCoreInputClassName}
                        placeholder={HANDOVER_UPDATE_PLACEHOLDERS.contactInstruction}
                        value={contact.instruction}
                        onChange={(event) => updateExternalContact(index, { instruction: event.target.value })}
                      />
                      <HandoverRemoveRowButton
                        visible={form.communicationContacts.length > 1}
                        onClick={() => removeExternalContact(index)}
                        label="Remove external contact"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button type="button" onClick={addExternalContact} className="mt-4 flex items-center gap-1 text-sm font-bold text-[#003c90]">
          <span className="material-symbols-outlined text-base">add_circle</span> Add External Contact
        </button>
      </section>

      <section id="team" className={`${cardClass} scroll-mt-24`}>
        <h3 className={sectionTitleClass}>
          <span className="material-symbols-outlined">groups</span>9. Project Team Assignment
        </h3>
        <HandoverFieldError message={submitErrors.teamAssignments} show={showErr} />
        <div className="overflow-hidden rounded-lg border border-[#c3c6d5]/30">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#e6e8ea]">
              <tr>
                <th className="p-3 font-bold">Role</th>
                <th className="p-3 font-bold">Needed</th>
                <th className="p-3 font-bold">Responsibilities</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eceef0]">
              {form.teamAssignments.map((item, index) => (
                <tr key={`${item.role}-${index}`}>
                  <td className="p-3">
                    <input
                      className={leadCoreInputClassName}
                      placeholder={HANDOVER_UPDATE_PLACEHOLDERS.teamRole}
                      value={item.role}
                      onChange={(event) => {
                        const next = [...form.teamAssignments];
                        next[index] = { ...next[index], role: event.target.value };
                        onChange({ ...form, teamAssignments: next });
                      }}
                    />
                  </td>
                  <td className="p-3">
                    <input
                      className={leadCoreInputClassName}
                      placeholder={HANDOVER_UPDATE_PLACEHOLDERS.teamName}
                      value={item.name}
                      onChange={(event) => {
                        const next = [...form.teamAssignments];
                        next[index] = { ...next[index], name: event.target.value };
                        onChange({ ...form, teamAssignments: next });
                      }}
                    />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <input
                        className={leadCoreInputClassName}
                        placeholder={HANDOVER_UPDATE_PLACEHOLDERS.teamResponsibilities}
                        value={item.responsibilities}
                        onChange={(event) => {
                          const next = [...form.teamAssignments];
                          next[index] = { ...next[index], responsibilities: event.target.value };
                          onChange({ ...form, teamAssignments: next });
                        }}
                      />
                      <HandoverRemoveRowButton
                        visible={form.teamAssignments.length > 1}
                        onClick={() => {
                          if (form.teamAssignments.length <= 1) return;
                          const next = [...form.teamAssignments];
                          next.splice(index, 1);
                          onChange({ ...form, teamAssignments: next });
                        }}
                        label="Remove team member"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          type="button"
          onClick={() =>
            onChange({
              ...form,
              teamAssignments: [...form.teamAssignments, { role: '', name: '', responsibilities: '' }]
            })
          }
          className="mt-4 flex items-center gap-1 text-sm font-bold text-[#003c90]"
        >
          <span className="material-symbols-outlined text-base">add_circle</span> Add Team Member
        </button>
      </section>

      <section id="checklist" className={`${cardClass} scroll-mt-24`}>
        <h3 className={sectionTitleClass}>
          <span className="material-symbols-outlined">fact_check</span>10. Handover Checklist
        </h3>
        <p className="mb-4 text-sm text-[#737784]">Checklist diisi otomatis dari engagement letter dan tidak dapat diubah di tahap ini.</p>
        <div className="space-y-3">
          {form.checklist.map((item) => (
            <div key={item.label} className="flex items-center justify-between rounded-lg bg-[#f7f9fb] p-4">
              <span className="text-sm font-medium text-[#191c1e]">{item.label}</span>
              <span className="rounded bg-[#e0e3e5] px-3 py-1.5 text-xs font-bold text-[#003c90]">{item.text}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
