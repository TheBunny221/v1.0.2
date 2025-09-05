import React from "react";

// Analytics and Event Tracking System

export interface AnalyticsEvent {
  event: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  userId?: string;
  metadata?: Record<string, any>;
  timestamp?: number;
}

type LayoutShift = PerformanceEntry & { value: number; hadRecentInput: boolean };

export interface ErrorEvent {
  error: Error | string;
  context?: string;
  userId?: string;
  userAgent?: string;
  url?: string;
  metadata?: Record<string, any>;
  timestamp?: number;
  severity?: "low" | "medium" | "high" | "critical";
}

export interface PerformanceEvent {
  name: string;
  duration: number;
  startTime: number;
  endTime: number;
  metadata?: Record<string, any>;
  timestamp?: number;
}

export interface UserEvent {
  userId: string;
  action: string;
  entity?: string;
  entityId?: string;
  previousValue?: any;
  newValue?: any;
  metadata?: Record<string, any>;
  timestamp?: number;
}

class AnalyticsManager {
  private isEnabled: boolean = true;
  private userId: string | null = null;
  private sessionId: string;
  private eventQueue: AnalyticsEvent[] = [];
  private errorQueue: ErrorEvent[] = [];
  private performanceQueue: PerformanceEvent[] = [];
  private userEventQueue: UserEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private isOnline: boolean = navigator.onLine;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeFlushInterval();
    this.setupOnlineStatusListener();
    this.setupUnloadListener();
    this.setupPerformanceObserver();
  }

  // Configuration
  setUserId(userId: string | null) {
    this.userId = userId;
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  // Event Tracking
  track(event: Omit<AnalyticsEvent, "timestamp" | "userId">) {
    if (!this.isEnabled) return;

      const enhancedEvent: AnalyticsEvent = {
        ...event,
        ...(this.userId ? { userId: this.userId } : {}),
        timestamp: Date.now(),
      };

    this.eventQueue.push(enhancedEvent);
    this.scheduleFlush();

    // Send to external analytics if available
    this.sendToExternalAnalytics(enhancedEvent);
  }

  // Error Tracking
  trackError(
    error: Error | string,
    context?: string,
    metadata?: Record<string, any>,
    severity: ErrorEvent["severity"] = "medium",
  ) {
    if (!this.isEnabled) return;

    const errorEvent: ErrorEvent = {
      error,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: Date.now(),
      severity,
      ...(context ? { context } : {}),
      ...(this.userId ? { userId: this.userId } : {}),
      ...(metadata ? { metadata } : {}),
    };

    this.errorQueue.push(errorEvent);
    this.scheduleFlush();

    // Send to external error tracking
    this.sendToExternalErrorTracking(errorEvent);

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("Analytics Error:", errorEvent);
    }
  }

  // Performance Tracking
  trackPerformance(
    name: string,
    duration: number,
    metadata?: Record<string, any>,
  ) {
    if (!this.isEnabled) return;

    const performanceEvent: PerformanceEvent = {
      name,
      duration,
      startTime: performance.now() - duration,
      endTime: performance.now(),
      timestamp: Date.now(),
      ...(metadata ? { metadata } : {}),
    };

    this.performanceQueue.push(performanceEvent);
    this.scheduleFlush();
  }

  // User Action Tracking
  trackUserAction(
    action: string,
    entity?: string,
    entityId?: string,
    metadata?: Record<string, any>,
  ) {
    if (!this.isEnabled || !this.userId) return;

    const userEvent: UserEvent = {
      userId: this.userId,
      action,
      timestamp: Date.now(),
      ...(entity ? { entity } : {}),
      ...(entityId ? { entityId } : {}),
      ...(metadata ? { metadata } : {}),
    };

    this.userEventQueue.push(userEvent);
    this.scheduleFlush();
  }

  // Page View Tracking
    trackPageView(page: string, title?: string, metadata?: Record<string, any>) {
      const payload: Omit<AnalyticsEvent, "timestamp" | "userId"> = {
        event: "page_view",
        category: "navigation",
        action: "view",
        label: page,
      };
      const combinedMeta = { ...(title ? { title } : {}), ...metadata };
      if (Object.keys(combinedMeta).length > 0) {
        payload.metadata = combinedMeta;
      }
      this.track(payload);
    }

  // Complaint System Specific Events
  trackComplaintEvent(
    action: string,
    complaintId?: string,
    metadata?: Record<string, any>,
  ) {
      const payload: Omit<AnalyticsEvent, "timestamp" | "userId"> = {
        event: "complaint_action",
        category: "complaints",
        action,
        ...(complaintId ? { label: complaintId } : {}),
      };
      if (metadata) payload.metadata = metadata;
      this.track(payload);

    this.trackUserAction(action, "complaint", complaintId, metadata);
  }

  trackAuthEvent(
    action: string,
    method?: string,
    metadata?: Record<string, any>,
  ) {
      const payload: Omit<AnalyticsEvent, "timestamp" | "userId"> = {
        event: "auth_action",
        category: "authentication",
        action,
        ...(method ? { label: method } : {}),
      };
      if (metadata) payload.metadata = metadata;
      this.track(payload);
  }

  trackFormEvent(
    action: string,
    formName: string,
    metadata?: Record<string, any>,
  ) {
      const payload: Omit<AnalyticsEvent, "timestamp" | "userId"> = {
        event: "form_action",
        category: "forms",
        action,
        label: formName,
      };
      if (metadata) payload.metadata = metadata;
      this.track(payload);
  }

  trackSearchEvent(
    query: string,
    results: number,
    metadata?: Record<string, any>,
  ) {
      const payload: Omit<AnalyticsEvent, "timestamp" | "userId"> = {
        event: "search",
        category: "search",
        action: "query",
        label: query,
        value: results,
      };
      if (metadata) payload.metadata = metadata;
      this.track(payload);
  }

  // Private methods
  private generateSessionId(): string {
    return (
      "session_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9)
    );
  }

  private initializeFlushInterval() {
    this.flushInterval = setInterval(() => {
      this.flush();
    }, 30000); // Flush every 30 seconds
  }

  private scheduleFlush() {
    // Flush immediately if queues are getting large
    const totalEvents =
      this.eventQueue.length +
      this.errorQueue.length +
      this.performanceQueue.length +
      this.userEventQueue.length;

    if (totalEvents >= 10) {
      this.flush();
    }
  }

  private async flush() {
    if (!this.isOnline) return;

    const events = [...this.eventQueue];
    const errors = [...this.errorQueue];
    const performance = [...this.performanceQueue];
    const userEvents = [...this.userEventQueue];

    // Clear queues
    this.eventQueue = [];
    this.errorQueue = [];
    this.performanceQueue = [];
    this.userEventQueue = [];

    if (
      events.length === 0 &&
      errors.length === 0 &&
      performance.length === 0 &&
      userEvents.length === 0
    ) {
      return;
    }

    try {
      await this.sendToServer({
        sessionId: this.sessionId,
        events,
        errors,
        performance,
        userEvents,
        timestamp: Date.now(),
      });
    } catch (error) {
      // Put events back in queue if sending failed
      this.eventQueue.unshift(...events);
      this.errorQueue.unshift(...errors);
      this.performanceQueue.unshift(...performance);
      this.userEventQueue.unshift(...userEvents);

      console.warn("Failed to send analytics data:", error);
    }
  }

  private async sendToServer(data: any) {
    const response = await fetch("/api/analytics", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Analytics server responded with ${response.status}`);
    }
  }

  private sendToExternalAnalytics(event: AnalyticsEvent) {
    // Google Analytics 4
    if (window.gtag) {
      window.gtag("event", event.action, {
        event_category: event.category,
        event_label: event.label,
        value: event.value,
        custom_parameter_1: event.metadata?.source,
        custom_parameter_2: event.metadata?.feature,
      });
    }
  }

  private sendToExternalErrorTracking(error: ErrorEvent) {
    // Sentry
    if (window.Sentry) {
      window.Sentry.captureException(error.error, {
        tags: {
          context: error.context,
          severity: error.severity,
        },
        extra: error.metadata,
        user: {
          id: error.userId,
        },
      });
    }
  }

  private setupOnlineStatusListener() {
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.flush(); // Flush queued events when back online
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
    });
  }

  private setupUnloadListener() {
    window.addEventListener("beforeunload", () => {
      // Use sendBeacon for reliable delivery on page unload
      if (navigator.sendBeacon && this.isOnline) {
        const data = {
          sessionId: this.sessionId,
          events: this.eventQueue,
          errors: this.errorQueue,
          performance: this.performanceQueue,
          userEvents: this.userEventQueue,
          timestamp: Date.now(),
        };

        navigator.sendBeacon("/api/analytics", JSON.stringify(data));
      }
    });
  }

  private setupPerformanceObserver() {
    if ("PerformanceObserver" in window) {
      // Track Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries() as PerformanceEntry[];
        const lastEntry = entries[entries.length - 1] as LargestContentfulPaint;

        this.trackPerformance("lcp", lastEntry.startTime, {
          element: lastEntry.element?.tagName,
          url: lastEntry.url,
        });
      });

      lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });

      // Track First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries() as PerformanceEventTiming[];
        entries.forEach((entry) => {
          this.trackPerformance("fid", entry.processingStart - entry.startTime, {
            eventType: entry.name,
          });
        });
      });

      fidObserver.observe({ entryTypes: ["first-input"] });

      // Track Cumulative Layout Shift
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as LayoutShift[]) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }

        this.trackPerformance("cls", clsValue);
      });

      clsObserver.observe({ entryTypes: ["layout-shift"] });
    }
  }

  // Public method to get analytics data for debugging
  getQueueStatus() {
    return {
      events: this.eventQueue.length,
      errors: this.errorQueue.length,
      performance: this.performanceQueue.length,
      userEvents: this.userEventQueue.length,
      sessionId: this.sessionId,
      userId: this.userId,
      isEnabled: this.isEnabled,
      isOnline: this.isOnline,
    };
  }
}

// Global analytics instance
export const analytics = new AnalyticsManager();

// React Hook for analytics
export function useAnalytics() {
  return {
    track: analytics.track.bind(analytics),
    trackError: analytics.trackError.bind(analytics),
    trackPerformance: analytics.trackPerformance.bind(analytics),
    trackUserAction: analytics.trackUserAction.bind(analytics),
    trackPageView: analytics.trackPageView.bind(analytics),
    trackComplaintEvent: analytics.trackComplaintEvent.bind(analytics),
    trackAuthEvent: analytics.trackAuthEvent.bind(analytics),
    trackFormEvent: analytics.trackFormEvent.bind(analytics),
    trackSearchEvent: analytics.trackSearchEvent.bind(analytics),
    setUserId: analytics.setUserId.bind(analytics),
    getQueueStatus: analytics.getQueueStatus.bind(analytics),
  };
}

// Higher-order component for automatic page view tracking
export function withPageTracking<P extends object>(
  Component: React.ComponentType<P>,
  pageName: string,
) {
  return function TrackedComponent(props: P) {
    React.useEffect(() => {
      analytics.trackPageView(pageName);
    }, []);

    return React.createElement(Component, props);
  };
}

// Error boundary with analytics
export class AnalyticsErrorBoundary extends React.Component<
  {
    children: React.ReactNode;
    fallback?: React.ComponentType<{ error: Error }>;
  },
  { hasError: boolean; error: Error | null }
> {
  constructor(
    props: {
      children: React.ReactNode;
      fallback?: React.ComponentType<{ error: Error }>;
    },
  ) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    analytics.trackError(
      error,
      "react_error_boundary",
      {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
      },
      "high",
    );
  }

  override render() {
    if (this.state.hasError && this.state.error) {
      const Fallback = this.props.fallback;
      return Fallback
        ? React.createElement(Fallback, { error: this.state.error })
        : React.createElement("div", {}, "Something went wrong.");
    }

    return this.props.children;
  }
}

// Type declarations for external services
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    Sentry?: {
      captureException: (error: any, context?: any) => void;
    };
  }
}

export default analytics;
