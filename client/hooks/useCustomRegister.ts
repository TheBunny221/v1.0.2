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
        console.log("Health check response:", testResponse.status);
      } catch (testError) {
        console.error("Health check failed:", testError);
      }

      console.log("Making fetch request to /api/auth/register with data:", data);

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
        headers: Object.fromEntries(response.headers.entries())
      });

      let result;
      try {
        result = await response.json();
        console.log("Parsed JSON result:", result);
      } catch (jsonError) {
        console.error("Failed to parse response as JSON:", jsonError);
        const textResult = await response.text();
        console.log("Response as text:", textResult);
        throw new Error(`Invalid JSON response: ${textResult}`);
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
      console.log("Error name:", error.name);
      console.log("Error message:", error.message);
      console.log("Error stack:", error.stack);
      console.log("Full error object:", error);

      // Check if this is already a structured error from our API response handling
      if (error.status && error.data) {
        console.log("Re-throwing structured API error:", error);
        throw error;
      }

      // If it's a fetch error, wrap it properly
      if (error.name === "TypeError" || error.message?.includes("fetch")) {
        console.log("Network/TypeError detected, wrapping...");
        throw {
          status: 500,
          data: { message: `Network error: ${error.message}. Please check your connection and try again.` },
        };
      }

      // For other errors, wrap them with more detail
      console.log("Wrapping unexpected error:", error);
      throw {
        status: 500,
        data: { message: `Registration failed: ${error.message || 'Unknown error'}` },
      };
    } finally {
      setIsLoading(false);
    }
  };

  return { register, isLoading };
};
