import React, { useState, useEffect } from "react";
import { getApiErrorMessage } from "../store/api/baseApi";
import { useAppSelector } from "../store/hooks";
import {
  useUpdateComplaintStatusMutation,
  useAssignComplaintMutation,
  useUpdateComplaintMutation,
  useGetWardUsersQuery,
} from "../store/api/complaintsApi";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Badge } from "./ui/badge";
import { useToast } from "../hooks/use-toast";
import { AlertCircle, CheckCircle, Clock, User, UserCheck } from "lucide-react";

interface ComplaintStatusUpdateProps {
  complaint: {
    id: string;
    complaintId?: string;
    status: string;
    priority: string;
    type: string;
    description: string;
    area: string;
    assignedTo?: { id: string; fullName: string } | null;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  mode?: "status" | "assign" | "both";
}

const COMPLAINT_STATUSES = [
  {
    value: "REGISTERED",
    label: "Registered",
    icon: AlertCircle,
    color: "bg-yellow-100 text-yellow-800",
  },
  {
    value: "ASSIGNED",
    label: "Assigned",
    icon: User,
    color: "bg-blue-100 text-blue-800",
  },
  {
    value: "IN_PROGRESS",
    label: "In Progress",
    icon: Clock,
    color: "bg-orange-100 text-orange-800",
  },
  {
    value: "RESOLVED",
    label: "Resolved",
    icon: CheckCircle,
    color: "bg-green-100 text-green-800",
  },
  {
    value: "CLOSED",
    label: "Closed",
    icon: CheckCircle,
    color: "bg-gray-100 text-gray-800",
  },
];

const ComplaintStatusUpdate: React.FC<ComplaintStatusUpdateProps> = ({
  complaint,
  isOpen,
  onClose,
  onSuccess,
  mode = "both",
}) => {
  const { user } = useAppSelector((state) => state.auth);
  const { toast } = useToast();

  const [updateComplaintStatus, { isLoading: isUpdatingStatus }] =
    useUpdateComplaintStatusMutation();
  const [assignComplaint, { isLoading: isAssigning }] =
    useAssignComplaintMutation();
  const [updateComplaint] = useUpdateComplaintMutation();

  const [formData, setFormData] = useState({
    status: "",
    assignedTo: "unassigned",
    remarks: "",
  });

  // Update form data when complaint changes
  useEffect(() => {
    setFormData({
      status: complaint.status,
      assignedTo: complaint.assignedTo?.id || "unassigned",
      remarks: "",
    });
  }, [complaint.status, complaint.assignedTo?.id]);

  const isLoading = isUpdatingStatus || isAssigning;

  // Fetch assignable users consistently with UpdateComplaintModal
  const getUsersFilter = () => {
    if (user?.role === "ADMINISTRATOR") return { role: "WARD_OFFICER" };
    if (user?.role === "WARD_OFFICER") return { role: "MAINTENANCE_TEAM" };
    return {} as any;
  };

  const { data: usersResponse, isLoading: usersLoading } = useGetWardUsersQuery(
    {
      page: 1,
      limit: 100,
      ...getUsersFilter(),
    },
  );

  const assignableUsers = usersResponse?.data?.users || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (
        mode === "status" ||
        (mode === "both" && formData.status !== complaint.status)
      ) {
        await updateComplaintStatus({
          id: complaint.id,
          status: formData.status as any,
          remarks: formData.remarks || undefined,
        }).unwrap();
      }

      if (
        mode === "assign" ||
        (mode === "both" &&
          formData.assignedTo !== (complaint.assignedTo?.id || "unassigned"))
      ) {
        if (user?.role === "WARD_OFFICER") {
          await assignComplaint({
            id: complaint.id,
            assignedTo:
              formData.assignedTo === "unassigned" ? "" : formData.assignedTo,
            remarks: formData.remarks || undefined,
          }).unwrap();
        } else if (user?.role === "ADMINISTRATOR") {
          const updateData: any = {};
          if (formData.assignedTo !== "unassigned") {
            updateData.assignedToId = formData.assignedTo;
          }
          if (formData.remarks) updateData.remarks = formData.remarks;
          await updateComplaint({ id: complaint.id, ...updateData }).unwrap();
        }
      }

      toast({
        title: "Success",
        description: "Complaint updated successfully",
      });

      onSuccess?.();
      onClose();
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

  const getStatusInfo = (status: string) => {
    return (
      COMPLAINT_STATUSES.find((s) => s.value === status) ||
      COMPLAINT_STATUSES[0]
    );
  };

  const currentStatusInfo = getStatusInfo(complaint.status);
  const newStatusInfo = getStatusInfo(formData.status);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <currentStatusInfo.icon className="h-5 w-5" />
            Update Complaint #{complaint.complaintId || complaint.id.slice(-6)}
          </DialogTitle>
          <DialogDescription>
            Update the status and assignment for this complaint
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Complaint Summary */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-2">Complaint Summary</h3>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Type:</strong> {complaint.type.replace("_", " ")}
              </p>
              <p>
                <strong>Area:</strong> {complaint.area}
              </p>
              <p>
                <strong>Description:</strong> {complaint.description}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={currentStatusInfo.color}>
                  {currentStatusInfo.label}
                </Badge>
                {complaint.assignedTo && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <UserCheck className="h-3 w-3" />
                    {complaint.assignedTo.fullName}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Status Update */}
          {(mode === "status" || mode === "both") && (
            <div className="space-y-2">
              <Label htmlFor="status">Update Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMPLAINT_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      <div className="flex items-center gap-2">
                        <status.icon className="h-4 w-4" />
                        {status.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {formData.status !== complaint.status && (
                <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                  Status will change from{" "}
                  <strong>{currentStatusInfo.label}</strong> to{" "}
                  <strong>{newStatusInfo.label}</strong>
                </div>
              )}
            </div>
          )}

          {/* Assignment */}
          {(mode === "assign" || mode === "both") && (
            <div className="space-y-2">
              <Label htmlFor="assignedTo">
                {user?.role === "ADMINISTRATOR"
                  ? "Assign to Ward Officer"
                  : "Assign to Team Member"}
              </Label>
              <Select
                value={formData.assignedTo}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, assignedTo: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      user?.role === "ADMINISTRATOR"
                        ? "Select ward officer"
                        : "Select team member"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {usersLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading users...
                    </SelectItem>
                  ) : (
                    assignableUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        <div className="flex justify-between items-center w-full">
                          <div className="flex flex-col">
                            <span>{u.fullName}</span>
                            {u.email && (
                              <span className="text-xs text-gray-500">
                                {u.email}
                              </span>
                            )}
                            {u.ward?.name && (
                              <span className="text-xs text-blue-600">
                                {u.ward.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Remarks */}
          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks (Optional)</Label>
            <Textarea
              id="remarks"
              value={formData.remarks}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, remarks: e.target.value }))
              }
              placeholder="Add any comments about this update..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="min-w-[100px]"
            >
              {isLoading ? "Updating..." : "Update Complaint"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ComplaintStatusUpdate;
