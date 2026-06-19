const { body, param } = require('express-validator');

const createPaymentRules = [
  body('commission_id').isInt({ min: 1 }),
  body('payment_amount').isFloat({ min: 0.01 }),
  body('payment_date').isDate(),
  body('utr_number').optional().trim(),
  body('remarks').optional().trim(),
];

module.exports = { createPaymentRules };
