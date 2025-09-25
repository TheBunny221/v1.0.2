import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

// Types matching backend Prisma schema
export interface WardDashboardStats {
  totalComplaints: number;
  needToAssign: number;
  complaintsByStatus: {
    status: ComplaintStatus;
    _count: number;
  }[];
}

export type ComplaintStatus =
  | "REGISTERED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CLOSED"
  | "REOPENED";

export type ComplaintType =
  | "WATER_SUPPLY"
  | "ELECTRICITY"
  | "ROAD_REPAIR"
  | "GARBAGE_COLLECTION"
  | "STREET_LIGHTING"
  | "SEWERAGE"
  | "PUBLIC_HEALTH"
  | "TRAFFIC"
  | "OTHERS";

export type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface Attachment {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: string;
}

export interface StatusLog {
  id: string;
  fromStatus?: ComplaintStatus;
  toStatus: ComplaintStatus;
  comment?: string;
  timestamp: string;
  user: {
    fullName: string;
    role: string;
  };
}

export interface Ward {
  id: string;
  name: string;
  description?: string;
}

export interface SubZone {
  id: string;
  name: string;
  wardId: string;
  description?: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  role: string;
}

export interface Complaint {
  id: string;
  title?: string;
  description: string;
  type: ComplaintType;
  status: ComplaintStatus;
  priority: Priority;
  slaStatus: "ON_TIME" | "WARNING" | "OVERDUE" | "COMPLETED";

  // Location Information
  wardId: string;
  subZoneId?: string;
  area: string;
  landmark?: string;
  address?: string;
  coordinates?: string; // JSON string for lat/lng

  // Contact Information
  contactName?: string;
  contactEmail?: string;
  contactPhone: string;
  isAnonymous: boolean;

  // Assignment and Tracking
  submittedById?: string;
  assignedToId?: string;
  resolvedById?: string;

  // Timestamps
  submittedOn: string;
  assignedOn?: string;
  resolvedOn?: string;
  closedOn?: string;
  deadline?: string;

  // Additional Information
  remarks?: string;
  citizenFeedback?: string;
  rating?: number; // 1-5 rating
  tags?: string; // JSON array of tags

  // Relations
  ward?: Ward;
  subZone?: SubZone;
  submittedBy?: User;
  assignedTo?: User;
  attachments?: Attachment[];
  statusLogs?: StatusLog[];
}

export interface ComplaintsState {
  complaints: Complaint[];
  loading: boolean;
  error: string | null;
  selectedComplaint: Complaint | null;
  wardDashboardStats: WardDashboardStats | null;
  currentComplaint: Complaint | null;
  filters: any;
  isLoading: boolean;
  pagination: any;
  statistics: any | null;
}

// Thunk for fetching ward dashboard stats
export const fetchWardDashboardStats = createAsyncThunk(
  "complaints/fetchWardDashboardStats",
  async (wardId: string) => {
    const response = await axios.get(`/api/complaints/ward-dashboard-stats`, {
      params: { wardId },
    });
    return response.data.data;
  },
);

// Initial state
const initialState: ComplaintsState = {
  complaints: [],
  loading: false,
  error: null,
  selectedComplaint: null,
  wardDashboardStats: null,
  currentComplaint: null,
  filters: {},
  isLoading: false,
  pagination: {
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    limit: 10,
    hasNext: false,
    hasPrev: false,
  },
  statistics: null,
};

// Helper function to make API calls
const apiCall = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Authentication required. Please log in.");
  }

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
    ...options,
  });

  // Read body ONCE and parse
  const raw = await response.text();
  let data: any = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    // If HTML returned (like login page), surface a clearer error
    if (raw && (raw.includes("<!doctype") || raw.includes("<html"))) {
      throw new Error("Authentication required. Please log in and try again.");
    }
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    throw new Error("Server returned unexpected response format");
  }

  if (!response.ok) {
    throw new Error(data?.message || `HTTP ${response.status}`);
  }

  return data;
};

// Async thunks
export const fetchComplaints = createAsyncThunk(
  "complaints/fetchComplaints",
  async (
    params: {
      page?: number;
      limit?: number;
      status?: ComplaintStatus;
      type?: ComplaintType;
      priority?: Priority;
      wardId?: string;
      assignedToId?: string;
      search?: string;
    } = {},
    { rejectWithValue },
  ) => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });

      const data = await apiCall(`/api/complaints?${queryParams.toString()}`);
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch complaints",
      );
    }
  },
);

