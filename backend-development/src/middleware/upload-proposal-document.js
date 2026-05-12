const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const PROPOSAL_UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'proposals');

const ALLOWED_MIMES = new Set(['application/pdf']);

const extForMime = (mime) => {
  if (mime === 'application/pdf') return '.pdf';
  return '';
};

const ensureUploadDir = () => {
  fs.mkdirSync(PROPOSAL_UPLOAD_DIR, { recursive: true });
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    try {
      ensureUploadDir();
      cb(null, PROPOSAL_UPLOAD_DIR);
    } catch (err) {
      cb(err);
    }
  },
  filename: (_req, file, cb) => {
    const ext = extForMime(file.mimetype) || path.extname(file.originalname || '').toLowerCase();
    const name = `proposal-${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
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

const uploadProposalDocument = (req, res, next) => {
  upload.single('proposal_document')(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'Ukuran dokumen proposal maksimal 20 MB.' });
      }
      return res.status(400).json({ success: false, message: err.message || 'Gagal mengunggah dokumen proposal.' });
    }
    return res.status(400).json({ success: false, message: err.message || 'Gagal mengunggah dokumen proposal.' });
  });
};

const uploadOptionalProposalDocument = (req, res, next) => {
  upload.single('proposal_document')(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'Ukuran dokumen proposal maksimal 20 MB.' });
      }
      return res.status(400).json({ success: false, message: err.message || 'Gagal mengunggah dokumen proposal.' });
    }
    return res.status(400).json({ success: false, message: err.message || 'Gagal mengunggah dokumen proposal.' });
  });
};

module.exports = {
  uploadProposalDocument,
  uploadOptionalProposalDocument
};
