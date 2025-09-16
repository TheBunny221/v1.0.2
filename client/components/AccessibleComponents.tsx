import React, { useRef, useEffect } from "react";
import { cn } from "../lib/utils";
import {
  useFocusTrap,
  useKeyboardNavigation,
  useScreenReader,
  useFocusManagement,
} from "../hooks/useAccessibility";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { X, AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react";

// Accessible Modal/Dialog Component
interface AccessibleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  closeOnEscape?: boolean;
  closeOnOverlayClick?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

export const AccessibleDialog: React.FC<AccessibleDialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
  closeOnEscape = true,
  closeOnOverlayClick = true,
  size = "md",
}) => {
  const { saveFocus, restoreFocus } = useFocusManagement();
  const { announce } = useScreenReader();

  useEffect(() => {
    if (isOpen) {
      saveFocus();
      announce(`Dialog opened: ${title}`, "polite");
    } else {
      restoreFocus();
    }
  }, [isOpen, saveFocus, restoreFocus, announce, title]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && closeOnEscape) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose, closeOnEscape]);

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={closeOnOverlayClick ? onClose : undefined}
    >
      <DialogContent
        className={cn(sizeClasses[size], className)}
        onPointerDownOutside={
          closeOnOverlayClick ? undefined : (e) => e.preventDefault()
        }
        aria-labelledby="dialog-title"
        aria-describedby={description ? "dialog-description" : undefined}
      >
        <DialogHeader>
          <DialogTitle id="dialog-title">{title}</DialogTitle>
          {description && (
            <DialogDescription id="dialog-description">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="mt-4">{children}</div>
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-4 top-4"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X className="h-4 w-4" />
        </Button>
      </DialogContent>
    </Dialog>
  );
};

// Skip Links Component
interface SkipLinksProps {
  links: Array<{ target: string; label: string }>;
  className?: string;
}

export const SkipLinks: React.FC<SkipLinksProps> = ({ links, className }) => {
  return (
    <div className={cn("sr-only focus-within:not-sr-only", className)}>
      {links.map(({ target, label }) => (
        <a
          key={target}
          href={`#${target}`}
          className="fixed top-4 left-4 z-[9999] bg-primary text-primary-foreground px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {label}
        </a>
      ))}
    </div>
  );
};

// Live Region for Screen Reader Announcements
interface LiveRegionProps {
  message: string;
  priority?: "polite" | "assertive";
  atomic?: boolean;
  className?: string;
}

export const LiveRegion: React.FC<LiveRegionProps> = ({
  message,
  priority = "polite",
  atomic = true,
  className,
}) => {
  return (
    <div
      aria-live={priority}
      aria-atomic={atomic}
      className={cn("sr-only", className)}
    >
      {message}
    </div>
  );
};

// Accessible Alert Component
interface AccessibleAlertProps {
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  onClose?: () => void;
  className?: string;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export const AccessibleAlert: React.FC<AccessibleAlertProps> = ({
  type,
  title,
  message,
  onClose,
  className,
  autoClose = false,
  autoCloseDelay = 5000,
}) => {
  const { announce } = useScreenReader();

  useEffect(() => {
    announce(
      `${type}: ${title}. ${message}`,
      type === "error" ? "assertive" : "polite",
    );
  }, [announce, type, title, message]);

  useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(onClose, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose, autoCloseDelay]);

  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const Icon = icons[type];

  const typeClasses = {
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
  };

  const iconClasses = {
    success: "text-green-400",
    error: "text-red-400",
    warning: "text-yellow-400",
    info: "text-blue-400",
  };

