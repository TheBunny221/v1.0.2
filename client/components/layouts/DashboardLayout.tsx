import React from "react";
import SidebarNav from "../ui/sidebar-nav";
import { cn } from "../../lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
  sidebarCollapsed?: boolean;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  className,
  sidebarCollapsed = false,
}) => {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Navigation */}
      <div className="sticky top-0 h-screen overflow-y-auto">
        <SidebarNav defaultCollapsed={sidebarCollapsed} />
      </div>

      {/* Main Content */}
      <main className={cn("flex-1 p-6 overflow-auto", className)}>
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
