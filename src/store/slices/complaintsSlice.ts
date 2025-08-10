import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// Types
export type ComplaintStatus = 'registered' | 'assigned' | 'in-progress' | 'resolved' | 'closed' | 'reopened';
export type ComplaintType = 'Water_Supply' | 'Electricity' | 'Road_Repair' | 'Garbage_Collection' | 'Street_Lighting' | 'Sewerage' | 'Public_Health' | 'Traffic' | 'Others';
export type Priority = 'low' | 'medium' | 'high' | 'critical';

export interface ComplaintFile {
  id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  uploadedAt: string;
}

export interface ComplaintRemark {
  id: string;
  text: string;
  type: 'status_update' | 'assignment' | 'general' | 'closure' | 'reopen';
  addedAt: string;
  addedBy: {
    id: string;
    name: string;
    role: string;
  };
}

export interface Complaint {
  id: string;
  complaintId: string;
  type: ComplaintType;
  description: string;
  contactMobile: string;
  contactEmail?: string;
  ward: string;
  area: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  landmark?: string;
  status: ComplaintStatus;
  priority: Priority;
  submittedBy: {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
  };
  assignedTo?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
  };
  assignedAt?: string;
  slaDeadline: string;
  resolvedAt?: string;
  closedAt?: string;
  isAnonymous: boolean;
  feedbackRating?: number;
  feedbackComment?: string;
  feedbackSubmittedAt?: string;
  tags: string[];
  category: string;
  escalationLevel: number;
  estimatedResolutionTime: number;
  createdAt: string;
  updatedAt: string;
  files: ComplaintFile[];
  remarks: ComplaintRemark[];
  slaStatus: 'ontime' | 'warning' | 'overdue' | 'completed';
  timeElapsed: string;
}

export interface ComplaintFilters {
  status?: ComplaintStatus;
  priority?: Priority;
  type?: ComplaintType;
  ward?: string;
  assignedToId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface ComplaintStats {
  total: number;
  byStatus: Record<ComplaintStatus, number>;
  byType: Record<ComplaintType, number>;
  byPriority: Record<Priority, number>;
  sla: {
    onTime: number;
    warning: number;
    overdue: number;
    completed: number;
  };
}

export interface ComplaintState {
  complaints: Complaint[];
  myComplaints: Complaint[];
  currentComplaint: Complaint | null;
  stats: ComplaintStats | null;
  filters: ComplaintFilters;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
}

// Initial state
const initialState: ComplaintState = {
  complaints: [],
  myComplaints: [],
  currentComplaint: null,
  stats: null,
  filters: {},
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  },
  isLoading: false,
  isSubmitting: false,
  error: null,
};

// Async thunks
export const fetchComplaints = createAsyncThunk(
  'complaints/fetchComplaints',
  async (params: { page?: number; limit?: number; filters?: ComplaintFilters }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: { token: string } };
      const token = state.auth.token;

      const searchParams = new URLSearchParams();
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());
      
      if (params.filters) {
        Object.entries(params.filters).forEach(([key, value]) => {
          if (value) searchParams.append(key, value);
        });
      }

      const response = await fetch(`/api/complaints?${searchParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to fetch complaints');
      }

      return data.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Network error');
    }
  }
);

export const fetchMyComplaints = createAsyncThunk(
  'complaints/fetchMyComplaints',
  async (params: { page?: number; limit?: number; status?: ComplaintStatus }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: { token: string } };
      const token = state.auth.token;

      const searchParams = new URLSearchParams();
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());
      if (params.status) searchParams.append('status', params.status);

      const response = await fetch(`/api/complaints/my?${searchParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to fetch my complaints');
      }

      return data.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Network error');
    }
  }
);

export const fetchComplaintById = createAsyncThunk(
  'complaints/fetchComplaintById',
  async (id: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: { token: string } };
      const token = state.auth.token;

      const response = await fetch(`/api/complaints/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to fetch complaint');
      }

      return data.data.complaint;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Network error');
    }
  }
);

export const createComplaint = createAsyncThunk(
  'complaints/createComplaint',
  async (complaintData: {
    type: ComplaintType;
    description: string;
    contactInfo: { mobile: string; email?: string };
    location: { ward: string; area: string; address?: string; coordinates?: { latitude: number; longitude: number }; landmark?: string };
    isAnonymous?: boolean;
  }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: { token: string | null } };
      const token = state.auth.token;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/complaints', {
        method: 'POST',
        headers,
        body: JSON.stringify(complaintData),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to create complaint');
      }

      return data.data.complaint;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Network error');
    }
  }
);

export const updateComplaint = createAsyncThunk(
  'complaints/updateComplaint',
  async (params: { id: string; updates: { status?: ComplaintStatus; priority?: Priority; assignedToId?: string; remarks?: string } }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: { token: string } };
      const token = state.auth.token;

      const response = await fetch(`/api/complaints/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(params.updates),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to update complaint');
      }

      return data.data.complaint;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Network error');
    }
  }
);

