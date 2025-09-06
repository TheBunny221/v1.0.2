// Middleware to handle database unavailability gracefully
export const checkDatabaseConnection = (req, res, next) => {
  // This middleware can be enhanced to check actual database connectivity
  // For now, it serves as a placeholder for future database status checks

  // In development mode, we want to show helpful error messages
  // when database-dependent endpoints are accessed without a database

  if (process.env.NODE_ENV === "development") {
    // You can add specific logic here to check if database is available
    // For now, we'll let the routes handle their own database errors
    next();
  } else {
    // In production, ensure database is available
    next();
  }
};

// Helper function to create database unavailable response
export const createDatabaseUnavailableResponse = (
  operation = "this operation",
) => {
  return {
    success: false,
    message: `Database connection unavailable. Cannot perform ${operation}.`,
    data: null,
    error: {
      code: "DATABASE_UNAVAILABLE",
      message:
        "The database service is currently unavailable. Please check your database connection and try again.",
      suggestions: [
        "Verify your DATABASE_URL environment variable",
        "Ensure your database server is running",
        "Check network connectivity to your database",
        "Consider using a managed database service like Neon",
      ],
    },
  };
};

// Wrapper for database operations that handles connection errors gracefully
export const withDatabaseErrorHandling = (operation) => {
  return async (req, res, next) => {
    try {
      await operation(req, res, next);
    } catch (error) {
      // Check if this is a database connection error
      if (
        error.message?.includes("Can't reach database server") ||
        error.message?.includes(
          "Environment variable not found: DATABASE_URL",
        ) ||
        error.code === "P1001" || // Prisma connection error
        error.code === "P1012" // Prisma environment error
      ) {
        const response = createDatabaseUnavailableResponse();
        return res.status(503).json(response);
      }

      // For other errors, let the default error handler deal with it
      next(error);
    }
  };
};
