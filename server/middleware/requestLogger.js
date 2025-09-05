// Request logger middleware
export const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Capture original end function
  const originalEnd = res.end;

  // Override res.end to log response time
  res.end = function (...args) {
    const duration = Date.now() - start;

    // Log request details
    const logData = {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get("User-Agent"),
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      // Use Prisma-style `id` if available, fallback to `_id` for legacy compatibility
      userId: req.user ? req.user.id || req.user._id : null,
      userRole: req.user ? req.user.role : null,
    };

    // Color code based on status
    const statusColor =
      res.statusCode >= 500
        ? "\x1b[31m" // Red for 5xx
        : res.statusCode >= 400
          ? "\x1b[33m" // Yellow for 4xx
          : res.statusCode >= 300
            ? "\x1b[36m" // Cyan for 3xx
            : "\x1b[32m"; // Green for 2xx

    const resetColor = "\x1b[0m";

    // Only log in development for important requests or errors
    const shouldLog =
      process.env.NODE_ENV === "production" ||
      res.statusCode >= 400 ||
      req.originalUrl.startsWith("/api/") ||
      logData.duration > 1000; // Log slow requests

    if (shouldLog) {
      console.log(
        `${statusColor}${logData.method} ${logData.url} ${logData.statusCode} ${logData.duration}${resetColor} - ${logData.ip}`,
      );
    }

    // In production, you might want to send this to a logging service
    if (process.env.NODE_ENV === "production") {
      // Send to logging service (e.g., Winston, LogRocket, etc.)
    }

    // Call original end function
    originalEnd.apply(this, args);
  };

  next();
};

// Security headers middleware
export const securityHeaders = (req, res, next) => {
  // Security headers
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=()",
  );

  // HSTS in production
  if (process.env.NODE_ENV === "production") {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    );
  }

  next();
};
