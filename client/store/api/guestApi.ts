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
  captchaId: string;
  captchaText: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface GuestComplaintResponse {
  sessionId: string;
  email: string;
  expiresAt: string;
}

export interface GuestOtpVerifyRequest {
  // Deprecated interface - verification now accepts full complaint data via FormData
  [key: string]: any;
}

export interface GuestOtpVerifyResponse {
  token: string;
  user: User;
  complaint: any;
  isNewUser: boolean;
}

export interface GuestOtpResendRequest {
  email: string;
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

export interface CaptchaResponse {
  captchaId: string;
  captchaSvg: string;
}

export interface CaptchaVerifyRequest {
  captchaId: string;
  captchaText: string;
}

// Guest API slice
export const guestApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // OTP Verification for Complaint Tracking
    requestComplaintOtp: builder.mutation<
      ApiResponse<{ complaintId: string; email: string }>,
      { complaintId: string }
    >({
      query: (data) => ({
        url: "/guest-otp/request-complaint-otp",
        method: "POST",
        body: data,
      }),
    }),

    verifyComplaintOtp: builder.mutation<
      ApiResponse<{
        complaint: any;
        user: any;
        token: string;
        isNewUser: boolean;
        redirectTo?: string;
      }>,
      { complaintId: string; otpCode: string }
    >({
      query: (data) => ({
        url: "/guest-otp/verify-complaint-otp",
        method: "POST",
        body: data,
      }),
    }),
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
      FormData | Record<string, any>
    >({
      query: (data) => ({
        url: "/guest/verify-otp",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Auth"],
    }),

    // Resend guest OTP
    resendGuestOtp: builder.mutation<
      ApiResponse<{ message: string; expiresAt: string; sessionId: string }>,
      GuestOtpResendRequest
    >({
      query: (data) => ({
        url: "/guest/resend-otp",
        method: "POST",
        body: data,
      }),
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
      // Removed transformResponse to prevent response body conflicts
      providesTags: (result, error, { complaintId }) => [
        { type: "Complaint", id: complaintId },
      ],
    }),

    // Get public statistics
    getPublicStats: builder.query<ApiResponse<PublicStatsResponse>, void>({
      query: () => "/guest/stats",
      // Removed transformResponse to prevent response body conflicts
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
      ApiResponse<
        Array<{
          id: string;
          name: string;
          description?: string;
          isActive?: boolean;
          subZones?: Array<{
            id: string;
            name: string;
            description?: string;
            isActive?: boolean;
          }>;
        }>
      >,
      void
    >({
      query: () => "/guest/wards",
      // Removed transformResponse to prevent response body conflicts
      providesTags: ["Ward"],
    }),

    // Generate CAPTCHA
    generateCaptcha: builder.query<ApiResponse<CaptchaResponse>, void>({
      query: () => "/captcha/generate",
      // Don't cache CAPTCHA as each should be unique
      keepUnusedDataFor: 0,
    }),

    // Verify CAPTCHA (optional standalone endpoint)
    verifyCaptcha: builder.mutation<
      ApiResponse<{ message: string }>,
      CaptchaVerifyRequest
    >({
      query: (data) => ({
        url: "/captcha/verify",
        method: "POST",
        body: data,
      }),
    }),
  }),
});

// Export hooks
export const {
  useRequestComplaintOtpMutation,
  useVerifyComplaintOtpMutation,
  useSubmitGuestComplaintMutation,
  useVerifyGuestOtpMutation,
  useResendGuestOtpMutation,
  useTrackComplaintQuery,
  useLazyTrackComplaintQuery,
  useGetPublicStatsQuery,
  useGetPublicComplaintTypesQuery,
  useGetWardsQuery,
  useGenerateCaptchaQuery,
  useLazyGenerateCaptchaQuery,
  useVerifyCaptchaMutation,
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
