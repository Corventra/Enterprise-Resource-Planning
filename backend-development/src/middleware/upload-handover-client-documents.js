const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const HANDOVER_UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'handovers');

const ALLOWED_MIMES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png'
]);

const extForMime = (mime) => {
  const map = {
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'application/vnd.ms-excel': '.xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
    'image/jpeg': '.jpg',
    'image/png': '.png'
  };
  return map[mime] || '';
};

const ensureUploadDir = () => {
  fs.mkdirSync(HANDOVER_UPLOAD_DIR, { recursive: true });
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    try {
      ensureUploadDir();
      cb(null, HANDOVER_UPLOAD_DIR);
    } catch (err) {
      cb(err);
    }
  },
  filename: (_req, file, cb) => {
    const ext = extForMime(file.mimetype) || path.extname(file.originalname || '').toLowerCase();
    const name = `handover-doc-${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    cb(null, name);
  }
});

const fileFilter = (_req, file, cb) => {
  if (!ALLOWED_MIMES.has(file.mimetype)) {
    cb(new Error('Format dokumen tidak didukung. Gunakan PDF, Word, Excel, atau gambar JPG/PNG.'));
    return;
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024, files: 10 }
});

const uploadHandoverClientDocuments = (req, res, next) => {
  upload.array('client_documents', 10)(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'Ukuran dokumen maksimal 20 MB per file.' });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ success: false, message: 'Maksimal 10 dokumen per unggahan.' });
      }
      return res.status(400).json({ success: false, message: err.message || 'Gagal mengunggah dokumen.' });
    }
    return res.status(400).json({ success: false, message: err.message || 'Gagal mengunggah dokumen.' });
  });
};

module.exports = { uploadHandoverClientDocuments, HANDOVER_UPLOAD_DIR };
