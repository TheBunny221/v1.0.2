// Comprehensive ResizeObserver error fix
// This addresses the "ResizeObserver loop completed with undelivered notifications" error
// which is a known issue with modern browsers and UI libraries

export const fixResizeObserverError = (): void => {
  // Method 1: Patch the global error handler
  const originalErrorHandler = window.onerror;
  window.onerror = (
    message: string | Event,
    source?: string,
    lineno?: number,
    colno?: number,
    error?: Error,
  ): boolean => {
    // Suppress ResizeObserver loop errors
    if (
      typeof message === "string" &&
      message.includes(
        "ResizeObserver loop completed with undelivered notifications",
      )
    ) {
      return true; // Prevent default error handling
    }

    // Call original handler for other errors
    if (originalErrorHandler) {
      return originalErrorHandler(message, source, lineno, colno, error);
    }
    return false;
  };

  // Method 2: Patch addEventListener for error events
  const originalAddEventListener = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function (
    this: unknown,
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ) {
    if (type === "error" && this === window) {
      const wrappedListener = function (this: unknown, event: Event) {
        const errEvent = event as ErrorEvent;
        if (
          errEvent.message?.includes(
            "ResizeObserver loop completed with undelivered notifications",
          )
        ) {
          errEvent.preventDefault();
          errEvent.stopImmediatePropagation();
          return;
        }

        if (typeof listener === "function") {
          (listener as EventListener).call(this, event);
        } else if (
          listener &&
          typeof listener === "object" &&
          "handleEvent" in listener
        ) {
          (listener as EventListenerObject).handleEvent(event);
        }
      };

      originalAddEventListener.call(this, type, wrappedListener, options);
    } else {
      originalAddEventListener.call(this, type, listener, options);
    }
  };

  // Method 3: Create a safe ResizeObserver wrapper
  if (typeof ResizeObserver !== "undefined") {
    const OriginalResizeObserver = ResizeObserver;

    const SafeResizeObserver = class extends OriginalResizeObserver {
      constructor(callback: ResizeObserverCallback) {
        const safeCallback = (
          entries: ResizeObserverEntry[],
          observer: ResizeObserver,
        ) => {
          requestAnimationFrame(() => {
            try {
              callback(entries, observer);
            } catch (error) {
              // Only log non-ResizeObserver loop errors
              if (
                !(
                  error instanceof Error &&
                  error.message.includes("ResizeObserver loop")
                )
              ) {
                console.error("ResizeObserver callback error:", error);
              }
            }
          });
        };

        super(safeCallback);
      }
    };

    // Replace global ResizeObserver
    (window as any).ResizeObserver = SafeResizeObserver;
  }

  // Method 4: Suppress specific console errors
  const originalConsoleError = console.error;
  console.error = (...args: unknown[]) => {
    const message = args[0];
    if (
      typeof message === "string" &&
      message.includes(
        "ResizeObserver loop completed with undelivered notifications",
      )
    ) {
      // Silently ignore ResizeObserver loop errors
      return;
    }
    originalConsoleError.apply(console, args);
  };

  console.info("🔧 ResizeObserver error suppression initialized");
};
