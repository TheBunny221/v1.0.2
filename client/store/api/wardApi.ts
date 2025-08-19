import { baseApi, ApiResponse } from "./baseApi";

// Types for ward operations
export interface TeamMember {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  department?: string;
  activeAssignments: number;
  displayName: string;
}

export interface WardStats {
  ward: {
    id: string;
    name: string;
    description?: string;
    subZones: Array<{
      id: string;
      name: string;
    }>;
  };
  summary: {
    totalComplaints: number;
    resolvedComplaints: number;
    pendingComplaints: number;
    resolutionRate: number;
  };
  complaintsByStatus: Record<string, number>;
  complaintsByArea: Array<{
    area: string;
    count: number;
  }>;
}

// Ward API slice
export const wardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get ward team members
    getWardTeamMembers: builder.query<
      ApiResponse<{ teamMembers: TeamMember[]; total: number }>,
      string
    >({
      query: (wardId) => `/wards/${wardId}/team`,
      providesTags: (result, error, wardId) => [
        { type: "Ward", id: `${wardId}-team` },
      ],
    }),

    // Get ward statistics
    getWardStats: builder.query<ApiResponse<WardStats>, string>({
      query: (wardId) => `/wards/${wardId}/stats`,
      providesTags: (result, error, wardId) => [
        { type: "Ward", id: `${wardId}-stats` },
        { type: "Analytics", id: wardId },
      ],
    }),
  }),
});

// Export hooks
export const { useGetWardTeamMembersQuery, useGetWardStatsQuery } = wardApi;
