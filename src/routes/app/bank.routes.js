const router   = require('express').Router();
const ctrl     = require('../../controllers/bank.controller');
const { validate } = require('../../middleware/validate.middleware');
const { body } = require('express-validator');

const bankDetailsRules = [
  body('agent_id').isInt({ min: 1 }).withMessage('agent_id is required'),
  body('account_holder_name').trim().notEmpty().withMessage('Account holder name is required'),
  body('bank_name').trim().notEmpty().withMessage('Bank name is required'),
  body('account_number').trim().notEmpty().withMessage('Account number is required'),
  body('ifsc_code')
    .trim()
    .toUpperCase()
    .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/)
    .withMessage('Invalid IFSC code format (e.g. SBIN0001234)'),
  body('branch_name').trim().notEmpty().withMessage('Branch name is required'),
  body('pan_card_number')
    .trim()
    .toUpperCase()
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
    .withMessage('Invalid PAN card format (e.g. ABCDE1234F)'),
];

// POST /api/app/bank  — create bank details
router.post('/', bankDetailsRules, validate, ctrl.saveBankDetails);

// PUT /api/app/bank   — edit bank details
router.put('/', bankDetailsRules, validate, ctrl.editBankDetails);

module.exports = router;
