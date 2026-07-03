const router           = require('express').Router();
const ctrl             = require('../controllers/commission.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize }    = require('../middleware/role.middleware');
const { validate }     = require('../middleware/validate.middleware');
const { updateStatusRules } = require('../validators/commission.validator');
const { param }        = require('express-validator');

router.get('/stats',              authenticate, authorize('admin'), ctrl.getStats);
router.get('/monthly-ledgers',    authenticate, authorize('admin'), ctrl.getMonthlyLedgers);
router.get('/ledgers/:agentId',   authenticate, authorize('admin'), ctrl.getAgentLedger);
router.get('/',                   authenticate, authorize('admin'), ctrl.getAll);
router.patch('/status',           authenticate, authorize('admin'), updateStatusRules, validate, ctrl.updateStatus);

module.exports = router;
