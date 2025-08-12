import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

// Types
export interface User {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  role:
    | "CITIZEN"
    | "ADMINISTRATOR"
    | "WARD_OFFICER"
    | "MAINTENANCE_TEAM"
    | "GUEST";
  wardId?: string;
  department?: string;
  avatar?: string;
  language?: string;
  isActive: boolean;
  lastLogin?: string;
  joinedOn: string;
  ward?: {
    id: string;
    name: string;
    description?: string;
  };
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  otpStep: "none" | "sent" | "verified";
  requiresPasswordSetup: boolean;
  otpEmail?: string;
  otpExpiresAt?: string;
  registrationStep: "none" | "completed" | "otp_required" | "otp_verified";
  registrationData?: {
    email: string;
    fullName: string;
    role: string;
  };
}

// Initial state
const initialState: AuthState = {
  user: null,
  token: localStorage.getItem("token"),
  isLoading: false,
  isAuthenticated: false,
  error: null,
  otpStep: "none",
  requiresPasswordSetup: false,
  registrationStep: "none",
  registrationData: undefined,
};

// Helper function to make API calls
const apiCall = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  // Check if response has content before trying to parse JSON
  const contentType = response.headers.get("content-type");
  let data = null;

  if (contentType && contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch (error) {
      // If JSON parsing fails, set data to null
      data = null;
    }
  }

  if (!response.ok) {
    throw new Error(data?.message || `HTTP ${response.status}`);
  }

  return data;
};

