import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

// Types
export interface AttachmentFile {
  id: string;
  name: string;
  size: number;
  type: string;
  preview?: string;
  uploading?: boolean;
  uploaded?: boolean;
  error?: string;
}

// Interface for holding actual files temporarily (not stored in Redux)
export interface FileAttachment {
  id: string;
  file: File;
}

export interface GuestComplaintData {
  // Step 1: Details
  fullName: string;
  email: string;
  phoneNumber: string;
  type: string;
  description: string;
  priority?: string;

  // Step 2: Location
  wardId: string;
  subZoneId?: string;
  area: string;
  landmark?: string;
  address?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };

  // Step 3: Attachments
  attachments?: AttachmentFile[];

  // step 4 : Captcha
  captchaId?: string;
  captchaText?: string;
}

export interface GuestServiceRequestData {
  fullName: string;
  email: string;
  phoneNumber: string;
  serviceType: string;
  priority: string;
  description: string;
  preferredDate: string;
  preferredTime: string;
  wardId: string;
  area: string;
  address: string;
  landmark?: string;
}

export interface FormStep {
  id: number;
  title: string;
  isCompleted: boolean;
  isValid: boolean;
}

export interface GuestComplaintResponse {
  complaintId: string;
  trackingNumber: string;
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

export interface ValidationErrors {
  [key: string]: string;
}

export interface GuestState {
  // Form state
  currentStep: number;
  steps: FormStep[];
  formData: GuestComplaintData;
  validationErrors: ValidationErrors;
  isDraftSaved: boolean;

  // Service Request state
  serviceRequestData: GuestServiceRequestData;
  serviceRequestId: string | null;
  serviceRequestStep: "form" | "otp" | "success";
  isSubmittingService: boolean;

  // Submission state
  complaintId: string | null;
  trackingNumber: string | null;
  sessionId: string | null;
  isSubmitting: boolean;
  isVerifying: boolean;
  otpSent: boolean;
  otpExpiry: string | null;
  submissionStep: "form" | "otp" | "success";
  currentFormStep: number;
  formValidation: Record<string, string>;
  error: string | null;
  userEmail: string | null;
  newUserRegistered: boolean;
  trackingData: any | null;

  // UI state
  showImagePreview: boolean;
  previewImageUrl: string | null;
}

// Initial form data
const initialFormData: GuestComplaintData = {
  fullName: "",
  email: "",
  phoneNumber: "",
  type: "",
  description: "",
  priority: "MEDIUM",
  wardId: "",
  subZoneId: "",
  area: "",
  landmark: "",
  address: "",
  attachments: [],
};

// Helper function to make API calls
const apiCall = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || "Request failed");
  }
  return data;
};

// Initial service request data
const initialServiceRequestData: GuestServiceRequestData = {
  fullName: "",
  email: "",
  phoneNumber: "",
  serviceType: "",
  priority: "NORMAL",
  description: "",
  preferredDate: "",
  preferredTime: "",
  wardId: "",
  area: "",
  address: "",
  landmark: "",
};

// Initial steps
const initialSteps: FormStep[] = [
  { id: 1, title: "Details", isCompleted: false, isValid: false },
  { id: 2, title: "Location", isCompleted: false, isValid: false },
  { id: 3, title: "Attachments", isCompleted: false, isValid: true }, // Optional
  { id: 4, title: "Review", isCompleted: false, isValid: true },
  { id: 5, title: "Submit", isCompleted: false, isValid: true },
];

// Initial state
const initialState: GuestState = {
  currentStep: 1,
  steps: initialSteps,
  formData: initialFormData,
  validationErrors: {},
  isDraftSaved: false,

  serviceRequestData: initialServiceRequestData,
  serviceRequestId: null,
  serviceRequestStep: "form",
  isSubmittingService: false,

  complaintId: null,
  trackingNumber: null,
  sessionId: null,
  isSubmitting: false,
  isVerifying: false,
  otpSent: false,
  otpExpiry: null,
  submissionStep: "form",
  currentFormStep: 1,
  formValidation: {},
  error: null,
  userEmail: null,
  newUserRegistered: false,
  trackingData: null,

  showImagePreview: false,
  previewImageUrl: null,
};

