const express = require('express');
const { authenticate } = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/require-permission');
const { list, detail, create, update, remove } = require('../controllers/departments.controller');

const router = express.Router();

router.use(authenticate, requirePermission('DEPARTMENT_MANAGE'));

router.get('/', list);
router.get('/:id', detail);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

module.exports = router;
