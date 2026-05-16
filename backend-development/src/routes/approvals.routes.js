const express = require('express');
const { authenticate } = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/require-permission');
const {
  listPending,
  getDetail,
  approve,
  reject
} = require('../controllers/proposal-approvals.controller');
const {
  listPending: listPendingEngagementLetters,
  getDetail: getEngagementLetterApprovalDetail,
  approve: approveEngagementLetter,
  reject: rejectEngagementLetter
} = require('../controllers/engagement-letter-approvals.controller');
const {
  listPending: listPendingHandovers,
  getDetail: getHandoverApprovalDetail,
  approve: approveHandover,
  reject: rejectHandover
} = require('../controllers/handover-approvals.controller');

const approvalStack = [authenticate, requirePermission('PROPOSAL_APPROVE')];
const engagementLetterApprovalStack = [authenticate, requirePermission('ENGAGEMENT_LETTER_APPROVE')];
const handoverApprovalStack = [authenticate, requirePermission('HANDOVER_APPROVE')];

const router = express.Router();

router.get('/handovers/pending', ...handoverApprovalStack, listPendingHandovers);
router.get('/handovers/:handoverId', ...handoverApprovalStack, getHandoverApprovalDetail);
router.post('/handovers/:handoverId/approve', ...handoverApprovalStack, approveHandover);
router.post('/handovers/:handoverId/reject', ...handoverApprovalStack, rejectHandover);

router.get('/engagement-letters/pending', ...engagementLetterApprovalStack, listPendingEngagementLetters);
router.post('/engagement-letters/:engagementId/approve', ...engagementLetterApprovalStack, approveEngagementLetter);
router.post('/engagement-letters/:engagementId/reject', ...engagementLetterApprovalStack, rejectEngagementLetter);
router.get('/engagement-letters/:engagementId', ...engagementLetterApprovalStack, getEngagementLetterApprovalDetail);

router.get('/proposals/pending', ...approvalStack, listPending);
router.get('/proposals/:proposalId', ...approvalStack, getDetail);
router.post('/proposals/:proposalId/approve', ...approvalStack, approve);
router.post('/proposals/:proposalId/reject', ...approvalStack, reject);

module.exports = router;
