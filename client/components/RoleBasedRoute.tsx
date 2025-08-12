import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { logout } from "../store/slices/authSlice";
import { toast } from "./ui/use-toast";
import { selectTranslations } from "../store/slices/languageSlice";
import { Loader2 } from "lucide-react";

export type UserRole =
  | "CITIZEN"
  | "WARD_OFFICER"
  | "MAINTENANCE_TEAM"
  | "ADMINISTRATOR"
  | "GUEST";

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallbackPath?: string;
  unauthorizedPath?: string;
  requiresAuth?: boolean;
  checkPermissions?: (user: any) => boolean;
  onUnauthorized?: () => void;
  loadingComponent?: React.ReactNode;
}

// Loading component for authentication checks
const AuthLoadingComponent: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="flex items-center space-x-2">
      <Loader2 className="h-6 w-6 animate-spin" />
      <span>Verifying authentication...</span>
    </div>
  </div>
);

const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({
  children,
  allowedRoles,
  fallbackPath = "/login",
  unauthorizedPath = "/unauthorized",
  requiresAuth = true,
  checkPermissions,
  onUnauthorized,
  loadingComponent,
}) => {
  const { user, isAuthenticated, isLoading, token } = useAppSelector(
    (state) => state.auth,
  );
  const translations = useAppSelector(selectTranslations);
  const location = useLocation();
  const dispatch = useAppDispatch();

  // Handle token expiration and logout
  useEffect(() => {
    const handleTokenExpiration = () => {
      if (token && isAuthenticated) {
        try {
          const tokenPayload = JSON.parse(atob(token.split(".")[1]));
          const currentTime = Date.now() / 1000;

          if (tokenPayload.exp && tokenPayload.exp < currentTime) {
            // Token expired
            dispatch(logout());
            toast({
              title:
                translations?.messages?.sessionExpired || "Session Expired",
              description: "Please login again to continue.",
              variant: "destructive",
            });
          }
        } catch (error) {
          // Invalid token format
          console.warn("Invalid token format:", error);
          dispatch(logout());
        }
      }
    };

    // Check token on mount and every minute
    handleTokenExpiration();
    const interval = setInterval(handleTokenExpiration, 60000);

    return () => clearInterval(interval);
  }, [token, isAuthenticated, dispatch, translations]);

  // Show loading during authentication check
  if (isLoading) {
    return loadingComponent || <AuthLoadingComponent />;
  }

  // Handle unauthenticated users
  if (requiresAuth && (!isAuthenticated || !user)) {
    const redirectPath =
      location.pathname !== fallbackPath ? fallbackPath : "/";
    return (
      <Navigate
        to={redirectPath}
        state={{
          from: location,
          message:
            translations?.messages?.unauthorizedAccess ||
            "Please login to access this page.",
        }}
        replace
      />
    );
  }

  // Handle role-based access control
  if (user && !allowedRoles.includes(user.role as UserRole)) {
    // Execute custom unauthorized callback
    if (onUnauthorized) {
      onUnauthorized();
    }

    // Show toast notification
    toast({
      title: translations?.messages?.unauthorizedAccess || "Access Denied",
      description: `You don't have permission to access this page. Required roles: ${allowedRoles.join(", ")}`,
      variant: "destructive",
    });

    return <Navigate to={unauthorizedPath} replace />;
  }

  // Handle custom permission checks
  if (user && checkPermissions && !checkPermissions(user)) {
    toast({
      title: translations?.messages?.unauthorizedAccess || "Access Denied",
      description: "You don't have the required permissions for this action.",
      variant: "destructive",
    });

    return <Navigate to={unauthorizedPath} replace />;
  }

  // All checks passed, render children
  return <>{children}</>;
};

export default RoleBasedRoute;

// Higher-order component for easy role-based component wrapping
export function withRoleBasedAccess<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles: UserRole[],
  options?: {
    fallbackPath?: string;
    unauthorizedPath?: string;
    checkPermissions?: (user: any) => boolean;
  },
) {
  return function RoleProtectedComponent(props: P) {
    return (
      <RoleBasedRoute
        allowedRoles={allowedRoles}
        fallbackPath={options?.fallbackPath}
        unauthorizedPath={options?.unauthorizedPath}
        checkPermissions={options?.checkPermissions}
      >
        <Component {...props} />
      </RoleBasedRoute>
    );
  };
}

// Hook for checking user permissions
export function usePermissions() {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!isAuthenticated || !user) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.role as UserRole);
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    if (!isAuthenticated || !user) return false;
    return roles.some((role) => user.role === role);
  };

  const hasAllRoles = (roles: UserRole[]): boolean => {
    if (!isAuthenticated || !user) return false;
    return roles.every((role) => user.role === role);
  };

  const canAccess = (
    requiredRoles: UserRole[],
    customCheck?: (user: any) => boolean,
  ): boolean => {
    if (!hasRole(requiredRoles)) return false;
    if (customCheck && !customCheck(user)) return false;
    return true;
  };

  return {
    user,
    isAuthenticated,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    canAccess,
    isAdmin: hasRole("ADMINISTRATOR"),
    isCitizen: hasRole("CITIZEN"),
    isWardOfficer: hasRole("WARD_OFFICER"),
    isMaintenanceTeam: hasRole("MAINTENANCE_TEAM"),
    isGuest: hasRole("GUEST"),
  };
}
