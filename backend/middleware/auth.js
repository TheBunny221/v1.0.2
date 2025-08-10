import jwt from 'jsonwebtoken';
import User from '../model/User.js';

// Protect routes - verify JWT token
export const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
        data: null
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
      
      // Get user from token
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found',
          data: null
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User account is deactivated',
          data: null
        });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
        data: null
      });
    }
  } catch (error) {
    next(error);
  }
};

// Grant access to specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
        data: null
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`,
        data: null
      });
    }
    next();
  };
};

// Optional auth - doesn't fail if no token
export const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        const user = await User.findById(decoded.id);
        
        if (user && user.isActive) {
          req.user = user;
        }
      } catch (error) {
        // Token invalid, but continue without user
        req.user = null;
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

// Check if user is owner of resource or has admin privileges
export const checkOwnership = (resourceIdField = 'id') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
        data: null
      });
    }

    // Admin can access everything
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user owns the resource
    const resourceId = req.params[resourceIdField];
    if (resourceId && req.user.id === resourceId) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this resource',
      data: null
    });
  };
};

// Check ward access for ward officers
export const checkWardAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
        data: null
      });
    }

    // Admin can access all wards
    if (req.user.role === 'admin') {
      return next();
    }

    // Ward officers can only access their assigned ward
    if (req.user.role === 'ward_officer') {
      const requestedWard = req.params.ward || req.query.ward || req.body.ward;

      if (requestedWard && req.user.ward !== requestedWard) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this ward',
          data: null
        });
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Rate limiting by user
export const rateLimitByUser = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();

  return (req, res, next) => {
    const userId = req.user ? req.user.id : req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get user's requests in current window
    if (!requests.has(userId)) {
      requests.set(userId, []);
    }

    const userRequests = requests.get(userId);
    
    // Remove old requests outside the window
    const currentRequests = userRequests.filter(timestamp => timestamp > windowStart);
    requests.set(userId, currentRequests);

    // Check if limit exceeded
    if (currentRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later',
        data: {
          retryAfter: Math.ceil(windowMs / 1000)
        }
      });
    }

    // Add current request
    currentRequests.push(now);
    requests.set(userId, currentRequests);

    next();
  };
};
