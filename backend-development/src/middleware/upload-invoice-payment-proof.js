const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const INVOICE_UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'invoices');

const ALLOWED_MIMES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp'
]);

const extForMime = (mime) => {
  const map = {
    'application/pdf': '.pdf',
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp'
  };
  return map[mime] || '';
};

const ensureUploadDir = () => {
  fs.mkdirSync(INVOICE_UPLOAD_DIR, { recursive: true });
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    try {
      ensureUploadDir();
      cb(null, INVOICE_UPLOAD_DIR);
    } catch (err) {
      cb(err);
    }
  },
  filename: (_req, file, cb) => {
    const ext = extForMime(file.mimetype) || path.extname(file.originalname || '').toLowerCase();
    const name = `payment-proof-${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    cb(null, name);
  }
});

const fileFilter = (_req, file, cb) => {
  if (!ALLOWED_MIMES.has(file.mimetype)) {
    cb(new Error('Format bukti pembayaran tidak didukung. Gunakan PDF atau gambar JPG/PNG.'));
    return;
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

const uploadInvoicePaymentProof = (req, res, next) => {
  upload.single('proof_file')(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'Ukuran bukti pembayaran maksimal 10 MB.' });
      }
      return res.status(400).json({ success: false, message: err.message });
    }
    return res.status(400).json({ success: false, message: err.message || 'Upload gagal.' });
  });
};

module.exports = { uploadInvoicePaymentProof, INVOICE_UPLOAD_DIR };
