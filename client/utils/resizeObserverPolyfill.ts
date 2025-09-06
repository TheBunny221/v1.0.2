// ResizeObserver polyfill that prevents loop errors
// This creates a wrapper around ResizeObserver to handle loop detection gracefully

export const installResizeObserverPolyfill = () => {
  if (typeof window === "undefined" || !window.ResizeObserver) {
    return;
  }

  const OriginalResizeObserver = window.ResizeObserver;

  class SafeResizeObserver extends OriginalResizeObserver {
    private callback: ResizeObserverCallback;
    private isObserving: boolean = false;
    private pendingCallback: boolean = false;

    constructor(callback: ResizeObserverCallback) {
      // Wrap the callback to prevent loop errors
      const safeCallback: ResizeObserverCallback = (
        entries,
        observer,
      ) => {
        // Prevent recursive calls
        if (this.pendingCallback) {
          return;
        }

        this.pendingCallback = true;

        // Use requestAnimationFrame to defer the callback
        requestAnimationFrame(() => {
          try {
            callback(entries, observer);
          } catch (error: unknown) {
            // Silently catch ResizeObserver loop errors
            if (error instanceof Error) {
              if (!error.message.includes("ResizeObserver loop")) {
                console.error("ResizeObserver callback error:", error);
              }
            }
          } finally {
            this.pendingCallback = false;
          }
        });
      };

      super(safeCallback);
      this.callback = callback;
    }

    override observe(target: Element, options?: ResizeObserverOptions) {
      if (!this.isObserving) {
        this.isObserving = true;
      }
      super.observe(target, options);
    }

    override unobserve(target: Element) {
      super.unobserve(target);
    }

    override disconnect() {
      this.isObserving = false;
      this.pendingCallback = false;
      super.disconnect();
    }
  }

  // Replace the global ResizeObserver
  window.ResizeObserver = SafeResizeObserver as any;
};
