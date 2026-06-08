const express = require('express');
const { authenticate } = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/require-permission');
const {
  listTemplates,
  getTemplate,
  getDefaultByServiceLine,
  updateTemplate
} = require('../controllers/task-templates.controller');

// Read: siapa pun yang punya PROJECT_VIEW boleh baca (PM bisa preview template
// dari halaman project; CEO/COO baca dari Settings → Task Templates).
const readStack = [
  authenticate,
  requirePermission(['PROJECT_VIEW', 'TASK_TEMPLATE_MANAGE'], 'any')
];
const manageStack = [authenticate, requirePermission('TASK_TEMPLATE_MANAGE')];

const router = express.Router();

router.get('/', ...readStack, listTemplates);
// /default/:serviceLine harus didefinisikan SEBELUM /:templateId supaya tidak
// di-shadow (Express akan match '/default/...' duluan).
router.get('/default/:serviceLine', ...readStack, getDefaultByServiceLine);
router.get('/:templateId', ...readStack, getTemplate);
router.put('/:templateId', ...manageStack, updateTemplate);

module.exports = router;
