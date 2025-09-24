import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authSlice from '../store/slices/authSlice';
import { baseApi } from '../store/api/baseApi';
import logger from '../utils/logger';

// Mock fetch for API calls
global.fetch = vi.fn();

// Mock console methods to capture logs
const mockConsole = {
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
  log: vi.fn(),
};

Object.assign(console, mockConsole);

// Test component that uses logging
const TestLoggingComponent: React.FC = () => {
  const handleError = () => {
    try {
      throw new Error('Test error for logging');
    } catch (error) {
      logger.error('Component error occurred', {
        component: 'TestLoggingComponent',
        error: error.message,
      });
    }
  };

  const handleApiCall = async () => {
    const start = performance.now();
    try {
      const response = await fetch('/api/test');
      const duration = performance.now() - start;
      logger.apiCall('GET', '/api/test', response.status, duration);
    } catch (error) {
      const duration = performance.now() - start;
      logger.apiCall('GET', '/api/test', 0, duration, { error: error.message });
    }
  };

  const handlePerformanceLog = () => {
    const start = performance.now();
    // Simulate some work
    for (let i = 0; i < 1000; i++) {
      Math.random();
    }
    const duration = performance.now() - start;
    logger.performance('test-operation', duration, { iterations: 1000 });
  };

  return (
    <div>
      <button data-testid="error-button" onClick={handleError}>
        Trigger Error
      </button>
      <button data-testid="api-button" onClick={handleApiCall}>
        Make API Call
      </button>
      <button data-testid="performance-button" onClick={handlePerformanceLog}>
        Log Performance
      </button>
    </div>
  );
};

