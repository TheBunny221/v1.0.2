import React from "react";
import { useAppSelector } from "../store/hooks";
import AdminDashboard from "../pages/AdminDashboard";
import CitizenDashboard from "../pages/CitizenDashboard";
import WardOfficerDashboard from "../pages/WardOfficerDashboard";
import MaintenanceTasks from "../pages/MaintenanceTasks";
import Unauthorized from "../pages/Unauthorized";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { AlertTriangle } from "lucide-react";

const RoleBasedDashboard: React.FC = () => {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { translations } = useAppSelector((state) => state.language);

  if (!isAuthenticated || !user) {
    return <Unauthorized />;
  }

  // Route to appropriate dashboard based on user role
  switch (user.role) {
    case "ADMINISTRATOR":
      return <AdminDashboard />;
    case "CITIZEN":
      return <CitizenDashboard />;
    case "WARD_OFFICER":
      return <WardOfficerDashboard />;
    case "MAINTENANCE_TEAM":
      return <MaintenanceTasks />;
    default:
      return (
        <div className="flex items-center justify-center min-h-screen p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <CardTitle className="text-xl">
                {translations?.messages?.unauthorizedAccess || "Unknown Role"}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600">
                {translations?.auth?.role || "Role"}:
                <Badge variant="outline" className="ml-2">
                  {user.role}
                </Badge>
              </p>
              <p className="text-sm text-gray-500">
                {translations?.messages?.unauthorizedAccess ||
                  "Your role is not recognized. Please contact system administrator."}
              </p>
            </CardContent>
          </Card>
        </div>
      );
  }
};

export default RoleBasedDashboard;
