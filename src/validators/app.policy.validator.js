const { body } = require('express-validator');

const createRequestRules = [
  body('agent_id').isInt({ min: 1 }).withMessage('agent_id must be a positive integer'),
  body('plan_type').isIn(['individual', 'bulk']).withMessage('plan_type must be individual or bulk'),
  body('travel_date').isDate().withMessage('travel_date must be a valid date (YYYY-MM-DD)'),
  body('return_date').isDate().withMessage('return_date must be a valid date (YYYY-MM-DD)'),
  body('estimated_premium').optional().isFloat({ min: 0 }).withMessage('estimated_premium must be a non-negative number'),
  body('payment_amount').optional().isFloat({ min: 0 }).withMessage('payment_amount must be a non-negative number'),
  body('traveller_details').optional(),
];

module.exports = { createRequestRules };
