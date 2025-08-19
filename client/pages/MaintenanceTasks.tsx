import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import {
  Wrench,
  Calendar,
  MapPin,
  Clock,
  Camera,
  Navigation,
  CheckCircle,
  AlertTriangle,
  Play,
  Plus,
  RotateCcw,
  ListTodo,
  AlertCircle,
  Upload,
} from "lucide-react";

const MaintenanceTasks: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const { translations } = useAppSelector((state) => state.language);

  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [isMarkResolvedOpen, setIsMarkResolvedOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [resolveComment, setResolveComment] = useState("");
  const [resolvePhoto, setResolvePhoto] = useState<File | null>(null);

  // Sample task data - in real app this would come from API
  const [tasks, setTasks] = useState([
    {
      id: "1",
      title: "Water Pipeline Repair",
      location: "MG Road, Near Metro Station",
      address: "MG Road, Near Metro Station, Kochi, Kerala 682001",
      priority: "HIGH",
      status: "ASSIGNED",
      estimatedTime: "4 hours",
      dueDate: "2024-01-15",
      isOverdue: false,
      description:
        "Main water pipeline burst, affecting supply to 200+ households",
      assignedAt: "2024-01-14T10:00:00Z",
      photo: "/api/attachments/complaint-1-photo.jpg",
    },
    {
      id: "2",
      title: "Street Light Installation",
      location: "Marine Drive, Walkway Section",
      address: "Marine Drive, Walkway Section, Fort Kochi, Kerala 682001",
      priority: "MEDIUM",
      status: "IN_PROGRESS",
      estimatedTime: "2 hours",
      dueDate: "2024-01-16",
      isOverdue: false,
      description: "Install 5 new LED street lights along the walkway",
      assignedAt: "2024-01-13T09:00:00Z",
      photo: "/api/attachments/complaint-2-photo.jpg",
    },
    {
      id: "3",
      title: "Road Pothole Filling",
      location: "Broadway Junction",
      address: "Broadway Junction, Ernakulam, Kerala 682011",
      priority: "LOW",
      status: "RESOLVED",
      estimatedTime: "3 hours",
      dueDate: "2024-01-10",
      isOverdue: false,
      description: "Fill multiple potholes affecting traffic flow",
      assignedAt: "2024-01-08T08:00:00Z",
      resolvedAt: "2024-01-10T15:30:00Z",
      photo: "/api/attachments/complaint-3-photo.jpg",
    },
    {
      id: "4",
      title: "Garbage Collection Issue",
      location: "Kadavanthra Bus Stop",
      address: "Kadavanthra Bus Stop, Kochi, Kerala 682020",
      priority: "HIGH",
      status: "ASSIGNED",
      estimatedTime: "1 hour",
      dueDate: "2024-01-12",
      isOverdue: true,
      description: "Garbage collection missed for 3 days",
      assignedAt: "2024-01-10T07:00:00Z",
      photo: "/api/attachments/complaint-4-photo.jpg",
    },
    {
      id: "5",
      title: "Sewer Blockage Clearance",
      location: "Panampilly Nagar",
      address: "Panampilly Nagar, Kochi, Kerala 682036",
      priority: "CRITICAL",
      status: "REOPENED",
      estimatedTime: "6 hours",
      dueDate: "2024-01-17",
      isOverdue: false,
      description: "Sewer blockage causing overflow in residential area",
      assignedAt: "2024-01-15T11:00:00Z",
      photo: "/api/attachments/complaint-5-photo.jpg",
    },
  ]);

  // Calculate task counts
  const taskCounts = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === "ASSIGNED").length,
    overdue: tasks.filter((t) => t.isOverdue).length,
    resolved: tasks.filter((t) => t.status === "RESOLVED").length,
    reopened: tasks.filter((t) => t.status === "REOPENED").length,
    inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
  };

  // Filter tasks based on active filter
  const filteredTasks = tasks.filter((task) => {
    switch (activeFilter) {
      case "pending":
        return task.status === "ASSIGNED";
      case "overdue":
        return task.isOverdue;
      case "resolved":
        return task.status === "RESOLVED";
      case "reopened":
        return task.status === "REOPENED";
      case "inProgress":
        return task.status === "IN_PROGRESS";
      default:
        return true;
    }
  });

  // Handle task status updates
  const handleStartWork = (taskId: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, status: "IN_PROGRESS" } : task,
      ),
    );
  };

  const handleMarkResolved = (task: any) => {
    setSelectedTask(task);
    setIsMarkResolvedOpen(true);
  };

  const submitMarkResolved = () => {
    if (selectedTask) {
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === selectedTask.id
            ? {
                ...task,
                status: "RESOLVED",
                resolvedAt: new Date().toISOString(),
                resolveComment,
                resolvePhoto: resolvePhoto?.name,
              }
            : task,
        ),
      );
      setIsMarkResolvedOpen(false);
      setResolveComment("");
      setResolvePhoto(null);
      setSelectedTask(null);
    }
  };

  // Handle navigation
  const handleNavigate = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://maps.google.com/?q=${encodedAddress}`, "_blank");
  };

  // Handle photo view
  const handleViewPhoto = (photoUrl: string) => {
    window.open(photoUrl, "_blank");
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
      case "RESOLVED":
        return "bg-green-100 text-green-800";
      case "REOPENED":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ASSIGNED":
        return <Clock className="h-4 w-4" />;
      case "IN_PROGRESS":
        return <AlertTriangle className="h-4 w-4" />;
      case "RESOLVED":
        return <CheckCircle className="h-4 w-4" />;
      case "REOPENED":
        return <RotateCcw className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Maintenance Tasks
          </h1>
          <p className="text-gray-600">Manage your assigned maintenance work</p>
        </div>
      </div>

      {/* Task Count Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card
          className={`cursor-pointer transition-colors ${activeFilter === "all" ? "ring-2 ring-primary" : "hover:bg-gray-50"}`}
          onClick={() => setActiveFilter("all")}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                <p className="text-2xl font-bold text-blue-600">
                  {taskCounts.total}
                </p>
              </div>
              <ListTodo className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-colors ${activeFilter === "pending" ? "ring-2 ring-primary" : "hover:bg-gray-50"}`}
          onClick={() => setActiveFilter("pending")}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Pending Tasks
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {taskCounts.pending}
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-colors ${activeFilter === "overdue" ? "ring-2 ring-primary" : "hover:bg-gray-50"}`}
          onClick={() => setActiveFilter("overdue")}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Overdue Tasks
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {taskCounts.overdue}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-colors ${activeFilter === "resolved" ? "ring-2 ring-primary" : "hover:bg-gray-50"}`}
          onClick={() => setActiveFilter("resolved")}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Resolved Tasks
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {taskCounts.resolved}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-colors ${activeFilter === "reopened" ? "ring-2 ring-primary" : "hover:bg-gray-50"}`}
          onClick={() => setActiveFilter("reopened")}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Reopened Tasks
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  {taskCounts.reopened}
                </p>
              </div>
              <RotateCcw className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtered Tasks */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Wrench className="h-5 w-5 mr-2" />
              My Tasks{" "}
              {activeFilter !== "all" &&
                `(${activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)})`}
            </CardTitle>
            <Badge variant="secondary">{filteredTasks.length} tasks</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className="border rounded-lg p-4 hover:bg-gray-50"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-medium text-lg">{task.title}</h3>
                    <p className="text-gray-600 text-sm mt-1">
                      {task.description}
                    </p>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                    <Badge className={getStatusColor(task.status)}>
                      <span className="flex items-center">
                        {getStatusIcon(task.status)}
                        <span className="ml-1">
                          {task.status.replace("_", " ")}
                        </span>
                      </span>
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{task.location}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>Est. {task.estimatedTime}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>Due: {task.dueDate}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleNavigate(task.address)}
                    >
                      <Navigation className="h-3 w-3 mr-1" />
                      Navigate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewPhoto(task.photo)}
                    >
                      <Camera className="h-3 w-3 mr-1" />
                      Photo
                    </Button>
                  </div>
                  <div className="flex space-x-2">
                    {task.status === "ASSIGNED" && (
                      <Button
                        size="sm"
                        onClick={() => handleStartWork(task.id)}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Start Work
                      </Button>
                    )}
                    {(task.status === "IN_PROGRESS" ||
                      task.status === "REOPENED") && (
                      <Button
                        size="sm"
                        onClick={() => handleMarkResolved(task)}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Mark as Resolved
                      </Button>
                    )}
                    <Link to={`/tasks/${task.id}`}>
                      <Button variant="outline" size="sm">
                        Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Mark as Resolved Dialog */}
      <Dialog open={isMarkResolvedOpen} onOpenChange={setIsMarkResolvedOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mark Task as Resolved</DialogTitle>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">{selectedTask.title}</h4>
                <p className="text-sm text-gray-600">{selectedTask.location}</p>
              </div>

              <div>
                <Label htmlFor="resolveComment">Completion Notes</Label>
                <Textarea
                  id="resolveComment"
                  value={resolveComment}
                  onChange={(e) => setResolveComment(e.target.value)}
                  placeholder="Add notes about the work completed..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="resolvePhoto">Upload Completion Photo</Label>
                <Input
                  id="resolvePhoto"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setResolvePhoto(e.target.files?.[0] || null)}
                />
                {resolvePhoto && (
                  <p className="text-sm text-green-600 mt-1">
                    Photo selected: {resolvePhoto.name}
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsMarkResolvedOpen(false);
                    setResolveComment("");
                    setResolvePhoto(null);
                    setSelectedTask(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={submitMarkResolved}
                  disabled={!resolveComment.trim()}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Resolved
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MaintenanceTasks;
