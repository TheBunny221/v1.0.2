import { baseApi, ApiResponse, optimisticUpdate } from "./baseApi";

// Types for complaint operations
export interface Complaint {
  id: string;
  complaintId: string;
  type: string;
  description: string;
  status:
    | "registered"
    | "assigned"
    | "in_progress"
    | "resolved"
    | "closed"
    | "reopened";
  priority: "low" | "medium" | "high" | "critical";
  submittedBy: string;
  submittedDate: string;
  lastUpdated: string;
  assignedTo?: string;
  resolvedDate?: string;
  slaDeadline: string;
  ward: string;
  area: string;
  location: string;
  address: string;
  mobile: string;
  email?: string;
  attachments: Array<{
    id: string;
    fileName: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
    uploadedAt: string;
  }>;
  remarks?: string;
  feedback?: string;
  rating?: number;
  escalationLevel: number;
  slaStatus: "ontime" | "warning" | "overdue" | "completed";
  timeElapsed: number;
  statusLogs?: Array<{
    id: string;
    fromStatus?: string;
    toStatus: string;
    comment?: string;
    timestamp: string;
    user?: {
      fullName: string;
      role: string;
    };
  }>;
}

export interface CreateComplaintRequest {
  // New normalized reference; preferred going forward
  complaintTypeId?: string;
  // Legacy field retained for backward compatibility
  type?: string;
  description: string;
  priority?: "low" | "medium" | "high" | "critical";
  ward?: string;
  wardId?: string;
  area?: string;
  location?: string;
  address?: string;
  mobile?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  subZoneId?: string;
  isAnonymous?: boolean;
  email?: string;
  attachments?: File[];
  slaHours?: number;
}

export interface UpdateComplaintRequest {
  id: string;
  status?: Complaint["status"];
  // New field for assigning a ward officer
  wardOfficerId?: string;
  // Legacy field kept for backward compatibility
  assignedToId?: string;
  maintenanceTeamId?: string;
  remarks?: string;
  priority?: Complaint["priority"];
}

export interface ComplaintFilters {
  status?: string[];
  priority?: string[];
  type?: string[];
  ward?: string[];
  dateFrom?: string;
  dateTo?: string;
  assignedTo?: string; // legacy
  submittedBy?: string;
  search?: string;
  // precise filters
  maintenanceTeamId?: string;
  officerId?: string; // wardOfficerId
  assignedToId?: string; // legacy compatibility
  wardId?: string; // explicit when admin filters by ward
}

