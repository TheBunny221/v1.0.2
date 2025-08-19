import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import {
  useGetComplaintsQuery,
  useAssignComplaintMutation
} from "../store/api/complaintsApi";
import { useGetAllUsersQuery } from "../store/api/adminApi";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Input } from "../components/ui/input";
import { toast } from "../components/ui/use-toast";
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
  Search,
  Camera,
  Eye,
  UserPlus,
  Filter,
  Download,
  Phone,
  Mail,
  X,
} from "lucide-react";

interface ComplaintAssignment {
  complaintId: string;
  assignedToId: string;
  comment?: string;
}

const WardOfficerDashboard: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const { translations } = useAppSelector((state) => state.language);

  // Use RTK Query for complaints
  const {
    data: complaintsResponse,
    isLoading: complaintsLoading,
    error: complaintsError,
    refetch: refetchComplaints
  } = useGetComplaintsQuery({});

  // Ensure complaints is always an array
  const complaints = Array.isArray(complaintsResponse?.data)
    ? complaintsResponse.data
    : Array.isArray(complaintsResponse?.data?.complaints)
    ? complaintsResponse.data.complaints
    : [];

  // State for filtering and assignment
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [assignmentData, setAssignmentData] = useState<ComplaintAssignment>({
    complaintId: "",
    assignedToId: "",
    comment: "",
  });
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string>("");

  // Fetch maintenance team members from API
  const {
    data: maintenanceTeamResponse,
    isLoading: isLoadingTeam,
    error: teamError
  } = useGetAllUsersQuery({
    role: "MAINTENANCE_TEAM",
    status: "active",
    limit: 100,
  });

  const maintenanceTeam = maintenanceTeamResponse?.data?.users || [];

  // RTK Query mutation for assignment
  const [assignComplaintMutation, { isLoading: isAssigning }] = useAssignComplaintMutation();

  const [dashboardStats, setDashboardStats] = useState({
    totalComplaints: 0,
    pendingAssignment: 0,
    assigned: 0,
    overdue: 0,
    resolved: 0,
    slaCompliance: 85,
    avgResolutionTime: 2.8,
  });


  useEffect(() => {
    // Only run if we have valid data
    if (!Array.isArray(complaints) || !user?.wardId) {
      return;
    }

    // Filter complaints for this ward officer's ward
    const wardComplaints = complaints.filter(
      (c) => c.wardId === user.wardId,
    );

    const totalComplaints = wardComplaints.length;
    const pendingAssignment = wardComplaints.filter(
      (c) => c.status === "REGISTERED" && !c.assignedToId,
    ).length;
    const assigned = wardComplaints.filter(
      (c) => c.assignedToId && c.status !== "RESOLVED" && c.status !== "CLOSED",
    ).length;
    const resolved = wardComplaints.filter(
      (c) => c.status === "RESOLVED",
    ).length;
    const overdue = wardComplaints.filter((c) => {
      if (!c.deadline) return false;
      return new Date(c.deadline) < new Date() && c.status !== "RESOLVED" && c.status !== "CLOSED";
    }).length;

    setDashboardStats({
      totalComplaints,
      pendingAssignment,
      assigned,
      overdue,
      resolved,
      slaCompliance: 85, // Mock calculation
      avgResolutionTime: 2.8, // Mock calculation
    });
  }, [complaints.length, user?.wardId]); // Use .length to avoid object reference changes

  // Filter complaints based on active filter and search term
  const getFilteredComplaints = () => {
    // Safety check - ensure complaints is an array
    if (!Array.isArray(complaints)) {
      return [];
    }

    let filtered = complaints.filter((c) => c.wardId === user?.wardId);

    // Apply status filter
    switch (activeFilter) {
      case "pendingAssignment":
        filtered = filtered.filter((c) => c.status === "REGISTERED" && !c.assignedToId);
        break;
      case "assigned":
        filtered = filtered.filter((c) => c.assignedToId && c.status !== "RESOLVED" && c.status !== "CLOSED");
        break;
      case "overdue":
        filtered = filtered.filter((c) => {
          if (!c.deadline) return false;
          return new Date(c.deadline) < new Date() && c.status !== "RESOLVED" && c.status !== "CLOSED";
        });
        break;
      case "resolved":
        filtered = filtered.filter((c) => c.status === "RESOLVED");
        break;
      default:
        // "all" - no additional filtering
        break;
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((c) =>
        c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.area.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.title && c.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.contactPhone && c.contactPhone.includes(searchTerm)) ||
        (c.id && c.id.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    return filtered.sort((a, b) => new Date(b.submittedOn).getTime() - new Date(a.submittedOn).getTime());
  };

  const filteredComplaints = getFilteredComplaints();

  // Show loading state
  if (complaintsLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span>Loading complaints...</span>
        </div>
      </div>
    );
  }

  // Show error state
  if (complaintsError) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">
          <AlertTriangle className="h-12 w-12 mx-auto mb-2" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">
            Failed to load complaint data. Please try again.
          </p>
          <Button onClick={() => refetchComplaints()}>Retry</Button>
        </div>
      </div>
    );
  }

  const handleAssignComplaint = (complaint: any) => {
    setSelectedComplaint(complaint);
    setAssignmentData({
      complaintId: complaint.id,
      assignedToId: "",
      comment: "",
    });
    setIsAssignDialogOpen(true);
  };

  const submitAssignment = async () => {
    if (!assignmentData.assignedToId) {
      toast({
        title: "Error",
        description: "Please select a team member to assign",
        variant: "destructive",
      });
      return;
    }

    try {
      await assignComplaintMutation({
        id: assignmentData.complaintId,
        assignedTo: assignmentData.assignedToId,
        remarks: assignmentData.comment,
      }).unwrap();

      toast({
        title: "Success",
        description: "Complaint has been assigned successfully",
        variant: "default",
      });

      setIsAssignDialogOpen(false);
      setAssignmentData({ complaintId: "", assignedToId: "", comment: "" });
      setSelectedComplaint(null);

      // Refresh complaints data
      refetchComplaints();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.data?.message || "Failed to assign complaint",
        variant: "destructive",
      });
    }
  };

  const handleViewPhoto = (photoUrl: string) => {
    setSelectedPhoto(photoUrl);
    setIsPhotoDialogOpen(true);
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
        return "bg-red-500 text-white";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getAssignedTeamMember = (assignedToId: string) => {
    return maintenanceTeam.find(member => member.id === assignedToId);
  };

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

      {/* Statistics Cards with Filtering */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card 
          className={`cursor-pointer transition-colors ${
            activeFilter === "all" ? "ring-2 ring-blue-500 bg-blue-50" : "hover:bg-gray-50"
          }`}
          onClick={() => setActiveFilter("all")}
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
          onClick={() => setActiveFilter("pendingAssignment")}
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
          onClick={() => setActiveFilter("assigned")}
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
          onClick={() => setActiveFilter("overdue")}
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

      {/* Complaints Management Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <CardTitle>
                Complaints 
                {activeFilter !== "all" && (
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    - {activeFilter.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </span>
                )}
              </CardTitle>
              <Badge variant="secondary">{filteredComplaints.length} items</Badge>
            </div>
            
            {/* Search Bar */}
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search complaints..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              {activeFilter !== "all" && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setActiveFilter("all")}
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear Filter
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredComplaints.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">
                {searchTerm ? "No complaints match your search" : "No complaints found for this filter"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Complaint ID</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredComplaints.map((complaint) => {
                    const assignedMember = complaint.assignedToId ? getAssignedTeamMember(complaint.assignedToId) : null;
                    
                    return (
                      <TableRow key={complaint.id}>
                        <TableCell className="font-medium">
                          {complaint.complaintId || `#${complaint.id.slice(-6)}`}
                        </TableCell>
                        
                        <TableCell className="max-w-xs">
                          <div>
                            {complaint.title && (
                              <div className="font-medium text-sm mb-1">{complaint.title}</div>
                            )}
                            <div className="text-sm text-gray-600 line-clamp-2">
                              {complaint.description}
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="text-sm">
                            <div className="flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              {complaint.contactPhone}
                            </div>
                            {complaint.contactEmail && (
                              <div className="flex items-center mt-1 text-gray-500">
                                <Mail className="h-3 w-3 mr-1" />
                                {complaint.contactEmail}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <MapPin className="h-3 w-3 mr-1" />
                            {complaint.area}
                            {complaint.landmark && (
                              <div className="text-gray-500 ml-1">
                                near {complaint.landmark}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <Badge className={getPriorityColor(complaint.priority)}>
                            {complaint.priority}
                          </Badge>
                        </TableCell>
                        
                        <TableCell>
                          <Badge className={getStatusColor(complaint.status)}>
                            {complaint.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        
                        <TableCell>
                          {assignedMember ? (
                            <div className="text-sm">
                              <div className="font-medium">{assignedMember.fullName}</div>
                              <div className="text-gray-500">{assignedMember.department || 'Maintenance'}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">Unassigned</span>
                          )}
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(complaint.submittedOn).toLocaleDateString()}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {/* Assign/Reassign Button */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAssignComplaint(complaint)}
                            >
                              <UserPlus className="h-3 w-3 mr-1" />
                              {complaint.assignedToId ? "Reassign" : "Assign"}
                            </Button>
                            
                            {/* View Photo Button */}
                            {complaint.attachments && complaint.attachments.length > 0 && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewPhoto(complaint.attachments[0].url)}
                              >
                                <Camera className="h-3 w-3 mr-1" />
                                Photo
                              </Button>
                            )}
                            
                            {/* View Details Button */}
                            <Link to={`/complaints/${complaint.id}`}>
                              <Button size="sm" variant="outline">
                                <Eye className="h-3 w-3 mr-1" />
                                Details
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assignment Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedComplaint?.assignedToId ? "Reassign" : "Assign"} Complaint
            </DialogTitle>
          </DialogHeader>
          {selectedComplaint && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-medium text-sm mb-1">
                  {selectedComplaint.title || `Complaint #${selectedComplaint.id.slice(-6)}`}
                </h4>
                <p className="text-sm text-gray-600">{selectedComplaint.description}</p>
                <div className="flex items-center mt-2 text-xs text-gray-500">
                  <MapPin className="h-3 w-3 mr-1" />
                  {selectedComplaint.area}
                </div>
              </div>

              <div>
                <Label htmlFor="assignedTo">Assign to Team Member</Label>
                <Select 
                  value={assignmentData.assignedToId} 
                  onValueChange={(value) => setAssignmentData(prev => ({ ...prev, assignedToId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingTeam ? (
                      <div className="p-2 text-center text-sm text-gray-500">Loading team members...</div>
                    ) : maintenanceTeam.length === 0 ? (
                      <div className="p-2 text-center text-sm text-gray-500">No maintenance team members available</div>
                    ) : (
                      maintenanceTeam.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          <div>
                            <div className="font-medium">{member.fullName}</div>
                            <div className="text-sm text-gray-500">{member.department || 'Maintenance'}</div>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="comment">Assignment Notes (Optional)</Label>
                <Textarea
                  id="comment"
                  value={assignmentData.comment}
                  onChange={(e) => setAssignmentData(prev => ({ ...prev, comment: e.target.value }))}
                  placeholder="Add any specific instructions or notes..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAssignDialogOpen(false);
                    setAssignmentData({ complaintId: "", assignedToId: "", comment: "" });
                    setSelectedComplaint(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={submitAssignment}
                  disabled={!assignmentData.assignedToId || isAssigning}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  {isAssigning ? "Assigning..." : (selectedComplaint?.assignedToId ? "Reassign" : "Assign")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Photo View Dialog */}
      <Dialog open={isPhotoDialogOpen} onOpenChange={setIsPhotoDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Complaint Photo</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            <img
              src={selectedPhoto}
              alt="Complaint attachment"
              className="max-w-full max-h-96 object-contain rounded-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/placeholder-image.png";
              }}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsPhotoDialogOpen(false)}>
              Close
            </Button>
            <Button asChild>
              <a href={selectedPhoto} download target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4 mr-2" />
                Download
              </a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WardOfficerDashboard;
