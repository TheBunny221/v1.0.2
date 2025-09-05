import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Types
export interface Toast {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface Modal {
  id: string;
  type: "alert" | "confirm" | "custom";
  title: string;
  content: string | React.ReactNode;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export interface Notification {
  id: string;
  type:
    | "complaint_submitted"
    | "complaint_assigned"
    | "complaint_updated"
    | "complaint_resolved"
    | "complaint_closed"
    | "sla_warning"
    | "sla_breach"
    | "success"
    | "error"
    | "warning"
    | "info";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  complaintId?: string;
}

export interface UIState {
  // Loading states
  isLoading: boolean;
  loadingText?: string;

  // Network status
  isOnline: boolean;

  // Sidebar
  isSidebarOpen: boolean;
  isSidebarCollapsed: boolean;

  // Theme
  theme: "light" | "dark" | "system";

  // Modals
  modals: Modal[];

  // Toasts
  toasts: Toast[];

  // Notifications
  notifications: Notification[];
  unreadNotificationCount: number;

  // Dialog states
  isDialogOpen: boolean;
  dialogData: any;

  // Filters panel
  isFiltersOpen: boolean;

  // Mobile states
  isMobileMenuOpen: boolean;

  // Page states
  currentPage: string;
  breadcrumbs: Array<{ label: string; href?: string }>;

  // Search
  globalSearchQuery: string;
  isSearchOpen: boolean;

  // Layout
  layout: "default" | "fullscreen" | "minimal";

  // Error states
  hasError: boolean;
  errorMessage?: string;
}

// Initial state
  const initialState: UIState = {
    isLoading: false,
    isOnline: navigator.onLine,
  isSidebarOpen: true,
  isSidebarCollapsed:
    localStorage.getItem("sidebarCollapsed") === "true" || false,
  theme:
    (localStorage.getItem("theme") as "light" | "dark" | "system") || "system",
  modals: [],
  toasts: [],
  notifications: [],
  unreadNotificationCount: 0,
  isDialogOpen: false,
  dialogData: null,
  isFiltersOpen: false,
  isMobileMenuOpen: false,
  currentPage: "",
  breadcrumbs: [],
  globalSearchQuery: "",
  isSearchOpen: false,
  layout: "default",
    hasError: false,
  };

// Helper functions
const generateId = () => Math.random().toString(36).substr(2, 9);

// UI slice
const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    // Loading
    setLoading: (
      state,
      action: PayloadAction<{ isLoading: boolean; text?: string }>,
    ) => {
        state.isLoading = action.payload.isLoading;
        if (action.payload.text !== undefined) {
          state.loadingText = action.payload.text;
        } else {
          delete state.loadingText;
        }
    },

    // Sidebar
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.isSidebarOpen = action.payload;
    },
    toggleSidebarCollapsed: (state) => {
      state.isSidebarCollapsed = !state.isSidebarCollapsed;
      localStorage.setItem(
        "sidebarCollapsed",
        state.isSidebarCollapsed.toString(),
      );
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.isSidebarCollapsed = action.payload;
      localStorage.setItem("sidebarCollapsed", action.payload.toString());
    },

    // Theme
    setTheme: (state, action: PayloadAction<"light" | "dark" | "system">) => {
      state.theme = action.payload;
      localStorage.setItem("theme", action.payload);
    },
    initializeTheme: (state) => {
      // Initialize theme from localStorage or system preference
      const savedTheme = localStorage.getItem("theme") as
        | "light"
        | "dark"
        | "system"
        | null;
      if (savedTheme) {
        state.theme = savedTheme;
      } else {
        state.theme = "system";
        localStorage.setItem("theme", "system");
      }
    },
    initializeSidebar: (state) => {
      // Initialize sidebar state from localStorage
      const savedSidebarCollapsed = localStorage.getItem("sidebarCollapsed");
      if (savedSidebarCollapsed !== null) {
        state.isSidebarCollapsed = savedSidebarCollapsed === "true";
      }
    },

