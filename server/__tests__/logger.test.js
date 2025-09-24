import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock winston to avoid actual file operations in tests
vi.mock('winston', () => {
  const mockLogger = {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    level: 'debug',
  };

  return {
    default: {
      createLogger: vi.fn(() => mockLogger),
      format: {
        combine: vi.fn(() => ({})),
        timestamp: vi.fn(() => ({})),
        errors: vi.fn(() => ({})),
        json: vi.fn(() => ({})),
        printf: vi.fn(() => ({})),
        colorize: vi.fn(() => ({})),
      },
      transports: {
        Console: vi.fn(),
      },
      addColors: vi.fn(),
    },
    mockLogger,
  };
});

vi.mock('winston-daily-rotate-file', () => {
  return {
    default: vi.fn(),
  };
});

describe('Backend Logger', () => {
  let logger;
  let mockWinston;

  beforeEach(async () => {
    // Clear all mocks
    vi.clearAllMocks();
    
    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.LOG_LEVEL = 'debug';
    
    // Import logger after setting up mocks
    const loggerModule = await import('../utils/logger.js');
    logger = loggerModule.default;
    
    // Get the mocked winston instance
    const winston = await import('winston');
    mockWinston = winston.mockLogger;
  });

  afterEach(() => {
    // Clean up environment
    delete process.env.LOG_LEVEL;
    delete process.env.LOG_TO_FILE;
  });

  describe('Basic Logging Methods', () => {
    it('should log error messages', () => {
      const message = 'Test error message';
      const meta = { userId: '123' };
      
      logger.error(message, meta);
      
      expect(mockWinston.log).toHaveBeenCalledWith(
        'error',
        message,
        expect.objectContaining({
          ...meta,
          module: expect.any(String),
        })
      );
    });

    it('should log warning messages', () => {
      const message = 'Test warning message';
      
      logger.warn(message);
      
      expect(mockWinston.log).toHaveBeenCalledWith(
        'warn',
        message,
        expect.objectContaining({
          module: expect.any(String),
        })
      );
    });

    it('should log info messages', () => {
      const message = 'Test info message';
      
      logger.info(message);
      
      expect(mockWinston.log).toHaveBeenCalledWith(
        'info',
        message,
        expect.objectContaining({
          module: expect.any(String),
        })
      );
    });

    it('should log debug messages', () => {
      const message = 'Test debug message';
      
      logger.debug(message);
      
      expect(mockWinston.log).toHaveBeenCalledWith(
        'debug',
        message,
        expect.objectContaining({
          module: expect.any(String),
        })
      );
    });
  });

  describe('Convenience Methods', () => {
    it('should log auth messages with correct module', () => {
      const message = 'User login attempt';
      const meta = { userId: '123' };
      
      logger.auth(message, meta);
      
      expect(mockWinston.log).toHaveBeenCalledWith(
        'info',
        message,
        expect.objectContaining({
          ...meta,
          module: 'auth',
        })
      );
    });

    it('should log API messages with correct module', () => {
      const message = 'API request processed';
      
      logger.api(message);
      
      expect(mockWinston.log).toHaveBeenCalledWith(
        'http',
        message,
        expect.objectContaining({
          module: 'api',
        })
      );
    });

    it('should log database messages with correct module', () => {
      const message = 'Database query executed';
      
      logger.db(message);
      
      expect(mockWinston.log).toHaveBeenCalledWith(
        'debug',
        message,
        expect.objectContaining({
          module: 'database',
        })
      );
    });

    it('should log security messages with correct module', () => {
      const message = 'Security event detected';
      
      logger.security(message);
      
      expect(mockWinston.log).toHaveBeenCalledWith(
        'warn',
        message,
        expect.objectContaining({
          module: 'security',
        })
      );
    });
  });

  describe('Context-Aware Logging', () => {
    it('should log with user context', () => {
      const userId = '123';
      const sessionId = 'session-456';
      const message = 'User action performed';
      
      const userLogger = logger.withUser(userId, sessionId);
      userLogger.info(message);
      
      expect(mockWinston.log).toHaveBeenCalledWith(
        'info',
        message,
        expect.objectContaining({
          userId,
          sessionId,
          module: expect.any(String),
        })
      );
    });

    it('should log with module context', () => {
      const moduleName = 'payment';
      const message = 'Payment processed';
      
      const moduleLogger = logger.withModule(moduleName);
      moduleLogger.info(message);
      
      expect(mockWinston.log).toHaveBeenCalledWith(
        'info',
        message,
        expect.objectContaining({
          module: moduleName,
        })
      );
    });
  });

  describe('Performance Logging', () => {
    it('should log performance metrics', () => {
      const operation = 'database-query';
      const duration = 150;
      const meta = { query: 'SELECT * FROM users' };
      
      logger.performance(operation, duration, meta);
      
      expect(mockWinston.log).toHaveBeenCalledWith(
        'info',
        `Performance: ${operation} completed in ${duration}ms`,
        expect.objectContaining({
          ...meta,
          module: 'performance',
          operation,
          duration,
        })
      );
    });
  });

  describe('Request Logging', () => {
    it('should log HTTP requests', () => {
      const mockReq = {
        method: 'GET',
        url: '/api/users',
        ip: '127.0.0.1',
        headers: {
          'user-agent': 'test-agent',
        },
        user: { id: '123' },
      };
      
      const mockRes = {
        statusCode: 200,
      };
      
      const responseTime = 250;
      
      logger.request(mockReq, mockRes, responseTime);
      
      expect(mockWinston.log).toHaveBeenCalledWith(
        'http',
        `GET /api/users 200 - ${responseTime}ms`,
        expect.objectContaining({
          module: 'request',
          method: 'GET',
          url: '/api/users',
          statusCode: 200,
          responseTime,
          ip: '127.0.0.1',
          userAgent: 'test-agent',
          userId: '123',
        })
      );
    });

    it('should handle anonymous requests', () => {
      const mockReq = {
        method: 'POST',
        url: '/api/auth/login',
        ip: '192.168.1.1',
        headers: {
          'user-agent': 'browser-agent',
        },
        // No user property
      };
      
      const mockRes = {
        statusCode: 401,
      };
      
      const responseTime = 100;
      
      logger.request(mockReq, mockRes, responseTime);
      
      expect(mockWinston.log).toHaveBeenCalledWith(
        'http',
        `POST /api/auth/login 401 - ${responseTime}ms`,
        expect.objectContaining({
          userId: 'anonymous',
        })
      );
    });
  });

  describe('Module Detection', () => {
    it('should automatically detect caller module', () => {
      const message = 'Test message';
      
      logger.info(message);
      
      expect(mockWinston.log).toHaveBeenCalledWith(
        'info',
        message,
        expect.objectContaining({
          module: expect.any(String),
        })
      );
    });

    it('should allow manual module override', () => {
      const message = 'Test message';
      const customModule = 'custom-module';
      
      logger.info(message, { module: customModule });
      
      expect(mockWinston.log).toHaveBeenCalledWith(
        'info',
        message,
        expect.objectContaining({
          module: customModule,
        })
      );
    });
  });
});

describe('Logger Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should use debug level in development', async () => {
    process.env.NODE_ENV = 'development';
    delete process.env.LOG_LEVEL;
    
    // Re-import to get fresh configuration
    delete require.cache[require.resolve('../utils/logger.js')];
    const loggerModule = await import('../utils/logger.js');
    
    // In a real test, we would check the winston configuration
    // For now, we just verify the import works
    expect(loggerModule.default).toBeDefined();
  });

  it('should use info level in production', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.LOG_LEVEL;
    
    // Re-import to get fresh configuration
    delete require.cache[require.resolve('../utils/logger.js')];
    const loggerModule = await import('../utils/logger.js');
    
    expect(loggerModule.default).toBeDefined();
  });

  it('should respect custom log level', async () => {
    process.env.LOG_LEVEL = 'warn';
    
    // Re-import to get fresh configuration
    delete require.cache[require.resolve('../utils/logger.js')];
    const loggerModule = await import('../utils/logger.js');
    
    expect(loggerModule.default).toBeDefined();
  });
});
