import { baseApi, ApiResponse } from "./baseApi";

// Types for maintenance operations
export interface MaintenanceTask {
  id: string;
  title: string;
  description: string;
  location: string;
  address: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "ASSIGNED" | "IN_PROGRESS" | "RESOLVED" | "REOPENED";
  estimatedTime: string;
  dueDate: string | null;
  isOverdue: boolean;
  assignedAt: string;
  submittedOn: string;
  resolvedAt: string | null;
  photo: string | null;
  attachments: Array<{
    id: string;
    fileName: string;
    originalName: string;
    url: string;
    mimeType: string;
    size: number;
    uploadedAt: string;
  }>;
  ward: {
    id: string;
    name: string;
  };
  subZone?: {
    id: string;
    name: string;
  };
  submittedBy: {
    id: string;
    fullName: string;
    phoneNumber: string;
    email: string;
  };
  statusLogs: Array<{
    id: string;
    fromStatus: string | null;
    toStatus: string;
    comment: string | null;
    timestamp: string;
    user: {
      fullName: string;
      role: string;
    };
  }>;
  complaintId: string;
  type: string;
  coordinates: string | null;
  contactPhone: string;
  remarks: string | null;
}

export interface MaintenanceTaskDetails extends MaintenanceTask {
  contactEmail: string | null;
  contactName: string | null;
  assignedTo: {
    id: string;
    fullName: string;
    department: string;
  };
  messages: Array<{
    id: string;
    content: string;
    sentAt: string;
    isInternal: boolean;
    sentBy: {
      fullName: string;
      role: string;
    };
  }>;
}

export interface MaintenanceStats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  reopened: number;
  overdue: number;
  critical: number;
}

export interface MaintenanceTasksParams {
  status?: "all" | "pending" | "inProgress" | "resolved" | "reopened" | "overdue";
  priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  page?: number;
  limit?: number;
}

export interface UpdateTaskStatusRequest {
  id: string;
  status: "IN_PROGRESS" | "RESOLVED" | "REOPENED";
  comment?: string;
  resolvePhoto?: string;
}

export interface MaintenanceTasksResponse {
  tasks: MaintenanceTask[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Maintenance API slice
export const maintenanceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get maintenance tasks with filtering and pagination
    getMaintenanceTasks: builder.query<
      ApiResponse<MaintenanceTasksResponse>,
      MaintenanceTasksParams
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            searchParams.append(key, value.toString());
          }
        });
        return `/maintenance/tasks?${searchParams.toString()}`;
      },
      providesTags: (result) =>
        result?.data?.tasks
          ? [
              ...result.data.tasks.map(({ id }) => ({
                type: "MaintenanceTask" as const,
                id,
              })),
              { type: "MaintenanceTask", id: "LIST" },
            ]
          : [{ type: "MaintenanceTask", id: "LIST" }],
    }),

    // Get maintenance task statistics
    getMaintenanceStats: builder.query<ApiResponse<MaintenanceStats>, void>({
      query: () => "/maintenance/stats",
      providesTags: [{ type: "MaintenanceStats", id: "STATS" }],
    }),

    // Get single maintenance task details
    getMaintenanceTask: builder.query<
      ApiResponse<MaintenanceTaskDetails>,
      string
    >({
      query: (id) => `/maintenance/tasks/${id}`,
      providesTags: (result, error, id) => [
        { type: "MaintenanceTask", id },
      ],
    }),

    // Update task status
    updateTaskStatus: builder.mutation<
      ApiResponse<{
        id: string;
        status: string;
        resolvedOn: string | null;
        updatedAt: string;
      }>,
      UpdateTaskStatusRequest
    >({
      query: ({ id, ...body }) => ({
        url: `/maintenance/tasks/${id}/status`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "MaintenanceTask", id },
        { type: "MaintenanceTask", id: "LIST" },
        { type: "MaintenanceStats", id: "STATS" },
      ],
    }),
  }),
});

// Export hooks for use in components
export const {
  useGetMaintenanceTasksQuery,
  useGetMaintenanceStatsQuery,
  useGetMaintenanceTaskQuery,
  useUpdateTaskStatusMutation,
} = maintenanceApi;

// Export API slice default
export default maintenanceApi;