// Async thunks for password-based login
export const loginWithPassword = createAsyncThunk(
  "auth/loginWithPassword",
  async (
    credentials: { email: string; password: string },
    { rejectWithValue },
  ) => {
    try {
      const data = await apiCall("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      });

      // Store token in localStorage
      localStorage.setItem("token", data.data.token);

      return data.data;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Login failed";

      // Check if password setup is required
      if (errorMessage.includes("Password not set")) {
        return rejectWithValue({
          message: errorMessage,
          requiresPasswordSetup: true,
        });
      }

      return rejectWithValue({ message: errorMessage });
    }
  },
);

// Async thunks for OTP-based login
export const requestOTPLogin = createAsyncThunk(
  "auth/requestOTPLogin",
  async ({ email }: { email: string }, { rejectWithValue }) => {
    try {
      const data = await apiCall("/api/auth/login-otp", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      return data.data;
    } catch (error) {
      return rejectWithValue({
        message: error instanceof Error ? error.message : "Failed to send OTP",
      });
    }
  },
);

export const verifyOTPLogin = createAsyncThunk(
  "auth/verifyOTPLogin",
  async (
    { email, otpCode }: { email: string; otpCode: string },
    { rejectWithValue },
  ) => {
    try {
      const data = await apiCall("/api/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email, otpCode }),
      });

      // Store token in localStorage
      localStorage.setItem("token", data.data.token);

      return data.data;
    } catch (error) {
      return rejectWithValue({
        message:
          error instanceof Error ? error.message : "OTP verification failed",
      });
    }
  },
);

// Password setup flow
export const sendPasswordSetupEmail = createAsyncThunk(
  "auth/sendPasswordSetupEmail",
  async ({ email }: { email: string }, { rejectWithValue }) => {
    try {
      const data = await apiCall("/api/auth/send-password-setup", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      return data.data;
    } catch (error) {
      return rejectWithValue({
        message:
          error instanceof Error
            ? error.message
            : "Failed to send password setup email",
      });
    }
  },
);

export const setPassword = createAsyncThunk(
  "auth/setPassword",
  async (
    { token, password }: { token: string; password: string },
    { rejectWithValue },
  ) => {
    try {
      const data = await apiCall(`/api/auth/set-password/${token}`, {
        method: "POST",
        body: JSON.stringify({ password }),
      });

      // Store token in localStorage
      localStorage.setItem("token", data.data.token);

      return data.data;
    } catch (error) {
      return rejectWithValue({
        message:
          error instanceof Error ? error.message : "Failed to set password",
      });
    }
  },
);

export const changePassword = createAsyncThunk(
  "auth/changePassword",
  async (
    {
      currentPassword,
      newPassword,
    }: { currentPassword: string; newPassword: string },
    { getState, rejectWithValue },
  ) => {
    try {
      const state = getState() as { auth: AuthState };
      const token = state.auth.token;

      await apiCall("/api/auth/change-password", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      return true;
    } catch (error) {
      return rejectWithValue({
        message:
          error instanceof Error ? error.message : "Failed to change password",
      });
    }
  },
);

// Registration
export const registerUser = createAsyncThunk(
  "auth/register",
  async (
    userData: {
      fullName: string;
      email: string;
      phoneNumber?: string;
      password: string;
      role?: string;
      wardId?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const data = await apiCall("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(userData),
      });

      // Check if OTP verification is required
      if (data.data.requiresOtpVerification) {
        return {
          requiresOtpVerification: true,
          email: userData.email,
          fullName: userData.fullName,
          role: userData.role || "CITIZEN",
          message: data.message || "Registration successful. Please verify your email with the OTP sent.",
        };
      }

      // Store token in localStorage if no OTP required
      localStorage.setItem("token", data.data.token);

      return data.data;
    } catch (error) {
      return rejectWithValue({
        message: error instanceof Error ? error.message : "Registration failed",
      });
    }
  },
);

// Registration OTP verification
export const verifyRegistrationOTP = createAsyncThunk(
  "auth/verifyRegistrationOTP",
  async (
    { email, otpCode }: { email: string; otpCode: string },
    { rejectWithValue },
  ) => {
    try {
      const data = await apiCall("/api/auth/verify-registration-otp", {
        method: "POST",
        body: JSON.stringify({ email, otpCode }),
      });

      // Store token in localStorage
      localStorage.setItem("token", data.data.token);

      return data.data;
    } catch (error) {
      return rejectWithValue({
        message:
          error instanceof Error ? error.message : "OTP verification failed",
      });
    }
  },
);

// Resend registration OTP
export const resendRegistrationOTP = createAsyncThunk(
  "auth/resendRegistrationOTP",
  async ({ email }: { email: string }, { rejectWithValue }) => {
    try {
      const data = await apiCall("/api/auth/resend-registration-otp", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      return data.data;
    } catch (error) {
      return rejectWithValue({
        message:
          error instanceof Error ? error.message : "Failed to resend OTP",
      });
    }
  },
);

// Token-based authentication
export const loginWithToken = createAsyncThunk(
  "auth/loginWithToken",
  async (_, { rejectWithValue }) => {
    const token = localStorage.getItem("token");

    if (!token) {
      return rejectWithValue({ message: "No token found" });
    }

    try {
      const data = await apiCall("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return { user: data.data.user, token };
    } catch (error) {
      localStorage.removeItem("token");
      return rejectWithValue({
        message:
          error instanceof Error ? error.message : "Token validation failed",
      });
    }
  },
);

// Profile management
export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async (profileData: Partial<User>, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState };
      const token = state.auth.token;

      const data = await apiCall("/api/auth/profile", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      return data.data.user;
    } catch (error) {
      return rejectWithValue({
        message:
          error instanceof Error ? error.message : "Profile update failed",
      });
    }
  },
);

// User preferences update
export const updateUserPreferences = createAsyncThunk(
  "auth/updateUserPreferences",
  async (
    preferences: {
      language?: string;
      notificationsEnabled?: boolean;
      emailAlerts?: boolean;
    },
    { getState, rejectWithValue },
  ) => {
    try {
      const state = getState() as { auth: AuthState };
      const token = state.auth.token;

      const data = await apiCall("/api/auth/profile", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(preferences),
      });

      return data.data.user;
    } catch (error) {
      return rejectWithValue({
        message:
          error instanceof Error
            ? error.message
            : "Failed to update preferences",
      });
    }
  },
);

// Logout
export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { getState }) => {
    const state = getState() as { auth: AuthState };
    const token = state.auth.token;

    // Always clear local state first
    localStorage.removeItem("token");

    // Try to notify server, but don't fail if it doesn't work
    if (token) {
      try {
        await apiCall("/api/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (error) {
        // Silently handle logout API errors since local state is already cleared
        console.warn(
          "Server logout failed (local logout still successful):",
          error,
        );
      }
    }

    return null;
  },
);

