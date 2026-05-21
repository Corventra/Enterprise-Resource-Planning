const path = require('path');
const documentCenterRepo = require('../repositories/document-center.repo');
const { ValidationError } = require('../utils/validation');
const { resolveDbUploadPathToAbsolute } = require('../utils/file');

const sendError = (res, e) => {
  if (e instanceof ValidationError) {
    return res.status(400).json({ success: false, message: e.message });
  }
  // eslint-disable-next-line no-console
  console.error('[document-center.controller] error:', e);
  return res.status(500).json({ success: false, message: 'Internal server error' });
};

const getUserIdFromRequest = (req, res) => {
  const id = Number(req.user?.sub);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(401).json({ success: false, message: 'Token tidak berisi user ID yang valid.' });
    return null;
  }
  return id;
};

const resolveScope = (req, userId) => {
  const role = String(req.user?.role ?? '')
    .trim()
    .toUpperCase();
  if (role === 'BD') {
    return { processedByUserId: userId, scope: 'own_leads' };
  }
  return { processedByUserId: null, scope: 'organization' };
};

const list = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req, res);
    if (userId == null) return undefined;

    const { processedByUserId, scope } = resolveScope(req, userId);
    const items = await documentCenterRepo.listLeads(processedByUserId);
    const summary = documentCenterRepo.computeListSummary(items);

    return res.json({
      success: true,
      data: {
        items,
        summary,
        meta: { scope }
      }
    });
  } catch (e) {
    return sendError(res, e);
  }
};

const leadDetail = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req, res);
    if (userId == null) return undefined;

    const leadId = Number(req.params.leadId);
    if (!Number.isInteger(leadId) || leadId <= 0) {
      throw new ValidationError('leadId tidak valid.');
    }

    const latestOnly = String(req.query.latest_only ?? 'false').toLowerCase() === 'true';

    const { processedByUserId, scope } = resolveScope(req, userId);
    const header = await documentCenterRepo.findLeadHeader(leadId, processedByUserId);
    if (!header) {
      return res.status(404).json({ success: false, message: 'Lead tidak ditemukan atau tidak dalam akses Anda.' });
    }

    const items = await documentCenterRepo.listLeadDocuments(leadId, processedByUserId, { latestOnly });
    const { grouped, summary, total } = documentCenterRepo.categorySummaryFromItems(items);

    let lastUpdated = null;
    for (const item of items) {
      if (!item.uploaded_at) continue;
      if (!lastUpdated || item.uploaded_at > lastUpdated) lastUpdated = item.uploaded_at;
    }

    return res.json({
      success: true,
      data: {
        lead: {
          lead_id: header.lead_id,
          lead_code: header.lead_code ?? null,
          company_name: header.company_name,
          company_address: header.company_address,
          pic_name: header.pic_name,
          email: header.email,
          phone_number: header.phone_number,
          desired_services: header.desired_services,
          service_name: header.service_name ?? null,
          lead_source_label: header.lead_source_label,
          processed_by: header.processed_by ?? null,
          processed_by_name: header.processed_by_name ?? null,
          processed_at: header.processed_at ?? null,
          updated_at: header.updated_at ?? null,
          total_documents: total,
          last_updated_at: lastUpdated
        },
        categories: grouped,
        category_summary: summary,
        meta: { scope, latest_only: latestOnly }
      }
    });
  } catch (e) {
    return sendError(res, e);
  }
};

const download = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req, res);
    if (userId == null) return undefined;

    const source = String(req.query.source ?? '').trim().toUpperCase();
    const { processedByUserId } = resolveScope(req, userId);

    let filePath = null;
    let downloadName = 'document';

    if (source === 'DOCUMENT') {
      const documentId = Number(req.query.id);
      if (!Number.isInteger(documentId) || documentId <= 0) {
        throw new ValidationError('id dokumen tidak valid.');
      }
      const row = await documentCenterRepo.findDocumentForDownload(documentId, processedByUserId);
      if (!row) {
        return res.status(404).json({ success: false, message: 'Dokumen tidak ditemukan.' });
      }
      filePath = row.file_path;
      downloadName = row.file_name || row.file_path;
    } else if (source === 'INVOICE_PAYMENT') {
      const paymentId = Number(req.query.id);
      if (!Number.isInteger(paymentId) || paymentId <= 0) {
        throw new ValidationError('id pembayaran tidak valid.');
      }
      const row = await documentCenterRepo.findInvoicePaymentForDownload(paymentId, processedByUserId);
      if (!row) {
        return res.status(404).json({ success: false, message: 'Bukti pembayaran tidak ditemukan.' });
      }
      filePath = row.proof_file_path;
      downloadName = row.proof_file_name || 'bukti-pembayaran';
    } else {
      throw new ValidationError('Parameter source harus DOCUMENT atau INVOICE_PAYMENT.');
    }

    const abs = resolveDbUploadPathToAbsolute(filePath);
    if (!abs) {
      return res.status(404).json({ success: false, message: 'File tidak ditemukan di server.' });
    }

    return res.download(abs, path.basename(downloadName), (err) => {
      if (err && !res.headersSent) {
        // eslint-disable-next-line no-console
        console.error('[document-center.download]', err);
        res.status(404).json({ success: false, message: 'File tidak dapat diunduh.' });
      }
    });
  } catch (e) {
    return sendError(res, e);
  }
};

module.exports = {
  list,
  leadDetail,
  download
};
