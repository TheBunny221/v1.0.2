import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../store/hooks";
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
  submitGuestComplaint,
  verifyOTPAndRegister,
  resendOTP,
<<<<<<< HEAD
  clearError,
  clearGuestData,
  updateComplaintData,
  selectGuestState,
  selectSubmissionStep,
  selectComplaintId,
  selectUserEmail,
  selectNewUserRegistered,
=======
  AttachmentFile,
  GuestComplaintData,
>>>>>>> origin/main
} from "../store/slices/guestSlice";
import { useOtpFlow } from "../contexts/OtpContext";
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
<<<<<<< HEAD
  DialogTrigger,
=======
>>>>>>> origin/main
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
<<<<<<< HEAD
=======
  Camera,
>>>>>>> origin/main
  Upload,
  X,
  Eye,
  AlertCircle,
<<<<<<< HEAD
  Phone,
  Home,
  Image as ImageIcon,
=======
  MapIcon,
  FileImage,
  Check,
>>>>>>> origin/main
} from "lucide-react";
import { useToast } from "../hooks/use-toast";

// Mock data - in real app this would come from API
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

// Mock sub-zones data  
const SUB_ZONES = [
  { id: "sz-1", wardId: "ward-1", name: "Fort Kochi Beach" },
  { id: "sz-2", wardId: "ward-1", name: "Fort Kochi Market" },
  { id: "sz-3", wardId: "ward-2", name: "Mattancherry Palace" },
  { id: "sz-4", wardId: "ward-2", name: "Jew Town" },
  { id: "sz-5", wardId: "ward-3", name: "Marine Drive" },
  { id: "sz-6", wardId: "ward-3", name: "Broadway" },
  { id: "sz-7", wardId: "ward-4", name: "MG Road" },
  { id: "sz-8", wardId: "ward-4", name: "Convent Junction" },
  { id: "sz-9", wardId: "ward-5", name: "Kadavanthra Junction" },
  { id: "sz-10", wardId: "ward-5", name: "Kaloor Stadium" },
  { id: "sz-11", wardId: "ward-6", name: "Thevara Ferry" },
  { id: "sz-12", wardId: "ward-6", name: "Thevara Bridge" },
];

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

interface FormData {
  fullName: string;
  email: string;
  phoneNumber: string;
  type: string;
  priority: string;
  description: string;
  wardId: string;
  subZoneId: string;
  area: string;
  landmark: string;
  address: string;
  attachments: File[];
  otpCode: string;
}

interface AttachmentWithPreview {
  file: File;
  previewUrl: string;
}

const STEPS = [
  { id: 1, name: "Details", description: "Basic information" },
  { id: 2, name: "Location", description: "Location details" },
  { id: 3, name: "Attachments", description: "Upload images" },
  { id: 4, name: "Review", description: "Review & confirm" },
  { id: 5, name: "Submit", description: "Submit complaint" },
];

const GuestComplaintForm: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { openOtpFlow } = useOtpFlow();
  const { isAuthenticated, user } = useAppSelector(selectAuth);

<<<<<<< HEAD
  const { isSubmitting, isVerifying, error, otpExpiry, complaintData } =
    useAppSelector(selectGuestState);

=======
  // Guest form state
  const currentStep = useAppSelector(selectCurrentStep);
  const steps = useAppSelector(selectSteps);
  const formData = useAppSelector(selectFormData);
  const validationErrors = useAppSelector(selectValidationErrors);
  const canProceed = useAppSelector(selectCanProceed);
  const isSubmitting = useAppSelector(selectIsSubmitting);
>>>>>>> origin/main
  const submissionStep = useAppSelector(selectSubmissionStep);
  const error = useAppSelector(selectGuestError);
  const complaintId = useAppSelector(selectComplaintId);
  const trackingNumber = useAppSelector(selectTrackingNumber);
  const newUserRegistered = useAppSelector(selectNewUserRegistered);
  const imagePreview = useAppSelector(selectImagePreview);

<<<<<<< HEAD
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    phoneNumber: "",
    type: "",
    priority: "MEDIUM",
    description: "",
    wardId: "",
    subZoneId: "",
    area: "",
    landmark: "",
    address: "",
    attachments: [],
    otpCode: "",
  });

  const [attachmentPreviews, setAttachmentPreviews] = useState<AttachmentWithPreview[]>([]);
=======
  // Local state
