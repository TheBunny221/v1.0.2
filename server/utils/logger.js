import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log levels and colors
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(logColors);

// Custom format for log messages
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, module, userId, sessionId, ...meta }) => {
    let logMessage = `${timestamp} [${level.toUpperCase()}]`;
    
    if (module) {
      logMessage += ` [${module}]`;
    }
    
    if (userId) {
      logMessage += ` [User:${userId}]`;
    }
    
    if (sessionId) {
      logMessage += ` [Session:${sessionId}]`;
    }
    
    logMessage += `: ${message}`;
    
    if (stack) {
      logMessage += `\n${stack}`;
    }
    
    if (Object.keys(meta).length > 0) {
      logMessage += `\nMeta: ${JSON.stringify(meta, null, 2)}`;
    }
    
    return logMessage;
  })
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, module, userId }) => {
    let logMessage = `${timestamp} ${level}`;
    
    if (module) {
      logMessage += ` [${module}]`;
    }
    
    if (userId) {
      logMessage += ` [${userId}]`;
    }
    
    logMessage += `: ${message}`;
    
    return logMessage;
  })
);

// Create daily rotate file transport for different log levels
const createDailyRotateTransport = (level, filename) => {
  return new DailyRotateFile({
    level,
    filename: path.join(logsDir, `${filename}-%DATE%.log`),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '30d',
    format: logFormat,
    auditFile: path.join(logsDir, `${filename}-audit.json`),
  });
};

// Configure transports based on environment
const transports = [];

// Always add console transport
transports.push(
  new winston.transports.Console({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: process.env.NODE_ENV === 'production' ? logFormat : consoleFormat,
  })
);

// Add file transports for production or when LOG_TO_FILE is enabled
if (process.env.NODE_ENV === 'production' || process.env.LOG_TO_FILE === 'true') {
  // Combined logs (all levels)
  transports.push(createDailyRotateTransport('debug', 'combined'));
  
  // Error logs only
  transports.push(createDailyRotateTransport('error', 'error'));
  
  // Info and above
  transports.push(createDailyRotateTransport('info', 'app'));
}

// Create the logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  levels: logLevels,
  transports,
  exitOnError: false,
  // Handle uncaught exceptions and unhandled rejections
  exceptionHandlers: [
    new winston.transports.Console({
      format: consoleFormat,
    }),
    ...(process.env.NODE_ENV === 'production' || process.env.LOG_TO_FILE === 'true' 
      ? [createDailyRotateTransport('error', 'exceptions')] 
      : [])
  ],
  rejectionHandlers: [
    new winston.transports.Console({
      format: consoleFormat,
    }),
    ...(process.env.NODE_ENV === 'production' || process.env.LOG_TO_FILE === 'true' 
      ? [createDailyRotateTransport('error', 'rejections')] 
      : [])
  ],
});

// Helper function to get caller module name
const getCallerModule = () => {
  const stack = new Error().stack;
  const stackLines = stack.split('\n');
  
  // Find the first line that's not in this logger file
  for (let i = 3; i < stackLines.length; i++) {
    const line = stackLines[i];
    if (line && !line.includes('logger.js') && !line.includes('node_modules')) {
      const match = line.match(/at\s+(?:.*\s+\()?([^)]+):(\d+):(\d+)/);
      if (match) {
        const filePath = match[1];
        const fileName = path.basename(filePath, path.extname(filePath));
        return fileName;
      }
    }
  }
  return 'unknown';
};

// Enhanced logging methods with automatic module detection
const createLogMethod = (level) => {
  return (message, meta = {}) => {
    const module = meta.module || getCallerModule();
    logger.log(level, message, { ...meta, module });
  };
};

// Create enhanced logger with convenience methods
const enhancedLogger = {
  error: createLogMethod('error'),
  warn: createLogMethod('warn'),
  info: createLogMethod('info'),
  http: createLogMethod('http'),
  debug: createLogMethod('debug'),
  
  // Convenience methods for common scenarios
  auth: (message, meta = {}) => {
    enhancedLogger.info(message, { ...meta, module: 'auth' });
  },
  
  api: (message, meta = {}) => {
    enhancedLogger.http(message, { ...meta, module: 'api' });
  },
  
  db: (message, meta = {}) => {
    enhancedLogger.debug(message, { ...meta, module: 'database' });
  },
  
  security: (message, meta = {}) => {
    enhancedLogger.warn(message, { ...meta, module: 'security' });
  },
  
  // Method to log with user context
  withUser: (userId, sessionId = null) => {
    return {
      error: (message, meta = {}) => enhancedLogger.error(message, { ...meta, userId, sessionId }),
      warn: (message, meta = {}) => enhancedLogger.warn(message, { ...meta, userId, sessionId }),
      info: (message, meta = {}) => enhancedLogger.info(message, { ...meta, userId, sessionId }),
      debug: (message, meta = {}) => enhancedLogger.debug(message, { ...meta, userId, sessionId }),
    };
  },
  
  // Method to log with module context
  withModule: (moduleName) => {
    return {
      error: (message, meta = {}) => enhancedLogger.error(message, { ...meta, module: moduleName }),
      warn: (message, meta = {}) => enhancedLogger.warn(message, { ...meta, module: moduleName }),
      info: (message, meta = {}) => enhancedLogger.info(message, { ...meta, module: moduleName }),
      debug: (message, meta = {}) => enhancedLogger.debug(message, { ...meta, module: moduleName }),
    };
  },
  
  // Performance logging
  performance: (operation, duration, meta = {}) => {
    enhancedLogger.info(`Performance: ${operation} completed in ${duration}ms`, {
      ...meta,
      module: 'performance',
      operation,
      duration,
    });
  },
  
  // Request logging middleware helper
  request: (req, res, responseTime) => {
    const { method, url, ip, headers } = req;
    const { statusCode } = res;
    const userAgent = headers['user-agent'] || 'unknown';
    const userId = req.user?.id || 'anonymous';
    
    enhancedLogger.http(`${method} ${url} ${statusCode} - ${responseTime}ms`, {
      module: 'request',
      method,
      url,
      statusCode,
      responseTime,
      ip,
      userAgent,
      userId,
    });
  },
  
  // Raw winston logger access for advanced usage
  raw: logger,
};

// Log system startup
enhancedLogger.info('Logging system initialized', {
  module: 'logger',
  environment: process.env.NODE_ENV,
  logLevel: logger.level,
  logsDirectory: logsDir,
});

export default enhancedLogger;
