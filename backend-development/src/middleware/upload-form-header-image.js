const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

/** Absolute dir: backend-development/uploads/forms */
const FORM_HEADER_UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'forms');

const ALLOWED_MIMES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

const extForMime = (mime) => {
  if (mime === 'image/png') return '.png';
  if (mime === 'image/webp') return '.webp';
  if (mime === 'image/jpeg' || mime === 'image/jpg') return '.jpg';
  return '';
};

const ensureUploadDir = () => {
  fs.mkdirSync(FORM_HEADER_UPLOAD_DIR, { recursive: true });
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    try {
      ensureUploadDir();
      cb(null, FORM_HEADER_UPLOAD_DIR);
    } catch (err) {
      cb(err);
    }
  },
  filename: (_req, file, cb) => {
    const ext = extForMime(file.mimetype);
    const name = `form-header-${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    cb(null, name);
  }
});

const fileFilter = (_req, file, cb) => {
  if (!ALLOWED_MIMES.has(file.mimetype)) {
    cb(new Error('Format gambar tidak didukung. Gunakan JPEG, PNG, atau WebP.'));
    return;
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }
});

/**
 * Optional single file field `image`. Non-multipart requests pass through unchanged.
 */
const uploadFormHeaderImage = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'Ukuran file gambar maksimal 2 MB.' });
      }
      return res.status(400).json({ success: false, message: err.message || 'Gagal mengunggah gambar.' });
    }
    return res.status(400).json({ success: false, message: err.message || 'Gagal mengunggah gambar.' });
  });
};

module.exports = {
  uploadFormHeaderImage
};
