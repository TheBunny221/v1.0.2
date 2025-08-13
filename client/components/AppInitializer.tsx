import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setCredentials, clearCredentials } from "../store/slices/authSlice";
import { initializeLanguage } from "../store/slices/languageSlice";
import { initializeTheme, setOnlineStatus } from "../store/slices/uiSlice";
import { useGetCurrentUserQuery } from "../store/api/authApi";

interface AppInitializerProps {
  children: React.ReactNode;
}

const AppInitializer: React.FC<AppInitializerProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const [isInitialized, setIsInitialized] = useState(false);

  // Get token from localStorage and check Redux state
  const token = localStorage.getItem("token");
  const hasValidToken = token && token !== "null" && token !== "undefined";

  // Check if Redux already has auth state
  const reduxAuth = useAppSelector((state) => state.auth);
  const isAlreadyAuthenticated = reduxAuth.isAuthenticated && reduxAuth.user && reduxAuth.token;

  // Use RTK Query to get current user if we have a token
  const {
    data: userResponse,
    isLoading: isLoadingUser,
    error: userError,
  } = useGetCurrentUserQuery(undefined, {
    skip: !hasValidToken, // Skip query if no token
  });

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize theme
        dispatch(initializeTheme());

        // Initialize language
        dispatch(initializeLanguage());

        // Handle auto-login based on token and user query result
        if (hasValidToken) {
          if (userResponse?.data?.user) {
            // Token is valid and we have user data - set credentials
            dispatch(
              setCredentials({
                token,
                user: userResponse.data.user,
              }),
            );
          } else if (userError) {
            // Token is invalid or expired - clear it
            dispatch(clearCredentials());
            console.warn("Invalid token removed:", userError);
          }
          // If still loading, we'll wait for the query to complete
        }

        // Setup online/offline listeners
        const handleOnline = () => dispatch(setOnlineStatus(true));
        const handleOffline = () => dispatch(setOnlineStatus(false));

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        // Cleanup function
        return () => {
          window.removeEventListener("online", handleOnline);
          window.removeEventListener("offline", handleOffline);
        };
      } finally {
        // Only set initialized when we're done with the user query (or don't need it)
        if (!hasValidToken || userResponse || userError) {
          setIsInitialized(true);
        }
      }
    };

    initializeApp();
  }, [dispatch, hasValidToken, userResponse, userError, token]);

  // Show loading screen while initializing or checking user
  if (!isInitialized || (hasValidToken && isLoadingUser)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Cochin Smart City
          </h2>
          <p className="text-gray-600">Initializing application...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AppInitializer;
