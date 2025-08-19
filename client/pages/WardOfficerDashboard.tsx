import React, { useState } from "react";
import { useAppSelector } from "../store/hooks";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  AlertTriangle,
  Clock,
  Users,
  FileText,
} from "lucide-react";

const WardOfficerDashboard: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const { translations } = useAppSelector((state) => state.language);

  // Simple static data
  const [activeFilter, setActiveFilter] = useState<string>("all");
  
  const dashboardStats = {
    totalComplaints: 5,
    pendingAssignment: 2,
    assigned: 2,
    overdue: 1,
  };

  const handleFilterChange = (newFilter: string) => {
    setActiveFilter(newFilter);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Ward Officer Dashboard</h1>
        <p className="text-blue-100">
          Manage complaints for {user?.ward?.name || "your assigned ward"}
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card 
          className={`cursor-pointer transition-colors ${
            activeFilter === "all" ? "ring-2 ring-blue-500 bg-blue-50" : "hover:bg-gray-50"
          }`}
          onClick={() => handleFilterChange("all")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Complaints
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardStats.totalComplaints}
            </div>
            <p className="text-xs text-muted-foreground">
              All complaints in ward
            </p>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-colors ${
            activeFilter === "pendingAssignment" ? "ring-2 ring-yellow-500 bg-yellow-50" : "hover:bg-gray-50"
          }`}
          onClick={() => handleFilterChange("pendingAssignment")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Assignment
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {dashboardStats.pendingAssignment}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting assignment</p>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-colors ${
            activeFilter === "assigned" ? "ring-2 ring-blue-500 bg-blue-50" : "hover:bg-gray-50"
          }`}
          onClick={() => handleFilterChange("assigned")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {dashboardStats.assigned}
            </div>
            <p className="text-xs text-muted-foreground">Currently assigned</p>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-colors ${
            activeFilter === "overdue" ? "ring-2 ring-red-500 bg-red-50" : "hover:bg-gray-50"
          }`}
          onClick={() => handleFilterChange("overdue")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {dashboardStats.overdue}
            </div>
            <p className="text-xs text-muted-foreground">Past deadline</p>
          </CardContent>
        </Card>
      </div>

      {/* Basic Content */}
      <Card>
        <CardHeader>
          <CardTitle>
            Complaints Dashboard - {activeFilter}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Dashboard content will be implemented here.</p>
          <p>Current filter: <strong>{activeFilter}</strong></p>
          <p>This is a minimal version to test if the basic component works without API calls.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default WardOfficerDashboard;
