/**
 * Production-Grade Monitoring Utility
 * Tracks context initialization, API calls, and performance metrics
 */
import { useEffect } from 'react';

interface MonitoringMetrics {
  contextInitializations: Map<string, number>;
  apiCalls: Map<string, { count: number; lastCall: number }>;
  renderCounts: Map<string, number>;
  errors: Array<{ timestamp: number; error: string; context: string }>;
  warnings: Array<{ timestamp: number; message: string; context: string }>;
}

class ProductionMonitor {
  private metrics: MonitoringMetrics = {
    contextInitializations: new Map(),
    apiCalls: new Map(),
    renderCounts: new Map(),
    errors: [],
    warnings: [],
  };

  private readonly MAX_ERRORS = 100;
  private readonly MAX_WARNINGS = 100;
  private readonly API_CALL_THRESHOLD = 10; // Max calls per second
  private readonly RENDER_THRESHOLD = 50; // Max renders per component per second
  private readonly MONITORING_INTERVAL = 60000; // Report every minute

  private monitoringTimer: NodeJS.Timeout | null = null;
  private apiCallTimestamps: Map<string, number[]> = new Map();
  private renderTimestamps: Map<string, number[]> = new Map();

  constructor() {
    if (process.env.NODE_ENV === 'production') {
      this.startMonitoring();
    }
  }

  /**
   * Track context initialization
   */
  trackContextInit(contextName: string): void {
    const count = this.metrics.contextInitializations.get(contextName) || 0;
    this.metrics.contextInitializations.set(contextName, count + 1);
    
    if (count > 0) {
      this.logWarning(`Context ${contextName} initialized multiple times (${count + 1})`, 'CONTEXT_INIT');
    }
  }

  /**
   * Track API calls and detect excessive requests
   */
  trackApiCall(endpoint: string, method: string = 'GET'): void {
    const key = `${method} ${endpoint}`;
    const now = Date.now();
    
    // Update call count
    const callData = this.metrics.apiCalls.get(key) || { count: 0, lastCall: 0 };
    callData.count++;
    callData.lastCall = now;
    this.metrics.apiCalls.set(key, callData);
    
    // Track timestamps for rate limiting detection
    const timestamps = this.apiCallTimestamps.get(key) || [];
    timestamps.push(now);
    
    // Keep only timestamps from last second
    const oneSecondAgo = now - 1000;
    const recentTimestamps = timestamps.filter(t => t > oneSecondAgo);
    this.apiCallTimestamps.set(key, recentTimestamps);
    
    // Check for excessive calls
    if (recentTimestamps.length > this.API_CALL_THRESHOLD) {
      this.logWarning(
        `Excessive API calls detected: ${key} called ${recentTimestamps.length} times in 1 second`,
        'API_RATE_LIMIT'
      );
    }
  }

  /**
   * Track component renders
   */
  trackRender(componentName: string): void {
    const now = Date.now();
    
    // Update render count
    const count = this.metrics.renderCounts.get(componentName) || 0;
    this.metrics.renderCounts.set(componentName, count + 1);
    
    // Track timestamps for excessive render detection
    const timestamps = this.renderTimestamps.get(componentName) || [];
    timestamps.push(now);
    
    // Keep only timestamps from last second
    const oneSecondAgo = now - 1000;
    const recentTimestamps = timestamps.filter(t => t > oneSecondAgo);
    this.renderTimestamps.set(componentName, recentTimestamps);
    
    // Check for excessive renders
    if (recentTimestamps.length > this.RENDER_THRESHOLD) {
      this.logWarning(
        `Excessive renders detected: ${componentName} rendered ${recentTimestamps.length} times in 1 second`,
        'RENDER_PERFORMANCE'
      );
    }
  }

