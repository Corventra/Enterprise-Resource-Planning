import { ArrowLeft, Eye, EyeOff, Save, Send } from 'lucide-react';
import type { FormBuilderMode } from '../../types/form-builder.types';

interface FormBuilderTopBarProps {
  title: string;
  campaignName?: string;
  mode: FormBuilderMode;
  isSaving: boolean;
  isPublishing: boolean;
  onBack: () => void;
  onToggleMode: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
}

export const FormBuilderTopBar = ({
  title,
  campaignName,
  mode,
  isSaving,
  isPublishing,
  onBack,
  onToggleMode,
  onSaveDraft,
  onPublish
}: FormBuilderTopBarProps) => {
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
            <h1 className="text-base font-semibold text-slate-900">{title || 'Untitled Form'}</h1>
            {campaignName && <p className="text-xs text-slate-500">{campaignName}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleMode}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
          >
            {mode === 'preview' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {mode === 'preview' ? 'Edit' : 'Preview'}
          </button>
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={isSaving}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            type="button"
            onClick={onPublish}
            disabled={isPublishing}
            className="inline-flex items-center gap-1 rounded-md bg-[linear-gradient(135deg,#003c90_0%,#0f52ba_100%)] px-3 py-1.5 text-sm font-medium text-white hover:bg-[linear-gradient(135deg,#002d6b_0%,#0c4190_100%)] disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {isPublishing ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>
    </header>
  );
};
