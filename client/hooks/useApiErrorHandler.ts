import { useEffect } from "react";
import { useAppDispatch } from "../store/hooks";
import { logout } from "../store/slices/authSlice";
import { useToast } from "./use-toast";

/**
 * Hook to handle common API errors globally
 */
export const useApiErrorHandler = () => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const handleApiError = (error: any) => {
    // Handle 401 unauthorized errors
    if (error?.status === 401) {
      dispatch(logout());
      toast({
        title: "Session Expired",
        description: "Please login again to continue.",
        variant: "destructive",
      });
      return true; // Indicates error was handled
    }

    return false; // Error not handled, let component handle it
  };

  return { handleApiError };
};
