import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import {
  X,
  FileText,
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Phone,
  Mail,
  Download,
  Copy,
  ExternalLink,
} from "lucide-react";

interface ComplaintDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  complaint: any;
  user: any;
}

const ComplaintDetailsModal: React.FC<ComplaintDetailsModalProps> = ({
  isOpen,
  onClose,
  complaint,
  user,
}) => {
  if (!complaint) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "REGISTERED":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "ASSIGNED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "IN_PROGRESS":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "RESOLVED":
        return "bg-green-100 text-green-800 border-green-200";
      case "CLOSED":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "LOW":
        return "bg-green-100 text-green-800 border-green-200";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "HIGH":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "URGENT":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "REGISTERED":
        return <FileText className="h-4 w-4" />;
      case "ASSIGNED":
        return <AlertCircle className="h-4 w-4" />;
      case "IN_PROGRESS":
        return <Clock className="h-4 w-4" />;
      case "RESOLVED":
      case "CLOSED":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You can add a toast notification here
  };

  const downloadComplaintDetails = () => {
    const content = `
Complaint Details
=================
Complaint ID: ${complaint.id}
Type: ${complaint.type}
Status: ${complaint.status}
Priority: ${complaint.priority}
Description: ${complaint.description}
Location: ${complaint.area}
Address: ${complaint.address || "N/A"}
Ward: ${complaint.ward || "N/A"}
Submitted On: ${new Date(complaint.submittedOn).toLocaleString()}
${complaint.assignedOn ? `Assigned On: ${new Date(complaint.assignedOn).toLocaleString()}` : ""}
${complaint.resolvedOn ? `Resolved On: ${new Date(complaint.resolvedOn).toLocaleString()}` : ""}

Contact Information
==================
Name: ${user.name}
Email: ${user.email}
Phone: ${user.phone || "N/A"}
    `;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `complaint-${complaint.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Complaint Details
                </h2>
                <p className="text-sm text-gray-500">ID: {complaint.id}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={downloadComplaintDetails}
                className="hidden sm:flex"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(complaint.id)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Overview */}
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <Badge
                    className={`${getStatusColor(complaint.status)} border flex items-center space-x-1`}
                  >
                    {getStatusIcon(complaint.status)}
                    <span>{complaint.status.replace("_", " ")}</span>
                  </Badge>
                  <Badge
                    className={`${getPriorityColor(complaint.priority)} border`}
                  >
                    {complaint.priority} Priority
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">
                    Estimated Resolution
                  </div>
                  <div className="font-medium text-blue-600">
                    {complaint.estimatedResolution}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Complaint Information */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-blue-600" />
                  Complaint Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Type
                    </label>
                    <p className="text-gray-900">{complaint.type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Description
                    </label>
                    <p className="text-gray-900 leading-relaxed">
                      {complaint.description}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      Location
                    </label>
                    <p className="text-gray-900">{complaint.area}</p>
                    {complaint.address && (
                      <p className="text-sm text-gray-600 mt-1">
                        {complaint.address}
                      </p>
                    )}
                    {complaint.landmark && (
                      <p className="text-sm text-gray-600">
                        Landmark: {complaint.landmark}
                      </p>
                    )}
                  </div>
                  {complaint.ward && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Ward
                      </label>
                      <p className="text-gray-900">{complaint.ward}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2 text-green-600" />
                  Contact Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Name
                    </label>
                    <p className="text-gray-900">{user.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center">
                      <Mail className="h-4 w-4 mr-1" />
                      Email
                    </label>
                    <p className="text-gray-900">{user.email}</p>
                  </div>
                  {user.phone && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 flex items-center">
                        <Phone className="h-4 w-4 mr-1" />
                        Phone
                      </label>
                      <p className="text-gray-900">{user.phone}</p>
                    </div>
                  )}
                  {(complaint.wardOfficer || complaint.assignedTo) && (
                    <div className="pt-4 border-t">
                      <label className="text-sm font-medium text-gray-500">
                        Assigned To
                      </label>
                      <p className="text-gray-900">
                        {(complaint.wardOfficer || complaint.assignedTo).name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {(complaint.wardOfficer || complaint.assignedTo).role}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Timeline */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-orange-600" />
                Status Timeline
              </h3>
              <div className="space-y-4">
                {/* Registered */}
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-green-600">
                        Complaint Registered
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(complaint.submittedOn).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600">
                      Your complaint has been successfully registered in our
                      system.
                    </p>
                  </div>
                </div>

                {/* Assigned */}
                <div className="flex items-start space-x-4">
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      complaint.assignedOn ? "bg-green-100" : "bg-gray-100"
                    }`}
                  >
                    <AlertCircle
                      className={`h-5 w-5 ${
                        complaint.assignedOn
                          ? "text-green-600"
                          : "text-gray-400"
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p
                        className={`font-medium ${
                          complaint.assignedOn
                            ? "text-green-600"
                            : "text-gray-400"
                        }`}
                      >
                        Complaint Assigned
                      </p>
                      {complaint.assignedOn && (
                        <p className="text-sm text-gray-500">
                          {new Date(complaint.assignedOn).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {complaint.assignedOn
                        ? "Assigned to the appropriate team for resolution."
                        : "Waiting to be assigned to a team member."}
                    </p>
                  </div>
                </div>

                {/* In Progress */}
                <div className="flex items-start space-x-4">
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      ["IN_PROGRESS", "RESOLVED", "CLOSED"].includes(
                        complaint.status,
                      )
                        ? "bg-green-100"
                        : "bg-gray-100"
                    }`}
                  >
                    <Clock
                      className={`h-5 w-5 ${
                        ["IN_PROGRESS", "RESOLVED", "CLOSED"].includes(
                          complaint.status,
                        )
                          ? "text-green-600"
                          : "text-gray-400"
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p
                        className={`font-medium ${
                          ["IN_PROGRESS", "RESOLVED", "CLOSED"].includes(
                            complaint.status,
                          )
                            ? "text-green-600"
                            : "text-gray-400"
                        }`}
                      >
                        Work in Progress
                      </p>
                    </div>
                    <p className="text-sm text-gray-600">
                      {["IN_PROGRESS", "RESOLVED", "CLOSED"].includes(
                        complaint.status,
                      )
                        ? "Our team is actively working on resolving your complaint."
                        : "Work will begin once the complaint is assigned."}
                    </p>
                  </div>
                </div>

                {/* Resolved */}
                <div className="flex items-start space-x-4">
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      complaint.resolvedOn ? "bg-green-100" : "bg-gray-100"
                    }`}
                  >
                    <CheckCircle
                      className={`h-5 w-5 ${
                        complaint.resolvedOn
                          ? "text-green-600"
                          : "text-gray-400"
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p
                        className={`font-medium ${
                          complaint.resolvedOn
                            ? "text-green-600"
                            : "text-gray-400"
                        }`}
                      >
                        Complaint Resolved
                      </p>
                      {complaint.resolvedOn && (
                        <p className="text-sm text-gray-500">
                          {new Date(complaint.resolvedOn).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {complaint.resolvedOn
                        ? "Your complaint has been successfully resolved."
                        : "Your complaint will be marked as resolved once the work is completed."}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attachments */}
          {complaint.attachments && complaint.attachments.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-lg mb-4">Attachments</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {complaint.attachments.map(
                    (attachment: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <FileText className="h-8 w-8 text-blue-600" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {attachment.originalName ||
                              attachment.fileName ||
                              `Attachment ${index + 1}`}
                          </p>
                          <p className="text-xs text-gray-500">
                            {attachment.size
                              ? `${(attachment.size / 1024).toFixed(1)} KB`
                              : ""}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-gray-500">
              Need help? Contact support at{" "}
              <a
                href="mailto:support@cochinsmartcity.in"
                className="text-blue-600 hover:underline"
              >
                support@cochinsmartcity.in
              </a>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={downloadComplaintDetails}
                className="sm:hidden"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button onClick={onClose}>Close</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ComplaintDetailsModal;
