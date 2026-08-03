const router  = require('express').Router();
const ctrl    = require('../../controllers/app.notification.controller');
const { validate } = require('../../middleware/validate.middleware');
const { body }      = require('express-validator');

const tokenRules = [
  body('agent_id').isInt({ min: 1 }).withMessage('agent_id is required'),
  body('expo_push_token').trim().notEmpty().withMessage('expo_push_token is required'),
  body('platform').isIn(['ios', 'android']).withMessage('platform must be ios or android'),
];

const untokenRules = [
  body('agent_id').isInt({ min: 1 }).withMessage('agent_id is required'),
  body('expo_push_token').trim().notEmpty().withMessage('expo_push_token is required'),
];

const agentIdBodyRule = [body('agent_id').isInt({ min: 1 }).withMessage('agent_id is required')];

// GET /api/app/notification?agent_id=&page=&limit=
router.get('/', ctrl.getAll);

// GET /api/app/notification/unread-count?agent_id=
router.get('/unread-count', ctrl.unreadCount);

// PATCH /api/app/notification/:id/read
router.patch('/:id/read', agentIdBodyRule, validate, ctrl.markRead);

// PATCH /api/app/notification/mark-all-read
router.patch('/mark-all-read', agentIdBodyRule, validate, ctrl.markAllRead);

// POST /api/app/notification/register-token
router.post('/register-token', tokenRules, validate, ctrl.registerToken);

// DELETE /api/app/notification/register-token
router.delete('/register-token', untokenRules, validate, ctrl.unregisterToken);

module.exports = router;
