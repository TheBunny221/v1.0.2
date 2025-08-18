import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { useSystemConfig } from "../contexts/SystemConfigContext";
import { useComplaintTypes } from "../hooks/useComplaintTypes";
import {
  selectAuth,
  getDashboardRouteForRole,
} from "../store/slices/authSlice";
import {
  selectGuestState,
  selectCurrentStep,
  selectSteps,
  selectFormData,
  selectValidationErrors,
  selectCanProceed,
  selectIsSubmitting,
  selectSubmissionStep,
  selectGuestError,
  selectComplaintId,
  selectTrackingNumber,
  selectNewUserRegistered,
  selectImagePreview,
  setCurrentStep,
  nextStep,
  prevStep,
  updateFormData,
  addAttachment,
  removeAttachment,
  validateCurrentStep,
  setImagePreview,
  clearGuestData,
  clearError,
  AttachmentFile,
  FileAttachment,
  GuestComplaintData,
} from "../store/slices/guestSlice";
import { getApiErrorMessage } from "../store/api/baseApi";
import { useOtpFlow } from "../contexts/OtpContext";
import {
  useGetWardsQuery,
  useSubmitGuestComplaintMutation,
} from "../store/api/guestApi";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  FileText,
  Mail,
  CheckCircle,
  Clock,
  User,
  MapPin,
  ArrowLeft,
  ArrowRight,
  Loader2,
  UserPlus,
  Shield,
  Camera,
  Upload,
  X,
  Eye,
  AlertCircle,
  MapIcon,
  FileImage,
  Check,
} from "lucide-react";
import { useToast } from "../hooks/use-toast";

const COMPLAINT_TYPES = [
  {
    value: "WATER_SUPPLY",
    label: "Water Supply",
    description: "Issues with water supply, quality, or pressure",
  },
  {
    value: "ELECTRICITY",
    label: "Electricity",
    description: "Power outages, faulty connections, or street lighting",
  },
  {
    value: "ROAD_REPAIR",
    label: "Road Repair",
    description: "Potholes, broken roads, or pedestrian issues",
  },
  {
    value: "GARBAGE_COLLECTION",
    label: "Garbage Collection",
    description: "Waste management and cleanliness issues",
  },
  {
    value: "STREET_LIGHTING",
    label: "Street Lighting",
    description: "Non-functioning or damaged street lights",
  },
  {
    value: "SEWERAGE",
    label: "Sewerage",
    description: "Drainage problems, blockages, or overflow",
  },
  {
    value: "PUBLIC_HEALTH",
    label: "Public Health",
    description: "Health and sanitation concerns",
  },
  {
    value: "TRAFFIC",
    label: "Traffic",
    description: "Traffic management and road safety issues",
  },
  {
    value: "OTHERS",
    label: "Others",
    description: "Any other civic issues not listed above",
  },
];

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

