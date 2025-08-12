import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

// Types
export interface GuestComplaintData {
  fullName: string;
  email: string;
  phoneNumber: string;
  type: string;
  description: string;
  area: string;
  landmark?: string;
  address?: string;
  wardId: string;
  subZoneId?: string;
  priority?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  attachments?: File[];
}

export interface GuestComplaintResponse {
  complaintId: string;
  email: string;
  expiresAt: string;
  sessionId: string;
}

export interface OTPVerificationResponse {
  user: any;
  token: string;
  complaint: any;
  isNewUser: boolean;
}

export interface GuestState {
  complaintId: string | null;
  sessionId: string | null;
  isSubmitting: boolean;
  isVerifying: boolean;
  otpSent: boolean;
  otpExpiry: Date | null;
  complaintData: GuestComplaintData | null;
  submissionStep: "form" | "otp" | "success";
  currentFormStep: number;
  formValidation: Record<string, string>;
  error: string | null;
  userEmail: string | null;
  newUserRegistered: boolean;
  trackingData: any | null;
}

// Initial state
const initialState: GuestState = {
  complaintId: null,
  sessionId: null,
  isSubmitting: false,
  isVerifying: false,
  otpSent: false,
  otpExpiry: null,
  complaintData: null,
  submissionStep: "form",
  error: null,
  userEmail: null,
  newUserRegistered: false,
  trackingData: null,
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

  // Check if response is JSON
  const contentType = response.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");

  let data = null;
  if (isJson) {
    try {
      data = await response.json();
    } catch (error) {
      throw new Error("Failed to parse server response");
    }
  } else {
    // Non-JSON response (likely HTML error page)
    const text = await response.text();
    if (text.includes("<!doctype") || text.includes("<html")) {
      throw new Error("Server error occurred. Please try again later.");
    } else {
      throw new Error("Server returned unexpected response format");
    }
  }

  if (!response.ok) {
    throw new Error(data?.message || `HTTP ${response.status}`);
  }

  return data;
};

// Async thunks
export const submitGuestComplaint = createAsyncThunk(
  "guest/submitComplaint",
  async (complaintData: GuestComplaintData, { rejectWithValue }) => {
    try {
      // For now, we'll send as JSON. File uploads can be added later
      const payload = {
        fullName: complaintData.fullName,
        email: complaintData.email,
        phoneNumber: complaintData.phoneNumber,
        type: complaintData.type,
        description: complaintData.description,
        priority: complaintData.priority || "MEDIUM",
        wardId: complaintData.wardId,
        area: complaintData.area,
        landmark: complaintData.landmark,
        address: complaintData.address,
        coordinates: complaintData.coordinates,
      };

      const data = await apiCall("/api/guest/complaint", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      return data.data as GuestComplaintResponse;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to submit complaint",
      );
    }
  },
);

export const verifyOTPAndRegister = createAsyncThunk(
  "guest/verifyOTPAndRegister",
  async (
    {
      email,
      otpCode,
      complaintId,
    }: { email: string; otpCode: string; complaintId: string },
    { rejectWithValue },
  ) => {
    try {
      const data = await apiCall("/api/guest/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email, otpCode, complaintId }),
      });

      // Store token in localStorage for auto-login
      if (data.data.token) {
        localStorage.setItem("token", data.data.token);
      }

      return data.data as OTPVerificationResponse;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "OTP verification failed",
      );
    }
  },
);

export const resendOTP = createAsyncThunk(
  "guest/resendOTP",
  async (
    { email, complaintId }: { email: string; complaintId: string },
    { rejectWithValue },
  ) => {
    try {
      const data = await apiCall("/api/guest/resend-otp", {
        method: "POST",
        body: JSON.stringify({ email, complaintId }),
      });

      return data.data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to resend OTP",
      );
    }
  },
);

export const trackGuestComplaint = createAsyncThunk(
  "guest/trackComplaint",
  async (
    {
      complaintId,
      email,
      phoneNumber,
    }: {
      complaintId: string;
      email?: string;
      phoneNumber?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const params = new URLSearchParams();
      if (email) params.append("email", email);
      if (phoneNumber) params.append("phoneNumber", phoneNumber);

      const data = await apiCall(
        `/api/guest/track/${complaintId}?${params.toString()}`,
      );
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to track complaint",
      );
    }
  },
);

