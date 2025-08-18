import { baseApi, ApiResponse } from "./baseApi";
import type { User } from "../slices/authSlice";

// Guest API types
export interface GuestComplaintRequest {
  fullName: string;
  email: string;
  phoneNumber: string;
  type: string;
  description: string;
  priority?: string;
  wardId: string;
  area: string;
  landmark?: string;
  address?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface GuestComplaintResponse {
  complaintId: string;
  trackingNumber: string;
  email: string;
  expiresAt: string;
}

export interface GuestOtpVerifyRequest {
  email: string;
  otpCode: string;
  complaintId: string;
  createAccount: boolean;
}

export interface GuestOtpVerifyResponse {
  token: string;
  user: User;
  complaint: any;
  isNewUser: boolean;
}

export interface GuestOtpResendRequest {
  email: string;
  complaintId: string;
}

export interface TrackComplaintRequest {
  complaintId: string;
  email?: string;
  phoneNumber?: string;
}

export interface TrackComplaintResponse {
  complaint: any;
  history: any[];
}

export interface PublicStatsResponse {
  totalComplaints: number;
  resolvedComplaints: number;
  pendingComplaints: number;
  averageResolutionTime: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
}

// Guest API slice
export const guestApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Submit guest complaint
    submitGuestComplaint: builder.mutation<
      ApiResponse<GuestComplaintResponse>,
      GuestComplaintRequest | FormData
    >({
      query: (complaintData) => ({
        url: "/guest/complaint",
        method: "POST",
        body: complaintData,
      }),
      // Removed transformResponse to prevent response body conflicts
    }),

    // Verify guest OTP and create account
    verifyGuestOtp: builder.mutation<
      ApiResponse<GuestOtpVerifyResponse>,
      GuestOtpVerifyRequest
    >({
      query: (data) => ({
        url: "/guest/verify-otp",
        method: "POST",
        body: data,
      }),
      // Removed transformResponse to prevent response body conflicts
      invalidatesTags: ["Auth"],
    }),

    // Resend guest OTP
    resendGuestOtp: builder.mutation<
      ApiResponse<{ message: string; expiresAt: string }>,
      GuestOtpResendRequest
    >({
      query: (data) => ({
        url: "/guest/resend-otp",
        method: "POST",
        body: data,
      }),
      // Removed transformResponse to prevent response body conflicts
    }),

    // Track complaint (public endpoint)
    trackComplaint: builder.query<
      ApiResponse<TrackComplaintResponse>,
      TrackComplaintRequest
    >({
      query: ({ complaintId, email, phoneNumber }) => {
        const params = new URLSearchParams();
        if (email) params.append("email", email);
        if (phoneNumber) params.append("phoneNumber", phoneNumber);

        return {
          url: `/guest/track/${complaintId}?${params.toString()}`,
          method: "GET",
        };
      },
      transformResponse: transformResponse<TrackComplaintResponse>,
      providesTags: (result, error, { complaintId }) => [
        { type: "Complaint", id: complaintId },
      ],
    }),

    // Get public statistics
    getPublicStats: builder.query<ApiResponse<PublicStatsResponse>, void>({
      query: () => "/guest/stats",
      transformResponse: transformResponse<PublicStatsResponse>,
      providesTags: ["Analytics"],
    }),

    // Get complaint types (public endpoint)
    getPublicComplaintTypes: builder.query<
      ApiResponse<Array<{ id: string; name: string; description?: string }>>,
      void
    >({
      query: () => "/guest/complaint-types",
      // Removed transformResponse to prevent response body conflicts
      providesTags: ["ComplaintType"],
    }),

    // Get wards (public endpoint)
    getWards: builder.query<
      ApiResponse<Array<{ id: string; name: string; description?: string }>>,
      void
    >({
      query: () => "/guest/wards",
      // Removed transformResponse to prevent response body conflicts
      providesTags: ["Ward"],
    }),
  }),
});

// Export hooks
export const {
  useSubmitGuestComplaintMutation,
  useVerifyGuestOtpMutation,
  useResendGuestOtpMutation,
  useTrackComplaintQuery,
  useLazyTrackComplaintQuery,
  useGetPublicStatsQuery,
  useGetPublicComplaintTypesQuery,
  useGetWardsQuery,
} = guestApi;

// Re-export for backward compatibility and convenience
export const useGuestApi = {
  useSubmitGuestComplaintMutation,
  useVerifyGuestOtpMutation,
  useResendGuestOtpMutation,
  useTrackComplaintQuery,
  useLazyTrackComplaintQuery,
  useGetPublicStatsQuery,
  useGetPublicComplaintTypesQuery,
  useGetWardsQuery,
};
