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

const manageStack = [authenticate, requirePermission('INVOICE_MANAGE')];

router.get('/', ...manageStack, listInvoices);
router.post('/terms/:invoiceId/generate', ...manageStack, generateInvoiceTerm);
router.post('/terms/:invoiceId/confirm-trigger', ...manageStack, confirmInvoiceTermTrigger);
router.post('/terms/:invoiceId/sent', ...manageStack, markTermSentToClient);
router.post(
  '/terms/:invoiceId/payments',
  ...manageStack,
  uploadInvoicePaymentProof,
  createInvoiceTermPayment
);
router.get('/:accountId', ...manageStack, getInvoiceDetail);

module.exports = router;
