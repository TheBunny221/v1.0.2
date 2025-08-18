import React from "react";
import Navigation from "../Navigation";
import SimplifiedSidebarNav from "../ui/simplified-sidebar-nav";
import { cn } from "../../lib/utils";

interface UnifiedLayoutProps {
  children: React.ReactNode;
  className?: string;
  sidebarCollapsed?: boolean;
}

export const UnifiedLayout: React.FC<UnifiedLayoutProps> = ({
  children,
  className,
  sidebarCollapsed = false,
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <Navigation />
      
      <div className="flex">
        {/* Sidebar Navigation */}
        <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
          <SidebarNav defaultCollapsed={sidebarCollapsed} />
        </div>
        
        {/* Main Content */}
        <main className={cn(
          "flex-1 p-6 overflow-auto",
          className
        )}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default UnifiedLayout;
