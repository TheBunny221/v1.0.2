import React from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { logout } from "../store/slices/authSlice";
import { setLanguage } from "../store/slices/languageSlice";
import { toggleSidebar, setSidebarOpen } from "../store/slices/uiSlice";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Bell,
  User as UserIcon,
  Settings,
  LogOut,
  Menu,
  X,
  FileText,
  Users,
  BarChart3,
  MapPin,
  Wrench,
  Clock,
  MessageSquare,
} from "lucide-react";

import type { User } from "../store/slices/authSlice";

interface LayoutProps {
  userRole?: User["role"];
}

const Layout: React.FC<LayoutProps> = ({ userRole }) => {
  const dispatch = useAppDispatch();
  const location = useLocation();

  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { translations, currentLanguage } = useAppSelector(
    (state) => state.language,
  );
  const { isSidebarOpen, notifications } = useAppSelector((state) => state.ui);

  // Use authenticated user's role if available, otherwise fall back to prop
  const effectiveUserRole = user?.role || userRole || "citizen";
  const unreadNotifications = notifications.filter((n) => !n.isRead).length;

  // Return loading state if translations are not yet loaded
  if (!translations || !translations.nav || !translations.complaints) {
    return (
      <div className="min-h-screen bg-background">
        <div className="text-center py-8">
          <p>Loading translations...</p>
        </div>
      </div>
    );
  }

  const getNavigationItems = () => {
    switch (effectiveUserRole) {
      case "citizen":
        return [
          {
            path: "/",
            label: translations.complaints.registerComplaint,
            icon: FileText,
          },
          {
            path: "/my-complaints",
            label: translations.complaints.myComplaints,
            icon: MessageSquare,
          },
          {
            path: "/reopen-complaint",
            label: translations.complaints.reopenComplaint,
            icon: Clock,
          },
          {
            path: "/track-status",
            label: translations.complaints.trackStatus,
            icon: MapPin,
          },
          {
            path: "/feedback",
            label: translations.complaints.feedback,
            icon: MessageSquare,
          },
        ];
      case "ADMINISTRATOR":
        return [
          {
            path: "/admin",
            label: translations.nav.dashboard,
            icon: BarChart3,
          },
          {
            path: "/admin/complaints",
            label: translations.nav.complaints + " Management",
            icon: FileText,
          },
          {
            path: "/admin/users",
            label: translations.nav.users + " Management",
            icon: Users,
          },
          {
            path: "/admin/reports",
            label: translations.nav.reports,
            icon: BarChart3,
          },
        ];
      case "WARD_OFFICER":
        return [
          {
            path: "/ward",
            label: "My Zone " + translations.nav.dashboard,
            icon: BarChart3,
          },
          {
            path: "/ward/review",
            label: translations.nav.complaints + " Review",
            icon: FileText,
          },
          { path: "/ward/forward", label: "Forwarding Panel", icon: MapPin },
        ];
      case "MAINTENANCE_TEAM":
        return [
          {
            path: "/maintenance",
            label: "Assigned " + translations.nav.complaints,
            icon: FileText,
          },
          { path: "/maintenance/update", label: "Update Status", icon: Wrench },
          { path: "/maintenance/sla", label: "SLA Tracking", icon: Clock },
        ];
      default:
        return [];
    }
  };

  const navigationItems = getNavigationItems();

  const getRoleLabel = () => {
    switch (effectiveUserRole) {
      case "citizen":
        return "Citizen Portal";
      case "ADMINISTRATOR":
        return "Admin " + translations.nav.dashboard;
      case "WARD_OFFICER":
        return "Ward Officer Portal";
      case "MAINTENANCE_TEAM":
        return "Maintenance Team";
      default:
        return "Portal";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border shadow-sm">
        <div className="flex items-center justify-between h-16 px-4 lg:px-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dispatch(toggleSidebar())}
              className="lg:hidden"
            >
              {isSidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-semibold text-foreground">
                  CitizenConnect
                </h1>
                <p className="text-sm text-muted-foreground">
                  {getRoleLabel()}
                </p>
              </div>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {/* Language Toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  {currentLanguage.toUpperCase()}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => dispatch(setLanguage("en"))}>
                  English
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => dispatch(setLanguage("hi"))}>
                  हिन्दी
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => dispatch(setLanguage("ml"))}>
                  മലയാളം
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadNotifications > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-destructive">
                      {unreadNotifications}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="px-3 py-2 border-b">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Notifications</span>
                    <Badge variant="secondary" className="text-xs">
                      {unreadNotifications} unread
                    </Badge>
                  </div>
                </div>
                <div className="max-h-80 overflow-auto">
                  {unreadNotifications === 0 &&
                  notifications.filter((n) => !n.isRead).length === 0 &&
                  notifications.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground">
                      No notifications
                    </div>
                  ) : (
                    notifications.slice(0, 10).map((n) => (
                      <DropdownMenuItem
                        key={n.id}
                        className="flex flex-col items-start gap-1"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span
                            className={`text-sm ${n.isRead ? "text-muted-foreground" : "font-medium"}`}
                          >
                            {n.title}
                          </span>
                          {!n.isRead && (
                            <Badge className="ml-2" variant="outline">
                              New
                            </Badge>
                          )}
                        </div>
                        {n.message && (
                          <span className="text-xs text-muted-foreground line-clamp-2">
                            {n.message}
                          </span>
                        )}
                        <div className="flex gap-2 mt-1">
                          {!n.isRead && (
                            <button
                              className="text-xs text-primary hover:underline"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                dispatch(markNotificationAsRead(n.id));
                              }}
                            >
                              Mark as read
                            </button>
                          )}
                          <button
                            className="text-xs text-destructive hover:underline"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              dispatch(removeNotification(n.id));
                            }}
                          >
                            Dismiss
                          </button>
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}
                </div>
                <div className="px-3 py-2 border-t flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => dispatch(markAllNotificationsAsRead())}
                  >
                    Mark all as read
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dispatch(clearNotifications())}
                  >
                    Clear
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* UserIcon Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <UserIcon className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center">
                    <UserIcon className="h-4 w-4 mr-2" />
                    {translations.nav.profile}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="flex items-center">
                    <Settings className="h-4 w-4 mr-2" />
                    {translations.nav.settings}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => dispatch(logout())}>
                  <LogOut className="h-4 w-4 mr-2" />
                  {translations.nav.logout}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-border transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:block`}
        >
          <div className="flex flex-col h-full pt-16 lg:pt-0">
            <nav className="flex-1 px-4 py-4 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                    onClick={() => dispatch(setSidebarOpen(false))}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
            onClick={() => dispatch(setSidebarOpen(false))}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 lg:pl-0">
          <div className="p-4 lg:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
