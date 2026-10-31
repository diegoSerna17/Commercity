function successResponse(res, message, data = null, statusCode = 200) {
  const body = { success: true };
  if (message) body.message = message;
  if (data !== null) body.data = data;
  return res.status(statusCode).json(body);
}

function errorResponse(res, message, statusCode = 400, details = null) {
  const code =
    statusCode === 401 ? "UNAUTHORIZED"
    : statusCode === 403 ? "FORBIDDEN"
    : statusCode === 404 ? "NOT_FOUND"
    : statusCode === 409 ? "CONFLICT"
    : statusCode === 503 ? "DB_UNAVAILABLE"
    : statusCode === 400 ? "VALIDATION_ERROR"
    : "INTERNAL_ERROR";

  return res.status(statusCode).json({
    success: false,
    error: { code, message, ...(details ? { details } : {}) },
  });
}

module.exports = { successResponse, errorResponse };
