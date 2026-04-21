import type { ChangeEvent } from 'react';
import type { HandoverDetail } from '../../types/handover.types';

interface HandoverUpdateFormSectionsProps {
  form: HandoverDetail;
  onChange: (next: HandoverDetail) => void;
}

const cardClass = 'mb-8 rounded-xl bg-white p-8 shadow-sm';
const inputClass =
  'w-full rounded bg-[#e0e3e5] px-4 py-3 text-sm text-[#191c1e] outline-none focus:ring-2 focus:ring-[#1d59c1]';
const readOnlyBoxClass = 'rounded bg-[#f2f4f6] px-4 py-3 text-sm font-medium text-[#191c1e]';
const sectionTitleClass = 'mb-6 flex items-center gap-2 text-lg font-bold uppercase tracking-wider text-[#003c90]';
const labelClass = 'text-xs font-bold uppercase text-[#737784]';

export const HandoverUpdateFormSections = ({ form, onChange }: HandoverUpdateFormSectionsProps) => {
  const projectTitleIndex = form.projectInformation.findIndex((item) => item.label === 'Project Title');

  const updateTextArea =
    (key: 'backgroundSummary') =>
    (event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      onChange({ ...form, [key]: event.target.value });
    };

  const addStringItem = (
    key: 'scopeIncluded' | 'scopeExcluded' | 'deliverables' | 'clientDocuments' | 'outstandingData' | 'keyRisks' | 'communicationProtocol'
  ) => {
    onChange({ ...form, [key]: [...form[key], ''] });
  };

  const removeStringItem = (
    key: 'scopeIncluded' | 'scopeExcluded' | 'deliverables' | 'clientDocuments' | 'outstandingData' | 'keyRisks' | 'communicationProtocol',
    index: number
  ) => {
    const next = [...form[key]];
    next.splice(index, 1);
    onChange({ ...form, [key]: next });
  };

  return (
    <div className="md:col-span-10">
      <section id="project-info" className={`${cardClass} scroll-mt-24`}>
        <h3 className={sectionTitleClass}>
          <span className="material-symbols-outlined">info</span>1. Project Information
        </h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {projectTitleIndex >= 0 ? (
            <div className="space-y-1">
              <label className={labelClass}>Project Title</label>
              <input
                className={inputClass}
                value={form.projectInformation[projectTitleIndex].value}
                onChange={(event) => {
                  const next = [...form.projectInformation];
                  next[projectTitleIndex] = { ...next[projectTitleIndex], value: event.target.value };
                  onChange({ ...form, projectInformation: next });
                }}
              />
            </div>
          ) : null}
          {form.projectInformation
            .filter((item) => item.label !== 'Project Title')
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
          <textarea className={inputClass} rows={5} value={form.backgroundSummary} onChange={updateTextArea('backgroundSummary')} />
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
            <p className={labelClass}>3.4 Milestone Breakdown (Auto-filled)</p>
            {form.timelineMilestones.map((item, index) => (
              <div key={`${item.milestone}-${index}`} className="grid grid-cols-1 gap-2 rounded-lg border border-[#c3c6d5]/30 bg-[#f2f4f6] p-3 md:grid-cols-3">
                <input
                  className={inputClass}
                  value={item.milestone}
                  onChange={(event) => {
                    const next = [...form.timelineMilestones];
                    next[index] = { ...next[index], milestone: event.target.value };
                    onChange({ ...form, timelineMilestones: next });
                  }}
                />
                <input
                  className={inputClass}
                  value={item.targetDate}
                  onChange={(event) => {
                    const next = [...form.timelineMilestones];
                    next[index] = { ...next[index], targetDate: event.target.value };
                    onChange({ ...form, timelineMilestones: next });
                  }}
                />
                <div className="flex items-center gap-2">
                  <input
                    className={inputClass}
                    value={item.notes}
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
                  timelineMilestones: [...form.timelineMilestones, { milestone: '', targetDate: '', notes: '' }]
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
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {form.clientDocuments.map((item, index) => (
              <div key={`doc-${index}`} className="flex items-center justify-between rounded-lg bg-[#f2f4f6] p-4">
                <input
                  className="w-full bg-transparent text-sm font-medium text-[#191c1e] outline-none"
                  value={item}
                  onChange={(event) => {
                    const next = [...form.clientDocuments];
                    next[index] = event.target.value;
                    onChange({ ...form, clientDocuments: next });
                  }}
                />
                <button
                  type="button"
                  onClick={() => removeStringItem('clientDocuments', index)}
                  className="text-[#ba1a1a]"
                  aria-label="Remove client document"
                >
                  <span className="material-symbols-outlined">cancel</span>
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addStringItem('clientDocuments')}
              className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#c3c6d5] p-4 text-sm font-bold text-[#737784] transition-colors hover:text-[#003c90]"
            >
              <span className="material-symbols-outlined">add</span>
              Add Document
            </button>
          </div>
          <div className="space-y-1">
            <label className={labelClass}>Storage Location (Auto-filled)</label>
            <p className={readOnlyBoxClass}>{form.storageLocation}</p>
          </div>
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
          <label className={labelClass}>Internal Confidential Note (Auto-filled)</label>
          <p className={readOnlyBoxClass}>{form.confidentialNote}</p>
        </div>
      </section>

      <section id="communication" className={`${cardClass} scroll-mt-24`}>
        <h3 className={sectionTitleClass}>
          <span className="material-symbols-outlined">connect_without_contact</span>8. Communication Protocol
        </h3>
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
                aria-label="Remove communication protocol item"
              >
                <span className="material-symbols-outlined">delete</span>
              </button>
            </div>
          ))}
          <button type="button" onClick={() => addStringItem('communicationProtocol')} className="flex items-center gap-1 text-sm font-bold text-[#003c90]">
            <span className="material-symbols-outlined text-base">add_circle</span> Add Item
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
                <th className="p-3 font-bold">Name</th>
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
        <div className="space-y-3">
          {form.checklist.map((item, index) => (
            <div key={item.label} className="flex items-center justify-between rounded-lg bg-[#f7f9fb] p-4">
              <input
                className="w-full bg-transparent text-sm font-medium text-[#191c1e] outline-none"
                value={item.label}
                onChange={(event) => {
                  const next = [...form.checklist];
                  next[index] = { ...next[index], label: event.target.value };
                  onChange({ ...form, checklist: next });
                }}
              />
              <select
                className="ml-4 rounded bg-[#e0e3e5] px-3 py-1.5 text-sm font-bold text-[#003c90]"
                value={item.status}
                onChange={(event) => {
                  const next = [...form.checklist];
                  next[index] = { ...next[index], status: event.target.value as 'SUCCESS' | 'INFO' | 'WARNING' };
                  onChange({ ...form, checklist: next });
                }}
              >
                <option value="SUCCESS">Yes</option>
                <option value="INFO">Partial</option>
                <option value="WARNING">Pending</option>
              </select>
              <button
                type="button"
                onClick={() => {
                  const next = [...form.checklist];
                  next.splice(index, 1);
                  onChange({ ...form, checklist: next });
                }}
                className="ml-2 text-[#ba1a1a]"
                aria-label="Remove checklist item"
              >
                <span className="material-symbols-outlined">delete</span>
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            onChange({
              ...form,
              checklist: [...form.checklist, { label: '', status: 'INFO', text: 'PARTIAL / INFO' }]
            })
          }
          className="mt-4 flex items-center gap-1 text-sm font-bold text-[#003c90]"
        >
          <span className="material-symbols-outlined text-base">add_circle</span> Add Checklist Item
        </button>
      </section>

    </div>
  );
};
