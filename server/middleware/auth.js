import jwt from "jsonwebtoken";
import { getPrisma } from "../db/connection.js";
import { asyncHandler } from "./errorHandler.js";

const prisma = getPrisma();

// Validate JWT configuration on startup
if (!process.env.JWT_SECRET) {
  console.error("❌ CRITICAL: JWT_SECRET environment variable is not set!");
  console.error("🔧 Please set JWT_SECRET in your .env file");
  if (process.env.NODE_ENV === "production") {
    process.exit(1);
  }
}

// Protect routes
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    // Get token from header
    token = req.headers.authorization.split(" ")[1];
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access denied. No token provided.",
      data: {
        code: "NO_TOKEN",
        action: "LOGIN_REQUIRED",
      },
    });
  }

  try {
    // Check if JWT_SECRET is properly configured
    if (!process.env.JWT_SECRET) {
      console.error(
        "❌ JWT_SECRET not configured - this is a critical security issue",
      );
      return res.status(500).json({
        success: false,
        message: "Server configuration error",
        data: { code: "JWT_CONFIG_ERROR" },
      });
    }

    // Verify token with enhanced validation
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"], // Explicitly specify allowed algorithms
      maxAge: process.env.JWT_EXPIRE || "7d", // Validate token age
      clockTolerance: 60, // Allow 60 seconds clock skew
    });

    // Get user from token with error handling
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          fullName: true,
          email: true,
          phoneNumber: true,
          role: true,
          wardId: true,
          department: true,
          language: true,
          avatar: true,
          isActive: true,
          lastLogin: true,
          joinedOn: true,
          ward: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      });
    } catch (dbError) {
      console.error("❌ Database error during auth:", dbError);

      if (
        dbError.message.includes("readonly") ||
        dbError.message.includes("READONLY")
      ) {
        return res.status(503).json({
          success: false,
          message: "Service temporarily unavailable. Please try again later.",
          data: {
            code: "DATABASE_READONLY",
            retryAfter: 60,
          },
        });
      }

      return res.status(500).json({
        success: false,
        message: "Authentication service error",
        data: { code: "DATABASE_ERROR" },
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid token. User not found.",
        data: {
          code: "USER_NOT_FOUND",
          action: "LOGIN_REQUIRED",
        },
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated. Please contact support.",
        data: {
          code: "ACCOUNT_DEACTIVATED",
          action: "CONTACT_SUPPORT",
        },
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("❌ Token verification error:", error.message);

    let errorResponse = {
      success: false,
      message: "Invalid or expired token",
      data: {
        code: "TOKEN_INVALID",
        action: "LOGIN_REQUIRED",
      },
    };

    // Handle specific JWT errors
    if (error.name === "TokenExpiredError") {
      errorResponse.message = "Token has expired";
      errorResponse.data.code = "TOKEN_EXPIRED";
    } else if (error.name === "JsonWebTokenError") {
      errorResponse.message = "Invalid token format";
      errorResponse.data.code = "TOKEN_MALFORMED";
    } else if (error.name === "NotBeforeError") {
      errorResponse.message = "Token not active yet";
      errorResponse.data.code = "TOKEN_NOT_ACTIVE";
    }

    return res.status(401).json(errorResponse);
  }
});

// Grant access to specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required for role-based access",
        data: {
          code: "AUTH_REQUIRED",
          action: "LOGIN_REQUIRED",
        },
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${roles.join(", ")}. Your role: ${req.user.role}`,
        data: {
          code: "INSUFFICIENT_ROLE",
          requiredRoles: roles,
          userRole: req.user.role,
        },
      });
    }
    next();
  };
};

// Optional auth (for mixed public/private endpoints)
export const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      try {
        const user = await prisma.user.findUnique({
          where: { id: decoded.id },
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
            role: true,
            wardId: true,
            department: true,
            language: true,
            avatar: true,
            isActive: true,
            lastLogin: true,
            joinedOn: true,
            ward: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        });

        if (user && user.isActive) {
          req.user = user;
        }
      } catch (dbError) {
        console.warn(
          "⚠️ Database error in optional auth, continuing without user:",
          dbError.message,
        );
        // Continue without user for optional auth
      }
    } catch (error) {
      // Token invalid, continue without user
      console.debug(
        "Token invalid in optional auth, continuing without user:",
        error.message,
      );
    }
  }

  next();
});

// Token refresh check
export const checkTokenExpiry = asyncHandler(async (req, res, next) => {
  if (req.user) {
    // Check if token is close to expiry (optional warning)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      try {
        const decoded = jwt.decode(token);
        const now = Math.floor(Date.now() / 1000);
        const timeToExpiry = decoded.exp - now;

        // If token expires in less than 1 hour, add warning header
        if (timeToExpiry < 3600) {
          res.set("X-Token-Warning", "Token expires soon");
          res.set("X-Token-Expiry", decoded.exp.toString());
        }
      } catch (error) {
        // Ignore decode errors
      }
    }
  }
  next();
});
