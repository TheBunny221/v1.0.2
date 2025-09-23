// Frontend Logger - Unified logging system for React application
interface LogMeta {
  module?: string;
  userId?: string;
  sessionId?: string;
  component?: string;
  action?: string;
  error?: Error;
  [key: string]: any;
}

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  meta: LogMeta;
  url?: string;
  userAgent?: string;
}

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

class FrontendLogger {
  private isDevelopment: boolean;
  private logLevel: LogLevel;
  private logQueue: LogEntry[] = [];
  private maxQueueSize: number = 100;
  private sendToBackend: boolean;

  constructor() {
    this.isDevelopment = import.meta.env.DEV;
    this.logLevel = (import.meta.env.VITE_LOG_LEVEL as LogLevel) || 
                   (this.isDevelopment ? 'debug' : 'info');
    this.sendToBackend = import.meta.env.VITE_SEND_LOGS_TO_BACKEND === 'true' || 
                        import.meta.env.PROD;
    
    // Initialize error handlers
    this.setupGlobalErrorHandlers();
    
    // Periodically send logs to backend in production
    if (this.sendToBackend) {
      setInterval(() => this.flushLogs(), 30000); // Every 30 seconds
    }
    
    this.info('Frontend logger initialized', {
      module: 'logger',
      environment: this.isDevelopment ? 'development' : 'production',
      logLevel: this.logLevel,
      sendToBackend: this.sendToBackend,
    });
  }

