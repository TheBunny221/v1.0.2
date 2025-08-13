import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
import { logout, setError } from "../slices/authSlice";
import { toast } from "../../components/ui/use-toast";

const baseQuery = fetchBaseQuery({
  baseUrl: "/api",
  timeout: 30000, // 30 seconds timeout to prevent hanging requests
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as any;
    const token = state.auth.token;
    const localStorageToken = localStorage.getItem("token");

    // Use token from Redux state, fallback to localStorage if Redux token is not available
    const activeToken = token || localStorageToken;

    // Debug token availability
    if (process.env.NODE_ENV === "development") {
      console.log("BaseQuery Debug:", {
        reduxToken: token ? `${token.substring(0, 10)}...` : "null",
        localStorageToken: localStorageToken
          ? `${localStorageToken.substring(0, 10)}...`
          : "null",
        activeToken: activeToken
          ? `${activeToken.substring(0, 10)}...`
          : "null",
        isAuthenticated: state.auth.isAuthenticated,
        hasUser: !!state.auth.user,
      });
    }

    if (activeToken) {
      headers.set("authorization", `Bearer ${activeToken}`);
    }

    // Don't set content-type for FormData requests
    if (!headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }

    return headers;
  },
  // Use default RTK Query response handling to prevent body consumption conflicts
});

// Enhanced base query with 401 auto-logout handling and error handling
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result;

  try {
    result = await baseQuery(args, api, extraOptions);
  } catch (networkError: any) {
    // Handle network errors that occur before response is received
    console.error("BaseQuery network error:", networkError);

    // Check for specific error types that indicate response body issues
    if (networkError?.message?.includes("Response body") ||
        networkError?.message?.includes("already used") ||
        networkError?.message?.includes("disturbed") ||
        networkError?.message?.includes("body stream") ||
        networkError?.name === "TypeError") {

      console.warn("Response body consumption error detected:", networkError.message);

      return {
        error: {
          status: "FETCH_ERROR",
          error: "Response processing error",
          data: { message: "A network error occurred. Please try again." },
        },
      };
    }

    // Handle other network errors
    let errorMessage = "A network error occurred. Please try again.";
    let errorStatus: "FETCH_ERROR" | "PARSING_ERROR" | "TIMEOUT_ERROR" = "FETCH_ERROR";

    if (networkError?.name === "TypeError" && networkError?.message?.includes("fetch")) {
      errorMessage = "Network connection failed. Please check your internet connection.";
    } else if (
      networkError?.message?.includes("timeout") ||
      networkError?.message?.includes("Timeout")
    ) {
      errorMessage = "Request timed out. Please try again.";
      errorStatus = "TIMEOUT_ERROR";
    } else if (
      networkError?.message?.includes("JSON") ||
      networkError?.message?.includes("parse")
    ) {
      errorMessage = "Invalid response from server. Please try again.";
      errorStatus = "PARSING_ERROR";
    }

    return {
      error: {
        status: errorStatus,
        error: networkError.message || "Network error",
        data: { message: errorMessage },
      },
    };
  }

  // Handle successful response or API errors
  if (result.error && result.error.status === 401) {
    // Check if this is an auth-related endpoint to avoid logout loops
    const endpoint = typeof args === "string" ? args : args.url;
    const isAuthEndpoint =
      typeof endpoint === "string" &&
      (endpoint.includes("/auth/login") ||
        endpoint.includes("/auth/register") ||
        endpoint.includes("/auth/verify-otp") ||
        endpoint.includes("/auth/login-otp"));

    if (!isAuthEndpoint) {
      // Only auto-logout for non-auth endpoints
      console.warn(
        "401 Unauthorized detected for non-auth endpoint:",
        endpoint,
      );

      // Clear auth state
      api.dispatch(logout());

      // Show toast notification (avoid multiple toasts)
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
  } else if (result.error) {
    // Log error for analytics without trying to access error data
    const endpoint = typeof args === "string" ? args : args.url;
    console.warn("API Error:", {
      endpoint,
      status: result.error.status,
      timestamp: new Date().toISOString(),
    });

    // Set error in auth slice for global error handling (only for server errors)
    if (result.error.status && result.error.status >= 500) {
      try {
        api.dispatch(
          setError("A server error occurred. Please try again later."),
        );
      } catch (dispatchError) {
        console.error("Failed to dispatch error:", dispatchError);
      }
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
  console.log(
    "Processing error in getApiErrorMessage:",
    JSON.stringify(error, null, 2),
  );

  // Handle custom fetch errors from useCustomRegister hook
  if (error?.status && error?.data) {
    console.log("Handling custom fetch error with status:", error.status);
    console.log("Error data:", error.data);

    // Server error response with message - prioritize server message
    if (typeof error.data === "object" && error.data.message) {
      console.log("Found message in error.data:", error.data.message);
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

    // Only use fallback messages if server didn't provide a specific message
    console.log("No server message found, using status-based fallback");
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

  // Handle RTK Query SerializedError (when response cloning fails or other errors)
  if (
    error?.name === "TypeError" ||
    error?.message?.includes("Response body") ||
    error?.message?.includes("already used") ||
    error?.message?.includes("clone") ||
    error?.message?.includes("disturbed")
  ) {
    // This is a cloning/network error - provide a generic helpful message
    console.warn("Response body or cloning error detected in getApiErrorMessage");
    return "Request failed due to a network issue. Please try again.";
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
    if (
      !error.message.includes("Response body") &&
      !error.message.includes("clone") &&
      !error.message.includes("TypeError")
    ) {
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

  console.log("No specific error pattern matched, using fallback");
  return "Registration failed. Please check your information and try again.";
};
