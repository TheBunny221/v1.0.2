import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StatusChip from "@/components/StatusChip";
import {
  BarChart3,
  TrendingUp,
  Clock,
  AlertTriangle,
  Users,
  FileText,
  CheckCircle,
  XCircle,
  Calendar,
  MapPin,
  RefreshCw,
} from "lucide-react";

interface DashboardMetric {
  title: string;
  value: string;
  change: string;
  changeType: "increase" | "decrease" | "neutral";
  icon: React.ReactNode;
}

interface ComplaintByStatus {
  status: string;
  count: number;
  percentage: number;
  color: string;
}

interface RecentComplaint {
  id: string;
  type: string;
  submittedBy: string;
  ward: string;
  status: "registered" | "assigned" | "in-progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "critical";
  timeAgo: string;
  slaStatus: "ontime" | "warning" | "overdue";
}

const AdminDashboard: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("today");

  const metrics: DashboardMetric[] = [
    {
      title: "Total Complaints Today",
      value: "127",
      change: "+12%",
      changeType: "increase",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      title: "Resolved Today",
      value: "84",
      change: "+8%",
      changeType: "increase",
      icon: <CheckCircle className="h-5 w-5" />,
    },
    {
      title: "SLA Breaches",
      value: "15",
      change: "-3%",
      changeType: "decrease",
      icon: <AlertTriangle className="h-5 w-5" />,
    },
    {
      title: "Active Users",
      value: "2,341",
      change: "+5%",
      changeType: "increase",
      icon: <Users className="h-5 w-5" />,
    },
  ];

  const complaintsByStatus: ComplaintByStatus[] = [
    {
      status: "Registered",
      count: 45,
      percentage: 35,
      color: "bg-status-registered",
    },
    {
      status: "Assigned",
      count: 32,
      percentage: 25,
      color: "bg-status-assigned",
    },
    {
      status: "In Progress",
      count: 28,
      percentage: 22,
      color: "bg-status-progress",
    },
    {
      status: "Resolved",
      count: 23,
      percentage: 18,
      color: "bg-status-resolved",
    },
  ];

  const recentComplaints: RecentComplaint[] = [
    {
      id: "CMP-2024-001",
      type: "Water Supply",
      submittedBy: "John Doe",
      ward: "Ward 1",
      status: "assigned",
      priority: "high",
      timeAgo: "2 hours ago",
      slaStatus: "ontime",
    },
    {
      id: "CMP-2024-002",
      type: "Street Lighting",
      submittedBy: "Jane Smith",
      ward: "Ward 3",
      status: "in-progress",
      priority: "medium",
      timeAgo: "4 hours ago",
      slaStatus: "warning",
    },
    {
      id: "CMP-2024-003",
      type: "Garbage Collection",
      submittedBy: "Mike Johnson",
      ward: "Ward 2",
      status: "registered",
      priority: "critical",
      timeAgo: "6 hours ago",
      slaStatus: "overdue",
    },
    {
      id: "CMP-2024-004",
      type: "Road Repair",
      submittedBy: "Sarah Wilson",
      ward: "Ward 4",
      status: "resolved",
      priority: "low",
      timeAgo: "8 hours ago",
      slaStatus: "ontime",
    },
  ];

  const wardMetrics = [
    { ward: "Ward 1", complaints: 23, resolved: 18, slaCompliance: 85 },
    { ward: "Ward 2", complaints: 31, resolved: 24, slaCompliance: 77 },
    { ward: "Ward 3", complaints: 19, resolved: 16, slaCompliance: 94 },
    { ward: "Ward 4", complaints: 27, resolved: 21, slaCompliance: 81 },
    { ward: "Ward 5", complaints: 34, resolved: 28, slaCompliance: 88 },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getSlaStatusColor = (status: string) => {
    switch (status) {
      case "ontime":
        return "text-green-600";
      case "warning":
        return "text-yellow-600";
      case "overdue":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of complaint management system
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Tabs value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <TabsList>
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="week">This Week</TabsTrigger>
              <TabsTrigger value="month">This Month</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {metric.title}
                  </p>
                  <p className="text-2xl font-bold">{metric.value}</p>
                  <div className="flex items-center mt-1">
                    <span
                      className={`text-xs font-medium ${
                        metric.changeType === "increase"
                          ? "text-green-600"
                          : metric.changeType === "decrease"
                            ? "text-red-600"
                            : "text-gray-600"
                      }`}
                    >
                      {metric.change} from yesterday
                    </span>
                  </div>
                </div>
                <div className="text-primary">{metric.icon}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Complaints by Status */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Complaints by Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {complaintsByStatus.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                    <span className="font-medium">{item.status}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-2xl font-bold">{item.count}</span>
                    <div className="w-24">
                      <Progress value={item.percentage} className="h-2" />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* SLA Compliance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>SLA Compliance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">87%</div>
              <p className="text-sm text-muted-foreground mb-4">
                Overall compliance rate
              </p>
              <Progress value={87} className="mb-4" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>On Time</span>
                  <span className="text-green-600">234</span>
                </div>
                <div className="flex justify-between">
                  <span>Warning</span>
                  <span className="text-yellow-600">28</span>
                </div>
                <div className="flex justify-between">
                  <span>Overdue</span>
                  <span className="text-red-600">15</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Complaints */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Recent Complaints</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentComplaints.map((complaint, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-semibold">{complaint.id}</span>
                      <Badge
                        className={`h-2 w-2 p-0 ${getPriorityColor(complaint.priority)}`}
                      />
                    </div>
                    <p className="text-sm text-gray-600">{complaint.type}</p>
                    <p className="text-xs text-muted-foreground">
                      {complaint.submittedBy} • {complaint.ward}
                    </p>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <StatusChip status={complaint.status} />
                    <span
                      className={`text-xs ${getSlaStatusColor(complaint.slaStatus)}`}
                    >
                      {complaint.timeAgo}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Ward Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Ward Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {wardMetrics.map((ward, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{ward.ward}</span>
                    <span className="text-sm text-muted-foreground">
                      {ward.resolved}/{ward.complaints} resolved
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Progress
                      value={(ward.resolved / ward.complaints) * 100}
                      className="flex-1 h-2"
                    />
                    <span className="text-sm font-medium">
                      {ward.slaCompliance}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col">
              <FileText className="h-6 w-6 mb-2" />
              <span>New Complaint</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Users className="h-6 w-6 mb-2" />
              <span>Manage Users</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <BarChart3 className="h-6 w-6 mb-2" />
              <span>Generate Report</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <AlertTriangle className="h-6 w-6 mb-2" />
              <span>SLA Alerts</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
