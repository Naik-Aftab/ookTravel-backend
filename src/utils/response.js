const logger = require('./logger');

function successResponse(res, data = null, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

function errorResponse(res, message = 'Something went wrong', statusCode = 500, errors = null) {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
}

function paginatedResponse(res, data, total, page, limit, message = 'Success') {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      total,
      page:       parseInt(page),
      limit:      parseInt(limit),
      totalPages: Math.ceil(total / limit),
    },
  });
}

function errorHandler(err, req, res, next) {
  logger.error({ message: err.message, stack: err.stack, url: req.url });

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return errorResponse(res, 'Invalid or expired token', 401);
  }
  if (err.code === 'ER_DUP_ENTRY') {
    return errorResponse(res, 'Duplicate entry — record already exists', 409);
  }

  const status = err.statusCode || 500;
  return errorResponse(res, err.message || 'Internal server error', status);
}

module.exports = { successResponse, errorResponse, paginatedResponse, errorHandler };
