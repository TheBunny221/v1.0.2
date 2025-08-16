import { baseApi, ApiResponse, transformResponse } from "./baseApi";

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
}

export interface DashboardStatsResponse {
  totalComplaints: number;
  totalUsers: number;
  activeComplaints: number;
  resolvedComplaints: number;
  overdue: number;
  wardOfficers: number;
  maintenanceTeam: number;
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
      transformResponse: transformResponse<UsersResponse>,
      providesTags: ["User"],
    }),

    // Create new user
    createUser: builder.mutation<ApiResponse<AdminUser>, CreateUserRequest>({
      query: (userData) => ({
        url: "/admin/users",
        method: "POST",
        body: userData,
      }),
      transformResponse: transformResponse<AdminUser>,
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
      transformResponse: transformResponse<AdminUser>,
      invalidatesTags: ["User"],
    }),

    // Delete user
    deleteUser: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({
        url: `/admin/users/${id}`,
        method: "DELETE",
      }),
      transformResponse: transformResponse<null>,
      invalidatesTags: ["User"],
    }),

    // Activate user
    activateUser: builder.mutation<ApiResponse<AdminUser>, string>({
      query: (id) => ({
        url: `/admin/users/${id}/activate`,
        method: "PUT",
      }),
      transformResponse: transformResponse<AdminUser>,
      invalidatesTags: ["User"],
    }),

    // Deactivate user
    deactivateUser: builder.mutation<ApiResponse<AdminUser>, string>({
      query: (id) => ({
        url: `/admin/users/${id}/deactivate`,
        method: "PUT",
      }),
      transformResponse: transformResponse<AdminUser>,
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
      transformResponse: transformResponse<{ affectedCount: number }>,
      invalidatesTags: ["User"],
    }),

    // Get user statistics
    getUserStats: builder.query<ApiResponse<UserStatsResponse>, void>({
      query: () => "/admin/stats/users",
      transformResponse: transformResponse<UserStatsResponse>,
      providesTags: ["Analytics"],
    }),

    // Get system statistics
    getSystemStats: builder.query<ApiResponse<SystemStatsResponse>, void>({
      query: () => "/admin/stats/system",
      transformResponse: transformResponse<SystemStatsResponse>,
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
      transformResponse: transformResponse<AnalyticsResponse>,
      providesTags: ["Analytics"],
    }),

    // Manage user roles
    manageRoles: builder.mutation<ApiResponse<AdminUser>, ManageRolesRequest>({
      query: (data) => ({
        url: "/admin/roles",
        method: "PUT",
        body: data,
      }),
      transformResponse: transformResponse<AdminUser>,
      invalidatesTags: ["User"],
    }),

    // Get dashboard analytics
    getDashboardAnalytics: builder.query<ApiResponse<DashboardAnalyticsResponse>, void>({
      query: () => "/admin/dashboard/analytics",
      transformResponse: transformResponse<DashboardAnalyticsResponse>,
      providesTags: ["Analytics"],
    }),

    // Get recent activity
    getRecentActivity: builder.query<ApiResponse<RecentActivity[]>, { limit?: number }>({
      query: ({ limit = 5 }) => `/admin/dashboard/activity?limit=${limit}`,
      transformResponse: transformResponse<RecentActivity[]>,
      providesTags: ["Analytics"],
    }),

    // Get dashboard statistics
    getDashboardStats: builder.query<ApiResponse<DashboardStatsResponse>, void>({
      query: () => "/admin/dashboard/stats",
      transformResponse: transformResponse<DashboardStatsResponse>,
      providesTags: ["Analytics"],
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
};
