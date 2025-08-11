import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { fetchComplaints, assignComplaint, updateComplaintStatus } from '../store/slices/complaintsSlice';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  AlertTriangle,
  Clock,
  Users,
  BarChart3,
  Calendar,
  MapPin,
  CheckCircle,
  XCircle,
  TrendingUp,
  FileText,
  Settings,
  MessageSquare,
} from 'lucide-react';

const WardOfficerDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { complaints, isLoading } = useAppSelector((state) => state.complaints);
  const { translations } = useAppSelector((state) => state.language);

  const [dashboardStats, setDashboardStats] = useState({
    totalAssigned: 0,
    pending: 0,
    inProgress: 0,
    overdue: 0,
    resolved: 0,
    slaCompliance: 85,
    avgResolutionTime: 2.8,
  });

  useEffect(() => {
    dispatch(fetchComplaints());
  }, [dispatch]);

  useEffect(() => {
    // Filter complaints for this ward officer
    const wardComplaints = complaints.filter(c => 
      c.assignedToId === user?.id || c.wardId === user?.wardId
    );
    
    const totalAssigned = wardComplaints.length;
    const pending = wardComplaints.filter(c => c.status === 'REGISTERED').length;
    const inProgress = wardComplaints.filter(c => c.status === 'IN_PROGRESS').length;
    const resolved = wardComplaints.filter(c => c.status === 'RESOLVED').length;
    const overdue = wardComplaints.filter(c => {
      if (!c.deadline) return false;
      return new Date(c.deadline) < new Date() && c.status !== 'RESOLVED';
    }).length;

    setDashboardStats({
      totalAssigned,
      pending,
      inProgress,
      overdue,
      resolved,
      slaCompliance: 85, // Mock calculation
      avgResolutionTime: 2.8, // Mock calculation
    });
  }, [complaints, user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'REGISTERED':
        return 'bg-yellow-100 text-yellow-800';
      case 'ASSIGNED':
        return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS':
        return 'bg-orange-100 text-orange-800';
      case 'RESOLVED':
        return 'bg-green-100 text-green-800';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return 'bg-green-100 text-green-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'CRITICAL':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const wardComplaints = complaints.filter(c => 
    c.assignedToId === user?.id || c.wardId === user?.wardId
  );

  const urgentComplaints = wardComplaints.filter(c => 
    c.priority === 'CRITICAL' || c.priority === 'HIGH'
  ).slice(0, 5);

  const recentComplaints = wardComplaints.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Ward Officer Dashboard
        </h1>
        <p className="text-blue-100">
          Manage complaints for {user?.ward || 'your assigned ward'} and monitor team performance.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assigned</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.totalAssigned}</div>
            <p className="text-xs text-muted-foreground">Complaints in your ward</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Action</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{dashboardStats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting assignment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{dashboardStats.overdue}</div>
            <p className="text-xs text-muted-foreground">Past deadline</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SLA Compliance</CardTitle>
            <BarChart3 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{dashboardStats.slaCompliance}%</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="urgent">Urgent ({urgentComplaints.length})</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Complaints */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Recent Complaints
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentComplaints.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">No complaints in your ward</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentComplaints.map((complaint) => (
                      <div key={complaint.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium text-sm">
                            {complaint.title || `Complaint #${complaint.id.slice(-6)}`}
                          </h3>
                          <div className="flex space-x-2">
                            <Badge className={getStatusColor(complaint.status)}>
                              {complaint.status.replace('_', ' ')}
                            </Badge>
                            <Badge className={getPriorityColor(complaint.priority)}>
                              {complaint.priority}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {complaint.description}
                        </p>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center text-xs text-gray-500">
                            <MapPin className="h-3 w-3 mr-1" />
                            {complaint.area}
                            <Calendar className="h-3 w-3 ml-3 mr-1" />
                            {new Date(complaint.submittedOn).toLocaleDateString()}
                          </div>
                          <Link to={`/complaints/${complaint.id}`}>
                            <Button variant="outline" size="sm">
                              Manage
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to="/complaints?status=REGISTERED" className="block">
                  <Button className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    Assign Complaints ({dashboardStats.pending})
                  </Button>
                </Link>
                <Link to="/complaints?priority=CRITICAL,HIGH" className="block">
                  <Button variant="destructive" className="w-full justify-start">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Handle Urgent ({urgentComplaints.length})
                  </Button>
                </Link>
                <Link to="/reports" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Generate Reports
                  </Button>
                </Link>
                <Link to="/messages" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Team Communication
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="urgent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-red-600">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Urgent Complaints Requiring Immediate Attention
              </CardTitle>
            </CardHeader>
            <CardContent>
              {urgentComplaints.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-400 mb-4" />
                  <p className="text-gray-500">No urgent complaints! Great job!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {urgentComplaints.map((complaint) => (
                    <div key={complaint.id} className="border-l-4 border-red-500 bg-red-50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-sm">
                          {complaint.title || `Complaint #${complaint.id.slice(-6)}`}
                        </h3>
                        <div className="flex space-x-2">
                          <Badge className="bg-red-100 text-red-800">
                            {complaint.priority}
                          </Badge>
                          <Badge className={getStatusColor(complaint.status)}>
                            {complaint.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">
                        {complaint.description}
                      </p>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center text-xs text-gray-600">
                          <MapPin className="h-3 w-3 mr-1" />
                          {complaint.area}
                          <Clock className="h-3 w-3 ml-3 mr-1" />
                          {complaint.deadline && new Date(complaint.deadline).toLocaleDateString()}
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="destructive">
                            Assign Now
                          </Button>
                          <Link to={`/complaints/${complaint.id}`}>
                            <Button size="sm" variant="outline">
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Complaint Assignment Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Unassigned Complaints</h3>
                  <Badge variant="secondary">{dashboardStats.pending} pending</Badge>
                </div>
                {/* Assignment interface would go here */}
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Assignment interface will be implemented here</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Drag and drop complaints to maintenance team members
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>SLA Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Resolution Rate</span>
                    <span>{dashboardStats.slaCompliance}%</span>
                  </div>
                  <Progress value={dashboardStats.slaCompliance} className="h-2" />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{dashboardStats.avgResolutionTime}</div>
                  <p className="text-xs text-gray-500">Average Resolution Time (days)</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Complaints Resolved</span>
                    <div className="flex items-center">
                      <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                      <span className="text-green-600 font-medium">+12%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Response Time</span>
                    <div className="flex items-center">
                      <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                      <span className="text-green-600 font-medium">-8%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Citizen Satisfaction</span>
                    <div className="flex items-center">
                      <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                      <span className="text-green-600 font-medium">4.2/5</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WardOfficerDashboard;
