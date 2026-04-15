export const slugifyFormTitle = (title: string): string =>
  title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

export const getEffectivePublicSlug = (title: string, manualSlug?: string): string => {
  if (manualSlug && manualSlug.trim()) {
    return slugifyFormTitle(manualSlug);
  }
  return slugifyFormTitle(title || 'untitled-form');
};

export const buildPublicFormLink = (slug: string): string => `/public/forms/${slug}`;
