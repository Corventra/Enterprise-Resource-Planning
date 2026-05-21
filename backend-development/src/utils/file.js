const fs = require('fs/promises');
const path = require('path');

/** Root folder `uploads` (sibling of `src`), sama dengan static di app.js */
const UPLOADS_ROOT = path.join(__dirname, '..', '..', 'uploads');

/**
 * Map path DB (`/uploads/campaigns/foo.jpg`) ke absolute path di disk.
 * Hanya path yang benar-benar di bawah `uploads/` yang valid.
 */
const resolveDbUploadPathToAbsolute = (dbPath) => {
  if (!dbPath || typeof dbPath !== 'string') return null;
  const posix = dbPath.replace(/\\/g, '/').trim();
  const noLeading = posix.replace(/^\/+/, '');
  if (!noLeading.startsWith('uploads/')) return null;

  const relative = noLeading.slice('uploads/'.length);
  const segments = relative.split('/').filter(Boolean);
  if (segments.length === 0 || segments.includes('..')) return null;

  const abs = path.resolve(UPLOADS_ROOT, ...segments);
  const rootResolved = path.resolve(UPLOADS_ROOT);
  const rel = path.relative(rootResolved, abs);
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) return null;
  if (abs === rootResolved) return null;

  return abs;
};

/**
 * Hapus file upload lama jika ada di disk dan path aman di bawah `uploads/`.
 * Tidak pernah throw; gagal unlink hanya di-log.
 */
const safeUnlinkOldUploadFile = async (dbPath) => {
  const abs = resolveDbUploadPathToAbsolute(dbPath);
  if (!abs) return;

  let st;
  try {
    st = await fs.stat(abs);
  } catch {
    return;
  }
  if (!st.isFile()) return;

  try {
    await fs.unlink(abs);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[safeUnlinkOldUploadFile] unlink gagal:', dbPath, e && e.message ? e.message : e);
  }
};

module.exports = {
  safeUnlinkOldUploadFile,
  resolveDbUploadPathToAbsolute
};
