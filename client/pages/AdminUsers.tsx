import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
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
} from "lucide-react";

const AdminUsers: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const mockUsers = [
    {
      id: "1",
      fullName: "John Doe",
      email: "john.doe@example.com",
      phoneNumber: "+91 9876543210",
      role: "CITIZEN",
      ward: "Ward 1",
      isActive: true,
      lastLogin: "2024-01-10",
      joinedOn: "2023-06-15",
    },
    {
      id: "2",
      fullName: "Sarah Wilson",
      email: "sarah.wilson@ward2.gov.in",
      phoneNumber: "+91 9876543211",
      role: "WARD_OFFICER",
      ward: "Ward 2",
      isActive: true,
      lastLogin: "2024-01-09",
      joinedOn: "2023-03-20",
    },
    {
      id: "3",
      fullName: "Mike Johnson",
      email: "mike.johnson@maintenance.gov.in",
      phoneNumber: "+91 9876543212",
      role: "MAINTENANCE_TEAM",
      ward: "Ward 1",
      isActive: true,
      lastLogin: "2024-01-08",
      joinedOn: "2023-01-10",
    },
    {
      id: "4",
      fullName: "Admin User",
      email: "admin@cochinsmart.gov.in",
      phoneNumber: "+91 9876543213",
      role: "ADMINISTRATOR",
      ward: "All Wards",
      isActive: true,
      lastLogin: "2024-01-11",
      joinedOn: "2022-12-01",
    },
  ];

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

  const filteredUsers = mockUsers.filter((user) => {
    const matchesSearch =
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const userStats = {
    total: mockUsers.length,
    citizens: mockUsers.filter((u) => u.role === "CITIZEN").length,
    wardOfficers: mockUsers.filter((u) => u.role === "WARD_OFFICER").length,
    maintenance: mockUsers.filter((u) => u.role === "MAINTENANCE_TEAM").length,
    admins: mockUsers.filter((u) => u.role === "ADMINISTRATOR").length,
    active: mockUsers.filter((u) => u.isActive).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage all users in the system</p>
        </div>
        <Button>
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
                <p className="text-2xl font-bold">{userStats.total}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Citizens</p>
                <p className="text-2xl font-bold">{userStats.citizens}</p>
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
                <p className="text-2xl font-bold">{userStats.wardOfficers}</p>
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
                <p className="text-2xl font-bold">{userStats.maintenance}</p>
              </div>
              <Settings className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {userStats.active}
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
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
            <Button variant="outline">Reset Filters</Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Users ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Ward</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
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
                      <p className="text-sm text-gray-500">
                        {user.phoneNumber}
                      </p>
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
                  <TableCell>{user.ward}</TableCell>
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
                    <div>
                      <p className="text-sm">{user.lastLogin}</p>
                      <p className="text-xs text-gray-500">
                        Joined: {user.joinedOn}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
    </div>
  );
};

export default AdminUsers;
