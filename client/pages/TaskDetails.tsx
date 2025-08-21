import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  Camera,
  Navigation,
  CheckCircle,
  AlertTriangle,
  Phone,
  User,
  Wrench,
  FileText,
  Upload,
} from "lucide-react";

const TaskDetails: React.FC = () => {
  const { id } = useParams();
  const [workNote, setWorkNote] = useState("");
  const [completionNote, setCompletionNote] = useState("");

  // Mock task data
  const task = {
    id: id || "1",
    title: "Water Pipeline Repair",
    description:
      "Main water pipeline burst at MG Road junction affecting water supply to 200+ households in the area. Requires immediate attention and repair.",
    location: "MG Road, Near Metro Station",
    coordinates: "9.9312, 76.2673",
    priority: "HIGH",
    status: "IN_PROGRESS",
    estimatedTime: "4 hours",
    dueDate: "2024-01-15",
    assignedDate: "2024-01-14",
    submittedBy: "Ward Officer - Central Zone",
    contactPhone: "+91 9876543210",
    materials: ["PVC Pipes (6 inch)", "Pipe Joints", "Sealant", "Sand"],
    tools: ["Excavator", "Welding Equipment", "Safety Gear"],
    workLog: [
      {
        time: "09:00 AM",
        note: "Arrived at site, assessed damage",
        photo: false,
      },
      {
        time: "09:30 AM",
        note: "Started excavation work",
        photo: true,
      },
      {
        time: "11:00 AM",
        note: "Identified leak source, preparing for repair",
        photo: true,
      },
    ],
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-100 text-red-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      case "LOW":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ASSIGNED":
        return "bg-blue-100 text-blue-800";
      case "IN_PROGRESS":
        return "bg-orange-100 text-orange-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Link to="/maintenance">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Tasks
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              Task #{task.id}
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <Badge className={getStatusColor(task.status)}>
              {task.status.replace("_", " ")}
            </Badge>
            <Badge className={getPriorityColor(task.priority)}>
              {task.priority} Priority
            </Badge>
            <span className="text-sm text-gray-500">Due: {task.dueDate}</span>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Navigation className="h-4 w-4 mr-2" />
            Navigate
          </Button>
          <Button variant="outline">
            <Phone className="h-4 w-4 mr-2" />
            Call Contact
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Wrench className="h-5 w-5 mr-2" />
                Task Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Title</h3>
                <p className="text-gray-900">{task.title}</p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Description</h3>
                <p className="text-gray-600">{task.description}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2 flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    Location
                  </h3>
                  <p className="text-gray-600">{task.location}</p>
                  <p className="text-sm text-gray-500">{task.coordinates}</p>
                </div>
                <div>
                  <h3 className="font-medium mb-2 flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Timeline
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-600">
                      Assigned: {task.assignedDate}
                    </p>
                    <p className="text-gray-600">Due: {task.dueDate}</p>
                    <p className="text-gray-600">
                      Est. Time: {task.estimatedTime}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Work Log */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Work Progress Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {task.workLog.map((log, index) => (
                  <div
                    key={index}
                    className="border-l-4 border-blue-500 pl-4 py-2"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{log.time}</p>
                        <p className="text-sm text-gray-600">{log.note}</p>
                        {log.photo && (
                          <Badge variant="secondary" className="mt-1">
                            📷 Photo Attached
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New Log Entry */}
              <div className="mt-6 pt-4 border-t">
                <Label htmlFor="workNote">Add Work Update</Label>
                <div className="flex space-x-2 mt-2">
                  <Textarea
                    id="workNote"
                    value={workNote}
                    onChange={(e) => setWorkNote(e.target.value)}
                    placeholder="Describe current work status..."
                    className="flex-1"
                    rows={2}
                  />
                  <div className="flex flex-col space-y-2">
                    <Button size="sm">
                      <Camera className="h-4 w-4 mr-1" />
                      Photo
                    </Button>
                    <Button size="sm" variant="outline">
                      Add Log
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Completion Form */}
          {task.status === "IN_PROGRESS" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Mark Task Complete
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="completionNote">Completion Notes</Label>
                  <Textarea
                    id="completionNote"
                    value={completionNote}
                    onChange={(e) => setCompletionNote(e.target.value)}
                    placeholder="Describe the work completed, any issues resolved, and follow-up actions needed..."
                    rows={4}
                  />
                </div>
                <div className="flex space-x-2">
                  <Button>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Complete Task
                  </Button>
                  <Button variant="outline">
                    <Camera className="h-4 w-4 mr-2" />
                    Add Completion Photo
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium">Assigned By</p>
                <p className="text-gray-600">
                  {typeof task.submittedBy === "object" && task.submittedBy
                    ? task.submittedBy.fullName ||
                      task.submittedBy.name ||
                      "Unknown"
                    : task.submittedBy}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Contact Phone</p>
                <div className="flex items-center space-x-2">
                  <p className="text-gray-600">{task.contactPhone}</p>
                  <Button size="sm" variant="outline">
                    <Phone className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Required Materials */}
          <Card>
            <CardHeader>
              <CardTitle>Required Materials</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {task.materials.map((material, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm">{material}</span>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Required Tools */}
          <Card>
            <CardHeader>
              <CardTitle>Required Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {task.tools.map((tool, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm">{tool}</span>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Camera className="h-4 w-4 mr-2" />
                Take Photo
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Report Issue
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TaskDetails;