// Load draft from sessionStorage
const loadDraftFromStorage = (): Partial<GuestComplaintData> => {
  try {
    const saved = sessionStorage.getItem("guestComplaintDraft");
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

// Save draft to sessionStorage
const saveDraftToStorage = (formData: GuestComplaintData) => {
  try {
    // Attachments are already serializable now
    const dataTosave = {
      ...formData,
    };
    sessionStorage.setItem("guestComplaintDraft", JSON.stringify(dataTosave));
  } catch (error) {
    console.warn("Failed to save draft to sessionStorage:", error);
  }
};

// SessionStorage helpers
const FORM_DATA_KEY = "guestComplaintFormData";

const saveFormDataToSession = (
  data: Partial<GuestComplaintData> & { currentStep?: number },
) => {
  try {
    sessionStorage.setItem(FORM_DATA_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn("Failed to save form data to session storage:", error);
  }
};

const loadFormDataFromSession = ():
  | (Partial<GuestComplaintData> & { currentStep?: number })
  | null => {
  try {
    const saved = sessionStorage.getItem(FORM_DATA_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.warn("Failed to load form data from session storage:", error);
    return null;
  }
};

const clearFormDataFromSession = () => {
  try {
    sessionStorage.removeItem(FORM_DATA_KEY);
  } catch (error) {
    console.warn("Failed to clear form data from session storage:", error);
  }
};

// Note: OTP verification is now handled by RTK Query hooks in guestApi.ts
// No need for custom API call helper for OTP operations

// Async thunks
export const submitGuestComplaint = createAsyncThunk(
  "guest/submitComplaint",
  async (
    {
      complaintData,
      files,
    }: { complaintData: GuestComplaintData; files: FileAttachment[] },
    { rejectWithValue },
  ) => {
    try {
      // Create FormData for file uploads
      const formData = new FormData();

      // Add text data
      formData.append("fullName", complaintData.fullName);
      formData.append("email", complaintData.email);
      formData.append("phoneNumber", complaintData.phoneNumber);
      formData.append("type", complaintData.type);
      formData.append("description", complaintData.description);
      formData.append("priority", complaintData.priority || "MEDIUM");
      formData.append("wardId", complaintData.wardId);
      if (complaintData.subZoneId)
        formData.append("subZoneId", complaintData.subZoneId);
      formData.append("area", complaintData.area);
      if (complaintData.landmark)
        formData.append("landmark", complaintData.landmark);
      if (complaintData.address)
        formData.append("address", complaintData.address);
      if (complaintData.captchaId)
        formData.append("captchaId", complaintData.captchaId);
      if (complaintData.captchaText)
        formData.append("captchaText", complaintData.captchaText);

      // Add coordinates
      if (complaintData.coordinates) {
        formData.append(
          "coordinates",
          JSON.stringify(complaintData.coordinates),
        );
      }

      // Add attachments
      if (files && files.length > 0) {
        files.forEach((fileAttachment) => {
          formData.append(`attachments`, fileAttachment.file);
        });
      }

      const response = await fetch("/api/guest/complaint", {
        method: "POST",
        body: formData,
      });

      // Always read body once via text(), then JSON.parse
      const raw = await response.text();
      let data: any = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch (e) {
        data = null;
      }

      if (!response.ok) {
        const message = data?.message || `HTTP ${response.status}`;
        throw new Error(message);
      }

      if (!data || typeof data !== "object") {
        throw new Error("Server returned unexpected response format");
      }

      return data.data as GuestComplaintResponse;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to submit complaint",
      );
    }
  },
);

// OTP verification is now handled by RTK Query hooks in guestApi.ts
// Use useVerifyGuestOtpMutation() hook instead

// OTP resend is now handled by RTK Query hooks in guestApi.ts
// Use useResendGuestOtpMutation() hook instead

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

export const submitGuestServiceRequest = createAsyncThunk(
  "guest/submitServiceRequest",
  async (
    { serviceData }: { serviceData: GuestServiceRequestData },
    { rejectWithValue },
  ) => {
    try {
      const data = await apiCall("/api/guest/service-request", {
        method: "POST",
        body: JSON.stringify(serviceData),
      });

      return data.data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Failed to submit service request",
      );
    }
  },
);

// Validation helpers
const validateStep1 = (formData: GuestComplaintData): ValidationErrors => {
  const errors: ValidationErrors = {};

  if (!formData.fullName.trim()) errors.fullName = "Full name is required";
  if (!formData.email.trim()) errors.email = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = "Please enter a valid email address";
  }
  if (!formData.phoneNumber.trim())
    errors.phoneNumber = "Phone number is required";
  else if (
    !/^[\d\s\-\+\(\)]{10,}$/.test(formData.phoneNumber.replace(/\s/g, ""))
  ) {
    errors.phoneNumber = "Please enter a valid phone number";
  }
  if (!formData.type) errors.type = "Complaint type is required";
  if (!formData.description.trim())
    errors.description = "Description is required";
  else if (formData.description.trim().length < 10) {
    errors.description = "Description must be at least 10 characters";
  }

  return errors;
};

const validateStep2 = (formData: GuestComplaintData): ValidationErrors => {
  const errors: ValidationErrors = {};

  if (!formData.wardId) errors.wardId = "Ward selection is required";
  if (!formData.area.trim()) errors.area = "Area/locality is required";
  if (!formData.landmark || !formData.landmark.trim())
    errors.landmark = "Landmark is required";
  if (!formData.address || !formData.address.trim())
    errors.address = "Full address is required";
  if (
    !formData.coordinates ||
    formData.coordinates.latitude == null ||
    formData.coordinates.longitude == null
  ) {
    errors.coordinates = "Location (GPS coordinates) is required";
  }

  return errors;
};

const validateStep3 = (formData: GuestComplaintData): ValidationErrors => {
  const errors: ValidationErrors = {};

  // Attachments are optional, but validate if present
  if (formData.attachments && formData.attachments.length > 0) {
    formData.attachments.forEach((attachment, index) => {
      if (attachment.size > 10 * 1024 * 1024) {
        // 10MB
        errors[`attachment_${index}`] = "File size must be less than 10MB";
      }
      if (!["image/jpeg", "image/png", "image/jpg"].includes(attachment.type)) {
        errors[`attachment_${index}`] = "Only JPG and PNG images are allowed";
      }
    });
  }

  return errors;
};

// Slice
const guestSlice = createSlice({
  name: "guest",
  initialState: {
    ...initialState,
    formData: { ...initialFormData, ...loadDraftFromStorage() },
  },
  reducers: {
    setCurrentStep: (state, action: PayloadAction<number>) => {
      if (action.payload >= 1 && action.payload <= 5) {
        state.currentStep = action.payload;
      }
    },

    nextStep: (state) => {
      if (state.currentStep < 5) {
        state.currentStep += 1;
      }
    },

    prevStep: (state) => {
      if (state.currentStep > 1) {
        state.currentStep -= 1;
      }
    },

    updateFormData: (
      state,
      action: PayloadAction<Partial<GuestComplaintData>>,
    ) => {
      state.formData = { ...state.formData, ...action.payload };

      // Validate current step
      let errors: ValidationErrors = {};
      if (state.currentStep === 1) {
        errors = validateStep1(state.formData);
      } else if (state.currentStep === 2) {
        errors = validateStep2(state.formData);
      } else if (state.currentStep === 3) {
        errors = validateStep3(state.formData);
      }

      state.validationErrors = errors;

      // Update step completion status
        const isStepValid = Object.keys(errors).length === 0;
        const step = state.steps[state.currentStep - 1];
        if (step) {
          step.isValid = isStepValid;
          step.isCompleted = isStepValid;
        }

      // Save draft to sessionStorage
      saveDraftToStorage(state.formData);
      state.isDraftSaved = true;
    },

    addAttachment: (state, action: PayloadAction<AttachmentFile>) => {
      if (!state.formData.attachments) {
        state.formData.attachments = [];
      }
      if (state.formData.attachments.length < 5) {
        // Max 5 attachments
        state.formData.attachments.push(action.payload);
        saveDraftToStorage(state.formData);
      }
    },

    removeAttachment: (state, action: PayloadAction<string>) => {
      if (state.formData.attachments) {
        state.formData.attachments = state.formData.attachments.filter(
          (att) => att.id !== action.payload,
        );
        saveDraftToStorage(state.formData);
      }
    },

    updateAttachment: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<AttachmentFile> }>,
    ) => {
      if (state.formData.attachments) {
        const index = state.formData.attachments.findIndex(
          (att) => att.id === action.payload.id,
        );
          if (index !== -1) {
            const existing = state.formData.attachments[index];
            if (existing) {
              state.formData.attachments[index] = {
                ...existing,
                ...action.payload.updates,
              };
            }
          }
      }
    },

    validateCurrentStep: (state) => {
      let errors: ValidationErrors = {};

      switch (state.currentStep) {
        case 1:
          errors = validateStep1(state.formData);
          break;
        case 2:
          errors = validateStep2(state.formData);
          break;
        case 3:
          errors = validateStep3(state.formData);
          break;
        case 4:
          // Review step - validate all previous steps
          const step1Errors = validateStep1(state.formData);
          const step2Errors = validateStep2(state.formData);
          const step3Errors = validateStep3(state.formData);

          errors = {
            ...step1Errors,
            ...step2Errors,
            ...step3Errors,
          };

          // Update previous steps' validity
            const step0 = state.steps[0];
            const step1 = state.steps[1];
            const step2 = state.steps[2];
            if (step0) {
              step0.isValid = Object.keys(step1Errors).length === 0;
              step0.isCompleted = step0.isValid;
            }
            if (step1) {
              step1.isValid = Object.keys(step2Errors).length === 0;
              step1.isCompleted = step1.isValid;
            }
            if (step2) {
              step2.isValid = Object.keys(step3Errors).length === 0;
              step2.isCompleted = step2.isValid;
            }
          break;
        case 5:
          // Submit step - validate all previous steps
          const allStepErrors = {
            ...validateStep1(state.formData),
            ...validateStep2(state.formData),
            ...validateStep3(state.formData),
          };
          errors = allStepErrors;
          break;
      }

      state.validationErrors = errors;
        const isStepValid = Object.keys(errors).length === 0;
        const current = state.steps[state.currentStep - 1];
        if (current) {
          current.isValid = isStepValid;
          current.isCompleted = isStepValid;
        }
    },

    setImagePreview: (
      state,
      action: PayloadAction<{ show: boolean; url?: string }>,
    ) => {
      state.showImagePreview = action.payload.show;
      state.previewImageUrl = action.payload.url || null;
    },

    clearGuestData: (state) => {
      state.currentStep = 1;
      state.steps = initialSteps;
      state.formData = initialFormData;
      state.validationErrors = {};
      state.isDraftSaved = false;
      state.serviceRequestData = initialServiceRequestData;
      state.serviceRequestId = null;
      state.serviceRequestStep = "form";
      state.isSubmittingService = false;
      state.complaintId = null;
      state.trackingNumber = null;
      state.sessionId = null;
      state.submissionStep = "form";
      state.currentFormStep = 1;
      state.formValidation = {};
      state.otpSent = false;
      state.otpExpiry = null;
      state.error = null;
      state.userEmail = null;
      state.newUserRegistered = false;
      state.trackingData = null;
      state.showImagePreview = false;
      state.previewImageUrl = null;

      // Clear sessionStorage
      try {
        sessionStorage.removeItem("guestComplaintDraft");
        clearFormDataFromSession();
      } catch (error) {
        console.warn("Failed to clear draft from sessionStorage:", error);
      }
    },

    updateServiceRequestData: (
      state,
      action: PayloadAction<Partial<GuestServiceRequestData>>,
    ) => {
      state.serviceRequestData = {
        ...state.serviceRequestData,
        ...action.payload,
      };
    },

    setServiceRequestStep: (
      state,
      action: PayloadAction<"form" | "otp" | "success">,
    ) => {
      state.serviceRequestStep = action.payload;
    },

    setSubmissionStep: (
      state,
      action: PayloadAction<"form" | "otp" | "success">,
    ) => {
      state.submissionStep = action.payload;
    },

    setCurrentFormStep: (state, action: PayloadAction<number>) => {
      state.currentFormStep = action.payload;
    },
    setFormValidation: (
      state,
      action: PayloadAction<Record<string, string>>,
    ) => {
      state.formValidation = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateComplaintData: (
      state,
      action: PayloadAction<
        Partial<GuestComplaintData> & { currentStep?: number }
      >,
    ) => {
      const { currentStep, ...dataUpdate } = action.payload;

      if (state.formData) {
        state.formData = { ...state.formData, ...dataUpdate };
      } else {
        state.formData = dataUpdate as GuestComplaintData;
      }

      if (currentStep !== undefined) {
        state.currentFormStep = currentStep;
      }

      // Save to sessionStorage
      const dataToSave = {
        ...state.formData,
        currentStep: state.currentFormStep,
      };
      saveFormDataToSession(dataToSave);
    },
    loadSavedFormData: (state) => {
      const savedData = loadFormDataFromSession();
      if (savedData) {
        const { currentStep, ...complaintData } = savedData;
        if (Object.keys(complaintData).length > 0) {
          state.formData = {
            ...state.formData,
            ...(complaintData as Partial<GuestComplaintData>),
          };
        }
        if (currentStep) {
          state.currentFormStep = currentStep;
        }
      }
    },
    resetOTPState: (state) => {
      state.otpSent = false;
      state.otpExpiry = null;
      state.submissionStep = "form";
    },
    setOtpSession: (
      state,
      action: PayloadAction<{
        sessionId: string;
        email: string;
        expiresAt: string;
      }>,
    ) => {
      state.sessionId = action.payload.sessionId;
      state.userEmail = action.payload.email;
      state.otpExpiry = action.payload.expiresAt;
      state.otpSent = true;
      state.submissionStep = "otp";
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
        state.complaintId = null;
        state.trackingNumber = null;
        state.sessionId = action.payload.sessionId;
        state.userEmail = action.payload.email;
        state.otpSent = true;
        state.otpExpiry = action.payload.expiresAt;
        state.submissionStep = "otp";
        state.error = null;

        // Mark submission step as completed
          const submission = state.steps[4];
          if (submission) {
            submission.isCompleted = true;
            submission.isValid = true;
          }
      })
      .addCase(submitGuestComplaint.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload as string;
      })

      // OTP verification is now handled by RTK Query hooks
      // State management for verification status is handled in OtpContext

      // OTP resend is now handled by RTK Query hooks in guestApi.ts

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
        state.error = null;
      })
      .addCase(getPublicStats.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      // Submit Service Request
      .addCase(submitGuestServiceRequest.pending, (state) => {
        state.isSubmittingService = true;
        state.error = null;
      })
      .addCase(submitGuestServiceRequest.fulfilled, (state, action) => {
        state.isSubmittingService = false;
        state.serviceRequestId = action.payload.serviceRequestId;
        state.serviceRequestStep = "success";
        state.error = null;
      })
      .addCase(submitGuestServiceRequest.rejected, (state, action) => {
        state.isSubmittingService = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setCurrentStep,
  nextStep,
  prevStep,
  updateFormData,
  addAttachment,
  removeAttachment,
  updateAttachment,
  validateCurrentStep,
  setImagePreview,
  clearGuestData,
  setSubmissionStep,
  setCurrentFormStep,
  setFormValidation,
  clearError,
  updateComplaintData,
  loadSavedFormData,
  resetOTPState,
  updateServiceRequestData,
  setServiceRequestStep,
  setOtpSession,
} = guestSlice.actions;

export default guestSlice.reducer;

// Selectors
export const selectGuestState = (state: { guest: GuestState }) => state.guest;
export const selectCurrentStep = (state: { guest: GuestState }) =>
  state.guest.currentStep;
export const selectSteps = (state: { guest: GuestState }) => state.guest.steps;
export const selectFormData = (state: { guest: GuestState }) =>
  state.guest.formData;
export const selectValidationErrors = (state: { guest: GuestState }) =>
  state.guest.validationErrors;
export const selectIsStepValid = (state: { guest: GuestState }) => {
  const currentStepIndex = state.guest.currentStep - 1;
  return state.guest.steps[currentStepIndex]?.isValid || false;
};
export const selectCanProceed = (state: { guest: GuestState }) => {
  const currentStepIndex = state.guest.currentStep - 1;
  return state.guest.steps[currentStepIndex]?.isValid || false;
};
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
export const selectSessionId = (state: { guest: GuestState }) =>
  state.guest.sessionId;
export const selectTrackingNumber = (state: { guest: GuestState }) =>
  state.guest.trackingNumber;
export const selectUserEmail = (state: { guest: GuestState }) =>
  state.guest.userEmail;
export const selectNewUserRegistered = (state: { guest: GuestState }) =>
  state.guest.newUserRegistered;
export const selectTrackingData = (state: { guest: GuestState }) =>
  state.guest.trackingData;
export const selectIsDraftSaved = (state: { guest: GuestState }) =>
  state.guest.isDraftSaved;
export const selectImagePreview = (state: { guest: GuestState }) => ({
  show: state.guest.showImagePreview,
  url: state.guest.previewImageUrl,
});
export const selectServiceRequestData = (state: { guest: GuestState }) =>
  state.guest.serviceRequestData;
export const selectServiceRequestStep = (state: { guest: GuestState }) =>
  state.guest.serviceRequestStep;
export const selectIsSubmittingService = (state: { guest: GuestState }) =>
  state.guest.isSubmittingService;
export const selectServiceRequestId = (state: { guest: GuestState }) =>
  state.guest.serviceRequestId;
