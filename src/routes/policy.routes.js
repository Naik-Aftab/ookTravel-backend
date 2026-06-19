const router              = require('express').Router();
const ctrl                = require('../controllers/policy.controller');
const { authenticate }    = require('../middleware/auth.middleware');
const { authorize }       = require('../middleware/role.middleware');
const { validate }        = require('../middleware/validate.middleware');
const { uploadPayment, uploadPolicy } = require('../middleware/upload.middleware');
const { createRequestRules, issuePolicyRules, updateStatusRules } = require('../validators/policy.validator');
const { param }           = require('express-validator');

const idRule = [param('id').isInt({ min: 1 })];

// Policy Requests
router.post('/requests',         authenticate, authorize('agent'), uploadPayment.single('payment_screenshot'), createRequestRules, validate, ctrl.createRequest);
router.get('/requests',          authenticate, authorize('admin','rm','agent'), ctrl.getAllRequests);
router.get('/requests/:id',      authenticate, authorize('admin','rm','agent'), idRule, validate, ctrl.getRequestById);
router.patch('/requests/:id/status', authenticate, authorize('admin','rm'), updateStatusRules, validate, ctrl.updateStatus);
router.post('/requests/:id/issue',   authenticate, authorize('rm'), uploadPolicy.single('policy_pdf'), idRule, issuePolicyRules, validate, ctrl.issuePolicy);

// Issued Policies
router.get('/',      authenticate, authorize('admin','rm','agent'), ctrl.getAllPolicies);
router.get('/:id',   authenticate, authorize('admin','rm','agent'), idRule, validate, ctrl.getPolicyById);

module.exports = router;