    // Network status
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },

    // Modals
    showModal: (state, action: PayloadAction<Omit<Modal, "id">>) => {
      const modal: Modal = {
        id: generateId(),
        ...action.payload,
      };
      state.modals.push(modal);
    },
    hideModal: (state, action: PayloadAction<string>) => {
      state.modals = state.modals.filter(
        (modal) => modal.id !== action.payload,
      );
    },
    hideAllModals: (state) => {
      state.modals = [];
    },

    // Toasts
    showToast: (state, action: PayloadAction<Omit<Toast, "id">>) => {
      const toast: Toast = {
        id: generateId(),
        duration: 5000,
        ...action.payload,
      };
      state.toasts.push(toast);
    },
    hideToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter(
        (toast) => toast.id !== action.payload,
      );
    },
    hideAllToasts: (state) => {
      state.toasts = [];
    },

    // Notifications
    addNotification: (
      state,
      action: PayloadAction<Omit<Notification, "id">>,
    ) => {
      const notification: Notification = {
        id: generateId(),
        ...action.payload,
      };
      state.notifications.unshift(notification);
      if (!notification.isRead) {
        state.unreadNotificationCount++;
      }
    },
    setNotifications: (state, action: PayloadAction<Notification[]>) => {
      state.notifications = action.payload;
      state.unreadNotificationCount = action.payload.filter(
        (n) => !n.isRead,
      ).length;
    },
    markNotificationAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(
        (n) => n.id === action.payload,
      );
      if (notification && !notification.isRead) {
        notification.isRead = true;
        state.unreadNotificationCount = Math.max(
          0,
          state.unreadNotificationCount - 1,
        );
      }
    },
    markAllNotificationsAsRead: (state) => {
      state.notifications.forEach((notification) => {
        notification.isRead = true;
      });
      state.unreadNotificationCount = 0;
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(
        (n) => n.id === action.payload,
      );
      if (notification && !notification.isRead) {
        state.unreadNotificationCount = Math.max(
          0,
          state.unreadNotificationCount - 1,
        );
      }
      state.notifications = state.notifications.filter(
        (n) => n.id !== action.payload,
      );
    },
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadNotificationCount = 0;
    },

    // Dialog
    openDialog: (state, action: PayloadAction<any>) => {
      state.isDialogOpen = true;
      state.dialogData = action.payload;
    },
    closeDialog: (state) => {
      state.isDialogOpen = false;
      state.dialogData = null;
    },

    // Filters
    toggleFilters: (state) => {
      state.isFiltersOpen = !state.isFiltersOpen;
    },
    setFiltersOpen: (state, action: PayloadAction<boolean>) => {
      state.isFiltersOpen = action.payload;
    },

    // Mobile menu
    toggleMobileMenu: (state) => {
      state.isMobileMenuOpen = !state.isMobileMenuOpen;
    },
    setMobileMenuOpen: (state, action: PayloadAction<boolean>) => {
      state.isMobileMenuOpen = action.payload;
    },

    // Page
    setCurrentPage: (state, action: PayloadAction<string>) => {
      state.currentPage = action.payload;
    },
    setBreadcrumbs: (
      state,
      action: PayloadAction<Array<{ label: string; href?: string }>>,
    ) => {
      state.breadcrumbs = action.payload;
    },

    // Search
    setGlobalSearchQuery: (state, action: PayloadAction<string>) => {
      state.globalSearchQuery = action.payload;
    },
    toggleSearch: (state) => {
      state.isSearchOpen = !state.isSearchOpen;
    },
    setSearchOpen: (state, action: PayloadAction<boolean>) => {
      state.isSearchOpen = action.payload;
    },

    // Layout
    setLayout: (
      state,
      action: PayloadAction<"default" | "fullscreen" | "minimal">,
    ) => {
      state.layout = action.payload;
    },

    // Error
    setError: (
      state,
      action: PayloadAction<{ hasError: boolean; message?: string }>,
    ) => {
      state.hasError = action.payload.hasError;
        if (action.payload.message !== undefined) {
          state.errorMessage = action.payload.message;
        } else {
          delete state.errorMessage;
        }
    },
    clearError: (state) => {
        state.hasError = false;
        delete state.errorMessage;
    },

    // Reset
    resetUI: () => initialState,
  },
});

