const router           = require('express').Router();
const ctrl             = require('../controllers/notification.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize }    = require('../middleware/role.middleware');
const { validate }     = require('../middleware/validate.middleware');
const { body }         = require('express-validator');

const sendRules = [
  body('title').trim().isLength({ min: 2, max: 200 }).withMessage('Title must be 2-200 characters'),
  body('message').trim().isLength({ min: 2 }).withMessage('Message is required'),
  body('category').isIn(['marketing', 'kyc_update', 'commission_paid', 'general']).withMessage('Invalid category'),
  body('target_type').isIn(['single', 'all', 'status', 'kyc_status', 'rm']).withMessage('Invalid target_type'),
  body('target_value').custom((value, { req }) => {
    if (req.body.target_type !== 'all' && (value === undefined || value === null || value === '')) {
      throw new Error('target_value is required for this target_type');
    }
    return true;
  }),
];

router.use(authenticate);

router.get('/',               ctrl.getAll);
router.get('/unread-count',   ctrl.unreadCount);
router.patch('/:id/read',     ctrl.markRead);
router.patch('/mark-all-read',ctrl.markAllRead);

// Admin: compose/send a notification to one or many agents, and view send history
router.post('/send', authorize('admin'), sendRules, validate, ctrl.send);
router.get('/sent',  authorize('admin'), ctrl.sentHistory);

module.exports = router;