  return (
    <div
      role="alert"
      aria-labelledby="alert-title"
      aria-describedby="alert-message"
      className={cn("rounded-md border p-4", typeClasses[type], className)}
    >
      <div className="flex">
        <div className="flex-shrink-0">
          <Icon
            className={cn("h-5 w-5", iconClasses[type])}
            aria-hidden="true"
          />
        </div>
        <div className="ml-3 flex-1">
          <h3 id="alert-title" className="text-sm font-medium">
            {title}
          </h3>
          <div id="alert-message" className="mt-2 text-sm">
            {message}
          </div>
        </div>
        {onClose && (
          <div className="ml-auto pl-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-inherit hover:bg-black/10"
              aria-label={`Close ${type} alert`}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

// Accessible Tabs Component
interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
  disabled?: boolean;
}

interface AccessibleTabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onTabChange?: (tabId: string) => void;
  className?: string;
  orientation?: "horizontal" | "vertical";
}

export const AccessibleTabs: React.FC<AccessibleTabsProps> = ({
  tabs,
  defaultTab,
  onTabChange,
  className,
  orientation = "horizontal",
}) => {
  const [activeTab, setActiveTab] = React.useState(defaultTab || tabs[0]?.id);
  const tabListRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const enabledTabs = tabs.filter((tab) => !tab.disabled);
  const enabledTabElements = tabRefs.current.filter(Boolean);

  useKeyboardNavigation(enabledTabElements, {
    orientation,
    onSelect: (index) => {
      const tab = enabledTabs[index];
      if (tab) {
        setActiveTab(tab.id);
        onTabChange?.(tab.id);
      }
    },
  });

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    onTabChange?.(tabId);
  };

  const activeTabContent = tabs.find((tab) => tab.id === activeTab)?.content;

  return (
    <div className={cn("w-full", className)}>
      <div
        ref={tabListRef}
        role="tablist"
        aria-orientation={orientation}
        className={cn(
          "flex border-b border-gray-200",
          orientation === "vertical" && "flex-col border-b-0 border-r",
        )}
      >
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            ref={(el) => {
              if (!tab.disabled) {
                const enabledIndex = enabledTabs.findIndex(
                  (t) => t.id === tab.id,
                );
                if (enabledIndex >= 0) {
                  tabRefs.current[enabledIndex] = el;
                }
              }
            }}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            id={`tab-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            disabled={tab.disabled}
            onClick={() => handleTabClick(tab.id)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-t-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              activeTab === tab.id
                ? "bg-white border-b-2 border-primary text-primary"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50",
              orientation === "vertical" && "rounded-t-none rounded-l-lg",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        tabIndex={0}
        className="mt-4 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
      >
        {activeTabContent}
      </div>
    </div>
  );
};

// Accessible Menu Component
interface MenuItem {
  id: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  icon?: React.ReactNode;
  shortcut?: string;
}

interface AccessibleMenuProps {
  trigger: React.ReactElement;
  items: MenuItem[];
  className?: string;
  placement?: "bottom-start" | "bottom-end" | "top-start" | "top-end";
}

export const AccessibleMenu: React.FC<AccessibleMenuProps> = ({
  trigger,
  items,
  className,
  placement = "bottom-start",
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [focusedIndex, setFocusedIndex] = React.useState(-1);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const { saveFocus, restoreFocus } = useFocusManagement();

  const focusTrapRef = useFocusTrap<HTMLDivElement>(isOpen);

  const enabledItems = items.filter((item) => !item.disabled);

  useKeyboardNavigation(itemRefs.current.filter(Boolean), {
    orientation: "vertical",
    onSelect: (index) => {
      const item = enabledItems[index];
      if (item) {
        item.onClick();
        setIsOpen(false);
      }
    },
    onEscape: () => setIsOpen(false),
  });

  useEffect(() => {
    if (isOpen) {
      saveFocus();
    } else {
      restoreFocus();
    }
  }, [isOpen, saveFocus, restoreFocus]);

  const handleTriggerClick = () => {
    setIsOpen(!isOpen);
  };

  const handleItemClick = (item: MenuItem) => {
    item.onClick();
    setIsOpen(false);
  };

  const placementClasses = {
    "bottom-start": "top-full left-0 mt-1",
    "bottom-end": "top-full right-0 mt-1",
    "top-start": "bottom-full left-0 mb-1",
    "top-end": "bottom-full right-0 mb-1",
  };

  return (
    <div className="relative">
      {React.cloneElement(trigger, {
        onClick: handleTriggerClick,
        "aria-expanded": isOpen,
        "aria-haspopup": "menu",
        id: "menu-trigger",
      })}

      {isOpen && (
        <div
          ref={focusTrapRef}
          role="menu"
          aria-labelledby="menu-trigger"
          className={cn(
            "absolute z-50 min-w-48 bg-white border border-gray-200 rounded-md shadow-lg",
            placementClasses[placement],
            className,
          )}
        >
          <div className="py-1">
            {items.map((item, index) => {
              const enabledIndex = enabledItems.findIndex(
                (i) => i.id === item.id,
              );
              return (
                <button
                  key={item.id}
                  ref={(el) => {
                    if (!item.disabled && enabledIndex >= 0) {
                      itemRefs.current[enabledIndex] = el;
                    }
                  }}
                  role="menuitem"
                  disabled={item.disabled}
                  onClick={() => handleItemClick(item)}
                  className={cn(
                    "flex w-full items-center px-3 py-2 text-sm text-left",
                    "hover:bg-gray-100 focus:bg-gray-100 focus:outline-none",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    focusedIndex === enabledIndex && "bg-gray-100",
                  )}
                >
                  {item.icon && (
                    <span className="mr-3 flex-shrink-0" aria-hidden="true">
                      {item.icon}
                    </span>
                  )}
                  <span className="flex-1">{item.label}</span>
                  {item.shortcut && (
                    <span
                      className="ml-3 text-xs text-gray-400"
                      aria-hidden="true"
                    >
                      {item.shortcut}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// Progress Indicator with Screen Reader Support
interface AccessibleProgressProps {
  value: number;
  max?: number;
  label: string;
  description?: string;
  className?: string;
  showPercentage?: boolean;
}

export const AccessibleProgress: React.FC<AccessibleProgressProps> = ({
  value,
  max = 100,
  label,
  description,
  className,
  showPercentage = true,
}) => {
  const percentage = Math.round((value / max) * 100);

  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-2">
        <label id="progress-label" className="text-sm font-medium">
          {label}
        </label>
        {showPercentage && (
          <span aria-hidden="true" className="text-sm text-gray-500">
            {percentage}%
          </span>
        )}
      </div>
      {description && (
        <p id="progress-description" className="text-xs text-gray-600 mb-2">
          {description}
        </p>
      )}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-labelledby="progress-label"
        aria-describedby={description ? "progress-description" : undefined}
        className="w-full bg-gray-200 rounded-full h-2 overflow-hidden"
      >
        <div
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="sr-only">
        {label}: {percentage}% complete
      </div>
    </div>
  );
};

export default {
  AccessibleDialog,
  SkipLinks,
  LiveRegion,
  AccessibleAlert,
  AccessibleTabs,
  AccessibleMenu,
  AccessibleProgress,
};