  private setupGlobalErrorHandlers(): void {
    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      this.error('Uncaught error', {
        module: 'global',
        error: event.error,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled promise rejection', {
        module: 'global',
        reason: event.reason,
      });
    });

    // Handle React error boundaries (if needed)
    const originalConsoleError = console.error;
    console.error = (...args) => {
      // Check if this is a React error
      if (args[0] && typeof args[0] === 'string' && args[0].includes('React')) {
        this.error('React error', {
          module: 'react',
          args: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)),
        });
      }
      originalConsoleError.apply(console, args);
    };
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = { error: 0, warn: 1, info: 2, debug: 3 };
    return levels[level] <= levels[this.logLevel];
  }

  private getCallerInfo(): { component?: string; module?: string } {
    const stack = new Error().stack;
    if (!stack) return {};

    const stackLines = stack.split('\n');
    
    // Find the first line that's not in this logger file
    for (let i = 3; i < stackLines.length; i++) {
      const line = stackLines[i];
      if (line && !line.includes('logger.ts') && !line.includes('node_modules')) {
        // Try to extract component/module name from the stack trace
        const match = line.match(/at\s+(?:.*\.)?(\w+)/);
        if (match) {
          return { component: match[1] };
        }
      }
    }
    return {};
  }

  private formatMessage(level: LogLevel, message: string, meta: LogMeta): string {
    const timestamp = new Date().toISOString();
    const callerInfo = this.getCallerInfo();
    const module = meta.module || callerInfo.component || 'unknown';
    
    let formattedMessage = `${timestamp} [${level.toUpperCase()}] [${module}]`;
    
    if (meta.userId) {
      formattedMessage += ` [User:${meta.userId}]`;
    }
    
    if (meta.component && meta.component !== module) {
      formattedMessage += ` [${meta.component}]`;
    }
    
    formattedMessage += `: ${message}`;
    
    return formattedMessage;
  }

  private createLogEntry(level: LogLevel, message: string, meta: LogMeta): LogEntry {
    const callerInfo = this.getCallerInfo();
    
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      meta: {
        ...callerInfo,
        ...meta,
      },
      url: window.location.href,
      userAgent: navigator.userAgent,
    };
  }

  private log(level: LogLevel, message: string, meta: LogMeta = {}): void {
    if (!this.shouldLog(level)) return;

    const logEntry = this.createLogEntry(level, message, meta);
    const formattedMessage = this.formatMessage(level, message, meta);

    // Always log to console in development, or for errors in production
    if (this.isDevelopment || level === 'error') {
      const consoleMethod = level === 'error' ? console.error :
                           level === 'warn' ? console.warn :
                           level === 'info' ? console.info :
                           console.debug;

      if (meta.error) {
        consoleMethod(formattedMessage, meta.error);
      } else if (Object.keys(meta).length > 0) {
        consoleMethod(formattedMessage, meta);
      } else {
        consoleMethod(formattedMessage);
      }
    }

    // Queue for backend sending
    if (this.sendToBackend) {
      this.logQueue.push(logEntry);
      
      // Limit queue size
      if (this.logQueue.length > this.maxQueueSize) {
        this.logQueue = this.logQueue.slice(-this.maxQueueSize);
      }

      // Send immediately for errors
      if (level === 'error') {
        this.flushLogs();
      }
    }
  }

  private async flushLogs(): Promise<void> {
    if (this.logQueue.length === 0) return;

    const logsToSend = [...this.logQueue];
    this.logQueue = [];

    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logs: logsToSend }),
      });
    } catch (error) {
      // If sending fails, put logs back in queue (but don't create infinite loop)
      if (this.logQueue.length < this.maxQueueSize) {
        this.logQueue.unshift(...logsToSend.slice(0, this.maxQueueSize - this.logQueue.length));
      }
      
      // Only log to console to avoid infinite recursion
      console.error('Failed to send logs to backend:', error);
    }
  }

  // Main logging methods
  error(message: string, meta: LogMeta = {}): void {
    this.log('error', message, meta);
  }

  warn(message: string, meta: LogMeta = {}): void {
    this.log('warn', message, meta);
  }

  info(message: string, meta: LogMeta = {}): void {
    this.log('info', message, meta);
  }

  debug(message: string, meta: LogMeta = {}): void {
    this.log('debug', message, meta);
  }

  // Convenience methods for common scenarios
  auth(message: string, meta: LogMeta = {}): void {
    this.info(message, { ...meta, module: 'auth' });
  }

  api(message: string, meta: LogMeta = {}): void {
    this.debug(message, { ...meta, module: 'api' });
  }

  ui(message: string, meta: LogMeta = {}): void {
    this.debug(message, { ...meta, module: 'ui' });
  }

  performance(operation: string, duration: number, meta: LogMeta = {}): void {
    this.info(`Performance: ${operation} completed in ${duration}ms`, {
      ...meta,
      module: 'performance',
      operation,
      duration,
    });
  }

  // Context-aware logging
  withUser(userId: string, sessionId?: string) {
    return {
      error: (message: string, meta: LogMeta = {}) => 
        this.error(message, { ...meta, userId, sessionId }),
      warn: (message: string, meta: LogMeta = {}) => 
        this.warn(message, { ...meta, userId, sessionId }),
      info: (message: string, meta: LogMeta = {}) => 
        this.info(message, { ...meta, userId, sessionId }),
      debug: (message: string, meta: LogMeta = {}) => 
        this.debug(message, { ...meta, userId, sessionId }),
    };
  }

  withComponent(componentName: string) {
    return {
      error: (message: string, meta: LogMeta = {}) => 
        this.error(message, { ...meta, component: componentName }),
      warn: (message: string, meta: LogMeta = {}) => 
        this.warn(message, { ...meta, component: componentName }),
      info: (message: string, meta: LogMeta = {}) => 
        this.info(message, { ...meta, component: componentName }),
      debug: (message: string, meta: LogMeta = {}) => 
        this.debug(message, { ...meta, component: componentName }),
    };
  }

  withModule(moduleName: string) {
    return {
      error: (message: string, meta: LogMeta = {}) => 
        this.error(message, { ...meta, module: moduleName }),
      warn: (message: string, meta: LogMeta = {}) => 
        this.warn(message, { ...meta, module: moduleName }),
      info: (message: string, meta: LogMeta = {}) => 
        this.info(message, { ...meta, module: moduleName }),
      debug: (message: string, meta: LogMeta = {}) => 
        this.debug(message, { ...meta, module: moduleName }),
    };
  }

  // React-specific logging helpers
  componentError(componentName: string, error: Error, errorInfo?: any): void {
    this.error(`Component error in ${componentName}`, {
      component: componentName,
      error,
      errorInfo,
      module: 'react',
    });
  }

  hookError(hookName: string, error: Error, meta: LogMeta = {}): void {
    this.error(`Hook error in ${hookName}`, {
      ...meta,
      hook: hookName,
      error,
      module: 'react-hooks',
    });
  }

  routeChange(from: string, to: string, meta: LogMeta = {}): void {
    this.debug(`Route change: ${from} -> ${to}`, {
      ...meta,
      module: 'router',
      from,
      to,
    });
  }

  apiCall(method: string, url: string, status: number, duration: number, meta: LogMeta = {}): void {
    const level = status >= 400 ? 'error' : status >= 300 ? 'warn' : 'debug';
    this.log(level, `API ${method} ${url} ${status} - ${duration}ms`, {
      ...meta,
      module: 'api',
      method,
      url,
      status,
      duration,
    });
  }

  // Manual flush for immediate sending
  async flush(): Promise<void> {
    await this.flushLogs();
  }
}

// Create singleton instance
const logger = new FrontendLogger();

// Export both the instance and the class for testing
export default logger;
export { FrontendLogger };
export type { LogMeta, LogEntry, LogLevel };
