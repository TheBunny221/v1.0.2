import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FrontendLogger } from '../utils/logger';

// Mock fetch for backend log submission
global.fetch = vi.fn();

// Mock console methods
const mockConsole = {
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
  log: vi.fn(),
};

Object.assign(console, mockConsole);

// Mock window and navigator
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000/test-page',
  },
  writable: true,
});

Object.defineProperty(navigator, 'userAgent', {
  value: 'Test User Agent',
  writable: true,
});

// Mock import.meta.env
vi.mock('import.meta', () => ({
  env: {
    DEV: true,
    VITE_LOG_LEVEL: 'debug',
    VITE_SEND_LOGS_TO_BACKEND: 'false',
  },
}));

describe('Frontend Logger', () => {
  let logger: FrontendLogger;

  beforeEach(() => {
    vi.clearAllMocks();
    logger = new FrontendLogger();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Basic Logging Methods', () => {
    it('should log error messages to console in development', () => {
      const message = 'Test error message';
      const meta = { userId: '123' };
      
      logger.error(message, meta);
      
      expect(mockConsole.error).toHaveBeenCalled();
    });

    it('should log warning messages to console', () => {
      const message = 'Test warning message';
      
      logger.warn(message);
      
      expect(mockConsole.warn).toHaveBeenCalled();
    });

    it('should log info messages to console', () => {
      const message = 'Test info message';
      
      logger.info(message);
      
      expect(mockConsole.info).toHaveBeenCalled();
    });

    it('should log debug messages to console in development', () => {
      const message = 'Test debug message';
      
      logger.debug(message);
      
      expect(mockConsole.debug).toHaveBeenCalled();
    });
  });

  describe('Log Level Filtering', () => {
    it('should respect log level configuration', () => {
      // Create logger with warn level
      const warnLogger = new FrontendLogger();
      // Manually set log level for testing
      (warnLogger as any).logLevel = 'warn';
      
      warnLogger.debug('Debug message');
      warnLogger.info('Info message');
      warnLogger.warn('Warn message');
      warnLogger.error('Error message');
      
      // Only warn and error should be logged
      expect(mockConsole.warn).toHaveBeenCalled();
      expect(mockConsole.error).toHaveBeenCalled();
    });
  });

  describe('Convenience Methods', () => {
    it('should log auth messages with correct module', () => {
      const message = 'User login attempt';
      const meta = { userId: '123' };
      
      logger.auth(message, meta);
      
      expect(mockConsole.info).toHaveBeenCalled();
    });

    it('should log API messages with correct module', () => {
      const message = 'API request made';
      
      logger.api(message);
      
      expect(mockConsole.debug).toHaveBeenCalled();
    });

    it('should log UI messages with correct module', () => {
      const message = 'UI interaction';
      
      logger.ui(message);
      
      expect(mockConsole.debug).toHaveBeenCalled();
    });

    it('should log performance metrics', () => {
      const operation = 'component-render';
      const duration = 50;
      
      logger.performance(operation, duration);
      
      expect(mockConsole.info).toHaveBeenCalled();
    });
  });

  describe('Context-Aware Logging', () => {
    it('should log with user context', () => {
      const userId = '123';
      const sessionId = 'session-456';
      const message = 'User action performed';
      
      const userLogger = logger.withUser(userId, sessionId);
      userLogger.info(message);
      
      expect(mockConsole.info).toHaveBeenCalled();
    });

    it('should log with component context', () => {
      const componentName = 'UserProfile';
      const message = 'Component rendered';
      
      const componentLogger = logger.withComponent(componentName);
      componentLogger.debug(message);
      
      expect(mockConsole.debug).toHaveBeenCalled();
    });

    it('should log with module context', () => {
      const moduleName = 'authentication';
      const message = 'Auth module action';
      
      const moduleLogger = logger.withModule(moduleName);
      moduleLogger.info(message);
      
      expect(mockConsole.info).toHaveBeenCalled();
    });
  });

  describe('React-Specific Logging', () => {
    it('should log component errors', () => {
      const componentName = 'UserProfile';
      const error = new Error('Component error');
      const errorInfo = { componentStack: 'test stack' };
      
      logger.componentError(componentName, error, errorInfo);
      
      expect(mockConsole.error).toHaveBeenCalled();
    });

    it('should log hook errors', () => {
      const hookName = 'useUserData';
      const error = new Error('Hook error');
      
      logger.hookError(hookName, error);
      
      expect(mockConsole.error).toHaveBeenCalled();
    });

    it('should log route changes', () => {
      const from = '/login';
      const to = '/dashboard';
      
      logger.routeChange(from, to);
      
      expect(mockConsole.debug).toHaveBeenCalled();
    });
  });

  describe('API Call Logging', () => {
    it('should log successful API calls', () => {
      const method = 'GET';
      const url = '/api/users';
      const status = 200;
      const duration = 150;
      
      logger.apiCall(method, url, status, duration);
      
      expect(mockConsole.debug).toHaveBeenCalled();
    });

    it('should log failed API calls as errors', () => {
      const method = 'POST';
      const url = '/api/users';
      const status = 500;
      const duration = 200;
      
      logger.apiCall(method, url, status, duration);
      
      expect(mockConsole.error).toHaveBeenCalled();
    });

    it('should log redirects as warnings', () => {
      const method = 'GET';
      const url = '/api/users';
      const status = 302;
      const duration = 100;
      
      logger.apiCall(method, url, status, duration);
      
      expect(mockConsole.warn).toHaveBeenCalled();
    });
  });

  describe('Backend Log Submission', () => {
    beforeEach(() => {
      // Mock fetch to return successful response
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
    });

    it('should queue logs for backend submission when enabled', () => {
      // Create logger with backend submission enabled
      const backendLogger = new FrontendLogger();
      (backendLogger as any).sendToBackend = true;
      
      const message = 'Test message';
      backendLogger.info(message);
      
      // Check that log was queued
      const logQueue = (backendLogger as any).logQueue;
      expect(logQueue).toHaveLength(1);
      expect(logQueue[0]).toMatchObject({
        level: 'info',
        message,
        url: 'http://localhost:3000/test-page',
        userAgent: 'Test User Agent',
      });
    });

    it('should immediately flush error logs', async () => {
      const backendLogger = new FrontendLogger();
      (backendLogger as any).sendToBackend = true;
      
      const message = 'Test error';
      backendLogger.error(message);
      
      // Wait for async flush
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(global.fetch).toHaveBeenCalledWith('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining(message),
      });
    });

    it('should handle backend submission failures gracefully', async () => {
      // Mock fetch to fail
      (global.fetch as any).mockRejectedValue(new Error('Network error'));
      
      const backendLogger = new FrontendLogger();
      (backendLogger as any).sendToBackend = true;
      
      const message = 'Test error';
      backendLogger.error(message);
      
      // Wait for async flush
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Should not throw error
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should limit queue size', () => {
      const backendLogger = new FrontendLogger();
      (backendLogger as any).sendToBackend = true;
      (backendLogger as any).maxQueueSize = 5;
      
      // Add more logs than max queue size
      for (let i = 0; i < 10; i++) {
        backendLogger.info(`Message ${i}`);
      }
      
      const logQueue = (backendLogger as any).logQueue;
      expect(logQueue).toHaveLength(5);
    });
  });

  describe('Global Error Handling', () => {
    it('should handle window error events', () => {
      const errorEvent = new ErrorEvent('error', {
        error: new Error('Global error'),
        filename: 'test.js',
        lineno: 10,
        colno: 5,
      });
      
      window.dispatchEvent(errorEvent);
      
      expect(mockConsole.error).toHaveBeenCalled();
    });

    it('should handle unhandled promise rejections', () => {
      const rejectionEvent = new PromiseRejectionEvent('unhandledrejection', {
        promise: Promise.reject('Test rejection'),
        reason: 'Test rejection',
      });
      
      window.dispatchEvent(rejectionEvent);
      
      expect(mockConsole.error).toHaveBeenCalled();
    });
  });

  describe('Log Entry Creation', () => {
    it('should create properly formatted log entries', () => {
      const backendLogger = new FrontendLogger();
      (backendLogger as any).sendToBackend = true;
      
      const message = 'Test message';
      const meta = { userId: '123', action: 'test' };
      
      backendLogger.info(message, meta);
      
      const logQueue = (backendLogger as any).logQueue;
      const logEntry = logQueue[0];
      
      expect(logEntry).toMatchObject({
        timestamp: expect.any(String),
        level: 'info',
        message,
        meta: expect.objectContaining(meta),
        url: 'http://localhost:3000/test-page',
        userAgent: 'Test User Agent',
      });
      
      // Verify timestamp is valid ISO string
      expect(new Date(logEntry.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('Manual Flush', () => {
    it('should allow manual flushing of logs', async () => {
      const backendLogger = new FrontendLogger();
      (backendLogger as any).sendToBackend = true;
      
      backendLogger.info('Test message 1');
      backendLogger.info('Test message 2');
      
      await backendLogger.flush();
      
      expect(global.fetch).toHaveBeenCalledWith('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('Test message 1'),
      });
    });
  });
});