export const getPublicStats = createAsyncThunk(
  "guest/getPublicStats",
  async (_, { rejectWithValue }) => {
    try {
      const data = await apiCall("/api/guest/stats");
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to load statistics",
      );
    }
  },
);

// Slice
const guestSlice = createSlice({
  name: "guest",
  initialState,
  reducers: {
    clearGuestData: (state) => {
      state.complaintId = null;
      state.sessionId = null;
      state.complaintData = null;
      state.submissionStep = "form";
      state.otpSent = false;
      state.otpExpiry = null;
      state.error = null;
      state.userEmail = null;
      state.newUserRegistered = false;
      state.trackingData = null;
    },
    setSubmissionStep: (
      state,
      action: PayloadAction<"form" | "otp" | "success">,
    ) => {
      state.submissionStep = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateComplaintData: (
      state,
      action: PayloadAction<Partial<GuestComplaintData>>,
    ) => {
      if (state.complaintData) {
        state.complaintData = { ...state.complaintData, ...action.payload };
      } else {
        state.complaintData = action.payload as GuestComplaintData;
      }
    },
    resetOTPState: (state) => {
      state.otpSent = false;
      state.otpExpiry = null;
      state.submissionStep = "form";
    },
  },
  extraReducers: (builder) => {
    builder
      // Submit Guest Complaint
      .addCase(submitGuestComplaint.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(submitGuestComplaint.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.complaintId = action.payload.complaintId;
        state.sessionId = action.payload.sessionId;
        state.userEmail = action.payload.email;
        state.otpSent = true;
        state.otpExpiry = new Date(action.payload.expiresAt);
        state.submissionStep = "otp";
        state.error = null;
      })
      .addCase(submitGuestComplaint.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload as string;
      })

      // Verify OTP and Auto-Register
      .addCase(verifyOTPAndRegister.pending, (state) => {
        state.isVerifying = true;
        state.error = null;
      })
      .addCase(verifyOTPAndRegister.fulfilled, (state, action) => {
        state.isVerifying = false;
        state.submissionStep = "success";
        state.newUserRegistered = action.payload.isNewUser;
        state.error = null;

        // Clear guest data as user is now registered and logged in
        // The auth slice will handle the user state
      })
      .addCase(verifyOTPAndRegister.rejected, (state, action) => {
        state.isVerifying = false;
        state.error = action.payload as string;
      })

      // Resend OTP
      .addCase(resendOTP.pending, (state) => {
        state.error = null;
      })
      .addCase(resendOTP.fulfilled, (state, action) => {
        state.otpExpiry = new Date(action.payload.expiresAt);
        state.sessionId = action.payload.sessionId;
        state.error = null;
      })
      .addCase(resendOTP.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      // Track Guest Complaint
      .addCase(trackGuestComplaint.pending, (state) => {
        state.error = null;
      })
      .addCase(trackGuestComplaint.fulfilled, (state, action) => {
        state.trackingData = action.payload;
        state.error = null;
      })
      .addCase(trackGuestComplaint.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      // Get Public Stats
      .addCase(getPublicStats.pending, (state) => {
        state.error = null;
      })
      .addCase(getPublicStats.fulfilled, (state, action) => {
        // Stats can be stored in a separate slice or component state
        state.error = null;
      })
      .addCase(getPublicStats.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const {
  clearGuestData,
  setSubmissionStep,
  clearError,
  updateComplaintData,
  resetOTPState,
} = guestSlice.actions;

export default guestSlice.reducer;

// Selectors
export const selectGuestState = (state: { guest: GuestState }) => state.guest;
export const selectIsSubmitting = (state: { guest: GuestState }) =>
  state.guest.isSubmitting;
export const selectIsVerifying = (state: { guest: GuestState }) =>
  state.guest.isVerifying;
export const selectOTPSent = (state: { guest: GuestState }) =>
  state.guest.otpSent;
export const selectSubmissionStep = (state: { guest: GuestState }) =>
  state.guest.submissionStep;
export const selectGuestError = (state: { guest: GuestState }) =>
  state.guest.error;
export const selectComplaintId = (state: { guest: GuestState }) =>
  state.guest.complaintId;
export const selectUserEmail = (state: { guest: GuestState }) =>
  state.guest.userEmail;
export const selectNewUserRegistered = (state: { guest: GuestState }) =>
  state.guest.newUserRegistered;
export const selectTrackingData = (state: { guest: GuestState }) =>
  state.guest.trackingData;
