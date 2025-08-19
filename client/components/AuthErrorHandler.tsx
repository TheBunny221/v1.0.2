import React, { useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { logout } from "../store/slices/authSlice";
import { useToast } from "../hooks/use-toast";

const AuthErrorHandler: React.FC = () => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Listen for authentication errors from the global error state
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "auth_error" && e.newValue) {
        const error = JSON.parse(e.newValue);

        if (error.code === "USER_NOT_FOUND" || error.code === "TOKEN_INVALID") {
          // Clear the error
          localStorage.removeItem("auth_error");

          // Force logout
          dispatch(logout());
          localStorage.removeItem("token");

          toast({
            title: "Session Invalid",
            description:
              "Your session is no longer valid. Please log in again.",
            variant: "destructive",
          });
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [dispatch, toast]);

  // Check for existing authentication errors on mount
  useEffect(() => {
    const checkForAuthError = () => {
      const authError = localStorage.getItem("auth_error");
      if (authError && isAuthenticated) {
        try {
          const error = JSON.parse(authError);
          if (
            error.code === "USER_NOT_FOUND" ||
            error.code === "TOKEN_INVALID"
          ) {
            localStorage.removeItem("auth_error");
            dispatch(logout());
            localStorage.removeItem("token");

            toast({
              title: "Session Invalid",
              description:
                "Your session is no longer valid. Please log in again.",
              variant: "destructive",
            });
          }
        } catch (e) {
          console.warn("Failed to parse auth error:", e);
          localStorage.removeItem("auth_error");
        }
      }
    };

    checkForAuthError();
  }, [dispatch, toast, isAuthenticated]);

  return null; // This component doesn't render anything
};

export default AuthErrorHandler;
