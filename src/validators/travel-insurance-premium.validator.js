const { body } = require('express-validator');

const premiumRules = [
  body('no_of_days').isInt({ min: 1 }).withMessage('no_of_days must be a positive integer'),
];

module.exports = { premiumRules };
