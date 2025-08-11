import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  hasPermission,
  canViewComplaint,
  DataFilters,
} from "../../utils/permissions";
import type { UserRole } from "../../utils/permissions";

// Types
interface DataState {
  // Complaints data
  allComplaints: any[];
  userComplaints: any[];
  wardComplaints: any[];
  assignedComplaints: any[];

  // Users data
  allUsers: any[];
  wardUsers: any[];

  // Analytics data
  analytics: {
    complaintsStats: any;
    wardStats: any;
    userStats: any;
    slaStats: any;
  };

  // Loading states
  loading: {
    complaints: boolean;
    users: boolean;
    analytics: boolean;
  };

  // Error states
  errors: {
    complaints: string | null;
    users: string | null;
    analytics: string | null;
  };

  // Last updated timestamps
  lastUpdated: {
    complaints: number | null;
    users: number | null;
    analytics: number | null;
  };
}

const initialState: DataState = {
  allComplaints: [],
  userComplaints: [],
  wardComplaints: [],
  assignedComplaints: [],
  allUsers: [],
  wardUsers: [],
  analytics: {
    complaintsStats: null,
    wardStats: null,
    userStats: null,
    slaStats: null,
  },
  loading: {
    complaints: false,
    users: false,
    analytics: false,
  },
  errors: {
    complaints: null,
    users: null,
    analytics: null,
  },
  lastUpdated: {
    complaints: null,
    users: null,
    analytics: null,
  },
};

// Helper function for API calls
const apiCall = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("token");
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
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
      throw new Error("Authentication required. Please log in and try again.");
    } else {
      throw new Error("Server returned unexpected response format");
    }
  }

  if (!response.ok) {
    throw new Error(data?.message || `HTTP ${response.status}`);
  }

  return data.data;
};

// Async thunks
export const fetchAllComplaints = createAsyncThunk(
  "data/fetchAllComplaints",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const user = state.auth.user;

      if (!user) {
        throw new Error("User not authenticated");
      }

      const complaints = await apiCall("/api/complaints");

      // Filter complaints based on user permissions
      const filteredComplaints = DataFilters.filterComplaints(
        complaints,
        user.role as UserRole,
        user.id,
        user.wardId,
      );

      return {
        allComplaints: complaints,
        filteredComplaints,
        userRole: user.role,
        userId: user.id,
        userWardId: user.wardId,
      };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch complaints",
      );
    }
  },
);

export const fetchUserComplaints = createAsyncThunk(
  "data/fetchUserComplaints",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const user = state.auth.user;

      if (!user) {
        throw new Error("User not authenticated");
      }

      const complaints = await apiCall(`/api/complaints/user/${user.id}`);
      return complaints;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Failed to fetch user complaints",
      );
    }
  },
);

export const fetchWardComplaints = createAsyncThunk(
  "data/fetchWardComplaints",
  async (wardId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const user = state.auth.user;

      if (!user || !hasPermission(user.role, "complaint:view:ward")) {
        throw new Error("Insufficient permissions");
      }

      const complaints = await apiCall(`/api/complaints/ward/${wardId}`);
      return complaints;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Failed to fetch ward complaints",
      );
    }
  },
);

export const fetchAssignedComplaints = createAsyncThunk(
  "data/fetchAssignedComplaints",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const user = state.auth.user;

      if (!user) {
        throw new Error("User not authenticated");
      }

      const complaints = await apiCall(`/api/complaints/assigned/${user.id}`);
      return complaints;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Failed to fetch assigned complaints",
      );
    }
  },
);

export const fetchAllUsers = createAsyncThunk(
  "data/fetchAllUsers",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const user = state.auth.user;

      if (!user || !hasPermission(user.role, "user:view:all")) {
        throw new Error("Insufficient permissions");
      }

      const users = await apiCall("/api/users");
      return users;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch users",
      );
    }
  },
);

export const fetchWardUsers = createAsyncThunk(
  "data/fetchWardUsers",
  async (wardId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const user = state.auth.user;

      if (!user || !hasPermission(user.role, "ward:manage")) {
        throw new Error("Insufficient permissions");
      }

      const users = await apiCall(`/api/users/ward/${wardId}`);
      return users;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch ward users",
      );
    }
  },
);

export const fetchAnalytics = createAsyncThunk(
  "data/fetchAnalytics",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const user = state.auth.user;

      if (!user || !hasPermission(user.role, "system:analytics")) {
        throw new Error("Insufficient permissions");
      }

      const [complaintsStats, wardStats, userStats, slaStats] =
        await Promise.all([
          apiCall("/api/analytics/complaints"),
          apiCall("/api/analytics/wards"),
          apiCall("/api/analytics/users"),
          apiCall("/api/analytics/sla"),
        ]);

      return {
        complaintsStats,
        wardStats,
        userStats,
        slaStats,
      };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch analytics",
      );
    }
  },
);

