const router       = require('express').Router();
const ctrl         = require('../../controllers/travel-insurance-premium.controller');
const { validate } = require('../../middleware/validate.middleware');
const { premiumRules } = require('../../validators/travel-insurance-premium.validator');

// POST /api/app/travel-insurance/premium — static premium lookup by no_of_days
router.post('/premium', premiumRules, validate, ctrl.getPremium);

module.exports = router;
