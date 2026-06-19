const { body, query } = require('express-validator');

const ckycRules = [
  body('docNumber').trim().notEmpty().withMessage('docNumber is required').toUpperCase(),
  body('dob').isDate({ format: 'YYYY-MM-DD' }).withMessage('dob must be in YYYY-MM-DD format'),
  body('userPhone').matches(/^[6-9]\d{9}$/).withMessage('Valid 10-digit Indian mobile number required'),
];

const proposalRules = [
  body('UUID').isUUID().withMessage('Valid UUID is required'),
  body('quote_no').trim().notEmpty().withMessage('quote_no is required'),
  body('user_id').notEmpty().withMessage('user_id is required'),
  body('company_id').notEmpty().withMessage('company_id is required'),
  body('plan_id').notEmpty().withMessage('plan_id is required'),
  body('docNumber').trim().notEmpty().withMessage('docNumber is required'),
  body('dob').trim().notEmpty().withMessage('dob is required'),
  body('title').trim().notEmpty().withMessage('title is required').toUpperCase(),
  body('firstName').trim().notEmpty().withMessage('firstName is required'),
  body('middleName').optional({ nullable: true }).trim(),
  body('lastName').trim().notEmpty().withMessage('lastName is required'),
  body('gender').isIn(['M', 'F']).withMessage('gender must be M or F'),
  body('maritalstatus').trim().notEmpty().withMessage('maritalstatus is required').toUpperCase(),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('userPhone').matches(/^[6-9]\d{9}$/).withMessage('Valid 10-digit Indian mobile number required'),
  body('nomineename').trim().notEmpty().withMessage('nomineename is required'),
  body('building').trim().notEmpty().withMessage('building is required'),
  body('streetname').trim().notEmpty().withMessage('streetname is required'),
  body('city').trim().notEmpty().withMessage('city is required'),
  body('state').trim().notEmpty().withMessage('state is required'),
  body('pincode').matches(/^[1-9][0-9]{5}$/).withMessage('Valid 6-digit pincode is required'),
  body('fromDate').isDate({ format: 'YYYY-MM-DD' }).withMessage('fromDate must be in YYYY-MM-DD format'),
  body('toDate').isDate({ format: 'YYYY-MM-DD' }).withMessage('toDate must be in YYYY-MM-DD format'),
];

const planDetailsRules = [
  query('planname').trim().notEmpty().withMessage('planname is required'),
];

module.exports = { ckycRules, proposalRules, planDetailsRules };