// Update complaint with role-based validation
export const updateComplaint = createAsyncThunk(
  "data/updateComplaint",
  async (
    { complaintId, updates }: { complaintId: string; updates: any },
    { getState, rejectWithValue },
  ) => {
    try {
      const state = getState() as any;
      const user = state.auth.user;
      const complaint = state.data.allComplaints.find(
        (c: any) => c.id === complaintId,
      );

      if (!user || !complaint) {
        throw new Error("User not authenticated or complaint not found");
      }

      // Check permissions before update
      const canModify =
        hasPermission(user.role, "complaint:update:all") ||
        (hasPermission(user.role, "complaint:update:own") &&
          complaint.submittedById === user.id) ||
        (hasPermission(user.role, "complaint:update:ward") &&
          complaint.wardId === user.wardId) ||
        (hasPermission(user.role, "complaint:update:own") &&
          complaint.assignedToId === user.id);

      if (!canModify) {
        throw new Error("Insufficient permissions to update this complaint");
      }

      const updatedComplaint = await apiCall(`/api/complaints/${complaintId}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      });

      return updatedComplaint;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to update complaint",
      );
    }
  },
);

// Data slice
const dataSlice = createSlice({
  name: "data",
  initialState,
  reducers: {
    clearErrors: (state) => {
      state.errors = {
        complaints: null,
        users: null,
        analytics: null,
      };
    },

    clearComplaintsCache: (state) => {
      state.allComplaints = [];
      state.userComplaints = [];
      state.wardComplaints = [];
      state.assignedComplaints = [];
      state.lastUpdated.complaints = null;
    },

    clearUsersCache: (state) => {
      state.allUsers = [];
      state.wardUsers = [];
      state.lastUpdated.users = null;
    },

    clearAnalyticsCache: (state) => {
      state.analytics = {
        complaintsStats: null,
        wardStats: null,
        userStats: null,
        slaStats: null,
      };
      state.lastUpdated.analytics = null;
    },

    // Optimistic updates for better UX
    optimisticComplaintUpdate: (
      state,
      action: PayloadAction<{ id: string; updates: any }>,
    ) => {
      const { id, updates } = action.payload;

      // Update in all relevant arrays
      const updateComplaintInArray = (complaints: any[]) => {
        const index = complaints.findIndex((c) => c.id === id);
        if (index !== -1) {
          complaints[index] = { ...complaints[index], ...updates };
        }
      };

      updateComplaintInArray(state.allComplaints);
      updateComplaintInArray(state.userComplaints);
      updateComplaintInArray(state.wardComplaints);
      updateComplaintInArray(state.assignedComplaints);
    },
  },

  extraReducers: (builder) => {
    // Fetch all complaints
    builder
      .addCase(fetchAllComplaints.pending, (state) => {
        state.loading.complaints = true;
        state.errors.complaints = null;
      })
      .addCase(fetchAllComplaints.fulfilled, (state, action) => {
        state.loading.complaints = false;
        state.allComplaints = action.payload.filteredComplaints;
        state.lastUpdated.complaints = Date.now();
      })
      .addCase(fetchAllComplaints.rejected, (state, action) => {
        state.loading.complaints = false;
        state.errors.complaints = action.payload as string;
      });

    // Fetch user complaints
    builder.addCase(fetchUserComplaints.fulfilled, (state, action) => {
      state.userComplaints = action.payload;
    });

    // Fetch ward complaints
    builder.addCase(fetchWardComplaints.fulfilled, (state, action) => {
      state.wardComplaints = action.payload;
    });

    // Fetch assigned complaints
    builder.addCase(fetchAssignedComplaints.fulfilled, (state, action) => {
      state.assignedComplaints = action.payload;
    });

    // Fetch all users
    builder
      .addCase(fetchAllUsers.pending, (state) => {
        state.loading.users = true;
        state.errors.users = null;
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.loading.users = false;
        state.allUsers = action.payload;
        state.lastUpdated.users = Date.now();
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.loading.users = false;
        state.errors.users = action.payload as string;
      });

    // Fetch ward users
    builder.addCase(fetchWardUsers.fulfilled, (state, action) => {
      state.wardUsers = action.payload;
    });

    // Fetch analytics
    builder
      .addCase(fetchAnalytics.pending, (state) => {
        state.loading.analytics = true;
        state.errors.analytics = null;
      })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.loading.analytics = false;
        state.analytics = action.payload;
        state.lastUpdated.analytics = Date.now();
      })
      .addCase(fetchAnalytics.rejected, (state, action) => {
        state.loading.analytics = false;
        state.errors.analytics = action.payload as string;
      });

    // Update complaint
    builder.addCase(updateComplaint.fulfilled, (state, action) => {
      // Update the complaint in all relevant arrays
      const updatedComplaint = action.payload;
      const updateInArray = (complaints: any[]) => {
        const index = complaints.findIndex((c) => c.id === updatedComplaint.id);
        if (index !== -1) {
          complaints[index] = updatedComplaint;
        }
      };

      updateInArray(state.allComplaints);
      updateInArray(state.userComplaints);
      updateInArray(state.wardComplaints);
      updateInArray(state.assignedComplaints);
    });
  },
});

export const {
  clearErrors,
  clearComplaintsCache,
  clearUsersCache,
  clearAnalyticsCache,
  optimisticComplaintUpdate,
} = dataSlice.actions;

// Selectors with role-based filtering
export const selectFilteredComplaints = (state: any) => {
  const { user } = state.auth;
  const { allComplaints } = state.data;

  if (!user) return [];

  return DataFilters.filterComplaints(
    allComplaints,
    user.role as UserRole,
    user.id,
    user.wardId,
  );
};

export const selectUserComplaints = (state: any) => state.data.userComplaints;
export const selectWardComplaints = (state: any) => state.data.wardComplaints;
export const selectAssignedComplaints = (state: any) =>
  state.data.assignedComplaints;
export const selectAllUsers = (state: any) => state.data.allUsers;
export const selectWardUsers = (state: any) => state.data.wardUsers;
export const selectAnalytics = (state: any) => state.data.analytics;
export const selectDataLoading = (state: any) => state.data.loading;
export const selectDataErrors = (state: any) => state.data.errors;

export default dataSlice.reducer;
