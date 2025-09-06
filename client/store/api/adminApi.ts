import { baseApi, ApiResponse } from "./baseApi";

// Ward and boundary related interfaces
export interface Ward {
  id: string;
  name: string;
  description?: string;
  boundaries?: string;
  centerLat?: number;
  centerLng?: number;
  boundingBox?: string;
  subZones?: SubZone[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubZone {
  id: string;
  name: string;
  wardId: string;
  description?: string;
  boundaries?: string;
  centerLat?: number;
  centerLng?: number;
  boundingBox?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LocationDetection {
  exact: {
    ward: Ward | null;
    subZone: SubZone | null;
  };
  nearest: {
    ward: Ward | null;
    subZone: SubZone | null;
    distance: number;
  };
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

// Admin API types
export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  role: string;
  wardId?: string;
  ward?: {
    id: string;
    name: string;
  };
  department?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    submittedComplaints: number;
    assignedComplaints: number;
  };
}

export interface CreateUserRequest {
  fullName: string;
  email: string;
  phoneNumber?: string;
  role: string;
  wardId?: string;
  department?: string;
}

export interface UpdateUserRequest {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  role?: string;
  wardId?: string;
  department?: string;
  isActive?: boolean;
}

export interface UsersResponse {
  users: AdminUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface UserStatsResponse {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  usersByRole: Array<{
    role: string;
    _count: number;
  }>;
}

export interface SystemStatsResponse {
  totalUsers: number;
  totalComplaints: number;
  totalWards: number;
  activeComplaints: number;
  resolvedComplaints: number;
  resolutionRate: string;
}

export interface AnalyticsResponse {
  complaintsByStatus: Array<{
    status: string;
    _count: number;
  }>;
  complaintsByPriority: Array<{
    priority: string;
    _count: number;
  }>;
  complaintsByType: Array<{
    type: string;
    _count: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    count: number;
    status: string;
  }>;
}

export interface BulkActionRequest {
  action: "activate" | "deactivate" | "delete";
  userIds: string[];
}

export interface ManageRolesRequest {
  userId: string;
  newRole: string;
  wardId?: string;
}

export interface DashboardAnalyticsResponse {
  complaintTrends: Array<{
    month: string;
    complaints: number;
    resolved: number;
  }>;
  complaintsByType: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  wardPerformance: Array<{
    ward: string;
    complaints: number;
    resolved: number;
    sla: number;
  }>;
  metrics: {
    avgResolutionTime: number;
    slaCompliance: number;
    citizenSatisfaction: number;
    resolutionRate: number;
  };
}

export interface RecentActivity {
  id: string;
  type: string;
  message: string;
  time: string;
  user?: {
    name: string;
    email: string;
    role?: string;
    ward?: string;
  };
  ward?: string;
}

export interface DashboardStatsResponse {
  totalComplaints: number;
  totalUsers: number;
  activeComplaints: number;
  resolvedComplaints: number;
  overdue: number;
  wardOfficers: number;
  maintenanceTeam: number;
  activeUsers?: number;
  pendingTeamAssignments?: number;
  pendingWardOfficerAssignments?: number;
}

export interface UserActivityResponse {
  period: string;
  metrics: {
    activeUsers: number;
    newRegistrations: number;
    loginSuccessRate: number;
  };
  activities: Array<{
    id: string;
    type: string;
    message: string;
    time: string;
    user?: {
      name: string;
      email: string;
      role?: string;
      ward?: string;
    };
    ward?: string;
  }>;
}

export interface SystemHealthResponse {
  status: string;
  uptime: {
    seconds: number;
    formatted: string;
  };
  timestamp: string;
  services: {
    database: {
      status: string;
      responseTime: string;
    };
    emailService: {
      status: string;
      lastCheck: string;
    };
    fileStorage: {
      status: string;
      usedPercent: number;
    };
    api: {
      status: string;
      averageResponseTime: string;
    };
  };
  system: {
    memory: {
      used: string;
      total: string;
      percentage: number;
    };
    errors: {
      last24h: number;
      status: string;
    };
  };
  statistics: {
    totalUsers: number;
    activeUsers: number;
    totalComplaints: number;
    openComplaints: number;
    systemLoad: number;
  };
}

// Admin API slice
export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all users with pagination and filters
    getAllUsers: builder.query<
      ApiResponse<UsersResponse>,
      {
        page?: number;
        limit?: number;
        role?: string;
        ward?: string;
        status?: string;
      }
    >({
      query: ({ page = 1, limit = 10, role, ward, status = "all" }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          status,
        });

        if (role) params.append("role", role);
        if (ward) params.append("ward", ward);

        return `/admin/users?${params.toString()}`;
      },
      // Removed transformResponse to prevent response body conflicts
      providesTags: ["User"],
    }),

    // Create new user
    createUser: builder.mutation<ApiResponse<AdminUser>, CreateUserRequest>({
      query: (userData) => ({
        url: "/admin/users",
        method: "POST",
        body: userData,
      }),
      // Removed transformResponse to prevent response body conflicts
      invalidatesTags: ["User"],
    }),

    // Update user
    updateUser: builder.mutation<
      ApiResponse<AdminUser>,
      { id: string; data: UpdateUserRequest }
    >({
      query: ({ id, data }) => ({
        url: `/admin/users/${id}`,
        method: "PUT",
        body: data,
      }),
      // Removed transformResponse to prevent response body conflicts
      invalidatesTags: ["User"],
    }),

