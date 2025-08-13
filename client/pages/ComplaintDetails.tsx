import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import {
  useGetComplaintQuery,
  useUpdateComplaintStatusMutation,
} from "../store/api/complaintsApi";
import ComplaintFeedbackDialog from "../components/ComplaintFeedbackDialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  FileText,
  Calendar,
  MapPin,
  User,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  ArrowLeft,
  MessageSquare,
  Image,
  Download,
} from "lucide-react";

const ComplaintDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { translations } = useAppSelector((state) => state.language);

  const [statusComment, setStatusComment] = useState("");
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);

  // Use RTK Query to fetch complaint details
  const {
    data: complaintResponse,
    isLoading,
    error,
  } = useGetComplaintQuery(id!, { skip: !id || !isAuthenticated });

  // Use RTK Query mutation for status updates
  const [updateStatus, { isLoading: isUpdatingStatus }] =
    useUpdateComplaintStatusMutation();

  const complaint = complaintResponse?.data;

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

  const handleStatusUpdate = async (newStatus: string) => {
    if (id) {
      try {
        await updateStatus({
          id,
          status: newStatus as any,
          remarks: statusComment,
        }).unwrap();
        setStatusComment("");
      } catch (error) {
        console.error("Failed to update status:", error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-6">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto text-red-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Error Loading Complaint
        </h2>
        <p className="text-gray-600 mb-4">
          Failed to load complaint details. Please try again.
        </p>
        <Link to="/complaints">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Complaints
          </Button>
        </Link>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Complaint Not Found
        </h2>
        <p className="text-gray-600 mb-4">
          The complaint you're looking for doesn't exist.
        </p>
        <Link to="/complaints">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Complaints
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Link to="/complaints">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              Complaint #{complaint.id.slice(-6)}
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <Badge className={getStatusColor(complaint.status)}>
              {complaint.status.replace("_", " ")}
            </Badge>
            <Badge className={getPriorityColor(complaint.priority)}>
              {complaint.priority} Priority
            </Badge>
            <span className="text-sm text-gray-500">
              Created {new Date(complaint.submittedOn).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Complaint Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Complaint Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Type</h3>
                <p className="text-gray-600">
                  {complaint.type.replace("_", " ")}
                </p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Description</h3>
                <p className="text-gray-600">{complaint.description}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2 flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    Location
                  </h3>
                  <p className="text-gray-600">{complaint.area}</p>
                  {complaint.landmark && (
                    <p className="text-sm text-gray-500">
                      Near: {complaint.landmark}
                    </p>
                  )}
                </div>
                <div>
                  <h3 className="font-medium mb-2 flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Timeline
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-600">
                      Submitted:{" "}
                      {new Date(complaint.submittedOn).toLocaleString()}
                    </p>
                    {complaint.assignedOn && (
                      <p className="text-gray-600">
                        Assigned:{" "}
                        {new Date(complaint.assignedOn).toLocaleString()}
                      </p>
                    )}
                    {complaint.resolvedOn && (
                      <p className="text-gray-600">
                        Resolved:{" "}
                        {new Date(complaint.resolvedOn).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Updates / Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Status Updates & Comments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Mock status updates */}
                <div className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">Complaint Registered</p>
                      <p className="text-sm text-gray-600">
                        Your complaint has been successfully registered.
                      </p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(complaint.submittedOn).toLocaleString()}
                    </span>
                  </div>
                </div>

                {complaint.assignedOn && (
                  <div className="border-l-4 border-yellow-500 pl-4 py-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">Complaint Assigned</p>
                        <p className="text-sm text-gray-600">
                          Assigned to maintenance team for resolution.
                        </p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(complaint.assignedOn).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                {complaint.status === "IN_PROGRESS" && (
                  <div className="border-l-4 border-orange-500 pl-4 py-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">Work in Progress</p>
                        <p className="text-sm text-gray-600">
                          Our team is working on resolving this issue.
                        </p>
                      </div>
                      <span className="text-xs text-gray-500">2 hours ago</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Status Update Form (for authorized users) */}
          {(user?.role === "WARD_OFFICER" ||
            user?.role === "MAINTENANCE_TEAM" ||
            user?.role === "ADMINISTRATOR") && (
            <Card>
              <CardHeader>
                <CardTitle>Update Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="statusComment">Add Comment</Label>
                  <Textarea
                    id="statusComment"
                    value={statusComment}
                    onChange={(e) => setStatusComment(e.target.value)}
                    placeholder="Add a status update or comment..."
                    rows={3}
                  />
                </div>
                <div className="flex space-x-2">
                  {complaint.status === "REGISTERED" &&
                    user?.role === "WARD_OFFICER" && (
                      <Button
                        onClick={() => handleStatusUpdate("ASSIGNED")}
                        disabled={isUpdatingStatus}
                      >
                        {isUpdatingStatus ? "Assigning..." : "Assign"}
                      </Button>
                    )}
                  {complaint.status === "ASSIGNED" &&
                    user?.role === "MAINTENANCE_TEAM" && (
                      <Button
                        onClick={() => handleStatusUpdate("IN_PROGRESS")}
                        disabled={isUpdatingStatus}
                      >
                        {isUpdatingStatus ? "Starting..." : "Start Work"}
                      </Button>
                    )}
                  {complaint.status === "IN_PROGRESS" &&
                    user?.role === "MAINTENANCE_TEAM" && (
                      <Button
                        onClick={() => handleStatusUpdate("RESOLVED")}
                        disabled={isUpdatingStatus}
                      >
                        {isUpdatingStatus ? "Resolving..." : "Mark Resolved"}
                      </Button>
                    )}
                  {complaint.status === "RESOLVED" &&
                    user?.role === "WARD_OFFICER" && (
                      <Button
                        onClick={() => handleStatusUpdate("CLOSED")}
                        disabled={isUpdatingStatus}
                      >
                        {isUpdatingStatus ? "Closing..." : "Close Complaint"}
                      </Button>
                    )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Contact & Meta Info */}
        <div className="space-y-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {complaint.contactName && (
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{complaint.contactName}</span>
                </div>
              )}
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2 text-gray-400" />
                <span>{complaint.contactPhone}</span>
              </div>
              {complaint.contactEmail && (
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{complaint.contactEmail}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assignment Information */}
          {complaint.assignedTo && (
            <Card>
              <CardHeader>
                <CardTitle>Assignment Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Assigned To</p>
                  <p className="text-gray-600">{complaint.assignedTo}</p>
                </div>
                {complaint.deadline && (
                  <div>
                    <p className="text-sm font-medium">Deadline</p>
                    <p className="text-gray-600">
                      {new Date(complaint.deadline).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Attachments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Image className="h-5 w-5 mr-2" />
                Attachments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <Image className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">No attachments</p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Show feedback button for resolved/closed complaints if user is the complainant */}
              {(complaint.status === "RESOLVED" ||
                complaint.status === "CLOSED") &&
                complaint.submittedById === user?.id &&
                !complaint.rating && (
                  <Button
                    className="w-full justify-start"
                    onClick={() => setShowFeedbackDialog(true)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Provide Feedback
                  </Button>
                )}

              <Button variant="outline" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" />
                Export Details
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <MessageSquare className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Feedback Dialog */}
      <ComplaintFeedbackDialog
        complaintId={complaint.id}
        isOpen={showFeedbackDialog}
        onClose={() => setShowFeedbackDialog(false)}
        onSuccess={() => {
          // The complaint data will be automatically updated by RTK Query
          // due to invalidation tags
        }}
      />
    </div>
  );
};

export default ComplaintDetails;
