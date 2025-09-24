/**
 * Performance monitoring utility for detecting infinite useEffect loops
 * and excessive API calls
 */

import React from 'react';

interface PerformanceMetrics {
  componentName: string;
  renderCount: number;
  apiCallCount: number;
  lastRenderTime: number;
  apiCalls: Array<{
    url: string;
    timestamp: number;
    method: string;
  }>;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private renderThreshold = 10; // Alert if component renders more than 10 times in 5 seconds
  private apiCallThreshold = 5; // Alert if same API called more than 5 times in 5 seconds
  private timeWindow = 5000; // 5 seconds

  /**
   * Track component render
   */
  trackRender(componentName: string) {
    const now = Date.now();
    const existing = this.metrics.get(componentName);

    if (existing) {
      // Reset counter if outside time window
      if (now - existing.lastRenderTime > this.timeWindow) {
        existing.renderCount = 1;
      } else {
        existing.renderCount++;
      }
      existing.lastRenderTime = now;

      // Alert if threshold exceeded
      if (existing.renderCount > this.renderThreshold) {
        console.warn(
          `🚨 PERFORMANCE WARNING: ${componentName} has rendered ${existing.renderCount} times in ${this.timeWindow}ms. Possible infinite loop detected!`
        );
      }
    } else {
      this.metrics.set(componentName, {
        componentName,
        renderCount: 1,
        apiCallCount: 0,
        lastRenderTime: now,
        apiCalls: [],
      });
    }
  }

  /**
   * Track API call
   */
  trackApiCall(url: string, method: string = 'GET') {
    const now = Date.now();
    
    // Track calls for each unique URL
    for (const [componentName, metrics] of this.metrics.entries()) {
      // Add API call to recent calls
      metrics.apiCalls.push({ url, timestamp: now, method });
      
      // Remove old calls outside time window
      metrics.apiCalls = metrics.apiCalls.filter(
        call => now - call.timestamp <= this.timeWindow
      );
      
      // Count calls to same URL
      const sameUrlCalls = metrics.apiCalls.filter(call => call.url === url);
      
      if (sameUrlCalls.length > this.apiCallThreshold) {
        console.warn(
          `🚨 API WARNING: ${url} called ${sameUrlCalls.length} times in ${this.timeWindow}ms. Possible excessive API calls!`
        );
      }
    }
  }

  /**
   * Get performance report
   */
  getReport(): Record<string, PerformanceMetrics> {
    const report: Record<string, PerformanceMetrics> = {};
    for (const [key, value] of this.metrics.entries()) {
      report[key] = { ...value };
    }
    return report;
  }

  /**
   * Clear metrics
   */
  clear() {
    this.metrics.clear();
  }

  /**
   * Set thresholds
   */
  setThresholds(renderThreshold: number, apiCallThreshold: number, timeWindow: number = 5000) {
    this.renderThreshold = renderThreshold;
    this.apiCallThreshold = apiCallThreshold;
    this.timeWindow = timeWindow;
  }
}

// Global instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * React hook to track component renders
 */
export function useRenderTracker(componentName: string) {
  if (process.env.NODE_ENV === 'development') {
    performanceMonitor.trackRender(componentName);
  }
}

/**
 * Fetch wrapper that tracks API calls
 */
export async function trackedFetch(url: string, options?: RequestInit) {
  if (process.env.NODE_ENV === 'development') {
    performanceMonitor.trackApiCall(url, options?.method || 'GET');
  }
  return fetch(url, options);
}

/**
 * Higher-order component to track renders
 */
export function withRenderTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  const WrappedComponent = (props: P) => {
    const name = componentName || Component.displayName || Component.name;
    useRenderTracker(name);
    return <Component {...props} />;
  };

  WrappedComponent.displayName = `withRenderTracking(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

/**
 * Development-only performance logger
 */
export function logPerformanceReport() {
  if (process.env.NODE_ENV === 'development') {
    const report = performanceMonitor.getReport();
    console.group('📊 Performance Report');
    for (const [componentName, metrics] of Object.entries(report)) {
      console.log(`${componentName}:`, {
        renders: metrics.renderCount,
        apiCalls: metrics.apiCallCount,
        recentApiCalls: metrics.apiCalls.length,
      });
    }
    console.groupEnd();
  }
}

export default performanceMonitor;
