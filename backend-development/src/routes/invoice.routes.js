const express = require('express');
const { authenticate } = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/require-permission');
const {
  listInvoices,
  getInvoiceDetail,
  generateInvoiceTerm,
  markTermSentToClient,
  confirmInvoiceTermTrigger,
  createInvoiceTermPayment
} = require('../controllers/invoice.controller');
const { uploadInvoicePaymentProof } = require('../middleware/upload-invoice-payment-proof');

const router = express.Router();

const viewStack = [authenticate, requirePermission(['INVOICE_VIEW', 'INVOICE_MANAGE'], 'any')];
const manageStack = [authenticate, requirePermission('INVOICE_MANAGE')];

router.get('/', ...viewStack, listInvoices);
router.get('/:accountId', ...viewStack, getInvoiceDetail);
router.post('/terms/:invoiceId/generate', ...manageStack, generateInvoiceTerm);
router.post('/terms/:invoiceId/confirm-trigger', ...manageStack, confirmInvoiceTermTrigger);
router.post('/terms/:invoiceId/sent', ...manageStack, markTermSentToClient);
router.post(
  '/terms/:invoiceId/payments',
  ...manageStack,
  uploadInvoicePaymentProof,
  createInvoiceTermPayment
);

module.exports = router;
