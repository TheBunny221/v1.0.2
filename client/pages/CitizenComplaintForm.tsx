import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { useComplaintTypes } from "../hooks/useComplaintTypes";
import { selectAuth } from "../store/slices/authSlice";
import { useToast } from "../hooks/use-toast";
import {
  useUploadComplaintAttachmentMutation,
  useCreateComplaintMutation,
} from "../store/api/complaintsApi";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
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
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Alert, AlertDescription } from "../components/ui/alert";
import {
  FileText,
  MapPin,
  User,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Loader2,
  Camera,
  Upload,
  X,
  Eye,
  Info,
  UserCheck,
  Image,
} from "lucide-react";

interface CitizenComplaintData {
  // Step 1: Details (auto-filled from citizen profile)
  fullName: string;
  email: string;
  phoneNumber: string;
  type: string;
  description: string;
  priority: string;
  slaHours?: number; // Auto-assigned internally

  // Step 2: Location
  wardId: string;
  subZoneId?: string;
  area: string;
  landmark?: string;
  address?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };

  // Step 3: Attachments
  attachments?: any[];
}

const PRIORITIES = [
  {
    value: "LOW",
    label: "Low",
    color: "bg-gray-500",
    description: "Non-urgent issues",
  },
  {
    value: "MEDIUM",
    label: "Medium",
    color: "bg-blue-500",
    description: "Standard issues requiring attention",
  },
  {
    value: "HIGH",
    label: "High",
    color: "bg-orange-500",
    description: "Important issues affecting daily life",
  },
  {
    value: "CRITICAL",
    label: "Critical",
    color: "bg-red-500",
    description: "Emergency situations requiring immediate attention",
  },
];

const WARDS = [
  {
    id: "ward-1",
    name: "Fort Kochi",
    subZones: ["Marine Drive", "Parade Ground", "Princess Street"],
  },
  {
    id: "ward-2",
    name: "Mattancherry",
    subZones: ["Jew Town", "Dutch Palace", "Spice Market"],
  },
  {
    id: "ward-3",
    name: "Ernakulam South",
    subZones: ["MG Road", "Broadway", "Shanmugham Road"],
  },
  {
    id: "ward-4",
    name: "Ernakulam North",
    subZones: ["Kadavanthra", "Panampilly Nagar", "Kaloor"],
  },
  {
    id: "ward-5",
    name: "Kadavanthra",
    subZones: ["NH Bypass", "Rajaji Road", "Pipeline Road"],
  },
  {
    id: "ward-6",
    name: "Thevara",
    subZones: ["Thevara Ferry", "Pipeline", "NGO Quarters"],
  },
];

