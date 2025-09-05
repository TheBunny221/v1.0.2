export type ComplaintStatus =
  | "registered"
  | "assigned"
  | "in_progress"
  | "resolved"
  | "closed"
  | "reopened";

export type ComplaintPriority = "low" | "medium" | "high" | "critical";

export const getComplaintTypeLabel = (type: string): string => {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

export const isResolved = (status: ComplaintStatus): boolean => {
  return ["resolved", "closed"].includes(status);
};

export const isPending = (status: ComplaintStatus): boolean => {
  return ["registered", "assigned", "in_progress", "reopened"].includes(status);
};

export const getStatusColor = (status: ComplaintStatus): string => {
  const statusColors: Record<ComplaintStatus, string> = {
    registered: "bg-blue-100 text-blue-800",
    assigned: "bg-yellow-100 text-yellow-800",
    in_progress: "bg-orange-100 text-orange-800",
    resolved: "bg-green-100 text-green-800",
    closed: "bg-gray-100 text-gray-800",
    reopened: "bg-red-100 text-red-800",
  };

  return statusColors[status] || "bg-gray-100 text-gray-800";
};

export const getPriorityColor = (priority: ComplaintPriority): string => {
  const priorityColors: Record<ComplaintPriority, string> = {
    low: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-orange-100 text-orange-800",
    critical: "bg-red-100 text-red-800",
  };

  return priorityColors[priority] || "bg-gray-100 text-gray-800";
};

export const getStatusLabel = (status: ComplaintStatus): string => {
  const statusLabels: Record<ComplaintStatus, string> = {
    registered: "Registered",
    assigned: "Assigned",
    in_progress: "In Progress",
    resolved: "Resolved",
    closed: "Closed",
    reopened: "Reopened",
  };

  return statusLabels[status] || status;
};

export const getPriorityLabel = (priority: ComplaintPriority): string => {
  const priorityLabels: Record<ComplaintPriority, string> = {
    low: "Low",
    medium: "Medium",
    high: "High",
    critical: "Critical",
  };

  return priorityLabels[priority] || priority;
};

export const calculateSLAStatus = (
  submittedDate: string,
  slaHours: number,
  status: ComplaintStatus,
): "ontime" | "warning" | "overdue" | "completed" => {
  if (isResolved(status)) {
    return "completed";
  }

  const submitted = new Date(submittedDate);
  const now = new Date();
  const hoursElapsed = (now.getTime() - submitted.getTime()) / (1000 * 60 * 60);

  if (hoursElapsed > slaHours) {
    return "overdue";
  } else if (hoursElapsed > slaHours * 0.8) {
    return "warning";
  } else {
    return "ontime";
  }
};

export const getSLAStatusColor = (slaStatus: string): string => {
  const slaColors: Record<string, string> = {
    ontime: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    overdue: "bg-red-100 text-red-800",
    completed: "bg-blue-100 text-blue-800",
  };

  return slaColors[slaStatus] || "bg-gray-100 text-gray-800";
};
