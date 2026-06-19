const { errorResponse } = require('../utils/response');

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return errorResponse(res, 'Access denied — insufficient permissions', 403);
    }
    next();
  };
}

module.exports = { authorize };
