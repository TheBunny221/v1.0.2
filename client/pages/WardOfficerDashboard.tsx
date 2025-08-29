import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import { useGetWardDashboardStatisticsQuery } from "../store/api/complaintsApi";
import ComplaintsListWidget from "../components/ComplaintsListWidget";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Checkbox } from "../components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  AlertTriangle,
  Clock,
  Users,
  BarChart3,
  CheckCircle,
  XCircle,
  TrendingUp,
  FileText,
  Settings,
  MessageSquare,
  Filter,
  Briefcase,
} from "lucide-react";

interface FilterState {
  mainFilter:
    | "none"
    | "pending"
    | "inProgress"
    | "completed"
    | "needsTeamAssignment";
  overdue: boolean;
  urgent: boolean;
}

const WardOfficerDashboard: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();

  // State for filters
  const [filters, setFilters] = useState<FilterState>({
    mainFilter: "pending",
    overdue: false,
    urgent: false,
  });

  // Fetch ward dashboard statistics
  const {
    data: statsResponse,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useGetWardDashboardStatisticsQuery();

  const stats = statsResponse?.data?.stats;

  // Build filter params for complaints query based on active filters
  const buildComplaintsFilter = () => {
    const filterParams: any = {};
    const statusFilters: string[] = [];
    const priorityFilters: string[] = [];

    // Main filter logic
    switch (filters.mainFilter) {
      case "pending":
        statusFilters.push("REGISTERED", "ASSIGNED"); //, "REOPEN"
        break;
      case "inProgress":
        statusFilters.push("IN_PROGRESS");
        break;
      case "completed":
        statusFilters.push("RESOLVED", "CLOSED");
        break;
      case "needsTeamAssignment":
        filterParams.needsTeamAssignment = true;
        break;
      default:
        // No main filter applied
        break;
    }

    // Additional filters
    if (filters.urgent) {
      priorityFilters.push("HIGH", "CRITICAL");
    }

    if (filters.overdue) {
      filterParams.slaStatus = "OVERDUE";
    }

    // Only add arrays if they have content
    if (statusFilters.length > 0) {
      filterParams.status = statusFilters;
    }
    if (priorityFilters.length > 0) {
      filterParams.priority = priorityFilters;
    }

    return filterParams;
  };

  // Calculate if we have active filters
  const hasActiveFilters =
    filters.mainFilter !== "none" || filters.overdue || filters.urgent;

  // Build complaints filter for the widget
  const complaintsFilter = buildComplaintsFilter();

  const handleMainFilterChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      mainFilter: value as FilterState["mainFilter"],
    }));
  };

  const handleFilterChange = (
    filterKey: keyof FilterState,
    checked: boolean,
  ) => {
    setFilters((prev) => ({
      ...prev,
      [filterKey]: checked,
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      mainFilter: "none",
      overdue: false,
      urgent: false,
    });
  };

  // Handle navigation to complaints page with filters
  const navigateToComplaints = (filterParams: any) => {
    const searchParams = new URLSearchParams();
    Object.entries(filterParams).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        searchParams.append(key, value.join(","));
      } else {
        searchParams.append(key, value.toString());
      }
    });
    navigate(`/complaints?${searchParams.toString()}`);
  };

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">Ward Officer Dashboard</h1>
          <p className="text-blue-100">Loading ward statistics...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="space-y-0 pb-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-red-600 to-red-800 rounded-lg p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">Ward Officer Dashboard</h1>
          <p className="text-red-100">Error loading ward statistics</p>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-500 mb-4">
              Failed to load dashboard data
            </p>
            <Button onClick={() => refetchStats()} className="w-full">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Ward Officer Dashboard</h1>
        <p className="text-blue-100">
          Manage complaints for {user?.ward?.name || "your assigned ward"} and
          monitor team performance.
        </p>
      </div>

      {/* Statistics Cards with Filters */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Filter by Status</h2>
        {filters.mainFilter !== "none" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setFilters((prev) => ({ ...prev, mainFilter: "none" }))
            }
          >
            Clear Filter
          </Button>
        )}
      </div>
      <RadioGroup
        value={filters.mainFilter}
        onValueChange={handleMainFilterChange}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card
            className={`cursor-pointer transition-all hover:shadow-md ${
              filters.mainFilter === "pending"
                ? "ring-2 ring-blue-500 bg-blue-50"
                : ""
            }`}
            onClick={() =>
              handleMainFilterChange(
                filters.mainFilter === "pending" ? "none" : "pending",
              )
            }
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    id="pending-filter"
                    value="pending"
                    className="sr-only"
                  />
                  <span className="cursor-pointer">Pending Work</span>
                </div>
              </CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats?.summary.pendingWork || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Registered + Assigned
              </p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all hover:shadow-md ${
              filters.mainFilter === "inProgress"
                ? "ring-2 ring-orange-500 bg-orange-50"
                : ""
            }`}
            onClick={() =>
              handleMainFilterChange(
                filters.mainFilter === "inProgress" ? "none" : "inProgress",
              )
            }
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    id="progress-filter"
                    value="inProgress"
                    className="sr-only"
                  />
                  <span className="cursor-pointer">In Progress</span>
                </div>
              </CardTitle>
              <Settings className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats?.summary.activeWork || 0}
              </div>
              <p className="text-xs text-muted-foreground">Active complaints</p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all hover:shadow-md ${
              filters.mainFilter === "completed"
                ? "ring-2 ring-green-500 bg-green-50"
                : ""
            }`}
            onClick={() =>
              handleMainFilterChange(
                filters.mainFilter === "completed" ? "none" : "completed",
              )
            }
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    id="completed-filter"
                    value="completed"
                    className="sr-only"
                  />
                  <span className="cursor-pointer">Completed</span>
                </div>
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats?.summary.completedWork || 0}
              </div>
              <p className="text-xs text-muted-foreground">Resolved + Closed</p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all hover:shadow-md ${
              filters.mainFilter === "needsTeamAssignment"
                ? "ring-2 ring-purple-500 bg-purple-50"
                : ""
            }`}
            onClick={() =>
              handleMainFilterChange(
                filters.mainFilter === "needsTeamAssignment"
                  ? "none"
                  : "needsTeamAssignment",
              )
            }
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    id="team-assignment-filter"
                    value="needsTeamAssignment"
                    className="sr-only"
                  />
                  <span className="cursor-pointer">Needs Team Assignment</span>
                </div>
              </CardTitle>
              <Briefcase className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {stats?.summary.needsTeamAssignment || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                To assign to maintenance
              </p>
            </CardContent>
          </Card>
        </div>
      </RadioGroup>

      {/* Additional Filter Options
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Additional Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="overdue-filter"
                checked={filters.overdue}
                onCheckedChange={(checked) =>
                  handleFilterChange("overdue", checked as boolean)
                }
              />
              <label
                htmlFor="overdue-filter"
                className="cursor-pointer flex items-center"
              >
                <AlertTriangle className="h-4 w-4 mr-1 text-red-600" />
                Overdue ({stats?.summary.overdueComplaints || 0})
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="urgent-filter"
                checked={filters.urgent}
                onCheckedChange={(checked) =>
                  handleFilterChange("urgent", checked as boolean)
                }
              />
              <label
                htmlFor="urgent-filter"
                className="cursor-pointer flex items-center"
              >
                <AlertTriangle className="h-4 w-4 mr-1 text-orange-600" />
                Urgent Priority ({stats?.summary.urgentComplaints || 0})
              </label>
            </div>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearAllFilters}>
                Clear All Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>  */}

      {/* Filtered Complaints List */}
      {hasActiveFilters && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Filtered Complaints</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateToComplaints(complaintsFilter)}
            >
              View All in Complaints Page
            </Button>
          </div>
          <ComplaintsListWidget
            filters={complaintsFilter}
            title="Filtered Results"
            maxHeight="500px"
            showActions={true}
          />
        </div>
      )}

      {/* Quick Actions
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full justify-start"
              onClick={() => navigateToComplaints({ status: ["REGISTERED"] })}
            >
              <Users className="h-4 w-4 mr-2" />
              Assign New Complaints ({stats?.statusBreakdown.registered || 0})
            </Button>
            <Button
              variant="destructive"
              className="w-full justify-start"
              onClick={() =>
                navigateToComplaints({ priority: ["CRITICAL", "HIGH"] })
              }
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Handle Urgent ({stats?.summary.urgentComplaints || 0})
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigateToComplaints({ needsTeamAssignment: true })}
            >
              <Briefcase className="h-4 w-4 mr-2" />
              Assign to Team ({stats?.summary.needsTeamAssignment || 0})
            </Button>
            <Link to="/reports" className="block">
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="h-4 w-4 mr-2" />
                Generate Reports
              </Button>
            </Link>
          </CardContent>
        </Card>  */}

      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Ward Performance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Total Complaints</span>
              <span>{stats?.summary.totalComplaints || 0}</span>
            </div>
            <Progress
              value={
                stats?.summary.totalComplaints
                  ? (stats.summary.completedWork /
                      stats.summary.totalComplaints) *
                    100
                  : 0
              }
              className="h-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              {stats?.summary.completedWork || 0} completed
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {stats?.statusBreakdown.in_progress || 0}
              </div>
              <p className="text-xs text-gray-500">Active</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {stats?.summary.overdueComplaints || 0}
              </div>
              <p className="text-xs text-gray-500">Overdue</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WardOfficerDashboard;
