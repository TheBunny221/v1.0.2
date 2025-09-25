import { useState } from "react";
import { useAppSelector } from "../store/hooks";

interface RegisterData {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  role: string;
  wardId: string;
}

export const useCustomRegister = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useAppSelector((state) => state.auth);

  const register = async (data: RegisterData) => {
    setIsLoading(true);

    try {
      // First, test if we can reach the API at all
      console.log("Testing API connectivity...");
      try {
        const testResponse = await fetch("/api/health");
        console.log(
          "Health check response:",
          testResponse.status,
          testResponse.statusText,
        );
        const healthData = await testResponse.json();
        console.log("Health check data:", healthData);
      } catch (testError: unknown) {
        console.error("Health check failed:", testError);
        if (testError instanceof Error) {
          console.error(
            "Health check error details:",
            testError.name,
            testError.message,
          );
        }
      }

      console.log(
        "Making fetch request to /api/auth/register with data:",
        data,
      );

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
      });

      console.log("Fetch response received:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
      });

      // Parse response as JSON - use clone to avoid "body already used" errors
      let result;
      try {
        // Clone the response to avoid conflicts with RTK Query or other consumers
        const responseClone = response.clone();
        const responseText = await responseClone.text();
        console.log("Raw response text:", responseText);

        result = JSON.parse(responseText);
        console.log("Parsed JSON result:", result);
      } catch (jsonError) {
        console.error("Failed to parse response as JSON:", jsonError);
        // If JSON parsing fails, create a structured error
        throw {
          status: response.status || 500,
          data: {
            message: "Server returned invalid response format",
          },
        };
      }

      if (!response.ok) {
        // Create an error object that matches RTK Query structure
        console.log("Register API error response:", response.status, result);
        const error = {
          status: response.status,
          data: result,
        };
        throw error;
      }

      return result;
    } catch (error: any) {
      console.log("Caught error in useCustomRegister:");
      console.log("Error object:", error);

      // Check if this is already a structured error from our API response handling
      if (error.status) {
        console.log(
          "Re-throwing structured API error with status:",
          error.status,
        );
        throw error;
      }

      // If it's a network/fetch error, wrap it properly
      if (
        error.name === "TypeError" ||
        error.message?.includes("fetch") ||
        error.message?.includes("Failed to fetch")
      ) {
        console.log("Network error detected, wrapping...");
        throw {
          status: 500,
          data: {
            message: `Network error: ${error.message}. Please check your connection and try again.`,
          },
        };
      }

      // For other unexpected errors, wrap them
      console.log("Wrapping unexpected error:", error.message);
      throw {
        status: 500,
        data: {
          message:
            error.message || "Registration failed due to an unexpected error",
        },
      };
    } finally {
      setIsLoading(false);
    }
  };

  return { register, isLoading };
};
