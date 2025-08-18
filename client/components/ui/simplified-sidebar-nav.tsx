import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAppSelector } from "../../store/hooks";
import { useSystemConfig } from "../../contexts/SystemConfigContext";
import { Button } from "./button";
import { cn } from "../../lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Home,
  FileText,
  BarChart3,
  Users,
  Settings,
  Calendar,
  MapPin,
  MessageSquare,
  TrendingUp,
  Database,
  Wrench,
} from "lucide-react";

interface SidebarNavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles: string[];
}

interface SimplifiedSidebarNavProps {
  className?: string;
  defaultCollapsed?: boolean;
}

export const SimplifiedSidebarNav: React.FC<SimplifiedSidebarNavProps> = ({
  className,
  defaultCollapsed = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const location = useLocation();
  const { user } = useAppSelector((state) => state.auth);
  const { translations } = useAppSelector((state) => state.language);

  const navigationItems: SidebarNavItem[] = [
    {
      label: translations.nav.home,
      path: "/",
      icon: <Home className="h-4 w-4" />,
      roles: [
        "CITIZEN",
        "WARD_OFFICER",
        "MAINTENANCE_TEAM",
        "ADMINISTRATOR",
        "GUEST",
      ],
    },
    {
      label: translations.nav.dashboard,
      path: "/dashboard",
      icon: <BarChart3 className="h-4 w-4" />,
      roles: ["CITIZEN", "WARD_OFFICER", "MAINTENANCE_TEAM", "ADMINISTRATOR"],
    },
    {
      label: translations.nav.complaints,
      path: "/complaints",
      icon: <FileText className="h-4 w-4" />,
      roles: ["CITIZEN", "WARD_OFFICER", "MAINTENANCE_TEAM", "ADMINISTRATOR"],
    },
    {
      label: translations?.dashboard?.pendingTasks || "My Tasks",
      path: "/tasks",
      icon: <Calendar className="h-4 w-4" />,
      roles: ["WARD_OFFICER", "MAINTENANCE_TEAM"],
    },
    {
      label: translations?.nav?.ward || "Ward Management",
      path: "/ward",
      icon: <MapPin className="h-4 w-4" />,
      roles: ["WARD_OFFICER"],
    },
    {
      label: translations?.nav?.maintenance || "Maintenance",
      path: "/maintenance",
      icon: <Wrench className="h-4 w-4" />,
      roles: ["MAINTENANCE_TEAM"],
    },
    {
      label: translations?.messages?.complaintRegistered || "Communication",
      path: "/messages",
      icon: <MessageSquare className="h-4 w-4" />,
      roles: ["WARD_OFFICER", "MAINTENANCE_TEAM"],
    },
    {
      label: translations.nav.reports,
      path: "/reports",
      icon: <TrendingUp className="h-4 w-4" />,
      roles: ["WARD_OFFICER", "ADMINISTRATOR"],
    },
    {
      label: translations.nav.users,
      path: "/admin/users",
      icon: <Users className="h-4 w-4" />,
      roles: ["ADMINISTRATOR"],
    },
    {
      label: translations?.settings?.generalSettings || "System Config",
      path: "/admin/config",
      icon: <Database className="h-4 w-4" />,
      roles: ["ADMINISTRATOR"],
    },
    {
      label: translations?.dashboard?.analytics || "Analytics",
      path: "/admin/analytics",
      icon: <TrendingUp className="h-4 w-4" />,
      roles: ["ADMINISTRATOR"],
    },
    {
      label: translations?.nav?.settings || "Settings",
      path: "/settings",
      icon: <Settings className="h-4 w-4" />,
      roles: ["CITIZEN", "WARD_OFFICER", "MAINTENANCE_TEAM", "ADMINISTRATOR"],
    },
  ];

  const filteredNavItems = navigationItems.filter(
    (item) => !user || item.roles.includes(user.role as string),
  );

  const isActiveRoute = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div
      className={cn(
        "bg-white border-r border-gray-200 shadow-sm transition-all duration-300 ease-in-out flex flex-col h-full",
        isCollapsed ? "w-16" : "w-64",
        className,
      )}
    >
      {/* Header with toggle button only */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <h2 className="text-sm font-semibold text-gray-700 tracking-wide uppercase">
            Navigation
          </h2>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 hover:bg-gray-100 ml-auto"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {filteredNavItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group",
              isActiveRoute(item.path)
                ? "bg-primary text-white shadow-md"
                : "text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm",
              isCollapsed ? "justify-center" : "justify-start"
            )}
            title={isCollapsed ? item.label : undefined}
          >
            <span className="flex-shrink-0">
              {item.icon}
            </span>
            {!isCollapsed && (
              <span className="ml-3 truncate">
                {item.label}
              </span>
            )}
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default SimplifiedSidebarNav;
