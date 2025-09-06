import { baseApi } from "./baseApi";

export interface ComplaintType {
  id: string;
  name: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  slaHours: number;
  isActive: boolean;
  updatedAt: string;
}

export interface CreateComplaintTypeRequest {
  name: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  slaHours: number;
}

export interface UpdateComplaintTypeRequest extends CreateComplaintTypeRequest {
  isActive?: boolean;
}

export const complaintTypesApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // Get all complaint types (public)
    getComplaintTypes: builder.query<
      { success: boolean; data: ComplaintType[] },
      void
    >({
      query: () => "/complaint-types",
      providesTags: ["ComplaintType"],
    }),

    // Get complaint type by ID
    getComplaintTypeById: builder.query<
      { success: boolean; data: ComplaintType },
      string
    >({
      query: (id) => `/complaint-types/${id}`,
      providesTags: (_result, _error, id) => [{ type: "ComplaintType", id }],
    }),

    // Create complaint type (admin only)
    createComplaintType: builder.mutation<
      { success: boolean; data: ComplaintType },
      CreateComplaintTypeRequest
    >({
      query: (body) => ({
        url: "/complaint-types",
        method: "POST",
        body,
      }),
      invalidatesTags: ["ComplaintType"],
    }),

    // Update complaint type (admin only)
    updateComplaintType: builder.mutation<
      { success: boolean; data: ComplaintType },
      { id: string; data: UpdateComplaintTypeRequest }
    >({
      query: ({ id, data }) => ({
        url: `/complaint-types/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["ComplaintType"],
    }),

    // Delete complaint type (admin only)
    deleteComplaintType: builder.mutation<
      { success: boolean; message: string },
      string
    >({
      query: (id) => ({
        url: `/complaint-types/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ComplaintType"],
    }),

    // Get complaint type statistics
    getComplaintTypeStats: builder.query<
      { success: boolean; data: Array<{ type: string; count: number }> },
      void
    >({
      query: () => "/complaint-types/stats",
      providesTags: ["ComplaintType"],
    }),
  }),
});

export const {
  useGetComplaintTypesQuery,
  useGetComplaintTypeByIdQuery,
  useCreateComplaintTypeMutation,
  useUpdateComplaintTypeMutation,
  useDeleteComplaintTypeMutation,
  useGetComplaintTypeStatsQuery,
} = complaintTypesApi;
