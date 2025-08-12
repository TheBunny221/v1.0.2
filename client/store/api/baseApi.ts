import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
import { logout, setError } from "../slices/authSlice";
import { toast } from "../../components/ui/use-toast";

// Define base query with JWT auto-inclusion
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

// Enhanced base query with 401 auto-logout handling
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  // Only handle 401 errors here to avoid response body consumption issues
  if (result.error && result.error.status === 401) {
    // Unauthorized - clear auth state
    api.dispatch(logout());

    // Show toast notification
    toast({
      title: "Session Expired",
      description: "Please login again to continue.",
      variant: "destructive",
    });
  }

  return result;
};

// Helper function to extract error messages
function getErrorMessage(error: FetchBaseQueryError): string {
  if ("status" in error) {
    // Safely extract error message from response data
    let errorMessage: string | undefined;

    try {
      if (
        error.data &&
        typeof error.data === "object" &&
        "message" in error.data &&
        typeof (error.data as any).message === "string"
      ) {
        errorMessage = (error.data as any).message;
      }
    } catch (e) {
      // Ignore errors when trying to read the response data
      console.warn("Error reading response data:", e);
    }

    // Return custom message if available, otherwise use default
    if (errorMessage) {
      return errorMessage;
    }

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
      case 502:
        return "Bad gateway - service temporarily unavailable";
      case 503:
        return "Service unavailable - please try again later";
      default:
        return `An error occurred (${error.status})`;
    }
  }

  if ("message" in error) {
    return error.message || "Network error occurred";
  }

  return "An unexpected error occurred";
}

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
  // If error has data property with message (from server)
  if (error?.data?.message) {
    return error.data.message;
  }

  // If error has message property
  if (error?.message) {
    return error.message;
  }

  // If error has data as string
  if (typeof error?.data === "string") {
    return error.data;
  }

  // Fallback to status-based message
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

  return "An unexpected error occurred";
};
