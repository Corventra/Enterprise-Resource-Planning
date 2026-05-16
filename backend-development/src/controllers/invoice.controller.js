const invoiceRepo = require('../repositories/invoice.repo');
const invoiceWriteRepo = require('../repositories/invoice-write.repo');

const sendError = (res, e) => {
  // eslint-disable-next-line no-console
  console.error('[invoice.controller] error:', e);
  return res.status(500).json({ success: false, message: 'Internal server error' });
};

const parseAccountIdParam = (value) => {
  if (value === undefined || value === null) return null;
  const raw = String(value).trim();
  if (raw.length === 0 || !/^\d+$/.test(raw)) return null;
  const id = Number(raw);
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  return id;
};

const listInvoices = async (req, res) => {
  try {
    const items = await invoiceRepo.findInvoiceAccounts();
    return res.json({ success: true, data: { items } });
  } catch (e) {
    return sendError(res, e);
  }
};

const getInvoiceDetail = async (req, res) => {
  const accountId = parseAccountIdParam(req.params.accountId);
  if (accountId == null) {
    return res.status(400).json({ success: false, message: 'Invoice account ID tidak valid.' });
  }

  try {
    const result = await invoiceRepo.findInvoiceAccountDetail(accountId);
    if (!result.ok) {
      if (result.reason === 'NOT_FOUND') {
        return res.status(404).json({ success: false, message: 'Invoice tidak ditemukan.' });
      }
      return res.status(400).json({ success: false, message: 'Invoice account ID tidak valid.' });
    }
    return res.json({ success: true, data: result.data });
  } catch (e) {
    return sendError(res, e);
  }
};

const parseInvoiceIdParam = (value) => {
  if (value === undefined || value === null) return null;
  const raw = String(value).trim();
  if (raw.length === 0 || !/^\d+$/.test(raw)) return null;
  const id = Number(raw);
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  return id;
};

