const { body } = require('express-validator');

const updateStatusRules = [
  body('agent_id').isInt({ min: 1 }),
  body('month_key').matches(/^\d{4}-\d{2}$/),
  body('month_label').notEmpty().trim(),
  body('commission_amount').isFloat({ min: 0 }),
  body('status').isIn(['paid', 'unpaid']),
];

module.exports = { updateStatusRules };
