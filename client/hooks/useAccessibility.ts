import { useEffect, useRef, useCallback, useState } from "react";
import { useAppSelector } from "../store/hooks";
import { selectTranslations } from "../store/slices/languageSlice";

// Hook for managing focus traps
export function useFocusTrap<T extends HTMLElement>(isActive: boolean = true) {
  const containerRef = useRef<T>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // Let parent components handle escape
        e.stopPropagation();
      }
    };

    // Focus first element when trap becomes active
    if (firstElement) {
      firstElement.focus();
    }

    document.addEventListener("keydown", handleTabKey);
    document.addEventListener("keydown", handleEscapeKey);

    return () => {
      document.removeEventListener("keydown", handleTabKey);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isActive]);

  return containerRef;
}

// Hook for keyboard navigation
export function useKeyboardNavigation(
  items: HTMLElement[],
  options: {
    orientation?: "horizontal" | "vertical" | "both";
    loop?: boolean;
    onSelect?: (index: number) => void;
    onEscape?: () => void;
  } = {},
) {
  const { orientation = "vertical", loop = true, onSelect, onEscape } = options;

  const [currentIndex, setCurrentIndex] = useState(-1);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (items.length === 0) return;

      const { key } = event;
      let newIndex = currentIndex;

      switch (key) {
        case "ArrowUp":
          if (orientation === "vertical" || orientation === "both") {
            newIndex =
              currentIndex > 0 ? currentIndex - 1 : loop ? items.length - 1 : 0;
            event.preventDefault();
          }
          break;
        case "ArrowDown":
          if (orientation === "vertical" || orientation === "both") {
            newIndex =
              currentIndex < items.length - 1
                ? currentIndex + 1
                : loop
                  ? 0
                  : items.length - 1;
            event.preventDefault();
          }
          break;
        case "ArrowLeft":
          if (orientation === "horizontal" || orientation === "both") {
            newIndex =
              currentIndex > 0 ? currentIndex - 1 : loop ? items.length - 1 : 0;
            event.preventDefault();
          }
          break;
        case "ArrowRight":
          if (orientation === "horizontal" || orientation === "both") {
            newIndex =
              currentIndex < items.length - 1
                ? currentIndex + 1
                : loop
                  ? 0
                  : items.length - 1;
            event.preventDefault();
          }
          break;
        case "Home":
          newIndex = 0;
          event.preventDefault();
          break;
        case "End":
          newIndex = items.length - 1;
          event.preventDefault();
          break;
        case "Enter":
        case " ":
          if (currentIndex >= 0 && onSelect) {
            onSelect(currentIndex);
            event.preventDefault();
          }
          break;
        case "Escape":
          if (onEscape) {
            onEscape();
            event.preventDefault();
          }
          break;
      }

      if (
        newIndex !== currentIndex &&
        newIndex >= 0 &&
        newIndex < items.length
      ) {
        setCurrentIndex(newIndex);
        items[newIndex]?.focus();
      }
    },
    [currentIndex, items, orientation, loop, onSelect, onEscape],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return { currentIndex, setCurrentIndex };
}

// Hook for screen reader announcements
export function useScreenReader() {
  const translations = useAppSelector(selectTranslations);

  const announce = useCallback(
    (message: string, priority: "polite" | "assertive" = "polite") => {
      const announcement = document.createElement("div");
      announcement.setAttribute("aria-live", priority);
      announcement.setAttribute("aria-atomic", "true");
      announcement.setAttribute("class", "sr-only");
      announcement.textContent = message;

      document.body.appendChild(announcement);

      // Remove after announcement
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
    },
    [],
  );

  const announceSuccess = useCallback(
    (message?: string) => {
      const successMessage =
        message ||
        translations?.common?.success ||
        "Operation completed successfully";
      announce(successMessage, "polite");
    },
    [announce, translations],
  );

  const announceError = useCallback(
    (message?: string) => {
      const errorMessage =
        message || translations?.common?.error || "An error occurred";
      announce(errorMessage, "assertive");
    },
    [announce, translations],
  );

  const announceLoading = useCallback(
    (message?: string) => {
      const loadingMessage =
        message || translations?.common?.loading || "Loading...";
      announce(loadingMessage, "polite");
    },
    [announce, translations],
  );

  return {
    announce,
    announceSuccess,
    announceError,
    announceLoading,
  };
}

// Hook for skip links
export function useSkipLinks() {
  const skipLinksRef = useRef<HTMLDivElement>(null);

  const addSkipLink = useCallback((target: string, label: string) => {
    if (!skipLinksRef.current) return;

    const link = document.createElement("a");
    link.href = `#${target}`;
    link.textContent = label;
    link.className =
      "skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded";

    skipLinksRef.current.appendChild(link);
  }, []);

  return { skipLinksRef, addSkipLink };
}

