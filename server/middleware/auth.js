import jwt from "jsonwebtoken";
import { getPrisma } from "../db/connection.js";
import { asyncHandler } from "./errorHandler.js";

const prisma = getPrisma();

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
      message: "Not authorized to access this route",
      data: null,
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { ward: true },
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
        ward: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this route",
        data: null,
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated. Please contact support.",
        data: null,
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Not authorized to access this route",
      data: null,
    });
  }
});

// Grant access to specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`,
        data: null,
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
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: { ward: true },
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
          ward: true,
        },
      });

      if (user && user.isActive) {
        req.user = user;
      }
    } catch (error) {
      // Token invalid, continue without user
    }
  }

  next();
});
