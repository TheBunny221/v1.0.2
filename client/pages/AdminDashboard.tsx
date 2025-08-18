import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { fetchComplaints } from "../store/slices/complaintsSlice";
import {
  useGetDashboardAnalyticsQuery,
  useGetRecentActivityQuery,
  useGetDashboardStatsQuery,
} from "../store/api/adminApi";
import DashboardLayout from "../components/layouts/DashboardLayout";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  Shield,
  Users,
  FileText,
  Settings,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Calendar,
  BarChart3,
  UserCheck,
  Database,
  MessageSquare,
  Activity,
  Target,
} from "lucide-react";

const AdminDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { translations } = useAppSelector((state) => state.language);

  // Fetch real-time data using API queries
  const {
    data: dashboardStats,
    isLoading: statsLoading,
    error: statsError,
  } = useGetDashboardStatsQuery();

  const {
    data: analyticsData,
    isLoading: analyticsLoading,
    error: analyticsError,
  } = useGetDashboardAnalyticsQuery();

  const {
    data: recentActivityData,
    isLoading: activityLoading,
    error: activityError,
  } = useGetRecentActivityQuery({ limit: 5 });

  const systemStats = dashboardStats?.data || {
    totalComplaints: 0,
    totalUsers: 0,
    activeComplaints: 0,
    resolvedComplaints: 0,
    overdue: 0,
    wardOfficers: 0,
    maintenanceTeam: 0,
  };

  const analytics = analyticsData?.data;
  const recentActivity = recentActivityData?.data || [];
  const isLoading = statsLoading || analyticsLoading || activityLoading;

  // Use real data from APIs with fallbacks
  const complaintTrends = analytics?.complaintTrends || [];
  const complaintsByType = analytics?.complaintsByType || [];
  const wardPerformance = analytics?.wardPerformance || [];
  const metrics = analytics?.metrics || {
    avgResolutionTime: 0,
    slaCompliance: 0,
    citizenSatisfaction: 0,
    resolutionRate: 0,
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Loading dashboard data...</div>
      </div>
    );
  }

  // Show error state
  if (statsError || analyticsError || activityError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-red-600">
          Error loading dashboard data. Please try refreshing the page.
        </div>
      </div>
    );
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "complaint":
        return <FileText className="h-4 w-4 text-blue-600" />;
      case "resolution":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "assignment":
        return <UserCheck className="h-4 w-4 text-orange-600" />;
      case "user":
        return <Users className="h-4 w-4 text-purple-600" />;
      case "alert":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Administrator Dashboard
              </h1>
              <p className="text-purple-100">
                Complete system overview and management controls for Cochin
                Smart City
              </p>
            </div>
            <Shield className="h-16 w-16 text-purple-200" />
          </div>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-purple-700 rounded-lg p-3">
              <div className="text-2xl font-bold">
                {systemStats.totalComplaints}
              </div>
              <div className="text-sm text-purple-200">Total Complaints</div>
            </div>
            <div className="bg-purple-700 rounded-lg p-3">
              <div className="text-2xl font-bold">
                {systemStats.wardOfficers + systemStats.maintenanceTeam}
              </div>
              <div className="text-sm text-purple-200">Active Users</div>
            </div>
            <div className="bg-purple-700 rounded-lg p-3">
              <div className="text-2xl font-bold">{metrics.slaCompliance}%</div>
              <div className="text-sm text-purple-200">SLA Compliance</div>
            </div>
            <div className="bg-purple-700 rounded-lg p-3">
              <div className="text-2xl font-bold">
                {metrics.citizenSatisfaction}/5
              </div>
              <div className="text-sm text-purple-200">Satisfaction</div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Complaints
              </CardTitle>
              <FileText className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {systemStats.activeComplaints}
              </div>
              <p className="text-xs text-muted-foreground">
                Pending resolution
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Overdue Tasks
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {systemStats.overdue}
              </div>
              <p className="text-xs text-muted-foreground">Past deadline</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                System Users
              </CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {systemStats.wardOfficers + systemStats.maintenanceTeam}
              </div>
              <p className="text-xs text-muted-foreground">
                {systemStats.wardOfficers} officers,{" "}
                {systemStats.maintenanceTeam} maintenance
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg Resolution
              </CardTitle>
              <Clock className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {metrics.avgResolutionTime}d
              </div>
              <p className="text-xs text-muted-foreground">Target: 3 days</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Complaint Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Complaint Trends (Last 6 Months)</CardTitle>
                </CardHeader>
                <CardContent>
                  {complaintTrends.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={complaintTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="complaints"
                          stroke="#3B82F6"
                          strokeWidth={2}
                          name="Complaints"
                        />
                        <Line
                          type="monotone"
                          dataKey="resolved"
                          stroke="#10B981"
                          strokeWidth={2}
                          name="Resolved"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-gray-500">
                      No complaint trend data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Complaints by Type */}
              <Card>
                <CardHeader>
                  <CardTitle>Complaints by Type</CardTitle>
                </CardHeader>
                <CardContent>
                  {complaintsByType.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={complaintsByType}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={120}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {complaintsByType.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [value, "Count"]} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        {complaintsByType.map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-2"
                          >
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: item.color }}
                            ></div>
                            <span className="text-sm">
                              {item.name} ({item.value})
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-gray-500">
                      No complaint type data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Recent System Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                      >
                        {getActivityIcon(activity.type)}
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {activity.message}
                          </p>
                          <p className="text-xs text-gray-500">
                            {activity.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-gray-500">
                    No recent activity available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Ward Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Ward Performance Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  {wardPerformance.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={wardPerformance}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="ward" />
                        <YAxis />
                        <Tooltip />
                        <Bar
                          dataKey="complaints"
                          fill="#3B82F6"
                          name="Complaints"
                        />
                        <Bar
                          dataKey="resolved"
                          fill="#10B981"
                          name="Resolved"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-gray-500">
                      No ward performance data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* SLA Compliance */}
              <Card>
                <CardHeader>
                  <CardTitle>SLA Compliance by Ward</CardTitle>
                </CardHeader>
                <CardContent>
                  {wardPerformance.length > 0 ? (
                    <div className="space-y-4">
                      {wardPerformance.map((ward, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">
                              {ward.ward}
                            </span>
                            <span className="text-sm text-gray-600">
                              {ward.sla}%
                            </span>
                          </div>
                          <Progress value={ward.sla} className="h-2" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-gray-500">
                      No ward performance data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Response Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {(metrics.avgResolutionTime * 24).toFixed(1)}h
                  </div>
                  <p className="text-sm text-gray-600">Average response time</p>
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Target: 24h</span>
                      <span>
                        {metrics.avgResolutionTime < 1
                          ? "On target"
                          : "Needs improvement"}
                      </span>
                    </div>
                    <Progress
                      value={Math.min(
                        (1 / Math.max(metrics.avgResolutionTime, 0.1)) * 100,
                        100,
                      )}
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Resolution Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {metrics.resolutionRate}%
                  </div>
                  <p className="text-sm text-gray-600">Complaints resolved</p>
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Resolution rate</span>
                      <span>
                        {metrics.resolutionRate >= 90 ? "Excellent" : "Good"}
                      </span>
                    </div>
                    <Progress value={metrics.resolutionRate} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Satisfaction Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-600">
                    {metrics.citizenSatisfaction}/5
                  </div>
                  <p className="text-sm text-gray-600">Citizen feedback</p>
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Target: 4.0</span>
                      <span>
                        {metrics.citizenSatisfaction >= 4.0
                          ? "Above target"
                          : "Below target"}
                      </span>
                    </div>
                    <Progress
                      value={(metrics.citizenSatisfaction / 5) * 100}
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link to="/admin/users" className="block">
                    <Button className="w-full justify-start">
                      <Users className="h-4 w-4 mr-2" />
                      Manage Users (
                      {systemStats.wardOfficers + systemStats.maintenanceTeam})
                    </Button>
                  </Link>
                  <Link to="/admin/users?role=WARD_OFFICER" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <UserCheck className="h-4 w-4 mr-2" />
                      Ward Officers ({systemStats.wardOfficers})
                    </Button>
                  </Link>
                  <Link
                    to="/admin/users?role=MAINTENANCE_TEAM"
                    className="block"
                  >
                    <Button variant="outline" className="w-full justify-start">
                      <Settings className="h-4 w-4 mr-2" />
                      Maintenance Team ({systemStats.maintenanceTeam})
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Active Users (24h)</span>
                      <Badge variant="secondary">32</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">New Registrations (7d)</span>
                      <Badge variant="secondary">5</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Login Success Rate</span>
                      <Badge variant="secondary">98.7%</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link to="/admin/config" className="block">
                    <Button className="w-full justify-start">
                      <Database className="h-4 w-4 mr-2" />
                      System Settings
                    </Button>
                  </Link>
                  <Link to="/admin/config/wards" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <MapPin className="h-4 w-4 mr-2" />
                      Ward Management
                    </Button>
                  </Link>
                  <Link to="/admin/config/types" className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      Complaint Types
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Database Status</span>
                      <Badge className="bg-green-100 text-green-800">
                        Healthy
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Email Service</span>
                      <Badge className="bg-green-100 text-green-800">
                        Operational
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">File Storage</span>
                      <Badge className="bg-yellow-100 text-yellow-800">
                        85% Used
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">API Response</span>
                      <Badge className="bg-green-100 text-green-800">
                        Fast (120ms)
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Administrative Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Link to="/admin/users/new">
                <Button variant="outline" className="w-full">
                  <Users className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </Link>
              <Link to="/reports">
                <Button variant="outline" className="w-full">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </Link>
              <Link to="/admin/config">
                <Button variant="outline" className="w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  System Config
                </Button>
              </Link>
              <Link to="/admin/analytics">
                <Button variant="outline" className="w-full">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