export const fetchComplaint = createAsyncThunk(
  "complaints/fetchComplaint",
  async (id: string, { rejectWithValue }) => {
    try {
      const data = await apiCall(`/api/complaints/${id}`);
      return data.data.complaint;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch complaint",
      );
    }
  },
);

export const createComplaint = createAsyncThunk(
  "complaints/createComplaint",
  async (
    complaintData: {
      title?: string;
      description: string;
      type: ComplaintType;
      priority?: Priority;
      wardId: string;
      subZoneId?: string;
      area: string;
      landmark?: string;
      address?: string;
      coordinates?: { latitude: number; longitude: number };
      contactName?: string;
      contactEmail?: string;
      contactPhone?: string;
      isAnonymous?: boolean;
      captchaId?: string;
      captchaText?: string;
      isSubmitting?: boolean;
    },
    { rejectWithValue },
  ) => {
    try {
      const data = await apiCall("/api/complaints", {
        method: "POST",
        body: JSON.stringify(complaintData),
      });
      return data.data.complaint;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to create complaint",
      );
    }
  },
);

export const updateComplaintStatus = createAsyncThunk(
  "complaints/updateStatus",
  async (
    params: {
      id: string;
      status: ComplaintStatus;
      comment?: string;
      assignedToId?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const data = await apiCall(`/api/complaints/${params.id}/status`, {
        method: "PUT",
        body: JSON.stringify({
          status: params.status,
          comment: params.comment,
          assignedToId: params.assignedToId,
        }),
      });
      return data.data.complaint;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Failed to update complaint status",
      );
    }
  },
);

export const assignComplaint = createAsyncThunk(
  "complaints/assignComplaint",
  async (
    params: {
      id: string;
      assignedToId: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const data = await apiCall(`/api/complaints/${params.id}/assign`, {
        method: "PUT",
        body: JSON.stringify({ assignedToId: params.assignedToId }),
      });
      return data.data.complaint;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to assign complaint",
      );
    }
  },
);

export const addComplaintFeedback = createAsyncThunk(
  "complaints/addFeedback",
  async (
    params: {
      id: string;
      rating: number;
      citizenFeedback: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const data = await apiCall(`/api/complaints/${params.id}/feedback`, {
        method: "POST",
        body: JSON.stringify({
          rating: params.rating,
          citizenFeedback: params.citizenFeedback,
        }),
      });
      return data.data.complaint;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to add feedback",
      );
    }
  },
);

export const reopenComplaint = createAsyncThunk(
  "complaints/reopenComplaint",
  async (
    params: {
      id: string;
      comment?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const data = await apiCall(`/api/complaints/${params.id}/reopen`, {
        method: "PUT",
        body: JSON.stringify({ comment: params.comment }),
      });
      return data.data.complaint;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to reopen complaint",
      );
    }
  },
);

export const fetchComplaintStats = createAsyncThunk(
  "complaints/fetchStats",
  async (
    params: {
      wardId?: string;
      dateFrom?: string;
      dateTo?: string;
    } = {},
    { rejectWithValue },
  ) => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const data = await apiCall(
        `/api/complaints/stats?${queryParams.toString()}`,
      );
      return data.data.stats;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch statistics",
      );
    }
  },
);

export const submitFeedback = createAsyncThunk(
  "complaints/submitFeedback",
  async (
    {
      complaintId,
      rating,
      comment,
    }: {
      complaintId: string;
      rating: number;
      comment?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const data = await apiCall(`/api/complaints/${complaintId}/feedback`, {
        method: "POST",
        body: JSON.stringify({ rating, comment }),
      });
      return {
        complaintId,
        feedback: data.data.feedback,
      };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to submit feedback",
      );
    }
  },
);

