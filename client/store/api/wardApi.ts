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
    getWardsWithBoundaries: builder.query<ApiResponse<Ward[]>, void>({
      query: () => "/wards/boundaries",
      providesTags: ["Ward"],
    }),

    updateWardBoundaries: builder.mutation<
      ApiResponse<Ward>,
      UpdateBoundariesRequest
    >({
      query: ({ wardId, ...body }) => ({
        url: `/wards/${wardId}/boundaries`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Ward"],
    }),

    detectLocationArea: builder.mutation<
      ApiResponse<LocationDetection>,
      DetectAreaRequest
    >({
      query: (body) => ({
        url: "/wards/detect-area",
        method: "POST",
        body,
      }),
    }),

    getWardTeamMembers: builder.query<
      ApiResponse<{ users: TeamMember[]; pagination: any }>,
      string
    >({
      query: (wardId) =>
        `/complaints/ward-users?role=MAINTENANCE_TEAM&limit=100`,
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
