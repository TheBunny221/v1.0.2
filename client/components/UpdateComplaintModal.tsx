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
  RotateCcw,
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
    // New primary field for ward officer assignment
    wardOfficerId: "",
    // Legacy field kept for backward compatibility where needed
    assignedToId: "",
    maintenanceTeamId: "",
    remarks: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Admins need both ward officers and maintenance team lists
  const {
    data: wardOfficerResponse,
    isLoading: isLoadingWardOfficers,
    error: wardOfficersError,
  } = useGetWardUsersQuery(
    { page: 1, limit: 200, role: "WARD_OFFICER" },
    { skip: user?.role !== "ADMINISTRATOR" && user?.role !== "WARD_OFFICER" },
  );

  const {
    data: maintenanceResponse,
    isLoading: isLoadingMaintenance,
    error: maintenanceError,
  } = useGetWardUsersQuery(
    { page: 1, limit: 200, role: "MAINTENANCE_TEAM" },
    { skip: user?.role !== "ADMINISTRATOR" && user?.role !== "WARD_OFFICER" },
  );

  // For legacy single-list flows, present available users based on role
  const wardOfficerUsers = wardOfficerResponse?.data?.users || [];
  const maintenanceUsers = maintenanceResponse?.data?.users || [];
  const availableUsers =
    user?.role === "WARD_OFFICER" ? maintenanceUsers : wardOfficerUsers;

  const [updateComplaint, { isLoading: isUpdating }] =
    useUpdateComplaintMutation();

  // Filter users based on search term
  const filteredUsers = availableUsers.filter(
    (u) =>
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  useEffect(() => {
    if (complaint && isOpen) {
      // Extract IDs from complaint (prefer new wardOfficer field but keep legacy support)
      const wardOfficerId =
        typeof complaint.wardOfficer === "object" && complaint.wardOfficer?.id
          ? complaint.wardOfficer.id
          : complaint.wardOfficer || "none";

      const assignedToId =
        typeof complaint.assignedTo === "object" && complaint.assignedTo?.id
          ? complaint.assignedTo.id
          : complaint.assignedTo || "none";

      const maintenanceTeamId =
        typeof complaint.maintenanceTeam === "object" &&
        complaint.maintenanceTeam?.id
          ? complaint.maintenanceTeam.id
          : complaint.maintenanceTeam || "none";

      setFormData({
        status: complaint.status,
        priority: complaint.priority,
        wardOfficerId,
        assignedToId,
        maintenanceTeamId,
        remarks: "",
      });

      setSearchTerm("");
      setValidationErrors([]);
    }
  }, [complaint, isOpen]);

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
    if (user?.role === "ADMINISTRATOR")
      return "Select Ward Officer & Team Member";
    if (user?.role === "WARD_OFFICER") return "Select Maintenance Team Member";
    return "Select User";
  };

  const getAvailableStatusOptions = () => {
    const currentStatus = complaint?.status;

    if (user?.role === "MAINTENANCE_TEAM") {
      const statusFlow: Record<string, string[]> = {
        ASSIGNED: ["ASSIGNED", "IN_PROGRESS"],
        IN_PROGRESS: ["IN_PROGRESS", "RESOLVED"],
        RESOLVED: ["RESOLVED"],
        REOPENED: ["REOPENED", "IN_PROGRESS"],
      };
      return statusFlow[currentStatus] || ["IN_PROGRESS", "RESOLVED"];
    }

    if (user?.role === "WARD_OFFICER") {
      return ["REGISTERED", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"];
    }

    if (user?.role === "ADMINISTRATOR") {
      return [
        "REGISTERED",
        "ASSIGNED",
        "IN_PROGRESS",
        "RESOLVED",
        "CLOSED",
        "REOPENED",
      ];
    }

    return ["REGISTERED", "ASSIGNED", "IN_PROGRESS", "RESOLVED"];
  };

  const validateForm = () => {
    const errors: string[] = [];
    const availableStatuses = getAvailableStatusOptions();
    if (formData.status && !availableStatuses.includes(formData.status)) {
      errors.push(
        `You don't have permission to set status to '${formData.status}'. Available options: ${availableStatuses.join(", ")}`,
      );
    }

    if (user?.role === "MAINTENANCE_TEAM") {
      if (formData.status === "ASSIGNED" && complaint?.status !== "ASSIGNED") {
        errors.push("Maintenance team cannot set status back to 'Assigned'.");
      }
      if (formData.status === "REGISTERED") {
        errors.push("Maintenance team cannot set status to 'Registered'.");
      }
      if (formData.priority !== complaint?.priority) {
        errors.push(
          "Maintenance team cannot change complaint priority. Contact your supervisor if needed.",
        );
      }
    }

    const isComplaintFinalized = ["RESOLVED", "CLOSED"].includes(
      formData.status,
    );

    if (user?.role === "WARD_OFFICER" && !isComplaintFinalized) {
      if (
        formData.status === "ASSIGNED" &&
        (!formData.maintenanceTeamId || formData.maintenanceTeamId === "none")
      ) {
        errors.push(
          "Please select a Maintenance Team member before setting status to 'Assigned'.",
        );
      }
      if (
        complaint?.status === "REGISTERED" &&
        formData.status === "ASSIGNED" &&
        (!formData.maintenanceTeamId || formData.maintenanceTeamId === "none")
      ) {
        errors.push(
          "Please select a Maintenance Team member to assign this complaint.",
        );
      }
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

    // Admin must pick a ward officer (new field) when assigning
    if (user?.role === "ADMINISTRATOR" && !isComplaintFinalized) {
      if (
        formData.status === "ASSIGNED" &&
        (!formData.wardOfficerId || formData.wardOfficerId === "none")
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
    if (!validateForm()) return;

    try {
      const updateData: any = { status: formData.status };
      if (user?.role !== "MAINTENANCE_TEAM")
        updateData.priority = formData.priority;

      if (user?.role === "WARD_OFFICER") {
        if (
          formData.maintenanceTeamId &&
          formData.maintenanceTeamId !== "none"
        ) {
          updateData.maintenanceTeamId = formData.maintenanceTeamId;
        }
      } else if (user?.role === "ADMINISTRATOR") {
        // Admin sets wardOfficerId (new primary field); keep assignedToId for backward compatibility
        if (formData.wardOfficerId && formData.wardOfficerId !== "none") {
          updateData.wardOfficerId = formData.wardOfficerId;
          // also set legacy assignedToId to preserve older expectations
          updateData.assignedToId = formData.wardOfficerId;
        }
        if (
          formData.maintenanceTeamId &&
          formData.maintenanceTeamId !== "none"
        ) {
          updateData.maintenanceTeamId = formData.maintenanceTeamId;
        }
      } else {
        // fallback: include legacy assignedToId if present
        if (formData.assignedToId && formData.assignedToId !== "none")
          updateData.assignedToId = formData.assignedToId;
      }

      if (formData.remarks && formData.remarks.trim())
        updateData.remarks = formData.remarks.trim();

      const updatedComplaintResponse = await updateComplaint({
        id: complaint.id,
        ...updateData,
      }).unwrap();

      toast({
        title: "Success",
        description:
          "Complaint updated successfully. You can see the updated assignment below.",
      });

      if (updatedComplaintResponse?.data) {
        const updatedComplaint = updatedComplaintResponse.data;
        const wardOfficerId =
          typeof updatedComplaint.wardOfficer === "object" &&
          (updatedComplaint.wardOfficer as any)?.id
            ? (updatedComplaint.wardOfficer as any).id
            : (updatedComplaint as any).wardOfficer || "none";
        const assignedToId =
          typeof updatedComplaint.assignedTo === "object" &&
          (updatedComplaint.assignedTo as any)?.id
            ? (updatedComplaint.assignedTo as any).id
            : (updatedComplaint as any).assignedTo || "none";
        const maintenanceTeamId =
          typeof updatedComplaint.maintenanceTeam === "object" &&
          (updatedComplaint.maintenanceTeam as any)?.id
            ? (updatedComplaint.maintenanceTeam as any).id
            : (updatedComplaint as any).maintenanceTeam || "none";

        setFormData({
          status: updatedComplaint.status,
          priority: updatedComplaint.priority,
          wardOfficerId,
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
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const handleClose = () => {
    setFormData({
      status: "",
      priority: "",
      wardOfficerId: "none",
      assignedToId: "none",
      maintenanceTeamId: "none",
      remarks: "",
    });
    setSearchTerm("");
    setValidationErrors([]);
    onClose();
  };

  if (!complaint) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            {user?.role === "MAINTENANCE_TEAM"
              ? "Update Task Status"
              : user?.role === "WARD_OFFICER"
                ? "Manage Complaint"
                : "Update Complaint"}
          </DialogTitle>
          <DialogDescription>
            {user?.role === "MAINTENANCE_TEAM"
              ? `Update your work status for complaint #${complaint.complaintId || complaint.id.slice(-6)}`
              : user?.role === "WARD_OFFICER"
                ? `Assign and manage complaint #${complaint.complaintId || complaint.id.slice(-6)}`
                : `Update the status and assignment of complaint #${complaint.complaintId || complaint.id.slice(-6)}`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center">
              <Users className="h-4 w-4 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-800">
                Acting as: {user?.role?.replace("_", " ")}
              </span>
            </div>
            {user?.role === "MAINTENANCE_TEAM" && (
              <Badge
                variant="outline"
                className="text-xs text-blue-600 border-blue-300"
              >
                Limited Permissions
              </Badge>
            )}
          </div>

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
                <span className="text-gray-600">Current Status:</span>{" "}
                <Badge className={`ml-2 ${getStatusColor(complaint.status)}`}>
                  {complaint.status.replace("_", " ")}
                </Badge>
              </div>
              <div>
                <span className="text-gray-600">Current Priority:</span>{" "}
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

            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="font-medium text-sm mb-2">Current Assignments</h4>
              <div className="grid grid-cols-1 gap-2 text-sm">
                {process.env.NODE_ENV === "development" && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-xs">
                    <strong>Debug:</strong>
                    <br />
                    wardOfficer:{" "}
                    {JSON.stringify(complaint.wardOfficer) || "null"}
                    <br />
                    maintenanceTeam:{" "}
                    {JSON.stringify(complaint.maintenanceTeam) || "null"}
                    <br />
                    needsTeamAssignment:{" "}
                    {String((complaint as any).needsTeamAssignment)}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Ward Officer:</span>
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    {complaint.wardOfficer ? (
                      <span className="text-blue-600">
                        {complaint.wardOfficer.fullName}
                      </span>
                    ) : (
                      <span className="text-gray-400">Not assigned</span>
                    )}
                  </div>
                </div>

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

          <div
            className={`grid gap-4 ${user?.role === "MAINTENANCE_TEAM" ? "grid-cols-1" : "grid-cols-2"}`}
          >
            <div>
              <Label htmlFor="status">Status</Label>
              {user?.role === "MAINTENANCE_TEAM" && (
                <p className="text-xs text-gray-500 mb-1">
                  You can update status to In Progress or mark as Resolved
                </p>
              )}
              {/* {process.env.NODE_ENV === "development" && <div className="text-xs text-blue-600 mb-1">Debug: Available statuses for {user?.role}: {getAvailableStatusOptions().join(", ")}</div>} */}
              <Select
                value={formData.status}
                onValueChange={(value) => {
                  setFormData((prev) => ({ ...prev, status: value }));
                  setValidationErrors([]);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableStatusOptions().map((status: string) => {
                    const statusConfig: Record<string, any> = {
                      REGISTERED: { icon: Clock, label: "Registered" },
                      ASSIGNED: { icon: User, label: "Assigned" },
                      IN_PROGRESS: { icon: Settings, label: "In Progress" },
                      RESOLVED: { icon: CheckCircle, label: "Resolved" },
                      CLOSED: { icon: FileText, label: "Closed" },
                      REOPENED: { icon: RotateCcw, label: "Reopened" },
                    };
                    const config = statusConfig[status];
                    if (!config) return null;
                    const IconComponent = config.icon;
                    return (
                      <SelectItem key={status} value={status}>
                        <div className="flex items-center">
                          <IconComponent className="h-4 w-4 mr-2" />
                          {config.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {user?.role !== "MAINTENANCE_TEAM" && (
              <div>
                <Label htmlFor="priority">Priority</Label>
                {/* <p className="text-xs text-gray-500 mb-1">Set complaint priority level</p> */}
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
                    <SelectItem value="LOW">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                        Low
                      </div>
                    </SelectItem>
                    <SelectItem value="MEDIUM">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                        Medium
                      </div>
                    </SelectItem>
                    <SelectItem value="HIGH">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                        High
                      </div>
                    </SelectItem>
                    <SelectItem value="CRITICAL">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                        Critical
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {(user?.role === "WARD_OFFICER" ||
            user?.role === "ADMINISTRATOR") && (
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

              {user?.role === "WARD_OFFICER" &&
                (complaint as any)?.needsTeamAssignment &&
                !["RESOLVED", "CLOSED"].includes(complaint.status) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
                    <div className="flex items-center">
                      <AlertTriangle className="h-4 w-4 text-blue-500 mr-2" />
                      <span className="text-sm text-blue-700">
                        This complaint needs to be assigned to a maintenance
                        team member to proceed.
                      </span>
                    </div>
                  </div>
                )}

              <div className="space-y-2">
                {/* Admin: show two columns - Ward Officer + Maintenance Team; Others: single select */}
                {user?.role === "ADMINISTRATOR" ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Ward Officer</Label>
                      <Select
                        value={formData.wardOfficerId}
                        onValueChange={(value) => {
                          setFormData((prev) => ({
                            ...prev,
                            wardOfficerId: value,
                          }));
                          setValidationErrors([]);
                        }}
                        disabled={
                          isLoadingWardOfficers || wardOfficerUsers.length === 0
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Ward Officer" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Assignment</SelectItem>
                          {wardOfficerUsers.map((u: any) => (
                            <SelectItem key={u.id} value={u.id}>
                              <div className="flex items-center justify-between w-full gap-2">
                                <div className="flex items-center">
                                  {getUserRoleIcon(u.role)}
                                  <div className="ml-2 text-left">
                                    <div className="font-medium">
                                      {u.fullName}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {u.email}
                                    </div>
                                  </div>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {u.role.replace("_", " ")}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Maintenance Team</Label>
                      <Select
                        value={formData.maintenanceTeamId}
                        onValueChange={(value) => {
                          setFormData((prev) => ({
                            ...prev,
                            maintenanceTeamId: value,
                          }));
                          setValidationErrors([]);
                        }}
                        disabled={
                          isLoadingMaintenance || maintenanceUsers.length === 0
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Maintenance Team" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Assignment</SelectItem>
                          {maintenanceUsers.map((u: any) => (
                            <SelectItem key={u.id} value={u.id}>
                              <div className="flex items-center justify-between w-full gap-2">
                                <div className="flex items-center">
                                  {getUserRoleIcon(u.role)}
                                  <div className="ml-2 text-left">
                                    <div className="font-medium">
                                      {u.fullName}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {u.email}
                                    </div>
                                  </div>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {u.role.replace("_", " ")}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : (
                  <Select
                    value={
                      user?.role === "WARD_OFFICER"
                        ? formData.maintenanceTeamId
                        : formData.wardOfficerId
                    }
                    onValueChange={(value) => {
                      if (user?.role === "WARD_OFFICER")
                        setFormData((prev) => ({
                          ...prev,
                          maintenanceTeamId: value,
                        }));
                      else
                        setFormData((prev) => ({
                          ...prev,
                          wardOfficerId: value,
                        }));
                      setValidationErrors([]);
                    }}
                    disabled={availableUsers.length === 0}
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
                      {filteredUsers.map((u: any) => (
                        <SelectItem key={u.id} value={u.id}>
                          <div className="flex items-center justify-between w-full gap-2">
                            <div className="flex items-center">
                              {getUserRoleIcon(u.role)}
                              <div className="ml-2 text-left">
                                <div className="font-medium">{u.fullName}</div>
                                <div className="text-xs text-gray-500">
                                  {u.email}
                                </div>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {u.role.replace("_", " ")}
                            </Badge>
                            {u.ward && (
                              <div className="text-xs text-blue-600">
                                {u.ward.name}
                              </div>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {(isLoadingWardOfficers || isLoadingMaintenance) && (
                  <div className="text-sm text-gray-500">Loading users...</div>
                )}
                {(wardOfficersError || maintenanceError) && (
                  <div className="text-sm text-red-500">
                    Error loading users. Please try again.
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="remarks">
              {user?.role === "MAINTENANCE_TEAM"
                ? "Work Notes (Optional)"
                : "Remarks (Optional)"}
            </Label>
            <Textarea
              id="remarks"
              placeholder={
                user?.role === "MAINTENANCE_TEAM"
                  ? "Add notes about work progress, issues encountered, or completion details..."
                  : user?.role === "WARD_OFFICER"
                    ? "Add notes about assignment, instructions, or status changes..."
                    : "Add any additional comments or remarks about this update..."
              }
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
              {isUpdating
                ? "Updating..."
                : user?.role === "MAINTENANCE_TEAM"
                  ? "Update Status"
                  : user?.role === "WARD_OFFICER"
                    ? "Save Changes"
                    : "Update Complaint"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateComplaintModal;
