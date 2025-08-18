import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
import { logout, setError } from "../slices/authSlice";
import { toast } from "../../components/ui/use-toast";

// Create a simple base query without any custom response handling
const baseQuery = fetchBaseQuery({
  baseUrl: "/api/",
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as any;
    const token = state?.auth?.token || localStorage.getItem("token");

    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }

    return headers;
  },
});

// Minimal base query wrapper - just handle auth, don't touch responses
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await baseQuery(args, api, extraOptions);

  // Only handle 401s for logout - don't access error.data
  if (result.error?.status === 401) {
    const endpoint = typeof args === "string" ? args : args.url;
    const isAuthEndpoint = typeof endpoint === "string" &&
      (endpoint.includes("auth/login") || endpoint.includes("auth/register"));

    if (!isAuthEndpoint) {
      localStorage.removeItem("token");
      api.dispatch(logout());
    }
  }

  return result;
};

// Create the base API slice
export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
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

// Safe transform function that doesn't access response data
export const safeTransformResponse = <T>(response: any): T => {
  // Just return the response as-is to avoid any body consumption issues
  return response;
};

// Helper for transforming API responses - defensive implementation
export const transformResponse = <T>(response: any): ApiResponse<T> => {
  try {
    // Handle null or undefined responses
    if (response == null) {
      return {
        success: false,
        data: {} as T,
        message: "No response received",
      };
    }

    // If response is already in our expected format, return it as-is
    if (
      typeof response === "object" &&
      response !== null &&
      "success" in response &&
      "data" in response
    ) {
      return response as ApiResponse<T>;
    }

    // Transform raw response to our format
    return {
      success: response?.success ?? true,
      data: response?.data ?? response,
      message: response?.message,
      meta: response?.meta,
    };
  } catch (error) {
    console.warn("Error in transformResponse:", error);
    // Return a safe fallback response if transformation fails
    return {
      success: false,
      data: response as T,
      message: "Response transformation failed",
    };
  }
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
  // Handle RTK Query FetchBaseQueryError structure
  if (error?.data?.message) {
    return error.data.message;
  }

  // Handle status-based errors
  if (error?.status) {
    switch (error.status) {
      case 400:
        return "Bad request - please check your input";
      case 401:
        return "Unauthorized - please login again";
      case 403:
        return "Forbidden - you do not have permission";
      case 404:
        return "Resource not found";
      case 409:
        return "Conflict - resource already exists";
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

  // Handle network errors
  if (error?.message?.includes("Failed to fetch")) {
    return "Network connection failed. Please check your internet connection.";
  }

  return "An unexpected error occurred. Please try again.";
};
