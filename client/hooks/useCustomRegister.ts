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
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

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
      console.log("Caught error in useCustomRegister:", error);

      // If it's a fetch error, wrap it properly
      if (error.name === "TypeError" || error.message?.includes("fetch")) {
        console.log("Network error detected, wrapping...");
        throw {
          status: 500,
          data: { message: "Network error. Please check your connection and try again." },
        };
      }

      // Re-throw the error as-is if it's already structured
      console.log("Re-throwing structured error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { register, isLoading };
};
