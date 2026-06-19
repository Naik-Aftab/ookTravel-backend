const rateLimit = require('express-rate-limit');

const windowMs = (parseInt(process.env.RATE_LIMIT_WINDOW) || 15) * 60 * 1000;
const max      = parseInt(process.env.RATE_LIMIT_MAX) || 100;

const rateLimiter = rateLimit({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Too many requests — please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      20,
  message:  { success: false, message: 'Too many login attempts — please try again later.' },
});

module.exports = rateLimiter;
module.exports.authLimiter = authLimiter;
