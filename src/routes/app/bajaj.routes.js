const router        = require('express').Router();
const ctrl          = require('../../controllers/bajaj.controller');
const { validate }  = require('../../middleware/validate.middleware');
const { ckycRules, proposalRules, planDetailsRules } = require('../../validators/bajaj.validator');

// POST /api/app/bajaj/ckyc — Step 1: verify CKYC, returns UUID + quote_no for proposal step
router.post('/ckyc', ckycRules, validate, ctrl.ckyc);

// POST /api/app/bajaj/proposal — Step 2: submit proposal, returns premium amount
router.post('/proposal', proposalRules, validate, ctrl.proposal);

// GET /api/app/bajaj/plan-details?planname=... — fetch plan benefits/coverage
router.get('/plan-details', planDetailsRules, validate, ctrl.planDetails);

module.exports = router;
