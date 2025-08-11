import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

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
  attachments?: File[];
}

export interface OTPVerificationData {
  guestId: string;
  otpCode: string;
}

export interface GuestComplaintResponse {
  complaintId: string;
  guestId: string;
  trackingToken: string;
}

export interface GuestState {
  guestId: string | null;
  trackingToken: string | null;
  isSubmitting: boolean;
  isVerifying: boolean;
  otpSent: boolean;
  otpExpiry: Date | null;
  complaintData: GuestComplaintData | null;
  submissionStep: 'form' | 'otp' | 'success';
  error: string | null;
}

// Initial state
const initialState: GuestState = {
  guestId: null,
  trackingToken: null,
  isSubmitting: false,
  isVerifying: false,
  otpSent: false,
  otpExpiry: null,
  complaintData: null,
  submissionStep: 'form',
  error: null,
};

// Async thunks
export const submitGuestComplaint = createAsyncThunk(
  'guest/submitComplaint',
  async (complaintData: GuestComplaintData, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      
      // Append complaint data
      Object.entries(complaintData).forEach(([key, value]) => {
        if (key !== 'attachments' && value) {
          formData.append(key, value);
        }
      });

      // Append files
      if (complaintData.attachments) {
        complaintData.attachments.forEach((file, index) => {
          formData.append(`attachment_${index}`, file);
        });
      }

      const response = await fetch('/api/guest/complaint', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit complaint');
      }

      const result = await response.json();
      return result as GuestComplaintResponse;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Network error');
    }
  }
);

export const verifyOTP = createAsyncThunk(
  'guest/verifyOTP',
  async (verificationData: OTPVerificationData, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/guest/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(verificationData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'OTP verification failed');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Network error');
    }
  }
);

export const resendOTP = createAsyncThunk(
  'guest/resendOTP',
  async ({ guestId }: { guestId: string }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/guest/resend-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ guestId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to resend OTP');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Network error');
    }
  }
);

export const trackGuestComplaint = createAsyncThunk(
  'guest/trackComplaint',
  async ({ complaintId, trackingToken }: { complaintId: string; trackingToken?: string }, { rejectWithValue }) => {
    try {
      const url = trackingToken 
        ? `/api/guest/track?complaintId=${complaintId}&token=${trackingToken}`
        : `/api/guest/track?complaintId=${complaintId}`;
        
      const response = await fetch(url);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to track complaint');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Network error');
    }
  }
);

// Slice
const guestSlice = createSlice({
  name: 'guest',
  initialState,
  reducers: {
    clearGuestData: (state) => {
      state.guestId = null;
      state.trackingToken = null;
      state.complaintData = null;
      state.submissionStep = 'form';
      state.otpSent = false;
      state.otpExpiry = null;
      state.error = null;
    },
    setSubmissionStep: (state, action: PayloadAction<'form' | 'otp' | 'success'>) => {
      state.submissionStep = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateComplaintData: (state, action: PayloadAction<Partial<GuestComplaintData>>) => {
      if (state.complaintData) {
        state.complaintData = { ...state.complaintData, ...action.payload };
      } else {
        state.complaintData = action.payload as GuestComplaintData;
      }
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
        state.guestId = action.payload.guestId;
        state.trackingToken = action.payload.trackingToken;
        state.otpSent = true;
        state.otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
        state.submissionStep = 'otp';
        
        // Store in localStorage for persistence
        localStorage.setItem('guestId', action.payload.guestId);
        localStorage.setItem('trackingToken', action.payload.trackingToken);
      })
      .addCase(submitGuestComplaint.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload as string;
      })
      
      // Verify OTP
      .addCase(verifyOTP.pending, (state) => {
        state.isVerifying = true;
        state.error = null;
      })
      .addCase(verifyOTP.fulfilled, (state, action) => {
        state.isVerifying = false;
        state.submissionStep = 'success';
        
        // Store verification status
        localStorage.setItem('otpVerified', 'true');
      })
      .addCase(verifyOTP.rejected, (state, action) => {
        state.isVerifying = false;
        state.error = action.payload as string;
      })
      
      // Resend OTP
      .addCase(resendOTP.pending, (state) => {
        state.error = null;
      })
      .addCase(resendOTP.fulfilled, (state) => {
        state.otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // Reset expiry
      })
      .addCase(resendOTP.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // Track Guest Complaint
      .addCase(trackGuestComplaint.pending, (state) => {
        state.error = null;
      })
      .addCase(trackGuestComplaint.fulfilled, (state, action) => {
        // Handle tracking result - could store complaint details
      })
      .addCase(trackGuestComplaint.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const {
  clearGuestData,
  setSubmissionStep,
  clearError,
  updateComplaintData,
} = guestSlice.actions;

export default guestSlice.reducer;

// Selectors
export const selectGuestState = (state: { guest: GuestState }) => state.guest;
export const selectIsSubmitting = (state: { guest: GuestState }) => state.guest.isSubmitting;
export const selectIsVerifying = (state: { guest: GuestState }) => state.guest.isVerifying;
export const selectOTPSent = (state: { guest: GuestState }) => state.guest.otpSent;
export const selectSubmissionStep = (state: { guest: GuestState }) => state.guest.submissionStep;
export const selectGuestError = (state: { guest: GuestState }) => state.guest.error;