>>>>>>> origin/main
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [otpTimer, setOtpTimer] = useState(0);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

<<<<<<< HEAD
  // Load form data from sessionStorage on mount
  useEffect(() => {
    const savedFormData = sessionStorage.getItem('guestComplaintFormData');
    if (savedFormData) {
      try {
        const parsed = JSON.parse(savedFormData);
        setFormData({ ...formData, ...parsed });
        setCurrentStep(parsed.currentStep || 1);
      } catch (error) {
        console.warn('Failed to parse saved form data');
      }
    }
  }, []);

  // Save form data to sessionStorage when it changes
  useEffect(() => {
    const dataToSave = { ...formData, currentStep };
    sessionStorage.setItem('guestComplaintFormData', JSON.stringify(dataToSave));
  }, [formData, currentStep]);

  // Clear error when component mounts
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // OTP timer
  useEffect(() => {
    if (otpExpiry) {
      const updateTimer = () => {
        const now = new Date().getTime();
        const expiry = new Date(otpExpiry).getTime();
        const remaining = Math.max(0, Math.floor((expiry - now) / 1000));
        setOtpTimer(remaining);
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
=======
  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      const dashboardRoute = getDashboardRouteForRole(user.role);
      navigate(dashboardRoute);
>>>>>>> origin/main
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

<<<<<<< HEAD
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }

    if (error) {
      dispatch(clearError());
=======
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

        // Create attachment object
        const attachment: AttachmentFile = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          file,
          preview: URL.createObjectURL(file),
          uploading: false,
          uploaded: false,
        };

        dispatch(addAttachment(attachment));
      });
    },
    [dispatch, toast],
  );

  // Handle attachment removal
  const handleRemoveAttachment = useCallback(
    (id: string) => {
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
>>>>>>> origin/main
    }
  }, [dispatch, canProceed, toast]);

  const handlePrev = useCallback(() => {
    dispatch(prevStep());
  }, [dispatch]);

