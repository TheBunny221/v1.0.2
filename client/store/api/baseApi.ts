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

  if (result.error && result.error.status === 401) {
    // Unauthorized - clear auth state
    api.dispatch(logout());

    // Show toast notification
    toast({
      title: "Session Expired",
      description: "Please login again to continue.",
      variant: "destructive",
    });
  } else if (result.error) {
    // Log error for analytics without trying to read error data
    console.error("API Error:", {
      endpoint: typeof args === "string" ? args : args.url,
      status: result.error.status,
      timestamp: new Date().toISOString(),
    });

    // Set error in auth slice for global error handling
    if (result.error.status && result.error.status >= 500) {
      api.dispatch(setError("A server error occurred. Please try again later."));
    }
  }

  return result;
};

// Helper function to extract error messages (simplified to avoid response body consumption)
function getErrorMessage(error: FetchBaseQueryError): string {
  if ("status" in error) {
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
