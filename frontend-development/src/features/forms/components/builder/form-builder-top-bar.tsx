import { ArrowLeft, ExternalLink, Save, Send } from 'lucide-react';

import { Link } from 'react-router';

import type { FormBackendStatus } from '../../types/form-builder.types';



interface FormBuilderTopBarProps {

  title: string;

  campaignName?: string;

  isSaving: boolean;

  /** Owner campaign + FORM_MANAGE — untuk badge View only */

  canManageBuilder: boolean;

  /** Save / Publish di top bar — hanya saat draft + manage (dikontrol parent). */

  canManageLifecycle: boolean;

  /** null = form belum tersimpan, preview belum tersedia */

  previewHref: string | null;

  formPersisted: boolean;

  backendStatus: FormBackendStatus;

  phaseBBusy: boolean;

  /** Create mode: "Save & Publish"; draft tersimpan: "Publish" */

  publishButtonLabel: string;

  onBack: () => void;

  onSaveDraft: () => void;

  onPublish: () => void;

}



export const FormBuilderTopBar = ({

  title,

  campaignName,

  isSaving,

  canManageBuilder,

  canManageLifecycle,

  previewHref,

  formPersisted,

  backendStatus,

  phaseBBusy,

  publishButtonLabel,

  onBack,

  onSaveDraft,

  onPublish

}: FormBuilderTopBarProps) => {

  const showSaveDraft =

    canManageLifecycle && (backendStatus === 'DRAFT' || !formPersisted);

  const showPublish = canManageLifecycle && (!formPersisted || backendStatus === 'DRAFT');

  const busy = isSaving || phaseBBusy;



  return (

    <header className="sticky rounded-lg border border-slate-200 bg-white px-6 py-4">

      <div className="flex flex-wrap items-center justify-between gap-3">

        <div className="flex items-center gap-3">

          <button

            type="button"

            onClick={onBack}

            className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"

          >

            <ArrowLeft className="h-4 w-4" />

            Back

          </button>

          <div>

            <h1
              className={`text-base font-semibold ${title.trim() ? 'text-slate-900' : 'text-slate-400'}`}
            >
              {title.trim() || 'Belum ada judul'}
            </h1>

            {campaignName && <p className="text-xs text-slate-500">{campaignName}</p>}

          </div>

          {!canManageBuilder ? (

            <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">View only</span>

          ) : null}

        </div>

        <div className="flex flex-wrap items-center gap-2">

          {previewHref ? (

            <Link

              to={previewHref}

              className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"

            >

              <ExternalLink className="h-4 w-4" />

              Preview

            </Link>

          ) : (

            <span

              className="inline-flex cursor-not-allowed items-center gap-1 rounded-md border border-slate-100 px-3 py-1.5 text-sm text-slate-400"

              title="Form belum tersimpan — simpan atau publish untuk preview"

            >

              <ExternalLink className="h-4 w-4" />

              Preview

            </span>

          )}

          {showSaveDraft ? (

            <button

              type="button"

              onClick={onSaveDraft}

              disabled={busy}

              className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-50"

            >

              <Save className="h-4 w-4" />

              {isSaving ? 'Saving...' : 'Save Draft'}

            </button>

          ) : null}

          {showPublish ? (

            <button

              type="button"

              onClick={onPublish}

              disabled={busy}

              className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-900 hover:bg-emerald-100 disabled:opacity-50"

            >

              <Send className="h-4 w-4" />

              {phaseBBusy ? 'Memproses…' : publishButtonLabel}

            </button>

          ) : null}

        </div>

      </div>

    </header>

  );

};

