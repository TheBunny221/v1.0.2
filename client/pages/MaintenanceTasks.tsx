import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import {
  useGetComplaintsQuery,
  useUpdateComplaintStatusMutation,
  useGetComplaintPhotosQuery,
  useLazyGetComplaintQuery,
} from "../store/api/complaintsApi";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../components/ui/dropdown-menu";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
const PhotoUploadModal = React.lazy(
  () => import("../components/PhotoUploadModal"),
);
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
  ChevronDown,
  ChevronUp,
  Image,
  FileText,
  User,
  BarChart3,
} from "lucide-react";

const MaintenanceTasks: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const { translations } = useAppSelector((state) => state.language);

  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [isMarkResolvedOpen, setIsMarkResolvedOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [resolveComment, setResolveComment] = useState("");
  const [resolvePhoto, setResolvePhoto] = useState<File | null>(null);
  const [isPhotoUploadOpen, setIsPhotoUploadOpen] = useState(false);
  const [selectedTaskForPhotos, setSelectedTaskForPhotos] = useState<any>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [navigatingId, setNavigatingId] = useState<string | null>(null);
  const [triggerGetComplaint] = useLazyGetComplaintQuery();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Fetch complaints assigned to this maintenance team member
  const {
    data: complaintsResponse,
    isLoading,
    error,
    refetch: refetchComplaints,
  } = useGetComplaintsQuery({
    maintenanceTeamId: user?.id,
    page: 1,
    limit: 100,
  });

  const [updateComplaintStatus] = useUpdateComplaintStatusMutation();

  // Helper function to get estimated time based on priority
  function getPriorityEstimatedTime(priority: string) {
    switch (priority) {
      case "CRITICAL":
        return "2-4 hours";
      case "HIGH":
        return "4-8 hours";
      case "MEDIUM":
        return "1-2 days";
      case "LOW":
        return "2-5 days";
      default:
        return "1-2 days";
    }
  }

  // Extract tasks from API response
  // Helper: normalize a complaint object into a task
  function mapComplaintToTask(complaint: any) {
    let lat: number | null = null;
    let lng: number | null = null;

    // Try parsing coordinates
    try {
      const coords =
        typeof complaint.coordinates === "string"
          ? JSON.parse(complaint.coordinates)
          : complaint.coordinates;

      lat = coords?.latitude ?? coords?.lat ?? complaint.latitude ?? null;
      lng = coords?.longitude ?? coords?.lng ?? complaint.longitude ?? null;
    } catch {
      lat = complaint.latitude ?? null;
      lng = complaint.longitude ?? null;
    }

    return {
      id: complaint.id,
      title: complaint.title || `${complaint.type} Issue`,
      location: complaint.area,
      address: [complaint.area, complaint.landmark, complaint.address]
        .filter(Boolean)
        .join(", "),
      priority: complaint.priority || "MEDIUM",
      status: complaint.status,
      estimatedTime: getPriorityEstimatedTime(complaint.priority),
      dueDate: complaint.deadline
        ? new Date(complaint.deadline).toISOString().split("T")[0]
        : null,
      isOverdue: complaint.deadline
        ? new Date(complaint.deadline) < new Date() &&
          !["RESOLVED", "CLOSED"].includes(complaint.status)
        : false,
      description: complaint.description,
      assignedAt: complaint.assignedOn || complaint.submittedOn,
      resolvedAt: complaint.resolvedOn,
      photo: complaint.attachments?.[0]?.url || null,
      latitude: lat,
      longitude: lng,
      complaintId: complaint.complaintId,
      statusLogs: complaint.statusLogs || [],
    };
  }

  const tasks = useMemo(() => {
    const data =
      complaintsResponse?.data?.complaints ??
      (Array.isArray(complaintsResponse?.data) ? complaintsResponse.data : []);

    return Array.isArray(data) ? data.map(mapComplaintToTask) : [];
  }, [complaintsResponse]);

  // Calculate task counts with mutually exclusive buckets
  const taskCounts = {
    total: tasks.length,
    // Pending excludes overdue
    pending: tasks.filter((t) => t.status === "ASSIGNED" && !t.isOverdue)
      .length,
    // Overdue includes any active task past deadline (not RESOLVED/CLOSED)
    overdue: tasks.filter((t) => t.isOverdue).length,
    // Active (non-overdue) categories
    inProgress: tasks.filter((t) => t.status === "IN_PROGRESS" && !t.isOverdue)
      .length,
    reopened: tasks.filter((t) => t.status === "REOPENED" && !t.isOverdue)
      .length,
    // Completed categories
    resolved: tasks.filter((t) => t.status === "RESOLVED").length,
    closed: tasks.filter((t) => t.status === "CLOSED").length,
    // Additional counts for Ward-style filters
    registered: tasks.filter((t) => t.status === "REGISTERED").length,
    assigned: tasks.filter((t) => t.status === "ASSIGNED").length,
  };

  const showStatCards = false;

  // Filter tasks based on active filter
  const filteredTasks = tasks.filter((task) => {
    switch (activeFilter) {
      case "pending":
        return task.status === "ASSIGNED" && !task.isOverdue;
      case "overdue":
        return task.isOverdue;
      case "resolved":
        return task.status === "RESOLVED";
      case "closed":
        return task.status === "CLOSED";
      case "reopened":
        return task.status === "REOPENED" && !task.isOverdue;
      case "inProgress":
        return task.status === "IN_PROGRESS" && !task.isOverdue;
      case "registered":
        return task.status === "REGISTERED";
      case "assigned":
        return task.status === "ASSIGNED";
      case "total":
      case "all":
        return true;
      default:
        return true;
    }
  });

  // Handle task status updates
  const handleStartWork = async (taskId: string) => {
    try {
      await updateComplaintStatus({
        id: taskId,
        status: "IN_PROGRESS",
      }).unwrap();
      refetchComplaints();
    } catch (error) {
      console.error("Failed to start work:", error);
      // You might want to show a toast notification here
    }
  };

  const handleMarkResolved = (task: any) => {
    setSelectedTask(task);
    setIsMarkResolvedOpen(true);
  };

  const submitMarkResolved = async () => {
    if (selectedTask) {
      try {
        await updateComplaintStatus({
          id: selectedTask.id,
          status: "RESOLVED",
          remarks: resolveComment,
        }).unwrap();

        // TODO: Handle photo upload when the photo upload modal is implemented
        if (resolvePhoto) {
          console.log("Photo upload would happen here:", resolvePhoto.name);
        }

        setIsMarkResolvedOpen(false);
        setResolveComment("");
        setResolvePhoto(null);
        setSelectedTask(null);
        refetchComplaints();
      } catch (error) {
        console.error("Failed to mark as resolved:", error);
        // You might want to show a toast notification here
      }
    }
  };

  // Handle navigation
  const handleNavigate = async (task: any) => {
    try {
      console.log("Navigating to task:", task.coordinates);
      setNavigatingId(task.id);
      let lat = task.latitude;
      let lng = task.longitude;

      if ((!lat || !lng) && task.id) {
        const res = await triggerGetComplaint(task.id).unwrap();
        const c = res?.data || res;
        const comp = c?.complaint || c;
        lat = comp?.latitude ?? comp?.lat ?? lat;
        lng = comp?.longitude ?? comp?.lng ?? lng;
      }

      if (lat && lng) {
        const latNum = Number(lat);
        const lngNum = Number(lng);
        if (!Number.isNaN(latNum) && !Number.isNaN(lngNum)) {
          const url = `https://www.google.com/maps/search/?api=1&query=${latNum},${lngNum}`;
          window.open(url, "_blank", "noopener,noreferrer");
          return;
        }
      }

      const encoded = encodeURIComponent(task.address || task.location || "");
      const fallbackUrl = `https://www.google.com/maps/search/?api=1&query=${encoded}`;
      window.open(fallbackUrl, "_blank", "noopener,noreferrer");
    } catch (e) {
      const encoded = encodeURIComponent(task.address || task.location || "");
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encoded}`,
        "_blank",
        "noopener,noreferrer",
      );
    } finally {
      setNavigatingId(null);
    }
  };

  // Handle photo view
  const handleViewPhoto = (photoUrl: string) => {
    window.open(photoUrl, "_blank");
  };

  // Handle photo upload
  const handlePhotoUpload = (task: any) => {
    setSelectedTaskForPhotos(task);
    setIsPhotoUploadOpen(true);
  };

  // Toggle task expansion
  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTaskId(expandedTaskId === taskId ? null : taskId);
  };

  // Work Progress Component
  const TaskProgressSection: React.FC<{ task: any }> = ({ task }) => {
    const {
      data: photosResponse,
      isLoading: isLoadingPhotos,
      error: photosError,
    } = useGetComplaintPhotosQuery(task.id);

    const photos = photosResponse?.data?.photos || [];
    const statusLogs = task.statusLogs || [];

    // Combine photos and status logs into a timeline
    const timelineItems = useMemo(() => {
      const items = [];

      // Add status logs
      statusLogs.forEach((log: any) => {
        items.push({
          type: "status",
          timestamp: log.timestamp || log.createdAt,
          content: log,
        });
      });

      // Add photos
      photos.forEach((photo: any) => {
        items.push({
          type: "photo",
          timestamp: photo.uploadedAt,
          content: photo,
        });
      });

      // Sort by timestamp (newest first)
      return items.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
    }, [statusLogs, photos]);

    if (isLoadingPhotos) {
      return (
        <div className="border-t bg-gray-50 p-4">
          <div className="animate-pulse motion-reduce:animate-none">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      );
    }

    return (
      <div className="border-t bg-gray-50 p-4">
        <div className="flex items-center mb-3">
          <FileText className="h-4 w-4 mr-2 text-gray-600" />
          <h4 className="font-medium text-gray-800">Work Progress & Updates</h4>
        </div>

        {timelineItems.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <Camera className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">No updates or photos yet</p>
            <p className="text-xs">
              Upload photos and add progress notes as you work
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {timelineItems.map((item, index) => (
              <div key={index} className="border-l-2 border-blue-200 pl-4 pb-3">
                <div className="flex items-start space-x-3">
                  <div className="bg-white rounded-full p-1 border shadow-sm">
                    {item.type === "photo" ? (
                      <Image className="h-3 w-3 text-blue-600" />
                    ) : (
                      <User className="h-3 w-3 text-green-600" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-gray-500">
                        {new Date(item.timestamp).toLocaleString()}
                      </p>
                      {item.type === "photo" && (
                        <Badge variant="outline" className="text-xs">
                          Photo
                        </Badge>
                      )}
                    </div>

                    {item.type === "photo" ? (
                      <div className="space-y-2">
                        <div className="flex items-start space-x-3">
                          <img
                            src={item.content.photoUrl}
                            alt="Work progress photo"
                            className="w-16 h-16 object-cover rounded-lg border cursor-pointer hover:opacity-75 transition-opacity"
                            onClick={() =>
                              handleViewPhoto(item.content.photoUrl)
                            }
                          />
                          <div className="flex-1">
                            <p className="text-sm text-gray-600 mb-1">
                              Uploaded by{" "}
                              {item.content.uploadedByTeam?.fullName ||
                                "Team Member"}
                            </p>
                            {item.content.description && (
                              <p className="text-sm text-gray-800 bg-white rounded p-2 border">
                                {item.content.description}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              {item.content.originalName} •{" "}
                              {(item.content.size / 1024 / 1024).toFixed(1)}MB
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Badge
                            className={getStatusColor(item.content.toStatus)}
                            variant="secondary"
                          >
                            {item.content.toStatus?.replace("_", " ")}
                          </Badge>
                          {item.content.fromStatus && (
                            <span className="text-xs text-gray-500">
                              from {item.content.fromStatus.replace("_", " ")}
                            </span>
                          )}
                        </div>
                        {item.content.comment && (
                          <p className="text-sm text-gray-700 bg-white rounded p-2 border">
                            {item.content.comment}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          by {item.content.user?.fullName || "System"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {photosError && (
          <div className="text-center py-2 text-red-500 text-sm">
            Failed to load photos
          </div>
        )}
      </div>
    );
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
      case "CLOSED":
        return "bg-gray-200 text-gray-800";
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
      case "CLOSED":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse motion-reduce:animate-none">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 mx-auto text-red-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Error Loading Tasks
          </h2>
          <p className="text-gray-600 mb-4">
            Failed to load your maintenance tasks. Please try again.
          </p>
          <Button onClick={() => refetchComplaints()}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header 
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Maintenance Tasks
          </h1>
          <p className="text-gray-600">Manage your assigned maintenance work</p>
        </div>
      </div>*/}

      {/* Welcome Hero */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">Maintenance Dashboard</h2>
            <p className="text-blue-100">
              Welcome back! Here's your current workload.
            </p>
          </div>
          <div className="text-right">
            <Card
              className={`inline-flex items-center p-1 rounded-xl cursor-pointer transition-all ${activeFilter === "all" ? "ring-2 ring-primary bg-primary/10 scale-105" : "bg-white/10 hover:bg-white/20"}`}
              onClick={() => setActiveFilter("all")}
            >
              <CardHeader className="flex items-center p-2 py-1 justify-between space-x-3">
                <div>
                  <CardTitle className="text-sm font-medium text-white/90 flex items-center gap-2">
                    <ListTodo className="h-4 w-4 text-white/90" />
                    All
                  </CardTitle>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-extrabold text-white">
                    {taskCounts.total}
                  </div>
                  <div className="text-xs text-white/80">Total Tasks</div>
                </div>
              </CardHeader>
            </Card>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-11 md:h-9 rounded-full px-4 border border-blue-200/40 bg-white text-blue-700 hover:bg-blue-50"
            onClick={() => refetchComplaints()}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Total card + StatusOverviewGrid (reuse WardOfficer components for consistent UI) */}
      <div className="mt-4">
        <div className="hidden md:flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Filter by Status</h2>
          {activeFilter !== "all" && (
            <Button
              variant="outline"
              size="sm"
              className="h-11 md:h-9"
              onClick={() => setActiveFilter("all")}
            >
              Clear Filter
            </Button>
          )}
        </div>

        {/* Modern status grid (All, Pending, Overdue, In Progress, Resolved, Reopened, Closed) */}
        <div className="md:hidden sticky top-16 z-10 bg-gray-50/80 backdrop-blur border-b rounded-b-lg">
          <div className="p-2">
            <Button
              variant="outline"
              className="w-full h-11 justify-center"
              aria-expanded={mobileFiltersOpen}
              aria-controls="mobile-filters"
              onClick={() => setMobileFiltersOpen((o) => !o)}
            >
              Filter
            </Button>
          </div>
        </div>
        <div
          className={[
            "mt-3",
            mobileFiltersOpen ? "" : "hidden",
            "md:block",
          ].join(" ")}
          id="mobile-filters"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-4">
            {[
              // {
              //   id: "all",
              //   label: "All",
              //   subtitle: "All tasks",
              //   icon: ListTodo,
              //   value: taskCounts.total,
              //   style: {
              //     ring: "ring-blue-500",
              //     text: "text-blue-700",
              //     textSoft: "text-blue-600",
              //     bgSoft: "bg-blue-50",
              //     chipRing: "ring-blue-200",
              //   },
              // },
              {
                id: "pending",
                label: "Pending",
                subtitle: "Assigned tasks",
                icon: Clock,
                value: taskCounts.pending,
                style: {
                  ring: "ring-indigo-500",
                  text: "text-indigo-700",
                  textSoft: "text-indigo-600",
                  bgSoft: "bg-indigo-50",
                  chipRing: "ring-indigo-200",
                },
              },
              {
                id: "overdue",
                label: "Overdue",
                subtitle: "Past deadline",
                icon: AlertCircle,
                value: taskCounts.overdue,
                style: {
                  ring: "ring-red-500",
                  text: "text-red-700",
                  textSoft: "text-red-600",
                  bgSoft: "bg-red-50",
                  chipRing: "ring-red-200",
                },
              },
              {
                id: "inProgress",
                label: "In Progress",
                subtitle: "Active work",
                icon: Play,
                value: taskCounts.inProgress,
                style: {
                  ring: "ring-orange-500",
                  text: "text-orange-700",
                  textSoft: "text-orange-600",
                  bgSoft: "bg-orange-50",
                  chipRing: "ring-orange-200",
                },
              },
              {
                id: "resolved",
                label: "Resolved",
                subtitle: "Resolved tasks",
                icon: CheckCircle,
                value: taskCounts.resolved,
                style: {
                  ring: "ring-emerald-500",
                  text: "text-emerald-700",
                  textSoft: "text-emerald-600",
                  bgSoft: "bg-emerald-50",
                  chipRing: "ring-emerald-200",
                },
              },
              {
                id: "reopened",
                label: "Reopened",
                subtitle: "Reopened tasks",
                icon: RotateCcw,
                value: taskCounts.reopened,
                style: {
                  ring: "ring-violet-500",
                  text: "text-violet-700",
                  textSoft: "text-violet-600",
                  bgSoft: "bg-violet-50",
                  chipRing: "ring-violet-200",
                },
              },
              {
                id: "closed",
                label: "Closed",
                subtitle: "Closed tasks",
                icon: FileText,
                value: taskCounts.closed,
                style: {
                  ring: "ring-slate-500",
                  text: "text-slate-700",
                  textSoft: "text-slate-600",
                  bgSoft: "bg-slate-50",
                  chipRing: "ring-slate-200",
                },
              },
            ].map((m) => {
              const active =
                activeFilter === m.id ||
                (m.id === "all" && activeFilter === "total");
              const Icon = m.icon as any;
              return (
                <Card
                  key={m.id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={active}
                  aria-label={`${m.label}, ${m.value}`}
                  onClick={() => setActiveFilter(active ? "all" : m.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setActiveFilter(active ? "all" : m.id);
                    }
                  }}
                  className={[
                    "group relative cursor-pointer select-none rounded-2xl border bg-white shadow-sm transition-all",
                    "hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                    active
                      ? `ring-2 ${m.style.ring} ${m.style.bgSoft} border-transparent`
                      : "hover:border-neutral-200",
                  ].join(" ")}
                >
                  <CardHeader className="flex flex-col items-center justify-center p-3 pb-1">
                    <div
                      className={[
                        "mb-2 grid h-10 w-10 place-items-center rounded-full ring-1 ring-inset",
                        active
                          ? `${m.style.bgSoft} ${m.style.textSoft} ${m.style.chipRing}`
                          : "bg-neutral-50 text-neutral-600 ring-neutral-200",
                      ].join(" ")}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-sm font-semibold text-neutral-800">
                      {m.label}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="flex flex-col items-center p-2 pt-0">
                    <div
                      className={[
                        "text-2xl font-bold leading-none tracking-tight",
                        active ? m.style.text : "text-neutral-900",
                      ].join(" ")}
                    >
                      {m.value}
                    </div>
                    <p className="mt-1 text-xs text-neutral-500">
                      {m.subtitle}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {showStatCards && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card
            className={`cursor-pointer transition-colors ${activeFilter === "all" ? "ring-2 ring-primary" : "hover:bg-gray-50"}`}
            onClick={() => setActiveFilter("all")}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Tasks
                  </p>
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
            className={`cursor-pointer transition-colors ${activeFilter === "inProgress" ? "ring-2 ring-primary" : "hover:bg-gray-50"}`}
            onClick={() => setActiveFilter("inProgress")}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    In Progress
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    {taskCounts.inProgress}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
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

          <Card
            className={`cursor-pointer transition-colors ${activeFilter === "closed" ? "ring-2 ring-primary" : "hover:bg-gray-50"}`}
            onClick={() => setActiveFilter("closed")}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Closed</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {taskCounts.closed}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
          {filteredTasks.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                {activeFilter === "overdue" ? (
                  <AlertCircle className="h-6 w-6 text-red-500" />
                ) : activeFilter === "pending" ? (
                  <Clock className="h-6 w-6 text-blue-500" />
                ) : activeFilter === "inProgress" ? (
                  <Clock className="h-6 w-6 text-orange-500" />
                ) : activeFilter === "resolved" ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : activeFilter === "reopened" ? (
                  <RotateCcw className="h-6 w-6 text-purple-500" />
                ) : activeFilter === "closed" ? (
                  <CheckCircle className="h-6 w-6 text-gray-500" />
                ) : (
                  <ListTodo className="h-6 w-6 text-blue-500" />
                )}
              </div>
              <p className="font-medium">
                {activeFilter === "overdue"
                  ? "No overdue tasks"
                  : activeFilter === "pending"
                    ? "No pending tasks"
                    : activeFilter === "inProgress"
                      ? "No in-progress tasks"
                      : activeFilter === "resolved"
                        ? "No resolved tasks"
                        : activeFilter === "reopened"
                          ? "No reopened tasks"
                          : activeFilter === "closed"
                            ? "No closed tasks"
                            : "No tasks to show"}
              </p>
              <p className="text-sm mt-1">Try a different filter or refresh.</p>
            </div>
          ) : (
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

                  <div className="flex flex-col md:flex-row md:justify-between gap-3 items-stretch md:items-center">
                    <div className="flex flex-wrap gap-2 w-full md:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-11 md:h-9"
                        onClick={() => handleNavigate(task)}
                        disabled={navigatingId === task.id}
                      >
                        <Navigation
                          className={`h-3 w-3 mr-1 ${navigatingId === task.id ? "animate-pulse" : ""}`}
                        />
                        {navigatingId === task.id ? "Opening..." : "Navigate"}
                      </Button>
                      {task.photo ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-11 md:h-9"
                            >
                              <Camera className="h-3 w-3 mr-1" />
                              Photos
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem
                              onClick={() => handleViewPhoto(task.photo)}
                            >
                              View Existing Photo
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handlePhotoUpload(task)}
                            >
                              Upload New Photos
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-11 md:h-9"
                          onClick={() => handlePhotoUpload(task)}
                        >
                          <Camera className="h-3 w-3 mr-1" />
                          Add Photos
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-11 md:h-9"
                        onClick={() => toggleTaskExpansion(task.id)}
                      >
                        {expandedTaskId === task.id ? (
                          <ChevronUp className="h-3 w-3 mr-1" />
                        ) : (
                          <ChevronDown className="h-3 w-3 mr-1" />
                        )}
                        Progress
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 w-full md:w-auto md:justify-end">
                      {task.status === "ASSIGNED" && (
                        <Button
                          size="sm"
                          className="h-11 md:h-9"
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
                          className="h-11 md:h-9"
                          onClick={() => handleMarkResolved(task)}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Mark as Resolved
                        </Button>
                      )}
                      <Link to={`/tasks/${task.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-11 md:h-9"
                        >
                          Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                  {/* Work Progress Section */}
                  {expandedTaskId === task.id && (
                    <TaskProgressSection task={task} />
                  )}
                </div>
              ))}
            </div>
          )}
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

      {/* Photo Upload Modal */}
      {selectedTaskForPhotos && (
        <React.Suspense
          fallback={
            <div className="fixed inset-0 z-50 grid place-items-center bg-black/10">
              <div className="rounded-md bg-white px-4 py-2 text-sm shadow">
                Loading…
              </div>
            </div>
          }
        >
          <PhotoUploadModal
            isOpen={isPhotoUploadOpen}
            onClose={() => {
              setIsPhotoUploadOpen(false);
              setSelectedTaskForPhotos(null);
            }}
            complaintId={selectedTaskForPhotos.id}
            onSuccess={() => {
              refetchComplaints();
              setExpandedTaskId(selectedTaskForPhotos.id);
            }}
          />
        </React.Suspense>
      )}
    </div>
  );
};

export default MaintenanceTasks;
