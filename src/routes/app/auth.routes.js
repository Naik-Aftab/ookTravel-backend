const router             = require('express').Router();
const ctrl               = require('../../controllers/auth.controller');
const otpCtrl            = require('../../controllers/otp.controller');
const { authenticate }   = require('../../middleware/auth.middleware');
const { authorize }      = require('../../middleware/role.middleware');
const { authLimiter }    = require('../../middleware/rateLimit.middleware');
const { validate }       = require('../../middleware/validate.middleware');
const {
  agentSignupRules, agentLoginRules, agentResetPasswordRules,
  sendOtpRules, verifyOtpRules,
} = require('../../validators/auth.validator');

// OTP
router.post('/send-otp',   authLimiter, sendOtpRules,   validate, otpCtrl.sendOtp);
router.post('/verify-otp', authLimiter, verifyOtpRules,  validate, otpCtrl.verifyOtp);

// Auth
router.post('/reset-password', agentResetPasswordRules, validate, ctrl.agentResetPassword);
router.post('/signup',  agentSignupRules, validate, ctrl.agentSignup);
router.post('/login',   authLimiter, agentLoginRules, validate, ctrl.agentLogin);
router.post('/refresh', ctrl.refreshTokens);

// Protected
router.post('/logout',  authenticate, authorize('agent'), ctrl.logout);

module.exports = router;