export interface ComplaintListParams extends ComplaintFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// Complaints API slice
export const complaintsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get complaints list with pagination and filtering
    getComplaints: builder.query<ApiResponse<Complaint[]>, ComplaintListParams>(
      {
        query: (params) => {
          const searchParams = new URLSearchParams();
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              if (Array.isArray(value)) {
                value.forEach((v) => searchParams.append(key, v));
              } else {
                searchParams.append(key, value.toString());
              }
            }
          });
          return `/complaints?${searchParams.toString()}`;
        },
        // Let RTK Query handle response naturally
        providesTags: (result) =>
          result?.data && Array.isArray(result.data)
            ? [
                ...result.data.map(({ id }) => ({
                  type: "Complaint" as const,
                  id,
                })),
                { type: "Complaint", id: "LIST" },
              ]
            : [{ type: "Complaint", id: "LIST" }],
      },
    ),

    // Get single complaint
    getComplaint: builder.query<ApiResponse<Complaint>, string>({
      query: (id) => `/complaints/${id}`,
      // Let RTK Query handle response naturally
      providesTags: (result, error, id) => [{ type: "Complaint", id }],
    }),

    // Create new complaint
    createComplaint: builder.mutation<
      ApiResponse<Complaint>,
      CreateComplaintRequest
    >({
      query: (data) => ({
        url: "/complaints",
        method: "POST",
        body: data,
      }),
      // Let RTK Query handle response naturally
      invalidatesTags: [{ type: "Complaint", id: "LIST" }],
      // Optimistic update for immediate feedback
      onQueryStarted: async (newComplaint, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          // Update complaints list if it's cached
          dispatch(
            complaintsApi.util.updateQueryData("getComplaints", {}, (draft) => {
              if (draft.data) {
                draft.data.unshift(data.data);
              }
            }),
          );
        } catch {
          // Error handled by base query
        }
      },
    }),

    // Update complaint
    updateComplaint: builder.mutation<
      ApiResponse<Complaint>,
      UpdateComplaintRequest
    >({
      query: ({ id, ...data }) => ({
        url: `/complaints/${id}`,
        method: "PUT",
        body: data,
      }),
      // Let RTK Query handle response naturally
      invalidatesTags: (result, error, { id }) => [
        { type: "Complaint", id },
        { type: "Complaint", id: "LIST" },
      ],
      // Optimistic update
      onQueryStarted: async (
        { id, ...patch },
        { dispatch, queryFulfilled },
      ) => {
        // Update single complaint query
        const patchResult1 = dispatch(
          complaintsApi.util.updateQueryData("getComplaint", id, (draft) => {
            if (draft.data) {
              Object.assign(draft.data, patch);
            }
          }),
        );

        // Update complaints list
        const patchResult2 = dispatch(
          complaintsApi.util.updateQueryData("getComplaints", {}, (draft) => {
            if (draft.data) {
              draft.data = optimisticUpdate(draft.data, { id, ...patch });
            }
          }),
        );

        try {
          await queryFulfilled;
        } catch {
          patchResult1.undo();
          patchResult2.undo();
        }
      },
    }),

    // Assign complaint
    assignComplaint: builder.mutation<
      ApiResponse<Complaint>,
      { id: string; assignedTo: string; remarks?: string }
    >({
      query: ({ id, assignedTo, remarks }) => ({
        url: `/complaints/${id}/assign`,
        method: "PUT",
        body: { assignedTo, remarks },
      }),
      // Let RTK Query handle response naturally
      invalidatesTags: (result, error, { id }) => [
        { type: "Complaint", id },
        { type: "Complaint", id: "LIST" },
      ],
    }),

    // Update complaint status
    updateComplaintStatus: builder.mutation<
      ApiResponse<Complaint>,
      { id: string; status: Complaint["status"]; remarks?: string }
    >({
      query: ({ id, status, remarks }) => ({
        url: `/complaints/${id}/status`,
        method: "PUT",
        body: { status, remarks },
      }),
      // Let RTK Query handle response naturally
      invalidatesTags: (result, error, { id }) => [
        { type: "Complaint", id },
        { type: "Complaint", id: "LIST" },
      ],
    }),

    // Add complaint feedback
    addComplaintFeedback: builder.mutation<
      ApiResponse<Complaint>,
      { id: string; feedback: string; rating: number }
    >({
      query: ({ id, feedback, rating }) => ({
        url: `/complaints/${id}/feedback`,
        method: "POST",
        body: { citizenFeedback: feedback, rating },
      }),
      // Let RTK Query handle response naturally
      invalidatesTags: (result, error, { id }) => [
        { type: "Complaint", id },
        { type: "Complaint", id: "LIST" },
      ],
    }),

    // Upload complaint attachments
    uploadComplaintAttachment: builder.mutation<
      ApiResponse<{
        fileName: string;
        url: string;
        id: string;
        originalName: string;
        size: number;
      }>,
      { complaintId: string; file: File }
    >({
      query: ({ complaintId, file }) => {
        const formData = new FormData();
        formData.append("complaintAttachment", file);
        return {
          url: `/uploads/complaint/${complaintId}/attachment`,
          method: "POST",
          body: formData,
          formData: true,
        };
      },
      // Let RTK Query handle response naturally
      invalidatesTags: (result, error, { complaintId }) => [
        { type: "Complaint", id: complaintId },
      ],
    }),

    // Get complaint statistics
    getComplaintStatistics: builder.query<
      ApiResponse<{
        total: number;
        byStatus: Record<string, number>;
        byPriority: Record<string, number>;
        byType: Record<string, number>;
        slaCompliance: number;
        avgResolutionTime: number;
      }>,
      { dateFrom?: string; dateTo?: string; ward?: string }
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value) searchParams.append(key, value);
        });
        return `/complaints/stats?${searchParams.toString()}`;
      },
      // Let RTK Query handle response naturally
      providesTags: ["Analytics"],
    }),

    // Get ward-specific dashboard statistics (Ward Officer only)
    getWardDashboardStatistics: builder.query<
      ApiResponse<{
        stats: {
          summary: {
            totalComplaints: number;
            pendingWork: number;
            activeWork: number;
            completedWork: number;
            needsTeamAssignment: number;
            overdueComplaints: number;
            urgentComplaints: number;
          };
          statusBreakdown: {
            registered: number;
            assigned: number;
            in_progress: number;
            resolved: number;
            closed: number;
            reopened: number;
          };
          priorityBreakdown: {
            low: number;
            medium: number;
            high: number;
            critical: number;
          };
          slaBreakdown: {
            on_time: number;
            warning: number;
            overdue: number;
            completed: number;
          };
          assignmentBreakdown: {
            needsAssignmentToTeam: number;
            unassigned: number;
            assigned: number;
          };
        };
        wardId: string;
      }>,
      void
    >({
      query: () => "/complaints/ward-dashboard-stats",
      providesTags: ["Analytics"],
    }),

    // Get ward users for assignment (role-based access)
    getWardUsers: builder.query<
      ApiResponse<{
        users: Array<{
          id: string;
          fullName: string;
          email: string;
          role: string;
          wardId?: string;
          department?: string;
          isActive: boolean;
          ward?: {
            id: string;
            name: string;
          };
        }>;
        pagination: {
          page: number;
          limit: number;
          total: number;
          pages: number;
        };
      }>,
      {
        page?: number;
        limit?: number;
        role?: string;
        status?: string;
      }
    >({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== "") {
            searchParams.append(key, value.toString());
          }
        });
        return `/complaints/ward-users?${searchParams.toString()}`;
      },
      providesTags: ["User"],
    }),

    // Get complaint materials
    getComplaintMaterials: builder.query<
      ApiResponse<{
        materials: Array<{
          id: string;
          materialName: string;
          quantity: number;
          unit: string;
          usedAt: string;
          notes?: string;
          addedBy: {
            id: string;
            fullName: string;
            role: string;
          };
          createdAt: string;
        }>;
      }>,
      string
    >({
      query: (complaintId) => `/complaints/${complaintId}/materials`,
      providesTags: (result, error, complaintId) => [
        { type: "Material", id: "LIST" },
        { type: "Material", id: complaintId },
      ],
    }),

    // Add material to complaint
    addComplaintMaterial: builder.mutation<
      ApiResponse<{
        material: {
          id: string;
          materialName: string;
          quantity: number;
          unit: string;
          usedAt: string;
          notes?: string;
          addedBy: {
            id: string;
            fullName: string;
            role: string;
          };
          createdAt: string;
        };
      }>,
      {
        complaintId: string;
        materialName: string;
        quantity: number;
        unit: string;
        notes?: string;
        usedAt?: string;
      }
    >({
      query: ({ complaintId, ...body }) => ({
        url: `/complaints/${complaintId}/materials`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { complaintId }) => [
        { type: "Material", id: "LIST" },
        { type: "Material", id: complaintId },
      ],
    }),

    // Get complaint photos
    getComplaintPhotos: builder.query<
      ApiResponse<{
        photos: Array<{
          id: string;
          photoUrl: string;
          fileName: string;
          originalName: string;
          mimeType: string;
          size: number;
          uploadedAt: string;
          description?: string;
          uploadedByTeam: {
            id: string;
            fullName: string;
            role: string;
          };
        }>;
      }>,
      string
    >({
      query: (complaintId) => `/complaints/${complaintId}/photos`,
      providesTags: (result, error, complaintId) => [
        { type: "Photo", id: "LIST" },
        { type: "Photo", id: complaintId },
      ],
    }),

    // Upload complaint photos
    uploadComplaintPhotos: builder.mutation<
      ApiResponse<{
        photos: Array<{
          id: string;
          photoUrl: string;
          fileName: string;
          originalName: string;
          mimeType: string;
          size: number;
          uploadedAt: string;
          description?: string;
          uploadedByTeam: {
            id: string;
            fullName: string;
            role: string;
          };
        }>;
      }>,
      {
        complaintId: string;
        photos: File[];
        description?: string;
      }
    >({
      query: ({ complaintId, photos, description }) => {
        const formData = new FormData();
        photos.forEach((photo) => {
          formData.append("photos", photo);
        });
        if (description) {
          formData.append("description", description);
        }
        return {
          url: `/complaints/${complaintId}/photos`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: (result, error, { complaintId }) => [
        { type: "Photo", id: "LIST" },
        { type: "Photo", id: complaintId },
      ],
    }),
  }),
});

// Export hooks
export const {
  useGetComplaintsQuery,
  useGetComplaintQuery,
  useLazyGetComplaintQuery,
  useCreateComplaintMutation,
  useUpdateComplaintMutation,
  useAssignComplaintMutation,
  useUpdateComplaintStatusMutation,
  useAddComplaintFeedbackMutation,
  useUploadComplaintAttachmentMutation,
  useGetComplaintStatisticsQuery,
  useGetWardDashboardStatisticsQuery,
  useGetWardUsersQuery,
  useGetComplaintMaterialsQuery,
  useAddComplaintMaterialMutation,
  useGetComplaintPhotosQuery,
  useUploadComplaintPhotosMutation,
} = complaintsApi;
