import { baseApi } from "./baseApi";

// Types
export interface ServiceRequest {
  id: string;
  title: string;
  serviceType: string;
  description: string;
  status: "SUBMITTED" | "VERIFIED" | "PROCESSING" | "APPROVED" | "REJECTED" | "COMPLETED";
  priority: "NORMAL" | "URGENT" | "EMERGENCY";
  wardId: string;
  area: string;
  address: string;
  landmark?: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  submittedById?: string;
  assignedToId?: string;
  submittedOn: string;
  preferredDateTime?: string;
  assignedOn?: string;
  expectedCompletion?: string;
  completedOn?: string;
  remarks?: string;
  citizenFeedback?: string;
  rating?: number;
  ward?: {
    id: string;
    name: string;
    description?: string;
  };
  submittedBy?: {
    id: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
  };
  assignedTo?: {
    id: string;
    fullName: string;
    role: string;
  };
  statusLogs?: ServiceRequestStatusLog[];
  createdAt: string;
  updatedAt: string;
}

export interface ServiceRequestStatusLog {
  id: string;
  serviceRequestId: string;
  userId: string;
  fromStatus?: string;
  toStatus: string;
  comment?: string;
  timestamp: string;
  user?: {
    fullName: string;
    role: string;
  };
}

export interface ServiceType {
  id: string;
  name: string;
  description: string;
  category: string;
  processingTime: string;
  requiredDocuments?: string[];
  fees?: number;
  isActive: boolean;
}

export interface ServiceRequestCreateData {
  title?: string;
  serviceType: string;
  description: string;
  priority: "NORMAL" | "URGENT" | "EMERGENCY";
  wardId: string;
  area: string;
  address: string;
  landmark?: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  preferredDateTime?: string;
  remarks?: string;
}

export interface ServiceRequestUpdateData {
  status?: ServiceRequest["status"];
  assignedToId?: string;
  expectedCompletion?: string;
  remarks?: string;
  priority?: ServiceRequest["priority"];
}

export interface ServiceRequestFilters {
  status?: string;
  serviceType?: string;
  priority?: string;
  submittedById?: string;
  assignedToId?: string;
  wardId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
}

export interface ServiceRequestsResponse {
  success: boolean;
  data: ServiceRequest[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ServiceRequestResponse {
  success: boolean;
  data: ServiceRequest;
  message: string;
}

export interface ServiceTypesResponse {
  success: boolean;
  data: ServiceType[];
  message: string;
}

export interface ServiceRequestStats {
  total: number;
  byStatus: Record<string, number>;
  byServiceType: Record<string, number>;
  byPriority: Record<string, number>;
  avgProcessingTime?: number;
  completionRate: number;
  pendingRequests: number;
  processingRequests: number;
  completedRequests: number;
}

export interface ServiceRequestStatsResponse {
  success: boolean;
  data: ServiceRequestStats;
  message: string;
}

// API Slice
export const serviceRequestsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all service requests with filters
    getServiceRequests: builder.query<ServiceRequestsResponse, ServiceRequestFilters>({
      query: (filters = {}) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== "") {
            params.append(key, value.toString());
          }
        });
        return `service-requests?${params.toString()}`;
      },
      providesTags: ["ServiceRequest"],
    }),

    // Get service request by ID
    getServiceRequest: builder.query<ServiceRequestResponse, string>({
      query: (id) => `service-requests/${id}`,
      providesTags: (result, error, id) => [{ type: "ServiceRequest", id }],
    }),

    // Create new service request
    createServiceRequest: builder.mutation<ServiceRequestResponse, ServiceRequestCreateData>({
      query: (data) => ({
        url: "service-requests",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["ServiceRequest"],
    }),

    // Update service request
    updateServiceRequest: builder.mutation<ServiceRequestResponse, { id: string; data: ServiceRequestUpdateData }>({
      query: ({ id, data }) => ({
        url: `service-requests/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "ServiceRequest", id },
        "ServiceRequest",
      ],
    }),

    // Delete service request
    deleteServiceRequest: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url: `service-requests/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "ServiceRequest", id },
        "ServiceRequest",
      ],
    }),

    // Get service types
    getServiceTypes: builder.query<ServiceTypesResponse, void>({
      query: () => "service-requests/types",
      providesTags: ["ServiceType"],
    }),

    // Get service request statistics
    getServiceRequestStats: builder.query<ServiceRequestStatsResponse, { userId?: string; wardId?: string }>({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value) searchParams.append(key, value);
        });
        return `service-requests/stats?${searchParams.toString()}`;
      },
      providesTags: ["ServiceRequest"],
    }),

    // Assign service request to user
    assignServiceRequest: builder.mutation<ServiceRequestResponse, { id: string; assignedToId: string; comment?: string }>({
      query: ({ id, assignedToId, comment }) => ({
        url: `service-requests/${id}/assign`,
        method: "POST",
        body: { assignedToId, comment },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "ServiceRequest", id },
        "ServiceRequest",
      ],
    }),

    // Update service request status
    updateServiceRequestStatus: builder.mutation<ServiceRequestResponse, { id: string; status: ServiceRequest["status"]; comment?: string }>({
      query: ({ id, status, comment }) => ({
        url: `service-requests/${id}/status`,
        method: "POST",
        body: { status, comment },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "ServiceRequest", id },
        "ServiceRequest",
      ],
    }),

    // Submit feedback for completed service request
    submitServiceRequestFeedback: builder.mutation<ServiceRequestResponse, { id: string; rating: number; feedback?: string }>({
      query: ({ id, rating, feedback }) => ({
        url: `service-requests/${id}/feedback`,
        method: "POST",
        body: { rating, feedback },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "ServiceRequest", id },
        "ServiceRequest",
      ],
    }),

    // Get service request status logs
    getServiceRequestStatusLogs: builder.query<{ success: boolean; data: ServiceRequestStatusLog[] }, string>({
      query: (id) => `service-requests/${id}/status-logs`,
      providesTags: (result, error, id) => [{ type: "ServiceRequest", id }],
    }),

    // Guest service request submission
    submitGuestServiceRequest: builder.mutation<{ success: boolean; data: { serviceRequestId: string; trackingNumber: string; email: string; expiresAt: string } }, ServiceRequestCreateData>({
      query: (data) => ({
        url: "guest/service-request",
        method: "POST",
        body: data,
      }),
    }),

    // Track guest service request
    trackGuestServiceRequest: builder.query<{ success: boolean; data: { serviceRequest: ServiceRequest } }, { requestId: string; email?: string; phoneNumber?: string }>({
      query: ({ requestId, email, phoneNumber }) => {
        const params = new URLSearchParams();
        if (email) params.append("email", email);
        if (phoneNumber) params.append("phoneNumber", phoneNumber);
        return `guest/track-service/${requestId}?${params.toString()}`;
      },
    }),
  }),
});

export const {
  useGetServiceRequestsQuery,
  useGetServiceRequestQuery,
  useCreateServiceRequestMutation,
  useUpdateServiceRequestMutation,
  useDeleteServiceRequestMutation,
  useGetServiceTypesQuery,
  useGetServiceRequestStatsQuery,
  useAssignServiceRequestMutation,
  useUpdateServiceRequestStatusMutation,
  useSubmitServiceRequestFeedbackMutation,
  useGetServiceRequestStatusLogsQuery,
  useSubmitGuestServiceRequestMutation,
  useTrackGuestServiceRequestQuery,
  useLazyTrackGuestServiceRequestQuery,
} = serviceRequestsApi;
