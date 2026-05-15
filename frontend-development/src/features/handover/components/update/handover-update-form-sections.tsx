import type { ChangeEvent } from 'react';
import type { HandoverContact, HandoverDetail } from '../../types/handover.types';

interface HandoverUpdateFormSectionsProps {
  form: HandoverDetail;
  onChange: (next: HandoverDetail) => void;
  onDeleteDocument: (documentId: number) => void;
}

const cardClass = 'mb-8 rounded-xl bg-white p-8 shadow-sm';
const inputClass =
  'w-full rounded bg-[#e0e3e5] px-4 py-3 text-sm text-[#191c1e] outline-none focus:ring-2 focus:ring-[#1d59c1]';
const readOnlyBoxClass = 'rounded bg-[#f2f4f6] px-4 py-3 text-sm font-medium text-[#191c1e]';
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

export const HandoverUpdateFormSections = ({ form, onChange, onDeleteDocument }: HandoverUpdateFormSectionsProps) => {
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
    const next = [...form[key]];
    next.splice(index, 1);
    onChange({ ...form, [key]: next });
  };

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

  const handleNewDocumentFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;
    const additions = Array.from(files).map((file) => ({
      id: `pending-${Date.now()}-${file.name}`,
      name: file.name,
      filePath: '',
      downloadUrl: null,
      uploadedAt: '-',
      pendingFile: file
    }));
    onChange({ ...form, clientDocuments: [...form.clientDocuments, ...additions] });
    event.target.value = '';
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
              className={inputClass}
              value={form.projectTitle ?? ''}
              onChange={(event) => updateField('projectTitle', event.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className={labelClass}>Company Group</label>
            <input
              className={inputClass}
              value={form.companyGroup ?? ''}
              onChange={(event) => updateField('companyGroup', event.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className={labelClass}>Project Start Date</label>
            <input
              type="date"
              className={inputClass}
              value={form.projectStartDate ?? ''}
              onChange={(event) => updateField('projectStartDate', event.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className={labelClass}>Project End Date</label>
            <input
              type="date"
              className={inputClass}
              value={form.projectEndDate ?? ''}
              onChange={(event) => updateField('projectEndDate', event.target.value)}
            />
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
            className={inputClass}
            rows={5}
            value={form.backgroundSummary}
            onChange={(event) => updateField('backgroundSummary', event.target.value)}
          />
        </div>
      </section>

      <section id="scope" className={`${cardClass} scroll-mt-24`}>
        <h3 className={sectionTitleClass}>
          <span className="material-symbols-outlined">view_agenda</span>3. Finalized Scope of Work
        </h3>
        <div className="space-y-4">
          <div className="space-y-2 rounded-lg border-l-4 border-[#003c90] bg-[#f2f4f6] p-4">
            <p className="text-xs font-bold uppercase text-[#003c90]">3.1 Scope Included</p>
            {form.scopeIncluded.map((item, index) => (
              <div key={`inc-${index}`} className="flex items-center gap-2">
                <input
                  className={inputClass}
                  value={item}
                  onChange={(event) => {
                    const next = [...form.scopeIncluded];
                    next[index] = event.target.value;
                    onChange({ ...form, scopeIncluded: next });
                  }}
                />
                <button
                  type="button"
                  onClick={() => removeStringItem('scopeIncluded', index)}
                  className="text-[#ba1a1a]"
                  aria-label="Remove scope included"
                >
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
            ))}
            <button type="button" onClick={() => addStringItem('scopeIncluded')} className="flex items-center gap-1 text-sm font-bold text-[#003c90]">
              <span className="material-symbols-outlined text-base">add_circle</span> Add Item
            </button>
          </div>
          <div className="space-y-2 rounded-lg border-l-4 border-[#003c90] bg-[#f2f4f6] p-4">
            <p className="text-xs font-bold uppercase text-[#003c90]">3.2 Exclusions</p>
            {form.scopeExcluded.map((item, index) => (
              <div key={`exc-${index}`} className="flex items-center gap-2">
                <input
                  className={inputClass}
                  value={item}
                  onChange={(event) => {
                    const next = [...form.scopeExcluded];
                    next[index] = event.target.value;
                    onChange({ ...form, scopeExcluded: next });
                  }}
                />
                <button
                  type="button"
                  onClick={() => removeStringItem('scopeExcluded', index)}
                  className="text-[#ba1a1a]"
                  aria-label="Remove scope exclusion"
                >
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
            ))}
            <button type="button" onClick={() => addStringItem('scopeExcluded')} className="flex items-center gap-1 text-sm font-bold text-[#003c90]">
              <span className="material-symbols-outlined text-base">add_circle</span> Add Item
            </button>
          </div>
          <div className="space-y-2 rounded-lg border-l-4 border-[#003c90] bg-[#f2f4f6] p-4">
            <p className="text-xs font-bold uppercase text-[#003c90]">3.3 Deliverables</p>
            {form.deliverables.map((item, index) => (
              <div key={`del-${index}`} className="flex items-center gap-2">
                <input
                  className={inputClass}
                  value={item}
                  onChange={(event) => {
                    const next = [...form.deliverables];
                    next[index] = event.target.value;
                    onChange({ ...form, deliverables: next });
                  }}
                />
                <button
                  type="button"
                  onClick={() => removeStringItem('deliverables', index)}
                  className="text-[#ba1a1a]"
                  aria-label="Remove deliverable"
                >
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
            ))}
            <button type="button" onClick={() => addStringItem('deliverables')} className="flex items-center gap-1 text-sm font-bold text-[#003c90]">
              <span className="material-symbols-outlined text-base">add_circle</span> Add Item
            </button>
          </div>
          <div className="space-y-2">
            <p className={labelClass}>3.4 Milestone Breakdown</p>
            {form.timelineMilestones.map((item, index) => (
              <div key={`${item.milestone}-${index}`} className="grid grid-cols-1 gap-2 rounded-lg border border-[#c3c6d5]/30 bg-[#f2f4f6] p-3 md:grid-cols-3">
                <input
                  className={inputClass}
                  placeholder="Milestone"
                  value={item.milestone}
                  onChange={(event) => {
                    const next = [...form.timelineMilestones];
                    next[index] = { ...next[index], milestone: event.target.value };
                    onChange({ ...form, timelineMilestones: next });
                  }}
                />
                <input
                  type="date"
                  className={inputClass}
                  value={item.targetDateIso ?? ''}
                  onChange={(event) => {
                    const next = [...form.timelineMilestones];
                    next[index] = { ...next[index], targetDateIso: event.target.value, targetDate: event.target.value };
                    onChange({ ...form, timelineMilestones: next });
                  }}
                />
                <div className="flex items-center gap-2">
                  <input
                    className={inputClass}
                    placeholder="Notes"
                    value={item.notes === '-' ? '' : item.notes}
                    onChange={(event) => {
                      const next = [...form.timelineMilestones];
                      next[index] = { ...next[index], notes: event.target.value };
                      onChange({ ...form, timelineMilestones: next });
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const next = [...form.timelineMilestones];
                      next.splice(index, 1);
                      onChange({ ...form, timelineMilestones: next });
                    }}
                    className="text-[#ba1a1a]"
                    aria-label="Remove milestone row"
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...form,
                  timelineMilestones: [...form.timelineMilestones, { milestone: '', targetDate: '', targetDateIso: '', notes: '' }]
                })
              }
              className="flex items-center gap-1 text-sm font-bold text-[#003c90]"
            >
              <span className="material-symbols-outlined text-base">add_circle</span> Add Row
            </button>
          </div>
        </div>
      </section>

      <section id="fees" className={`${cardClass} scroll-mt-24`}>
        <h3 className={sectionTitleClass}>
          <span className="material-symbols-outlined">payments</span>4. Fee Structure &amp; Payment Terms
        </h3>
        <div className="space-y-3 rounded-lg border border-[#c3c6d5]/30 bg-[#f2f4f6] p-4">
          {form.feeItems.map((item) => (
            <div key={item.item} className="grid grid-cols-1 gap-2 md:grid-cols-3">
              <p className="text-sm font-semibold text-[#191c1e]">{item.item}</p>
              <p className="text-sm text-[#434653]">{item.amount}</p>
              <p className="text-sm text-[#737784]">{item.notes}</p>
            </div>
          ))}
          <p className={readOnlyBoxClass}>{form.paymentTerms}</p>
        </div>
      </section>

      <section id="docs" className={`${cardClass} scroll-mt-24`}>
        <h3 className={sectionTitleClass}>
          <span className="material-symbols-outlined">folder_shared</span>5. Client-Provided Documents
        </h3>
        <div className="space-y-4">
          {form.clientDocuments.map((item, index) => (
            <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg bg-[#f2f4f6] p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[#191c1e]">{item.name}</p>
                {item.pendingFile ? (
                  <p className="text-xs text-[#737784]">Belum diunggah — akan disimpan saat Save</p>
                ) : item.downloadUrl ? (
                  <a href={item.downloadUrl} target="_blank" rel="noreferrer" className="text-xs text-[#003c90] hover:underline">
                    Lihat dokumen
                  </a>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => removeClientDocument(index)}
                className="text-[#ba1a1a]"
                aria-label="Remove client document"
              >
                <span className="material-symbols-outlined">cancel</span>
              </button>
            </div>
          ))}
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#c3c6d5] p-4 text-sm font-bold text-[#737784] transition-colors hover:text-[#003c90]">
            <span className="material-symbols-outlined">upload_file</span>
            Unggah dokumen (PDF, Office, JPG/PNG)
            <input type="file" multiple className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" onChange={handleNewDocumentFiles} />
          </label>
        </div>
      </section>

      <section id="outstanding-data" className={`${cardClass} scroll-mt-24`}>
        <h3 className={sectionTitleClass}>
          <span className="material-symbols-outlined">pending</span>6. Outstanding Data
        </h3>
        <div className="space-y-2">
          {form.outstandingData.map((item, index) => (
            <div key={`out-${index}`} className="flex items-center gap-2">
              <input
                className={inputClass}
                value={item}
                onChange={(event) => {
                  const next = [...form.outstandingData];
                  next[index] = event.target.value;
                  onChange({ ...form, outstandingData: next });
                }}
              />
              <button
                type="button"
                onClick={() => removeStringItem('outstandingData', index)}
                className="text-[#ba1a1a]"
                aria-label="Remove outstanding data item"
              >
                <span className="material-symbols-outlined">delete</span>
              </button>
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
        <div className="space-y-2">
          {form.keyRisks.map((item, index) => (
            <div key={`risk-${index}`} className="flex items-center gap-2">
              <input
                className={inputClass}
                value={item}
                onChange={(event) => {
                  const next = [...form.keyRisks];
                  next[index] = event.target.value;
                  onChange({ ...form, keyRisks: next });
                }}
              />
              <button
                type="button"
                onClick={() => removeStringItem('keyRisks', index)}
                className="text-[#ba1a1a]"
                aria-label="Remove key risk"
              >
                <span className="material-symbols-outlined">delete</span>
              </button>
            </div>
          ))}
          <button type="button" onClick={() => addStringItem('keyRisks')} className="flex items-center gap-1 text-sm font-bold text-[#003c90]">
            <span className="material-symbols-outlined text-base">add_circle</span> Add Item
          </button>
        </div>
        <div className="mt-4 space-y-1">
          <label className={labelClass}>Internal Confidential Note</label>
          <textarea
            className={inputClass}
            rows={3}
            value={form.confidentialNote === '-' ? '' : form.confidentialNote}
            onChange={(event) => updateField('confidentialNote', event.target.value)}
          />
        </div>
      </section>

      <section id="communication" className={`${cardClass} scroll-mt-24`}>
        <h3 className={sectionTitleClass}>
          <span className="material-symbols-outlined">connect_without_contact</span>8. Communication Protocol
        </h3>
        <p className="mb-3 text-xs font-bold uppercase text-[#737784]">Internal</p>
        <div className="space-y-2">
          {form.communicationProtocol.map((item, index) => (
            <div key={`com-${index}`} className="flex items-center gap-2">
              <input
                className={inputClass}
                value={item}
                onChange={(event) => {
                  const next = [...form.communicationProtocol];
                  next[index] = event.target.value;
                  onChange({ ...form, communicationProtocol: next });
                }}
              />
              <button
                type="button"
                onClick={() => removeStringItem('communicationProtocol', index)}
                className="text-[#ba1a1a]"
                aria-label="Remove internal protocol item"
              >
                <span className="material-symbols-outlined">delete</span>
              </button>
            </div>
          ))}
          <button type="button" onClick={() => addStringItem('communicationProtocol')} className="flex items-center gap-1 text-sm font-bold text-[#003c90]">
            <span className="material-symbols-outlined text-base">add_circle</span> Add Internal Item
          </button>
        </div>

        <p className="mb-3 mt-6 text-xs font-bold uppercase text-[#737784]">External</p>
        <div className="space-y-3">
          {form.communicationContacts.map((contact, index) => (
            <div key={`ext-${index}`} className="grid grid-cols-1 gap-2 rounded-lg border border-[#c3c6d5]/30 bg-[#f2f4f6] p-3 md:grid-cols-2">
              <input
                className={inputClass}
                placeholder="Role"
                value={contact.role}
                onChange={(event) => updateExternalContact(index, { role: event.target.value })}
              />
              <input
                className={inputClass}
                placeholder="Name"
                value={contact.name}
                onChange={(event) => updateExternalContact(index, { name: event.target.value })}
              />
              <input
                className={inputClass}
                placeholder="Contact"
                value={contact.contact}
                onChange={(event) => updateExternalContact(index, { contact: event.target.value })}
              />
              <div className="flex items-center gap-2">
                <input
                  className={inputClass}
                  placeholder="Instruction"
                  value={contact.instruction === '-' ? '' : contact.instruction}
                  onChange={(event) => updateExternalContact(index, { instruction: event.target.value })}
                />
                <button
                  type="button"
                  onClick={() => {
                    const next = [...form.communicationContacts];
                    next.splice(index, 1);
                    onChange({ ...form, communicationContacts: next });
                  }}
                  className="text-[#ba1a1a]"
                  aria-label="Remove external contact"
                >
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
            </div>
          ))}
          <button type="button" onClick={addExternalContact} className="flex items-center gap-1 text-sm font-bold text-[#003c90]">
            <span className="material-symbols-outlined text-base">add_circle</span> Add External Contact
          </button>
        </div>
      </section>

      <section id="team" className={`${cardClass} scroll-mt-24`}>
        <h3 className={sectionTitleClass}>
          <span className="material-symbols-outlined">groups</span>9. Project Team Assignment
        </h3>
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
                      className={inputClass}
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
                      className={inputClass}
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
                        className={inputClass}
                        value={item.responsibilities}
                        onChange={(event) => {
                          const next = [...form.teamAssignments];
                          next[index] = { ...next[index], responsibilities: event.target.value };
                          onChange({ ...form, teamAssignments: next });
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const next = [...form.teamAssignments];
                          next.splice(index, 1);
                          onChange({ ...form, teamAssignments: next });
                        }}
                        className="text-[#ba1a1a]"
                        aria-label="Remove team member"
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
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
