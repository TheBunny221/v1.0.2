import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { logout } from "../store/slices/authSlice";
import { setLanguage } from "../store/slices/languageSlice";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import {
  Home,
  FileText,
  BarChart3,
  Users,
  Settings,
  LogOut,
  Menu,
  Bell,
  Globe,
  User,
  Wrench,
  Shield,
  MapPin,
  MessageSquare,
  Calendar,
  TrendingUp,
  Database,
  UserCheck,
  AlertTriangle,
} from "lucide-react";

type UserRole =
  | "CITIZEN"
  | "WARD_OFFICER"
  | "MAINTENANCE_TEAM"
  | "ADMINISTRATOR"
  | "GUEST";

interface NavigationItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles: UserRole[];
  badge?: number;
}

const Navigation: React.FC = () => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { translations, currentLanguage } = useAppSelector(
    (state) => state.language,
  );
  const { notifications } = useAppSelector((state) => state.ui);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navigationItems: NavigationItem[] = [
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
  ];

  const filteredNavItems = navigationItems.filter(
    (item) => !user || item.roles.includes(user.role as UserRole),
  );

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleLanguageChange = (language: "en" | "hi" | "ml") => {
    dispatch(setLanguage(language));
  };

  const getUnreadNotificationCount = () => {
    return notifications.filter((n) => !n.isRead).length;
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMINISTRATOR":
        return "bg-red-100 text-red-800";
      case "WARD_OFFICER":
        return "bg-blue-100 text-blue-800";
      case "MAINTENANCE_TEAM":
        return "bg-green-100 text-green-800";
      case "CITIZEN":
        return "bg-gray-100 text-gray-800";
      case "GUEST":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!isAuthenticated) {
    return (
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-primary" />
                <span className="text-xl font-bold text-gray-900 hidden sm:inline">
                  Cochin Smart City
                </span>
                <span className="text-lg font-bold text-gray-900 sm:hidden">
                  CSC
                </span>
              </Link>
            </div>

            {/* Mobile menu button for unauthenticated users */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>

            {/* Desktop Navigation for unauthenticated users */}
            <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Globe className="h-4 w-4 mr-1 lg:mr-2" />
                    <span className="hidden lg:inline">{currentLanguage.toUpperCase()}</span>
                    <span className="lg:hidden">{currentLanguage}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleLanguageChange("en")}>
                    English
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleLanguageChange("hi")}>
                    हिंदी
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleLanguageChange("ml")}>
                    മלയാളം
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Link to="/login">
                <Button variant="outline" size="sm">
                  <span className="hidden lg:inline">{translations.nav.login}</span>
                  <span className="lg:hidden">Login</span>
                </Button>
              </Link>
              <Link to="/complaint">
                <Button variant="outline" size="sm">
                  <span className="hidden lg:inline">Submit Complaint</span>
                  <span className="lg:hidden">Complaint</span>
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm">
                  <span className="hidden lg:inline">{translations.nav.register}</span>
                  <span className="lg:hidden">Register</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Mobile Navigation Menu for unauthenticated users */}
          {isMobileMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 border-t border-gray-200 bg-white">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-center mb-3">
                      <Globe className="h-4 w-4 mr-2" />
                      {currentLanguage.toUpperCase()}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleLanguageChange("en")}>
                      English
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleLanguageChange("hi")}>
                      हिंदी
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleLanguageChange("ml")}>
                      മലयാळം
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Link
                  to="/login"
                  className="block"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Button variant="outline" className="w-full">
                    {translations.nav.login}
                  </Button>
                </Link>
                <Link
                  to="/complaint"
                  className="block"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Button variant="outline" className="w-full">
                    Submit Complaint
                  </Button>
                </Link>
                <Link
                  to="/register"
                  className="block"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Button className="w-full">
                    {translations.nav.register}
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-gray-900 hidden sm:inline">
                Cochin Smart City
              </span>
              <span className="text-lg font-bold text-gray-900 sm:hidden">
                CSC
              </span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {filteredNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors relative ${
                  location.pathname === item.path
                    ? "bg-primary text-primary-foreground"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center space-x-2">
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <Badge
                      variant="destructive"
                      className="h-5 w-5 p-0 flex items-center justify-center text-xs"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-5 w-5" />
                  {getUnreadNotificationCount() > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                    >
                      {getUnreadNotificationCount()}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="p-2">
                  <h3 className="font-semibold text-sm mb-2">
                    {translations?.auth?.notifications || "Notifications"}
                  </h3>
                  {notifications.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      {translations?.common?.noData || "No notifications"}
                    </p>
                  ) : (
                    notifications.slice(0, 5).map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-2 rounded-md mb-2 ${
                          notification.isRead ? "bg-gray-50" : "bg-blue-50"
                        }`}
                      >
                        <p className="text-sm font-medium">
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-600">
                          {notification.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Globe className="h-4 w-4 mr-1 lg:mr-2" />
                  <span className="hidden lg:inline">{currentLanguage.toUpperCase()}</span>
                  <span className="lg:hidden">{currentLanguage}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleLanguageChange("en")}>
                  English
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleLanguageChange("hi")}>
                  हिंदी
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleLanguageChange("ml")}>
                  മലയാളം
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2" size="sm">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback>
                      {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden lg:block text-left">
                    <p className="text-sm font-medium">{user?.fullName}</p>
                    <Badge
                      className={`text-xs ${getRoleColor(user?.role || "")}`}
                    >
                      {user?.role?.replace("_", " ")}
                    </Badge>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    {translations?.nav?.profile || "Profile"}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="flex items-center">
                    <Settings className="h-4 w-4 mr-2" />
                    {translations.nav.settings}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {translations.nav.logout}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 border-t border-gray-200 bg-white">
            {filteredNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  location.pathname === item.path
                    ? "bg-primary text-primary-foreground"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div className="flex items-center space-x-3">
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <Badge
                      variant="destructive"
                      className="h-5 w-5 p-0 flex items-center justify-center text-xs ml-auto"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </div>
              </Link>
            ))}

            {/* Mobile user menu items */}
            <div className="border-t border-gray-200 pt-3">
              <Link
                to="/profile"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div className="flex items-center space-x-3">
                  <User className="h-4 w-4" />
                  <span>{translations.nav.profile}</span>
                </div>
              </Link>
              <Link
                to="/settings"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div className="flex items-center space-x-3">
                  <Settings className="h-4 w-4" />
                  <span>{translations.nav.settings}</span>
                </div>
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
              >
                <div className="flex items-center space-x-3">
                  <LogOut className="h-4 w-4" />
                  <span>{translations.nav.logout}</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
