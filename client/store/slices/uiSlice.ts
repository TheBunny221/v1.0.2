import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    timestamp: number;
    read: boolean;
  }>;
  isOnline: boolean;
  pageLoading: boolean;
}

const initialState: UIState = {
  sidebarOpen: false,
  theme: 'light',
  notifications: [],
  isOnline: navigator.onLine,
  pageLoading: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);
    },
    addNotification: (state, action: PayloadAction<{
      type: 'success' | 'error' | 'warning' | 'info';
      title: string;
      message: string;
    }>) => {
      const notification = {
        id: Date.now().toString(),
        ...action.payload,
        timestamp: Date.now(),
        read: false,
      };
      state.notifications.unshift(notification);
      
      // Keep only last 50 notifications
      if (state.notifications.length > 50) {
        state.notifications = state.notifications.slice(0, 50);
      }
    },
    markNotificationAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification) {
        notification.read = true;
      }
    },
    markAllNotificationsAsRead: (state) => {
      state.notifications.forEach(notification => {
        notification.read = true;
      });
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    clearAllNotifications: (state) => {
      state.notifications = [];
    },
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
    setPageLoading: (state, action: PayloadAction<boolean>) => {
      state.pageLoading = action.payload;
    },
    initializeTheme: (state) => {
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
      if (savedTheme) {
        state.theme = savedTheme;
      } else {
        // Check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        state.theme = prefersDark ? 'dark' : 'light';
      }
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  setTheme,
  addNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  removeNotification,
  clearAllNotifications,
  setOnlineStatus,
  setPageLoading,
  initializeTheme,
} = uiSlice.actions;

export default uiSlice.reducer;
