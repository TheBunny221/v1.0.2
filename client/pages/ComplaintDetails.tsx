import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import { useGetComplaintQuery } from "../store/api/complaintsApi";
import { useDataManager } from "../hooks/useDataManager";
import ComplaintFeedbackDialog from "../components/ComplaintFeedbackDialog";
import UpdateComplaintModal from "../components/UpdateComplaintModal";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
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
// Dynamic import for jsPDF to avoid build issues

const ComplaintDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { translations } = useAppSelector((state) => state.language);

  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  // Data management hooks
  const { cacheComplaintDetails, getComplaintDetails } = useDataManager();

  // Use RTK Query to fetch complaint details
  const {
    data: complaintResponse,
    isLoading,
    error,
  } = useGetComplaintQuery(id!, { skip: !id || !isAuthenticated });

  const complaint = complaintResponse?.data?.complaint;

  // Cache complaint details when loaded
  useEffect(() => {
    if (complaint && id) {
      cacheComplaintDetails(id, complaint);
    }
  }, [complaint, id, cacheComplaintDetails]);

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

  const handleExportDetails = async () => {
    if (!complaint) {
      console.error("No complaint data available for export");
      return;
    }

    try {
      // Dynamically import jsPDF to avoid build issues
      const { default: jsPDF } = await import("jspdf");

      // Get current translations for the user's language
      const t = translations || {};

      // Create PDF document
      const doc = new jsPDF();
      let yPosition = 20;
      const lineHeight = 10;
      const sectionSpacing = 5;

      // Helper function to add text with word wrapping
      const addText = (text: string, fontSize = 10, isBold = false) => {
        if (isBold) {
          doc.setFont("helvetica", "bold");
        } else {
          doc.setFont("helvetica", "normal");
        }
        doc.setFontSize(fontSize);

        // Simple word wrapping for long text
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 20;
        const maxWidth = pageWidth - 2 * margin;
        const lines = doc.splitTextToSize(text, maxWidth);

        lines.forEach((line: string) => {
          if (yPosition > 280) {
            // Check if we need a new page
            doc.addPage();
            yPosition = 20;
          }
          doc.text(line, margin, yPosition);
          yPosition += lineHeight;
        });

        return yPosition;
      };

      // Header
      addText(t.common?.export || "Export Details", 16, true);
      yPosition += sectionSpacing;

      // Complaint Information Section
      yPosition += sectionSpacing;
      addText(t.complaints?.complaintId || "Complaint ID", 12, true);
      addText(complaint.complaintId || complaint.id);
      yPosition += sectionSpacing;

      if (complaint.type) {
        addText(t.complaints?.complaintType || "Complaint Type", 12, true);
        addText(complaint.type);
        yPosition += sectionSpacing;
      }

      if (complaint.title) {
        addText(t.complaints?.title || "Title", 12, true);
        addText(complaint.title);
        yPosition += sectionSpacing;
      }

      if (complaint.description) {
        addText(t.complaints?.description || "Description", 12, true);
        addText(complaint.description);
        yPosition += sectionSpacing;
      }

      if (complaint.status) {
        addText(t.complaints?.status || "Status", 12, true);
        // Translate status if available
        const statusKey =
          complaint.status.toLowerCase() as keyof typeof t.complaints;
        const translatedStatus = t.complaints?.[statusKey] || complaint.status;
        addText(translatedStatus);
        yPosition += sectionSpacing;
      }

      if (complaint.priority) {
        addText(t.complaints?.priority || "Priority", 12, true);
        // Translate priority if available
        const priorityKey =
          complaint.priority.toLowerCase() as keyof typeof t.complaints;
        const translatedPriority =
          t.complaints?.[priorityKey] || complaint.priority;
        addText(translatedPriority);
        yPosition += sectionSpacing;
      }

      // Location Information
      yPosition += sectionSpacing;
      addText(t.complaints?.locationDetails || "Location Details", 14, true);
      yPosition += sectionSpacing;

      if (complaint.ward?.name) {
        addText(t.complaints?.ward || "Ward", 12, true);
        addText(complaint.ward.name);
        yPosition += sectionSpacing;
      }

      if (complaint.area) {
        addText(t.complaints?.area || "Area", 12, true);
        addText(complaint.area);
        yPosition += sectionSpacing;
      }

      if (complaint.location) {
        addText(t.complaints?.location || "Location", 12, true);
        addText(complaint.location);
        yPosition += sectionSpacing;
      }

      if (complaint.address) {
        addText(t.complaints?.address || "Address", 12, true);
        addText(complaint.address);
        yPosition += sectionSpacing;
      }

      // Contact Information
      yPosition += sectionSpacing;
      addText(t.forms?.contactInformation || "Contact Information", 14, true);
      yPosition += sectionSpacing;

      if (complaint.submittedBy?.fullName) {
        addText(t.complaints?.submittedBy || "Submitted By", 12, true);
        addText(complaint.submittedBy.fullName);
        yPosition += sectionSpacing;
      }

      if (complaint.mobile) {
        addText(t.complaints?.mobile || "Mobile", 12, true);
        addText(complaint.mobile);
        yPosition += sectionSpacing;
      }

      if (complaint.email) {
        addText(t.auth?.email || "Email", 12, true);
        addText(complaint.email);
        yPosition += sectionSpacing;
      }

      // Dates
      yPosition += sectionSpacing;
      addText(t.common?.dates || "Important Dates", 14, true);
      yPosition += sectionSpacing;

      if (complaint.submittedOn) {
        addText(t.complaints?.submittedDate || "Submitted Date", 12, true);
        addText(new Date(complaint.submittedOn).toLocaleDateString());
        yPosition += sectionSpacing;
      }

      if (complaint.lastUpdated) {
        addText(t.complaints?.lastUpdated || "Last Updated", 12, true);
        addText(new Date(complaint.lastUpdated).toLocaleDateString());
        yPosition += sectionSpacing;
      }

      if (complaint.resolvedDate) {
        addText(t.complaints?.resolvedDate || "Resolved Date", 12, true);
        addText(new Date(complaint.resolvedDate).toLocaleDateString());
        yPosition += sectionSpacing;
      }

      // Assignment Information
      if (complaint.assignedTo?.fullName) {
        yPosition += sectionSpacing;
        addText(t.complaints?.assignedTo || "Assigned To", 12, true);
        addText(complaint.assignedTo.fullName);
        yPosition += sectionSpacing;
      }

      // Remarks and Feedback
      if (complaint.remarks) {
        yPosition += sectionSpacing;
        addText(t.complaints?.remarks || "Remarks", 12, true);
        addText(complaint.remarks);
        yPosition += sectionSpacing;
      }

      if (complaint.feedback) {
        yPosition += sectionSpacing;
        addText(t.complaints?.feedback || "Feedback", 12, true);
        addText(complaint.feedback);
        yPosition += sectionSpacing;
      }

      if (complaint.rating) {
        yPosition += sectionSpacing;
        addText(t.complaints?.rating || "Rating", 12, true);
        addText(`${complaint.rating}/5`);
        yPosition += sectionSpacing;
      }

      // Attachments
      if (complaint.attachments && complaint.attachments.length > 0) {
        yPosition += sectionSpacing;
        addText(t.complaints?.attachments || "Attachments", 14, true);
        yPosition += sectionSpacing;

        complaint.attachments.forEach((attachment, index) => {
          addText(
            `${index + 1}. ${attachment.originalName || attachment.fileName}`,
          );
        });
        yPosition += sectionSpacing;
      }

      // Footer with export information
      yPosition += sectionSpacing * 2;
      addText(
        `${t.common?.export || "Exported"}: ${new Date().toLocaleString()}`,
        8,
      );
      if (user?.fullName) {
        addText(`${t.common?.by || "By"}: ${user.fullName}`, 8);
      }

      // Save PDF
      const fileName = `complaint-${complaint.complaintId || complaint.id}-${new Date().toISOString().split("T")[0]}.pdf`;
      doc.save(fileName);

      console.log("Complaint details exported as PDF successfully");
    } catch (error) {
      console.error("Failed to export complaint details as PDF:", error);
      // Show user-friendly error message
      alert(
        "Failed to export complaint details. Please try again or contact support if the issue persists.",
      );
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
              Complaint #
              {complaint?.complaintId || complaint?.id?.slice(-6) || "Unknown"}
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <Badge className={getStatusColor(complaint?.status || "")}>
              {complaint?.status?.replace("_", " ") || "Unknown"}
            </Badge>
            <Badge className={getPriorityColor(complaint?.priority || "")}>
              {complaint?.priority || "Unknown"} Priority
            </Badge>
            <span className="text-sm text-gray-500">
              Created{" "}
              {complaint?.submittedOn
                ? new Date(complaint.submittedOn).toLocaleDateString()
                : "Unknown"}
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
                  {complaint?.type?.replace("_", " ") || "Unknown Type"}
                </p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Description</h3>
                <p className="text-gray-600">
                  {complaint?.description || "No description available"}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2 flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    Location Information
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-600">
                      <strong>Area:</strong> {complaint.area}
                    </p>
                    {complaint.ward && (
                      <p className="text-gray-600">
                        <strong>Ward:</strong> {complaint.ward.name}
                      </p>
                    )}
                    {complaint.subZone && (
                      <p className="text-gray-600">
                        <strong>Sub-Zone:</strong> {complaint.subZone.name}
                      </p>
                    )}
                    {complaint.landmark && (
                      <p className="text-gray-600">
                        <strong>Landmark:</strong> {complaint.landmark}
                      </p>
                    )}
                    {complaint.address && (
                      <p className="text-gray-600">
                        <strong>Address:</strong> {complaint.address}
                      </p>
                    )}
                    {/* Show coordinates for admin/ward managers */}
                    {(user?.role === "ADMINISTRATOR" ||
                      user?.role === "WARD_OFFICER") &&
                      complaint.coordinates && (
                        <p className="text-gray-500 text-xs">
                          <strong>Coordinates:</strong> {complaint.coordinates}
                        </p>
                      )}
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-2 flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Timeline
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-600">
                      <strong>Submitted:</strong>{" "}
                      {new Date(complaint.submittedOn).toLocaleString()}
                    </p>
                    {complaint.assignedOn && (
                      <p className="text-gray-600">
                        <strong>Assigned:</strong>{" "}
                        {new Date(complaint.assignedOn).toLocaleString()}
                      </p>
                    )}
                    {complaint.resolvedOn && (
                      <p className="text-gray-600">
                        <strong>Resolved:</strong>{" "}
                        {new Date(complaint.resolvedOn).toLocaleString()}
                      </p>
                    )}
                    {complaint.closedOn && (
                      <p className="text-gray-600">
                        <strong>Closed:</strong>{" "}
                        {new Date(complaint.closedOn).toLocaleString()}
                      </p>
                    )}
                    {/* Show deadline and SLA status for admin/ward managers */}
                    {(user?.role === "ADMINISTRATOR" ||
                      user?.role === "WARD_OFFICER") && (
                      <>
                        {complaint.deadline && (
                          <p className="text-gray-600">
                            <strong>Deadline:</strong>{" "}
                            {new Date(complaint.deadline).toLocaleString()}
                          </p>
                        )}
                        {complaint.slaStatus && (
                          <p
                            className={`text-sm font-medium ${
                              complaint.slaStatus === "OVERDUE"
                                ? "text-red-600"
                                : complaint.slaStatus === "WARNING"
                                  ? "text-orange-600"
                                  : complaint.slaStatus === "ON_TIME"
                                    ? "text-green-600"
                                    : "text-gray-600"
                            }`}
                          >
                            <strong>SLA Status:</strong>{" "}
                            {complaint.slaStatus.replace("_", " ")}
                          </p>
                        )}
                      </>
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
                {user?.role === "CITIZEN"
                  ? "Status Updates"
                  : "Status Updates & Comments"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Real status logs with remarks and comments */}
                {complaint.statusLogs && complaint.statusLogs.length > 0 ? (
                  complaint.statusLogs.map((log, index) => {
                    const getStatusColor = (status) => {
                      switch (status) {
                        case "REGISTERED":
                          return "border-blue-500";
                        case "ASSIGNED":
                          return "border-yellow-500";
                        case "IN_PROGRESS":
                          return "border-orange-500";
                        case "RESOLVED":
                          return "border-green-500";
                        case "CLOSED":
                          return "border-gray-500";
                        default:
                          return "border-gray-400";
                      }
                    };

                    const getStatusLabel = (status) => {
                      switch (status) {
                        case "REGISTERED":
                          return "Complaint Registered";
                        case "ASSIGNED":
                          return "Complaint Assigned";
                        case "IN_PROGRESS":
                          return "Work in Progress";
                        case "RESOLVED":
                          return "Complaint Resolved";
                        case "CLOSED":
                          return "Complaint Closed";
                        default:
                          return `Status: ${status}`;
                      }
                    };

                    // Get citizen-friendly status messages
                    const getCitizenStatusMessage = (status, log) => {
                      switch (status) {
                        case "REGISTERED":
                          return "Your complaint has been successfully registered and is under review.";
                        case "ASSIGNED":
                          return "Your complaint has been assigned to our maintenance team for resolution.";
                        case "IN_PROGRESS":
                          return "Our team is actively working on resolving your complaint.";
                        case "RESOLVED":
                          return "Your complaint has been resolved. Please verify and provide feedback.";
                        case "CLOSED":
                          return "Your complaint has been completed and closed.";
                        default:
                          return `Your complaint status has been updated to ${status.toLowerCase().replace("_", " ")}.`;
                      }
                    };

                    // Check if user is a citizen
                    const isCitizen = user?.role === "CITIZEN";

                    return (
                      <div
                        key={log.id || index}
                        className={`border-l-4 ${getStatusColor(log.toStatus)} pl-4 py-2`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">
                                {getStatusLabel(log.toStatus)}
                              </p>
                              {/* Show staff details only to non-citizens */}
                              {!isCitizen && log.user && (
                                <Badge variant="outline" className="text-xs">
                                  {log.user.fullName} ({log.user.role})
                                </Badge>
                              )}
                            </div>

                            {/* Show appropriate message based on user role */}
                            {isCitizen ? (
                              <p className="text-sm text-gray-600 mb-1">
                                {getCitizenStatusMessage(log.toStatus, log)}
                              </p>
                            ) : (
                              <>
                                {log.comment && (
                                  <p className="text-sm text-gray-600 mb-1">
                                    <strong>Remarks:</strong> {log.comment}
                                  </p>
                                )}
                              </>
                            )}

                            {log.fromStatus && (
                              <p className="text-xs text-gray-500">
                                Status changed from{" "}
                                <span className="font-medium">
                                  {log.fromStatus}
                                </span>{" "}
                                to{" "}
                                <span className="font-medium">
                                  {log.toStatus}
                                </span>
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-gray-500 ml-4">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>
                      {user?.role === "CITIZEN"
                        ? "No updates available for your complaint yet"
                        : "No status updates available"}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Administrative Information - Only for admin/ward managers */}
          {(user?.role === "ADMINISTRATOR" ||
            user?.role === "WARD_OFFICER") && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Administrative Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Assignment Details</h4>
                    <div className="space-y-1 text-sm">
                      {complaint.submittedBy && (
                        <p className="text-gray-600">
                          <strong>Submitted By:</strong>{" "}
                          {complaint.submittedBy.fullName}
                          {complaint.submittedBy.email &&
                            ` (${complaint.submittedBy.email})`}
                        </p>
                      )}
                      {complaint.assignedTo && (
                        <p className="text-gray-600">
                          <strong>Assigned To:</strong>{" "}
                          {complaint.assignedTo.fullName}
                          {complaint.assignedTo.email &&
                            ` (${complaint.assignedTo.email})`}
                        </p>
                      )}
                      {complaint.resolvedById && (
                        <p className="text-gray-600">
                          <strong>Resolved By:</strong> {complaint.resolvedById}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Technical Details</h4>
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-600">
                        <strong>Complaint ID:</strong>{" "}
                        {complaint.complaintId || complaint.id}
                      </p>
                      <p className="text-gray-600">
                        <strong>Internal ID:</strong> {complaint.id}
                      </p>
                      {complaint.isAnonymous !== undefined && (
                        <p className="text-gray-600">
                          <strong>Anonymous:</strong>{" "}
                          {complaint.isAnonymous ? "Yes" : "No"}
                        </p>
                      )}
                      {complaint.tags && (
                        <p className="text-gray-600">
                          <strong>Tags:</strong>{" "}
                          {JSON.parse(complaint.tags).join(", ")}
                        </p>
                      )}
                      <p className="text-gray-500 text-xs">
                        <strong>Created:</strong>{" "}
                        {new Date(
                          complaint.createdAt || complaint.submittedOn,
                        ).toLocaleString()}
                      </p>
                      <p className="text-gray-500 text-xs">
                        <strong>Last Updated:</strong>{" "}
                        {new Date(
                          complaint.updatedAt || complaint.submittedOn,
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Citizen Feedback Section */}
                {(complaint.citizenFeedback || complaint.rating) && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">Citizen Feedback</h4>
                    <div className="bg-blue-50 rounded-lg p-3">
                      {complaint.rating && (
                        <p className="text-sm text-blue-800 mb-1">
                          <strong>Rating:</strong> {complaint.rating}/5 ⭐
                        </p>
                      )}
                      {complaint.citizenFeedback && (
                        <p className="text-sm text-blue-700">
                          <strong>Feedback:</strong> {complaint.citizenFeedback}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* General Remarks - Hidden from citizens as they may contain internal notes */}
          {complaint.remarks && user?.role !== "CITIZEN" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Internal Remarks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {complaint.remarks}
                  </p>
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
                  <div className="flex flex-col">
                    <span className="font-medium">{complaint.contactName}</span>
                    {/* Show if submitted by registered user for admin/ward managers */}
                    {(user?.role === "ADMINISTRATOR" ||
                      user?.role === "WARD_OFFICER") &&
                      complaint.submittedBy && (
                        <span className="text-xs text-gray-500">
                          Registered User: {complaint.submittedBy.fullName}
                        </span>
                      )}
                  </div>
                </div>
              )}
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2 text-gray-400" />
                <div className="flex flex-col">
                  <span>{complaint.contactPhone}</span>
                  {/* Show submitter phone for admin/ward managers if different */}
                  {(user?.role === "ADMINISTRATOR" ||
                    user?.role === "WARD_OFFICER") &&
                    complaint.submittedBy?.phoneNumber &&
                    complaint.submittedBy.phoneNumber !==
                      complaint.contactPhone && (
                      <span className="text-xs text-gray-500">
                        User Phone: {complaint.submittedBy.phoneNumber}
                      </span>
                    )}
                </div>
              </div>
              {complaint.contactEmail && (
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-gray-400" />
                  <div className="flex flex-col">
                    <span>{complaint.contactEmail}</span>
                    {/* Show submitter email for admin/ward managers if different */}
                    {(user?.role === "ADMINISTRATOR" ||
                      user?.role === "WARD_OFFICER") &&
                      complaint.submittedBy?.email &&
                      complaint.submittedBy.email !==
                        complaint.contactEmail && (
                        <span className="text-xs text-gray-500">
                          User Email: {complaint.submittedBy.email}
                        </span>
                      )}
                  </div>
                </div>
              )}

              {/* Show anonymity status for admin/ward managers */}
              {(user?.role === "ADMINISTRATOR" ||
                user?.role === "WARD_OFFICER") &&
                complaint.isAnonymous && (
                  <div className="flex items-center text-orange-600">
                    <User className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">
                      Anonymous Complaint
                    </span>
                  </div>
                )}
            </CardContent>
          </Card>

          {/* Assignment Information */}
          {(complaint.assignedTo ||
            user?.role === "ADMINISTRATOR" ||
            user?.role === "WARD_OFFICER") && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Assignment & Status Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {complaint.assignedTo ? (
                  <div>
                    <p className="text-sm font-medium mb-1">Assigned To</p>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-blue-800 font-medium">
                        {typeof complaint.assignedTo === "object" &&
                        complaint.assignedTo
                          ? complaint.assignedTo.fullName
                          : complaint.assignedTo}
                      </p>
                      {typeof complaint.assignedTo === "object" &&
                        complaint.assignedTo?.email && (
                          <p className="text-blue-600 text-sm">
                            {complaint.assignedTo.email}
                          </p>
                        )}
                      {complaint.assignedOn && (
                        <p className="text-blue-600 text-xs mt-1">
                          Assigned on:{" "}
                          {new Date(complaint.assignedOn).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  (user?.role === "ADMINISTRATOR" ||
                    user?.role === "WARD_OFFICER") && (
                    <div>
                      <p className="text-sm font-medium mb-1">
                        Assignment Status
                      </p>
                      <div className="bg-yellow-50 rounded-lg p-3">
                        <p className="text-yellow-800 font-medium">
                          Unassigned
                        </p>
                        <p className="text-yellow-600 text-sm">
                          This complaint has not been assigned to any team
                          member yet.
                        </p>
                      </div>
                    </div>
                  )
                )}

                {/* Show deadline information for admin/ward managers */}
                {(user?.role === "ADMINISTRATOR" ||
                  user?.role === "WARD_OFFICER") && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {complaint.deadline && (
                      <div>
                        <p className="text-sm font-medium mb-1">Deadline</p>
                        <p
                          className={`text-sm ${
                            new Date(complaint.deadline) < new Date()
                              ? "text-red-600 font-medium"
                              : "text-gray-600"
                          }`}
                        >
                          {new Date(complaint.deadline).toLocaleString()}
                          {new Date(complaint.deadline) < new Date() &&
                            " (Overdue)"}
                        </p>
                      </div>
                    )}

                    {complaint.slaStatus && (
                      <div>
                        <p className="text-sm font-medium mb-1">SLA Status</p>
                        <Badge
                          className={
                            complaint.slaStatus === "OVERDUE"
                              ? "bg-red-100 text-red-800"
                              : complaint.slaStatus === "WARNING"
                                ? "bg-orange-100 text-orange-800"
                                : complaint.slaStatus === "ON_TIME"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                          }
                        >
                          {complaint.slaStatus.replace("_", " ")}
                        </Badge>
                      </div>
                    )}
                  </div>
                )}

                {/* Show priority and type for admin/ward managers */}
                {(user?.role === "ADMINISTRATOR" ||
                  user?.role === "WARD_OFFICER") && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
                    <div>
                      <p className="text-sm font-medium mb-1">Priority Level</p>
                      <Badge className={getPriorityColor(complaint.priority)}>
                        {complaint.priority} Priority
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Complaint Type</p>
                      <Badge variant="outline">
                        {complaint.type?.replace("_", " ")}
                      </Badge>
                    </div>
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
                Attachments ({complaint?.attachments?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {complaint?.attachments && complaint.attachments.length > 0 ? (
                <div className="space-y-3">
                  {complaint.attachments.map((attachment: any) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        {attachment.mimeType?.startsWith("image/") ? (
                          <Image className="h-5 w-5 text-blue-500" />
                        ) : (
                          <FileText className="h-5 w-5 text-gray-500" />
                        )}
                        <div>
                          <p className="font-medium text-sm">
                            {attachment.originalName || attachment.fileName}
                          </p>
                          <div className="text-xs text-gray-500 space-y-1">
                            <p>
                              {(attachment.size / 1024).toFixed(1)} KB •{" "}
                              {new Date(
                                attachment.uploadedAt,
                              ).toLocaleDateString()}
                            </p>
                            {/* Show additional details for admin/ward managers */}
                            {(user?.role === "ADMINISTRATOR" ||
                              user?.role === "WARD_OFFICER") && (
                              <>
                                <p>Type: {attachment.mimeType}</p>
                                {attachment.fileName !==
                                  attachment.originalName && (
                                  <p>Stored as: {attachment.fileName}</p>
                                )}
                                <p>
                                  Uploaded:{" "}
                                  {new Date(
                                    attachment.uploadedAt,
                                  ).toLocaleString()}
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(attachment.url, "_blank")}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {attachment.mimeType?.startsWith("image/") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              window.open(attachment.url, "_blank")
                            }
                          >
                            View
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Image className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">No attachments</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Status update button for Ward Officers and Administrators */}
              {(user?.role === "WARD_OFFICER" ||
                user?.role === "ADMINISTRATOR") && (
                <Button
                  className="w-full justify-start"
                  onClick={() => setIsUpdateModalOpen(true)}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Update Status
                </Button>
              )}

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

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleExportDetails}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Details
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Update Complaint Modal */}
      <UpdateComplaintModal
        complaint={complaint}
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        onSuccess={() => {
          setIsUpdateModalOpen(false);
        }}
      />

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