  /**
   * Log errors with context
   */
  logError(error: string | Error, context: string): void {
    const errorMessage = error instanceof Error ? error.message : error;
    
    this.metrics.errors.push({
      timestamp: Date.now(),
      error: errorMessage,
      context,
    });
    
    // Trim old errors
    if (this.metrics.errors.length > this.MAX_ERRORS) {
      this.metrics.errors = this.metrics.errors.slice(-this.MAX_ERRORS);
    }
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`[ProductionMonitor] Error in ${context}:`, errorMessage);
    }
    
    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoringService('error', { error: errorMessage, context });
    }
  }

  /**
   * Log warnings with context
   */
  logWarning(message: string, context: string): void {
    this.metrics.warnings.push({
      timestamp: Date.now(),
      message,
      context,
    });
    
    // Trim old warnings
    if (this.metrics.warnings.length > this.MAX_WARNINGS) {
      this.metrics.warnings = this.metrics.warnings.slice(-this.MAX_WARNINGS);
    }
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[ProductionMonitor] Warning in ${context}:`, message);
    }
  }

  /**
   * Get current metrics report
   */
  getMetricsReport(): any {
    const report = {
      timestamp: new Date().toISOString(),
      contextInitializations: Object.fromEntries(this.metrics.contextInitializations),
      apiCalls: Object.fromEntries(
        Array.from(this.metrics.apiCalls.entries()).map(([key, data]) => [
          key,
          { ...data, callsPerMinute: (data.count / (Date.now() - data.lastCall)) * 60000 },
        ])
      ),
      renderCounts: Object.fromEntries(this.metrics.renderCounts),
      recentErrors: this.metrics.errors.slice(-10),
      recentWarnings: this.metrics.warnings.slice(-10),
      errorCount: this.metrics.errors.length,
      warningCount: this.metrics.warnings.length,
    };
    
    return report;
  }

  /**
   * Start periodic monitoring reports
   */
  private startMonitoring(): void {
    this.monitoringTimer = setInterval(() => {
      this.reportMetrics();
    }, this.MONITORING_INTERVAL);
  }

  /**
   * Report metrics to monitoring service
   */
  private reportMetrics(): void {
    const report = this.getMetricsReport();
    
    // Check for critical issues
    const hasExcessiveApiCalls = Array.from(this.metrics.apiCalls.values())
      .some(data => data.count > 1000);
    
    const hasExcessiveRenders = Array.from(this.metrics.renderCounts.values())
      .some(count => count > 10000);
    
    if (hasExcessiveApiCalls || hasExcessiveRenders) {
      this.sendToMonitoringService('critical', report);
    } else if (this.metrics.errors.length > 50 || this.metrics.warnings.length > 50) {
      this.sendToMonitoringService('warning', report);
    }
    
    // Log summary in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[ProductionMonitor] Metrics Report:', report);
    }
  }

  /**
   * Send data to external monitoring service (e.g., Sentry, DataDog)
   */
  private sendToMonitoringService(level: 'error' | 'warning' | 'critical' | 'info', data: any): void {
    // Implementation would depend on the monitoring service being used
    // Example for Sentry:
    // if (window.Sentry) {
    //   window.Sentry.captureMessage(`[ProductionMonitor] ${level}`, {
    //     level: level === 'critical' ? 'error' : level,
    //     extra: data,
    //   });
    // }
    
    // For now, just log to console
    console.log(`[ProductionMonitor] ${level.toUpperCase()}:`, data);
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics = {
      contextInitializations: new Map(),
      apiCalls: new Map(),
      renderCounts: new Map(),
      errors: [],
      warnings: [],
    };
    this.apiCallTimestamps.clear();
    this.renderTimestamps.clear();
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
    }
  }
}

// Singleton instance
export const productionMonitor = new ProductionMonitor();

// React hook for component render tracking
export const useRenderTracking = (componentName: string): void => {
  useEffect(() => {
    productionMonitor.trackRender(componentName);
  });
};

// Wrapper for fetch to track API calls
export const monitoredFetch = async (
  url: string,
  options?: RequestInit
): Promise<Response> => {
  const method = options?.method || 'GET';
  productionMonitor.trackApiCall(url, method);
  
  try {
    const response = await fetch(url, options);
    
    if (!response.ok && response.status >= 500) {
      productionMonitor.logError(
        `API call failed: ${method} ${url} - Status: ${response.status}`,
        'API_ERROR'
      );
    }
    
    return response;
  } catch (error) {
    productionMonitor.logError(error as Error, `API_FETCH_${method}_${url}`);
    throw error;
  }
};

// Export for use in contexts
export const monitorContextInit = (contextName: string): void => {
  productionMonitor.trackContextInit(contextName);
};

// Export for error boundaries
export const monitorError = (error: Error, errorInfo: React.ErrorInfo): void => {
  productionMonitor.logError(
    `${error.message}\nComponent Stack: ${errorInfo.componentStack}`,
    'ERROR_BOUNDARY'
  );
};
