import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import { useGetComplaintsQuery } from "../store/api/complaintsApi";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import ComplaintQuickActions from "../components/ComplaintQuickActions";
import UpdateComplaintModal from "../components/UpdateComplaintModal";
import {
  MapPin,
  Users,
  BarChart3,
  Settings,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  FileText,
  Clock,
  Calendar,
} from "lucide-react";

const WardManagement: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState("overview");

  // State for Update Complaint Modal
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);

  // Fetch complaints for the ward officer
  const {
    data: complaintsResponse,
    isLoading: complaintsLoading,
    refetch: refetchComplaints,
  } = useGetComplaintsQuery({
    page: 1,
    limit: 100,
    officerId: user?.id,
  });

  const complaints = Array.isArray(complaintsResponse?.data?.complaints)
    ? complaintsResponse.data.complaints
    : [];

  // Calculate real stats from complaint data
  const wardStats = {
    totalComplaints: complaints.length,
    resolved: complaints.filter(
      (c) => c.status === "RESOLVED" || c.status === "CLOSED",
    ).length,
    pending: complaints.filter(
      (c) =>
        c.status === "REGISTERED" ||
        c.status === "ASSIGNED" ||
        c.status === "IN_PROGRESS",
    ).length,
    inProgress: complaints.filter((c) => c.status === "IN_PROGRESS").length,
    resolutionRate:
      complaints.length > 0
        ? Math.round(
            (complaints.filter(
              (c) => c.status === "RESOLVED" || c.status === "CLOSED",
            ).length /
              complaints.length) *
              100,
          )
        : 0,
  };

  // Group complaints by sub-zone if available
  const complaintsByArea = complaints.reduce((acc: any, complaint) => {
    const area = complaint.area || "Unknown Area";
    if (!acc[area]) {
      acc[area] = {
        name: area,
        complaints: 0,
        resolved: 0,
        pending: 0,
      };
    }
    acc[area].complaints++;
    if (complaint.status === "RESOLVED" || complaint.status === "CLOSED") {
      acc[area].resolved++;
    } else {
      acc[area].pending++;
    }
    return acc;
  }, {});

  const subZones = Object.values(complaintsByArea);

  // Priority complaints that need attention
  const priorityComplaints = complaints
    .filter(
      (c) =>
        c.priority === "HIGH" ||
        c.priority === "CRITICAL" ||
        c.status === "REGISTERED",
    )
    .slice(0, 10);

  if (complaintsLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
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
          <h1 className="text-3xl font-bold text-gray-900">Ward Management</h1>
          <p className="text-gray-600">
            Overview and management of {user?.ward?.name || "your ward"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => refetchComplaints()}>
            <TrendingUp className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
          <Link to="/complaints">
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              View All Complaints
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Complaints
                </p>
                <p className="text-2xl font-bold">
                  {wardStats.totalComplaints}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-green-600">
                  {wardStats.resolved}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {wardStats.pending}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-orange-600">
                  {wardStats.inProgress}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resolution Rate */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Ward Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Resolution Rate</span>
                <span>{wardStats.resolutionRate}%</span>
              </div>
              <Progress value={wardStats.resolutionRate} className="h-2" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">2.3</div>
                <p className="text-sm text-gray-600">Avg. Resolution Days</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">95%</div>
                <p className="text-sm text-gray-600">Citizen Satisfaction</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">28</div>
                <p className="text-sm text-gray-600">Active Team Members</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Interface */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="priority">Priority Complaints</TabsTrigger>
          <TabsTrigger value="areas">Areas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Resolution Rate */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Ward Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Resolution Rate</span>
                      <span>{wardStats.resolutionRate}%</span>
                    </div>
                    <Progress
                      value={wardStats.resolutionRate}
                      className="h-2"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {wardStats.totalComplaints}
                      </div>
                      <p className="text-sm text-gray-600">Total Complaints</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {wardStats.resolved}
                      </div>
                      <p className="text-sm text-gray-600">Resolved</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {wardStats.pending}
                      </div>
                      <p className="text-sm text-gray-600">Pending</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
                  <Link to="/complaints?status=REGISTERED">
                    <Button variant="outline" className="w-full justify-start">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      New Complaints (
                      {
                        complaints.filter((c) => c.status === "REGISTERED")
                          .length
                      }
                      )
                    </Button>
                  </Link>
                  <Link to="/complaints?status=IN_PROGRESS">
                    <Button variant="outline" className="w-full justify-start">
                      <Clock className="h-4 w-4 mr-2" />
                      In Progress ({wardStats.inProgress})
                    </Button>
                  </Link>
                  <Link to="/complaints?priority=HIGH,CRITICAL">
                    <Button variant="outline" className="w-full justify-start">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      High Priority (
                      {
                        complaints.filter(
                          (c) =>
                            c.priority === "HIGH" || c.priority === "CRITICAL",
                        ).length
                      }
                      )
                    </Button>
                  </Link>
                  <Link to="/complaints">
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      All Complaints
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="priority" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Priority Complaints Requiring Attention
              </CardTitle>
            </CardHeader>
            <CardContent>
              {priorityComplaints.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-400 mb-4" />
                  <p className="text-gray-500">
                    No priority complaints requiring attention
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Area</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {priorityComplaints.map((complaint) => (
                      <TableRow key={complaint.id}>
                        <TableCell className="font-medium">
                          #{complaint.complaintId || complaint.id.slice(-6)}
                        </TableCell>
                        <TableCell>
                          {complaint.type.replace("_", " ")}
                        </TableCell>
                        <TableCell>{complaint.area}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              complaint.status === "REGISTERED"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-blue-100 text-blue-800"
                            }
                          >
                            {complaint.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              complaint.priority === "CRITICAL"
                                ? "bg-red-100 text-red-800"
                                : "bg-orange-100 text-orange-800"
                            }
                          >
                            {complaint.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(
                              complaint.submittedOn,
                            ).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <ComplaintQuickActions
                            complaint={{
                              id: complaint.id,
                              complaintId: complaint.complaintId,
                              status: complaint.status,
                              priority: complaint.priority,
                              type: complaint.type,
                              description: complaint.description,
                              area: complaint.area,
                              assignedTo: complaint.assignedTo,
                            }}
                            userRole={user?.role || ""}
                            showDetails={false}
                            onUpdate={() => refetchComplaints()}
                            onShowUpdateModal={(complaint) => {
                              setSelectedComplaint(complaint);
                              setIsUpdateModalOpen(true);
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="areas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Complaints by Area
              </CardTitle>
            </CardHeader>
            <CardContent>
              {subZones.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No complaint data available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {subZones.map((zone: any, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium">{zone.name}</h3>
                        <Badge variant="secondary">
                          {zone.complaints} complaints
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">
                            Total: {zone.complaints}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">
                            Resolved: {zone.resolved}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">
                            Pending: {zone.pending}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <Progress
                          value={
                            zone.complaints > 0
                              ? (zone.resolved / zone.complaints) * 100
                              : 0
                          }
                          className="h-2"
                        />
                      </div>
                      <div className="mt-3 flex justify-end">
                        <Link
                          to={`/complaints?area=${encodeURIComponent(zone.name)}`}
                        >
                          <Button variant="outline" size="sm">
                            View Complaints
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Update Complaint Modal */}
      <UpdateComplaintModal
        complaint={selectedComplaint}
        isOpen={isUpdateModalOpen}
        onClose={() => {
          setIsUpdateModalOpen(false);
          setSelectedComplaint(null);
        }}
        onSuccess={() => {
          setIsUpdateModalOpen(false);
          setSelectedComplaint(null);
          refetchComplaints();
        }}
      />
    </div>
  );
};

export default WardManagement;
