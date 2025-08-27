import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import {
  useGetComplaintsQuery,
  useGetWardDashboardStatisticsQuery,
} from "../store/api/complaintsApi";
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
  Calendar,
  MapPin,
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
  pending: boolean;
  inProgress: boolean;
  completed: boolean;
  needsTeamAssignment: boolean;
  overdue: boolean;
  urgent: boolean;
}

const WardOfficerDashboard: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();

  // State for filters
  const [filters, setFilters] = useState<FilterState>({
    pending: false,
    inProgress: false,
    completed: false,
    needsTeamAssignment: false,
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

    if (filters.pending) {
      statusFilters.push("REGISTERED", "ASSIGNED");
    }
    if (filters.inProgress) {
      statusFilters.push("IN_PROGRESS");
    }
    if (filters.completed) {
      statusFilters.push("RESOLVED", "CLOSED");
    }
    if (filters.urgent) {
      priorityFilters.push("HIGH", "CRITICAL");
    }

    if (statusFilters.length > 0) {
      filterParams.status = statusFilters;
    }
    if (priorityFilters.length > 0) {
      filterParams.priority = priorityFilters;
    }
    if (filters.overdue) {
      filterParams.slaStatus = "OVERDUE";
    }
    if (filters.needsTeamAssignment) {
      filterParams.assignToTeam = true;
    }

    return filterParams;
  };

  // Fetch complaints based on active filters
  const complaintsFilter = buildComplaintsFilter();
  const {
    data: complaintsResponse,
    isLoading: complaintsLoading,
    refetch: refetchComplaints,
  } = useGetComplaintsQuery({
    ...complaintsFilter,
    page: 1,
    limit: 50,
  });

  const filteredComplaints = complaintsResponse?.data || [];

  const handleFilterChange = (filterKey: keyof FilterState, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: checked,
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      pending: false,
      inProgress: false,
      completed: false,
      needsTeamAssignment: false,
      overdue: false,
      urgent: false,
    });
  };

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

  const hasActiveFilters = Object.values(filters).some(Boolean);

  // Handle navigation to complaints page with filters
  const navigateToComplaints = (filterParams: any) => {
    const searchParams = new URLSearchParams();
    Object.entries(filterParams).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        searchParams.append(key, value.join(','));
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
          {Array(4).fill(0).map((_, i) => (
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
            <p className="text-center text-gray-500 mb-4">Failed to load dashboard data</p>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={`cursor-pointer transition-all hover:shadow-md ${filters.pending ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pending-filter"
                  checked={filters.pending}
                  onCheckedChange={(checked) => handleFilterChange('pending', checked as boolean)}
                />
                <label htmlFor="pending-filter" className="cursor-pointer">Pending Work</label>
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

        <Card className={`cursor-pointer transition-all hover:shadow-md ${filters.inProgress ? 'ring-2 ring-orange-500 bg-orange-50' : ''}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="progress-filter"
                  checked={filters.inProgress}
                  onCheckedChange={(checked) => handleFilterChange('inProgress', checked as boolean)}
                />
                <label htmlFor="progress-filter" className="cursor-pointer">In Progress</label>
              </div>
            </CardTitle>
            <Settings className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats?.summary.activeWork || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Active complaints
            </p>
          </CardContent>
        </Card>

        <Card className={`cursor-pointer transition-all hover:shadow-md ${filters.completed ? 'ring-2 ring-green-500 bg-green-50' : ''}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="completed-filter"
                  checked={filters.completed}
                  onCheckedChange={(checked) => handleFilterChange('completed', checked as boolean)}
                />
                <label htmlFor="completed-filter" className="cursor-pointer">Completed</label>
              </div>
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.summary.completedWork || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Resolved + Closed
            </p>
          </CardContent>
        </Card>

        <Card className={`cursor-pointer transition-all hover:shadow-md ${filters.needsTeamAssignment ? 'ring-2 ring-purple-500 bg-purple-50' : ''}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="team-assignment-filter"
                  checked={filters.needsTeamAssignment}
                  onCheckedChange={(checked) => handleFilterChange('needsTeamAssignment', checked as boolean)}
                />
                <label htmlFor="team-assignment-filter" className="cursor-pointer">Needs Team Assignment</label>
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

      {/* Additional Filter Options */}
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
                onCheckedChange={(checked) => handleFilterChange('overdue', checked as boolean)}
              />
              <label htmlFor="overdue-filter" className="cursor-pointer flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1 text-red-600" />
                Overdue ({stats?.summary.overdueComplaints || 0})
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="urgent-filter"
                checked={filters.urgent}
                onCheckedChange={(checked) => handleFilterChange('urgent', checked as boolean)}
              />
              <label htmlFor="urgent-filter" className="cursor-pointer flex items-center">
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
      </Card>

      {/* Filtered Complaints List */}
      {hasActiveFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Filtered Complaints ({filteredComplaints.length})</span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigateToComplaints(complaintsFilter)}
              >
                View All in Complaints Page
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {complaintsLoading ? (
              <div className="space-y-4">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className="border rounded-lg p-4 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : filteredComplaints.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No complaints match the selected filters</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {filteredComplaints.slice(0, 10).map((complaint) => (
                  <div
                    key={complaint.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-sm">
                        {complaint.title || `Complaint #${complaint.complaintId || complaint.id.slice(-6)}`}
                      </h3>
                      <div className="flex space-x-2">
                        <Badge className={getStatusColor(complaint.status)}>
                          {complaint.status.replace("_", " ")}
                        </Badge>
                        <Badge className={getPriorityColor(complaint.priority)}>
                          {complaint.priority}
                        </Badge>
                        {complaint.assignToTeam && (
                          <Badge className="bg-purple-100 text-purple-800">
                            Needs Team Assignment
                          </Badge>
                        )}
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
                      <Link to={`/complaints?id=${complaint.id}`}>
                        <Button variant="outline" size="sm">
                          Manage
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
                {filteredComplaints.length > 10 && (
                  <div className="text-center pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => navigateToComplaints(complaintsFilter)}
                    >
                      View All {filteredComplaints.length} Complaints
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
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
              onClick={() => navigateToComplaints({ priority: ["CRITICAL", "HIGH"] })}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Handle Urgent ({stats?.summary.urgentComplaints || 0})
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigateToComplaints({ assignToTeam: true })}
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
        </Card>

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
                value={stats?.summary.totalComplaints ? 
                  (stats.summary.completedWork / stats.summary.totalComplaints) * 100 : 0}
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
    </div>
  );
};

export default WardOfficerDashboard;