const GuestComplaintForm: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { openOtpFlow } = useOtpFlow();
  const { isAuthenticated, user } = useAppSelector(selectAuth);
  const { appName } = useSystemConfig();

  // Fetch wards from API
  const {
    data: wardsResponse,
    isLoading: wardsLoading,
    error: wardsError,
  } = useGetWardsQuery();
  const wards = Array.isArray(wardsResponse?.data) ? wardsResponse.data : [];

  // RTK Query mutation for form submission
  const [submitComplaintMutation] = useSubmitGuestComplaintMutation();

  // Guest form state
  const currentStep = useAppSelector(selectCurrentStep);
  const steps = useAppSelector(selectSteps);
  const formData = useAppSelector(selectFormData);
  const validationErrors = useAppSelector(selectValidationErrors);
  const canProceed = useAppSelector(selectCanProceed);
  const isSubmitting = useAppSelector(selectIsSubmitting);
  const submissionStep = useAppSelector(selectSubmissionStep);
  const error = useAppSelector(selectGuestError);
  const complaintId = useAppSelector(selectComplaintId);
  const trackingNumber = useAppSelector(selectTrackingNumber);
  const newUserRegistered = useAppSelector(selectNewUserRegistered);
  const imagePreview = useAppSelector(selectImagePreview);

  // Local state
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [fileMap, setFileMap] = useState<Map<string, File>>(new Map());

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      const dashboardRoute = getDashboardRouteForRole(user.role);
      navigate(dashboardRoute);
    }
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
          dispatch(
            updateFormData({
              coordinates: {
                latitude: coords.lat,
                longitude: coords.lng,
              },
            }),
          );
        },
        (error) => {
          console.log("Location access denied or unavailable");
        },
      );
    }
  }, [dispatch]);

  // Handle input changes
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      dispatch(updateFormData({ [name]: value }));
    },
    [dispatch],
  );

  // Handle select changes
  const handleSelectChange = useCallback(
    (name: string, value: string) => {
      dispatch(updateFormData({ [name]: value }));
    },
    [dispatch],
  );

  // Handle file upload
  const handleFileUpload = useCallback(
    (files: FileList | null) => {
      if (!files) return;

      Array.from(files).forEach((file) => {
        // Validate file
        if (file.size > 10 * 1024 * 1024) {
          // 10MB
          toast({
            title: "File too large",
            description: "Please select files smaller than 10MB",
            variant: "destructive",
          });
          return;
        }

        if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
          toast({
            title: "Invalid file type",
            description: "Only JPG and PNG images are allowed",
            variant: "destructive",
          });
          return;
        }

        // Create attachment object with serializable data
        const attachmentId =
          Date.now().toString() + Math.random().toString(36).substr(2, 9);
        const attachment: AttachmentFile = {
          id: attachmentId,
          name: file.name,
          size: file.size,
          type: file.type,
          preview: URL.createObjectURL(file),
          uploading: false,
          uploaded: false,
        };

        // Store the actual file separately
        setFileMap((prev) => new Map(prev).set(attachmentId, file));
        dispatch(addAttachment(attachment));
      });
    },
    [dispatch, toast],
  );

  // Handle attachment removal
  const handleRemoveAttachment = useCallback(
    (id: string) => {
      // Clean up file map
      setFileMap((prev) => {
        const newMap = new Map(prev);
        newMap.delete(id);
        return newMap;
      });
      dispatch(removeAttachment(id));
    },
    [dispatch],
  );

  // Handle image preview
  const handlePreviewImage = useCallback(
    (url: string) => {
      dispatch(setImagePreview({ show: true, url }));
    },
    [dispatch],
  );

  // Handle form navigation
  const handleNext = useCallback(() => {
    dispatch(validateCurrentStep());
    if (canProceed) {
      dispatch(nextStep());
    } else {
      toast({
        title: "Please complete required fields",
        description: "Fill in all required information before proceeding",
        variant: "destructive",
      });
    }
  }, [dispatch, canProceed, toast]);

  const handlePrev = useCallback(() => {
    dispatch(prevStep());
  }, [dispatch]);

  const handleStepClick = useCallback(
    (stepNumber: number) => {
      if (stepNumber <= currentStep) {
        dispatch(setCurrentStep(stepNumber));
      }
    },
    [dispatch, currentStep],
  );

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    dispatch(validateCurrentStep());

    // Final validation
    const hasErrors = Object.keys(validationErrors).length > 0;
    if (hasErrors) {
      toast({
        title: "Please fix validation errors",
        description: "Complete all required fields correctly before submitting",
        variant: "destructive",
      });
      return;
    }

    try {
      // Prepare files array for submission
      const files: FileAttachment[] =
        formData.attachments
          ?.map((attachment) => {
            const file = fileMap.get(attachment.id);
            return file ? { id: attachment.id, file } : null;
          })
          .filter((f): f is FileAttachment => f !== null) || [];

      // Create FormData for file uploads
      const submissionData = new FormData();

      // Add text data
      submissionData.append("fullName", formData.fullName);
      submissionData.append("email", formData.email);
      submissionData.append("phoneNumber", formData.phoneNumber);
      submissionData.append("type", formData.type);
      submissionData.append("description", formData.description);
      submissionData.append("priority", formData.priority || "MEDIUM");
      submissionData.append("wardId", formData.wardId);
      if (formData.subZoneId)
        submissionData.append("subZoneId", formData.subZoneId);
      submissionData.append("area", formData.area);
      if (formData.landmark)
        submissionData.append("landmark", formData.landmark);
      if (formData.address) submissionData.append("address", formData.address);

      // Add coordinates
      if (formData.coordinates) {
        submissionData.append(
          "coordinates",
          JSON.stringify(formData.coordinates),
        );
      }

      // Add attachments
      if (files && files.length > 0) {
        files.forEach((fileAttachment) => {
          submissionData.append("attachments", fileAttachment.file);
        });
      }

      const response = await submitComplaintMutation(submissionData).unwrap();
      const result = response.data;

      if (result.complaintId && result.trackingNumber) {
        // Open unified OTP dialog
        openOtpFlow({
          context: "guestComplaint",
          email: formData.email,
          complaintId: result.complaintId,
          trackingNumber: result.trackingNumber,
          title: "Verify Your Complaint",
          description:
            "Enter the verification code sent to your email to complete your complaint submission",
          onSuccess: () => {
            toast({
              title: "Success!",
              description: "Your complaint has been verified successfully.",
            });
            navigate("/dashboard");
          },
        });

        toast({
          title: "Complaint Submitted",
          description: `Tracking number: ${result.trackingNumber}. Please check your email for the verification code.`,
        });
      }
    } catch (error: any) {
      console.error("Guest complaint submission error:", error);
      toast({
        title: "Submission Failed",
        description: getApiErrorMessage(error),
        variant: "destructive",
      });
    }
  }, [dispatch, formData, validationErrors, openOtpFlow, toast, navigate]);

  // Calculate progress
  const progress = ((currentStep - 1) / (steps.length - 1)) * 100;

  // Get available sub-zones based on selected ward
  const selectedWard = wards.find((ward) => ward.id === formData.wardId);
  const availableSubZones = selectedWard?.subZones || [];

  // Success page
  if (submissionStep === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 px-4">
        <div className="w-full max-w-md space-y-6">
          <Card data-testid="success-page">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto">
                  <UserPlus className="h-8 w-8 text-green-600" />
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-green-800">
                    Welcome to {appName}!
                  </h2>
                  <p className="text-green-700 mt-2">
                    Your complaint has been verified and you've been registered
                    as a citizen.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-lg border border-green-200">
                  <p className="text-sm text-gray-700">
                    <strong>Tracking Number:</strong> {trackingNumber}
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    You can now track your complaint progress from your
                    dashboard.
                  </p>
                </div>

                <Alert className="border-amber-200 bg-amber-50">
                  <Shield className="h-4 w-4" />
                  <AlertDescription className="text-amber-700">
                    <strong>Security Tip:</strong> Set a password in your
                    profile settings for easier future logins.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Button
                    onClick={() => navigate("/dashboard")}
                    className="w-full"
                  >
                    Go to Dashboard
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => dispatch(clearGuestData())}
                    className="w-full"
                  >
                    Submit Another Complaint
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Multi-step complaint form
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">
            Submit a Complaint
          </h1>
          <p className="text-gray-600">
            Report civic issues and get them resolved quickly
          </p>
        </div>

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
                {steps.map((step, index) => (
                  <button
                    key={step.id}
                    onClick={() => handleStepClick(step.id)}
                    disabled={step.id > currentStep}
                    className={`flex flex-col items-center space-y-2 p-2 rounded-lg transition-colors ${
                      step.id === currentStep
                        ? "bg-blue-100 text-blue-800"
                        : step.isCompleted
                          ? "bg-green-100 text-green-800 cursor-pointer hover:bg-green-200"
                          : "text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        step.id === currentStep
                          ? "bg-blue-600 text-white"
                          : step.isCompleted
                            ? "bg-green-600 text-white"
                            : "bg-gray-300 text-gray-600"
                      }`}
                    >
                      {step.isCompleted ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        step.id
                      )}
                    </div>
                    <span className="text-xs font-medium">{step.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Form Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {currentStep === 1 && <User className="h-5 w-5" />}
              {currentStep === 2 && <MapPin className="h-5 w-5" />}
              {currentStep === 3 && <Camera className="h-5 w-5" />}
              {currentStep === 4 && <FileText className="h-5 w-5" />}
              {currentStep === 5 && <CheckCircle className="h-5 w-5" />}
              {steps[currentStep - 1]?.title}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 &&
                "Provide your details and describe the issue"}
              {currentStep === 2 && "Specify the location of the problem"}
              {currentStep === 3 &&
                "Add images to help us understand the issue (optional)"}
              {currentStep === 4 && "Review all information before submitting"}
              {currentStep === 5 && "Submit your complaint for verification"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Details */}
            {currentStep === 1 && (
              <div className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Personal Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">
                        Full Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        placeholder="Enter your full name"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        aria-describedby={
                          validationErrors.fullName
                            ? "fullName-error"
                            : undefined
                        }
                        className={
                          validationErrors.fullName
                            ? "border-red-500 focus:ring-red-500"
                            : ""
                        }
                      />
                      {validationErrors.fullName && (
                        <p
                          id="fullName-error"
                          className="text-sm text-red-600"
                          role="alert"
                        >
                          {validationErrors.fullName}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">
                        Email Address <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={handleInputChange}
                        aria-describedby={
                          validationErrors.email ? "email-error" : undefined
                        }
                        className={
                          validationErrors.email
                            ? "border-red-500 focus:ring-red-500"
                            : ""
                        }
                      />
                      {validationErrors.email && (
                        <p
                          id="email-error"
                          className="text-sm text-red-600"
                          role="alert"
                        >
                          {validationErrors.email}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">
                      Phone Number <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="phoneNumber"
                      name="phoneNumber"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      aria-describedby={
                        validationErrors.phoneNumber
                          ? "phoneNumber-error"
                          : undefined
                      }
                      className={
                        validationErrors.phoneNumber
                          ? "border-red-500 focus:ring-red-500"
                          : ""
                      }
                    />
                    {validationErrors.phoneNumber && (
                      <p
                        id="phoneNumber-error"
                        className="text-sm text-red-600"
                        role="alert"
                      >
                        {validationErrors.phoneNumber}
                      </p>
                    )}
                  </div>
                </div>

                {/* Complaint Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Complaint Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>
                        Complaint Type <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) =>
                          handleSelectChange("type", value)
                        }
                        aria-describedby={
                          validationErrors.type ? "type-error" : undefined
                        }
                      >
                        <SelectTrigger
                          className={
                            validationErrors.type
                              ? "border-red-500 focus:ring-red-500"
                              : ""
                          }
                        >
                          <SelectValue placeholder="Select complaint type" />
                        </SelectTrigger>
                        <SelectContent>
                          {COMPLAINT_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {type.label}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {type.description}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {validationErrors.type && (
                        <p
                          id="type-error"
                          className="text-sm text-red-600"
                          role="alert"
                        >
                          {validationErrors.type}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <Select
                        value={formData.priority}
                        onValueChange={(value) =>
                          handleSelectChange("priority", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PRIORITIES.map((priority) => (
                            <SelectItem
                              key={priority.value}
                              value={priority.value}
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-2 h-2 rounded-full ${priority.color}`}
                                />
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {priority.label}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {priority.description}
                                  </span>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">
                      Description <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Describe the issue in detail..."
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      aria-describedby={
                        validationErrors.description
                          ? "description-error"
                          : undefined
                      }
                      className={
                        validationErrors.description
                          ? "border-red-500 focus:ring-red-500"
                          : ""
                      }
                    />
                    {validationErrors.description && (
                      <p
                        id="description-error"
                        className="text-sm text-red-600"
                        role="alert"
                      >
                        {validationErrors.description}
                      </p>
                    )}
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
                      <Label>
                        Ward <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.wardId}
                        onValueChange={(value) =>
                          handleSelectChange("wardId", value)
                        }
                      >
                        <SelectTrigger
                          className={
                            validationErrors.wardId
                              ? "border-red-500 focus:ring-red-500"
                              : ""
                          }
                        >
                          <SelectValue placeholder="Select ward" />
                        </SelectTrigger>
                        <SelectContent>
                          {wardsLoading ? (
                            <SelectItem value="loading" disabled>
                              Loading wards...
                            </SelectItem>
                          ) : wardsError ? (
                            <SelectItem value="error" disabled>
                              Error loading wards
                            </SelectItem>
                          ) : (
                            wards.map((ward) => (
                              <SelectItem key={ward.id} value={ward.id}>
                                {ward.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {validationErrors.wardId && (
                        <p className="text-sm text-red-600" role="alert">
                          {validationErrors.wardId}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>
                        Sub-Zone <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.subZoneId}
                        onValueChange={(value) =>
                          handleSelectChange("subZoneId", value)
                        }
                        disabled={!formData.wardId}
                      >
                        <SelectTrigger
                          className={
                            validationErrors.subZoneId
                              ? "border-red-500 focus:ring-red-500"
                              : ""
                          }
                        >
                          <SelectValue placeholder="Select sub-zone" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableSubZones.length === 0 ? (
                            <SelectItem value="no-subzones" disabled>
                              No sub-zones available
                            </SelectItem>
                          ) : (
                            availableSubZones.map((subZone) => (
                              <SelectItem key={subZone.id} value={subZone.id}>
                                {subZone.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {validationErrors.subZoneId && (
                        <p className="text-sm text-red-600" role="alert">
                          {validationErrors.subZoneId}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="area">
                      Area/Locality <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="area"
                      name="area"
                      placeholder="Enter specific area or locality"
                      value={formData.area}
                      onChange={handleInputChange}
                      className={
                        validationErrors.area
                          ? "border-red-500 focus:ring-red-500"
                          : ""
                      }
                    />
                    {validationErrors.area && (
                      <p className="text-sm text-red-600" role="alert">
                        {validationErrors.area}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="landmark">Landmark (Optional)</Label>
                      <Input
                        id="landmark"
                        name="landmark"
                        placeholder="Nearby landmark"
                        value={formData.landmark}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Full Address (Optional)</Label>
                      <Input
                        id="address"
                        name="address"
                        placeholder="Complete address"
                        value={formData.address}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  {currentLocation && (
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 text-green-700">
                        <MapIcon className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          Location detected: {currentLocation.lat.toFixed(6)},{" "}
                          {currentLocation.lng.toFixed(6)}
                        </span>
                      </div>
                    </div>
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
                    Upload images to help illustrate the issue. Maximum 5 files,
                    10MB each.
                  </p>

                  <div className="space-y-4">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e.target.files)}
                      className="hidden"
                      id="file-upload"
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

                    {/* File previews */}
                    {formData.attachments &&
                      formData.attachments.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {formData.attachments.map((attachment) => (
                            <div
                              key={attachment.id}
                              className="relative group border rounded-lg overflow-hidden"
                            >
                              <img
                                src={attachment.preview}
                                alt="Preview"
                                className="w-full h-24 object-cover"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                                <div className="opacity-0 group-hover:opacity-100 flex gap-2">
                                  <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={() =>
                                      handlePreviewImage(attachment.preview!)
                                    }
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() =>
                                      handleRemoveAttachment(attachment.id)
                                    }
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Review Your Complaint</h3>

                <div className="space-y-4">
                  {/* Personal Info Review */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Personal Information
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
                    </CardContent>
                  </Card>

                  {/* Complaint Info Review */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Complaint Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p>
                        <strong>Type:</strong>{" "}
                        {
                          COMPLAINT_TYPES.find(
                            (type) => type.value === formData.type,
                          )?.label
                        }
                      </p>
                      <p>
                        <strong>Priority:</strong>{" "}
                        <Badge
                          className={
                            PRIORITIES.find(
                              (p) => p.value === formData.priority,
                            )?.color
                          }
                        >
                          {
                            PRIORITIES.find(
                              (p) => p.value === formData.priority,
                            )?.label
                          }
                        </Badge>
                      </p>
                      <p>
                        <strong>Description:</strong> {formData.description}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Location Review */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Location</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p>
                        <strong>Ward:</strong>{" "}
                        {selectedWard?.name || formData.wardId}
                      </p>
                      <p>
                        <strong>Sub-Zone:</strong>{" "}
                        {availableSubZones.find(
                          (sz) => sz.id === formData.subZoneId,
                        )?.name ||
                          formData.subZoneId ||
                          "Not specified"}
                      </p>
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
                    </CardContent>
                  </Card>

                  {/* Attachments Review */}
                  {formData.attachments && formData.attachments.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Attachments</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-2">
                          {formData.attachments.map((attachment) => (
                            <img
                              key={attachment.id}
                              src={attachment.preview}
                              alt="Attachment"
                              className="w-full h-20 object-cover rounded border cursor-pointer"
                              onClick={() =>
                                handlePreviewImage(attachment.preview!)
                              }
                            />
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
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

              {currentStep < steps.length ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!canProceed}
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !canProceed}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
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

        {/* Image Preview Dialog */}
        {imagePreview.show && (
          <Dialog
            open={imagePreview.show}
            onOpenChange={(open) =>
              dispatch(setImagePreview({ show: open, url: imagePreview.url }))
            }
          >
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Image Preview</DialogTitle>
              </DialogHeader>
              <div className="flex justify-center">
                <img
                  src={imagePreview.url!}
                  alt="Preview"
                  className="max-w-full max-h-96 object-contain"
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default GuestComplaintForm;
