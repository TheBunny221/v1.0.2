import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Label } from "../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
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
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  UserCheck,
  Shield,
  Settings,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import {
  useLazyGetAllUsersQuery,
  useGetUserStatsQuery,
  useActivateUserMutation,
  useDeactivateUserMutation,
  useDeleteUserMutation,
  useCreateUserMutation,
  useUpdateUserMutation,
  type AdminUser,
  type CreateUserRequest,
  type UpdateUserRequest,
} from "../store/api/adminApi";
import { useGetWardsQuery } from "../store/api/guestApi";
import { toast } from "../components/ui/use-toast";

const AdminUsers: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  // Form states
  const [formData, setFormData] = useState<CreateUserRequest>({
    fullName: "",
    email: "",
    phoneNumber: "",
    role: "CITIZEN",
    wardId: "",
    department: "",
  });

  // Initialize filters from URL parameters
  useEffect(() => {
    const roleParam = searchParams.get("role");
    const statusParam = searchParams.get("status");

    if (roleParam) {
      setRoleFilter(roleParam);
    }
    if (statusParam) {
      setStatusFilter(statusParam);
    }
  }, [searchParams]);

  // Check authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, []);

  // API queries - use lazy for users to prevent AbortErrors
  const [
    getAllUsers,
    { data: usersResponse, isLoading: isLoadingUsers, error: usersError },
  ] = useLazyGetAllUsersQuery();

  // Use regular hook with skip for stats
  const {
    data: statsResponse,
    isLoading: isLoadingStats,
    error: statsError,
  } = useGetUserStatsQuery(undefined, {
    skip: !isAuthenticated,
  });

  // Trigger users query when authentication and parameters are ready
  useEffect(() => {
    if (isAuthenticated) {
      try {
        getAllUsers({
          page,
          limit,
          role: roleFilter !== "all" ? roleFilter : undefined,
          status: statusFilter,
        });
      } catch (error) {
        // Silently handle any errors from lazy query in Strict Mode
        console.debug(
          "Lazy query error (likely from React Strict Mode):",
          error,
        );
      }
    }
  }, [page, limit, roleFilter, statusFilter, isAuthenticated, getAllUsers]);

  // Manual refetch function
  const refetchUsers = () => {
    if (isAuthenticated) {
      try {
        getAllUsers({
          page,
          limit,
          role: roleFilter !== "all" ? roleFilter : undefined,
          status: statusFilter,
        });
      } catch (error) {
        // Silently handle any errors from lazy query
        console.debug("Lazy query refetch error:", error);
      }
    }
  };

  // Fetch wards for form dropdowns using RTK Query
  const {
    data: wardsResponse,
    isLoading: isLoadingWards,
    error: wardsError,
  } = useGetWardsQuery();

  // Extract wards data from the API response
  const wards = wardsResponse?.data || [];

  // Mutations
  const [activateUser] = useActivateUserMutation();
  const [deactivateUser] = useDeactivateUserMutation();
  const [deleteUser] = useDeleteUserMutation();
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();

  const users = usersResponse?.data?.users || [];
  const pagination = usersResponse?.data?.pagination;
  const stats = statsResponse?.data;

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMINISTRATOR":
        return "bg-red-100 text-red-800";
      case "WARD_OFFICER":
        return "bg-blue-100 text-blue-800";
      case "MAINTENANCE_TEAM":
        return "bg-green-100 text-green-800";
      case "CITIZEN":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "ADMINISTRATOR":
        return <Shield className="h-4 w-4" />;
      case "WARD_OFFICER":
        return <UserCheck className="h-4 w-4" />;
      case "MAINTENANCE_TEAM":
        return <Settings className="h-4 w-4" />;
      case "CITIZEN":
        return <Users className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const handleActivateUser = async (userId: string) => {
    try {
      await activateUser(userId).unwrap();
      toast({
        title: "Success",
        description: "User activated successfully",
      });
      refetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.data?.message || "Failed to activate user",
        variant: "destructive",
      });
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    try {
      await deactivateUser(userId).unwrap();
      toast({
        title: "Success",
        description: "User deactivated successfully",
      });
      refetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.data?.message || "Failed to deactivate user",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await deleteUser(userId).unwrap();
        toast({
          title: "Success",
          description: "User deleted successfully",
        });
        refetchUsers();
      } catch (error: any) {
        toast({
          title: "Error",
          description: error?.data?.message || "Failed to delete user",
          variant: "destructive",
        });
      }
    }
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setRoleFilter("all");
    setStatusFilter("all");
    setPage(1);
    // Update URL parameters
    setSearchParams({});
  };

  // Handle filter changes and update URL
  const handleRoleFilterChange = (role: string) => {
    setRoleFilter(role);
    const newParams = new URLSearchParams(searchParams);
    if (role !== "all") {
      newParams.set("role", role);
    } else {
      newParams.delete("role");
    }
    setSearchParams(newParams);
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    const newParams = new URLSearchParams(searchParams);
    if (status !== "all") {
      newParams.set("status", status);
    } else {
      newParams.delete("status");
    }
    setSearchParams(newParams);
  };

  // Form handlers
  const handleOpenAddDialog = () => {
    setFormData({
      fullName: "",
      email: "",
      phoneNumber: "",
      role: "CITIZEN",
      wardId: "",
      department: "",
    });
    setIsAddDialogOpen(true);
  };

  const handleOpenEditDialog = (user: AdminUser) => {
    setEditingUser(user);
    setFormData({
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber || "",
      role: user.role,
      wardId: user.wardId || "",
      department: user.department || "",
    });
    setIsEditDialogOpen(true);
  };

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleCloseDialogs = () => {
    setIsAddDialogOpen(false);
    setIsEditDialogOpen(false);
    setEditingUser(null);
    setFormData({
      fullName: "",
      email: "",
      phoneNumber: "",
      role: "CITIZEN",
      wardId: "",
      department: "",
    });
    setFormErrors({});
  };

  const validateForm = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!formData.fullName || formData.fullName.trim().length < 3) {
      errors.fullName = "Full name must be at least 3 characters.";
    }
    if (!formData.email) {
      errors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address.";
    }
    if (!formData.role) {
      errors.role = "Role is required.";
    }
    // If role is maintenance team, department is required
    if (formData.role === "MAINTENANCE_TEAM" && !formData.department) {
      errors.department = "Department is required for maintenance team users.";
    }

    return errors;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateForm();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      // show a toast as well
      toast({
        title: "Validation errors",
        description: "Please fix the highlighted fields before submitting.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingUser) {
        // Update user
        await updateUser({
          id: editingUser.id,
          data: formData,
        }).unwrap();
        toast({ title: "Success", description: "User updated successfully" });
      } else {
        // Create user
        await createUser(formData).unwrap();
        toast({ title: "Success", description: "User created successfully" });
      }

      handleCloseDialogs();
      refetchUsers();
    } catch (error: any) {
      // If backend returns structured field errors, show them
      const msg = error?.data?.message || error?.message || "Unexpected error";
      if (error?.data?.errors && typeof error.data.errors === "object") {
        setFormErrors(error.data.errors);
      }

      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  // Filter users locally based on search term
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (usersError || statsError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Error Loading Data
            </h3>
            <p className="text-gray-600 mb-4">
              Failed to load user data. Please try again.
            </p>
            <Button onClick={() => refetchUsers()}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage all users in the system</p>
        </div>
        <Button onClick={handleOpenAddDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add New User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">
                  {isLoadingStats ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    stats?.totalUsers || 0
                  )}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Users
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {isLoadingStats ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    stats?.activeUsers || 0
                  )}
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Citizens</p>
                <p className="text-2xl font-bold">
                  {isLoadingStats ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    stats?.usersByRole?.find((role) => role.role === "CITIZEN")
                      ?._count || 0
                  )}
                </p>
              </div>
              <Users className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Ward Officers
                </p>
                <p className="text-2xl font-bold">
                  {isLoadingStats ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    stats?.usersByRole?.find(
                      (role) => role.role === "WARD_OFFICER",
                    )?._count || 0
                  )}
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Maintenance</p>
                <p className="text-2xl font-bold">
                  {isLoadingStats ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    stats?.usersByRole?.find(
                      (role) => role.role === "MAINTENANCE_TEAM",
                    )?._count || 0
                  )}
                </p>
              </div>
              <Settings className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={handleRoleFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="CITIZEN">Citizens</SelectItem>
                <SelectItem value="WARD_OFFICER">Ward Officers</SelectItem>
                <SelectItem value="MAINTENANCE_TEAM">
                  Maintenance Team
                </SelectItem>
                <SelectItem value="ADMINISTRATOR">Administrators</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={handleStatusFilterChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleResetFilters}>
              Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Users ({pagination?.total || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingUsers ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading users...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Ward</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Complaints</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.fullName}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        {user.phoneNumber && (
                          <p className="text-sm text-gray-500">
                            {user.phoneNumber}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleColor(user.role)}>
                        <span className="flex items-center">
                          {getRoleIcon(user.role)}
                          <span className="ml-1">
                            {user.role.replace("_", " ")}
                          </span>
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.ward?.name || "No ward assigned"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          user.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>
                          Submitted: {user._count?.submittedComplaints || 0}
                        </p>
                        <p>Assigned: {user._count?.assignedComplaints || 0}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenEditDialog(user)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        {user.isActive ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeactivateUser(user.id)}
                          >
                            Deactivate
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleActivateUser(user.id)}
                          >
                            Activate
                          </Button>
                        )}
                        {/* <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button> */}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between space-x-2 py-4">
              <div className="text-sm text-gray-500">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                of {pagination.total} entries
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= pagination.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>User Management Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" className="w-full">
              Export Users
            </Button>
            <Button variant="outline" className="w-full">
              Bulk Import
            </Button>
            <Button variant="outline" className="w-full">
              User Reports
            </Button>
            <Button variant="outline" className="w-full">
              Access Logs
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account in the system.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                placeholder="Enter full name"
                required
                aria-invalid={!!formErrors.fullName}
              />
              {formErrors.fullName && (
                <p className="text-sm text-red-600 mt-1">
                  {formErrors.fullName}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="Enter email address"
                required
                aria-invalid={!!formErrors.email}
              />
              {formErrors.email && (
                <p className="text-sm text-red-600 mt-1">{formErrors.email}</p>
              )}
            </div>
            <div>
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) =>
                  setFormData({ ...formData, phoneNumber: e.target.value })
                }
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CITIZEN">Citizen</SelectItem>
                  <SelectItem value="WARD_OFFICER">Ward Officer</SelectItem>
                  <SelectItem value="MAINTENANCE_TEAM">
                    Maintenance Team
                  </SelectItem>
                  <SelectItem value="ADMINISTRATOR">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="ward">Ward</Label>
              <Select
                value={formData.wardId || "none"}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    wardId: value === "none" ? "" : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select ward (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No ward assigned</SelectItem>
                  {wards.map((ward) => (
                    <SelectItem key={ward.id} value={ward.id}>
                      {ward.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Department only visible for Maintenance Team */}
            {formData.role === "MAINTENANCE_TEAM" && (
              <div>
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value })
                  }
                  placeholder="Enter department"
                  aria-invalid={!!formErrors.department}
                />
                {formErrors.department && (
                  <p className="text-sm text-red-600 mt-1">
                    {formErrors.department}
                  </p>
                )}
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialogs}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create User"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <Label htmlFor="editFullName">Full Name</Label>
              <Input
                id="editFullName"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                placeholder="Enter full name"
                required
              />
            </div>
            <div>
              <Label htmlFor="editEmail">Email</Label>
              <Input
                id="editEmail"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="Enter email address"
                required
              />
            </div>
            <div>
              <Label htmlFor="editPhoneNumber">Phone Number</Label>
              <Input
                id="editPhoneNumber"
                value={formData.phoneNumber}
                onChange={(e) =>
                  setFormData({ ...formData, phoneNumber: e.target.value })
                }
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <Label htmlFor="editRole">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CITIZEN">Citizen</SelectItem>
                  <SelectItem value="WARD_OFFICER">Ward Officer</SelectItem>
                  <SelectItem value="MAINTENANCE_TEAM">
                    Maintenance Team
                  </SelectItem>
                  <SelectItem value="ADMINISTRATOR">Administrator</SelectItem>
                </SelectContent>
              </Select>
              {formErrors.role && (
                <p className="text-sm text-red-600 mt-1">{formErrors.role}</p>
              )}
            </div>
            <div>
              <Label htmlFor="editWard">Ward</Label>
              <Select
                value={formData.wardId || "none"}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    wardId: value === "none" ? "" : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select ward (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No ward assigned</SelectItem>
                  {wards.map((ward) => (
                    <SelectItem key={ward.id} value={ward.id}>
                      {ward.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {formData.role === "MAINTENANCE_TEAM" && (
              <div>
                <Label htmlFor="editDepartment">Department</Label>
                <Input
                  id="editDepartment"
                  value={formData.department}
                  onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value })
                  }
                  placeholder="Enter department"
                  aria-invalid={!!formErrors.department}
                />
                {formErrors.department && (
                  <p className="text-sm text-red-600 mt-1">
                    {formErrors.department}
                  </p>
                )}
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialogs}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update User"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
