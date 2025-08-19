import React from "react";
import Navigation from "../Navigation";
import SimplifiedSidebarNav from "../ui/simplified-sidebar-nav";
import { useAppSelector } from "../../store/hooks";
import { cn } from "../../lib/utils";

interface UnifiedLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const UnifiedLayout: React.FC<UnifiedLayoutProps> = ({
  children,
  className,
}) => {
  const { isSidebarCollapsed } = useAppSelector((state) => state.ui);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation - Fixed */}
      <Navigation />

      <div className="flex pt-16">
        {/* Sidebar Navigation - Only visible when authenticated */}
        {isAuthenticated && (
          <div className="hidden md:block sticky top-0 h-[calc(100vh-4rem)] overflow-y-auto">
            <SimplifiedSidebarNav />
          </div>
        )}

        {/* Main Content - Responsive margins */}
        <main
          className={cn(
            "flex-1 overflow-auto",
            "p-4 md:p-6", // Responsive padding
            "min-h-[calc(100vh-4rem)]", // Ensure full height
            className,
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default UnifiedLayout;
