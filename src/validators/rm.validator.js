const { body, param } = require('express-validator');

const updateRmRules = [
  body('full_name').optional().trim().isLength({ min: 2, max: 100 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('mobile').optional().matches(/^[6-9]\d{9}$/),
];

const rmIdRule = [
  param('id').isInt({ min: 1 }),
];

module.exports = { updateRmRules, rmIdRule };