const mapGenerateFailure = (res, result) => {
  switch (result.reason) {
    case 'INVALID_ID':
      return res.status(400).json({ success: false, message: 'Invoice term ID tidak valid.' });
    case 'NOT_FOUND':
      return res.status(404).json({ success: false, message: 'Termin invoice tidak ditemukan.' });
    case 'NOT_READY_TO_ISSUE':
      return res.status(409).json({
        success: false,
        message: 'Invoice hanya dapat digenerate saat status termin READY_TO_ISSUE.'
      });
    case 'ALREADY_GENERATED':
      return res.status(409).json({
        success: false,
        message: 'Nomor invoice untuk termin ini sudah ada.'
      });
    case 'INVOICE_NUMBER_COLLISION':
      return res.status(409).json({
        success: false,
        message: 'Nomor invoice bentrok. Silakan coba lagi.'
      });
    default:
      return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const generateInvoiceTerm = async (req, res) => {
  const invoiceId = parseInvoiceIdParam(req.params.invoiceId);
  if (invoiceId == null) {
    return res.status(400).json({ success: false, message: 'Invoice term ID tidak valid.' });
  }

  try {
    const userId = Number(req.user?.sub);
    const result = await invoiceWriteRepo.generateInvoiceTerm(invoiceId, userId);
    if (!result.ok) {
      return mapGenerateFailure(res, result);
    }
    return res.json({ success: true, data: result.data });
  } catch (e) {
    return sendError(res, e);
  }
};

const mapSentFailure = (res, result) => {
  switch (result.reason) {
    case 'INVALID_ID':
      return res.status(400).json({ success: false, message: 'Invoice term ID tidak valid.' });
    case 'NOT_FOUND':
      return res.status(404).json({ success: false, message: 'Termin invoice tidak ditemukan.' });
    case 'NOT_ISSUED':
      return res.status(409).json({
        success: false,
        message: 'Invoice hanya dapat dikirim ke klien saat status termin ISSUED.'
      });
    default:
      return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const markTermSentToClient = async (req, res) => {
  const invoiceId = parseInvoiceIdParam(req.params.invoiceId);
  if (invoiceId == null) {
    return res.status(400).json({ success: false, message: 'Invoice term ID tidak valid.' });
  }

  const userId = Number(req.user?.sub);

  try {
    const result = await invoiceWriteRepo.markTermSentToClient(invoiceId, userId);
    if (!result.ok) {
      return mapSentFailure(res, result);
    }
    return res.json({ success: true, data: result.data });
  } catch (e) {
    return sendError(res, e);
  }
};

const mapPaymentFailure = (res, result) => {
  switch (result.reason) {
    case 'INVALID_ID':
      return res.status(400).json({ success: false, message: 'Invoice term ID tidak valid.' });
    case 'NOT_FOUND':
      return res.status(404).json({ success: false, message: 'Termin invoice tidak ditemukan.' });
    case 'NOT_AWAITING_PAYMENT':
      return res.status(409).json({
        success: false,
        message: 'Bukti pembayaran hanya dapat diunggah saat status termin SENT atau OVERDUE.'
      });
    case 'INVALID_PAYMENT_METHOD':
      return res.status(400).json({ success: false, message: 'Metode pembayaran tidak valid.' });
    case 'INVALID_TRANSACTION_DATE':
      return res.status(400).json({ success: false, message: 'Tanggal transaksi harus format YYYY-MM-DD.' });
    case 'INVALID_AMOUNT':
      return res.status(400).json({ success: false, message: 'Jumlah diterima harus lebih dari 0.' });
    default:
      return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const mapConfirmTriggerFailure = (res, result) => {
  switch (result.reason) {
    case 'INVALID_ID':
      return res.status(400).json({ success: false, message: 'Invoice term ID tidak valid.' });
    case 'NOT_FOUND':
      return res.status(404).json({ success: false, message: 'Termin invoice tidak ditemukan.' });
    case 'UNAUTHORIZED':
      return res.status(401).json({ success: false, message: 'Pengguna tidak terautentikasi.' });
    case 'NOT_TRIGGER_TERM':
      return res.status(409).json({
        success: false,
        message: 'Konfirmasi trigger hanya untuk termin FINAL / project completion.'
      });
    case 'NOT_DRAFT':
      return res.status(409).json({
        success: false,
        message: 'Trigger hanya dapat dikonfirmasi saat status termin masih DRAFT.'
      });
    default:
      return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const confirmInvoiceTermTrigger = async (req, res) => {
  const invoiceId = parseInvoiceIdParam(req.params.invoiceId);
  if (invoiceId == null) {
    return res.status(400).json({ success: false, message: 'Invoice term ID tidak valid.' });
  }

  const userId = Number(req.user?.sub);
  const triggerReferenceValue = req.body?.trigger_reference_value;

  try {
    const result = await invoiceWriteRepo.confirmInvoiceTermTrigger(
      invoiceId,
      userId,
      triggerReferenceValue
    );
    if (!result.ok) {
      return mapConfirmTriggerFailure(res, result);
    }
    return res.json({ success: true, data: result.data });
  } catch (e) {
    return sendError(res, e);
  }
};

const createInvoiceTermPayment = async (req, res) => {
  const invoiceId = parseInvoiceIdParam(req.params.invoiceId);
  if (invoiceId == null) {
    return res.status(400).json({ success: false, message: 'Invoice term ID tidak valid.' });
  }

  const userId = Number(req.user?.sub);

  try {
    const result = await invoiceWriteRepo.createInvoiceTermPayment(
      invoiceId,
      req.body ?? {},
      req.file,
      userId
    );
    if (!result.ok) {
      return mapPaymentFailure(res, result);
    }
    return res.json({ success: true, data: result.data });
  } catch (e) {
    return sendError(res, e);
  }
};

module.exports = {
  listInvoices,
  getInvoiceDetail,
  generateInvoiceTerm,
  markTermSentToClient,
  confirmInvoiceTermTrigger,
  createInvoiceTermPayment
};
