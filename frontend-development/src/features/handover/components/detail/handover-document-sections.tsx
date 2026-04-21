import type { HandoverDetail } from '../../types/handover.types';

interface HandoverDocumentSectionsProps {
  detail: HandoverDetail;
}

const sectionTitleClass = 'mb-4 text-lg font-bold text-[#003c90]';
const labelClass = 'text-xs font-bold uppercase tracking-wider text-[#737784]';

export const HandoverDocumentSections = ({ detail }: HandoverDocumentSectionsProps) => {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[#eceef0]">
      <section className="border-b border-[#f2f4f6] p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[#191c1e]">{detail.title}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#737784]">
              <span>Code: {detail.docCode}</span>
            </div>
          </div>
          <span className="rounded-full bg-[#006544]/15 px-3 py-1 text-xs font-bold uppercase text-[#006544]">
            {detail.projectStatus}
          </span>
        </div>
      </section>

      <section id="project-info" className="scroll-mt-24 px-6 pb-7 pt-6">
        <h3 className={`${sectionTitleClass} flex items-center gap-2`}>
          <span className="material-symbols-outlined">info</span>
          1. Project Information
        </h3>
        <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
          {detail.projectInformation.map((item) => (
            <div key={item.label} className="border-b border-[#f2f4f6] pb-3">
              <p className={labelClass}>{item.label}</p>
              <p
                className={`mt-1 text-sm font-semibold ${
                  item.accent === 'primary'
                    ? 'text-[#003c90]'
                    : item.accent === 'success'
                      ? 'text-[#006544]'
                      : 'text-[#191c1e]'
                }`}
              >
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="background" className="scroll-mt-24 border-t border-[#f2f4f6] px-6 py-7">
        <h3 className={`${sectionTitleClass} flex items-center gap-2`}>
          <span className="material-symbols-outlined">history</span>
          2. Background Summary
        </h3>
        <div className="rounded-xl border-l-4 border-[#003c90] bg-[#f2f4f6] p-5 text-sm italic leading-relaxed text-[#434653]">
          {detail.backgroundSummary}
        </div>
      </section>

      <section id="scope" className="scroll-mt-24 border-t border-[#f2f4f6] px-6 py-7">
        <h3 className={`${sectionTitleClass} flex items-center gap-2`}>
          <span className="material-symbols-outlined">assignment_turned_in</span>
          3. Finalized Scope of Work
        </h3>
        <div className="grid grid-cols-1 gap-7 md:grid-cols-2">
          <div>
            <p className={`${labelClass} mb-3 text-[#004b31]`}>3.1 Scope Included</p>
            <ul className="space-y-2">
              {detail.scopeIncluded.map((item) => (
                <li key={item} className="text-sm font-medium text-[#191c1e]">
                  - {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className={`${labelClass} mb-3 text-[#ba1a1a]`}>3.2 Exclusions</p>
            <ul className="space-y-2">
              {detail.scopeExcluded.map((item) => (
                <li key={item} className="text-sm font-medium text-[#737784]">
                  - {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-7">
          <p className={`${labelClass} mb-3`}>3.3 Deliverables</p>
          <div className="flex flex-wrap gap-2">
            {detail.deliverables.map((item) => (
              <span key={item} className="rounded-full bg-[#d5e3fc] px-3 py-1.5 text-xs font-bold text-[#57657a]">
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-7 overflow-hidden rounded-xl border border-[#e6e8ea]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#f2f4f6] font-bold text-[#434653]">
              <tr>
                <th className="px-4 py-3">Milestone</th>
                <th className="px-4 py-3">Target Date</th>
                <th className="px-4 py-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eceef0]">
              {detail.timelineMilestones.map((item) => (
                <tr key={item.milestone}>
                  <td className="px-4 py-3 font-semibold text-[#191c1e]">{item.milestone}</td>
                  <td className="px-4 py-3 text-[#434653]">{item.targetDate}</td>
                  <td className="px-4 py-3 text-[#737784]">{item.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="fees" className="scroll-mt-24 border-t border-[#f2f4f6] px-6 py-7">
        <h3 className={`${sectionTitleClass} flex items-center gap-2`}>
          <span className="material-symbols-outlined">payments</span>
          4. Fee Structure & Payment Terms
        </h3>
        <div className="overflow-hidden rounded-xl border border-[#e6e8ea]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#f2f4f6] font-bold text-[#434653]">
              <tr>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Amount (IDR)</th>
                <th className="px-4 py-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eceef0]">
              {detail.feeItems.map((item) => (
                <tr key={item.item}>
                  <td className="px-4 py-3 font-semibold text-[#191c1e]">{item.item}</td>
                  <td className="px-4 py-3 text-[#434653]">{item.amount}</td>
                  <td className="px-4 py-3 text-[#737784]">{item.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 rounded-xl bg-[#e6e8ea] p-5">
          <p className={labelClass}>Payment Terms</p>
          <p className="mt-1 text-sm text-[#191c1e]">{detail.paymentTerms}</p>
        </div>
      </section>

      <section id="docs" className="scroll-mt-24 border-t border-[#f2f4f6] px-6 py-7">
        <div className="grid grid-cols-1 gap-7 md:grid-cols-2">
          <div>
            <h3 className={`${sectionTitleClass} flex items-center gap-2`}>
              <span className="material-symbols-outlined">folder_shared</span>
              5. Client Documents
            </h3>
            <ul className="space-y-3">
              {detail.clientDocuments.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm font-medium text-[#191c1e]">
                  <span className="material-symbols-outlined text-[#006544]">check_circle</span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-5 rounded-lg border border-dashed border-[#c3c6d5] p-4">
              <p className={labelClass}>Storage Location</p>
              <p className="mt-1 flex items-center gap-2 rounded bg-[#f7f9fb] px-2 py-1 font-mono text-xs text-[#434653]">
                <span className="material-symbols-outlined text-[18px]">cloud</span>
                {detail.storageLocation}
              </p>
            </div>
          </div>
          <div>
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-[#ba1a1a]">
              <span className="material-symbols-outlined">pending</span>
              6. Outstanding Data
            </h3>
            <ul className="space-y-3">
              {detail.outstandingData.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm font-medium text-[#191c1e]">
                  <span className="material-symbols-outlined text-[#ba1a1a]">warning</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="risks" className="scroll-mt-24 border-t border-[#f2f4f6] px-6 py-7">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-[#ba1a1a]">
          <span className="material-symbols-outlined">gpp_maybe</span>
          7. Key Risks / Red Flags
        </h3>
        <div className="rounded-2xl border border-[#ba1a1a]/20 bg-[#ffdad6]/30 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#ba1a1a] text-white">
              <span className="material-symbols-outlined text-3xl">report</span>
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-[#ba1a1a]">Internal Confidential Note</p>
              <p className="mt-1 text-sm leading-relaxed text-[#93000a]">{detail.confidentialNote}</p>
            </div>
          </div>
        </div>
        <ul className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {detail.keyRisks.map((item) => (
            <li key={item} className="flex items-center gap-2 rounded-xl bg-[#f2f4f6] p-4 text-sm font-semibold text-[#191c1e]">
              <span className="material-symbols-outlined text-[#ba1a1a]">priority_high</span>
              {item}
            </li>
          ))}
        </ul>

        <h3 className="mb-4 mt-7 flex items-center gap-2 text-lg font-bold text-[#003c90]">
          <span className="material-symbols-outlined">connect_without_contact</span>
          8. Communication Protocol
        </h3>
        <ul className="space-y-2">
          {detail.communicationProtocol.map((item) => (
            <li key={item} className="text-sm font-medium text-[#191c1e]">
              - {item}
            </li>
          ))}
        </ul>
        <div className="mt-4 overflow-hidden rounded-xl border border-[#e6e8ea]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#f2f4f6] font-bold text-[#434653]">
              <tr>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Instruction</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eceef0]">
              {detail.communicationContacts.map((item) => (
                <tr key={`${item.role}-${item.name}`}>
                  <td className="px-4 py-3 font-semibold text-[#191c1e]">{item.role}</td>
                  <td className="px-4 py-3 text-[#191c1e]">{item.name}</td>
                  <td className="px-4 py-3 text-[#003c90]">{item.contact}</td>
                  <td className="px-4 py-3 text-[#737784]">{item.instruction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="team" className="scroll-mt-24 border-t border-[#f2f4f6] px-6 py-7">
        <h3 className={`${sectionTitleClass} flex items-center gap-2`}>
          <span className="material-symbols-outlined">groups</span>
          9. Project Team Assignment
        </h3>
        <div className="overflow-hidden rounded-xl border border-[#e6e8ea]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#f2f4f6] font-bold text-[#434653]">
              <tr>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Responsibilities</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eceef0]">
              {detail.teamAssignments.map((item) => (
                <tr key={`${item.role}-${item.name}`}>
                  <td className="px-4 py-3 font-semibold text-[#191c1e]">{item.role}</td>
                  <td className="px-4 py-3 text-[#191c1e]">{item.name}</td>
                  <td className="px-4 py-3 text-[#737784]">{item.responsibilities}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="mb-4 mt-7 flex items-center gap-2 text-lg font-bold text-[#003c90]">
          <span className="material-symbols-outlined">fact_check</span>
          10. Handover Checklist
        </h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {detail.checklist.map((item) => (
            <div key={item.label} className="flex items-center justify-between rounded-xl bg-[#f7f9fb] p-4">
              <span className="text-sm font-medium text-[#191c1e]">{item.label}</span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  item.status === 'SUCCESS'
                    ? 'bg-[#006544]/15 text-[#006544]'
                    : item.status === 'INFO'
                      ? 'bg-[#d5e3fc] text-[#57657a]'
                      : 'bg-orange-100 text-orange-700'
                }`}
              >
                {item.text}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section id="signoff" className="scroll-mt-24 border-t border-[#f2f4f6] px-6 py-7">
        <h3 className={`${sectionTitleClass} flex items-center gap-2`}>
          <span className="material-symbols-outlined">draw</span>
          11. Sign-Off
        </h3>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {detail.signOff.map((item) => (
            <div key={`${item.name}-${item.role}`} className="rounded-xl border-2 border-[#e6e8ea] p-5">
              <div className="mb-4 flex h-24 items-end justify-center border-b-2 border-dashed border-[#e6e8ea] pb-2">
                <p className="font-mono text-xs text-[#c3c6d5]">ELECTRONIC SIGNATURE PENDING</p>
              </div>
              <p className="text-center font-bold text-[#191c1e]">{item.name}</p>
              <p className="text-center text-xs font-bold uppercase tracking-wider text-[#737784]">{item.role}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
