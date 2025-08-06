import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Search,
  UserPlus,
  Edit,
  Shield,
  Users,
  Eye,
  Ban,
  CheckCircle,
  Mail,
  Phone,
  Calendar,
  Filter,
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'citizen' | 'admin' | 'ward-officer' | 'maintenance';
  status: 'active' | 'inactive' | 'blocked';
  joinDate: string;
  lastActive: string;
  complaintsSubmitted?: number;
  complaintsResolved?: number;
  ward?: string;
  department?: string;
}

interface FilterState {
  search: string;
  role: string;
  status: string;
  ward: string;
}

const AdminUsers: React.FC = () => {
  const [users] = useState<User[]>([
    {
      id: 'USR-001',
      name: 'John Doe',
      email: 'john.doe@email.com',
      phone: '+91 9876543210',
      role: 'citizen',
      status: 'active',
      joinDate: '2024-01-10',
      lastActive: '2024-01-15 14:30',
      complaintsSubmitted: 5,
    },
    {
      id: 'USR-002',
      name: 'Mike Johnson',
      email: 'mike.johnson@city.gov',
      phone: '+91 9876543211',
      role: 'maintenance',
      status: 'active',
      joinDate: '2023-12-01',
      lastActive: '2024-01-15 10:15',
      complaintsResolved: 89,
      department: 'Water & Sanitation',
    },
    {
      id: 'USR-003',
      name: 'Sarah Wilson',
      email: 'sarah.wilson@city.gov',
      phone: '+91 9876543212',
      role: 'ward-officer',
      status: 'active',
      joinDate: '2023-11-15',
      lastActive: '2024-01-15 16:45',
      ward: 'Ward 3',
      complaintsResolved: 156,
    },
    {
      id: 'USR-004',
      name: 'Jane Smith',
      email: 'jane.smith@email.com',
      phone: '+91 9876543213',
      role: 'citizen',
      status: 'blocked',
      joinDate: '2024-01-05',
      lastActive: '2024-01-12 09:00',
      complaintsSubmitted: 12,
    },
    {
      id: 'USR-005',
      name: 'Admin User',
      email: 'admin@city.gov',
      phone: '+91 9876543214',
      role: 'admin',
      status: 'active',
      joinDate: '2023-10-01',
      lastActive: '2024-01-15 18:00',
    },
  ]);

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    role: '',
    status: '',
    ward: '',
  });

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionType, setActionType] = useState<'view' | 'edit' | 'role' | null>(null);
  const [newRole, setNewRole] = useState<string>('');
  const [newWard, setNewWard] = useState<string>('');
  const [newDepartment, setNewDepartment] = useState<string>('');

  const wards = ['Ward 1', 'Ward 2', 'Ward 3', 'Ward 4', 'Ward 5'];
  const departments = [
    'Water & Sanitation',
    'Electricity',
    'Roads & Infrastructure',
    'Public Health',
    'Parks & Recreation',
  ];

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'ward-officer': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'maintenance': return 'bg-green-100 text-green-800 border-green-200';
      case 'citizen': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'blocked': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredUsers = users.filter(user => {
    return (
      (!filters.search || 
        user.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        user.email.toLowerCase().includes(filters.search.toLowerCase()) ||
        user.id.toLowerCase().includes(filters.search.toLowerCase())) &&
      (!filters.role || user.role === filters.role) &&
      (!filters.status || user.status === filters.status) &&
      (!filters.ward || user.ward === filters.ward)
    );
  });

  const handleRoleUpdate = () => {
    console.log('Updating role for user:', selectedUser?.id, 'to:', newRole);
    // Here you would make an API call to update the user role
    setActionType(null);
    setSelectedUser(null);
    setNewRole('');
    setNewWard('');
    setNewDepartment('');
  };

  const toggleUserStatus = (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
    console.log('Toggling user status:', userId, 'from:', currentStatus, 'to:', newStatus);
    // Here you would make an API call to update user status
  };

  const userStats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    blocked: users.filter(u => u.status === 'blocked').length,
    citizens: users.filter(u => u.role === 'citizen').length,
    staff: users.filter(u => u.role !== 'citizen').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Manage citizen accounts and staff members
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Mail className="h-4 w-4 mr-2" />
            Bulk Email
          </Button>
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{userStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{userStats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Ban className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Blocked</p>
                <p className="text-2xl font-bold">{userStats.blocked}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Citizens</p>
                <p className="text-2xl font-bold">{userStats.citizens}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Staff</p>
                <p className="text-2xl font-bold">{userStats.staff}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Users</TabsTrigger>
          <TabsTrigger value="citizens">Citizens</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
          <TabsTrigger value="blocked">Blocked</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Filters</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Name, email, or ID..."
                      value={filters.search}
                      onChange={(e) => setFilters({...filters, search: e.target.value})}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={filters.role} onValueChange={(value) => setFilters({...filters, role: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="All roles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="citizen">Citizen</SelectItem>
                      <SelectItem value="ward-officer">Ward Officer</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button 
                    variant="outline" 
                    onClick={() => setFilters({ search: '', role: '', status: '', ward: '' })}
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>Users ({filteredUsers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assignment</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-xs text-muted-foreground">{user.id}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1 text-xs">
                            <Mail className="h-3 w-3" />
                            <span>{user.email}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-xs">
                            <Phone className="h-3 w-3" />
                            <span>{user.phone}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(user.role)}>
                          {user.role.replace('-', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(user.status)}>
                            {user.status}
                          </Badge>
                          <Switch
                            checked={user.status === 'active'}
                            onCheckedChange={() => toggleUserStatus(user.id, user.status)}
                            size="sm"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.ward && (
                          <div className="text-sm">{user.ward}</div>
                        )}
                        {user.department && (
                          <div className="text-xs text-muted-foreground">{user.department}</div>
                        )}
                        {!user.ward && !user.department && (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {user.complaintsSubmitted && (
                            <div className="text-xs">Submitted: {user.complaintsSubmitted}</div>
                          )}
                          {user.complaintsResolved && (
                            <div className="text-xs">Resolved: {user.complaintsResolved}</div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            Last: {user.lastActive}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setActionType('view');
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>User Details - {user.name}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>User ID</Label>
                                    <p className="text-sm">{user.id}</p>
                                  </div>
                                  <div>
                                    <Label>Role</Label>
                                    <Badge className={getRoleColor(user.role)}>
                                      {user.role.replace('-', ' ')}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Email</Label>
                                    <p className="text-sm">{user.email}</p>
                                  </div>
                                  <div>
                                    <Label>Phone</Label>
                                    <p className="text-sm">{user.phone}</p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Join Date</Label>
                                    <p className="text-sm">{user.joinDate}</p>
                                  </div>
                                  <div>
                                    <Label>Last Active</Label>
                                    <p className="text-sm">{user.lastActive}</p>
                                  </div>
                                </div>
                                {(user.ward || user.department) && (
                                  <div className="grid grid-cols-2 gap-4">
                                    {user.ward && (
                                      <div>
                                        <Label>Ward</Label>
                                        <p className="text-sm">{user.ward}</p>
                                      </div>
                                    )}
                                    {user.department && (
                                      <div>
                                        <Label>Department</Label>
                                        <p className="text-sm">{user.department}</p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setActionType('role');
                                  setNewRole(user.role);
                                  setNewWard(user.ward || '');
                                  setNewDepartment(user.department || '');
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Update Role - {user.name}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Role</Label>
                                  <Select value={newRole} onValueChange={setNewRole}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="citizen">Citizen</SelectItem>
                                      <SelectItem value="ward-officer">Ward Officer</SelectItem>
                                      <SelectItem value="maintenance">Maintenance</SelectItem>
                                      <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                {newRole === 'ward-officer' && (
                                  <div>
                                    <Label>Assign Ward</Label>
                                    <Select value={newWard} onValueChange={setNewWard}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select ward" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {wards.map(ward => (
                                          <SelectItem key={ward} value={ward}>{ward}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}

                                {newRole === 'maintenance' && (
                                  <div>
                                    <Label>Assign Department</Label>
                                    <Select value={newDepartment} onValueChange={setNewDepartment}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select department" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {departments.map(dept => (
                                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}

                                <div className="flex justify-end space-x-2">
                                  <Button variant="outline" onClick={() => setActionType(null)}>
                                    Cancel
                                  </Button>
                                  <Button onClick={handleRoleUpdate}>
                                    Update Role
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other tab contents would show filtered views */}
        <TabsContent value="citizens">
          <p className="text-muted-foreground">Citizens tab content - filtered view of citizen users</p>
        </TabsContent>
        <TabsContent value="staff">
          <p className="text-muted-foreground">Staff tab content - filtered view of staff users</p>
        </TabsContent>
        <TabsContent value="blocked">
          <p className="text-muted-foreground">Blocked tab content - filtered view of blocked users</p>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminUsers;
