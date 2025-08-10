import React, { useState } from "react";
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
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
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
import { Progress } from "../components/ui/progress";
import StatusChip, { ComplaintStatus } from "../components/StatusChip";
import {
  Wrench,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText,
  Upload,
  Camera,
  MapPin,
  User,
  Calendar,
} from "lucide-react";

interface AssignedComplaint {
  id: string;
  type: string;
  description: string;
  location: string;
  ward: string;
  submittedBy: string;
  assignedDate: string;
  dueDate: string;
  status: ComplaintStatus;
  priority: "low" | "medium" | "high" | "critical";
  attachments: string[];
  lastUpdate: string;
}

const MaintenanceDashboard: React.FC = () => {
  const [selectedComplaint, setSelectedComplaint] =
    useState<AssignedComplaint | null>(null);
  const [actionType, setActionType] = useState<"view" | "update" | null>(null);
  const [newStatus, setNewStatus] = useState<ComplaintStatus>("in-progress");
  const [updateRemarks, setUpdateRemarks] = useState("");
  const [beforePhotos, setBeforePhotos] = useState<File[]>([]);
  const [afterPhotos, setAfterPhotos] = useState<File[]>([]);

  const assignedComplaints: AssignedComplaint[] = [
    {
      id: "CMP-2024-001",
      type: "Water Supply",
      description:
        "No water supply for the past 3 days in Green Valley Society. Multiple residents affected.",
      location: "Green Valley Society, Block A",
      ward: "Ward 1",
      submittedBy: "John Doe (+91 9876543210)",
      assignedDate: "2024-01-15",
      dueDate: "2024-01-17 18:00",
      status: "assigned",
      priority: "high",
      attachments: ["photo1.jpg", "video1.mp4"],
      lastUpdate: "2024-01-15 14:30",
    },
    {
      id: "CMP-2024-005",
      type: "Street Lighting",
      description: "Street lights not working on Main Street for past week.",
      location: "Main Street, Near Park",
      ward: "Ward 3",
      submittedBy: "Jane Smith (+91 9876543211)",
      assignedDate: "2024-01-14",
      dueDate: "2024-01-18 18:00",
      status: "in-progress",
      priority: "medium",
      attachments: ["photo2.jpg"],
      lastUpdate: "2024-01-15 10:15",
    },
    {
      id: "CMP-2024-008",
      type: "Road Repair",
      description: "Large pothole causing traffic issues and vehicle damage.",
      location: "City Center Main Road",
      ward: "Ward 4",
      submittedBy: "Bob Johnson (+91 9876543212)",
      assignedDate: "2024-01-13",
      dueDate: "2024-01-19 18:00",
      status: "in-progress",
      priority: "critical",
      attachments: [],
      lastUpdate: "2024-01-14 16:45",
    },
  ];

  const metrics = {
    totalAssigned: assignedComplaints.length,
    newToday: 2,
    inProgress: assignedComplaints.filter((c) => c.status === "in-progress")
      .length,
    dueToday: 1,
    overdue: assignedComplaints.filter((c) => new Date(c.dueDate) < new Date())
      .length,
  };

  const slaComplaints = assignedComplaints
    .map((complaint) => {
      const dueDate = new Date(complaint.dueDate);
      const now = new Date();
      const hoursLeft = Math.round(
        (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60),
      );

      return {
        ...complaint,
        hoursLeft,
        slaStatus:
          hoursLeft < 0 ? "overdue" : hoursLeft < 24 ? "warning" : "ontime",
      };
    })
    .sort((a, b) => a.hoursLeft - b.hoursLeft);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getSlaStatusColor = (status: string) => {
    switch (status) {
      case "ontime":
        return "text-green-600";
      case "warning":
        return "text-yellow-600";
      case "overdue":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const handleStatusUpdate = () => {
    console.log("Updating status:", selectedComplaint?.id, "to:", newStatus);
    console.log("Remarks:", updateRemarks);
    console.log("Before photos:", beforePhotos);
    console.log("After photos:", afterPhotos);

    setActionType(null);
    setSelectedComplaint(null);
    setNewStatus("in-progress");
    setUpdateRemarks("");
    setBeforePhotos([]);
    setAfterPhotos([]);
  };

  const handleFileUpload = (
    files: FileList | null,
    type: "before" | "after",
  ) => {
    if (!files) return;
    const fileArray = Array.from(files);

    if (type === "before") {
      setBeforePhotos((prev) => [...prev, ...fileArray]);
    } else {
      setAfterPhotos((prev) => [...prev, ...fileArray]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Maintenance Dashboard</h1>
          <p className="text-muted-foreground">Water & Sanitation Department</p>
        </div>
        <Button>
          <Camera className="h-4 w-4 mr-2" />
          Quick Update
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Wrench className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Assigned</p>
                <p className="text-2xl font-bold">{metrics.totalAssigned}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">New Today</p>
                <p className="text-2xl font-bold">{metrics.newToday}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">{metrics.inProgress}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-muted-foreground">Due Today</p>
                <p className="text-2xl font-bold">{metrics.dueToday}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold">{metrics.overdue}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="assigned" className="space-y-4">
        <TabsList>
          <TabsTrigger value="assigned">Assigned Complaints</TabsTrigger>
          <TabsTrigger value="sla">SLA Tracking</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="assigned" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Assigned Complaints</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Complaint ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignedComplaints.map((complaint) => (
                    <TableRow key={complaint.id}>
                      <TableCell className="font-medium">
                        {complaint.id}
                      </TableCell>
                      <TableCell>{complaint.type}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {complaint.location}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {complaint.ward}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(complaint.priority)}>
                          {complaint.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <StatusChip status={complaint.status} />
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{complaint.dueDate}</div>
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
                                  setActionType("view");
                                }}
                              >
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>
                                  Complaint Details - {complaint.id}
                                </DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Type</Label>
                                    <p className="text-sm">{complaint.type}</p>
                                  </div>
                                  <div>
                                    <Label>Priority</Label>
                                    <Badge
                                      className={getPriorityColor(
                                        complaint.priority,
                                      )}
                                    >
                                      {complaint.priority}
                                    </Badge>
                                  </div>
                                </div>
                                <div>
                                  <Label>Description</Label>
                                  <p className="text-sm mt-1">
                                    {complaint.description}
                                  </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Location</Label>
                                    <p className="text-sm">
                                      {complaint.location}
                                    </p>
                                  </div>
                                  <div>
                                    <Label>Submitted By</Label>
                                    <p className="text-sm">
                                      {complaint.submittedBy}
                                    </p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Assigned Date</Label>
                                    <p className="text-sm">
                                      {complaint.assignedDate}
                                    </p>
                                  </div>
                                  <div>
                                    <Label>Due Date</Label>
                                    <p className="text-sm">
                                      {complaint.dueDate}
                                    </p>
                                  </div>
                                </div>
                                {complaint.attachments.length > 0 && (
                                  <div>
                                    <Label>Attachments</Label>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                      {complaint.attachments.map(
                                        (file, idx) => (
                                          <Badge key={idx} variant="secondary">
                                            {file}
                                          </Badge>
                                        ),
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedComplaint(complaint);
                                  setActionType("update");
                                  setNewStatus(complaint.status);
                                }}
                              >
                                Update
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>
                                  Update Status - {complaint.id}
                                </DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>New Status</Label>
                                  <Select
                                    value={newStatus}
                                    onValueChange={(value) =>
                                      setNewStatus(value as ComplaintStatus)
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="in-progress">
                                        In Progress
                                      </SelectItem>
                                      <SelectItem value="resolved">
                                        Resolved
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div>
                                  <Label htmlFor="updateRemarks">
                                    Update Remarks
                                  </Label>
                                  <Textarea
                                    id="updateRemarks"
                                    value={updateRemarks}
                                    onChange={(e) =>
                                      setUpdateRemarks(e.target.value)
                                    }
                                    placeholder="Describe the work done, materials used, etc..."
                                    rows={3}
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Before Photos</Label>
                                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                                      <Camera className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                      <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={(e) =>
                                          handleFileUpload(
                                            e.target.files,
                                            "before",
                                          )
                                        }
                                        className="hidden"
                                        id="before-upload"
                                      />
                                      <Label
                                        htmlFor="before-upload"
                                        className="cursor-pointer"
                                      >
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          asChild
                                        >
                                          <span>Upload Before Photos</span>
                                        </Button>
                                      </Label>
                                      {beforePhotos.length > 0 && (
                                        <p className="text-sm mt-2">
                                          {beforePhotos.length} file(s) selected
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  <div>
                                    <Label>After Photos</Label>
                                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                                      <Camera className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                      <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={(e) =>
                                          handleFileUpload(
                                            e.target.files,
                                            "after",
                                          )
                                        }
                                        className="hidden"
                                        id="after-upload"
                                      />
                                      <Label
                                        htmlFor="after-upload"
                                        className="cursor-pointer"
                                      >
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          asChild
                                        >
                                          <span>Upload After Photos</span>
                                        </Button>
                                      </Label>
                                      {afterPhotos.length > 0 && (
                                        <p className="text-sm mt-2">
                                          {afterPhotos.length} file(s) selected
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex justify-end space-x-2">
                                  <Button
                                    variant="outline"
                                    onClick={() => setActionType(null)}
                                  >
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
        </TabsContent>

        <TabsContent value="sla" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>SLA Tracking</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {slaComplaints.map((complaint) => (
                  <div
                    key={complaint.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-semibold">{complaint.id}</span>
                        <Badge className={getPriorityColor(complaint.priority)}>
                          {complaint.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{complaint.type}</p>
                      <p className="text-xs text-muted-foreground">
                        {complaint.location}
                      </p>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <StatusChip status={complaint.status} />
                      <span
                        className={`text-sm font-medium ${getSlaStatusColor(complaint.slaStatus)}`}
                      >
                        {complaint.hoursLeft >= 0
                          ? `${complaint.hoursLeft}h left`
                          : `${Math.abs(complaint.hoursLeft)}h overdue`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card>
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-12 w-12 mx-auto text-green-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Completed Complaints
              </h3>
              <p className="text-muted-foreground">
                View your completed work and performance metrics
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MaintenanceDashboard;
