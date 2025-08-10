// Error handler middleware
export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error(err);

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    const message = "Resource not found";
    error = {
      statusCode: 404,
      message,
    };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    error = {
      statusCode: 400,
      message,
    };
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
    error = {
      statusCode: 400,
      message,
    };
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    const message = "Invalid token";
    error = {
      statusCode: 401,
      message,
    };
  }

  if (err.name === "TokenExpiredError") {
    const message = "Token expired";
    error = {
      statusCode: 401,
      message,
    };
  }

  // File upload errors
  if (err.code === "LIMIT_FILE_SIZE") {
    const message = "File too large";
    error = {
      statusCode: 400,
      message,
    };
  }

  if (err.code === "LIMIT_FILE_COUNT") {
    const message = "Too many files";
    error = {
      statusCode: 400,
      message,
    };
  }

  // Network errors
  if (err.code === "ENOTFOUND" || err.code === "ECONNREFUSED") {
    const message = "Service temporarily unavailable";
    error = {
      statusCode: 503,
      message,
    };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Server Error",
    data: null,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

// 404 handler
export const notFound = (req, res, next) => {
  const error = new Error(`Not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Async handler wrapper
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
