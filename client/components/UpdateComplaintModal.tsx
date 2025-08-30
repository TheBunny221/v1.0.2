import React, { useState, useEffect } from "react";
import { useAppSelector } from "../store/hooks";
import { getApiErrorMessage } from "../store/api/baseApi";
import {
  useUpdateComplaintMutation,
  useGetWardUsersQuery,
} from "../store/api/complaintsApi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Badge } from "./ui/badge";
import { toast } from "./ui/use-toast";
import {
  Search,
  User,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Users,
  Settings,
} from "lucide-react";

interface Complaint {
  id: string;
  complaintId?: string;
  status: string;
  priority: string;
  type: string;
  description: string;
  area: string;
  assignedTo?: any;
  wardOfficer?: any;
  maintenanceTeam?: any;
  needsTeamAssignment?: boolean;
}

interface UpdateComplaintModalProps {
  complaint: Complaint | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const UpdateComplaintModal: React.FC<UpdateComplaintModalProps> = ({
  complaint,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    status: "",
    priority: "",
    assignedToId: "",
    maintenanceTeamId: "",
    remarks: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Get users based on current user role
  const getUsersFilter = () => {
    if (user?.role === "ADMINISTRATOR") {
      return { role: "WARD_OFFICER" };
    } else if (user?.role === "WARD_OFFICER") {
      return { role: "MAINTENANCE_TEAM" };
    }
    return {};
  };

  const {
    data: usersResponse,
    isLoading: isLoadingUsers,
    error: usersError,
  } = useGetWardUsersQuery({
    page: 1,
    limit: 100,
    ...getUsersFilter(),
  });

  const [updateComplaint, { isLoading: isUpdating }] =
    useUpdateComplaintMutation();

  const availableUsers = usersResponse?.data?.users || [];

  // Filter users based on search term
  const filteredUsers = availableUsers.filter(
    (user) =>
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  useEffect(() => {
    if (complaint && isOpen) {
      // Debug: Log complaint data structure
      console.log("🔍 UpdateComplaintModal - Complaint data:", {
        id: complaint.id,
        wardOfficer: complaint.wardOfficer,
        maintenanceTeam: complaint.maintenanceTeam,
        needsTeamAssignment: (complaint as any).needsTeamAssignment,
        assignedTo: complaint.assignedTo,
      });

      // Handle both legacy assignedTo and new maintenanceTeam fields
      const assignedToId =
        typeof complaint.assignedTo === "object" && complaint.assignedTo?.id
          ? complaint.assignedTo.id
          : complaint.assignedTo || "none";

      const maintenanceTeamId =
        typeof complaint.maintenanceTeam === "object" &&
        complaint.maintenanceTeam?.id
          ? complaint.maintenanceTeam.id
          : complaint.maintenanceTeam || "none";

      console.log("🔍 UpdateComplaintModal - Extracted IDs:", {
        assignedToId,
        maintenanceTeamId,
      });

      setFormData({
        status: complaint.status,
        priority: complaint.priority,
        assignedToId,
        maintenanceTeamId,
        remarks: "",
      });
      setSearchTerm("");
      setValidationErrors([]);
    }
  }, [complaint, isOpen]);

  const validateForm = () => {
    const errors: string[] = [];

    // Skip assignment validation for resolved and closed complaints
    const isComplaintFinalized = ["RESOLVED", "CLOSED"].includes(
      formData.status,
    );

    // For ward officers, validate maintenance team assignment (only for active complaints)
    if (user?.role === "WARD_OFFICER" && !isComplaintFinalized) {
      // If complaint is currently unassigned to maintenance team and ward officer is trying to assign it
      if (
        formData.status === "ASSIGNED" &&
        (!formData.maintenanceTeamId || formData.maintenanceTeamId === "none")
      ) {
        errors.push(
          "Please select a Maintenance Team member before setting status to 'Assigned'.",
        );
      }

      // Check if transitioning from REGISTERED to ASSIGNED
      if (
        complaint?.status === "REGISTERED" &&
        formData.status === "ASSIGNED" &&
        (!formData.maintenanceTeamId || formData.maintenanceTeamId === "none")
      ) {
        errors.push(
          "Please select a Maintenance Team member to assign this complaint.",
        );
      }

      // Helpful message for ward officers with unassigned maintenance complaints (only for non-finalized complaints)
      if (
        (complaint as any)?.needsTeamAssignment &&
        !formData.maintenanceTeamId &&
        formData.status !== "REGISTERED" &&
        !["RESOLVED", "CLOSED"].includes(complaint.status)
      ) {
        errors.push(
          "This complaint needs a maintenance team assignment. Please select a team member.",
        );
      }
    }

    // For administrators, validate ward officer assignment (legacy) - only for active complaints
    if (user?.role === "ADMINISTRATOR" && !isComplaintFinalized) {
      if (
        formData.status === "ASSIGNED" &&
        (!formData.assignedToId || formData.assignedToId === "none")
      ) {
        errors.push(
          "Please select a Ward Officer before assigning the complaint.",
        );
      }
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!complaint) return;

    if (!validateForm()) {
      return;
    }

    try {
      const updateData: any = {
        status: formData.status,
        priority: formData.priority,
      };

      // For ward officers, use maintenanceTeamId
      if (user?.role === "WARD_OFFICER") {
        if (
          formData.maintenanceTeamId &&
          formData.maintenanceTeamId !== "none"
        ) {
          updateData.maintenanceTeamId = formData.maintenanceTeamId;
        }
      } else {
        // For administrators and others, use legacy assignedToId
        if (formData.assignedToId && formData.assignedToId !== "none") {
          updateData.assignedToId = formData.assignedToId;
        }
      }

      // Only include remarks if provided
      if (formData.remarks.trim()) {
        updateData.remarks = formData.remarks.trim();
      }

      const updatedComplaintResponse = await updateComplaint({
        id: complaint.id,
        ...updateData,
      }).unwrap();

      toast({
        title: "Success",
        description:
          "Complaint updated successfully. You can see the updated assignment below.",
      });

      // Update the complaint prop with fresh data so user can see the assignment
      if (updatedComplaintResponse?.data?.complaint) {
        // Update the form data to reflect the new state
        const updatedComplaint = updatedComplaintResponse.data.complaint;

        const assignedToId =
          typeof updatedComplaint.assignedTo === "object" &&
          updatedComplaint.assignedTo?.id
            ? updatedComplaint.assignedTo.id
            : updatedComplaint.assignedTo || "none";

        const maintenanceTeamId =
          typeof updatedComplaint.maintenanceTeam === "object" &&
          updatedComplaint.maintenanceTeam?.id
            ? updatedComplaint.maintenanceTeam.id
            : updatedComplaint.maintenanceTeam || "none";

        setFormData({
          status: updatedComplaint.status,
          priority: updatedComplaint.priority,
          assignedToId,
          maintenanceTeamId,
          remarks: "",
        });
      }

      onSuccess();
    } catch (error: any) {
      const message =
        error?.data?.message ||
        getApiErrorMessage(error) ||
        "Failed to update complaint";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setFormData({
      status: "",
      priority: "",
      assignedToId: "none",
      maintenanceTeamId: "none",
      remarks: "",
    });
    setSearchTerm("");
    setValidationErrors([]);
    onClose();
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

  const getUserRoleIcon = (role: string) => {
    switch (role) {
      case "WARD_OFFICER":
        return <User className="h-4 w-4" />;
      case "MAINTENANCE_TEAM":
        return <Settings className="h-4 w-4" />;
      case "ADMINISTRATOR":
        return <Users className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getDropdownLabel = () => {
    if (user?.role === "ADMINISTRATOR") {
      return "Select Ward Officer";
    } else if (user?.role === "WARD_OFFICER") {
      return "Select Maintenance Team Member";
    }
    return "Select User";
  };

  if (!complaint) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Update Complaint
          </DialogTitle>
          <DialogDescription>
            Update the status and assignment of complaint #
            {complaint.complaintId || complaint.id.slice(-6)}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Complaint Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium mb-2">Complaint Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Type:</span>{" "}
                {complaint.type.replace("_", " ")}
              </div>
              <div>
                <span className="text-gray-600">Area:</span> {complaint.area}
              </div>
              <div>
                <span className="text-gray-600">Current Status:</span>
                <Badge className={`ml-2 ${getStatusColor(complaint.status)}`}>
                  {complaint.status.replace("_", " ")}
                </Badge>
              </div>
              <div>
                <span className="text-gray-600">Current Priority:</span>
                <Badge
                  className={`ml-2 ${getPriorityColor(complaint.priority)}`}
                >
                  {complaint.priority}
                </Badge>
              </div>
            </div>
            <div className="mt-2">
              <span className="text-gray-600">Description:</span>
              <p className="text-sm mt-1">{complaint.description}</p>
            </div>

            {/* Current Assignments */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="font-medium text-sm mb-2">Current Assignments</h4>
              <div className="grid grid-cols-1 gap-2 text-sm">
                {/* Debug Information */}
                {process.env.NODE_ENV === "development" && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-xs">
                    <strong>Debug:</strong>
                    <br />
                    wardOfficer:{" "}
                    {JSON.stringify(complaint.assignedTo) || "null"}
                    <br />
                    maintenanceTeam:{" "}
                    {JSON.stringify(complaint.maintenanceTeam) || "null"}
                    <br />
                    needsTeamAssignment:{" "}
                    {String((complaint as any).needsTeamAssignment)}
                  </div>
                )}

                {/* Ward Officer Assignment */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Ward Officer:</span>
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    {complaint.assignedTo ? (
                      <span className="text-blue-600">
                        {complaint.assignedTo.fullName}
                      </span>
                    ) : (
                      <span className="text-gray-400">Not assigned</span>
                    )}
                  </div>
                </div>

                {/* Maintenance Team Assignment */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Maintenance Team:</span>
                  <div className="flex items-center">
                    <Settings className="h-4 w-4 mr-1" />
                    {complaint.maintenanceTeam ? (
                      <span className="text-green-600">
                        {complaint.maintenanceTeam.fullName}
                      </span>
                    ) : (complaint as any).needsTeamAssignment ? (
                      <Badge className="bg-orange-100 text-orange-800 text-xs">
                        Needs Assignment
                      </Badge>
                    ) : (
                      <span className="text-gray-400">Not assigned</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                <h4 className="font-medium text-red-800">Validation Errors</h4>
              </div>
              <ul className="list-disc list-inside space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index} className="text-sm text-red-700">
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Status Update */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => {
                  setFormData((prev) => ({ ...prev, status: value }));
                  // Clear validation errors when user makes changes
                  setValidationErrors([]);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="REGISTERED">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      Registered
                    </div>
                  </SelectItem>
                  <SelectItem value="ASSIGNED">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Assigned
                    </div>
                  </SelectItem>
                  <SelectItem value="IN_PROGRESS">
                    <div className="flex items-center">
                      <Settings className="h-4 w-4 mr-2" />
                      In Progress
                    </div>
                  </SelectItem>
                  <SelectItem value="RESOLVED">
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Resolved
                    </div>
                  </SelectItem>
                  <SelectItem value="CLOSED">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      Closed
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, priority: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Assignment Section */}
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="assignedTo">{getDropdownLabel()}</Label>
              {user?.role === "WARD_OFFICER" &&
                (complaint as any)?.needsTeamAssignment &&
                !["RESOLVED", "CLOSED"].includes(complaint.status) && (
                  <Badge className="bg-blue-100 text-blue-800 text-xs">
                    Assignment Required
                  </Badge>
                )}
            </div>

            {/* Helpful message for ward officers - only for active complaints */}
            {user?.role === "WARD_OFFICER" &&
              (complaint as any)?.needsTeamAssignment &&
              !["RESOLVED", "CLOSED"].includes(complaint.status) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
                  <div className="flex items-center">
                    <AlertTriangle className="h-4 w-4 text-blue-500 mr-2" />
                    <span className="text-sm text-blue-700">
                      This complaint needs to be assigned to a maintenance team
                      member to proceed.
                    </span>
                  </div>
                </div>
              )}

            <div className="space-y-2">
              {/* Search Box 
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={`Search ${user?.role === "ADMINISTRATOR" ? "ward officers" : "maintenance team members"}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>*/}

              {/* User Selection */}
              <Select
                value={
                  user?.role === "WARD_OFFICER"
                    ? formData.maintenanceTeamId
                    : formData.assignedToId
                }
                onValueChange={(value) => {
                  if (user?.role === "WARD_OFFICER") {
                    setFormData((prev) => ({
                      ...prev,
                      maintenanceTeamId: value,
                    }));
                  } else {
                    setFormData((prev) => ({ ...prev, assignedToId: value }));
                  }
                  // Clear validation errors when user makes a selection
                  setValidationErrors([]);
                }}
                disabled={isLoadingUsers || availableUsers.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={getDropdownLabel()} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      No Assignment
                    </div>
                  </SelectItem>
                  {filteredUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center justify-between w-full gap-2">
                        <div className="flex items-center">
                          {getUserRoleIcon(user.role)}
                          <div className="ml-2 text-left">
                            <div className="font-medium">{user.fullName}</div>
                            <div className="text-xs text-gray-500">
                              {user.email}
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {user.role.replace("_", " ")}
                        </Badge>
                        {user.ward && (
                          <div className="text-xs text-blue-600">
                            {user.ward.name}
                          </div>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                  {filteredUsers.length === 0 && searchTerm && (
                    <SelectItem value="no-results" disabled>
                      No users found matching "{searchTerm}"
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>

              {isLoadingUsers && (
                <div className="text-sm text-gray-500">Loading users...</div>
              )}

              {usersError && (
                <div className="text-sm text-red-500">
                  Error loading users. Please try again.
                </div>
              )}
            </div>
          </div>

          {/* Remarks */}
          <div>
            <Label htmlFor="remarks">Remarks (Optional)</Label>
            <Textarea
              id="remarks"
              placeholder="Add any additional comments or remarks about this update..."
              value={formData.remarks}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, remarks: e.target.value }))
              }
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Update Complaint"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateComplaintModal;
