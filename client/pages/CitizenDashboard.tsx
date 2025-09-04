import React, { useEffect, useState, useMemo } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useComplaintTypes } from "../hooks/useComplaintTypes";
import {
  useGetComplaintsQuery,
  useGetComplaintStatisticsQuery,
} from "../store/api/complaintsApi";
import { formatDate } from "../lib/dateUtils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
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
  Search,
  Filter,
  Eye,
  Star,
  MessageSquare,
  ArrowUpRight,
  RefreshCw,
} from "lucide-react";
import FeedbackDialog from "../components/FeedbackDialog";
import QuickComplaintModal from "../components/QuickComplaintModal";
import ContactInfoCard from "../components/ContactInfoCard";

const CitizenDashboard: React.FC = () => {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { translations } = useAppSelector((state) => state.language);
  const { complaintTypeOptions } = useComplaintTypes();

  // Set document title
  useDocumentTitle("Dashboard");

  // Debug: Log authentication state
  console.log("Authentication state:", {
    user: !!user,
    isAuthenticated,
    userId: user?.id,
  });
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Use RTK Query for better authentication handling
  const {
    data: complaintsResponse,
    isLoading: complaintsLoading,
    error: complaintsError,
    refetch: refetchComplaints,
  } = useGetComplaintsQuery(
    { page: 1, limit: 50 }, // Get more complaints for better stats
    { skip: !isAuthenticated || !user },
  );

  const {
    data: statsResponse,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useGetComplaintStatisticsQuery({}, { skip: !isAuthenticated || !user });

  // Debug: Log raw API responses
  console.log("Raw API responses:", {
    complaintsResponse,
    statsResponse,
    complaintsResponseKeys: complaintsResponse
      ? Object.keys(complaintsResponse)
      : null,
    statsResponseKeys: statsResponse ? Object.keys(statsResponse) : null,
  });

  // Extract complaints from the actual API response structure
  // Backend returns: { success: true, data: { complaints: [...], pagination: {...} } }
  const complaints = Array.isArray(complaintsResponse?.data?.complaints)
    ? complaintsResponse.data.complaints
    : [];

  console.log("Extracted complaints:", complaints);
  console.log("Complaints count:", complaints.length);
  const pagination = complaintsResponse?.data?.pagination || {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNext: false,
    hasPrev: false,
  };
  const isLoading = complaintsLoading;

  const [dashboardStats, setDashboardStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    avgResolutionTime: 0,
    resolutionRate: 0,
  });

  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || "",
  );
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || "all",
  );
  const [typeFilter, setTypeFilter] = useState(
    searchParams.get("type") || "all",
  );
  const [sortBy, setSortBy] = useState(
    searchParams.get("sort") || "submittedOn",
  );
  const [sortOrder, setSortOrder] = useState(
    searchParams.get("order") || "desc",
  );
  const [isQuickFormOpen, setIsQuickFormOpen] = useState(false);

  // Handler functions
  const handleRefresh = () => {
    refetchComplaints();
    refetchStats();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Update URL params to trigger re-fetch
    const params = new URLSearchParams();
    if (searchTerm) params.set("search", searchTerm);
    if (statusFilter && statusFilter !== "all")
      params.set("status", statusFilter);
    if (typeFilter && typeFilter !== "all") params.set("type", typeFilter);
    if (sortBy) params.set("sort", sortBy);
    if (sortOrder) params.set("order", sortOrder);

    navigate(`/dashboard?${params.toString()}`);
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setTypeFilter("all");
    setSortBy("submittedOn");
    setSortOrder("desc");

    // Navigate to dashboard without any query parameters
    navigate("/dashboard");
  };

  // Fetch complaints when user is available or filters change
  useEffect(() => {
    // Debug: Log the actual data we're receiving
    console.log("Dashboard data debug:", {
      statsResponse: statsResponse?.data,
      complaintsCount: complaints.length,
      complaintStatuses: complaints.map((c) => c.status),
      complaintsData: complaints.slice(0, 2), // Log first 2 complaints for inspection
    });

    // Calculate dashboard statistics from complaints or use stats API
    if (statsResponse?.data?.stats) {
      // Use API stats if available
      const stats = statsResponse.data.stats;
      const total = stats.total || 0;
      const pending =
        stats.byStatus?.REGISTERED || stats.byStatus?.registered || 0;
      const inProgress =
        stats.byStatus?.IN_PROGRESS || stats.byStatus?.in_progress || 0;
      const resolved =
        stats.byStatus?.RESOLVED || stats.byStatus?.resolved || 0;
      const resolutionRate =
        total > 0 ? Math.round((resolved / total) * 100) : 0;

      console.log("Using API stats:", {
        stats,
        total,
        pending,
        inProgress,
        resolved,
        resolutionRate,
      });

      setDashboardStats({
        total,
        pending,
        inProgress,
        resolved,
        avgResolutionTime: stats.avgResolutionTimeHours || 0,
        resolutionRate,
      });
    } else {
      // Calculate from complaints list as fallback
      const total = complaints.length;

      console.log(
        "Fallback calculation - analyzing complaints:",
        complaints.map((c) => ({
          id: c.id,
          status: c.status,
          type: typeof c.status,
        })),
      );

      const pending = complaints.filter(
        (c) => c.status === "registered" || c.status === "REGISTERED",
      ).length;
      const inProgress = complaints.filter(
        (c) => c.status === "in_progress" || c.status === "IN_PROGRESS",
      ).length;
      const resolved = complaints.filter(
        (c) =>
          c.status === "resolved" ||
          c.status === "RESOLVED" ||
          c.status === "closed" ||
          c.status === "CLOSED",
      ).length;
      const resolutionRate =
        total > 0 ? Math.round((resolved / total) * 100) : 0;

      console.log("Using fallback calculation:", {
        total,
        pending,
        inProgress,
        resolved,
        resolutionRate,
      });

      setDashboardStats({
        total,
        pending,
        inProgress,
        resolved,
        avgResolutionTime: 0, // Will be calculated by backend stats API
        resolutionRate,
      });
    }
  }, [complaints, statsResponse]);

  const getStatusColor = (status: string) => {
    const normalizedStatus = status.toUpperCase();
    switch (normalizedStatus) {
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

  const getComplaintTypeLabel = (type: string) => {
    // Convert type to readable format
    return type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const isResolved = (status: string) => {
    const normalizedStatus = status.toUpperCase();
    return normalizedStatus === "RESOLVED" || normalizedStatus === "CLOSED";
  };

  const recentComplaints = complaints.slice(0, 5);

  // Show error state if there's an authentication error
  if (
    complaintsError &&
    "status" in complaintsError &&
    complaintsError.status === 401
  ) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">
          <h2 className="text-xl font-semibold mb-2">Authentication Error</h2>
          <p>Please log in again to access your dashboard.</p>
        </div>
        <Link to="/login">
          <Button>Go to Login</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              🚀 Welcome back, {user?.fullName || "Citizen"}! 👋
            </h1>
            <p className="text-blue-100">
              Track your complaints and stay updated with the latest progress.
            </p>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <Button
              onClick={() => setIsQuickFormOpen(true)}
              className="bg-white text-blue-600 hover:bg-gray-50"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              New Complaint
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      {/* Resolution Rate Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resolution Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Overall Resolution Rate
              </span>
              <span className="text-sm text-muted-foreground">
                {dashboardStats.resolved} of {dashboardStats.total} complaints
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{dashboardStats.resolutionRate}%</span>
              </div>
              <Progress value={dashboardStats.resolutionRate} className="h-2" />
            </div>
            {dashboardStats.avgResolutionTime > 0 && (
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Average Resolution Time</span>
                <span>{dashboardStats.avgResolutionTime} days</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* My Complaints Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">My Complaints</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={() => setIsQuickFormOpen(true)} size="sm">
                <PlusCircle className="h-4 w-4 mr-2" />
                New Complaint
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="space-y-4 mb-6">
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by ID, description, or location..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    title="Search by complaint ID (e.g., KSC0001), description, or location"
                  />
                  {searchTerm && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSearchTerm("")}
                        className="h-4 w-4 p-0 hover:bg-gray-200"
                      >
                        ×
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <Button type="submit" variant="outline">
                <Search className="h-4 w-4" />
              </Button>
            </form>

            <div className="flex flex-wrap gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="REGISTERED">Registered</SelectItem>
                  <SelectItem value="ASSIGNED">Assigned</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {complaintTypeOptions.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={`${sortBy}-${sortOrder}`}
                onValueChange={(value) => {
                  const [newSortBy, newSortOrder] = value.split("-");
                  setSortBy(newSortBy);
                  setSortOrder(newSortOrder);
                }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="submittedOn-desc">Newest First</SelectItem>
                  <SelectItem value="submittedOn-asc">Oldest First</SelectItem>
                  <SelectItem value="priority-desc">
                    High Priority First
                  </SelectItem>
                  <SelectItem value="status-asc">Status</SelectItem>
                </SelectContent>
              </Select>

              {(searchTerm ||
                (statusFilter && statusFilter !== "all") ||
                (typeFilter && typeFilter !== "all")) && (
                <Button variant="ghost" onClick={clearAllFilters}>
                  <Filter className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>
          </div>

          {/* Complaints Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading complaints...</span>
            </div>
          ) : complaints.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No complaints found
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter || typeFilter
                  ? "No complaints match your current filters."
                  : "You haven't submitted any complaints yet."}
              </p>
              <Button onClick={() => navigate("/complaints/citizen-form")}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Submit Your First Complaint
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Mobile View */}
              <div className="md:hidden space-y-4">
                {complaints.map((complaint) => (
                  <Card key={complaint.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">
                            {complaint.title}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1">
                            ID: {complaint.complaintId || complaint.id}
                          </p>
                        </div>
                        <Badge className={getStatusColor(complaint.status)}>
                          {complaint.status.replace("_", " ")}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{getComplaintTypeLabel(complaint.type)}</span>
                        <span>{formatDate(complaint.submittedOn)}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={getPriorityColor(complaint.priority)}
                        >
                          {complaint.priority}
                        </Badge>
                        {complaint.ward && (
                          <div className="flex items-center text-xs text-gray-500">
                            <MapPin className="h-3 w-3 mr-1" />
                            {complaint.ward.name}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            navigate(`/complaints/${complaint.id}`)
                          }
                          className="flex-1"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>

                        {isResolved(complaint.status) && (
                          <FeedbackDialog
                            complaintId={complaint.id}
                            complaintTitle={complaint.title}
                            isResolved={isResolved(complaint.status)}
                            existingFeedback={
                              complaint.rating
                                ? {
                                    rating: complaint.rating,
                                    comment: complaint.citizenFeedback || "",
                                  }
                                : null
                            }
                          >
                            <Button variant="outline" size="sm">
                              <Star className="h-4 w-4 mr-1" />
                              {complaint.rating ? "Update" : "Rate"}
                            </Button>
                          </FeedbackDialog>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {complaints.map((complaint) => (
                      <TableRow key={complaint.id}>
                        <TableCell className="font-mono text-xs">
                          {(complaint.complaintId ?? complaint.id)
                            ? (complaint.complaintId ?? complaint.id).slice(-8)
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-48">
                            <div className="font-medium text-sm truncate">
                              {complaint.title}
                            </div>
                            {complaint.description && (
                              <div className="text-xs text-gray-500 truncate">
                                {complaint.description.slice(0, 50)}...
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {getComplaintTypeLabel(complaint.type)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(complaint.status)}>
                            {complaint.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getPriorityColor(complaint.priority)}
                          >
                            {complaint.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {complaint.ward && (
                            <div className="flex items-center text-sm">
                              <MapPin className="h-3 w-3 mr-1" />
                              {complaint.ward.name}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(complaint.submittedOn)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {complaint.rating ? (
                            <div className="flex items-center">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                              <span className="text-sm">
                                {complaint.rating}/5
                              </span>
                            </div>
                          ) : isResolved(complaint.status) ? (
                            <span className="text-xs text-gray-500">
                              Not rated
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                navigate(`/complaints/${complaint.id}`)
                              }
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            {isResolved(complaint.status) && (
                              <FeedbackDialog
                                complaintId={complaint.id}
                                complaintTitle={complaint.title}
                                isResolved={isResolved(complaint.status)}
                                existingFeedback={
                                  complaint.rating
                                    ? {
                                        rating: complaint.rating,
                                        comment:
                                          complaint.citizenFeedback || "",
                                      }
                                    : null
                                }
                              >
                                <Button variant="ghost" size="sm">
                                  <Star className="h-4 w-4" />
                                </Button>
                              </FeedbackDialog>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Showing{" "}
                    {(pagination.currentPage - 1) * pagination.limit + 1} to{" "}
                    {Math.min(
                      pagination.currentPage * pagination.limit,
                      pagination.totalItems,
                    )}{" "}
                    of {pagination.totalItems} complaints
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!pagination.hasPrev}
                      onClick={() => {
                        // RTK Query handles pagination automatically via refetch
                        refetchComplaints();
                      }}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!pagination.hasNext}
                      onClick={() => {
                        // RTK Query handles pagination automatically via refetch
                        refetchComplaints();
                      }}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions & Additional Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => setIsQuickFormOpen(true)}
              className="w-full justify-start"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Submit New Complaint
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/complaints")}
              className="w-full justify-start"
            >
              <FileText className="mr-2 h-4 w-4" />
              View All Complaints
            </Button>
            {/* Track Complaint Status removed as requested */}
          </CardContent>
        </Card>

        {/* Help & Support (reused from Home page contact section) */}
        <ContactInfoCard title="Help & Support" />
      </div>

      {/* Quick Complaint Modal */}
      <QuickComplaintModal
        isOpen={isQuickFormOpen}
        onClose={() => setIsQuickFormOpen(false)}
        onSuccess={(complaintId) => {
          // Refresh data after successful submission
          handleRefresh();
        }}
      />
    </div>
  );
};

export default CitizenDashboard;
