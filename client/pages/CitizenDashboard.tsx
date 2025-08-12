import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import { useGetComplaintsQuery, useGetComplaintStatisticsQuery } from "../store/api/complaintsApi";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import {
  PlusCircle,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  MapPin,
  Calendar,
  TrendingUp,
} from "lucide-react";

const CitizenDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { complaints, isLoading } = useAppSelector((state) => state.complaints);
  const { translations } = useAppSelector((state) => state.language);

  const [dashboardStats, setDashboardStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    avgResolutionTime: 0,
  });

  useEffect(() => {
    if (user) {
      dispatch(fetchComplaints());
    }
  }, [dispatch, user]);

  useEffect(() => {
    // Calculate dashboard statistics
    const total = complaints.length;
    const pending = complaints.filter((c) => c.status === "REGISTERED").length;
    const inProgress = complaints.filter(
      (c) => c.status === "IN_PROGRESS",
    ).length;
    const resolved = complaints.filter((c) => c.status === "RESOLVED").length;

    setDashboardStats({
      total,
      pending,
      inProgress,
      resolved,
      avgResolutionTime: 3.2, // Mock data - calculate from actual data
    });
  }, [complaints]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "REGISTERED":
        return "bg-yellow-100 text-yellow-800";
      case "ASSIGNED":
        return "bg-blue-100 text-blue-800";
      case "IN_PROGRESS":
        return "bg-orange-100 text-orange-800";
      case "RESOLVED":
        return "bg-green-100 text-green-800";
      case "CLOSED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "LOW":
        return "bg-green-100 text-green-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      case "HIGH":
        return "bg-orange-100 text-orange-800";
      case "CRITICAL":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const recentComplaints = complaints.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {user?.fullName}!
        </h1>
        <p className="text-blue-100">
          Track your complaints and stay updated with the latest progress.
        </p>
        <div className="mt-4">
          <Link to="/complaints/new">
            <Button className="bg-white text-blue-600 hover:bg-gray-100">
              <PlusCircle className="h-4 w-4 mr-2" />
              Register New Complaint
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Complaints
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.total}</div>
            <p className="text-xs text-muted-foreground">
              All time submissions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {dashboardStats.pending}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting assignment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {dashboardStats.inProgress}
            </div>
            <p className="text-xs text-muted-foreground">Being worked on</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {dashboardStats.resolved}
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully resolved
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Complaints and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Complaints */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Recent Complaints
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : recentComplaints.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No complaints yet</p>
                <Link to="/complaints/new">
                  <Button className="mt-2">
                    Register Your First Complaint
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentComplaints.map((complaint) => (
                  <div
                    key={complaint.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-sm">
                        {complaint.title ||
                          `Complaint #${complaint.id.slice(-6)}`}
                      </h3>
                      <div className="flex space-x-2">
                        <Badge className={getStatusColor(complaint.status)}>
                          {complaint.status.replace("_", " ")}
                        </Badge>
                        <Badge className={getPriorityColor(complaint.priority)}>
                          {complaint.priority}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {complaint.description}
                    </p>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-xs text-gray-500">
                        <MapPin className="h-3 w-3 mr-1" />
                        {complaint.area}
                        <Calendar className="h-3 w-3 ml-3 mr-1" />
                        {new Date(complaint.submittedOn).toLocaleDateString()}
                      </div>
                      <Link to={`/complaints/${complaint.id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
                {complaints.length > 5 && (
                  <div className="text-center">
                    <Link to="/complaints">
                      <Button variant="outline">View All Complaints</Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions & Progress */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/complaints/new" className="block">
                <Button className="w-full justify-start">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  New Complaint
                </Button>
              </Link>
              <Link to="/complaints" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  View All Complaints
                </Button>
              </Link>
              <Link to="/profile" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Update Profile
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Resolution Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resolution Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Overall Resolution Rate</span>
                  <span>
                    {dashboardStats.total > 0
                      ? Math.round(
                          (dashboardStats.resolved / dashboardStats.total) *
                            100,
                        )
                      : 0}
                    %
                  </span>
                </div>
                <Progress
                  value={
                    dashboardStats.total > 0
                      ? (dashboardStats.resolved / dashboardStats.total) * 100
                      : 0
                  }
                  className="h-2"
                />
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {dashboardStats.avgResolutionTime}
                </div>
                <p className="text-xs text-gray-500">
                  Average Resolution Time (days)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentComplaints.slice(0, 3).map((complaint) => (
                  <div
                    key={complaint.id}
                    className="flex items-center space-x-3"
                  >
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <div className="flex-1 text-sm">
                      <p className="text-gray-600">
                        Complaint #{complaint.id.slice(-6)} was{" "}
                        {complaint.status.toLowerCase().replace("_", " ")}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(complaint.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CitizenDashboard;