export const {
  setLoading,
  toggleSidebar,
  setSidebarOpen,
  toggleSidebarCollapsed,
  setSidebarCollapsed,
  setTheme,
  initializeTheme,
  initializeSidebar,
  setOnlineStatus,
  showModal,
  hideModal,
  hideAllModals,
  showToast,
  hideToast,
  hideAllToasts,
  addNotification,
  setNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  removeNotification,
  clearNotifications,
  openDialog,
  closeDialog,
  toggleFilters,
  setFiltersOpen,
  toggleMobileMenu,
  setMobileMenuOpen,
  setCurrentPage,
  setBreadcrumbs,
  setGlobalSearchQuery,
  toggleSearch,
  setSearchOpen,
  setLayout,
  setError,
  clearError,
  resetUI,
} = uiSlice.actions;

export default uiSlice.reducer;

// Selectors
export const selectUI = (state: { ui: UIState }) => state.ui;
export const selectIsLoading = (state: { ui: UIState }) => state.ui.isLoading;
export const selectLoadingText = (state: { ui: UIState }) =>
  state.ui.loadingText;
export const selectIsSidebarOpen = (state: { ui: UIState }) =>
  state.ui.isSidebarOpen;
export const selectIsSidebarCollapsed = (state: { ui: UIState }) =>
  state.ui.isSidebarCollapsed;
export const selectTheme = (state: { ui: UIState }) => state.ui.theme;
export const selectModals = (state: { ui: UIState }) => state.ui.modals;
export const selectToasts = (state: { ui: UIState }) => state.ui.toasts;
export const selectNotifications = (state: { ui: UIState }) =>
  state.ui.notifications;
export const selectUnreadNotificationCount = (state: { ui: UIState }) =>
  state.ui.unreadNotificationCount;
export const selectIsDialogOpen = (state: { ui: UIState }) =>
  state.ui.isDialogOpen;
export const selectDialogData = (state: { ui: UIState }) => state.ui.dialogData;
export const selectIsFiltersOpen = (state: { ui: UIState }) =>
  state.ui.isFiltersOpen;
export const selectIsMobileMenuOpen = (state: { ui: UIState }) =>
  state.ui.isMobileMenuOpen;
export const selectCurrentPage = (state: { ui: UIState }) =>
  state.ui.currentPage;
export const selectBreadcrumbs = (state: { ui: UIState }) =>
  state.ui.breadcrumbs;
export const selectGlobalSearchQuery = (state: { ui: UIState }) =>
  state.ui.globalSearchQuery;
export const selectIsSearchOpen = (state: { ui: UIState }) =>
  state.ui.isSearchOpen;
export const selectLayout = (state: { ui: UIState }) => state.ui.layout;
export const selectHasError = (state: { ui: UIState }) => state.ui.hasError;
export const selectErrorMessage = (state: { ui: UIState }) =>
  state.ui.errorMessage;

// Helper action creators
export const showSuccessToast = (title: string, message: string) =>
  showToast({ type: "success", title, message });

export const showErrorToast = (title: string, message: string) =>
  showToast({ type: "error", title, message });

export const showWarningToast = (title: string, message: string) =>
  showToast({ type: "warning", title, message });

export const showInfoToast = (title: string, message: string) =>
  showToast({ type: "info", title, message });

export const showConfirmModal = (
  title: string,
  content: string,
  onConfirm: () => void,
  onCancel?: () => void,
) =>
  showModal({
    type: "confirm",
    title,
    content,
    onConfirm,
    ...(onCancel ? { onCancel } : {}),
  });

export const showAlertModal = (title: string, content: string) =>
  showModal({
    type: "alert",
    title,
    content,
  });
