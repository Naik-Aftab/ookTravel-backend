const router           = require('express').Router();
const ctrl             = require('../controllers/notification.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/',               ctrl.getAll);
router.get('/unread-count',   ctrl.unreadCount);
router.patch('/:id/read',     ctrl.markRead);
router.patch('/mark-all-read',ctrl.markAllRead);

module.exports = router;
