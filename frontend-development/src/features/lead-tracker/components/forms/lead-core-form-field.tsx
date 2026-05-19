import type { ReactNode } from 'react';

export const leadCoreInputClassName =
  'h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none';

export const leadCoreTextareaClassName =
  'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none resize-y';

const labelClassName = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500';

const RequiredMark = () => (
  <span className="ml-0.5 text-red-600" aria-hidden="true">
    *
  </span>
);

export const LeadCoreFieldLabel = ({ children, required }: { children: ReactNode; required?: boolean }) => (
  <label className={labelClassName}>
    {children}
    {required ? <RequiredMark /> : null}
  </label>
);

export const LeadCoreFieldError = ({ message }: { message?: string }) =>
  message ? <p className="mt-1 text-xs text-red-600">{message}</p> : null;
