/**
 * Slug aman untuk segment link_code: lowercase, non-alphanumeric → dash, dipotong.
 */
function titleToLinkSlug(title, maxLen = 72) {
  if (!title || typeof title !== 'string') return 'form';
  let s = title
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  s = s.replace(/[^a-z0-9]+/g, '-');
  s = s.replace(/^-+|-+$/g, '');
  if (!s) return 'form';
  if (s.length > maxLen) {
    s = s.slice(0, maxLen).replace(/-+$/g, '') || 'form';
  }
  return s;
}

/**
 * Base URL untuk halaman publik form (bukan API).
 * Prioritas: PUBLIC_FORM_BASE_URL → FRONTEND_ORIGIN → localhost dev.
 */
function getPublicFormBaseUrl() {
  const raw =
    process.env.PUBLIC_FORM_BASE_URL ||
    process.env.FRONTEND_ORIGIN ||
    'http://localhost:5173';
  return String(raw).replace(/\/$/, '');
}

function buildPublicFormUrl(linkCode) {
  const base = getPublicFormBaseUrl();
  const code = encodeURIComponent(linkCode);
  return `${base}/forms/public/${code}`;
}

module.exports = {
  titleToLinkSlug,
  getPublicFormBaseUrl,
  buildPublicFormUrl
};
