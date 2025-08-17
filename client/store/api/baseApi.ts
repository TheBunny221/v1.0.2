import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
import { logout, setError } from "../slices/authSlice";
import { toast } from "../../components/ui/use-toast";

// Create the base query once to avoid response body conflicts
const baseQuery = fetchBaseQuery({
  baseUrl: '/api/',
  prepareHeaders: (headers) => {
    // Get token from localStorage directly for consistency
    const token = localStorage.getItem("token");

    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }

    return headers;
  },
  timeout: 30000,
});

// Enhanced base query with authentication handling
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  // Make the initial request
  let result = await baseQuery(args, api, extraOptions);

  // Handle 401 unauthorized responses
  if (result.error && result.error.status === 401) {
    // Check if this is an auth-related endpoint to avoid logout loops
    const endpoint = typeof args === "string" ? args : args.url;
    const isAuthEndpoint =
      typeof endpoint === "string" &&
      (endpoint.includes("auth/login") ||
        endpoint.includes("auth/register") ||
        endpoint.includes("auth/verify-otp") ||
        endpoint.includes("auth/login-otp") ||
        endpoint.includes("auth/set-password"));

    if (!isAuthEndpoint) {
      // Clear auth state and localStorage
      localStorage.removeItem("token");
      api.dispatch(logout());

      // Show toast notification
      try {
        toast({
          title: "Session Expired",
          description: "Please login again to continue.",
          variant: "destructive",
        });
      } catch (toastError) {
        console.warn("Toast notification failed:", toastError);
      }
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

// Helper for transforming API responses
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

    // If response is already in our expected format, return it
    if (
      typeof response === "object" &&
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
    console.warn("Error transforming response:", error);
    return {
      success: false,
      data: {} as T,
      message: "Response transformation error",
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
