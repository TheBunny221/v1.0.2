import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { showSuccessToast, showErrorToast } from "../store/slices/uiSlice";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { Checkbox } from "../components/ui/checkbox";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
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
  Settings,
  MapPin,
  FileText,
  Users,
  Clock,
  Mail,
  Database,
  Plus,
  Edit,
  Trash2,
  Save,
  RefreshCw,
  Globe,
  Shield,
  AlertTriangle,
} from "lucide-react";

interface Ward {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  subZones: SubZone[];
  _count?: {
    users: number;
    complaints: number;
  };
}

interface SubZone {
  id: string;
  name: string;
  wardId: string;
  description: string;
  isActive: boolean;
}

interface ComplaintType {
  id: string;
  name: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  slaHours: number;
  isActive: boolean;
}

interface SystemSetting {
  key: string;
  value: string;
  description: string;
  type: "string" | "number" | "boolean" | "json";
}

const AdminConfig: React.FC = () => {
  const dispatch = useAppDispatch();
  const { translations } = useAppSelector((state) => state.language);
  const { user } = useAppSelector((state) => state.auth);

  // State management
  const [wards, setWards] = useState<Ward[]>([]);
  const [complaintTypes, setComplaintTypes] = useState<ComplaintType[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSetting[]>([]);
  const [editingWard, setEditingWard] = useState<Ward | null>(null);
  const [editingComplaintType, setEditingComplaintType] = useState<ComplaintType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [isWardDialogOpen, setIsWardDialogOpen] = useState(false);
  const [isComplaintTypeDialogOpen, setIsComplaintTypeDialogOpen] = useState(false);
  const [isSettingDialogOpen, setIsSettingDialogOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState<SystemSetting | null>(null);

  // API calls
  const apiCall = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem("token");

    console.log(`[AdminConfig] Making API call to: ${url}`);

    const response = await fetch(`/api${url}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    // Check if response is JSON
    const contentType = response.headers.get("content-type");
    const isJson = contentType && contentType.includes("application/json");

    console.log(`[AdminConfig] Response for ${url}:`, {
      status: response.status,
      statusText: response.statusText,
      contentType,
      isJson
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;

      if (isJson) {
        try {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
          console.log(`[AdminConfig] Error response for ${url}:`, error);
        } catch {
          // Failed to parse JSON error response
          console.log(`[AdminConfig] Failed to parse JSON error response for ${url}`);
        }
      } else {
        // Non-JSON response (likely HTML error page)
        const text = await response.text();
        console.log(`[AdminConfig] Non-JSON error response for ${url}:`, text.substring(0, 200));
        if (text.includes("<!doctype") || text.includes("<html")) {
          errorMessage = "Server returned an error page. Please check your authentication and try again.";
        } else {
          errorMessage = text.substring(0, 100) || errorMessage;
        }
      }

      throw new Error(errorMessage);
    }

    if (!isJson) {
      const text = await response.text();
      console.log(`[AdminConfig] Non-JSON success response for ${url}:`, text.substring(0, 200));
      throw new Error("Server returned non-JSON response. Expected JSON data.");
    }

    const data = await response.json();
    console.log(`[AdminConfig] Success response for ${url}:`, {
      success: data?.success,
      dataLength: Array.isArray(data?.data) ? data.data.length : typeof data?.data
    });

    return data;
  };

  // Load data on component mount
  useEffect(() => {
    // Check if user is authenticated and has admin role
    if (!user) {
      dispatch(
        showErrorToast("Authentication Required", "Please log in to access this page.")
      );
      setDataLoading(false);
      return;
    }

    if (user.role !== "ADMINISTRATOR") {
      dispatch(
        showErrorToast("Access Denied", "Administrator privileges required to access this page.")
      );
      setDataLoading(false);
      return;
    }

    loadAllData();
  }, [user]);

  const loadAllData = async () => {
    setDataLoading(true);

    try {
      // Load wards (public endpoint)
      let wardsResponse;
      try {
        wardsResponse = await apiCall("/wards");
        setWards(wardsResponse.data || []);
      } catch (error: any) {
        console.error("Failed to load wards:", error);
        setWards([]);
      }

      // Load complaint types (public endpoint)
      let typesResponse;
      try {
        typesResponse = await apiCall("/complaint-types");
        setComplaintTypes(typesResponse.data || []);
      } catch (error: any) {
        console.error("Failed to load complaint types:", error);
        setComplaintTypes([]);
      }

      // Load system settings (admin-only endpoint)
      let settingsResponse;
      try {
        settingsResponse = await apiCall("/system-config");
        setSystemSettings(settingsResponse.data || []);
      } catch (error: any) {
        console.error("Failed to load system settings:", error);
        if (error.message.includes("Not authorized") || error.message.includes("Authentication")) {
          // This is expected for non-admin users, don't show error
          setSystemSettings([]);
        } else {
          // Unexpected error, show it
          dispatch(
            showErrorToast("Settings Load Failed", `Failed to load system settings: ${error.message}`)
          );
          setSystemSettings([]);
        }
      }

    } catch (error: any) {
      console.error("Unexpected error during data loading:", error);
      dispatch(
        showErrorToast("Load Failed", "An unexpected error occurred while loading data.")
      );
    } finally {
      setDataLoading(false);
    }
  };

  // Ward Management Functions
  const handleSaveWard = async (ward: Ward) => {
    setIsLoading(true);
    try {
      const wardData = {
        name: ward.name,
        description: ward.description,
        isActive: ward.isActive,
      };

      let response;
      if (ward.id && ward.id !== "") {
        // Update existing ward
        response = await apiCall(`/wards/${ward.id}`, {
          method: "PUT",
          body: JSON.stringify(wardData),
        });
        setWards((prev) =>
          prev.map((w) => (w.id === ward.id ? { ...ward, ...response.data } : w))
        );
      } else {
        // Create new ward
        response = await apiCall("/wards", {
          method: "POST",
          body: JSON.stringify(wardData),
        });
        setWards((prev) => [...prev, response.data]);
      }

      setEditingWard(null);
      setIsWardDialogOpen(false);
      dispatch(
        showSuccessToast(
          "Ward Saved",
          `Ward "${ward.name}" has been saved successfully.`
        )
      );
    } catch (error: any) {
      dispatch(
        showErrorToast("Save Failed", error.message || "Failed to save ward. Please try again.")
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteWard = async (wardId: string) => {
    if (!confirm("Are you sure you want to delete this ward?")) return;

    setIsLoading(true);
    try {
      await apiCall(`/wards/${wardId}`, { method: "DELETE" });
      setWards((prev) => prev.filter((w) => w.id !== wardId));

      dispatch(
        showSuccessToast("Ward Deleted", "Ward has been deleted successfully.")
      );
    } catch (error: any) {
      dispatch(
        showErrorToast(
          "Delete Failed",
          error.message || "Failed to delete ward. Please try again."
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Complaint Type Management Functions
  const handleSaveComplaintType = async (type: ComplaintType) => {
    setIsLoading(true);
    try {
      const typeData = {
        name: type.name,
        description: type.description,
        priority: type.priority,
        slaHours: type.slaHours,
        isActive: type.isActive,
      };

      let response;
      if (type.id && type.id !== "") {
        // Update existing type
        response = await apiCall(`/complaint-types/${type.id}`, {
          method: "PUT",
          body: JSON.stringify(typeData),
        });
        setComplaintTypes((prev) =>
          prev.map((t) => (t.id === type.id ? { ...type, ...response.data } : t))
        );
      } else {
        // Create new type
        response = await apiCall("/complaint-types", {
          method: "POST",
          body: JSON.stringify(typeData),
        });
        setComplaintTypes((prev) => [...prev, response.data]);
      }

      setEditingComplaintType(null);
      setIsComplaintTypeDialogOpen(false);
      dispatch(
        showSuccessToast(
          "Complaint Type Saved",
          `Complaint type "${type.name}" has been saved successfully.`
        )
      );
    } catch (error: any) {
      dispatch(
        showErrorToast(
          "Save Failed",
          error.message || "Failed to save complaint type. Please try again."
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteComplaintType = async (typeId: string) => {
    if (!confirm("Are you sure you want to delete this complaint type?"))
      return;

    setIsLoading(true);
    try {
      await apiCall(`/complaint-types/${typeId}`, { method: "DELETE" });
      setComplaintTypes((prev) => prev.filter((t) => t.id !== typeId));

      dispatch(
        showSuccessToast(
          "Complaint Type Deleted",
          "Complaint type has been deleted successfully."
        )
      );
    } catch (error: any) {
      dispatch(
        showErrorToast(
          "Delete Failed",
          error.message || "Failed to delete complaint type. Please try again."
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  // System Settings Functions
  const handleUpdateSystemSetting = async (key: string, value: string) => {
    setIsLoading(true);
    try {
      const response = await apiCall(`/system-config/${key}`, {
        method: "PUT",
        body: JSON.stringify({ value }),
      });

      setSystemSettings((prev) =>
        prev.map((s) => (s.key === key ? { ...s, value } : s))
      );

      dispatch(
        showSuccessToast(
          "Setting Updated",
          `System setting "${key}" has been updated.`
        )
      );
    } catch (error: any) {
      dispatch(
        showErrorToast(
          "Update Failed",
          error.message || "Failed to update system setting. Please try again."
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSystemSetting = async (setting: SystemSetting) => {
    setIsLoading(true);
    try {
      const settingData = {
        key: setting.key,
        value: setting.value,
        description: setting.description,
        type: setting.type,
      };

      let response;
      const existingSetting = systemSettings.find(s => s.key === setting.key);

      if (existingSetting) {
        // Update existing setting
        response = await apiCall(`/system-config/${setting.key}`, {
          method: "PUT",
          body: JSON.stringify({ value: setting.value, description: setting.description }),
        });
        setSystemSettings((prev) =>
          prev.map((s) => (s.key === setting.key ? { ...setting, ...response.data } : s))
        );
      } else {
        // Create new setting
        response = await apiCall("/system-config", {
          method: "POST",
          body: JSON.stringify(settingData),
        });
        setSystemSettings((prev) => [...prev, response.data]);
      }

      setEditingSetting(null);
      setIsSettingDialogOpen(false);
      dispatch(
        showSuccessToast(
          "Setting Saved",
          `System setting "${setting.key}" has been saved successfully.`
        )
      );
    } catch (error: any) {
      dispatch(
        showErrorToast(
          "Save Failed",
          error.message || "Failed to save system setting. Please try again."
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSystemSetting = async (key: string) => {
    if (!confirm("Are you sure you want to delete this system setting?"))
      return;

    setIsLoading(true);
    try {
      await apiCall(`/system-config/${key}`, { method: "DELETE" });
      setSystemSettings((prev) => prev.filter((s) => s.key !== key));

      dispatch(
        showSuccessToast(
          "Setting Deleted",
          "System setting has been deleted successfully."
        )
      );
    } catch (error: any) {
      dispatch(
        showErrorToast(
          "Delete Failed",
          error.message || "Failed to delete system setting. Please try again."
        )
      );
    } finally {
      setIsLoading(false);
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

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
          <p className="text-gray-600">Please log in to access the system configuration.</p>
        </div>
      </div>
    );
  }

  if (user.role !== "ADMINISTRATOR") {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-gray-600">Administrator privileges required to access this page.</p>
        </div>
      </div>
    );
  }

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading configuration data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">System Configuration</h1>
        <p className="text-gray-300">
          Manage wards, complaint types, system settings, and administrative
          controls
        </p>
      </div>

      {/* Configuration Tabs */}
      <Tabs defaultValue="wards" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="wards">Wards & Zones</TabsTrigger>
          <TabsTrigger value="types">Complaint Types</TabsTrigger>
          <TabsTrigger value="settings">System Settings</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        {/* Ward Management */}
        <TabsContent value="wards" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Ward Management
                </CardTitle>
                <Dialog open={isWardDialogOpen} onOpenChange={setIsWardDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => {
                        setEditingWard({
                          id: "",
                          name: "",
                          description: "",
                          isActive: true,
                          subZones: [],
                        });
                        setIsWardDialogOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Ward
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        {editingWard?.id ? "Edit Ward" : "Add New Ward"}
                      </DialogTitle>
                    </DialogHeader>
                    {editingWard && (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="wardName">Ward Name</Label>
                          <Input
                            id="wardName"
                            value={editingWard.name}
                            onChange={(e) =>
                              setEditingWard({
                                ...editingWard,
                                name: e.target.value,
                              })
                            }
                            placeholder="Enter ward name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="wardDescription">Description</Label>
                          <Textarea
                            id="wardDescription"
                            value={editingWard.description}
                            onChange={(e) =>
                              setEditingWard({
                                ...editingWard,
                                description: e.target.value,
                              })
                            }
                            placeholder="Enter ward description"
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => setEditingWard(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => handleSaveWard(editingWard)}
                            disabled={isLoading || !editingWard.name}
                          >
                            {isLoading ? (
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4 mr-2" />
                            )}
                            Save
                          </Button>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ward Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Sub-Zones</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {wards.map((ward) => (
                    <TableRow key={ward.id}>
                      <TableCell className="font-medium">{ward.name}</TableCell>
                      <TableCell>{ward.description}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {ward.subZones?.length || 0} zones
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            ward.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }
                        >
                          {ward.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingWard(ward)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>Edit Ward</DialogTitle>
                              </DialogHeader>
                              {editingWard && editingWard.id === ward.id && (
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="editWardName">Ward Name</Label>
                                    <Input
                                      id="editWardName"
                                      value={editingWard.name}
                                      onChange={(e) =>
                                        setEditingWard({
                                          ...editingWard,
                                          name: e.target.value,
                                        })
                                      }
                                      placeholder="Enter ward name"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="editWardDescription">Description</Label>
                                    <Textarea
                                      id="editWardDescription"
                                      value={editingWard.description}
                                      onChange={(e) =>
                                        setEditingWard({
                                          ...editingWard,
                                          description: e.target.value,
                                        })
                                      }
                                      placeholder="Enter ward description"
                                    />
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="editWardActive"
                                      checked={editingWard.isActive}
                                      onCheckedChange={(checked) =>
                                        setEditingWard({
                                          ...editingWard,
                                          isActive: !!checked,
                                        })
                                      }
                                    />
                                    <Label htmlFor="editWardActive">Active</Label>
                                  </div>
                                  <div className="flex justify-end space-x-2">
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        setEditingWard(null);
                                        setIsWardDialogOpen(false);
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      onClick={() => handleSaveWard(editingWard)}
                                      disabled={isLoading || !editingWard.name}
                                    >
                                      {isLoading ? (
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                      ) : (
                                        <Save className="h-4 w-4 mr-2" />
                                      )}
                                      Save
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteWard(ward.id)}
                            disabled={isLoading}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Complaint Types Management */}
        <TabsContent value="types" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Complaint Type Management
                </CardTitle>
                <Dialog open={isComplaintTypeDialogOpen} onOpenChange={setIsComplaintTypeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => {
                        setEditingComplaintType({
                          id: "",
                          name: "",
                          description: "",
                          priority: "MEDIUM",
                          slaHours: 48,
                          isActive: true,
                        });
                        setIsComplaintTypeDialogOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Type
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        {editingComplaintType?.id
                          ? "Edit Complaint Type"
                          : "Add New Complaint Type"}
                      </DialogTitle>
                    </DialogHeader>
                    {editingComplaintType && (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="typeName">Type Name</Label>
                          <Input
                            id="typeName"
                            value={editingComplaintType.name}
                            onChange={(e) =>
                              setEditingComplaintType({
                                ...editingComplaintType,
                                name: e.target.value,
                              })
                            }
                            placeholder="Enter complaint type name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="typeDescription">Description</Label>
                          <Textarea
                            id="typeDescription"
                            value={editingComplaintType.description}
                            onChange={(e) =>
                              setEditingComplaintType({
                                ...editingComplaintType,
                                description: e.target.value,
                              })
                            }
                            placeholder="Enter type description"
                          />
                        </div>
                        <div>
                          <Label htmlFor="priority">Priority</Label>
                          <Select
                            value={editingComplaintType.priority}
                            onValueChange={(
                              value: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
                            ) =>
                              setEditingComplaintType({
                                ...editingComplaintType,
                                priority: value,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="LOW">Low</SelectItem>
                              <SelectItem value="MEDIUM">Medium</SelectItem>
                              <SelectItem value="HIGH">High</SelectItem>
                              <SelectItem value="CRITICAL">Critical</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="slaHours">SLA Hours</Label>
                          <Input
                            id="slaHours"
                            type="number"
                            value={editingComplaintType.slaHours}
                            onChange={(e) =>
                              setEditingComplaintType({
                                ...editingComplaintType,
                                slaHours: parseInt(e.target.value),
                              })
                            }
                            placeholder="Enter SLA hours"
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => setEditingComplaintType(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() =>
                              handleSaveComplaintType(editingComplaintType)
                            }
                            disabled={isLoading || !editingComplaintType.name}
                          >
                            {isLoading ? (
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4 mr-2" />
                            )}
                            Save
                          </Button>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>SLA (Hours)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {complaintTypes.map((type) => (
                    <TableRow key={type.id}>
                      <TableCell className="font-medium">{type.name}</TableCell>
                      <TableCell>{type.description}</TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(type.priority)}>
                          {type.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>{type.slaHours}h</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            type.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }
                        >
                          {type.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingComplaintType(type)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>Edit Complaint Type</DialogTitle>
                              </DialogHeader>
                              {editingComplaintType && editingComplaintType.id === type.id && (
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="editTypeName">Type Name</Label>
                                    <Input
                                      id="editTypeName"
                                      value={editingComplaintType.name}
                                      onChange={(e) =>
                                        setEditingComplaintType({
                                          ...editingComplaintType,
                                          name: e.target.value,
                                        })
                                      }
                                      placeholder="Enter complaint type name"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="editTypeDescription">Description</Label>
                                    <Textarea
                                      id="editTypeDescription"
                                      value={editingComplaintType.description}
                                      onChange={(e) =>
                                        setEditingComplaintType({
                                          ...editingComplaintType,
                                          description: e.target.value,
                                        })
                                      }
                                      placeholder="Enter type description"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="editPriority">Priority</Label>
                                    <Select
                                      value={editingComplaintType.priority}
                                      onValueChange={(value: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") =>
                                        setEditingComplaintType({
                                          ...editingComplaintType,
                                          priority: value,
                                        })
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="LOW">Low</SelectItem>
                                        <SelectItem value="MEDIUM">Medium</SelectItem>
                                        <SelectItem value="HIGH">High</SelectItem>
                                        <SelectItem value="CRITICAL">Critical</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label htmlFor="editSlaHours">SLA Hours</Label>
                                    <Input
                                      id="editSlaHours"
                                      type="number"
                                      value={editingComplaintType.slaHours}
                                      onChange={(e) =>
                                        setEditingComplaintType({
                                          ...editingComplaintType,
                                          slaHours: parseInt(e.target.value),
                                        })
                                      }
                                      placeholder="Enter SLA hours"
                                    />
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="editTypeActive"
                                      checked={editingComplaintType.isActive}
                                      onCheckedChange={(checked) =>
                                        setEditingComplaintType({
                                          ...editingComplaintType,
                                          isActive: !!checked,
                                        })
                                      }
                                    />
                                    <Label htmlFor="editTypeActive">Active</Label>
                                  </div>
                                  <div className="flex justify-end space-x-2">
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        setEditingComplaintType(null);
                                        setIsComplaintTypeDialogOpen(false);
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      onClick={() => handleSaveComplaintType(editingComplaintType)}
                                      disabled={isLoading || !editingComplaintType.name}
                                    >
                                      {isLoading ? (
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                      ) : (
                                        <Save className="h-4 w-4 mr-2" />
                                      )}
                                      Save
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteComplaintType(type.id)}
                            disabled={isLoading}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  System Settings
                </CardTitle>
                <Dialog open={isSettingDialogOpen} onOpenChange={setIsSettingDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => {
                        setEditingSetting({
                          key: "",
                          value: "",
                          description: "",
                          type: "string",
                        });
                        setIsSettingDialogOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Setting
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        {editingSetting?.key && systemSettings.find(s => s.key === editingSetting.key) ? "Edit System Setting" : "Add New System Setting"}
                      </DialogTitle>
                    </DialogHeader>
                    {editingSetting && (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="settingKey">Setting Key</Label>
                          <Input
                            id="settingKey"
                            value={editingSetting.key}
                            onChange={(e) =>
                              setEditingSetting({
                                ...editingSetting,
                                key: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_'),
                              })
                            }
                            placeholder="SETTING_KEY"
                            disabled={!!systemSettings.find(s => s.key === editingSetting.key)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="settingValue">Value</Label>
                          <Input
                            id="settingValue"
                            value={editingSetting.value}
                            onChange={(e) =>
                              setEditingSetting({
                                ...editingSetting,
                                value: e.target.value,
                              })
                            }
                            placeholder="Setting value"
                          />
                        </div>
                        <div>
                          <Label htmlFor="settingDescription">Description</Label>
                          <Textarea
                            id="settingDescription"
                            value={editingSetting.description}
                            onChange={(e) =>
                              setEditingSetting({
                                ...editingSetting,
                                description: e.target.value,
                              })
                            }
                            placeholder="Setting description"
                          />
                        </div>
                        <div>
                          <Label htmlFor="settingType">Type</Label>
                          <Select
                            value={editingSetting.type}
                            onValueChange={(value: "string" | "number" | "boolean" | "json") =>
                              setEditingSetting({
                                ...editingSetting,
                                type: value,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="string">String</SelectItem>
                              <SelectItem value="number">Number</SelectItem>
                              <SelectItem value="boolean">Boolean</SelectItem>
                              <SelectItem value="json">JSON</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setEditingSetting(null);
                              setIsSettingDialogOpen(false);
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => handleSaveSystemSetting(editingSetting)}
                            disabled={isLoading || !editingSetting.key || !editingSetting.value}
                          >
                            {isLoading ? (
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4 mr-2" />
                            )}
                            Save
                          </Button>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {systemSettings.map((setting) => (
                  <div key={setting.key} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium">{setting.key}</h3>
                        <p className="text-sm text-gray-600">
                          {setting.description}
                        </p>
                      </div>
                      <Badge variant="secondary">{setting.type}</Badge>
                    </div>
                    <div className="mt-3">
                      {setting.type === "boolean" ? (
                        <Select
                          value={setting.value}
                          onValueChange={(value) =>
                            handleUpdateSystemSetting(setting.key, value)
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">True</SelectItem>
                            <SelectItem value="false">False</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : setting.type === "json" ? (
                        <Textarea
                          value={setting.value}
                          onChange={(e) =>
                            handleUpdateSystemSetting(
                              setting.key,
                              e.target.value
                            )
                          }
                          placeholder="Enter JSON value"
                          rows={3}
                        />
                      ) : (
                        <Input
                          type={setting.type === "number" ? "number" : "text"}
                          value={setting.value}
                          onChange={(e) =>
                            handleUpdateSystemSetting(
                              setting.key,
                              e.target.value
                            )
                          }
                          placeholder={`Enter ${setting.type} value`}
                          className="max-w-md"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Settings */}
        <TabsContent value="advanced" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  Database Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Backup Database
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Database className="h-4 w-4 mr-2" />
                  Restore Database
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Optimize Tables
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Password Policies
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Clock className="h-4 w-4 mr-2" />
                  Session Management
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Security Logs
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="h-5 w-5 mr-2" />
                  Email Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  SMTP Settings
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Email Templates
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Test Email Service
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="h-5 w-5 mr-2" />
                  Localization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Globe className="h-4 w-4 mr-2" />
                  Manage Languages
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Translation Keys
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Translations
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminConfig;
