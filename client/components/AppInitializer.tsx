import React, { useEffect, useState, useRef, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { useSystemConfig } from "../contexts/SystemConfigContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { setCredentials, clearCredentials } from "../store/slices/authSlice";
import { initializeLanguage } from "../store/slices/languageSlice";
import { initializeTheme, setOnlineStatus } from "../store/slices/uiSlice";
import { useGetCurrentUserQuery } from "../store/api/authApi";
// import logger from "../utils/logger"; // Temporarily disabled to fix React useRef issue

// Error logging utility - avoid accessing error.data to prevent response body issues
const logAuthError = (context: string, error: any) => {
  console.error(`Auth Error - ${context}`, {
    error: error?.message || 'Unknown error',
    status: error?.status,
    context,
  });
};

interface AppInitializerProps {
  children: React.ReactNode;
}

const AppInitializer: React.FC<AppInitializerProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const [isInitialized, setIsInitialized] = useState(false);
  const { appName } = useSystemConfig();
  
  // Use ref to track if initialization has already run
  const hasInitializedRef = useRef(false);
  const cleanupFunctionsRef = useRef<(() => void)[]>([]);

  // Set document title
  useDocumentTitle();

  // Get token from localStorage and check Redux state
  const token = localStorage.getItem("token");
  const hasValidToken = token && token !== "null" && token !== "undefined";

  // Check if Redux already has auth state
  const reduxAuth = useAppSelector((state) => state.auth);
  const isAlreadyAuthenticated =
    reduxAuth.isAuthenticated && reduxAuth.user && reduxAuth.token;

  // Use RTK Query to get current user if we have a token but are not already authenticated
  const {
    data: userResponse,
    isLoading: isLoadingUser,
    error: userError,
  } = useGetCurrentUserQuery(undefined, {
    skip: !hasValidToken || isAlreadyAuthenticated, // Skip query if no token or already authenticated
  });

  useEffect(() => {
    // Prevent multiple initializations
    if (hasInitializedRef.current) {
      return;
    }
    
    const initializeApp = async () => {
      try {
        // Mark as initialized immediately to prevent race conditions
        hasInitializedRef.current = true;
        
        // Initialize theme
        try {
          dispatch(initializeTheme());
        } catch (themeError) {
          console.warn("Theme initialization failed:", themeError);
        }

        // Initialize language
        try {
          dispatch(initializeLanguage());
        } catch (langError) {
          console.warn("Language initialization failed:", langError);
        }


        // Setup online/offline listeners with error handling
        const handleOnline = () => {
          try {
            dispatch(setOnlineStatus(true));
            console.log("Network status: online");
          } catch (error) {
            console.warn("Failed to update online status:", error);
          }
        };

        const handleOffline = () => {
          try {
            dispatch(setOnlineStatus(false));
            console.warn("Network status: offline");
          } catch (error) {
            console.warn("Failed to update offline status:", error);
          }
        };

        try {
          window.addEventListener("online", handleOnline);
          window.addEventListener("offline", handleOffline);
          
          // Store cleanup function
          cleanupFunctionsRef.current.push(() => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
          });
        } catch (listenerError) {
          console.warn("Failed to add online/offline listeners:", listenerError);
        }
      } finally {
        // Mark as initialized
        setIsInitialized(true);
      }
    };

    initializeApp();
    
    // Cleanup function
    return () => {
      cleanupFunctionsRef.current.forEach(cleanup => cleanup());
    };
  }, []); // Empty dependency array - initialization should only run once
  
  // Separate effect for handling auth state changes
  useEffect(() => {
    if (!hasValidToken || isAlreadyAuthenticated) {
      return;
    }
    
    if (userResponse?.data?.user) {
      // Token is valid and we have user data - set credentials
      dispatch(
        setCredentials({
          token,
          user: userResponse.data.user,
        }),
      );
    } else if (userError) {
      // Handle auth errors
      const error = userError as any;
      logAuthError("User Query Failed", error);
      
      const isServerError = error.status >= 500;
      const isUnauthorized = error.status === 401;
      
      if (!isServerError && (isUnauthorized || error.status < 500)) {
        dispatch(clearCredentials());
        localStorage.removeItem("token");
      }
    }
  }, [userResponse, userError, hasValidToken, isAlreadyAuthenticated, token, dispatch]);

  // Show loading screen while initializing or checking user (but not if already authenticated)
  if (
    !isInitialized ||
    (hasValidToken && !isAlreadyAuthenticated && isLoadingUser)
  ) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            {appName}
          </h2>
          <p className="text-gray-600">Initializing application...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AppInitializer;
