import {
  baseApi,
  ApiResponse,
  transformResponse,
  optimisticUpdate,
} from "./baseApi";

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
}

export interface CreateComplaintRequest {
  type: string;
  description: string;
  priority?: "low" | "medium" | "high" | "critical";
  ward: string;
  area: string;
  location: string;
  address: string;
  mobile: string;
  email?: string;
  attachments?: File[];
}

export interface UpdateComplaintRequest {
  id: string;
  status?: Complaint["status"];
  assignedTo?: string;
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
  assignedTo?: string;
  submittedBy?: string;
  search?: string;
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
        transformResponse: transformResponse<Complaint[]>,
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
      transformResponse: transformResponse<Complaint>,
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
      transformResponse: transformResponse<Complaint>,
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
      transformResponse: transformResponse<Complaint>,
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
      transformResponse: transformResponse<Complaint>,
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
      transformResponse: transformResponse<Complaint>,
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
      transformResponse: transformResponse<Complaint>,
      invalidatesTags: (result, error, { id }) => [
        { type: "Complaint", id },
        { type: "Complaint", id: "LIST" },
      ],
    }),

    // Upload complaint attachments
    uploadComplaintAttachment: builder.mutation<
      ApiResponse<{ fileName: string; url: string; id: string; originalName: string; size: number }>,
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
      transformResponse: transformResponse,
      invalidatesTags: (result, error, { complaintId }) => [{ type: "Complaint", id: complaintId }],
    }),

    // Get complaint types
    getComplaintTypes: builder.query<
      ApiResponse<
        { id: string; name: string; description?: string; slaHours: number }[]
      >,
      void
    >({
      query: () => "/complaint-types",
      transformResponse: transformResponse,
      providesTags: ["ComplaintType"],
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
  }),
});

// Export hooks
export const {
  useGetComplaintsQuery,
  useGetComplaintQuery,
  useCreateComplaintMutation,
  useUpdateComplaintMutation,
  useAssignComplaintMutation,
  useUpdateComplaintStatusMutation,
  useAddComplaintFeedbackMutation,
  useUploadComplaintAttachmentMutation,
  useGetComplaintTypesQuery,
  useGetComplaintStatisticsQuery,
} = complaintsApi;
