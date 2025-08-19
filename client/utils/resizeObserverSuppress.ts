// Utility to suppress harmless ResizeObserver errors
// This is a common issue with Recharts and other UI libraries

export const suppressResizeObserverErrors = () => {
  // Suppress ResizeObserver loop errors
  const originalError = window.console.error;
  window.console.error = (...args) => {
    const message = args[0];
    
    // Filter out ResizeObserver errors
    if (
      typeof message === 'string' &&
      (message.includes('ResizeObserver loop completed with undelivered notifications') ||
       message.includes('ResizeObserver loop limit exceeded'))
    ) {
      // Silently ignore these harmless errors
      return;
    }
    
    // Call original console.error for other errors
    originalError.apply(console, args);
  };

  // Also handle global ResizeObserver errors
  window.addEventListener('error', (event) => {
    if (
      event.message?.includes('ResizeObserver loop completed') ||
      event.message?.includes('ResizeObserver loop limit exceeded')
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });

  // Return cleanup function
  return () => {
    window.console.error = originalError;
  };
};
