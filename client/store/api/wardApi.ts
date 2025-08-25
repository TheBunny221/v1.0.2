import { baseApi, ApiResponse } from "./baseApi";

interface Ward {
  id: string;
  name: string;
  description?: string;
  boundaries?: string;
  centerLat?: number;
  centerLng?: number;
  boundingBox?: string;
  subZones?: SubZone[];
}

interface SubZone {
  id: string;
  name: string;
  wardId: string;
  description?: string;
  boundaries?: string;
  centerLat?: number;
  centerLng?: number;
  boundingBox?: string;
}

interface LocationDetection {
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

interface UpdateBoundariesRequest {
  wardId: string;
  boundaries?: string;
  centerLat?: number;
  centerLng?: number;
  boundingBox?: string;
  subZones?: Array<{
    id: string;
    boundaries?: string;
    centerLat?: number;
    centerLng?: number;
    boundingBox?: string;
  }>;
}

interface DetectAreaRequest {
  latitude: number;
  longitude: number;
}

interface TeamMember {
  id: string;
  fullName: string;
  email: string;
  role: string;
  department?: string;
  isActive: boolean;
}

interface WardTeamMembersResponse {
  success: boolean;
  message: string;
  data: {
    teamMembers: TeamMember[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export const wardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getWardsWithBoundaries: builder.query<
      { success: boolean; message: string; data: Ward[] },
      void
    >({
      query: () => "/boundaries",
      providesTags: ["Ward", "Boundaries"],
    }),

    updateWardBoundaries: builder.mutation<
      { success: boolean; message: string; data: Ward },
      UpdateBoundariesRequest
    >({
      query: ({ wardId, ...body }) => ({
        url: `/${wardId}/boundaries`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Ward", "Boundaries"],
    }),

    detectLocationArea: builder.mutation<
      { success: boolean; message: string; data: LocationDetection },
      DetectAreaRequest
    >({
      query: (body) => ({
        url: "/detect-area",
        method: "POST",
        body,
      }),
    }),

    getWardTeamMembers: builder.query<
      WardTeamMembersResponse,
      string
    >({
      query: (wardId) => `../complaints/ward-users?wardId=${wardId}&role=MAINTENANCE_TEAM&limit=100`,
      transformResponse: (response: any) => {
        // Transform the response to match expected format
        return {
          success: response.success,
          message: response.message,
          data: {
            teamMembers: response.data?.users || [],
            pagination: response.data?.pagination || {
              page: 1,
              limit: 100,
              total: 0,
              pages: 0
            }
          }
        };
      },
      providesTags: ["Ward"],
    }),
  }),
});

export const {
  useGetWardsWithBoundariesQuery,
  useUpdateWardBoundariesMutation,
  useDetectLocationAreaMutation,
  useGetWardTeamMembersQuery,
} = wardApi;