// Hook for reduced motion preference
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return prefersReducedMotion;
}

// Hook for high contrast mode
export function useHighContrast() {
  const [prefersHighContrast, setPrefersHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-contrast: high)");
    setPrefersHighContrast(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setPrefersHighContrast(event.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return prefersHighContrast;
}

// Hook for managing ARIA attributes
export function useAriaAttributes() {
  const setAriaLabel = useCallback(
    (element: HTMLElement | null, label: string) => {
      if (element) {
        element.setAttribute("aria-label", label);
      }
    },
    [],
  );

  const setAriaDescribedBy = useCallback(
    (element: HTMLElement | null, ids: string | string[]) => {
      if (element) {
        const idString = Array.isArray(ids) ? ids.join(" ") : ids;
        element.setAttribute("aria-describedby", idString);
      }
    },
    [],
  );

  const setAriaExpanded = useCallback(
    (element: HTMLElement | null, expanded: boolean) => {
      if (element) {
        element.setAttribute("aria-expanded", expanded.toString());
      }
    },
    [],
  );

  const setAriaSelected = useCallback(
    (element: HTMLElement | null, selected: boolean) => {
      if (element) {
        element.setAttribute("aria-selected", selected.toString());
      }
    },
    [],
  );

  const setAriaChecked = useCallback(
    (element: HTMLElement | null, checked: boolean | "mixed") => {
      if (element) {
        element.setAttribute("aria-checked", checked.toString());
      }
    },
    [],
  );

  const setAriaDisabled = useCallback(
    (element: HTMLElement | null, disabled: boolean) => {
      if (element) {
        element.setAttribute("aria-disabled", disabled.toString());
      }
    },
    [],
  );

  const setAriaHidden = useCallback(
    (element: HTMLElement | null, hidden: boolean) => {
      if (element) {
        element.setAttribute("aria-hidden", hidden.toString());
      }
    },
    [],
  );

  const setAriaLive = useCallback(
    (element: HTMLElement | null, live: "off" | "polite" | "assertive") => {
      if (element) {
        element.setAttribute("aria-live", live);
      }
    },
    [],
  );

  return {
    setAriaLabel,
    setAriaDescribedBy,
    setAriaExpanded,
    setAriaSelected,
    setAriaChecked,
    setAriaDisabled,
    setAriaHidden,
    setAriaLive,
  };
}

// Hook for focus management
export function useFocusManagement() {
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  const saveFocus = useCallback(() => {
    previouslyFocusedElement.current = document.activeElement as HTMLElement;
  }, []);

  const restoreFocus = useCallback(() => {
    if (previouslyFocusedElement.current) {
      previouslyFocusedElement.current.focus();
      previouslyFocusedElement.current = null;
    }
  }, []);

  const focusFirst = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const firstElement = focusableElements[0] as HTMLElement;
    if (firstElement) {
      firstElement.focus();
    }
  }, []);

  const focusLast = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const lastElement = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement;
    if (lastElement) {
      lastElement.focus();
    }
  }, []);

  return {
    saveFocus,
    restoreFocus,
    focusFirst,
    focusLast,
  };
}

// Hook for color contrast checking
export function useColorContrast() {
  const checkContrast = useCallback(
    (foreground: string, background: string): number => {
      // Convert hex to RGB
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
          ? {
              r: parseInt(result[1]!, 16),
              g: parseInt(result[2]!, 16),
              b: parseInt(result[3]!, 16),
            }
          : null;
      };

      // Calculate relative luminance
      const getLuminance = (r: number, g: number, b: number) => {
        const mapped = [r, g, b].map((c) => {
          c = c / 255;
          return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        const rs = mapped[0]!;
        const gs = mapped[1]!;
        const bs = mapped[2]!;
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
      };

      const fgRgb = hexToRgb(foreground);
      const bgRgb = hexToRgb(background);

      if (!fgRgb || !bgRgb) return 0;

      const fgLuminance = getLuminance(fgRgb.r, fgRgb.g, fgRgb.b);
      const bgLuminance = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);

      const lighter = Math.max(fgLuminance, bgLuminance);
      const darker = Math.min(fgLuminance, bgLuminance);

      return (lighter + 0.05) / (darker + 0.05);
    },
    [],
  );

  const isAACompliant = useCallback(
    (foreground: string, background: string): boolean => {
      return checkContrast(foreground, background) >= 4.5;
    },
    [checkContrast],
  );

  const isAAACompliant = useCallback(
    (foreground: string, background: string): boolean => {
      return checkContrast(foreground, background) >= 7;
    },
    [checkContrast],
  );

  return {
    checkContrast,
    isAACompliant,
    isAAACompliant,
  };
}
