import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { logout } from '@/store/slices/authSlice';
import { setLanguage } from '@/store/slices/languageSlice';
import { toggleSidebar, setSidebarOpen } from '@/store/slices/uiSlice';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Bell,
  User,
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
} from 'lucide-react';

import type { UserRole } from '@/store/slices/authSlice';

interface LayoutProps {
  children: React.ReactNode;
  userRole?: UserRole;
}

const Layout: React.FC<LayoutProps> = ({ children, userRole }) => {
  const dispatch = useAppDispatch();
  const location = useLocation();

  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { translations, currentLanguage } = useAppSelector((state) => state.language);
  const { sidebarOpen, notifications } = useAppSelector((state) => state.ui);

  // Use authenticated user's role if available, otherwise fall back to prop
  const effectiveUserRole = user?.role || userRole || 'citizen';
  const unreadNotifications = notifications.filter(n => !n.read).length;

  const getNavigationItems = () => {
    switch (effectiveUserRole) {
      case 'citizen':
        return [
          { path: '/', label: 'Register Complaint', icon: FileText },
          { path: '/my-complaints', label: 'My Complaints', icon: MessageSquare },
          { path: '/reopen-complaint', label: 'Reopen Complaint', icon: Clock },
          { path: '/track-status', label: 'Track Status', icon: MapPin },
          { path: '/feedback', label: 'Feedback', icon: MessageSquare },
        ];
      case 'admin':
        return [
          { path: '/admin', label: 'Dashboard', icon: BarChart3 },
          { path: '/admin/complaints', label: 'Complaint Management', icon: FileText },
          { path: '/admin/users', label: 'User Management', icon: Users },
          { path: '/admin/reports', label: 'Reports', icon: BarChart3 },
        ];
      case 'ward-officer':
        return [
          { path: '/ward', label: 'My Zone Dashboard', icon: BarChart3 },
          { path: '/ward/review', label: 'Complaint Review', icon: FileText },
          { path: '/ward/forward', label: 'Forwarding Panel', icon: MapPin },
        ];
      case 'maintenance':
        return [
          { path: '/maintenance', label: 'Assigned Complaints', icon: FileText },
          { path: '/maintenance/update', label: 'Update Status', icon: Wrench },
          { path: '/maintenance/sla', label: 'SLA Tracking', icon: Clock },
        ];
      default:
        return [];
    }
  };

  const navigationItems = getNavigationItems();

  const getRoleLabel = () => {
    switch (userRole) {
      case 'citizen': return 'Citizen Portal';
      case 'admin': return 'Admin Dashboard';
      case 'ward-officer': return 'Ward Officer Portal';
      case 'maintenance': return 'Maintenance Team';
      default: return 'Portal';
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
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-semibold text-foreground">CitizenConnect</h1>
                <p className="text-sm text-muted-foreground">{getRoleLabel()}</p>
              </div>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {/* Language Toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  EN
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>English</DropdownMenuItem>
                <DropdownMenuItem>ह��न्दी</DropdownMenuItem>
                <DropdownMenuItem>മലയാളം</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-5 w-5" />
              {notifications > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-destructive">
                  {notifications}
                </Badge>
              )}
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-border transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:block`}>
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
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                    onClick={() => setSidebarOpen(false)}
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
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 lg:pl-0">
          <div className="p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
