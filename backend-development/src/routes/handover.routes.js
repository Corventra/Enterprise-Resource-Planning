const express = require('express');
const { authenticate } = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/require-permission');
const { uploadHandoverClientDocuments } = require('../middleware/upload-handover-client-documents');
const {
  listHandovers,
  getHandoverDetail,
  updateDraftHandover,
  submitHandover
} = require('../controllers/handover.controller');

const viewStack = [
  authenticate,
  requirePermission(['HANDOVER_MANAGE', 'HANDOVER_APPROVE'], 'any')
];

const manageStack = [
  authenticate,
  requirePermission('HANDOVER_MANAGE'),
  uploadHandoverClientDocuments
];

const router = express.Router();

router.get('/', ...viewStack, listHandovers);
router.get('/:handoverId', ...viewStack, getHandoverDetail);
router.patch('/:handoverId', ...manageStack, updateDraftHandover);
router.post('/:handoverId/submit', [authenticate, requirePermission('HANDOVER_MANAGE')], submitHandover);

module.exports = router;
