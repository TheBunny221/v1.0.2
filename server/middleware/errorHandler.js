import logger from "../utils/logger.js";

// Map internal errors to safe error codes and user-friendly messages
const mapErrorToResponse = (err) => {
  // Default
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";
  let errorCode = err.errorCode || "SERVER_ERROR";

  // Known cases
  if (err.name === "CastError") {
    statusCode = 404;
    message = "Resource not found";
    errorCode = "RESOURCE_NOT_FOUND";
  }

  if (err.code === 11000) {
    const field = err.keyValue ? Object.keys(err.keyValue)[0] : "resource";
    statusCode = 400;
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    errorCode = "DUPLICATE_RESOURCE";
  }

  if (err.name === "ValidationError") {
    statusCode = 422;
    try {
      const details = Object.values(err.errors).map((val) => val.message);
      message = details.join(", ");
    } catch {}
    errorCode = "VALIDATION_ERROR";
  }

  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid authentication token";
    errorCode = "TOKEN_INVALID";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Session expired. Please login again.";
    errorCode = "TOKEN_EXPIRED";
  }

  if (err.code === "LIMIT_FILE_SIZE") {
    statusCode = 400;
    message = "File too large";
    errorCode = "FILE_TOO_LARGE";
  }

  if (err.code === "LIMIT_FILE_COUNT") {
    statusCode = 400;
    message = "Too many files";
    errorCode = "TOO_MANY_FILES";
  }

  if (err.code === "ENOTFOUND" || err.code === "ECONNREFUSED") {
    statusCode = 503;
    message = "Service temporarily unavailable";
    errorCode = "SERVICE_UNAVAILABLE";
  }

  return { statusCode, message, errorCode };
};

// Error handler middleware
export const errorHandler = (err, req, res, next) => {
  const { statusCode, message, errorCode } = mapErrorToResponse(err);

  // Log full error details for developers
  try {
    logger.error(message, {
      module: "errorHandler",
      statusCode,
      errorCode,
      path: req.originalUrl,
      method: req.method,
      stack: err.stack,
      headers: req.headers,
      query: req.query,
      body: req.body,
    });
  } catch (logErr) {
    console.error("Logging failed:", logErr);
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    data: null,
    errorCode,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

// 404 handler
export const notFound = (req, res, next) => {
  const error = new Error(`Not found - ${req.originalUrl}`);
  error.statusCode = 404;
  error.errorCode = "NOT_FOUND";
  next(error);
};

// Async handler wrapper
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
