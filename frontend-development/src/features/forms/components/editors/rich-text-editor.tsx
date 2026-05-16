import { useRef } from 'react';
import { RichTextToolbar } from './rich-text-toolbar';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  readOnly?: boolean;
}

const wrapSelectedText = (
  value: string,
  selectionStart: number,
  selectionEnd: number,
  prefix: string,
  suffix = prefix
) => {
  const selected = value.slice(selectionStart, selectionEnd) || 'text';
  return `${value.slice(0, selectionStart)}${prefix}${selected}${suffix}${value.slice(selectionEnd)}`;
};

export const RichTextEditor = ({ value, onChange, placeholder, rows = 4, readOnly }: RichTextEditorProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const withSelection = (callback: (start: number, end: number) => string) => {
    if (readOnly) return;
    const element = textareaRef.current;
    if (!element) {
      return;
    }
    const next = callback(element.selectionStart, element.selectionEnd);
    onChange(next);
  };

  return (
    <div>
      {!readOnly ? (
        <RichTextToolbar
          onBold={() => withSelection((start, end) => wrapSelectedText(value, start, end, '**'))}
          onItalic={() => withSelection((start, end) => wrapSelectedText(value, start, end, '_'))}
          onUnderline={() => withSelection((start, end) => wrapSelectedText(value, start, end, '__'))}
          onLink={() =>
            withSelection((start, end) => {
              const selected = value.slice(start, end) || 'link text';
              return `${value.slice(0, start)}[${selected}](https://)${value.slice(end)}`;
            })
          }
        />
      ) : null}
      <textarea
        ref={textareaRef}
        readOnly={readOnly}
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none read-only:bg-slate-50 read-only:text-slate-700"
      />
    </div>
  );
};
