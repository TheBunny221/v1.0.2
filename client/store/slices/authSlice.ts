import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export type UserRole = 'citizen' | 'admin' | 'ward-officer' | 'maintenance';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  ward?: string;
  department?: string;
  avatar?: string;
  preferences: {
    language: 'en' | 'hi' | 'ml';
    notifications: boolean;
    emailAlerts: boolean;
  };
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isGuest: boolean; // For non-logged-in citizens filing complaints
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isGuest: false,
};

// Mock JWT decode function - in real app, use jwt-decode library
const decodeToken = (token: string): { user: User; exp: number } | null => {
  try {
    // Mock token structure for demo
    const mockUsers: Record<string, User> = {
      'admin-token': {
        id: 'admin-001',
        name: 'Admin User',
        email: 'admin@city.gov',
        phone: '+91 9876543210',
        role: 'admin',
        preferences: { language: 'en', notifications: true, emailAlerts: true }
      },
      'ward-token': {
        id: 'ward-001',
        name: 'Ward Officer',
        email: 'ward@city.gov',
        phone: '+91 9876543211',
        role: 'ward-officer',
        ward: 'Ward 3',
        preferences: { language: 'en', notifications: true, emailAlerts: true }
      },
      'maintenance-token': {
        id: 'maint-001',
        name: 'Maintenance Team',
        email: 'maintenance@city.gov',
        phone: '+91 9876543212',
        role: 'maintenance',
        department: 'Water & Sanitation',
        preferences: { language: 'en', notifications: true, emailAlerts: false }
      },
      'citizen-token': {
        id: 'citizen-001',
        name: 'John Doe',
        email: 'john.doe@email.com',
        phone: '+91 9876543213',
        role: 'citizen',
        preferences: { language: 'en', notifications: true, emailAlerts: true }
      }
    };

    const user = mockUsers[token];
    if (user) {
      return {
        user,
        exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hours from now
      };
    }
    return null;
  } catch {
    return null;
  }
};

// Async thunks
export const loginWithToken = createAsyncThunk(
  'auth/loginWithToken',
  async (token: string, { rejectWithValue }) => {
    try {
      const decoded = decodeToken(token);
      if (!decoded) {
        throw new Error('Invalid token');
      }
      
      if (decoded.exp < Date.now()) {
        throw new Error('Token expired');
      }

      localStorage.setItem('token', token);
      return { user: decoded.user, token };
    } catch (error) {
      localStorage.removeItem('token');
      return rejectWithValue(error instanceof Error ? error.message : 'Login failed');
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      // Mock login - in real app, make API call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      
      // Mock credentials mapping
      const mockCredentials: Record<string, string> = {
        'admin@city.gov': 'admin-token',
        'ward@city.gov': 'ward-token',
        'maintenance@city.gov': 'maintenance-token',
        'john.doe@email.com': 'citizen-token'
      };

      const token = mockCredentials[email];
      if (!token || password !== 'password') {
        throw new Error('Invalid credentials');
      }

      const decoded = decodeToken(token);
      if (!decoded) {
        throw new Error('Authentication failed');
      }

      localStorage.setItem('token', token);
      return { user: decoded.user, token };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Login failed');
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (updates: Partial<User>, { getState, rejectWithValue }) => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const state = getState() as { auth: AuthState };
      if (!state.auth.user) {
        throw new Error('User not authenticated');
      }

      const updatedUser = { ...state.auth.user, ...updates };
      return updatedUser;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Update failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isGuest = false;
      state.error = null;
      localStorage.removeItem('token');
    },
    setGuest: (state, action: PayloadAction<boolean>) => {
      state.isGuest = action.payload;
      if (action.payload) {
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    updateUserPreferences: (state, action: PayloadAction<Partial<User['preferences']>>) => {
      if (state.user) {
        state.user.preferences = { ...state.user.preferences, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Login with token
      .addCase(loginWithToken.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginWithToken.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.isGuest = false;
        state.error = null;
      })
      .addCase(loginWithToken.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = action.payload as string;
      })
      // Regular login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.isGuest = false;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update profile
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload;
      });
  },
});

export const { logout, setGuest, clearError, updateUserPreferences } = authSlice.actions;
export default authSlice.reducer;
