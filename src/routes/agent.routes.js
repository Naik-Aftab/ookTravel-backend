const router           = require('express').Router();
const ctrl             = require('../controllers/agent.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize }    = require('../middleware/role.middleware');
const { validate }     = require('../middleware/validate.middleware');
const { param, body }  = require('express-validator');

const idRule   = [param('id').isInt({ min: 1 })];
const rmIdRule = [body('rm_id').isInt({ min: 1 }).withMessage('rm_id must be a positive integer')];

// Admin and RM can list/view agents
router.get('/',       authenticate, authorize('admin','rm'), ctrl.getAll);
router.get('/:id',    authenticate, authorize('admin','rm'), idRule, validate, ctrl.getOne);

// Bulk assign — must be before /:id routes
router.post('/assign-all-rm', authenticate, authorize('admin'), rmIdRule, validate, ctrl.assignAllToRm);

// Admin-only management
router.post('/:id/assign-rm',   authenticate, authorize('admin'), idRule, validate, ctrl.assignRm);
router.post('/:id/transfer',    authenticate, authorize('admin'), idRule, validate, ctrl.transferAgent);
router.post('/:id/activate',    authenticate, authorize('admin'), idRule, validate, ctrl.activate);
router.post('/:id/suspend',     authenticate, authorize('admin'), idRule, validate, ctrl.suspend);
router.patch('/:id/kyc',        authenticate, authorize('admin'), idRule, validate, ctrl.updateKyc);

module.exports = router;
