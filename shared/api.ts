/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

// Unified Auth API Types
export interface LoginOtpRequest {
  email: string;
}

export interface LoginOtpResponse {
  success: boolean;
  message: string;
}

export interface VerifyOtpRequest {
  email: string;
  otpCode: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: any;
  };
}

// Guest Complaint API Types
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
  success: boolean;
  message: string;
  data: {
    complaintId: string;
    trackingNumber: string;
  };
}

export interface GuestVerifyOtpRequest {
  email: string;
  otpCode: string;
  complaintId: string;
  createAccount: boolean;
}

export interface GuestVerifyOtpResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: any;
  };
}

// Auth Me API Response
export interface AuthMeResponse {
  success: boolean;
  data: {
    user: any;
    ward?: {
      id: string;
      name: string;
      description?: string;
    };
  };
}
