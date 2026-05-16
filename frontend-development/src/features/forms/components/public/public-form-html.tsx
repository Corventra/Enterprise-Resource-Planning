interface PublicFormHtmlProps {
  html: string | null | undefined;
  className?: string;
}

export const PublicFormHtml = ({ html, className = '' }: PublicFormHtmlProps) => {
  if (!html || !html.trim()) return null;
  return (
    <div
      className={`prose prose-sm max-w-none text-[#434653] prose-p:my-2 prose-headings:text-[#191c1e] ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
