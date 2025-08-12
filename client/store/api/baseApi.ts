import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
// Define base query with JWT auto-inclusion - keep it simple to avoid cloning issues
const baseQuery = fetchBaseQuery({
  baseUrl: "/api",
  prepareHeaders: (headers, { getState }) => {
    // Get token from auth state
    const token = (getState() as any).auth.token;

    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }

    // Set content type if not already set
    if (!headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }

    return headers;
  },
});


// Create the base API slice
export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQuery,
  tagTypes: [
    "Auth",
    "User",
    "Complaint",
    "ComplaintType",
    "Ward",
    "Analytics",
    "Report",
    "Notification",
    "SystemConfig",
  ],
  endpoints: () => ({}),
});

// Export hooks
export const {
  // Will be populated by individual API slices
} = baseApi;

// Types for enhanced error handling
export interface ApiError {
  status: number;
  message: string;
  field?: string;
  details?: any;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
  };
}

// Helper for transforming API responses
export const transformResponse = <T>(response: any): ApiResponse<T> => {
  return {
    success: response?.success ?? true,
    data: response?.data ?? response,
    message: response?.message,
    meta: response?.meta,
  };
};

// Helper for handling optimistic updates
export const optimisticUpdate = <T>(
  items: T[],
  updatedItem: Partial<T> & { id: string },
  idField: keyof T = "id" as keyof T,
): T[] => {
  return items.map((item) =>
    item[idField] === updatedItem.id ? { ...item, ...updatedItem } : item,
  );
};

// Helper for handling pessimistic updates (rollback on error)
export const rollbackUpdate = <T>(
  items: T[],
  originalItem: T,
  idField: keyof T = "id" as keyof T,
): T[] => {
  return items.map((item) =>
    item[idField] === originalItem[idField] ? originalItem : item,
  );
};

// Helper to extract error message from RTK Query error
export const getApiErrorMessage = (error: any): string => {
  console.log("Processing error:", error);

  // Handle RTK Query SerializedError (when response cloning fails or other errors)
  if (error?.name === "TypeError" || error?.message?.includes("Response body") || error?.message?.includes("clone")) {
    // This is a cloning/network error - try to provide a helpful message
    // In many cases, the actual server error is lost, so we provide a generic message
    return "Registration failed. This email address may already be registered. Please try using a different email or attempt to log in instead.";
  }

  // Handle RTK Query FetchBaseQueryError structure
  if (error?.data) {
    // Server error response with message
    if (typeof error.data === "object" && error.data.message) {
      return error.data.message;
    }

    // Server error response as string
    if (typeof error.data === "string") {
      try {
        const parsed = JSON.parse(error.data);
        if (parsed.message) {
          return parsed.message;
        }
      } catch {
        return error.data;
      }
    }
  }

  // Handle SerializedError structure
  if (error?.message && typeof error.message === "string") {
    // Skip generic error messages that aren't helpful
    if (!error.message.includes("Response body") && !error.message.includes("clone") && !error.message.includes("TypeError")) {
      return error.message;
    }
  }

  // Fallback to status-based message
  if (error?.status) {
    switch (error.status) {
      case 400:
        return "This email address is already registered. Please use a different email or try logging in.";
      case 401:
        return "Unauthorized - please login again";
      case 403:
        return "Forbidden - you do not have permission";
      case 404:
        return "Resource not found";
      case 409:
        return "This email address is already registered. Please use a different email or try logging in.";
      case 422:
        return "Validation error - please check your input";
      case 429:
        return "Too many requests - please try again later";
      case 500:
        return "Internal server error - please try again later";
      default:
        return `An error occurred (${error.status})`;
    }
  }

  return "Registration failed. Please check your information and try again.";
};