<<<<<<< HEAD
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Reset subZoneId when wardId changes
    if (name === 'wardId') {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        subZoneId: '',
      }));
    }

    if (error) {
      dispatch(clearError());
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate files
    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach(file => {
      // Check file type
      if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
        errors.push(`${file.name}: Only JPG and PNG files are allowed`);
        return;
      }

      // Check file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        errors.push(`${file.name}: File size must be less than 10MB`);
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      toast({
        title: "File Upload Error",
        description: errors.join(', '),
        variant: "destructive",
      });
      return;
    }

    // Check total files limit
    if (attachmentPreviews.length + validFiles.length > 5) {
      toast({
        title: "File Upload Error",
        description: "Maximum 5 files allowed",
        variant: "destructive",
      });
      return;
    }

    // Create previews for new files
    const newPreviews: AttachmentWithPreview[] = validFiles.map(file => ({
      file,
      previewUrl: URL.createObjectURL(file)
    }));

    setAttachmentPreviews(prev => [...prev, ...newPreviews]);
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...validFiles]
    }));

    // Clear the input
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    const preview = attachmentPreviews[index];
    URL.revokeObjectURL(preview.previewUrl);

    setAttachmentPreviews(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    switch (step) {
      case 1: // Details
        if (!formData.fullName.trim()) errors.fullName = 'Full name is required';
        if (!formData.email.trim()) {
          errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          errors.email = 'Invalid email format';
        }
        if (!formData.phoneNumber.trim()) {
          errors.phoneNumber = 'Phone number is required';
        } else if (!/^\+?[\d\s-()]{10,}$/.test(formData.phoneNumber)) {
          errors.phoneNumber = 'Invalid phone number format';
        }
        if (!formData.type) errors.type = 'Complaint type is required';
        if (!formData.description.trim()) errors.description = 'Description is required';
        break;
      
      case 2: // Location
        if (!formData.wardId) errors.wardId = 'Ward is required';
        if (!formData.subZoneId) errors.subZoneId = 'Sub-zone is required';
        if (!formData.area.trim()) errors.area = 'Area is required';
        break;
      
      case 3: // Attachments - optional, no validation required
        break;
      
      case 4: // Review - all previous validations
        return validateStep(1) && validateStep(2);
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleComplaintSubmit = async () => {
    if (!validateStep(1) || !validateStep(2)) {
      setCurrentStep(1);
      return;
    }

    const complaintData = {
      fullName: formData.fullName,
      email: formData.email,
      phoneNumber: formData.phoneNumber,
      type: formData.type,
      priority: formData.priority,
      description: formData.description,
      wardId: formData.wardId,
      area: formData.area,
      landmark: formData.landmark,
      address: formData.address,
      coordinates: currentLocation
        ? {
            latitude: currentLocation.lat,
            longitude: currentLocation.lng,
          }
        : undefined,
    };

    try {
      await dispatch(submitGuestComplaint(complaintData)).unwrap();
      sessionStorage.removeItem('guestComplaintFormData'); // Clear saved data on success
      toast({
        title: "Complaint Submitted",
        description: "Please check your email for the OTP to complete verification.",
=======
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
      const result = await dispatch(submitGuestComplaint(formData)).unwrap();

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
      toast({
        title: "Submission Failed",
        description:
          error.message || "Failed to submit complaint. Please try again.",
        variant: "destructive",
>>>>>>> origin/main
      });
    }
  }, [dispatch, formData, validationErrors, openOtpFlow, toast, navigate]);

  // Calculate progress
  const progress = ((currentStep - 1) / (steps.length - 1)) * 100;

<<<<<<< HEAD
    if (!complaintId || !userEmail || !formData.otpCode) {
      return;
    }

    try {
      await dispatch(
        verifyOTPAndRegister({
          email: userEmail,
          otpCode: formData.otpCode,
          complaintId,
        }),
      ).unwrap();

      sessionStorage.removeItem('guestComplaintFormData'); // Clear saved data on success
    } catch (error: any) {
      // Error is handled by the reducer
    }
  };

  const handleResendOTP = async () => {
    if (!complaintId || !userEmail) {
      return;
    }

    try {
      await dispatch(
        resendOTP({
          email: userEmail,
          complaintId,
        }),
      ).unwrap();

      toast({
        title: "OTP Resent",
        description: "A new OTP has been sent to your email.",
      });
    } catch (error: any) {
      // Error is handled by the reducer
    }
  };

  const handleStartOver = () => {
    dispatch(clearGuestData());
    sessionStorage.removeItem('guestComplaintFormData');
    setFormData({
      fullName: "",
      email: "",
      phoneNumber: "",
      type: "",
      priority: "MEDIUM",
      description: "",
      wardId: "",
      subZoneId: "",
      area: "",
      landmark: "",
      address: "",
      attachments: [],
      otpCode: "",
    });
    setCurrentStep(1);
    setAttachmentPreviews([]);
    setValidationErrors({});
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const goToDashboard = () => {
    navigate("/dashboard");
  };

  const goToLogin = () => {
    navigate("/login");
  };

  const getAvailableSubZones = () => {
    return SUB_ZONES.filter(sz => sz.wardId === formData.wardId);
  };

  const getProgressPercentage = () => {
    return ((currentStep - 1) / (STEPS.length - 1)) * 100;
  };

  // Render different submission steps
  if (submissionStep === "otp") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">
              Verify Your Email
            </h1>
            <p className="text-gray-600">
              Complete your complaint registration
            </p>
          </div>

          <Card data-testid="otp-verification">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-4">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>OTP Sent</CardTitle>
              <CardDescription>
                We've sent a 6-digit code to
                <br />
                <strong>{userEmail}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert className="mb-4 border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-red-700">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleOTPSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otpCode">Enter OTP Code</Label>
                  <Input
                    id="otpCode"
                    name="otpCode"
                    type="text"
                    placeholder="000000"
                    value={formData.otpCode}
                    onChange={handleInputChange}
                    maxLength={6}
                    className="text-center tracking-widest text-lg"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isVerifying || formData.otpCode.length !== 6}
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify & Complete Registration"
                  )}
                </Button>
              </form>

              <div className="text-center space-y-2 mt-4">
                {otpTimer > 0 ? (
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    Code expires in {formatTime(otpTimer)}
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResendOTP}
                    disabled={isSubmitting}
                  >
                    Resend OTP
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleStartOver}
                  className="ml-2"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Start Over
                </Button>
              </div>

              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Complaint ID:</strong> {complaintId}
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  After verification, you'll be automatically registered as a
                  citizen and can track your complaint.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
=======
  // Get available sub-zones based on selected ward
  const availableSubZones =
    WARDS.find((ward) => ward.id === formData.wardId)?.subZones || [];
