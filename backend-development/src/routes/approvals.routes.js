const express = require('express');
const { authenticate } = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/require-permission');
const {
  listPending,
  getDetail,
  approve,
  reject
} = require('../controllers/proposal-approvals.controller');

const approvalStack = [authenticate, requirePermission('PROPOSAL_APPROVE')];

const router = express.Router();

router.get('/proposals/pending', ...approvalStack, listPending);
router.get('/proposals/:proposalId', ...approvalStack, getDetail);
router.post('/proposals/:proposalId/approve', ...approvalStack, approve);
router.post('/proposals/:proposalId/reject', ...approvalStack, reject);

module.exports = router;
