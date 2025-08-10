import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
import StatusChip, { ComplaintStatus } from '@/components/StatusChip';
import {
  Search,
  Filter,
  Eye,
  Edit,
  UserPlus,
  Download,
  Calendar,
  MapPin,
  Clock,
  MessageSquare,
  FileText,
  AlertTriangle,
} from 'lucide-react';

interface Complaint {
  id: string;
  type: string;
  submittedBy: string;
  assignedTo: string;
  ward: string;
  area: string;
  status: ComplaintStatus;
  priority: 'low' | 'medium' | 'high' | 'critical';
  submittedDate: string;
  lastUpdated: string;
  slaDeadline: string;
  description: string;
  attachments: number;
}

interface FilterState {
  search: string;
  ward: string;
  type: string;
  status: string;
  priority: string;
  assignedTo: string;
  dateFrom: string;
  dateTo: string;
}

const AdminComplaints: React.FC = () => {
  const [complaints] = useState<Complaint[]>([
    {
      id: 'CMP-2024-001',
      type: 'Water Supply',
      submittedBy: 'John Doe (+91 9876543210)',
      assignedTo: 'Mike Johnson',
      ward: 'Ward 1',
      area: 'Green Valley Society',
      status: 'assigned',
      priority: 'high',
      submittedDate: '2024-01-15',
      lastUpdated: '2024-01-15 14:30',
      slaDeadline: '2024-01-17 18:00',
      description: 'No water supply for the past 3 days in our society. Multiple residents affected.',
      attachments: 2,
    },
    {
      id: 'CMP-2024-002',
      type: 'Street Lighting',
      submittedBy: 'Jane Smith (+91 9876543211)',
      assignedTo: 'Sarah Wilson',
      ward: 'Ward 3',
      area: 'Main Street',
      status: 'in-progress',
      priority: 'medium',
      submittedDate: '2024-01-14',
      lastUpdated: '2024-01-15 10:15',
      slaDeadline: '2024-01-19 18:00',
      description: 'Street lights not working on Main Street for past week.',
      attachments: 1,
    },
    {
      id: 'CMP-2024-003',
      type: 'Garbage Collection',
      submittedBy: 'Bob Johnson (+91 9876543212)',
      assignedTo: 'Unassigned',
      ward: 'Ward 2',
      area: 'Park View',
      status: 'registered',
      priority: 'critical',
      submittedDate: '2024-01-15',
      lastUpdated: '2024-01-15 16:45',
      slaDeadline: '2024-01-16 12:00',
      description: 'Garbage not collected for 5 days. Health hazard developing.',
      attachments: 3,
    },
    {
      id: 'CMP-2024-004',
      type: 'Road Repair',
      submittedBy: 'Alice Brown (+91 9876543213)',
      assignedTo: 'Tom Davis',
      ward: 'Ward 4',
      area: 'City Center',
      status: 'resolved',
      priority: 'low',
      submittedDate: '2024-01-10',
      lastUpdated: '2024-01-14 09:00',
      slaDeadline: '2024-01-20 18:00',
      description: 'Pothole on the main road causing traffic issues.',
      attachments: 0,
    },
  ]);

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    ward: 'all',
    type: 'all',
    status: 'all',
    priority: 'all',
    assignedTo: '',
    dateFrom: '',
    dateTo: '',
  });

  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [actionType, setActionType] = useState<'view' | 'assign' | 'status' | null>(null);
  const [assigneeEmail, setAssigneeEmail] = useState('');
  const [newStatus, setNewStatus] = useState<ComplaintStatus>('registered');
  const [remarks, setRemarks] = useState('');

  const staffMembers = [
    'Mike Johnson (mike@city.gov)',
    'Sarah Wilson (sarah@city.gov)',
    'Tom Davis (tom@city.gov)',
    'Lisa Anderson (lisa@city.gov)',
    'David Brown (david@city.gov)',
  ];

  const wards = ['Ward 1', 'Ward 2', 'Ward 3', 'Ward 4', 'Ward 5'];
  const complaintTypes = [
    'Water Supply',
    'Electricity',
    'Road Repair',
    'Garbage Collection',
    'Street Lighting',
    'Sewerage',
    'Public Health',
    'Traffic',
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const isOverdue = (deadline: string) => {
    return new Date(deadline) < new Date();
  };

  const filteredComplaints = complaints.filter(complaint => {
    return (
      (!filters.search ||
        complaint.id.toLowerCase().includes(filters.search.toLowerCase()) ||
        complaint.submittedBy.toLowerCase().includes(filters.search.toLowerCase()) ||
        complaint.type.toLowerCase().includes(filters.search.toLowerCase())) &&
      (!filters.ward || filters.ward === 'all' || complaint.ward === filters.ward) &&
      (!filters.type || filters.type === 'all' || complaint.type === filters.type) &&
      (!filters.status || filters.status === 'all' || complaint.status === filters.status) &&
      (!filters.priority || filters.priority === 'all' || complaint.priority === filters.priority) &&
      (!filters.assignedTo || complaint.assignedTo.includes(filters.assignedTo))
    );
  });

  const handleAssign = () => {
    console.log('Assigning complaint:', selectedComplaint?.id, 'to:', assigneeEmail);
    // Here you would make an API call to assign the complaint
    setActionType(null);
    setSelectedComplaint(null);
    setAssigneeEmail('');
  };

  const handleStatusUpdate = () => {
    console.log('Updating status:', selectedComplaint?.id, 'to:', newStatus, 'remarks:', remarks);
    // Here you would make an API call to update the status
    setActionType(null);
    setSelectedComplaint(null);
    setNewStatus('registered');
    setRemarks('');
  };

  const exportComplaints = () => {
    console.log('Exporting complaints...');
    // Here you would implement the export functionality
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Complaint Management</h1>
          <p className="text-muted-foreground">
            Manage and track all citizen complaints
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={exportComplaints}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <FileText className="h-4 w-4 mr-2" />
            New Complaint
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="ID, name, type..."
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Ward</Label>
              <Select value={filters.ward} onValueChange={(value) => setFilters({...filters, ward: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="All wards" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Wards</SelectItem>
                  {wards.map(ward => (
                    <SelectItem key={ward} value={ward}>{ward}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={filters.type} onValueChange={(value) => setFilters({...filters, type: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {complaintTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
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
                  <SelectItem value="registered">Registered</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={filters.priority} onValueChange={(value) => setFilters({...filters, priority: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateFrom">Date From</Label>
              <Input
                id="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateTo">Date To</Label>
              <Input
                id="dateTo"
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
              />
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => setFilters({
                  search: '', ward: 'all', type: 'all', status: 'all', priority: 'all', assignedTo: '', dateFrom: '', dateTo: ''
                })}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Complaints Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Complaints ({filteredComplaints.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Complaint ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Submitted By</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Ward</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>SLA Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredComplaints.map((complaint) => (
                <TableRow key={complaint.id}>
                  <TableCell className="font-medium">{complaint.id}</TableCell>
                  <TableCell>{complaint.type}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{complaint.submittedBy.split(' (+')[0]}</div>
                      <div className="text-xs text-muted-foreground">
                        {complaint.submittedBy.match(/\(\+[\d\s]+\)/)?.[0]}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {complaint.assignedTo === 'Unassigned' ? (
                      <Badge variant="secondary">Unassigned</Badge>
                    ) : (
                      complaint.assignedTo
                    )}
                  </TableCell>
                  <TableCell>{complaint.ward}</TableCell>
                  <TableCell>
                    <StatusChip status={complaint.status} />
                  </TableCell>
                  <TableCell>
                    <Badge className={getPriorityColor(complaint.priority)}>
                      {complaint.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {isOverdue(complaint.slaDeadline) ? (
                      <div className="flex items-center space-x-1 text-red-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-xs">Overdue</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1 text-green-600">
                        <Clock className="h-4 w-4" />
                        <span className="text-xs">On Time</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedComplaint(complaint);
                              setActionType('view');
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Complaint Details - {complaint.id}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Type</Label>
                                <p className="text-sm">{complaint.type}</p>
                              </div>
                              <div>
                                <Label>Priority</Label>
                                <Badge className={getPriorityColor(complaint.priority)}>
                                  {complaint.priority}
                                </Badge>
                              </div>
                            </div>
                            <div>
                              <Label>Description</Label>
                              <p className="text-sm mt-1">{complaint.description}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Submitted By</Label>
                                <p className="text-sm">{complaint.submittedBy}</p>
                              </div>
                              <div>
                                <Label>Ward & Area</Label>
                                <p className="text-sm">{complaint.ward} - {complaint.area}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Submitted Date</Label>
                                <p className="text-sm">{complaint.submittedDate}</p>
                              </div>
                              <div>
                                <Label>SLA Deadline</Label>
                                <p className="text-sm">{complaint.slaDeadline}</p>
                              </div>
                            </div>
                            {complaint.attachments > 0 && (
                              <div>
                                <Label>Attachments</Label>
                                <p className="text-sm">{complaint.attachments} file(s) attached</p>
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
                              setSelectedComplaint(complaint);
                              setActionType('assign');
                            }}
                          >
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Assign Complaint - {complaint.id}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="assignee">Assign to Staff Member</Label>
                              <Select value={assigneeEmail} onValueChange={setAssigneeEmail}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select staff member" />
                                </SelectTrigger>
                                <SelectContent>
                                  {staffMembers.map((member) => (
                                    <SelectItem key={member} value={member}>
                                      {member}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button variant="outline" onClick={() => setActionType(null)}>
                                Cancel
                              </Button>
                              <Button onClick={handleAssign}>
                                Assign
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedComplaint(complaint);
                              setActionType('status');
                              setNewStatus(complaint.status);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Update Status - {complaint.id}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>New Status</Label>
                              <Select value={newStatus} onValueChange={(value) => setNewStatus(value as ComplaintStatus)}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="registered">Registered</SelectItem>
                                  <SelectItem value="assigned">Assigned</SelectItem>
                                  <SelectItem value="in-progress">In Progress</SelectItem>
                                  <SelectItem value="resolved">Resolved</SelectItem>
                                  <SelectItem value="closed">Closed</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="remarks">Remarks</Label>
                              <Textarea
                                id="remarks"
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                placeholder="Add remarks for status update..."
                                rows={3}
                              />
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button variant="outline" onClick={() => setActionType(null)}>
                                Cancel
                              </Button>
                              <Button onClick={handleStatusUpdate}>
                                Update Status
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
    </div>
  );
};

export default AdminComplaints;
