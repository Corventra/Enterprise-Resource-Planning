import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { Bold, Italic, Link2, Underline as UnderlineIcon } from 'lucide-react';
import { useEffect } from 'react';

interface HtmlRichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

/**
 * WYSIWYG ringan (TipTap, MIT): bold, italic, underline, link, paragraf.
 * Nilai disimpan sebagai HTML string untuk dikirim ke backend apa adanya.
 */
export const HtmlRichTextEditor = ({
  value,
  onChange,
  placeholder = '',
  readOnly = false
}: HtmlRichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' }
      }),
      Placeholder.configure({ placeholder })
    ],
    content: value || '',
    editable: !readOnly,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    }
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!readOnly);
  }, [editor, readOnly]);

  useEffect(() => {
    if (!editor) return;
    const incoming = value || '';
    const current = editor.getHTML();
    if (incoming === current) return;
    editor.commands.setContent(incoming, false);
  }, [editor, value]);

  if (!editor) {
    return (
      <div className="min-h-[120px] rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
        Memuat editor…
      </div>
    );
  }

  const barBtn =
    'rounded px-2 py-1 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent';

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      {!readOnly ? (
        <div className="flex flex-wrap gap-1 border-b border-slate-200 px-2 py-1.5">
          <button
            type="button"
            className={barBtn}
            onClick={() => editor.chain().focus().toggleBold().run()}
            aria-label="Bold"
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={barBtn}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            aria-label="Italic"
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={barBtn}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            aria-label="Underline"
            title="Underline"
          >
            <UnderlineIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={barBtn}
            onClick={() => {
              const prev = editor.getAttributes('link').href;
              const url = window.prompt('URL tautan', typeof prev === 'string' ? prev : 'https://');
              if (url === null) return;
              if (url === '') {
                editor.chain().focus().extendMarkRange('link').unsetLink().run();
                return;
              }
              editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
            }}
            aria-label="Link"
            title="Link"
          >
            <Link2 className="h-4 w-4" />
          </button>
        </div>
      ) : null}
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none px-3 py-2 text-slate-800 focus:outline-none [&_.ProseMirror]:min-h-[120px] [&_.ProseMirror]:outline-none [&_.ProseMirror]:text-sm [&_.ProseMirror_p]:my-1 [&_.ProseMirror_p.is-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-empty:first-child::before]:float-left [&_.ProseMirror_p.is-empty:first-child::before]:h-0 [&_.ProseMirror_p.is-empty:first-child::before]:text-slate-400 [&_.ProseMirror_p.is-empty:first-child::before]:content-[attr(data-placeholder)]"
      />
    </div>
  );
};