>>>>>>> origin/main

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
                    Welcome to Cochin Smart City!
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
<<<<<<< HEAD
                {STEPS.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        currentStep >= step.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {currentStep > step.id ? (
                        <CheckCircle className="h-5 w-5" />
=======
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
>>>>>>> origin/main
                      ) : (
                        step.id
                      )}
                    </div>
<<<<<<< HEAD
                    {index < STEPS.length - 1 && (
                      <div
                        className={`w-full h-0.5 mx-2 ${
                          currentStep > step.id ? "bg-primary" : "bg-gray-200"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
              <Progress value={getProgressPercentage()} className="w-full" />
              <div className="text-center" data-testid="step-indicator">
                <h3 className="font-semibold">{STEPS[currentStep - 1].name}</h3>
                <p className="text-sm text-gray-600">
                  {STEPS[currentStep - 1].description}
                </p>
              </div>
=======
                    <span className="text-xs font-medium">{step.title}</span>
                  </button>
                ))}
              </div>
>>>>>>> origin/main
            </div>
          </CardContent>
        </Card>

<<<<<<< HEAD
=======
        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

>>>>>>> origin/main
        {/* Form Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {currentStep === 1 && <User className="h-5 w-5" />}
              {currentStep === 2 && <MapPin className="h-5 w-5" />}
<<<<<<< HEAD
              {currentStep === 3 && <Upload className="h-5 w-5" />}
              {currentStep === 4 && <Eye className="h-5 w-5" />}
              {currentStep === 5 && <FileText className="h-5 w-5" />}
              {STEPS[currentStep - 1].name}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && "Enter your personal details and complaint information"}
              {currentStep === 2 && "Specify the location where the issue occurred"}
              {currentStep === 3 && "Optionally upload images to support your complaint (max 5 files, 10MB each)"}
              {currentStep === 4 && "Review all details before submitting"}
              {currentStep === 5 && "Submit your complaint for processing"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-4 border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Step 1: Details */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        placeholder="Enter your full name"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className={validationErrors.fullName ? "border-red-500" : ""}
                      />
                      {validationErrors.fullName && (
                        <p className="text-sm text-red-500">{validationErrors.fullName}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
=======
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
>>>>>>> origin/main
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={handleInputChange}
<<<<<<< HEAD
                        className={validationErrors.email ? "border-red-500" : ""}
                      />
                      {validationErrors.email && (
                        <p className="text-sm text-red-500">{validationErrors.email}</p>
=======
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
>>>>>>> origin/main
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
<<<<<<< HEAD
                    <Label htmlFor="phoneNumber">Phone Number *</Label>
=======
                    <Label htmlFor="phoneNumber">
                      Phone Number <span className="text-red-500">*</span>
                    </Label>
>>>>>>> origin/main
                    <Input
                      id="phoneNumber"
                      name="phoneNumber"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
<<<<<<< HEAD
                      className={validationErrors.phoneNumber ? "border-red-500" : ""}
                    />
                    {validationErrors.phoneNumber && (
                      <p className="text-sm text-red-500">{validationErrors.phoneNumber}</p>
=======
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
>>>>>>> origin/main
                    )}
                  </div>
                </div>

<<<<<<< HEAD
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Complaint Information</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Complaint Type *</Label>
=======
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
>>>>>>> origin/main
                      <Select
                        value={formData.type}
                        onValueChange={(value) =>
                          handleSelectChange("type", value)
                        }
<<<<<<< HEAD
                      >
                        <SelectTrigger className={validationErrors.type ? "border-red-500" : ""} data-testid="complaint-type-select">
=======
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
>>>>>>> origin/main
                          <SelectValue placeholder="Select complaint type" />
                        </SelectTrigger>
                        <SelectContent>
                          {COMPLAINT_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
<<<<<<< HEAD
                              {type.label}
=======
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {type.label}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {type.description}
                                </span>
                              </div>
>>>>>>> origin/main
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {validationErrors.type && (
<<<<<<< HEAD
                        <p className="text-sm text-red-500">{validationErrors.type}</p>
=======
                        <p
                          id="type-error"
                          className="text-sm text-red-600"
                          role="alert"
                        >
                          {validationErrors.type}
                        </p>
>>>>>>> origin/main
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
<<<<<<< HEAD
                                {priority.label}
=======
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {priority.label}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {priority.description}
                                  </span>
                                </div>
>>>>>>> origin/main
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
<<<<<<< HEAD
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Describe the issue in detail..."
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      className={validationErrors.description ? "border-red-500" : ""}
                    />
                    {validationErrors.description && (
                      <p className="text-sm text-red-500">{validationErrors.description}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Location */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
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
                        <SelectTrigger className={validationErrors.wardId ? "border-red-500" : ""} data-testid="ward-select">
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
                        <p className="text-sm text-red-500">{validationErrors.wardId}</p>
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
                        <SelectTrigger className={validationErrors.subZoneId ? "border-red-500" : ""} data-testid="subzone-select">
                          <SelectValue placeholder="Select sub-zone" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableSubZones().map((subZone) => (
                            <SelectItem key={subZone.id} value={subZone.id}>
                              {subZone.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {validationErrors.subZoneId && (
                        <p className="text-sm text-red-500">{validationErrors.subZoneId}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="area">Area/Locality *</Label>
                    <Input
                      id="area"
                      name="area"
                      placeholder="Enter area or locality"
                      value={formData.area}
                      onChange={handleInputChange}
                      className={validationErrors.area ? "border-red-500" : ""}
                    />
                    {validationErrors.area && (
                      <p className="text-sm text-red-500">{validationErrors.area}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="landmark">Nearby Landmark</Label>
                      <Input
                        id="landmark"
                        name="landmark"
                        placeholder="Enter nearby landmark"
                        value={formData.landmark}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Complete Address</Label>
                      <Input
                        id="address"
                        name="address"
                        placeholder="Enter complete address"
                        value={formData.address}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  {currentLocation && (
                    <div className="p-3 bg-green-50 rounded-lg" data-testid="location-detected">
                      <p className="text-sm text-green-700">
                        📍 Location detected and will be included with your
                        complaint
                      </p>
                    </div>
                  )}

                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      💡 <strong>Map Picker:</strong> Interactive map location picker will be available in the next version. For now, please provide detailed location information above.
=======
                    <Label htmlFor="description">
                      Description <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Describe the issue in detail... (minimum 10 characters)"
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
                    <p className="text-xs text-gray-500">
                      {formData.description.length}/500 characters
>>>>>>> origin/main
                    </p>
                  </div>
                </div>
              </div>
            )}

<<<<<<< HEAD
=======
            {/* Step 2: Location */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <MapIcon className="h-5 w-5" />
                    Location Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>
                        Ward <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.wardId}
                        onValueChange={(value) => {
                          handleSelectChange("wardId", value);
                          // Clear sub-zone when ward changes
                          dispatch(updateFormData({ subZoneId: "" }));
                        }}
                        aria-describedby={
                          validationErrors.wardId ? "wardId-error" : undefined
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
                          {WARDS.map((ward) => (
                            <SelectItem key={ward.id} value={ward.id}>
                              {ward.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {validationErrors.wardId && (
                        <p
                          id="wardId-error"
                          className="text-sm text-red-600"
                          role="alert"
                        >
                          {validationErrors.wardId}
                        </p>
                      )}
                    </div>

                    {availableSubZones.length > 0 && (
                      <div className="space-y-2">
                        <Label>Sub-Zone</Label>
                        <Select
                          value={formData.subZoneId}
                          onValueChange={(value) =>
                            handleSelectChange("subZoneId", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select sub-zone" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableSubZones.map((subZone) => (
                              <SelectItem key={subZone} value={subZone}>
                                {subZone}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="area">
                        Area/Locality <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="area"
                        name="area"
                        placeholder="Enter area or locality"
                        value={formData.area}
                        onChange={handleInputChange}
                        aria-describedby={
                          validationErrors.area ? "area-error" : undefined
                        }
                        className={
                          validationErrors.area
                            ? "border-red-500 focus:ring-red-500"
                            : ""
                        }
                      />
                      {validationErrors.area && (
                        <p
                          id="area-error"
                          className="text-sm text-red-600"
                          role="alert"
                        >
                          {validationErrors.area}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="landmark">Nearby Landmark</Label>
                      <Input
                        id="landmark"
                        name="landmark"
                        placeholder="Enter nearby landmark"
                        value={formData.landmark}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Complete Address</Label>
                      <Input
                        id="address"
                        name="address"
                        placeholder="Enter complete address"
                        value={formData.address}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  {/* Map Picker Stub */}
                  <div className="space-y-2">
                    <Label>Location on Map</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <MapIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-2">
                        Interactive map picker coming soon
                      </p>
                      {currentLocation && (
                        <div className="text-sm text-green-600">
                          📍 Current location detected:{" "}
                          {currentLocation.lat.toFixed(6)},{" "}
                          {currentLocation.lng.toFixed(6)}
                        </div>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        disabled
                      >
                        Select on Map
                      </Button>
                    </div>
                  </div>

                  {currentLocation && (
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-700">
                        📍 Your location has been detected and will be included
                        with your complaint
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

>>>>>>> origin/main
            {/* Step 3: Attachments */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
<<<<<<< HEAD
                    <Upload className="h-5 w-5" />
                    Attachments (Optional)
                  </h3>

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-lg font-medium text-gray-700 mb-2">
                        Upload Images
                      </p>
                      <p className="text-sm text-gray-500 mb-4">
                        Click to select images or drag and drop
                      </p>
                      <p className="text-xs text-gray-400">
                        JPG, PNG files up to 10MB each. Maximum 5 files.
=======
                    <FileImage className="h-5 w-5" />
                    Attachments (Optional)
                  </h3>

                  <p className="text-sm text-gray-600">
                    Add photos to help us better understand the issue. You can
                    upload up to 5 images.
                  </p>

                  {/* File Upload Area */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                    <input
                      type="file"
                      id="file-upload"
                      multiple
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={(e) => handleFileUpload(e.target.files)}
                      className="hidden"
                      disabled={
                        formData.attachments && formData.attachments.length >= 5
                      }
                    />
                    <label
                      htmlFor="file-upload"
                      className={`cursor-pointer ${
                        formData.attachments && formData.attachments.length >= 5
                          ? "cursor-not-allowed opacity-50"
                          : ""
                      }`}
                    >
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-lg font-medium text-gray-600">
                        {formData.attachments &&
                        formData.attachments.length >= 5
                          ? "Maximum 5 files allowed"
                          : "Click to upload or drag and drop"}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        JPG, PNG up to 10MB each
>>>>>>> origin/main
                      </p>
                    </label>
                  </div>

<<<<<<< HEAD
                  {attachmentPreviews.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {attachmentPreviews.map((preview, index) => (
                        <div key={index} className="relative group" data-testid="attachment-preview">
                          <div className="aspect-square rounded-lg overflow-hidden border">
                            <img
                              src={preview.previewUrl}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeAttachment(index)}
                            data-testid={`remove-attachment-${index}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl">
                              <DialogHeader>
                                <DialogTitle>Image Preview</DialogTitle>
                                <DialogDescription>
                                  {preview.file.name} ({(preview.file.size / 1024 / 1024).toFixed(2)} MB)
                                </DialogDescription>
                              </DialogHeader>
                              <img
                                src={preview.previewUrl}
                                alt={preview.file.name}
                                className="w-full h-auto max-h-96 object-contain"
                              />
                            </DialogContent>
                          </Dialog>
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            {preview.file.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-2">Tips for better photos:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Take clear, well-lit photos</li>
                      <li>• Include the full problem area in the frame</li>
                      <li>• Add context with landmarks or street signs</li>
                      <li>• Multiple angles can help explain the issue better</li>
                    </ul>
                  </div>
=======
                  {/* Attachment List */}
                  {formData.attachments && formData.attachments.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-md font-medium">Uploaded Images</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {formData.attachments.map((attachment) => (
                          <div
                            key={attachment.id}
                            className="relative bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow"
                          >
                            {/* Image thumbnail */}
                            <div className="aspect-video bg-gray-100 rounded-md mb-2 overflow-hidden">
                              {attachment.preview && (
                                <img
                                  src={attachment.preview}
                                  alt={attachment.file.name}
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>

                            {/* File info */}
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {attachment.file.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(attachment.file.size / 1024 / 1024).toFixed(
                                  2,
                                )}{" "}
                                MB
                              </p>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-between items-center mt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  attachment.preview &&
                                  handlePreviewImage(attachment.preview)
                                }
                                className="flex items-center gap-1"
                              >
                                <Eye className="h-3 w-3" />
                                Preview
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleRemoveAttachment(attachment.id)
                                }
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>

                            {/* Upload status */}
                            {attachment.uploading && (
                              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
                                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Validation errors for attachments */}
                  {Object.keys(validationErrors).some((key) =>
                    key.startsWith("attachment_"),
                  ) && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Some attachments have issues:
                        <ul className="list-disc list-inside mt-1">
                          {Object.entries(validationErrors)
                            .filter(([key]) => key.startsWith("attachment_"))
                            .map(([key, error]) => (
                              <li key={key} className="text-sm">
                                {error}
                              </li>
                            ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
>>>>>>> origin/main
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {currentStep === 4 && (
              <div className="space-y-6">
<<<<<<< HEAD
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Review Your Complaint
                </h3>

                <div className="space-y-4">
                  {/* Personal Information */}
                  <div className="p-4 bg-gray-50 rounded-lg" data-testid="review-personal-info">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Personal Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="font-medium">Name:</span> {formData.fullName}
                      </div>
                      <div>
                        <span className="font-medium">Email:</span> {formData.email}
                      </div>
                      <div>
                        <span className="font-medium">Phone:</span> {formData.phoneNumber}
                      </div>
                    </div>
                  </div>

                  {/* Complaint Details */}
                  <div className="p-4 bg-gray-50 rounded-lg" data-testid="review-complaint-details">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Complaint Details
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <span className="font-medium">Type:</span> {COMPLAINT_TYPES.find(t => t.value === formData.type)?.label}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Priority:</span>
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${PRIORITIES.find(p => p.value === formData.priority)?.color}`} />
                            {PRIORITIES.find(p => p.value === formData.priority)?.label}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">Description:</span>
                        <p className="mt-1 text-gray-700">{formData.description}</p>
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="p-4 bg-gray-50 rounded-lg" data-testid="review-location">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Location
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="font-medium">Ward:</span> {WARDS.find(w => w.id === formData.wardId)?.name}
                      </div>
                      <div>
                        <span className="font-medium">Sub-Zone:</span> {SUB_ZONES.find(sz => sz.id === formData.subZoneId)?.name}
                      </div>
                      <div>
                        <span className="font-medium">Area:</span> {formData.area}
                      </div>
                      {formData.landmark && (
                        <div>
                          <span className="font-medium">Landmark:</span> {formData.landmark}
                        </div>
                      )}
                      {formData.address && (
                        <div className="md:col-span-2">
                          <span className="font-medium">Address:</span> {formData.address}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Attachments */}
                  {attachmentPreviews.length > 0 && (
                    <div className="p-4 bg-gray-50 rounded-lg" data-testid="review-attachments">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Attachments ({attachmentPreviews.length})
                      </h4>
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                        {attachmentPreviews.map((preview, index) => (
                          <div key={index} className="aspect-square rounded-lg overflow-hidden border">
                            <img
                              src={preview.previewUrl}
                              alt={`Attachment ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <Alert className="border-blue-200 bg-blue-50">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-blue-700">
                    Please review all information carefully. After submission, you'll receive an OTP via email for verification.
                  </AlertDescription>
                </Alert>
=======
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Review Your Complaint
                  </h3>

                  <p className="text-sm text-gray-600">
                    Please review all information before submitting. You can go
                    back to make changes if needed.
                  </p>

                  {/* Personal Information Review */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Personal Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Name:</span>{" "}
                          {formData.fullName}
                        </div>
                        <div>
                          <span className="font-medium">Email:</span>{" "}
                          {formData.email}
                        </div>
                        <div>
                          <span className="font-medium">Phone:</span>{" "}
                          {formData.phoneNumber}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Complaint Information Review */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Complaint Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Type:</span>{" "}
                          {
                            COMPLAINT_TYPES.find(
                              (t) => t.value === formData.type,
                            )?.label
                          }
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Priority:</span>
                          <Badge
                            variant="secondary"
                            className={`${
                              PRIORITIES.find(
                                (p) => p.value === formData.priority,
                              )?.color
                            } text-white`}
                          >
                            {
                              PRIORITIES.find(
                                (p) => p.value === formData.priority,
                              )?.label
                            }
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-3">
                        <span className="font-medium">Description:</span>
                        <p className="mt-1 text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                          {formData.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Location Information Review */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Location Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Ward:</span>{" "}
                          {WARDS.find((w) => w.id === formData.wardId)?.name}
                        </div>
                        {formData.subZoneId && (
                          <div>
                            <span className="font-medium">Sub-Zone:</span>{" "}
                            {formData.subZoneId}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Area:</span>{" "}
                          {formData.area}
                        </div>
                        {formData.landmark && (
                          <div>
                            <span className="font-medium">Landmark:</span>{" "}
                            {formData.landmark}
                          </div>
                        )}
                      </div>
                      {formData.address && (
                        <div className="mt-3">
                          <span className="font-medium">Address:</span>
                          <p className="mt-1 text-sm text-gray-600">
                            {formData.address}
                          </p>
                        </div>
                      )}
                      {formData.coordinates && (
                        <div className="mt-3 p-2 bg-green-50 rounded-md">
                          <span className="text-sm text-green-700">
                            📍 GPS coordinates will be included
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Attachments Review */}
                  {formData.attachments && formData.attachments.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <FileImage className="h-4 w-4" />
                          Attachments ({formData.attachments.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {formData.attachments.map((attachment) => (
                            <div key={attachment.id} className="space-y-1">
                              <div className="aspect-square bg-gray-100 rounded-md overflow-hidden">
                                {attachment.preview && (
                                  <img
                                    src={attachment.preview}
                                    alt={attachment.file.name}
                                    className="w-full h-full object-cover cursor-pointer hover:opacity-75 transition-opacity"
                                    onClick={() =>
                                      handlePreviewImage(attachment.preview!)
                                    }
                                  />
                                )}
                              </div>
                              <p className="text-xs text-gray-600 truncate">
                                {attachment.file.name}
                              </p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}

            {/* Step 5: Submit */}
            {currentStep === 5 && (
              <div className="space-y-6 text-center">
                <div className="space-y-4">
                  <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
                  <h3 className="text-2xl font-bold text-gray-900">
                    Ready to Submit
                  </h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Your complaint is ready for submission. After submitting,
                    you'll receive an email with a verification code.
                  </p>
                </div>

                {/* What happens next */}
                <Card className="text-left">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      What happens next?
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium">
                          1
                        </span>
                        Your complaint will be registered immediately
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium">
                          2
                        </span>
                        You'll receive an OTP via email for verification
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium">
                          3
                        </span>
                        After verification, you'll be registered as a citizen
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium">
                          4
                        </span>
                        You can then track your complaint progress
                      </li>
                    </ol>
                  </CardContent>
                </Card>
>>>>>>> origin/main
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-4 pt-6">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
<<<<<<< HEAD
                  onClick={prevStep}
=======
                  onClick={handlePrev}
>>>>>>> origin/main
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>
              )}

<<<<<<< HEAD
              {currentStep < 4 ? (
                <Button
                  type="button"
                  onClick={nextStep}
=======
              {currentStep < 5 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!canProceed}
>>>>>>> origin/main
                  className="flex-1"
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
<<<<<<< HEAD
                  onClick={handleComplaintSubmit}
                  disabled={isSubmitting}
=======
                  onClick={handleSubmit}
                  disabled={isSubmitting || !canProceed}
>>>>>>> origin/main
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Complaint
                      <CheckCircle className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
<<<<<<< HEAD

              {currentStep === 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/")}
                  className="flex-1"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Button>
              )}
            </div>

            {/* Additional Info */}
            {currentStep === 1 && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">
                  What happens next?
                </h4>
                <ol className="text-sm text-gray-600 space-y-1">
                  <li>1. Your complaint will be registered immediately</li>
                  <li>2. You'll receive an OTP via email for verification</li>
                  <li>3. After verification, you'll be registered as a citizen</li>
                  <li>4. You can then track your complaint progress</li>
                </ol>

                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600">
                    Already have an account?{" "}
                    <button
                      onClick={goToLogin}
                      className="text-blue-600 hover:underline"
                    >
                      Login here
                    </button>
                  </p>
                </div>
              </div>
            )}
=======

              {currentStep === 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/")}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              )}
            </div>

            {/* Login link */}
            <div className="text-center pt-4 border-t">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <button
                  onClick={() => navigate("/login")}
                  className="text-blue-600 hover:underline font-medium"
                >
                  Login here
                </button>
              </p>
            </div>
>>>>>>> origin/main
          </CardContent>
        </Card>

        {/* Image Preview Dialog */}
        <Dialog
          open={imagePreview.show}
          onOpenChange={(open) => dispatch(setImagePreview({ show: open }))}
        >
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Image Preview</DialogTitle>
              <DialogDescription>Preview of uploaded image</DialogDescription>
            </DialogHeader>
            {imagePreview.url && (
              <div className="flex justify-center">
                <img
                  src={imagePreview.url}
                  alt="Preview"
                  className="max-w-full max-h-96 object-contain rounded-lg"
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default GuestComplaintForm;
