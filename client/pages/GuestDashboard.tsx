import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
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
import {
  PlusCircle,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  MapPin,
  Calendar,
  Eye,
  Search,
  User,
  Mail,
  Phone,
  CreditCard,
  Bell,
  Settings,
  BarChart3,
  TrendingUp,
  History,
} from "lucide-react";
import QuickComplaintModal from "../components/QuickComplaintModal";

// Mock data - in real app this would come from API
const mockProfile = {
  fullName: "John Doe",
  email: "john.doe@example.com",
  phoneNumber: "+91-9876543210",
  address: "123 Marine Drive, Fort Kochi",
  joinedDate: "2024-01-15",
  totalRequests: 12,
  resolvedRequests: 8,
};

const mockComplaints = [
  {
    id: "CMP001",
    title: "Water Supply Issue",
    type: "WATER_SUPPLY",
    status: "IN_PROGRESS",
    priority: "HIGH",
    submittedOn: "2024-01-20",
    ward: "Fort Kochi",
    description: "No water supply for 3 days",
  },
  {
    id: "CMP002",
    title: "Street Light Repair",
    type: "STREET_LIGHTING",
    status: "RESOLVED",
    priority: "MEDIUM",
    submittedOn: "2024-01-15",
    resolvedOn: "2024-01-18",
    ward: "Fort Kochi",
    description: "Street light not working on Marine Drive",
  },
];

const mockServiceRequests = [
  {
    id: "SRV001",
    title: "Birth Certificate",
    type: "BIRTH_CERTIFICATE",
    status: "PROCESSING",
    submittedOn: "2024-01-22",
    expectedCompletion: "2024-01-29",
    description: "Birth certificate for newborn",
  },
  {
    id: "SRV002",
    title: "Trade License Renewal",
    type: "TRADE_LICENSE",
    status: "APPROVED",
    submittedOn: "2024-01-10",
    completedOn: "2024-01-25",
    description: "Renewal of trade license for restaurant",
  },
];

const mockPayments = [
  {
    id: "PAY001",
    description: "Property Tax - Q1 2024",
    amount: 15000,
    status: "PAID",
    paidOn: "2024-01-15",
    method: "Online Banking",
  },
  {
    id: "PAY002",
    description: "Trade License Fee",
    amount: 5000,
    status: "PAID",
    paidOn: "2024-01-25",
    method: "Credit Card",
  },
  {
    id: "PAY003",
    description: "Water Connection Fee",
    amount: 2500,
    status: "PENDING",
    dueDate: "2024-02-05",
  },
];

const mockNotifications = [
  {
    id: "NOT001",
    title: "Complaint Status Update",
    message: "Your water supply complaint has been assigned to a technician",
    type: "COMPLAINT_UPDATE",
    timestamp: "2024-01-23T10:30:00Z",
    read: false,
  },
  {
    id: "NOT002",
    title: "Service Request Approved",
    message: "Your trade license renewal has been approved",
    type: "SERVICE_UPDATE",
    timestamp: "2024-01-25T14:15:00Z",
    read: true,
  },
];

const GuestDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [isQuickFormOpen, setIsQuickFormOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "REGISTERED":
      case "PROCESSING":
        return "bg-yellow-100 text-yellow-800";
      case "ASSIGNED":
        return "bg-blue-100 text-blue-800";
      case "IN_PROGRESS":
        return "bg-orange-100 text-orange-800";
      case "RESOLVED":
      case "APPROVED":
      case "PAID":
        return "bg-green-100 text-green-800";
      case "CLOSED":
        return "bg-gray-100 text-gray-800";
      case "PENDING":
        return "bg-red-100 text-red-800";
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">
                Welcome back, {mockProfile.fullName}!
              </h1>
              <p className="text-blue-100">
                Manage your complaints, service requests, and profile
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <Button
                onClick={() => setIsQuickFormOpen(true)}
                className="bg-white text-blue-600 hover:bg-gray-50"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                New Complaint
              </Button>
              <Button
                onClick={() => navigate("/guest/service-request")}
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-blue-600"
              >
                <FileText className="mr-2 h-4 w-4" />
                New Service Request
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="complaints">Complaints</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Requests
                  </CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {mockProfile.totalRequests}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    All time submissions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Resolved
                  </CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {mockProfile.resolvedRequests}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Successfully resolved
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    In Progress
                  </CardTitle>
                  <Clock className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {mockProfile.totalRequests - mockProfile.resolvedRequests}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Being worked on
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Success Rate
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round(
                      (mockProfile.resolvedRequests /
                        mockProfile.totalRequests) *
                        100,
                    )}
                    %
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Resolution rate
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Complaints */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Complaints</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockComplaints.slice(0, 3).map((complaint) => (
                      <div
                        key={complaint.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1">
                          <h3 className="font-medium text-sm">
                            {complaint.title}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            ID: {complaint.id}
                          </p>
                        </div>
                        <Badge className={getStatusColor(complaint.status)}>
                          {complaint.status.replace("_", " ")}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab("complaints")}
                      className="w-full"
                    >
                      View All Complaints
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Service Requests */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Recent Service Requests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockServiceRequests.slice(0, 3).map((service) => (
                      <div
                        key={service.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1">
                          <h3 className="font-medium text-sm">
                            {service.title}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            ID: {service.id}
                          </p>
                        </div>
                        <Badge className={getStatusColor(service.status)}>
                          {service.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab("services")}
                      className="w-full"
                    >
                      View All Services
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    onClick={() => navigate("/guest/complaint")}
                    className="justify-start h-auto p-4"
                  >
                    <PlusCircle className="mr-2 h-5 w-5" />
                    <div className="text-left">
                      <div className="font-medium">Submit Complaint</div>
                      <div className="text-xs opacity-75">
                        Report civic issues
                      </div>
                    </div>
                  </Button>
                  <Button
                    onClick={() => navigate("/guest/service-request")}
                    variant="outline"
                    className="justify-start h-auto p-4"
                  >
                    <FileText className="mr-2 h-5 w-5" />
                    <div className="text-left">
                      <div className="font-medium">Request Service</div>
                      <div className="text-xs opacity-75">
                        Municipal services
                      </div>
                    </div>
                  </Button>
                  <Button
                    onClick={() => navigate("/guest/track")}
                    variant="outline"
                    className="justify-start h-auto p-4"
                  >
                    <Search className="mr-2 h-5 w-5" />
                    <div className="text-left">
                      <div className="font-medium">Track Status</div>
                      <div className="text-xs opacity-75">Check progress</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Complaints Tab */}
          <TabsContent value="complaints" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">My Complaints</CardTitle>
                  <Button onClick={() => setIsQuickFormOpen(true)}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    New Complaint
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Search */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search complaints..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Complaints Table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockComplaints.map((complaint) => (
                      <TableRow key={complaint.id}>
                        <TableCell className="font-mono text-xs">
                          {complaint.id}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-48">
                            <div className="font-medium text-sm truncate">
                              {complaint.title}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {complaint.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {complaint.type.replace("_", " ")}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(complaint.status)}>
                            {complaint.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getPriorityColor(complaint.priority)}
                          >
                            {complaint.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(complaint.submittedOn)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">My Service Requests</CardTitle>
                  <Button onClick={() => navigate("/guest/service-request")}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    New Service Request
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Expected Completion</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockServiceRequests.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell className="font-mono text-xs">
                          {service.id}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-48">
                            <div className="font-medium text-sm">
                              {service.title}
                            </div>
                            <div className="text-xs text-gray-500">
                              {service.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(service.status)}>
                            {service.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(service.submittedOn)}</TableCell>
                        <TableCell>
                          {service.status === "APPROVED" && service.completedOn
                            ? formatDate(service.completedOn)
                            : service.expectedCompletion
                              ? formatDate(service.expectedCompletion)
                              : "TBD"}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Method</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-mono text-xs">
                          {payment.id}
                        </TableCell>
                        <TableCell className="font-medium">
                          {payment.description}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(payment.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(payment.status)}>
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {payment.status === "PAID"
                            ? formatDate(payment.paidOn!)
                            : `Due: ${formatDate(payment.dueDate!)}`}
                        </TableCell>
                        <TableCell>{payment.method || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border rounded-lg ${
                        !notification.read
                          ? "bg-blue-50 border-blue-200"
                          : "bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-sm">
                              {notification.title}
                            </h3>
                            {!notification.read && (
                              <Badge className="bg-blue-100 text-blue-800 text-xs">
                                New
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(notification.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <Bell className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Profile Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Profile Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={mockProfile.fullName}
                      readOnly
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" value={mockProfile.email} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={mockProfile.phoneNumber}
                      readOnly
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" value={mockProfile.address} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="joinedDate">Member Since</Label>
                    <Input
                      id="joinedDate"
                      value={formatDate(mockProfile.joinedDate)}
                      readOnly
                    />
                  </div>
                  <Button className="w-full" disabled>
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Profile (Coming Soon)
                  </Button>
                </CardContent>
              </Card>

              {/* Account Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Account Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {mockProfile.totalRequests}
                      </div>
                      <div className="text-sm text-blue-700">
                        Total Requests
                      </div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {mockProfile.resolvedRequests}
                      </div>
                      <div className="text-sm text-green-700">Resolved</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Success Rate
                      </span>
                      <span className="font-medium">
                        {Math.round(
                          (mockProfile.resolvedRequests /
                            mockProfile.totalRequests) *
                            100,
                        )}
                        %
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Active Requests
                      </span>
                      <span className="font-medium">
                        {mockProfile.totalRequests -
                          mockProfile.resolvedRequests}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Member Since
                      </span>
                      <span className="font-medium">
                        {formatDate(mockProfile.joinedDate)}
                      </span>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-medium mb-2">Account Features</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Submit unlimited complaints</li>
                      <li>• Request municipal services</li>
                      <li>• Track request status in real-time</li>
                      <li>• Receive email notifications</li>
                      <li>• Access payment history</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Quick Complaint Modal */}
      <QuickComplaintModal
        isOpen={isQuickFormOpen}
        onClose={() => setIsQuickFormOpen(false)}
        onSuccess={(complaintId) => {
          // Could add refresh logic here if needed
          setActiveTab("complaints");
        }}
      />
    </div>
  );
};

export default GuestDashboard;