const CitizenComplaintForm: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAppSelector(selectAuth);
  const { complaintTypeOptions, isLoading: complaintTypesLoading } =
    useComplaintTypes();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // Initialize form data with citizen profile information
  const [formData, setFormData] = useState<CitizenComplaintData>({
    fullName: user?.fullName || "",
    email: user?.email || "",
    phoneNumber: user?.phoneNumber || "",
    type: "",
    description: "",
    priority: "MEDIUM",
    slaHours: 48,
    wardId: user?.wardId || "",
    area: "",
    landmark: "",
    address: "",
    coordinates: undefined,
    attachments: [],
  });

  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [fileUploadErrors, setFileUploadErrors] = useState<string[]>([]);

  // API mutation hooks
  const [createComplaint] = useCreateComplaintMutation();
  const [uploadAttachment] = useUploadComplaintAttachmentMutation();

  const steps = [
    { id: 1, title: "Details", icon: FileText, isCompleted: false },
    { id: 2, title: "Location", icon: MapPin, isCompleted: false },
    { id: 3, title: "Attachments", icon: Camera, isCompleted: false },
    { id: 4, title: "Review", icon: CheckCircle, isCompleted: false },
  ];

  const progress = ((currentStep - 1) / (steps.length - 1)) * 100;

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate("/login");
      return;
    }

    // Auto-fill form with user data
    setFormData((prev) => ({
      ...prev,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber || "",
      wardId: user.wardId || "",
    }));
  }, [isAuthenticated, user, navigate]);

  // Get current location
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentLocation(coords);
          setFormData((prev) => ({
            ...prev,
            coordinates: {
              latitude: coords.lat,
              longitude: coords.lng,
            },
          }));
        },
        (error) => {
          console.log("Location access denied or unavailable");
        },
      );
    }
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => {
      const updatedData = { ...prev, [name]: value };

      // Auto-assign priority and SLA hours when complaint type changes
      if (name === "type") {
        const selectedType = complaintTypeOptions.find(
          (type) => type.value === value,
        );
        if (selectedType) {
          updatedData.priority = selectedType.priority || "MEDIUM";
          updatedData.slaHours = selectedType.slaHours || 48;
        }
      }

      return updatedData;
    });
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.type) errors.type = "Complaint type is required";
        if (!formData.description.trim())
          errors.description = "Description is required";
        else if (formData.description.trim().length < 10) {
          errors.description = "Description must be at least 10 characters";
        }
        break;
      case 2:
        if (!formData.wardId) errors.wardId = "Ward selection is required";
        if (!formData.area.trim()) errors.area = "Area/locality is required";
        if (
          availableSubZones &&
          availableSubZones.length > 0 &&
          !formData.subZoneId
        ) {
          errors.subZoneId = "Sub-zone is required";
        }
        if (!formData.landmark || !formData.landmark.trim()) {
          errors.landmark = "Landmark is required";
        }
        if (!formData.address || !formData.address.trim()) {
          errors.address = "Full address is required";
        }
        if (
          !formData.coordinates ||
          formData.coordinates.latitude == null ||
          formData.coordinates.longitude == null
        ) {
          errors.coordinates = "Location (GPS coordinates) is required";
        }
        break;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(2)) return;

    setIsSubmitting(true);
    try {
      // Create complaint
      const complaintData = {
        title: `${formData.type} complaint`,
        description: formData.description,
        // Send both during transition; backend prefers complaintTypeId
        complaintTypeId: formData.type,
        type: formData.type,
        priority: formData.priority,
        slaHours: formData.slaHours,
        wardId: formData.wardId,
        subZoneId: formData.subZoneId,
        area: formData.area,
        landmark: formData.landmark,
        address: formData.address,
        coordinates: formData.coordinates,
        contactName: formData.fullName,
        contactEmail: formData.email,
        contactPhone: formData.phoneNumber,
        isAnonymous: false,
      };

      const complaintResponse = await createComplaint(complaintData).unwrap();
      const complaint = complaintResponse.data.complaint;
      const complaintId = complaint.id;
      const displayId =
        complaint.complaintId || complaintId.slice(-6).toUpperCase();

      // Upload attachments if any
      if (formData.attachments && formData.attachments.length > 0) {
        setUploadingFiles(true);
        for (const file of formData.attachments) {
          try {
            await uploadAttachment({ complaintId, file }).unwrap();
          } catch (uploadError) {
            console.error("Failed to upload file:", file.name, uploadError);
            // Don't fail the entire submission for file upload errors
          }
        }
        setUploadingFiles(false);
      }

      toast({
        title: "Complaint Submitted Successfully!",
        description: `Your complaint has been registered with ID: ${displayId}. You will receive updates via email and in-app notifications.`,
      });

      navigate("/complaints");
    } catch (error: any) {
      console.error("Submission error:", error);
      toast({
        title: "Submission Failed",
        description:
          error?.data?.message ||
          "There was an error submitting your complaint. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setUploadingFiles(false);
    }
  };

  // File upload handlers
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Validate file count
    const currentFileCount = formData.attachments?.length || 0;
    if (currentFileCount + files.length > 5) {
      toast({
        title: "Too many files",
        description: "You can upload a maximum of 5 files",
        variant: "destructive",
      });
      return;
    }

    const validFiles = [];
    const errors = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        errors.push(`${file.name}: File size too large (max 10MB)`);
        continue;
      }

      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
      ];
      if (!allowedTypes.includes(file.type)) {
        errors.push(`${file.name}: Invalid file type (only images allowed)`);
        continue;
      }

      validFiles.push(file);
    }

    if (errors.length > 0) {
      setFileUploadErrors(errors);
      toast({
        title: "File validation errors",
        description: `${errors.length} file(s) were rejected`,
        variant: "destructive",
      });
    }

    if (validFiles.length > 0) {
      setFormData((prev) => ({
        ...prev,
        attachments: [...(prev.attachments || []), ...validFiles],
      }));
      setFileUploadErrors([]);
    }

    // Clear the input
    event.target.value = "";
  };

  const removeFile = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments?.filter((_, i) => i !== index) || [],
    }));
  };

  const selectedComplaintType = complaintTypeOptions.find(
    (c) => c.value === formData.type,
  );
  const selectedWard = WARDS.find((w) => w.id === formData.wardId);
  const availableSubZones = selectedWard?.subZones || [];

  if (!isAuthenticated || !user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">
            Submit a Complaint
          </h1>
          <p className="text-gray-600">
            As a registered citizen, your information is pre-filled for faster
            submission
          </p>
        </div>

        {/* Citizen Info Alert */}
        <Alert className="border-blue-200 bg-blue-50">
          <UserCheck className="h-4 w-4" />
          <AlertDescription className="text-blue-800">
            <strong>Logged in as:</strong> {user.fullName} ({user.email})
            <br />
            Your personal information is automatically filled and cannot be
            changed here. To update your profile, visit the{" "}
            <button
              onClick={() => navigate("/profile")}
              className="underline hover:no-underline"
            >
              Profile Settings
            </button>
            .
          </AlertDescription>
        </Alert>

        {/* Progress Indicator */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Progress</h3>
                <span className="text-sm text-gray-500">
                  Step {currentStep} of {steps.length}
                </span>
              </div>
              <Progress value={progress} className="w-full" />

              {/* Step indicators */}
              <div className="flex justify-between">
                {steps.map((step) => {
                  const StepIcon = step.icon;
                  return (
                    <div
                      key={step.id}
                      className={`flex flex-col items-center space-y-2 p-2 rounded-lg transition-colors ${
                        step.id === currentStep
                          ? "bg-blue-100 text-blue-800"
                          : step.id < currentStep
                            ? "bg-green-100 text-green-800"
                            : "text-gray-400"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          step.id === currentStep
                            ? "bg-blue-600 text-white"
                            : step.id < currentStep
                              ? "bg-green-600 text-white"
                              : "bg-gray-300 text-gray-600"
                        }`}
                      >
                        {step.id < currentStep ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <StepIcon className="h-4 w-4" />
                        )}
                      </div>
                      <span className="text-xs font-medium">{step.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {React.createElement(steps[currentStep - 1].icon, {
                className: "h-5 w-5",
              })}
              {steps[currentStep - 1].title}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && "Describe your complaint and set priority"}
              {currentStep === 2 && "Specify the exact location of the issue"}
              {currentStep === 3 && "Add supporting images (optional)"}
              {currentStep === 4 && "Review and submit your complaint"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Details */}
            {currentStep === 1 && (
              <div className="space-y-6">
                {/* Pre-filled Personal Information (Read-only) */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700">
                    Personal Information (Auto-filled)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input
                        value={formData.fullName}
                        readOnly
                        className="bg-gray-100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email Address</Label>
                      <Input
                        value={formData.email}
                        readOnly
                        className="bg-gray-100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone Number</Label>
                      <Input
                        value={formData.phoneNumber}
                        readOnly
                        className="bg-gray-100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Citizen ID</Label>
                      <Input
                        value={user.id.slice(-8).toUpperCase()}
                        readOnly
                        className="bg-gray-100 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Complaint Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Complaint Details</h3>

                  <div className="space-y-2">
                    <Label>Complaint Type *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) =>
                        handleSelectChange("type", value)
                      }
                    >
                      <SelectTrigger
                        className={
                          validationErrors.type ? "border-red-500" : ""
                        }
                      >
                        <SelectValue placeholder="Select complaint type" />
                      </SelectTrigger>
                      <SelectContent>
                        {complaintTypesLoading ? (
                          <SelectItem value="loading" disabled>
                            Loading complaint types...
                          </SelectItem>
                        ) : complaintTypeOptions.length > 0 ? (
                          complaintTypeOptions.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    {type.label}
                                  </span>
                                  {type.priority && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {type.priority}
                                    </Badge>
                                  )}
                                </div>
                                {type.description && (
                                  <span className="text-xs text-gray-500">
                                    {type.description}
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>
                            No complaint types available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {validationErrors.type && (
                      <p className="text-sm text-red-600">
                        {validationErrors.type}
                      </p>
                    )}
                  </div>

                  {selectedComplaintType && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">
                        {selectedComplaintType.label}
                      </h4>
                      <p className="text-sm text-blue-700 mb-2">
                        {selectedComplaintType.description}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div className="flex items-center gap-2">
                          <Info className="h-4 w-4 text-blue-600" />
                          <span className="text-sm text-blue-600">
                            Priority: {selectedComplaintType.priority}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Info className="h-4 w-4 text-blue-600" />
                          <span className="text-sm text-blue-600">
                            SLA: {selectedComplaintType.slaHours}h
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Priority is now auto-assigned and hidden from user */}
                  {selectedComplaintType && (
                    <div className="bg-gray-50 p-4 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-800 mb-1">
                            Auto-assigned Details
                          </h4>
                          <p className="text-sm text-gray-600">
                            Based on your complaint type, the following have
                            been automatically set:
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              PRIORITIES.find(
                                (p) => p.value === formData.priority,
                              )?.color || "bg-gray-500"
                            }`}
                          />
                          <span className="text-sm font-medium">
                            Priority:{" "}
                            {PRIORITIES.find(
                              (p) => p.value === formData.priority,
                            )?.label || formData.priority}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Info className="h-4 w-4 text-gray-600" />
                          <span className="text-sm font-medium">
                            SLA: {formData.slaHours} hours
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Describe the issue in detail... (What happened? When? Where exactly?)"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      className={
                        validationErrors.description ? "border-red-500" : ""
                      }
                    />
                    {validationErrors.description && (
                      <p className="text-sm text-red-600">
                        {validationErrors.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      Be specific about the problem, when it started, and how it
                      affects you.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Location */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Location Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Ward *</Label>
                      <Select
                        value={formData.wardId}
                        onValueChange={(value) =>
                          handleSelectChange("wardId", value)
                        }
                      >
                        <SelectTrigger
                          className={
                            validationErrors.wardId ? "border-red-500" : ""
                          }
                        >
                          <SelectValue placeholder="Select ward" />
                        </SelectTrigger>
                        <SelectContent>
                          {WARDS.map((ward) => (
                            <SelectItem key={ward.id} value={ward.id}>
                              {ward.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {validationErrors.wardId && (
                        <p className="text-sm text-red-600">
                          {validationErrors.wardId}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Sub-Zone *</Label>
                      <Select
                        value={formData.subZoneId}
                        onValueChange={(value) =>
                          handleSelectChange("subZoneId", value)
                        }
                        disabled={!formData.wardId}
                      >
                        <SelectTrigger
                          className={
                            validationErrors.subZoneId ? "border-red-500" : ""
                          }
                        >
                          <SelectValue placeholder="Select sub-zone" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableSubZones.map((subZone, index) => (
                            <SelectItem key={index} value={subZone}>
                              {subZone}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {validationErrors.subZoneId && (
                        <p className="text-sm text-red-600">
                          {validationErrors.subZoneId}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="area">Area/Locality *</Label>
                    <Input
                      id="area"
                      name="area"
                      placeholder="Enter specific area or locality (e.g., Near Metro Station, Main Road)"
                      value={formData.area}
                      onChange={handleInputChange}
                      className={validationErrors.area ? "border-red-500" : ""}
                    />
                    {validationErrors.area && (
                      <p className="text-sm text-red-600">
                        {validationErrors.area}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="landmark">Landmark *</Label>
                      <Input
                        id="landmark"
                        name="landmark"
                        placeholder="Nearby landmark (e.g., Next to Bank, Opposite School)"
                        value={formData.landmark}
                        onChange={handleInputChange}
                        className={
                          validationErrors.landmark ? "border-red-500" : ""
                        }
                      />
                      {validationErrors.landmark && (
                        <p className="text-sm text-red-600">
                          {validationErrors.landmark}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Full Address *</Label>
                      <Input
                        id="address"
                        name="address"
                        placeholder="Complete address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className={
                          validationErrors.address ? "border-red-500" : ""
                        }
                      />
                      {validationErrors.address && (
                        <p className="text-sm text-red-600">
                          {validationErrors.address}
                        </p>
                      )}
                    </div>
                  </div>

                  {currentLocation && (
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 text-green-700">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          Current location detected and will be included with
                          your complaint
                        </span>
                      </div>
                      <p className="text-xs text-green-600 mt-1">
                        Coordinates: {currentLocation.lat.toFixed(6)},{" "}
                        {currentLocation.lng.toFixed(6)}
                      </p>
                    </div>
                  )}
                  {validationErrors.coordinates && (
                    <p className="text-sm text-red-600">
                      {validationErrors.coordinates}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Attachments */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Upload Images (Optional)
                  </h3>
                  <p className="text-sm text-gray-600">
                    Adding photos helps our team understand and resolve the
                    issue faster. You can upload up to 5 images.
                  </p>

                  <div className="space-y-4">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      id="file-upload"
                      onChange={handleFileUpload}
                    />
                    <Label
                      htmlFor="file-upload"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-2 text-gray-500" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span>{" "}
                          or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG or JPEG (MAX. 10MB each)
                        </p>
                      </div>
                    </Label>

                    {/* Display uploaded files */}
                    {formData.attachments &&
                      formData.attachments.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm text-gray-700">
                            Uploaded Files ({formData.attachments.length}/5)
                          </h4>
                          <div className="space-y-2">
                            {formData.attachments.map((file, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                              >
                                <div className="flex items-center space-x-3">
                                  <Image className="h-5 w-5 text-blue-500" />
                                  <div>
                                    <p className="text-sm font-medium">
                                      {file.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {(file.size / 1024).toFixed(1)} KB
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFile(index)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* File upload errors */}
                    {fileUploadErrors.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm text-red-700">
                          Upload Errors:
                        </h4>
                        {fileUploadErrors.map((error, index) => (
                          <p key={index} className="text-sm text-red-600">
                            {error}
                          </p>
                        ))}
                      </div>
                    )}

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">
                        Tips for better photos:
                      </h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>
                          • Take clear, well-lit photos of the problem area
                        </li>
                        <li>• Include wider shots to show context</li>
                        <li>• Capture any visible damage or hazards</li>
                        <li>
                          • Avoid including personal or sensitive information
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Review Your Complaint</h3>

                <div className="space-y-4">
                  {/* Citizen Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Citizen Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p>
                        <strong>Name:</strong> {formData.fullName}
                      </p>
                      <p>
                        <strong>Email:</strong> {formData.email}
                      </p>
                      <p>
                        <strong>Phone:</strong> {formData.phoneNumber}
                      </p>
                      <p>
                        <strong>Citizen ID:</strong>{" "}
                        {user.id.slice(-8).toUpperCase()}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Complaint Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Complaint Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p>
                        <strong>Type:</strong> {selectedComplaintType?.label}
                      </p>
                      <p>
                        <strong>Priority:</strong>
                        <Badge
                          className={`ml-2 ${PRIORITIES.find((p) => p.value === formData.priority)?.color}`}
                        >
                          {
                            PRIORITIES.find(
                              (p) => p.value === formData.priority,
                            )?.label
                          }
                        </Badge>
                      </p>
                      <p>
                        <strong>SLA Hours:</strong> {formData.slaHours} hours
                      </p>
                      <p>
                        <strong>Description:</strong> {formData.description}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Location */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Location</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p>
                        <strong>Ward:</strong>{" "}
                        {WARDS.find((w) => w.id === formData.wardId)?.name}
                      </p>
                      {formData.subZoneId && (
                        <p>
                          <strong>Sub-Zone:</strong> {formData.subZoneId}
                        </p>
                      )}
                      <p>
                        <strong>Area:</strong> {formData.area}
                      </p>
                      {formData.landmark && (
                        <p>
                          <strong>Landmark:</strong> {formData.landmark}
                        </p>
                      )}
                      {formData.address && (
                        <p>
                          <strong>Address:</strong> {formData.address}
                        </p>
                      )}
                      {currentLocation && (
                        <p>
                          <strong>GPS Coordinates:</strong> Included
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Attachments */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Attachments</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {formData.attachments &&
                      formData.attachments.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600 mb-3">
                            {formData.attachments.length} file(s) will be
                            uploaded with your complaint:
                          </p>
                          {formData.attachments.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center space-x-3 p-2 bg-gray-50 rounded"
                            >
                              <Image className="h-4 w-4 text-blue-500" />
                              <span className="text-sm">{file.name}</span>
                              <span className="text-xs text-gray-500">
                                ({(file.size / 1024).toFixed(1)} KB)
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No attachments</p>
                      )}
                    </CardContent>
                  </Card>

                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription className="text-green-800">
                      <strong>Ready to submit!</strong> Your complaint will be
                      automatically assigned a tracking number and forwarded to
                      the appropriate department. You'll receive email
                      notifications about status updates.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrev}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              {currentStep < 4 ? (
                <Button type="button" onClick={handleNext}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || uploadingFiles}
                >
                  {isSubmitting || uploadingFiles ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {uploadingFiles ? "Uploading files..." : "Submitting..."}
                    </>
                  ) : (
                    <>
                      Submit Complaint
                      <CheckCircle className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CitizenComplaintForm;
