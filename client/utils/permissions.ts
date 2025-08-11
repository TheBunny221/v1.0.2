// Role-based permissions system for the Cochin Smart City application

export type UserRole =
  | "CITIZEN"
  | "WARD_OFFICER"
  | "MAINTENANCE_TEAM"
  | "ADMINISTRATOR"
  | "GUEST";

export type Permission =
  // Complaint permissions
  | "complaint:create"
  | "complaint:view:own"
  | "complaint:view:all"
  | "complaint:view:ward"
  | "complaint:update:own"
  | "complaint:update:all"
  | "complaint:update:ward"
  | "complaint:assign"
  | "complaint:resolve"
  | "complaint:reopen"
  | "complaint:delete"
  // User permissions
  | "user:create"
  | "user:view:own"
  | "user:view:all"
  | "user:update:own"
  | "user:update:all"
  | "user:delete"
  // System permissions
  | "system:admin"
  | "system:config"
  | "system:analytics"
  | "system:reports"
  // Ward permissions
  | "ward:manage"
  | "ward:assign_tasks"
  | "ward:view_analytics"
  // Maintenance permissions
  | "maintenance:view_tasks"
  | "maintenance:update_status"
  | "maintenance:complete_tasks";

// Role-based permission mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  GUEST: ["complaint:create"],
  CITIZEN: [
    "complaint:create",
    "complaint:view:own",
    "complaint:update:own",
    "complaint:reopen",
    "user:view:own",
    "user:update:own",
  ],
  WARD_OFFICER: [
    "complaint:create",
    "complaint:view:own",
    "complaint:view:ward",
    "complaint:update:own",
    "complaint:update:ward",
    "complaint:assign",
    "complaint:resolve",
    "user:view:own",
    "user:update:own",
    "ward:manage",
    "ward:assign_tasks",
    "ward:view_analytics",
    "system:reports",
  ],
  MAINTENANCE_TEAM: [
    "complaint:create",
    "complaint:view:own",
    "complaint:update:own",
    "complaint:resolve",
    "user:view:own",
    "user:update:own",
    "maintenance:view_tasks",
    "maintenance:update_status",
    "maintenance:complete_tasks",
  ],
  ADMINISTRATOR: [
    "complaint:create",
    "complaint:view:own",
    "complaint:view:all",
    "complaint:update:own",
    "complaint:update:all",
    "complaint:assign",
    "complaint:resolve",
    "complaint:reopen",
    "complaint:delete",
    "user:create",
    "user:view:own",
    "user:view:all",
    "user:update:own",
    "user:update:all",
    "user:delete",
    "system:admin",
    "system:config",
    "system:analytics",
    "system:reports",
    "ward:manage",
    "ward:assign_tasks",
    "ward:view_analytics",
    "maintenance:view_tasks",
    "maintenance:update_status",
    "maintenance:complete_tasks",
  ],
};

/**
 * Check if a user has a specific permission
 */
