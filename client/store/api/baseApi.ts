import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
import { logout, setError } from "../slices/authSlice";
import { toast } from "../../components/ui/use-toast";

// Create the most basic possible base query
const baseQuery = fetchBaseQuery({
  baseUrl: "/api/",
  prepareHeaders: (headers, { getState }) => {
    try {
      const state = getState() as any;
      const token = state?.auth?.token || localStorage.getItem("token");

      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
    } catch (error) {
      // Silently handle any state access errors
      const token = localStorage.getItem("token");
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
    }

    return headers;
  },
});

// Ultra-minimal base query - absolutely no response processing
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  // Just call the base query and return the result immediately
  const result = await baseQuery(args, api, extraOptions);

  // Minimal 401 handling without any response body access
  if (result.error?.status === 401) {
    const endpoint = typeof args === "string" ? args : args.url;
    const isAuthEndpoint = typeof endpoint === "string" &&
      (endpoint.includes("auth/login") || endpoint.includes("auth/register"));

    if (!isAuthEndpoint) {
      // Only clear localStorage, don't dispatch logout to avoid potential conflicts
      localStorage.removeItem("token");
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

// Note: transformResponse functions were removed to prevent "Response body is already used" errors
// in RTK Query. The backend now returns ApiResponse<T> format directly.

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

// Helper to extract error message from RTK Query error - defensive implementation
export const getApiErrorMessage = (error: any): string => {
  try {
    // Avoid accessing error.data directly to prevent "Response body is already used" errors
    // Instead, rely on status codes for user-friendly messages

    // Handle status-based errors first
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

    // Handle other error types without accessing data property
    if (error?.error) {
      return "Network error - please check your connection";
    }

    return "An unexpected error occurred. Please try again.";
  } catch (err) {
    console.warn("Error in getApiErrorMessage:", err);
    return "An unexpected error occurred. Please try again.";
  }
};