// Slice
const complaintsSlice = createSlice({
  name: "complaints",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (
      state,
      action: PayloadAction<Partial<ComplaintsState["filters"]>>,
    ) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    setCurrentComplaint: (state, action: PayloadAction<Complaint | null>) => {
      state.currentComplaint = action.payload;
    },
    clearCurrentComplaint: (state) => {
      state.currentComplaint = null;
    },
  },
  extraReducers: (builder) => {
    // Ward Dashboard Stats
    builder
      .addCase(fetchWardDashboardStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWardDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.wardDashboardStats = action.payload;
      })
      .addCase(fetchWardDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message || "Failed to fetch ward dashboard stats";
      });
    builder
      // Fetch complaints
      .addCase(fetchComplaints.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchComplaints.fulfilled, (state, action) => {
        state.isLoading = false;
        state.complaints = action.payload.complaints;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(fetchComplaints.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Fetch single complaint
      .addCase(fetchComplaint.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchComplaint.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentComplaint = action.payload;
        state.error = null;
      })
      .addCase(fetchComplaint.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Create complaint
      .addCase(createComplaint.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createComplaint.fulfilled, (state, action) => {
        state.isLoading = false;
        state.complaints.unshift(action.payload);
        state.error = null;
      })
      .addCase(createComplaint.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Update complaint status
      .addCase(updateComplaintStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateComplaintStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.complaints.findIndex(
          (c) => c.id === action.payload.id,
        );
        if (index !== -1) {
          state.complaints[index] = action.payload;
        }
        if (state.currentComplaint?.id === action.payload.id) {
          state.currentComplaint = action.payload;
        }
        state.error = null;
      })
      .addCase(updateComplaintStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Assign complaint
      .addCase(assignComplaint.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(assignComplaint.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.complaints.findIndex(
          (c) => c.id === action.payload.id,
        );
        if (index !== -1) {
          state.complaints[index] = action.payload;
        }
        if (state.currentComplaint?.id === action.payload.id) {
          state.currentComplaint = action.payload;
        }
        state.error = null;
      })
      .addCase(assignComplaint.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Add feedback
      .addCase(addComplaintFeedback.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addComplaintFeedback.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.complaints.findIndex(
          (c) => c.id === action.payload.id,
        );
        if (index !== -1) {
          state.complaints[index] = action.payload;
        }
        if (state.currentComplaint?.id === action.payload.id) {
          state.currentComplaint = action.payload;
        }
        state.error = null;
      })
      .addCase(addComplaintFeedback.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Submit feedback
      .addCase(submitFeedback.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(submitFeedback.fulfilled, (state, action) => {
        state.isLoading = false;
        const { complaintId, feedback } = action.payload;

        // Update complaint in list
        const index = state.complaints.findIndex((c) => c.id === complaintId);
        if (index !== -1 && state.complaints[index]) {
          const complaint = state.complaints[index];
          complaint.citizenFeedback = feedback.comment;
          complaint.rating = feedback.rating;
        }

        // Update current complaint
        if (state.currentComplaint?.id === complaintId) {
          state.currentComplaint.citizenFeedback = feedback.comment;
          state.currentComplaint.rating = feedback.rating;
        }

        state.error = null;
      })
      .addCase(submitFeedback.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Reopen complaint
      .addCase(reopenComplaint.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(reopenComplaint.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.complaints.findIndex(
          (c) => c.id === action.payload.id,
        );
        if (index !== -1) {
          state.complaints[index] = action.payload;
        }
        if (state.currentComplaint?.id === action.payload.id) {
          state.currentComplaint = action.payload;
        }
        state.error = null;
      })
      .addCase(reopenComplaint.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Fetch statistics
      .addCase(fetchComplaintStats.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchComplaintStats.fulfilled, (state, action) => {
        state.statistics = action.payload;
        state.error = null;
      })
      .addCase(fetchComplaintStats.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  setFilters,
  clearFilters,
  setCurrentComplaint,
  clearCurrentComplaint,
} = complaintsSlice.actions;

export default complaintsSlice.reducer;

// Selectors
export const selectComplaints = (state: { complaints: ComplaintsState }) =>
  state.complaints.complaints;
export const selectCurrentComplaint = (state: {
  complaints: ComplaintsState;
}) => state.complaints.currentComplaint;
export const selectComplaintsLoading = (state: {
  complaints: ComplaintsState;
}) => state.complaints.isLoading;
export const selectComplaintsError = (state: { complaints: ComplaintsState }) =>
  state.complaints.error;
export const selectComplaintsFilters = (state: {
  complaints: ComplaintsState;
}) => state.complaints.filters;
export const selectComplaintsPagination = (state: {
  complaints: ComplaintsState;
}) => state.complaints.pagination;
export const selectComplaintsStats = (state: { complaints: ComplaintsState }) =>
  state.complaints.statistics;
