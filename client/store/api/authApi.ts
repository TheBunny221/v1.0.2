import { baseApi, ApiResponse, transformResponse } from './baseApi';
import type { User } from '../slices/authSlice';

// API types
interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  user: User;
  token: string;
}

interface OTPRequest {
  email: string;
}

interface OTPVerifyRequest {
  email: string;
  otpCode: string;
}

interface RegisterRequest {
  fullName: string;
  email: string;
  phoneNumber?: string;
  password: string;
  role?: string;
  wardId?: string;
}

interface SetPasswordRequest {
  token: string;
  password: string;
}

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

interface UpdateProfileRequest {
  fullName?: string;
  phoneNumber?: string;
  language?: string;
  notificationsEnabled?: boolean;
  emailAlerts?: boolean;
}

// Auth API slice
export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Login with password
    loginWithPassword: builder.mutation<ApiResponse<LoginResponse>, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      transformResponse: transformResponse<LoginResponse>,
      invalidatesTags: ['Auth'],
    }),

    // Request OTP for login
    requestOTPLogin: builder.mutation<ApiResponse<{ email: string; expiresAt: string }>, OTPRequest>({
      query: (data) => ({
        url: '/auth/login-otp',
        method: 'POST',
        body: data,
      }),
      transformResponse: transformResponse,
    }),

    // Verify OTP login
    verifyOTPLogin: builder.mutation<ApiResponse<LoginResponse>, OTPVerifyRequest>({
      query: (data) => ({
        url: '/auth/verify-otp',
        method: 'POST',
        body: data,
      }),
      transformResponse: transformResponse<LoginResponse>,
      invalidatesTags: ['Auth'],
    }),

    // Register user
    register: builder.mutation<ApiResponse<LoginResponse | { requiresOtpVerification: boolean; email: string }>, RegisterRequest>({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
      transformResponse: transformResponse,
      invalidatesTags: ['Auth'],
    }),

    // Verify registration OTP
    verifyRegistrationOTP: builder.mutation<ApiResponse<LoginResponse>, OTPVerifyRequest>({
      query: (data) => ({
        url: '/auth/verify-registration-otp',
        method: 'POST',
        body: data,
      }),
      transformResponse: transformResponse<LoginResponse>,
      invalidatesTags: ['Auth'],
    }),

    // Resend registration OTP
    resendRegistrationOTP: builder.mutation<ApiResponse<{ message: string }>, OTPRequest>({
      query: (data) => ({
        url: '/auth/resend-registration-otp',
        method: 'POST',
        body: data,
      }),
      transformResponse: transformResponse,
    }),

    // Send password setup email
    sendPasswordSetupEmail: builder.mutation<ApiResponse<{ message: string }>, OTPRequest>({
      query: (data) => ({
        url: '/auth/send-password-setup',
        method: 'POST',
        body: data,
      }),
      transformResponse: transformResponse,
    }),

    // Set password
    setPassword: builder.mutation<ApiResponse<LoginResponse>, SetPasswordRequest>({
      query: ({ token, password }) => ({
        url: `/auth/set-password/${token}`,
        method: 'POST',
        body: { password },
      }),
      transformResponse: transformResponse<LoginResponse>,
      invalidatesTags: ['Auth'],
    }),

    // Change password
    changePassword: builder.mutation<ApiResponse<{ message: string }>, ChangePasswordRequest>({
      query: (data) => ({
        url: '/auth/change-password',
        method: 'PUT',
        body: data,
      }),
      transformResponse: transformResponse,
      invalidatesTags: ['Auth'],
    }),

    // Get current user
    getCurrentUser: builder.query<ApiResponse<{ user: User }>, void>({
      query: () => '/auth/me',
      transformResponse: transformResponse<{ user: User }>,
      providesTags: ['Auth'],
    }),

    // Update profile
    updateProfile: builder.mutation<ApiResponse<{ user: User }>, UpdateProfileRequest>({
      query: (data) => ({
        url: '/auth/profile',
        method: 'PUT',
        body: data,
      }),
      transformResponse: transformResponse<{ user: User }>,
      invalidatesTags: ['Auth', 'User'],
      // Optimistic update
      onQueryStarted: async (patch, { dispatch, queryFulfilled, getState }) => {
        const patchResult = dispatch(
          authApi.util.updateQueryData('getCurrentUser', undefined, (draft) => {
            if (draft.data?.user) {
              Object.assign(draft.data.user, patch);
            }
          })
        );
        
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),

    // Logout
    logout: builder.mutation<ApiResponse<{ message: string }>, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      transformResponse: transformResponse,
      invalidatesTags: ['Auth'],
    }),

    // Refresh token (if supported by backend)
    refreshToken: builder.mutation<ApiResponse<{ token: string }>, void>({
      query: () => ({
        url: '/auth/refresh',
        method: 'POST',
      }),
      transformResponse: transformResponse,
      invalidatesTags: ['Auth'],
    }),
  }),
});

// Export hooks
export const {
  useLoginWithPasswordMutation,
  useRequestOTPLoginMutation,
  useVerifyOTPLoginMutation,
  useRegisterMutation,
  useVerifyRegistrationOTPMutation,
  useResendRegistrationOTPMutation,
  useSendPasswordSetupEmailMutation,
  useSetPasswordMutation,
  useChangePasswordMutation,
  useGetCurrentUserQuery,
  useUpdateProfileMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
} = authApi;
