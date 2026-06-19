const router        = require('express').Router();
const ctrl          = require('../controllers/auth.controller');
const { authenticate }  = require('../middleware/auth.middleware');
const { authLimiter }   = require('../middleware/rateLimit.middleware');
const { validate }      = require('../middleware/validate.middleware');
const {
  adminLoginRules, rmSignupRules, rmLoginRules,
  forgotPasswordRules, resetPasswordRules, changePasswordRules,
} = require('../validators/auth.validator');

// Public
router.post('/admin/login',      authLimiter, adminLoginRules,      validate, ctrl.adminLogin);
router.post('/rm/signup',                     rmSignupRules,         validate, ctrl.rmSignup);
router.post('/rm/login',         authLimiter, rmLoginRules,          validate, ctrl.rmLogin);
router.post('/refresh',                       ctrl.refreshTokens);
router.post('/forgot-password',               forgotPasswordRules,   validate, ctrl.forgotPassword);
router.post('/reset-password',                resetPasswordRules,    validate, ctrl.resetPassword);

// Protected
router.post('/logout',           authenticate, ctrl.logout);
router.post('/change-password',  authenticate, changePasswordRules, validate, ctrl.changePassword);

module.exports = router;
