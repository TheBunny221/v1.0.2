// Debounced ResizeObserver utility to prevent loop errors
// This wraps ResizeObserver with debouncing to reduce frequency of callbacks

import React from "react";

export const createDebouncedResizeObserver = (
  callback: ResizeObserverCallback,
  delay: number = 16, // Default to ~60fps
) => {
  let timeoutId: number | null = null;
  let latestEntries: ResizeObserverEntry[] = [];
  let observer: ResizeObserver | null = null;

  const debouncedCallback = (
    entries: ResizeObserverEntry[],
    obs: ResizeObserver,
  ) => {
    latestEntries = entries;

    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = window.setTimeout(() => {
      try {
        callback(latestEntries, obs);
      } catch (error) {
        // Silently handle ResizeObserver loop errors
        if (
          !(
            error instanceof Error &&
            error.message.includes("ResizeObserver loop")
          )
        ) {
          console.error("Debounced ResizeObserver error:", error);
        }
      } finally {
        timeoutId = null;
      }
    }, delay);
  };

  // Create the observer
  if (typeof ResizeObserver !== "undefined") {
    observer = new ResizeObserver(debouncedCallback);
  }

  return {
    observe: (target: Element, options?: ResizeObserverOptions) => {
      if (observer) {
        observer.observe(target, options);
      }
    },
    unobserve: (target: Element) => {
      if (observer) {
        observer.unobserve(target);
      }
    },
    disconnect: () => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (observer) {
        observer.disconnect();
        observer = null;
      }
    },
  };
};

// Hook for React components
export const useDebouncedResizeObserver = (
  callback: ResizeObserverCallback,
  delay: number = 16,
) => {
  const observerRef = React.useRef<ReturnType<
    typeof createDebouncedResizeObserver
  > | null>(null);

  React.useEffect(() => {
    observerRef.current = createDebouncedResizeObserver(callback, delay);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [callback, delay]);

  return observerRef.current;
};
