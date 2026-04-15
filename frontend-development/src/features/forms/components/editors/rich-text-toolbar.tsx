import { Bold, Italic, Link, Underline } from 'lucide-react';

interface RichTextToolbarProps {
  onBold: () => void;
  onItalic: () => void;
  onUnderline: () => void;
  onLink: () => void;
}

const buttonClassName =
  'inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-100';

export const RichTextToolbar = ({ onBold, onItalic, onUnderline, onLink }: RichTextToolbarProps) => {
  return (
    <div className="mb-2 flex items-center gap-2">
      <button type="button" className={buttonClassName} onClick={onBold} aria-label="Bold">
        <Bold className="h-4 w-4" />
      </button>
      <button type="button" className={buttonClassName} onClick={onItalic} aria-label="Italic">
        <Italic className="h-4 w-4" />
      </button>
      <button type="button" className={buttonClassName} onClick={onUnderline} aria-label="Underline">
        <Underline className="h-4 w-4" />
      </button>
      <button type="button" className={buttonClassName} onClick={onLink} aria-label="Insert link">
        <Link className="h-4 w-4" />
      </button>
    </div>
  );
};
