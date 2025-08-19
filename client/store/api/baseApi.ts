import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Minimal base query to avoid any response body consumption issues
const baseQuery = fetchBaseQuery({
  baseUrl: "/api/",
  prepareHeaders: (headers, { getState }) => {
    // Get auth token
    const state = getState() as any;
    const token = state?.auth?.token || localStorage.getItem("token");

    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }

    return headers;
  },
});

// Create the base API slice with minimal configuration
export const baseApi = createApi({
  reducerPath: "api",
  baseQuery,
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
    "MaintenanceTask",
    "MaintenanceStats",
  ],
  endpoints: () => ({}),
});

// Types for API responses
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
