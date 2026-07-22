const { body } = require('express-validator');

const adminLoginRules = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

const rmSignupRules = [
  body('full_name').trim().isLength({ min: 2, max: 100 }),
  body('email').isEmail().normalizeEmail(),
  body('mobile').matches(/^[6-9]\d{9}$/),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
];

const rmLoginRules = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

const forgotPasswordRules = [
  body('email').isEmail().normalizeEmail(),
];

const resetPasswordRules = [
  body('token').notEmpty(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
];

const changePasswordRules = [
  body('old_password').notEmpty(),
  body('new_password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
];

const sendOtpRules = [
  body('phoneNumber').matches(/^[6-9]\d{9}$/).withMessage('Valid 10-digit Indian mobile number required'),
  body('purpose').isIn(['signup', 'forgot_password']).withMessage('purpose must be signup or forgot_password'),
];

const verifyOtpRules = [
  body('phoneNumber').matches(/^[6-9]\d{9}$/).withMessage('Valid 10-digit Indian mobile number required'),
  body('otp').isLength({ min: 6, max: 6 }).isNumeric().withMessage('OTP must be 6 digits'),
  body('purpose').isIn(['signup', 'forgot_password']).withMessage('purpose must be signup or forgot_password'),
];

const agentSignupRules = [
  body('fullName').trim().isLength({ min: 2, max: 100 }).withMessage('Full name must be 2-100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('phoneNumber').matches(/^[6-9]\d{9}$/).withMessage('Valid 10-digit Indian mobile number required'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Password must contain uppercase, lowercase, number and special character'),
  body('confirmPassword').custom((val, { req }) => {
    if (val !== req.body.password) throw new Error('Passwords do not match');
    return true;
  }),
];

const agentLoginRules = [
  body('identifier')
    .trim()
    .notEmpty().withMessage('Email or mobile number is required')
    .custom((value) => {
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      const isMobile = /^[6-9]\d{9}$/.test(value);
      if (!isEmail && !isMobile) throw new Error('Enter a valid email or 10-digit mobile number');
      return true;
    }),
  body('password').notEmpty(),
];

const agentResetPasswordRules = [
  body('mobile').matches(/^[6-9]\d{9}$/).withMessage('Valid 10-digit Indian mobile number required'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Password must contain uppercase, lowercase, number and special character'),
  body('confirmPassword').custom((val, { req }) => {
    if (val !== req.body.newPassword) throw new Error('Passwords do not match');
    return true;
  }),
];

module.exports = {
  adminLoginRules,
  rmSignupRules,
  rmLoginRules,
  agentSignupRules,
  agentLoginRules,
  agentResetPasswordRules,
  sendOtpRules,
  verifyOtpRules,
  forgotPasswordRules,
  resetPasswordRules,
  changePasswordRules,
};