// Auth slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    resetAuth: () => initialState,
    resetOTPState: (state) => {
      state.otpStep = "none";
      state.otpEmail = undefined;
      state.otpExpiresAt = undefined;
      state.requiresPasswordSetup = false;
    },
    setRequiresPasswordSetup: (state, action: PayloadAction<boolean>) => {
      state.requiresPasswordSetup = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Password-based login
      .addCase(loginWithPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.requiresPasswordSetup = false;
      })
      .addCase(loginWithPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
        state.otpStep = "none";
        state.requiresPasswordSetup = false;
      })
      .addCase(loginWithPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = (action.payload as any)?.message || "Login failed";
        state.requiresPasswordSetup =
          (action.payload as any)?.requiresPasswordSetup || false;
      })

      // OTP login request
      .addCase(requestOTPLogin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.otpStep = "none";
      })
      .addCase(requestOTPLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.otpStep = "sent";
        state.otpEmail = action.payload.email;
        state.otpExpiresAt = action.payload.expiresAt;
        state.error = null;
      })
      .addCase(requestOTPLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.otpStep = "none";
        state.error = (action.payload as any)?.message || "Failed to send OTP";
      })

      // OTP verification
      .addCase(verifyOTPLogin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyOTPLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.otpStep = "verified";
        state.error = null;
      })
      .addCase(verifyOTPLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          (action.payload as any)?.message || "OTP verification failed";
      })

      // Password setup email
      .addCase(sendPasswordSetupEmail.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendPasswordSetupEmail.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(sendPasswordSetupEmail.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          (action.payload as any)?.message ||
          "Failed to send password setup email";
      })

      // Set password
      .addCase(setPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(setPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.requiresPasswordSetup = false;
        state.error = null;
      })
      .addCase(setPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          (action.payload as any)?.message || "Failed to set password";
      })

      // Change password
      .addCase(changePassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          (action.payload as any)?.message || "Failed to change password";
      })

      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = (action.payload as any)?.message || "Registration failed";
      })

      // Login with token
      .addCase(loginWithToken.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginWithToken.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(loginWithToken.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error =
          (action.payload as any)?.message || "Token validation failed";
      })

      // Update profile
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          (action.payload as any)?.message || "Profile update failed";
      })

      // Update user preferences
      .addCase(updateUserPreferences.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserPreferences.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(updateUserPreferences.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          (action.payload as any)?.message || "Failed to update preferences";
      })

      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.isLoading = false;
        state.error = null;
        state.otpStep = "none";
        state.requiresPasswordSetup = false;
      });
  },
});

export const {
  clearError,
  setError,
  resetAuth,
  resetOTPState,
  setRequiresPasswordSetup,
} = authSlice.actions;

// Export common actions with backward compatibility
export const login = loginWithPassword;
export const register = registerUser;

export default authSlice.reducer;

// Selectors
export const selectAuth = (state: { auth: AuthState }) => state.auth;
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) =>
  state.auth.isAuthenticated;
export const selectAuthLoading = (state: { auth: AuthState }) =>
  state.auth.isLoading;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;
export const selectOTPStep = (state: { auth: AuthState }) => state.auth.otpStep;
export const selectRequiresPasswordSetup = (state: { auth: AuthState }) =>
  state.auth.requiresPasswordSetup;
export const selectOTPEmail = (state: { auth: AuthState }) =>
  state.auth.otpEmail;
