const { verifyAccessToken }  = require('../config/jwt');
const { errorResponse }      = require('../utils/response');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, 'Access token required', 401);
  }

  try {
    const token   = authHeader.split(' ')[1];
    req.user      = verifyAccessToken(token);
    next();
  } catch {
    return errorResponse(res, 'Invalid or expired token', 401);
  }
}

module.exports = { authenticate };