export const submitFeedback = createAsyncThunk(
  'complaints/submitFeedback',
  async (params: { id: string; rating: number; comment?: string }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: { token: string } };
      const token = state.auth.token;

      const response = await fetch(`/api/complaints/${params.id}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ rating: params.rating, comment: params.comment }),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to submit feedback');
      }

      return { id: params.id, feedback: data.data.feedback };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Network error');
    }
  }
);

export const fetchComplaintStats = createAsyncThunk(
  'complaints/fetchStats',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: { token: string } };
      const token = state.auth.token;

      const response = await fetch('/api/complaints/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to fetch stats');
      }

      return data.data.stats;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Network error');
    }
  }
);

// Complaints slice
const complaintsSlice = createSlice({
  name: 'complaints',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<ComplaintFilters>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    setCurrentComplaint: (state, action: PayloadAction<Complaint | null>) => {
      state.currentComplaint = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetComplaints: () => initialState,
  },
  extraReducers: (builder) => {
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
      // Fetch my complaints
      .addCase(fetchMyComplaints.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyComplaints.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myComplaints = action.payload.complaints;
        state.error = null;
      })
      .addCase(fetchMyComplaints.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch complaint by ID
      .addCase(fetchComplaintById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchComplaintById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentComplaint = action.payload;
        state.error = null;
      })
      .addCase(fetchComplaintById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create complaint
      .addCase(createComplaint.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(createComplaint.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.complaints.unshift(action.payload);
        state.myComplaints.unshift(action.payload);
        state.error = null;
      })
      .addCase(createComplaint.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload as string;
      })
      // Update complaint
      .addCase(updateComplaint.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(updateComplaint.fulfilled, (state, action) => {
        state.isSubmitting = false;
        const index = state.complaints.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.complaints[index] = action.payload;
        }
        if (state.currentComplaint?.id === action.payload.id) {
          state.currentComplaint = action.payload;
        }
        state.error = null;
      })
      .addCase(updateComplaint.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload as string;
      })
      // Submit feedback
      .addCase(submitFeedback.fulfilled, (state, action) => {
        const index = state.complaints.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.complaints[index] = {
            ...state.complaints[index],
            feedbackRating: action.payload.feedback.rating,
            feedbackComment: action.payload.feedback.comment,
            feedbackSubmittedAt: action.payload.feedback.submittedAt,
          };
        }
        if (state.currentComplaint?.id === action.payload.id) {
          state.currentComplaint = {
            ...state.currentComplaint,
            feedbackRating: action.payload.feedback.rating,
            feedbackComment: action.payload.feedback.comment,
            feedbackSubmittedAt: action.payload.feedback.submittedAt,
          };
        }
      })
      // Fetch stats
      .addCase(fetchComplaintStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      });
  },
});

export const { setFilters, clearFilters, setCurrentComplaint, clearError, resetComplaints } = complaintsSlice.actions;
export default complaintsSlice.reducer;

// Selectors
export const selectComplaints = (state: { complaints: ComplaintState }) => state.complaints.complaints;
export const selectMyComplaints = (state: { complaints: ComplaintState }) => state.complaints.myComplaints;
export const selectCurrentComplaint = (state: { complaints: ComplaintState }) => state.complaints.currentComplaint;
export const selectComplaintStats = (state: { complaints: ComplaintState }) => state.complaints.stats;
export const selectComplaintFilters = (state: { complaints: ComplaintState }) => state.complaints.filters;
export const selectComplaintPagination = (state: { complaints: ComplaintState }) => state.complaints.pagination;
export const selectComplaintsLoading = (state: { complaints: ComplaintState }) => state.complaints.isLoading;
export const selectComplaintsSubmitting = (state: { complaints: ComplaintState }) => state.complaints.isSubmitting;
export const selectComplaintsError = (state: { complaints: ComplaintState }) => state.complaints.error;
