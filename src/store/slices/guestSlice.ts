import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

// Types
export interface GuestComplaintData {
  type: string;
  description: string;
  contactMobile: string;
  contactEmail: string;
  ward: string;
  area: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  landmark?: string;
  files?: File[];
}

export interface OtpVerification {
  email: string;
  otp: string;
  sessionId: string;
}

export interface GuestState {
  // OTP verification
  isOtpSent: boolean;
  isOtpVerifying: boolean;
  isOtpVerified: boolean;
  otpSessionId: string | null;
  otpExpiresAt: string | null;

  // Complaint submission
  pendingComplaint: GuestComplaintData | null;
  isSubmittingComplaint: boolean;
  submittedComplaintId: string | null;

  // General state
  isLoading: boolean;
  error: string | null;

  // Tracking
  guestComplaintIds: string[];
}

// Initial state
const initialState: GuestState = {
  isOtpSent: false,
  isOtpVerifying: false,
  isOtpVerified: false,
  otpSessionId: null,
  otpExpiresAt: null,
  pendingComplaint: null,
  isSubmittingComplaint: false,
  submittedComplaintId: null,
  isLoading: false,
  error: null,
  guestComplaintIds: JSON.parse(
    localStorage.getItem("guestComplaintIds") || "[]",
  ),
};

// Async thunks
export const sendOtpForGuest = createAsyncThunk(
  "guest/sendOtp",
  async (
    params: { email: string; complaintData: GuestComplaintData },
    { rejectWithValue },
  ) => {
    try {
      const response = await fetch("/api/guest/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: params.email,
          purpose: "complaint_submission",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || "Failed to send OTP");
      }

      return {
        sessionId: data.data.sessionId,
        expiresAt: data.data.expiresAt,
        complaintData: params.complaintData,
      };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Network error",
      );
    }
  },
);

export const verifyOtpAndSubmitComplaint = createAsyncThunk(
  "guest/verifyOtpAndSubmit",
  async (
    params: { otp: string; sessionId: string },
    { getState, rejectWithValue },
  ) => {
    try {
      const state = getState() as { guest: GuestState };
      const complaintData = state.guest.pendingComplaint;

      if (!complaintData) {
        return rejectWithValue("No pending complaint data found");
      }

      // First verify OTP
      const otpResponse = await fetch("/api/guest/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: params.sessionId,
          otp: params.otp,
        }),
      });

      const otpData = await otpResponse.json();

      if (!otpResponse.ok) {
        return rejectWithValue(otpData.message || "Invalid OTP");
      }

      // If OTP is valid, submit the complaint
      const formData = new FormData();

      // Append complaint data
      formData.append("type", complaintData.type);
      formData.append("description", complaintData.description);
      formData.append("contactMobile", complaintData.contactMobile);
      formData.append("contactEmail", complaintData.contactEmail);
      formData.append("ward", complaintData.ward);
      formData.append("area", complaintData.area);

      if (complaintData.address)
        formData.append("address", complaintData.address);
      if (complaintData.latitude)
        formData.append("latitude", complaintData.latitude.toString());
      if (complaintData.longitude)
        formData.append("longitude", complaintData.longitude.toString());
      if (complaintData.landmark)
        formData.append("landmark", complaintData.landmark);

      // Append files if any
      if (complaintData.files) {
        complaintData.files.forEach((file, index) => {
          formData.append(`files`, file);
        });
      }

      // Mark as guest submission
      formData.append("isGuest", "true");
      formData.append("guestVerificationToken", otpData.data.verificationToken);

      const complaintResponse = await fetch("/api/guest/submit-complaint", {
        method: "POST",
        body: formData,
      });

      const complaintResponseData = await complaintResponse.json();

      if (!complaintResponse.ok) {
        return rejectWithValue(
          complaintResponseData.message || "Failed to submit complaint",
        );
      }

      return complaintResponseData.data.complaint;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Network error",
      );
    }
  },
);

export const trackGuestComplaint = createAsyncThunk(
  "guest/trackComplaint",
  async (
    params: { complaintId: string; email: string; mobile: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await fetch("/api/guest/track-complaint", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          complaintId: params.complaintId,
          email: params.email,
          mobile: params.mobile,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || "Failed to track complaint");
      }

      return data.data.complaint;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Network error",
      );
    }
  },
);

export const resendOtp = createAsyncThunk(
  "guest/resendOtp",
  async (sessionId: string, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/guest/resend-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId }),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || "Failed to resend OTP");
      }

      return {
        sessionId: data.data.sessionId,
        expiresAt: data.data.expiresAt,
      };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Network error",
      );
    }
  },
);