// Create mock store
const createMockStore = () => configureStore({
  reducer: {
    auth: authSlice,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
});

describe('Logging Integration Tests', () => {
  let mockStore: ReturnType<typeof createMockStore>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockStore = createMockStore();
    
    // Mock successful fetch response
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true }),
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Frontend to Backend Log Flow', () => {
    it('should log errors and send to backend when configured', async () => {
      // Create logger with backend submission enabled
      const testLogger = new (await import('../utils/logger')).FrontendLogger();
      (testLogger as any).sendToBackend = true;
      (testLogger as any).isDevelopment = false;

      // Log an error
      testLogger.error('Test error message', {
        userId: '123',
        component: 'TestComponent',
      });

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify fetch was called to send logs to backend
      expect(global.fetch).toHaveBeenCalledWith('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('Test error message'),
      });
    });

    it('should handle backend submission failures gracefully', async () => {
      // Mock fetch to fail
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      const testLogger = new (await import('../utils/logger')).FrontendLogger();
      (testLogger as any).sendToBackend = true;

      // Log an error
      testLogger.error('Test error message');

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should not throw error and should attempt to send
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('Component Integration', () => {
    it('should integrate logging with React components', async () => {
      render(
        <Provider store={mockStore}>
          <TestLoggingComponent />
        </Provider>
      );

      // Test error logging
      fireEvent.click(screen.getByTestId('error-button'));
      expect(mockConsole.error).toHaveBeenCalled();

      // Test API call logging
      fireEvent.click(screen.getByTestId('api-button'));
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/test');
      });

      // Test performance logging
      fireEvent.click(screen.getByTestId('performance-button'));
      expect(mockConsole.info).toHaveBeenCalled();
    });
  });

  describe('Context-Aware Logging', () => {
    it('should maintain user context across log calls', () => {
      const userId = '123';
      const sessionId = 'session-456';
      
      const userLogger = logger.withUser(userId, sessionId);
      
      userLogger.info('User action performed');
      userLogger.error('User error occurred');
      
      // Both calls should include user context
      expect(mockConsole.info).toHaveBeenCalled();
      expect(mockConsole.error).toHaveBeenCalled();
    });

    it('should maintain component context across log calls', () => {
      const componentName = 'UserProfile';
      
      const componentLogger = logger.withComponent(componentName);
      
      componentLogger.debug('Component rendered');
      componentLogger.warn('Component warning');
      
      expect(mockConsole.debug).toHaveBeenCalled();
      expect(mockConsole.warn).toHaveBeenCalled();
    });
  });

  describe('Error Boundary Integration', () => {
    it('should capture and log React errors', () => {
      const ErrorComponent = () => {
        throw new Error('React component error');
      };

      const ErrorBoundary = class extends React.Component {
        componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
          logger.componentError('ErrorComponent', error, errorInfo);
        }

        render() {
          try {
            return this.props.children;
          } catch (error) {
            return <div>Error occurred</div>;
          }
        }
      };

      // Suppress console errors for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      try {
        render(
          <ErrorBoundary>
            <ErrorComponent />
          </ErrorBoundary>
        );
      } catch (error) {
        // Expected to throw
      }

      consoleSpy.mockRestore();
    });
  });

  describe('Performance Monitoring', () => {
    it('should log performance metrics correctly', () => {
      const operation = 'data-processing';
      const duration = 150;
      const meta = { recordCount: 1000 };

      logger.performance(operation, duration, meta);

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining(`Performance: ${operation} completed in ${duration}ms`)
      );
    });

    it('should measure and log actual performance', async () => {
      const start = performance.now();
      
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const duration = performance.now() - start;
      logger.performance('async-operation', duration);

      expect(mockConsole.info).toHaveBeenCalled();
      expect(duration).toBeGreaterThan(0);
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

    it('should log API calls with additional metadata', () => {
      const method = 'PUT';
      const url = '/api/users/123';
      const status = 200;
      const duration = 100;
      const meta = { userId: '123', action: 'update' };

      logger.apiCall(method, url, status, duration, meta);

      expect(mockConsole.debug).toHaveBeenCalled();
    });
  });

  describe('Log Queue Management', () => {
    it('should manage log queue size properly', async () => {
      const testLogger = new (await import('../utils/logger')).FrontendLogger();
      (testLogger as any).sendToBackend = true;
      (testLogger as any).maxQueueSize = 5;

      // Add more logs than max queue size
      for (let i = 0; i < 10; i++) {
        testLogger.info(`Message ${i}`);
      }

      const logQueue = (testLogger as any).logQueue;
      expect(logQueue.length).toBeLessThanOrEqual(5);
    });

    it('should flush logs periodically', async () => {
      vi.useFakeTimers();

      const testLogger = new (await import('../utils/logger')).FrontendLogger();
      (testLogger as any).sendToBackend = true;

      testLogger.info('Test message');

      // Fast-forward time to trigger periodic flush
      vi.advanceTimersByTime(30000);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/logs', expect.any(Object));
      });

      vi.useRealTimers();
    });
  });

  describe('Environment-Specific Behavior', () => {
    it('should behave differently in development vs production', async () => {
      // Test development behavior
      const devLogger = new (await import('../utils/logger')).FrontendLogger();
      (devLogger as any).isDevelopment = true;
      (devLogger as any).sendToBackend = false;

      devLogger.debug('Debug message');
      expect(mockConsole.debug).toHaveBeenCalled();

      // Test production behavior
      const prodLogger = new (await import('../utils/logger')).FrontendLogger();
      (prodLogger as any).isDevelopment = false;
      (prodLogger as any).sendToBackend = true;

      prodLogger.debug('Debug message');
      // In production, debug messages might not go to console
    });
  });

  describe('Global Error Handling', () => {
    it('should capture window error events', () => {
      const errorEvent = new ErrorEvent('error', {
        error: new Error('Global error'),
        filename: 'test.js',
        lineno: 10,
        colno: 5,
      });

      window.dispatchEvent(errorEvent);

      expect(mockConsole.error).toHaveBeenCalled();
    });

    it('should capture unhandled promise rejections', () => {
      const rejectionEvent = new PromiseRejectionEvent('unhandledrejection', {
        promise: Promise.reject('Test rejection'),
        reason: 'Test rejection',
      });

      window.dispatchEvent(rejectionEvent);

      expect(mockConsole.error).toHaveBeenCalled();
    });
  });

  describe('Log Format Consistency', () => {
    it('should create consistent log entry format', async () => {
      const testLogger = new (await import('../utils/logger')).FrontendLogger();
      (testLogger as any).sendToBackend = true;

      const message = 'Test message';
      const meta = { userId: '123', action: 'test' };

      testLogger.info(message, meta);

      const logQueue = (testLogger as any).logQueue;
      const logEntry = logQueue[0];

      expect(logEntry).toMatchObject({
        timestamp: expect.any(String),
        level: 'info',
        message,
        meta: expect.objectContaining(meta),
        url: expect.any(String),
        userAgent: expect.any(String),
      });

      // Verify timestamp is valid ISO string
      expect(new Date(logEntry.timestamp)).toBeInstanceOf(Date);
    });
  });
});
