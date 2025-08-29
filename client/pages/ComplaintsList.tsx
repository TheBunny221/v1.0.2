import React, { useEffect, useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import { useGetComplaintsQuery } from "../store/api/complaintsApi";
import { useGetWardsForFilteringQuery } from "../store/api/adminApi";
import { useDataManager } from "../hooks/useDataManager";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Checkbox } from "../components/ui/checkbox";
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
  FileText,
  Search,
  Filter,
  Plus,
  Calendar,
  MapPin,
  Eye,
  Edit,
} from "lucide-react";
import ComplaintQuickActions from "../components/ComplaintQuickActions";
import QuickComplaintModal from "../components/QuickComplaintModal";
import UpdateComplaintModal from "../components/UpdateComplaintModal";

const ComplaintsList: React.FC = () => {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { translations } = useAppSelector((state) => state.language);
  const [searchParams] = useSearchParams();

  // Initialize filters from URL parameters
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || "",
  );
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || "all",
  );
  const [priorityFilter, setPriorityFilter] = useState(() => {
    const priority = searchParams.get("priority");
    // Handle comma-separated values like "CRITICAL,HIGH"
    if (priority && priority.includes(",")) {
      return "high_critical"; // Use a combined filter for UI purposes
    }
    return priority || "all";
  });
  const [wardFilter, setWardFilter] = useState(
    searchParams.get("ward") || "all",
  );
  const [subZoneFilter, setSubZoneFilter] = useState(
    searchParams.get("subZone") || "all",
  );
  const [needsMaintenanceAssignment, setNeedsMaintenanceAssignment] = useState(
    searchParams.get("needsMaintenanceAssignment") === "true" || false,
  );
  const [slaStatusFilter, setSlaStatusFilter] = useState(
    searchParams.get("slaStatus") || "all",
  );
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [isQuickFormOpen, setIsQuickFormOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);

  // Data management
  const { cacheComplaintsList } = useDataManager();

  // Fetch wards for filtering (only for admin users)
  const { data: wardsResponse, isLoading: isLoadingWards } =
    useGetWardsForFilteringQuery(undefined, {
      skip: !isAuthenticated || user?.role === "CITIZEN",
    });

  const wards = wardsResponse?.data?.wards || [];

  // Get sub-zones for selected ward
  const selectedWard = wards.find((ward) => ward.id === wardFilter);
  const availableSubZones = selectedWard?.subZones || [];

  // Debounce search term for better performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Build query parameters for server-side filtering
  const queryParams = useMemo(() => {
    const params: any = { page: 1, limit: 100 };
    if (statusFilter !== "all") params.status = statusFilter.toUpperCase();

    // Handle priority filter including URL-based comma-separated values
    if (priorityFilter !== "all") {
      const urlPriority = searchParams.get("priority");
      if (urlPriority && urlPriority.includes(",")) {
        // For comma-separated values from URL, send as array
        params.priority = urlPriority
          .split(",")
          .map((p) => p.trim().toUpperCase());
      } else if (priorityFilter === "high_critical") {
        // Handle the combined high & critical filter
        params.priority = ["HIGH", "CRITICAL"];
      } else {
        params.priority = priorityFilter.toUpperCase();
      }
    }

    // Add ward and sub-zone filters
    if (wardFilter !== "all") params.wardId = wardFilter;
    if (subZoneFilter !== "all") params.subZoneId = subZoneFilter;

    // Add new filters
    if (needsMaintenanceAssignment) params.needsTeamAssignment = true;
    if (slaStatusFilter !== "all")
      params.slaStatus = slaStatusFilter.toUpperCase();

    if (debouncedSearchTerm.trim()) params.search = debouncedSearchTerm.trim();

    // For MAINTENANCE_TEAM users, show only their own complaints
    if (user?.role === "MAINTENANCE_TEAM") {
      params.submittedById = user.id;
    }

    return params;
  }, [
    statusFilter,
    priorityFilter,
    wardFilter,
    subZoneFilter,
    debouncedSearchTerm,
    user?.role,
    user?.id,
    searchParams,
    needsMaintenanceAssignment,
    slaStatusFilter,
  ]);

  // Use RTK Query for better authentication handling
  const {
    data: complaintsResponse,
    isLoading,
    error,
    refetch,
  } = useGetComplaintsQuery(queryParams, { skip: !isAuthenticated || !user });

  const complaints = Array.isArray(complaintsResponse?.data?.complaints)
    ? complaintsResponse.data.complaints
    : [];

  // Cache complaints data when loaded
  useEffect(() => {
    if (complaints.length > 0) {
      cacheComplaintsList(complaints);
    }
  }, [complaints, cacheComplaintsList]);

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

  // Use all complaints since filtering is done server-side
  const filteredComplaints = complaints;

  // Clear all filters and refetch data
  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setWardFilter("all");
    setSubZoneFilter("all");
    setNeedsMaintenanceAssignment(false);
    setSlaStatusFilter("all");
    setDebouncedSearchTerm("");
  };

  // Reset sub-zone when ward changes
  const handleWardChange = (value: string) => {
    setWardFilter(value);
    setSubZoneFilter("all");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {user?.role === "MAINTENANCE_TEAM" ? "My Complaints" : "Complaints"}
          </h1>
          <p className="text-gray-600">
            {user?.role === "MAINTENANCE_TEAM"
              ? "View and manage complaints you have submitted"
              : "Manage and track all complaints"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <FileText className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {(user?.role === "CITIZEN" ||
            user?.role === "MAINTENANCE_TEAM" ||
            user?.role === "ADMINISTRATOR" ||
            user?.role === "WARD_OFFICER") && (
            <Button onClick={() => setIsQuickFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Complaint
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            <div className="space-y-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by ID, description, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  title="Search by complaint ID (e.g., KSC0001), description, or location"
                />
                {searchTerm && (
                  <div className="absolute right-3 top-3">
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
              {searchTerm && (
                <p className="text-xs text-gray-500">
                  {searchTerm.match(/^[A-Za-z]/)
                    ? `Searching for complaint ID: ${searchTerm}`
                    : `Searching in descriptions and locations`}
                </p>
              )}
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
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
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
                <SelectItem value="high_critical">High & Critical</SelectItem>
              </SelectContent>
            </Select>

            {/* Ward Filter - Only for admin and ward officers */}
            {(user?.role === "ADMINISTRATOR" ||
              user?.role === "WARD_OFFICER") && (
              <Select value={wardFilter} onValueChange={handleWardChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by ward" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Wards</SelectItem>
                  {wards.map((ward) => (
                    <SelectItem key={ward.id} value={ward.id}>
                      {ward.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Sub-Zone Filter - Only for admin and when ward is selected */}
            {user?.role === "ADMINISTRATOR" &&
              wardFilter !== "all" &&
              availableSubZones.length > 0 && (
                <Select value={subZoneFilter} onValueChange={setSubZoneFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by sub-zone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sub-Zones</SelectItem>
                    {availableSubZones.map((subZone) => (
                      <SelectItem key={subZone.id} value={subZone.id}>
                        {subZone.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

            {/* SLA Status Filter */}
            <Select value={slaStatusFilter} onValueChange={setSlaStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by SLA" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All SLA Status</SelectItem>
                <SelectItem value="ON_TIME">On Time</SelectItem>
                <SelectItem value="WARNING">Warning</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
              </SelectContent>
            </Select>

            {/* Assignment Filter - Only for Ward Officers */}
            {user?.role === "WARD_OFFICER" && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="needsMaintenanceAssignment"
                  checked={needsMaintenanceAssignment}
                  onCheckedChange={setNeedsMaintenanceAssignment}
                />
                <label
                  htmlFor="needsMaintenanceAssignment"
                  className="text-sm cursor-pointer"
                >
                  Needs Maintenance Assignment
                </label>
              </div>
            )}
            <Button variant="outline" onClick={clearFilters}>
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Complaints Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Complaints ({filteredComplaints.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-red-400 mb-4" />
              <p className="text-red-500 mb-2">Failed to load complaints</p>
              <Button variant="outline" onClick={() => refetch()}>
                Try Again
              </Button>
            </div>
          ) : isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : filteredComplaints.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 mb-2">No complaints found</p>
              <p className="text-sm text-gray-400">
                {searchTerm ||
                statusFilter !== "all" ||
                priorityFilter !== "all"
                  ? "Try adjusting your filters or search terms"
                  : "Submit your first complaint to get started"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Complaint ID</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredComplaints.map((complaint) => (
                  <TableRow key={complaint.id}>
                    <TableCell className="font-medium">
                      #{complaint.complaintId || complaint.id.slice(-6)}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="truncate">{complaint.description}</p>
                        <p className="text-sm text-gray-500">
                          {complaint.type.replace("_", " ")}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm">
                        <MapPin className="h-3 w-3 mr-1" />
                        {complaint.area}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(complaint.status)}>
                        {complaint.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge className={getPriorityColor(complaint.priority)}>
                          {complaint.priority}
                        </Badge>
                        {/* Show maintenance assignment status - only for active complaints */}
                        {(complaint as any).needsTeamAssignment &&
                          !["RESOLVED", "CLOSED"].includes(
                            complaint.status,
                          ) && (
                            <Badge className="bg-orange-100 text-orange-800 text-xs">
                              Needs Team Assignment
                            </Badge>
                          )}
                        {complaint.maintenanceTeam && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            Team:{" "}
                            {complaint.maintenanceTeam.fullName.split(" ")[0]}
                          </Badge>
                        )}
                        {complaint.wardOfficer && (
                          <Badge className="bg-blue-100 text-blue-800 text-xs">
                            WO: {complaint.wardOfficer.fullName.split(" ")[0]}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(complaint.submittedOn).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <ComplaintQuickActions
                        complaint={{
                          id: complaint.id,
                          complaintId: complaint.complaintId,
                          status: complaint.status,
                          priority: complaint.priority,
                          type: complaint.type,
                          description: complaint.description,
                          area: complaint.area,
                          assignedTo: complaint.assignedTo,
                        }}
                        userRole={user?.role || ""}
                        showDetails={false}
                        onUpdate={() => refetch()}
                        onShowUpdateModal={(c) => {
                          setSelectedComplaint(complaint);
                          setIsUpdateModalOpen(true);
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Quick Complaint Modal */}
      <QuickComplaintModal
        isOpen={isQuickFormOpen}
        onClose={() => setIsQuickFormOpen(false)}
        onSuccess={(complaintId) => {
          // Refresh data after successful submission
          refetch();
        }}
      />

      {/* Update Complaint Modal */}
      <UpdateComplaintModal
        complaint={selectedComplaint}
        isOpen={isUpdateModalOpen}
        onClose={() => {
          setIsUpdateModalOpen(false);
          setSelectedComplaint(null);
        }}
        onSuccess={() => {
          setIsUpdateModalOpen(false);
          setSelectedComplaint(null);
          refetch();
        }}
      />
    </div>
  );
};

export default ComplaintsList;
