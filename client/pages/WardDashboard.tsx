import React, { useState } from "react";
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
import StatusChip from "../components/StatusChip";
import {
  MapPin,
  BarChart3,
  FileText,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Users,
  RefreshCw,
} from "lucide-react";

interface ZoneMetric {
  title: string;
  value: string;
  change: string;
  changeType: "increase" | "decrease" | "neutral";
  icon: React.ReactNode;
}

interface ComplaintSummary {
  type: string;
  total: number;
  pending: number;
  resolved: number;
  overdue: number;
}

const WardDashboard: React.FC = () => {
  const [selectedWard] = useState("Ward 3");
  const [selectedPeriod, setSelectedPeriod] = useState("today");

  const zoneMetrics: ZoneMetric[] = [
    {
      title: "Total Complaints",
      value: "34",
      change: "+6%",
      changeType: "increase",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      title: "Pending Review",
      value: "12",
      change: "-2%",
      changeType: "decrease",
      icon: <Clock className="h-5 w-5" />,
    },
    {
      title: "Resolved Today",
      value: "8",
      change: "+12%",
      changeType: "increase",
      icon: <CheckCircle className="h-5 w-5" />,
    },
    {
      title: "SLA Breaches",
      value: "2",
      change: "same",
      changeType: "neutral",
      icon: <AlertTriangle className="h-5 w-5" />,
    },
  ];

  const complaintsByType: ComplaintSummary[] = [
    { type: "Water Supply", total: 12, pending: 4, resolved: 8, overdue: 1 },
    { type: "Street Lighting", total: 8, pending: 3, resolved: 5, overdue: 0 },
    {
      type: "Garbage Collection",
      total: 6,
      pending: 2,
      resolved: 4,
      overdue: 1,
    },
    { type: "Road Repair", total: 5, pending: 2, resolved: 3, overdue: 0 },
    { type: "Sewerage", total: 3, pending: 1, resolved: 2, overdue: 0 },
  ];

  const recentComplaints = [
    {
      id: "CMP-2024-045",
      type: "Water Supply",
      area: "Green Valley Society",
      status: "registered" as const,
      priority: "high" as const,
      submittedBy: "John Doe",
      timeAgo: "30 mins ago",
    },
    {
      id: "CMP-2024-046",
      type: "Street Lighting",
      area: "Main Street",
      status: "assigned" as const,
      priority: "medium" as const,
      submittedBy: "Jane Smith",
      timeAgo: "1 hour ago",
    },
    {
      id: "CMP-2024-047",
      type: "Garbage Collection",
      area: "Park View",
      status: "in-progress" as const,
      priority: "critical" as const,
      submittedBy: "Mike Johnson",
      timeAgo: "2 hours ago",
    },
  ];

  const slaPerformance = {
    onTime: 85,
    warning: 10,
    overdue: 5,
  };

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Ward Officer Dashboard</h1>
          <p className="text-muted-foreground">
            Managing complaints for {selectedWard}
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

      {/* Zone Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {zoneMetrics.map((metric, index) => (
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
        {/* Complaints by Type */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Complaints by Type</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {complaintsByType.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{item.type}</span>
                    <div className="flex space-x-4 text-sm">
                      <span>Total: {item.total}</span>
                      <span className="text-orange-600">
                        Pending: {item.pending}
                      </span>
                      <span className="text-green-600">
                        Resolved: {item.resolved}
                      </span>
                      {item.overdue > 0 && (
                        <span className="text-red-600">
                          Overdue: {item.overdue}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Progress
                      value={(item.resolved / item.total) * 100}
                      className="flex-1 h-2"
                    />
                    <span className="text-sm font-medium">
                      {Math.round((item.resolved / item.total) * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* SLA Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>SLA Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  {slaPerformance.onTime}%
                </div>
                <p className="text-sm text-muted-foreground">
                  On-time resolution
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                    <span className="text-sm">On Time</span>
                  </div>
                  <span className="font-medium">{slaPerformance.onTime}%</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                    <span className="text-sm">Warning</span>
                  </div>
                  <span className="font-medium">{slaPerformance.warning}%</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full" />
                    <span className="text-sm">Overdue</span>
                  </div>
                  <span className="font-medium">{slaPerformance.overdue}%</span>
                </div>
              </div>

              <Progress value={slaPerformance.onTime} className="mt-4" />
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
                      {complaint.area} • {complaint.submittedBy}
                    </p>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <StatusChip status={complaint.status} />
                    <span className="text-xs text-muted-foreground">
                      {complaint.timeAgo}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              <Button
                variant="outline"
                className="h-16 flex items-center justify-start space-x-3"
              >
                <FileText className="h-6 w-6" />
                <div className="text-left">
                  <div className="font-medium">Review Complaints</div>
                  <div className="text-xs text-muted-foreground">
                    12 pending review
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-16 flex items-center justify-start space-x-3"
              >
                <Users className="h-6 w-6" />
                <div className="text-left">
                  <div className="font-medium">Forward Complaints</div>
                  <div className="text-xs text-muted-foreground">
                    Assign to departments
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-16 flex items-center justify-start space-x-3"
              >
                <BarChart3 className="h-6 w-6" />
                <div className="text-left">
                  <div className="font-medium">Generate Report</div>
                  <div className="text-xs text-muted-foreground">
                    Zone performance
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-16 flex items-center justify-start space-x-3"
              >
                <AlertTriangle className="h-6 w-6" />
                <div className="text-left">
                  <div className="font-medium">SLA Alerts</div>
                  <div className="text-xs text-muted-foreground">
                    2 approaching deadline
                  </div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Areas Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Areas in {selectedWard}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              "Green Valley Society",
              "Main Street",
              "Park View",
              "City Center",
              "Industrial Area",
              "Residential Complex",
            ].map((area, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium">{area}</h4>
                  <Badge variant="secondary">
                    {Math.floor(Math.random() * 10) + 1}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {Math.floor(Math.random() * 5) + 1} active complaints
                </div>
                <Progress
                  value={Math.floor(Math.random() * 100)}
                  className="mt-2 h-1"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WardDashboard;