export function hasPermission(
  userRole: UserRole,
  permission: Permission,
): boolean {
  return ROLE_PERMISSIONS[userRole]?.includes(permission) || false;
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(
  userRole: UserRole,
  permissions: Permission[],
): boolean {
  return permissions.some((permission) => hasPermission(userRole, permission));
}

/**
 * Check if a user has all of the specified permissions
 */
export function hasAllPermissions(
  userRole: UserRole,
  permissions: Permission[],
): boolean {
  return permissions.every((permission) => hasPermission(userRole, permission));
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(userRole: UserRole): Permission[] {
  return ROLE_PERMISSIONS[userRole] || [];
}

/**
 * Check if user can view a specific complaint based on role and ownership
 */
export function canViewComplaint(
  userRole: UserRole,
  userId: string,
  complaint: { submittedById?: string; assignedToId?: string; wardId?: string },
  userWardId?: string,
): boolean {
  // Admin can view all
  if (hasPermission(userRole, "complaint:view:all")) {
    return true;
  }

  // Check own complaints
  if (
    hasPermission(userRole, "complaint:view:own") &&
    (complaint.submittedById === userId || complaint.assignedToId === userId)
  ) {
    return true;
  }

  // Check ward-based access
  if (
    hasPermission(userRole, "complaint:view:ward") &&
    userWardId &&
    complaint.wardId === userWardId
  ) {
    return true;
  }

  return false;
}

/**
 * Check if user can modify a specific complaint
 */
export function canModifyComplaint(
  userRole: UserRole,
  userId: string,
  complaint: {
    submittedById?: string;
    assignedToId?: string;
    wardId?: string;
    status?: string;
  },
  userWardId?: string,
): boolean {
  // Admin can modify all
  if (hasPermission(userRole, "complaint:update:all")) {
    return true;
  }

  // Citizens can only update their own pending complaints
  if (
    userRole === "CITIZEN" &&
    hasPermission(userRole, "complaint:update:own") &&
    complaint.submittedById === userId &&
    complaint.status === "REGISTERED"
  ) {
    return true;
  }

  // Ward officers can update complaints in their ward
  if (
    hasPermission(userRole, "complaint:update:ward") &&
    userWardId &&
    complaint.wardId === userWardId
  ) {
    return true;
  }

  // Assigned users can update their assigned complaints
  if (
    hasPermission(userRole, "complaint:update:own") &&
    complaint.assignedToId === userId
  ) {
    return true;
  }

  return false;
}

/**
 * Get filtered navigation items based on user permissions
 */
export function getAuthorizedNavigation(userRole: UserRole) {
  const navItems = [];

  // Basic navigation for all authenticated users
  navItems.push(
    {
      path: "/",
      label: "Home",
      roles: ["CITIZEN", "WARD_OFFICER", "MAINTENANCE_TEAM", "ADMINISTRATOR"],
    },
    {
      path: "/dashboard",
      label: "Dashboard",
      roles: ["CITIZEN", "WARD_OFFICER", "MAINTENANCE_TEAM", "ADMINISTRATOR"],
    },
    {
      path: "/complaints",
      label: "Complaints",
      roles: ["CITIZEN", "WARD_OFFICER", "MAINTENANCE_TEAM", "ADMINISTRATOR"],
    },
  );

  // Role-specific navigation
  if (hasPermission(userRole, "ward:manage")) {
    navItems.push(
      { path: "/tasks", label: "My Tasks", roles: ["WARD_OFFICER"] },
      { path: "/ward", label: "Ward Management", roles: ["WARD_OFFICER"] },
    );
  }

  if (hasPermission(userRole, "maintenance:view_tasks")) {
    navItems.push(
      {
        path: "/maintenance",
        label: "Maintenance",
        roles: ["MAINTENANCE_TEAM"],
      },
      { path: "/tasks", label: "My Tasks", roles: ["MAINTENANCE_TEAM"] },
    );
  }

  if (hasPermission(userRole, "system:admin")) {
    navItems.push(
      { path: "/admin/users", label: "Users", roles: ["ADMINISTRATOR"] },
      {
        path: "/admin/config",
        label: "System Config",
        roles: ["ADMINISTRATOR"],
      },
      {
        path: "/admin/analytics",
        label: "Analytics",
        roles: ["ADMINISTRATOR"],
      },
    );
  }

  if (hasPermission(userRole, "system:reports")) {
    navItems.push({
      path: "/reports",
      label: "Reports",
      roles: ["WARD_OFFICER", "ADMINISTRATOR"],
    });
  }

  return navItems.filter((item) => item.roles.includes(userRole));
}

/**
 * Data filtering utilities
 */
export const DataFilters = {
  /**
   * Filter complaints based on user permissions
   */
  filterComplaints: (
    complaints: any[],
    userRole: UserRole,
    userId: string,
    userWardId?: string,
  ) => {
    return complaints.filter((complaint) =>
      canViewComplaint(userRole, userId, complaint, userWardId),
    );
  },

  /**
   * Filter users based on role permissions
   */
  filterUsers: (users: any[], userRole: UserRole, userId: string) => {
    if (hasPermission(userRole, "user:view:all")) {
      return users;
    }
    if (hasPermission(userRole, "user:view:own")) {
      return users.filter((user) => user.id === userId);
    }
    return [];
  },
};

export default {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getRolePermissions,
  canViewComplaint,
  canModifyComplaint,
  getAuthorizedNavigation,
  DataFilters,
  ROLE_PERMISSIONS,
};