// Guest slice
const guestSlice = createSlice({
  name: "guest",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetOtpState: (state) => {
      state.isOtpSent = false;
      state.isOtpVerifying = false;
      state.isOtpVerified = false;
      state.otpSessionId = null;
      state.otpExpiresAt = null;
      state.pendingComplaint = null;
      state.error = null;
    },
    resetGuestState: () => initialState,
    addGuestComplaintId: (state, action: PayloadAction<string>) => {
      if (!state.guestComplaintIds.includes(action.payload)) {
        state.guestComplaintIds.push(action.payload);
        localStorage.setItem(
          "guestComplaintIds",
          JSON.stringify(state.guestComplaintIds),
        );
      }
    },
    removeGuestComplaintId: (state, action: PayloadAction<string>) => {
      state.guestComplaintIds = state.guestComplaintIds.filter(
        (id) => id !== action.payload,
      );
      localStorage.setItem(
        "guestComplaintIds",
        JSON.stringify(state.guestComplaintIds),
      );
    },
    clearAllGuestComplaintIds: (state) => {
      state.guestComplaintIds = [];
      localStorage.removeItem("guestComplaintIds");
    },
  },
  extraReducers: (builder) => {
    builder
      // Send OTP
      .addCase(sendOtpForGuest.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendOtpForGuest.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isOtpSent = true;
        state.otpSessionId = action.payload.sessionId;
        state.otpExpiresAt = action.payload.expiresAt;
        state.pendingComplaint = action.payload.complaintData;
        state.error = null;
      })
      .addCase(sendOtpForGuest.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Verify OTP and submit complaint
      .addCase(verifyOtpAndSubmitComplaint.pending, (state) => {
        state.isOtpVerifying = true;
        state.isSubmittingComplaint = true;
        state.error = null;
      })
      .addCase(verifyOtpAndSubmitComplaint.fulfilled, (state, action) => {
        state.isOtpVerifying = false;
        state.isSubmittingComplaint = false;
        state.isOtpVerified = true;
        state.submittedComplaintId = action.payload.complaintId;
        state.pendingComplaint = null;

        // Add to guest complaint IDs for tracking
        if (!state.guestComplaintIds.includes(action.payload.complaintId)) {
          state.guestComplaintIds.push(action.payload.complaintId);
          localStorage.setItem(
            "guestComplaintIds",
            JSON.stringify(state.guestComplaintIds),
          );
        }

        state.error = null;
      })
      .addCase(verifyOtpAndSubmitComplaint.rejected, (state, action) => {
        state.isOtpVerifying = false;
        state.isSubmittingComplaint = false;
        state.error = action.payload as string;
      })
      // Resend OTP
      .addCase(resendOtp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resendOtp.fulfilled, (state, action) => {
        state.isLoading = false;
        state.otpSessionId = action.payload.sessionId;
        state.otpExpiresAt = action.payload.expiresAt;
        state.error = null;
      })
      .addCase(resendOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Track complaint
      .addCase(trackGuestComplaint.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(trackGuestComplaint.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(trackGuestComplaint.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  resetOtpState,
  resetGuestState,
  addGuestComplaintId,
  removeGuestComplaintId,
  clearAllGuestComplaintIds,
} = guestSlice.actions;

export default guestSlice.reducer;

// Selectors
export const selectGuest = (state: { guest: GuestState }) => state.guest;
export const selectIsOtpSent = (state: { guest: GuestState }) =>
  state.guest.isOtpSent;
export const selectIsOtpVerifying = (state: { guest: GuestState }) =>
  state.guest.isOtpVerifying;
export const selectIsOtpVerified = (state: { guest: GuestState }) =>
  state.guest.isOtpVerified;
export const selectOtpSessionId = (state: { guest: GuestState }) =>
  state.guest.otpSessionId;
export const selectOtpExpiresAt = (state: { guest: GuestState }) =>
  state.guest.otpExpiresAt;
export const selectPendingComplaint = (state: { guest: GuestState }) =>
  state.guest.pendingComplaint;
export const selectIsSubmittingComplaint = (state: { guest: GuestState }) =>
  state.guest.isSubmittingComplaint;
export const selectSubmittedComplaintId = (state: { guest: GuestState }) =>
  state.guest.submittedComplaintId;
export const selectGuestLoading = (state: { guest: GuestState }) =>
  state.guest.isLoading;
export const selectGuestError = (state: { guest: GuestState }) =>
  state.guest.error;
export const selectGuestComplaintIds = (state: { guest: GuestState }) =>
  state.guest.guestComplaintIds;
