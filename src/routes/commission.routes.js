const router           = require('express').Router();
const ctrl             = require('../controllers/commission.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize }    = require('../middleware/role.middleware');
const { validate }     = require('../middleware/validate.middleware');
const { uploadPaymentProof } = require('../middleware/upload.middleware');
const { createPaymentRules } = require('../validators/commission.validator');
const { param }        = require('express-validator');

const idRule = [param('id').isInt({ min: 1 })];

router.get('/stats',              authenticate, authorize('admin'), ctrl.getStats);
router.get('/ledgers',            authenticate, authorize('admin'), ctrl.getAllAgentLedgers);
router.get('/ledgers/:agentId',   authenticate, authorize('admin'), ctrl.getAgentLedger);
router.get('/',                   authenticate, authorize('admin'), ctrl.getAll);
router.get('/:id',                authenticate, authorize('admin'), idRule, validate, ctrl.getOne);
router.get('/:id/payments',       authenticate, authorize('admin'), idRule, validate, ctrl.getPaymentHistory);
router.post('/payments',          authenticate, authorize('admin'), uploadPaymentProof.single('payment_proof'), createPaymentRules, validate, ctrl.createPayment);

module.exports = router;
