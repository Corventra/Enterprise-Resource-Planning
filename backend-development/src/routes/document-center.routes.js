const express = require('express');
const { authenticate } = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/require-permission');
const {
  list,
  leadDetail,
  download
} = require('../controllers/document-center.controller');

const stack = [authenticate, requirePermission('DOCUMENT_VIEW')];

const router = express.Router();

router.get('/', ...stack, list);
router.get('/download', ...stack, download);
router.get('/leads/:leadId', ...stack, leadDetail);

module.exports = router;
