const express = require('express');
const { authenticate } = require('../middleware/authenticate');
const { requirePermission } = require('../middleware/require-permission');
const { list, detail, create, update, changePassword, remove } = require('../controllers/users.controller');

const router = express.Router();

// Permission-based — siapa pun yang punya USER_MANAGE bisa akses (saat ini hanya Superadmin).
router.use(authenticate, requirePermission('USER_MANAGE'));

router.get('/', list);
router.get('/:id', detail);
router.post('/', create);
router.put('/:id', update);
router.patch('/:id/password', changePassword);
router.delete('/:id', remove);

module.exports = router;
