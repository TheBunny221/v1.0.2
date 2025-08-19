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
import { toast } from "../components/ui/use-toast";
import {
  useGetMaintenanceTasksQuery,
  useGetMaintenanceStatsQuery,
  useUpdateTaskStatusMutation,
  type MaintenanceTask,
} from "../store/api/maintenanceApi";
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
  Loader2,
} from "lucide-react";

const MaintenanceTasks: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const { translations } = useAppSelector((state) => state.language);

  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [isMarkResolvedOpen, setIsMarkResolvedOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<MaintenanceTask | null>(null);
  const [resolveComment, setResolveComment] = useState("");
  const [resolvePhoto, setResolvePhoto] = useState<File | null>(null);

  // API hooks
  const {
    data: tasksResponse,
    isLoading: tasksLoading,
    error: tasksError,
    refetch: refetchTasks,
  } = useGetMaintenanceTasksQuery(
    {
      status: activeFilter === "all" ? undefined : (activeFilter as any),
      page: 1,
      limit: 50,
    },
    {
      refetchOnMountOrArgChange: true,
    }
  );

  const {
    data: statsResponse,
    isLoading: statsLoading,
    error: statsError,
  } = useGetMaintenanceStatsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  const [updateTaskStatus, { isLoading: isUpdating }] = useUpdateTaskStatusMutation();

  // Get data from API responses
  const tasks = tasksResponse?.data?.tasks || [];
  const taskStats = statsResponse?.data || {
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    reopened: 0,
    overdue: 0,
    critical: 0,
  };

  // Use API statistics
  const taskCounts = {
    total: taskStats.total,
    pending: taskStats.pending,
    overdue: taskStats.overdue,
    resolved: taskStats.resolved,
    reopened: taskStats.reopened,
    inProgress: taskStats.inProgress,
  };

  // Tasks are already filtered by the API based on activeFilter
  const filteredTasks = tasks;

  // Handle task status updates
  const handleStartWork = async (taskId: string) => {
    try {
      await updateTaskStatus({
        id: taskId,
        status: "IN_PROGRESS",
        comment: "Started working on the task",
      }).unwrap();

      toast({
        title: "Task Updated",
        description: "Task status updated to In Progress",
        variant: "default",
      });

      refetchTasks();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.data?.message || "Failed to update task status",
        variant: "destructive",
      });
    }
  };

  const handleMarkResolved = (task: MaintenanceTask) => {
    setSelectedTask(task);
    setIsMarkResolvedOpen(true);
  };

  const submitMarkResolved = async () => {
    if (!selectedTask || !resolveComment.trim()) {
      toast({
        title: "Error",
        description: "Please provide completion notes",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateTaskStatus({
        id: selectedTask.id,
        status: "RESOLVED",
        comment: resolveComment,
        resolvePhoto: resolvePhoto?.name,
      }).unwrap();

      toast({
        title: "Task Completed",
        description: "Task has been marked as resolved",
        variant: "default",
      });

      setIsMarkResolvedOpen(false);
      setResolveComment("");
      setResolvePhoto(null);
      setSelectedTask(null);
      refetchTasks();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.data?.message || "Failed to mark task as resolved",
        variant: "destructive",
      });
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
      case "CRITICAL":
        return "bg-red-500 text-white";
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

  // Handle filter changes
  const handleFilterChange = (newFilter: string) => {
    setActiveFilter(newFilter);
  };

  // Show loading state
  if (tasksLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading maintenance tasks...</span>
        </div>
      </div>
    );
  }

  // Show error state
  if (tasksError || statsError) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Error Loading Tasks</h2>
        <p className="text-gray-600 mb-4">
          {(tasksError as any)?.data?.message || "Failed to load maintenance tasks"}
        </p>
        <Button onClick={() => refetchTasks()}>Try Again</Button>
      </div>
    );
  }

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
          onClick={() => handleFilterChange("all")}
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
          onClick={() => handleFilterChange("pending")}
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
          onClick={() => handleFilterChange("overdue")}
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
          onClick={() => handleFilterChange("resolved")}
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
          onClick={() => handleFilterChange("reopened")}
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
                  disabled={!resolveComment.trim() || isUpdating}
                >
                  {isUpdating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  {isUpdating ? "Updating..." : "Mark Resolved"}
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
