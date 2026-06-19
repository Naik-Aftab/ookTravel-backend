const { body, param } = require('express-validator');

const createRequestRules = [
  body('traveler_name').trim().isLength({ min: 2, max: 100 }),
  body('destination').trim().notEmpty(),
  body('travel_date').isDate(),
  body('return_date').isDate(),
  body('num_travelers').optional().isInt({ min: 1, max: 99 }),
  body('plan_type').optional().trim(),
  body('estimated_premium').optional().isFloat({ min: 0 }),
  body('payment_amount').optional().isFloat({ min: 0 }),
  body('payment_reference').optional().trim(),
];

const issuePolicyRules = [
  body('policy_number').trim().notEmpty(),
  body('provider_name').trim().notEmpty(),
  body('plan_name').trim().notEmpty(),
  body('premium_amount').isFloat({ min: 1 }),
  body('issue_date').isDate(),
  body('expiry_date').isDate(),
];

const updateStatusRules = [
  param('id').isInt({ min: 1 }),
  body('status').isIn(['submitted','assigned','under_review','issued','expired','claimed','rejected']),
  body('remarks').optional().trim(),
];

module.exports = { createRequestRules, issuePolicyRules, updateStatusRules };
