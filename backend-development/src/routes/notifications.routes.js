const express = require('express');
const { authenticate } = require('../middleware/authenticate');
const { list, unreadCount, read, readAll } = require('../controllers/notifications.controller');

const router = express.Router();

router.use(authenticate);

router.get('/', list);
router.get('/unread-count', unreadCount);
router.patch('/read-all', readAll);
router.patch('/:id/read', read);

module.exports = router;
