const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const ENGAGEMENT_LETTER_UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'engagement-letters');

const ALLOWED_MIMES = new Set(['application/pdf']);

const extForMime = (mime) => {
  if (mime === 'application/pdf') return '.pdf';
  return '';
};

const ensureUploadDir = () => {
  fs.mkdirSync(ENGAGEMENT_LETTER_UPLOAD_DIR, { recursive: true });
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    try {
      ensureUploadDir();
      cb(null, ENGAGEMENT_LETTER_UPLOAD_DIR);
    } catch (err) {
      cb(err);
    }
  },
  filename: (_req, file, cb) => {
    const ext = extForMime(file.mimetype) || path.extname(file.originalname || '').toLowerCase();
    const name = `el-${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    cb(null, name);
  }
});

const fileFilter = (_req, file, cb) => {
  if (!ALLOWED_MIMES.has(file.mimetype)) {
    cb(new Error('Format dokumen tidak didukung. Gunakan PDF.'));
    return;
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }
});

const uploadEngagementLetterDocument = (req, res, next) => {
  upload.single('engagement_document')(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'Ukuran dokumen engagement letter maksimal 20 MB.' });
      }
      return res.status(400).json({ success: false, message: err.message || 'Gagal mengunggah dokumen.' });
    }
    return res.status(400).json({ success: false, message: err.message || 'Gagal mengunggah dokumen.' });
  });
};

const uploadOptionalEngagementLetterDocument = (req, res, next) => {
  upload.single('engagement_document')(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'Ukuran dokumen engagement letter maksimal 20 MB.' });
      }
      return res.status(400).json({ success: false, message: err.message || 'Gagal mengunggah dokumen.' });
    }
    return res.status(400).json({ success: false, message: err.message || 'Gagal mengunggah dokumen.' });
  });
};

module.exports = {
  uploadEngagementLetterDocument,
  uploadOptionalEngagementLetterDocument
};
