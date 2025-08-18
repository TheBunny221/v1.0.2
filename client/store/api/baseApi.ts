import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
import { logout } from "../slices/authSlice";

// Note: Using completely custom fetch implementation below to avoid RTK Query response body conflicts

// Completely custom base query to avoid all RTK Query response body conflicts
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  // Build URL and options
  const url = typeof args === "string" ? args : args.url;

  let body: string | FormData | undefined = undefined;
  let contentType = "application/json";

  // Handle different body types properly
  if (typeof args !== "string" && args.body !== undefined) {
    if (args.body instanceof FormData) {
      // FormData should not be JSON stringified and should not have content-type set
      body = args.body;
      contentType = ""; // Let browser set multipart/form-data
    } else if (typeof args.body === "string") {
      // Already a string, use as-is
      body = args.body;
    } else if (typeof args.body === "object") {
      // Object needs to be JSON stringified
      body = JSON.stringify(args.body);
    }
  }

  const options: RequestInit = typeof args === "string"
    ? { method: "GET" }
    : {
        method: args.method || "GET",
        headers: args.headers || {},
        body,
        ...args,
      };

  // Add auth headers manually
  try {
    const state = api.getState() as any;
    const token = state?.auth?.token || localStorage.getItem("token");
    if (token) {
      const headers: Record<string, string> = {
        ...options.headers,
        "authorization": `Bearer ${token}`,
      };

      // Only add content-type for JSON requests (not FormData)
      if (contentType) {
        headers["content-type"] = contentType;
      }

      options.headers = headers;
    }
  } catch (error) {
    const token = localStorage.getItem("token");
    if (token) {
      const headers: Record<string, string> = {
        ...options.headers,
        "authorization": `Bearer ${token}`,
      };

      // Only add content-type for JSON requests (not FormData)
      if (contentType) {
        headers["content-type"] = contentType;
      }

      options.headers = headers;
    }
  }

  try {
    // Use native fetch to avoid RTK Query's internal response handling
    const response = await fetch(`/api${url.startsWith("/") ? "" : "/"}${url}`, options);

    // Handle 401 errors before parsing response
    if (response.status === 401) {
      const isAuthEndpoint = url.includes("auth/login") || url.includes("auth/register");
      if (!isAuthEndpoint) {
        localStorage.removeItem("token");
        setTimeout(() => {
          try {
            api.dispatch(logout());
          } catch (err) {
            console.warn("Error dispatching logout:", err);
          }
        }, 0);
      }
    }

    // Parse response only once
    let data;
    try {
      const text = await response.text();
      data = text ? JSON.parse(text) : null;
    } catch (parseError) {
      data = null;
    }

    if (response.ok) {
      return { data };
    } else {
      return {
        error: {
          status: response.status,
          data: data,
        } as FetchBaseQueryError,
      };
    }
  } catch (error) {
    return {
      error: {
        status: "FETCH_ERROR",
        error: String(error),
      } as FetchBaseQueryError,
    };
  }
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
