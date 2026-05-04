import { useOutletContext } from 'react-router';
import type { ProjectDetailOutletContext } from './project-detail-page';

const sectionClass = 'rounded-2xl bg-white p-6 shadow-sm ring-1 ring-[#eceef0]';
const sectionTitleClass = 'mb-4 text-lg font-bold text-[#003c90]';
const labelClass = 'text-xs font-bold uppercase tracking-wider text-[#737784]';

export const ProjectOverviewPage = () => {
  const { project, handover } = useOutletContext<ProjectDetailOutletContext>();

  return (
    <div className="space-y-5">
      <section className={sectionClass}>
        <h2 className={sectionTitleClass}>Project Information</h2>
        <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
          <div className="border-b border-[#f2f4f6] pb-3">
            <p className={labelClass}>Client</p>
            <p className="mt-1 text-sm font-semibold text-[#191c1e]">{project.client}</p>
          </div>
          <div className="border-b border-[#f2f4f6] pb-3">
            <p className={labelClass}>Project Name</p>
            <p className="mt-1 text-sm font-semibold text-[#191c1e]">{project.projectName}</p>
          </div>
          <div className="border-b border-[#f2f4f6] pb-3">
            <p className={labelClass}>Service Line</p>
            <p className="mt-1 text-sm font-semibold text-[#003c90]">{project.serviceLine}</p>
          </div>
          <div className="border-b border-[#f2f4f6] pb-3">
            <p className={labelClass}>Project Period</p>
            <p className="mt-1 text-sm font-semibold text-[#191c1e]">
              {new Date(project.startDate).toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              })}{' '}
              –{' '}
              {new Date(project.endDate).toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              })}
            </p>
          </div>
          <div className="border-b border-[#f2f4f6] pb-3">
            <p className={labelClass}>Project Manager</p>
            <p className="mt-1 text-sm font-semibold text-[#191c1e]">
              {project.pm?.name ?? <span className="text-[#a16207]">Unassigned</span>}
            </p>
          </div>
          <div className="border-b border-[#f2f4f6] pb-3">
            <p className={labelClass}>Consultant Team</p>
            <p className="mt-1 text-sm font-semibold text-[#191c1e]">
              {project.consultants.length === 0 ? (
                <span className="text-[#a16207]">Awaiting Assignment</span>
              ) : (
                `${project.consultants.length} consultant${project.consultants.length > 1 ? 's' : ''} assigned`
              )}
            </p>
          </div>
        </div>
      </section>

      {handover && (
        <>
          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>Background Summary</h2>
            <div className="rounded-xl border-l-4 border-[#003c90] bg-[#f2f4f6] p-5 text-sm italic leading-relaxed text-[#434653]">
              {handover.backgroundSummary}
            </div>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>Scope of Work</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <p className={labelClass}>Included</p>
                <ul className="mt-2 space-y-1.5">
                  {handover.scopeIncluded.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-[#191c1e]">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#006544]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className={labelClass}>Excluded</p>
                <ul className="mt-2 space-y-1.5">
                  {handover.scopeExcluded.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-[#737784]">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c2410c]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>Deliverables</h2>
            <ul className="space-y-1.5">
              {handover.deliverables.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-[#191c1e]">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#003c90]" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
};
