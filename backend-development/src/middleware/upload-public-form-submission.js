const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const SUBMISSION_UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'form-submissions');

const extFromName = (name) => {
  if (!name || typeof name !== 'string') return '';
  const idx = name.lastIndexOf('.');
  if (idx < 0) return '';
  return name.slice(idx).toLowerCase();
};

const ensureUploadDir = () => {
  fs.mkdirSync(SUBMISSION_UPLOAD_DIR, { recursive: true });
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    try {
      ensureUploadDir();
      cb(null, SUBMISSION_UPLOAD_DIR);
    } catch (err) {
      cb(err);
    }
  },
  filename: (_req, file, cb) => {
    const ext = extFromName(file.originalname) || '';
    const name = `submission-${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
    files: 20
  }
});

const uploadPublicFormSubmissionFiles = (req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('multipart/form-data')) {
    return next();
  }
  upload.any()(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'Ukuran file melebihi batas unggahan.' });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ success: false, message: 'Jumlah file melebihi batas unggahan.' });
      }
      return res.status(400).json({ success: false, message: err.message || 'Gagal mengunggah file.' });
    }
    return res.status(400).json({ success: false, message: err.message || 'Gagal mengunggah file.' });
  });
};

module.exports = {
  uploadPublicFormSubmissionFiles
};