    // Delete user
    deleteUser: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({
        url: `/admin/users/${id}`,
        method: "DELETE",
      }),
      // Removed transformResponse to prevent response body conflicts
      invalidatesTags: ["User"],
    }),

    // Activate user
    activateUser: builder.mutation<ApiResponse<AdminUser>, string>({
      query: (id) => ({
        url: `/admin/users/${id}/activate`,
        method: "PUT",
      }),
      // Removed transformResponse to prevent response body conflicts
      invalidatesTags: ["User"],
    }),

    // Deactivate user
    deactivateUser: builder.mutation<ApiResponse<AdminUser>, string>({
      query: (id) => ({
        url: `/admin/users/${id}/deactivate`,
        method: "PUT",
      }),
      // Removed transformResponse to prevent response body conflicts
      invalidatesTags: ["User"],
    }),

    // Bulk user actions
    bulkUserActions: builder.mutation<
      ApiResponse<{ affectedCount: number }>,
      BulkActionRequest
    >({
      query: (data) => ({
        url: "/admin/users/bulk",
        method: "POST",
        body: data,
      }),
      // Removed transformResponse to prevent response body conflicts
      invalidatesTags: ["User"],
    }),

    // Get user statistics
    getUserStats: builder.query<ApiResponse<UserStatsResponse>, void>({
      query: () => "/admin/stats/users",
      // Removed transformResponse to prevent response body conflicts
      providesTags: ["Analytics"],
    }),

    // Get system statistics
    getSystemStats: builder.query<ApiResponse<SystemStatsResponse>, void>({
      query: () => "/admin/stats/system",
      // Removed transformResponse to prevent response body conflicts
      providesTags: ["Analytics"],
    }),

    // Get analytics data
    getAnalytics: builder.query<
      ApiResponse<AnalyticsResponse>,
      {
        startDate?: string;
        endDate?: string;
        ward?: string;
      }
    >({
      query: ({ startDate, endDate, ward }) => {
        const params = new URLSearchParams();

        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);
        if (ward) params.append("ward", ward);

        return `/admin/analytics?${params.toString()}`;
      },
      // Removed transformResponse to prevent response body conflicts
      providesTags: ["Analytics"],
    }),

    // Manage user roles
    manageRoles: builder.mutation<ApiResponse<AdminUser>, ManageRolesRequest>({
      query: (data) => ({
        url: "/admin/roles",
        method: "PUT",
        body: data,
      }),
      // Removed transformResponse to prevent response body conflicts
      invalidatesTags: ["User"],
    }),

    // Get dashboard analytics
    getDashboardAnalytics: builder.query<
      ApiResponse<DashboardAnalyticsResponse>,
      void
    >({
      query: () => "/admin/dashboard/analytics",
      // Removed transformResponse to prevent response body conflicts
      providesTags: ["Analytics"],
    }),

    // Get recent activity
    getRecentActivity: builder.query<
      ApiResponse<RecentActivity[]>,
      { limit?: number }
    >({
      query: ({ limit = 5 }) => `/admin/dashboard/activity?limit=${limit}`,
      // Removed transformResponse to prevent response body conflicts
      providesTags: ["Analytics"],
    }),

    // Get dashboard statistics
    getDashboardStats: builder.query<ApiResponse<DashboardStatsResponse>, void>(
      {
        query: () => "/admin/dashboard/stats",
        // Removed transformResponse to prevent response body conflicts
        providesTags: ["Analytics"],
      },
    ),

    // Get user activity
    getUserActivity: builder.query<
      ApiResponse<UserActivityResponse>,
      { period?: string }
    >({
      query: ({ period = "24h" }) => `/admin/user-activity?period=${period}`,
      providesTags: ["Analytics"],
    }),

    // Get system health
    getSystemHealth: builder.query<ApiResponse<SystemHealthResponse>, void>({
      query: () => "/admin/system-health",
      providesTags: ["Analytics"],
    }),

    // Get wards with sub-zones for filtering
    getWardsForFiltering: builder.query<
      ApiResponse<{
        wards: Array<{
          id: string;
          name: string;
          description?: string;
          isActive: boolean;
          subZones?: Array<{
            id: string;
            name: string;
            wardId: string;
            description?: string;
            isActive: boolean;
          }>;
        }>;
      }>,
      void
    >({
      query: () => "/users/wards?include=subzones",
      providesTags: ["Ward"],
    }),
  }),
});

// Export hooks
export const {
  useGetAllUsersQuery,
  useLazyGetAllUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useActivateUserMutation,
  useDeactivateUserMutation,
  useBulkUserActionsMutation,
  useGetUserStatsQuery,
  useGetSystemStatsQuery,
  useGetAnalyticsQuery,
  useManageRolesMutation,
  useGetDashboardAnalyticsQuery,
  useGetRecentActivityQuery,
  useGetDashboardStatsQuery,
  useGetUserActivityQuery,
  useGetSystemHealthQuery,
  useGetWardsForFilteringQuery,
} = adminApi;

// Re-export for convenience
export const useAdminApi = {
  useGetAllUsersQuery,
  useLazyGetAllUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useActivateUserMutation,
  useDeactivateUserMutation,
  useBulkUserActionsMutation,
  useGetUserStatsQuery,
  useGetSystemStatsQuery,
  useGetAnalyticsQuery,
  useManageRolesMutation,
  useGetDashboardAnalyticsQuery,
  useGetRecentActivityQuery,
  useGetDashboardStatsQuery,
  useGetUserActivityQuery,
  useGetSystemHealthQuery,
};
